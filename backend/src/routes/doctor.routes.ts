import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';
import prisma from '../config/database';

const router = Router();

// Validation middleware
const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array(),
    });
  }
  next();
};

// @route   GET /api/doctors
// @desc    Get all doctors (for patient app)
// @access  Public
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.tenantId || (req.query.hospitalId as string);
    const { department, date } = req.query;

    const whereClause: any = {
      hospitalId,
      role: 'DOCTOR',
      isActive: true,
    };

    if (department) {
      whereClause.specialty = department;
    }

    const doctors = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        qualifications: true,
        specialty: true,
        consultationFee: true,
        availableDays: true,
        availableHours: true,
        roomNumber: true,
        bio: true,
        hospital: {
          select: {
            name: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: doctors,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/doctors/dashboard-stats
// @desc    Get doctor dashboard statistics
// @access  Private (Doctor)
router.get('/dashboard-stats', authenticate, authorize('DOCTOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.user!.id;
    
    // Create date in IST (India Standard Time) to match the user's timezone
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(now.getTime() + istOffset);
    const today = new Date(istDate.toISOString().split('T')[0] + 'T00:00:00.000Z');
    const currentTimeIST = istDate.toTimeString().slice(0, 5);
    
    console.log('[Doctor Dashboard] Doctor ID:', doctorId);
    console.log('[Doctor Dashboard] Current UTC time:', now.toISOString());
    console.log('[Doctor Dashboard] Today date (for query):', today.toISOString());
    console.log('[Doctor Dashboard] Current time IST:', currentTimeIST);

    // Total Patients = ALL appointments (all time, excluding cancelled)
    const totalAppointments = await prisma.appointment.count({
      where: {
        doctorId,
        status: { not: 'CANCELLED' },
      },
    });

    // Completed = ALL appointments with COMPLETED status (all time)
    const completedCount = await prisma.appointment.count({
      where: {
        doctorId,
        status: 'COMPLETED',
      },
    });

    // Unattended = Missed appointments (past date/time but not completed, excluding cancelled)
    // A missed appointment is one where:
    // - The appointment date has passed, OR
    // - It's today but the time has passed
    // - AND it's not COMPLETED or CANCELLED
    const unattendedCount = await prisma.appointment.count({
      where: {
        doctorId,
        status: { in: ['SCHEDULED', 'CONFIRMED', 'PENDING_APPROVAL', 'NO_SHOW'] },
        OR: [
          // Past dates (before today)
          {
            appointmentDate: { lt: today },
          },
          // Today but time has passed
          {
            appointmentDate: today,
            startTime: { lt: currentTimeIST },
          },
        ],
      },
    });

    // Remaining = Upcoming appointments (future date/time, not completed)
    // These are appointments that are either:
    // - Today with time >= current time, OR
    // - Future dates
    // AND status is not COMPLETED, CANCELLED, or NO_SHOW
    const remainingCount = await prisma.appointment.count({
      where: {
        doctorId,
        status: { in: ['SCHEDULED', 'CONFIRMED', 'PENDING_APPROVAL', 'IN_PROGRESS'] },
        OR: [
          // Today's appointments with time >= current time
          {
            appointmentDate: today,
            startTime: { gte: currentTimeIST },
          },
          // Future dates
          {
            appointmentDate: { gt: today },
          },
        ],
      },
    });

    // Get pending lab reviews
    const pendingLabReviews = await prisma.labOrder.count({
      where: {
        doctorId,
        status: 'completed',
        items: {
          some: {
            interpretation: 'critical',
          },
        },
      },
    });

    // Get next appointment - filter by current time in IST
    const nextAppointment = await prisma.appointment.findFirst({
      where: {
        doctorId,
        status: { in: ['SCHEDULED', 'CONFIRMED'] },
        OR: [
          // Today's appointments with time >= current time
          {
            appointmentDate: today,
            startTime: { gte: currentTimeIST },
          },
          // Future dates
          {
            appointmentDate: { gt: today },
          },
        ],
      },
      orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true
          },
        },
      },
    });

    console.log('[Doctor Dashboard] Stats:', {
      todayTotal: totalAppointments,
      completed: completedCount,
      remaining: remainingCount,
      unattended: unattendedCount,
    });

    res.json({
      success: true,
      data: {
        todayTotal: totalAppointments,
        completed: completedCount,
        remaining: remainingCount,
        unattended: unattendedCount,
        criticalAlerts: unattendedCount, // Alias for compatibility
        pendingLabReviews,
        nextAppointment: nextAppointment
          ? {
              id: nextAppointment.id,
              time: nextAppointment.startTime,
              patientName: `${nextAppointment.patient.firstName} ${nextAppointment.patient.lastName}`,
              type: nextAppointment.type,
            }
          : null
      },
    });
  } catch (error) {
    console.error('[Doctor Dashboard] Error:', error);
    next(error);
  }
});

// @route   GET /api/doctors/schedule
// @desc    Get doctor's schedule
// @access  Private (Doctor)
router.get('/schedule', authenticate, authorize('DOCTOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.user!.id;
    const { date, view = 'day' } = req.query;

    let startDate = new Date();
    let endDate = new Date();

    if (date) {
      startDate = new Date(date as string);
      endDate = new Date(date as string);
    }

    if (view === 'week') {
      endDate.setDate(endDate.getDate() + 7);
    } else if (view === 'month') {
      endDate.setMonth(endDate.getMonth() + 1);
    }

    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true
          },
        },
      },
      orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
    });

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/doctors/queue
// @desc    Get doctor's patient queue with optional date filter
// @access  Private (Doctor)
router.get('/queue', authenticate, authorize('DOCTOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.user!.id;
    const { date } = req.query;
    
    // Create date in IST (India Standard Time) to match the user's timezone
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(now.getTime() + istOffset);
    const today = new Date(istDate.toISOString().split('T')[0] + 'T00:00:00.000Z');
    
    console.log('[Doctor Queue] Doctor ID:', doctorId);
    console.log('[Doctor Queue] Filter date:', date || 'today');
    console.log('[Doctor Queue] Today date (for query):', today.toISOString());
    
    let filterDate = today;
    // If date is provided, parse it and create a date in UTC
    if (date) {
      const parsedDate = new Date(date + 'T00:00:00.000Z');
      filterDate = parsedDate;
    }

    // Get appointments for the specified date
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: filterDate,
        status: { not: 'CANCELLED' },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            bloodGroup: true,
            allergies: true,
            preExistingConditions: true,
            weight: true,
          },
        },
        queueEntry: true,
        vitals: {
          include: {
            nurse: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
      orderBy: [{ startTime: 'asc' }],
    });

    console.log('[Doctor Queue] Found appointments:', appointments.length);
    if (appointments.length > 0) {
      console.log('[Doctor Queue] Sample appointment:', {
        id: appointments[0].id,
        patientName: `${appointments[0].patient.firstName} ${appointments[0].patient.lastName}`,
        appointmentDate: appointments[0].appointmentDate,
        startTime: appointments[0].startTime,
        status: appointments[0].status,
        queueEntry: appointments[0].queueEntry,
      });
    }

    // Format the queue data
    const queueData = appointments.map((apt) => {
      const waitTime = apt.queueEntry
        ? Math.floor((new Date().getTime() - apt.queueEntry.createdAt.getTime()) / (1000 * 60))
        : 0;

      // Vitals is a single object (one-to-one relation with appointment)
      const v = apt.vitals;

      return {
        id: apt.queueEntry?.id || apt.id,
        queueNumber: apt.queueEntry?.queueNumber || apt.tokenNumber || 0,
        patientId: apt.patient.id,
        appointmentId: apt.id,
        appointmentTime: apt.startTime,
        appointmentDate: apt.appointmentDate,
        status: apt.queueEntry?.status || apt.status,
        waitTime: `${waitTime} min`,
        chiefComplaint: apt.chiefComplaint || '',
        patient: {
          id: apt.patient.id,
          firstName: apt.patient.firstName,
          lastName: apt.patient.lastName,
          phone: apt.patient.phone,
          dateOfBirth: apt.patient.dateOfBirth,
          gender: apt.patient.gender,
          bloodGroup: apt.patient.bloodGroup,
          allergies: apt.patient.allergies,
          medicalHistory: apt.patient.preExistingConditions,
          weight: apt.patient.weight,
        },
        // Include nurse-recorded vitals
        vitals: v ? {
          id: v.id,
          temperature: v.temperature,
          bloodPressureSystolic: v.bloodPressureSystolic,
          bloodPressureDiastolic: v.bloodPressureDiastolic,
          heartRate: v.heartRate,
          respiratoryRate: v.respiratoryRate,
          oxygenSaturation: v.oxygenSaturation,
          weight: v.weight,
          height: v.height,
          notes: v.notes,
          recordedAt: v.recordedAt,
          recordedBy: v.nurse ? {
            id: v.nurse.id,
            name: `${v.nurse.firstName} ${v.nurse.lastName}`,
          } : null,
        } : null,
      };
    });

    console.log('[Doctor Queue] Returning queue data:', queueData.length);
    
    res.json({
      success: true,
      data: { queue: queueData },
    });
  } catch (error) {
    console.error('[Doctor Queue] Error:', error);
    next(error);
  }
});

// @route   GET /api/doctors/appointments/upcoming
// @desc    Get doctor's upcoming appointments - filtered by current time for today
// @access  Private (Doctor)
router.get('/appointments/upcoming', authenticate, authorize('DOCTOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctorId = req.user!.id;
    
    // Create date in IST (India Standard Time) to match the user's timezone
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000; // IST is UTC+5:30
    const istDate = new Date(now.getTime() + istOffset);
    const today = new Date(istDate.toISOString().split('T')[0] + 'T00:00:00.000Z');
    const currentTimeIST = istDate.toTimeString().slice(0, 5);

    console.log('[Doctor Portal] Fetching upcoming appointments for doctor:', doctorId);
    console.log('[Doctor Portal] Today:', today.toISOString(), 'Current time IST:', currentTimeIST);

    // Get appointments for today with time >= current time, plus future dates
    const appointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        status: { in: ['PENDING_APPROVAL', 'SCHEDULED', 'CONFIRMED'] },
        OR: [
          // Today's appointments with time >= current time
          {
            appointmentDate: today,
            startTime: { gte: currentTimeIST },
          },
          // Future dates
          {
            appointmentDate: { gt: today },
          },
        ],
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            dateOfBirth: true,
            gender: true,
            weight: true,
            bloodGroup: true,
            address: true,
          },
        },
      },
      orderBy: [{ appointmentDate: 'asc' }, { startTime: 'asc' }],
      take: 10, // Limit to 10 upcoming appointments for dashboard
    });

    console.log('[Doctor Portal] Found appointments:', appointments.length);

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error('[Doctor Portal] Error fetching appointments:', error);
    next(error);
  }
});

// @route   GET /api/doctors/time-offs
// @desc    Get doctor time-offs
// @access  Private (Doctor)
router.get('/time-offs', authenticate, authorize('DOCTOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const timeOffs = await prisma.doctorTimeOff.findMany({
      where: {
        doctorId: req.user!.id,
        endDate: { gte: new Date() },
      },
      orderBy: { startDate: 'asc' },
    });

    res.json({
      success: true,
      data: timeOffs,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/doctors/time-offs
// @desc    Add doctor time-off and notify affected patients
// @access  Private (Doctor)
router.post(
  '/time-offs',
  authenticate,
  authorize('DOCTOR'),
  [
    body('startDate').isISO8601().withMessage('Valid start date is required'),
    body('endDate').isISO8601().withMessage('Valid end date is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctorId = req.user!.id;
      const hospitalId = req.user!.hospitalId;
      const { startDate, endDate, reason, isRecurring, recurrencePattern } = req.body;

      // Get doctor info for notifications
      const doctor = await prisma.user.findUnique({
        where: { id: doctorId },
        select: { firstName: true, lastName: true },
      });

      const timeOff = await prisma.doctorTimeOff.create({
        data: {
          id: undefined,
          hospitalId,
          doctorId,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          reason,
          isRecurring: isRecurring || false,
          recurrencePattern,
        },
      });

      // Find all affected appointments within the time-off period
      const affectedAppointments = await prisma.appointment.findMany({
        where: {
          doctorId,
          hospitalId,
          status: {
            in: ['PENDING_APPROVAL', 'SCHEDULED', 'CONFIRMED'],
          },
          appointmentDate: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            },
          },
          doctor: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      const doctorName = affectedAppointments.length > 0
        ? `Dr. ${affectedAppointments[0].doctor.firstName} ${affectedAppointments[0].doctor.lastName}`
        : doctor ? `Dr. ${doctor.firstName} ${doctor.lastName}` : 'Your doctor';

      // Create notifications for all affected patients
      const notificationPromises = affectedAppointments.map((appointment) => {
        const formattedDate = appointment.appointmentDate.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        });

        return prisma.notification.create({
          data: {
            id: undefined,
            hospitalId,
            patientId: appointment.patientId,
            type: 'APPOINTMENT',
            title: 'Doctor Unavailable',
            message: `${doctorName} is unavailable on ${formattedDate}. Your appointment at ${appointment.startTime} has been affected. ${reason ? `Reason: ${reason}` : ''}`,
            data: JSON.stringify({
              type: 'DOCTOR_UNAVAILABLE',
              appointmentId: appointment.id,
              doctorId,
              doctorName,
              appointmentDate: appointment.appointmentDate.toISOString(),
              appointmentTime: appointment.startTime,
              reason: reason || null,
            }),
            isRead: false,
          },
        });
      });

      await Promise.all(notificationPromises);

      console.log(`[Doctor Schedule] Time-off created for ${doctorName} from ${startDate} to ${endDate}`);
      console.log(`[Doctor Schedule] Created ${affectedAppointments.length} notifications for affected patients`);

      res.status(201).json({
        success: true,
        message: 'Time-off added successfully',
        data: timeOff,
        affectedAppointments: affectedAppointments.length,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/doctors/time-offs/:id
// @desc    Remove doctor time-off (restore availability)
// @access  Private (Doctor)
router.delete('/time-offs/:id', authenticate, authorize('DOCTOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const doctorId = req.user!.id;

    // Verify the time-off belongs to this doctor
    const timeOff = await prisma.doctorTimeOff.findFirst({
      where: {
        id,
        doctorId,
      },
    });

    if (!timeOff) {
      throw ApiError.notFound('Time-off not found', 'TIME_OFF_NOT_FOUND');
    }

    // Delete the time-off
    await prisma.doctorTimeOff.delete({
      where: { id },
    });

    console.log(`[Doctor Schedule] Time-off removed for doctor ${doctorId}, date: ${timeOff.startDate}`);

    res.json({
      success: true,
      message: 'Time-off removed successfully. You are now available on this date.',
      data: { id, removedDate: timeOff.startDate },
    });
  } catch (error) {
    console.error('[Doctor Schedule] Error removing time-off:', error);
    next(error);
  }
});

// @route   GET /api/doctors/:id
// @desc    Get doctor by ID
// @access  Public
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.tenantId || (req.query.hospitalId as string);

    const doctor = await prisma.user.findFirst({
      where: {
        id: req.params.id,
        hospitalId,
        role: 'DOCTOR',
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        qualifications: true,
        specialty: true,
        consultationFee: true,
        payoutPercentage: true,
        availableDays: true,
        availableHours: true,
        roomNumber: true,
        bio: true,
        hospital: {
          select: {
            name: true,
            address: true
          },
        },
      },
    });

    if (!doctor) {
      throw ApiError.notFound('Doctor not found', 'DOCTOR_NOT_FOUND');
    }

    res.json({
      success: true,
      data: doctor,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/doctors/:id/slots
// @desc    Get available slots for a doctor on a specific date
// @access  Public
router.get('/:id/slots', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date } = req.query;
    const doctorId = req.params.id;
    const hospitalId = req.tenantId || (req.query.hospitalId as string);

    if (!date) {
      throw ApiError.badRequest('Date is required', 'DATE_REQUIRED');
    }

    // Get doctor's available hours
    const doctor = await prisma.user.findFirst({
      where: { id: doctorId, hospitalId, role: 'DOCTOR' },
      select: { availableHours: true, availableDays: true },
    });

    if (!doctor) {
      throw ApiError.notFound('Doctor not found', 'DOCTOR_NOT_FOUND');
    }

    // Check if doctor is available on this day
    const requestedDate = new Date(date as string);
    const dayOfWeek = requestedDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    
    const availableDays = doctor.availableDays ? JSON.parse(doctor.availableDays) : [];
    if (!availableDays.includes(dayOfWeek)) {
      return res.json({
        success: true,
        data: {
          date,
          doctorId,
          slots: [],
          message: 'Doctor is not available on this day',
        },
      });
    }

    // Check if doctor has marked this date as unavailable (time-off)
    const timeOff = await prisma.doctorTimeOff.findFirst({
      where: {
        doctorId,
        startDate: { lte: requestedDate },
        endDate: { gte: requestedDate },
      },
    });

    if (timeOff) {
      return res.json({
        success: true,
        data: {
          date,
          doctorId,
          slots: [],
          message: 'Doctor is unavailable on this date',
          reason: timeOff.reason,
        },
      });
    }

    // Get booked appointments
    const bookedAppointments = await prisma.appointment.findMany({
      where: {
        doctorId,
        appointmentDate: requestedDate,
        status: { not: 'CANCELLED' },
      },
      select: { startTime: true },
    });

    const bookedSlots = bookedAppointments.map((a) => a.startTime);

    // Generate available slots (15-minute intervals)
    const availableHours = doctor.availableHours ? JSON.parse(doctor.availableHours) : { morning: { start: '09:00', end: '13:00' }, evening: { start: '14:00', end: '20:00' } };
    const slots: { slot: string; isAvailable: boolean }[] = [];
    
    // Helper function to generate slots for a time range
    const generateSlotsForRange = (start: string, end: string) => {
      let currentTime = start;
      while (currentTime < end) {
        const isBooked = bookedSlots.includes(currentTime);
        slots.push({
          slot: currentTime,
          isAvailable: !isBooked,
        });

        // Increment by 15 minutes
        const [hours, minutes] = currentTime.split(':').map(Number);
        const newMinutes = minutes + 15;
        const newHours = hours + Math.floor(newMinutes / 60);
        currentTime = `${String(newHours).padStart(2, '0')}:${String(newMinutes % 60).padStart(2, '0')}`;
      }
    };

    // Generate slots for morning and evening sessions
    if (availableHours.morning) {
      generateSlotsForRange(availableHours.morning.start, availableHours.morning.end);
    }
    if (availableHours.evening) {
      generateSlotsForRange(availableHours.evening.start, availableHours.evening.end);
    }

    res.json({
      success: true,
      data: {
        doctor: {
          id: doctorId,
        },
        date,
        slots,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/doctors/appointments/:id
// @desc    Get appointment details by ID for doctor
// @access  Private (Doctor)
router.get('/appointments/:id', authenticate, authorize('DOCTOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const doctorId = req.user!.id;

    const appointment = await prisma.appointment.findFirst({
      where: {
        id,
        doctorId,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            dateOfBirth: true,
            gender: true,
            bloodGroup: true,
            address: true,
            city: true,
            state: true,
            pincode: true,
            emergencyContact: true,
            emergencyPhone: true,
            preExistingConditions: true,
            allergies: true,
          },
        },
        vitals: true,
        consultation: true,
      },
    });

    if (!appointment) {
      throw ApiError.notFound('Appointment not found', 'APPOINTMENT_NOT_FOUND');
    }

    res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/doctors/appointments/:id/accept
// @desc    Accept an appointment
// @access  Private (Doctor)
router.put('/appointments/:id/accept', authenticate, authorize('DOCTOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const doctorId = req.user!.id;

    const appointment = await prisma.appointment.findFirst({
      where: { id, doctorId },
      include: {
        doctor: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    if (!appointment) {
      throw ApiError.notFound('Appointment not found', 'APPOINTMENT_NOT_FOUND');
    }

    if (appointment.status !== 'PENDING_APPROVAL' && appointment.status !== 'SCHEDULED') {
      throw ApiError.badRequest('Only pending or scheduled appointments can be accepted', 'INVALID_STATUS');
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'CONFIRMED' },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
            gender: true,
            weight: true,
          },
        },
      },
    });

    // Create notification for the patient
    await prisma.notification.create({
      data: {
        id: undefined,
        hospitalId: req.user!.hospitalId,
        patientId: appointment.patientId,
        type: 'APPOINTMENT',
        title: 'Appointment Confirmed',
        message: `Your appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} on ${appointment.appointmentDate.toLocaleDateString()} at ${appointment.startTime} has been confirmed.`,
        data: JSON.stringify({
          appointmentId: id,
          type: 'APPOINTMENT_CONFIRMED',
        }),
        isRead: false,
      },
    });

    res.json({
      success: true,
      message: 'Appointment accepted successfully',
      data: updatedAppointment,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/doctors/appointments/:id/reject
// @desc    Reject an appointment
// @access  Private (Doctor)
router.put(
  '/appointments/:id/reject',
  authenticate,
  authorize('DOCTOR'),
  [
    body('reason').notEmpty().withMessage('Rejection reason is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const doctorId = req.user!.id;

      const appointment = await prisma.appointment.findFirst({
        where: { id, doctorId },
        include: {
          doctor: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      if (!appointment) {
        throw ApiError.notFound('Appointment not found', 'APPOINTMENT_NOT_FOUND');
      }

      if (appointment.status === 'CANCELLED') {
        throw ApiError.badRequest('Appointment is already cancelled', 'ALREADY_CANCELLED');
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledReason: reason,
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      });

      // Update queue entry if exists
      await prisma.queueEntry.updateMany({
        where: { appointmentId: id },
        data: { status: 'CANCELLED' },
      });

      // Create notification for the patient
      await prisma.notification.create({
        data: {
          id: undefined,
          hospitalId: req.user!.hospitalId,
          patientId: appointment.patientId,
          type: 'APPOINTMENT',
          title: 'Appointment Rejected',
          message: `Your appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} on ${appointment.appointmentDate.toLocaleDateString()} at ${appointment.startTime} has been rejected. Reason: ${reason}`,
          data: JSON.stringify({
            appointmentId: id,
            type: 'APPOINTMENT_REJECTED',
            reason,
          }),
          isRead: false,
        },
      });

      res.json({
        success: true,
        message: 'Appointment rejected successfully',
        data: updatedAppointment,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/doctors/appointments/:id/reschedule
// @desc    Reschedule an appointment (doctor initiated)
// @access  Private (Doctor)
router.put(
  '/appointments/:id/reschedule',
  authenticate,
  authorize('DOCTOR'),
  [
    body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required'),
    body('reason').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { appointmentDate, startTime, reason } = req.body;
      const doctorId = req.user!.id;

      const appointment = await prisma.appointment.findFirst({
        where: { id, doctorId },
        include: {
          doctor: {
            select: { firstName: true, lastName: true },
          },
        },
      });

      if (!appointment) {
        throw ApiError.notFound('Appointment not found', 'APPOINTMENT_NOT_FOUND');
      }

      if (appointment.status === 'CANCELLED') {
        throw ApiError.badRequest('Cannot reschedule a cancelled appointment', 'INVALID_STATUS');
      }

      // Check if new slot is available
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          doctorId,
          appointmentDate: new Date(appointmentDate),
          startTime,
          status: { not: 'CANCELLED' },
          id: { not: id },
        },
      });

      if (existingAppointment) {
        throw ApiError.conflict('This slot is already booked', 'SLOT_UNAVAILABLE');
      }

      const updatedAppointment = await prisma.appointment.update({
        where: { id },
        data: {
          appointmentDate: new Date(appointmentDate),
          startTime,
          status: 'SCHEDULED',
        },
        include: {
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
        },
      });

      // Create notification for the patient
      await prisma.notification.create({
        data: {
          id: undefined,
          hospitalId: req.user!.hospitalId,
          patientId: appointment.patientId,
          type: 'APPOINTMENT',
          title: 'Appointment Rescheduled',
          message: `Your appointment with Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName} has been rescheduled to ${new Date(appointmentDate).toLocaleDateString()} at ${startTime}.${reason ? ` Reason: ${reason}` : ''}`,
          data: JSON.stringify({
            appointmentId: id,
            type: 'APPOINTMENT_RESCHEDULED',
            newDate: appointmentDate,
            newTime: startTime,
            reason,
          }),
          isRead: false,
        },
      });

      res.json({
        success: true,
        message: 'Appointment rescheduled successfully',
        data: updatedAppointment
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/doctors/appointments/:id/start
// @desc    Start consultation (mark appointment as IN_PROGRESS)
// @access  Private (Doctor)
router.put('/appointments/:id/start', authenticate, authorize('DOCTOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const doctorId = req.user!.id;

    const appointment = await prisma.appointment.findFirst({
      where: { id, doctorId },
    });

    if (!appointment) {
      throw ApiError.notFound('Appointment not found', 'APPOINTMENT_NOT_FOUND');
    }

    // Update appointment status
    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: { status: 'IN_PROGRESS' },
    });

    // Update queue entry if exists
    await prisma.queueEntry.updateMany({
      where: { appointmentId: id },
      data: { 
        status: 'WITH_DOCTOR',
        doctorStartedAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Consultation started',
      data: updatedAppointment,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/doctors/consultation
// @desc    Save consultation and prescription
// @access  Private (Doctor)
router.post(
  '/consultation',
  authenticate,
  authorize('DOCTOR'),
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('appointmentId').notEmpty().withMessage('Appointment ID is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const doctorId = req.user!.id;
      const hospitalId = req.user!.hospitalId;
      const {
        patientId,
        appointmentId,
        vitals,
        chiefComplaint,
        symptoms,
        diagnosis,
        clinicalObservations,
        doctorNotes,
        labTestsRecommended,
        followUpDate,
        additionalRemarks,
        medicines,
        status,
      } = req.body;

      console.log('[Consultation] Incoming request body:', JSON.stringify(req.body, null, 2));
      console.log('[Consultation] Saving consultation for appointment:', appointmentId);
      console.log('[Consultation] Doctor ID:', doctorId);
      console.log('[Consultation] Patient ID:', patientId);
      console.log('[Consultation] Hospital ID:', hospitalId);
      console.log('[Consultation] Status:', status);

      // Validate required fields
      if (!patientId) {
        return res.status(400).json({
          success: false,
          message: 'Patient ID is required',
          error: 'MISSING_PATIENT_ID',
        });
      }
      if (!appointmentId) {
        return res.status(400).json({
          success: false,
          message: 'Appointment ID is required',
          error: 'MISSING_APPOINTMENT_ID',
        });
      }
      if (!hospitalId) {
        return res.status(400).json({
          success: false,
          message: 'Hospital ID is missing from user context',
          error: 'MISSING_HOSPITAL_ID',
        });
      }

      // Verify appointment belongs to this doctor
      const appointment = await prisma.appointment.findFirst({
        where: { id: appointmentId, doctorId },
      });

      if (!appointment) {
        console.log('[Consultation] Appointment not found for id:', appointmentId, 'doctorId:', doctorId);
        return res.status(404).json({
          success: false,
          message: 'Appointment not found or does not belong to this doctor',
          error: 'APPOINTMENT_NOT_FOUND',
        });
      }

      console.log('[Consultation] Found appointment:', appointment.id);

      // Use transaction for data integrity
      const result = await prisma.$transaction(async (tx) => {
        // Check if consultation already exists for this appointment
        const existingConsultation = await tx.consultation.findUnique({
          where: { appointmentId },
        });

        let consultation;
        if (existingConsultation) {
          // Update existing consultation
          consultation = await tx.consultation.update({
            where: { appointmentId },
            data: {
              chiefComplaint: chiefComplaint || null,
              presentIllnessHistory: symptoms || null,
              examinationFindings: clinicalObservations || null,
              provisionalDiagnosis: diagnosis || null,
              advice: doctorNotes || null,
              followUpDate: followUpDate ? new Date(followUpDate) : null,
            },
          });
          console.log('[Consultation] Updated existing consultation:', consultation.id);
        } else {
          // Create new consultation
          consultation = await tx.consultation.create({
            data: {
              hospitalId,
              patientId,
              appointmentId,
              doctorId,
              chiefComplaint: chiefComplaint || null,
              presentIllnessHistory: symptoms || null,
              examinationFindings: clinicalObservations || null,
              provisionalDiagnosis: diagnosis || null,
              advice: doctorNotes || null,
              followUpDate: followUpDate ? new Date(followUpDate) : null,
            },
          });
          console.log('[Consultation] Created new consultation:', consultation.id);
        }

        // Create prescription if medicines provided
        if (medicines && Array.isArray(medicines) && medicines.length > 0) {
          console.log('[Consultation] Processing medicines:', medicines.length);

          // Generate prescription number
          const prescriptionCount = await tx.prescription.count({
            where: { hospitalId },
          });
          const prescriptionNumber = `PRX-${String(prescriptionCount + 1).padStart(6, '0')}`;

          // Delete existing prescription items if any
          const existingPrescription = await tx.prescription.findFirst({
            where: { consultationId: consultation.id },
          });

          if (existingPrescription) {
            await tx.prescriptionItem.deleteMany({
              where: { prescriptionId: existingPrescription.id },
            });
            await tx.prescription.delete({
              where: { id: existingPrescription.id },
            });
            console.log('[Consultation] Deleted existing prescription:', existingPrescription.id);
          }

          // Create new prescription
          const prescription = await tx.prescription.create({
            data: {
              hospitalId,
              patientId,
              consultationId: consultation.id,
              doctorId,
              prescriptionNumber,
              notes: additionalRemarks || null,
              status: 'pending',
            },
          });

          console.log('[Consultation] Prescription created:', prescription.id);

          // Create prescription items
          for (const med of medicines) {
            if (!med.name) {
              console.log('[Consultation] Skipping medicine without name');
              continue;
            }

            // Find or create medicine
            let medicine = await tx.medicine.findFirst({
              where: {
                hospitalId,
                name: med.name,
              },
            });

            if (!medicine) {
              // Create a basic medicine record
              medicine = await tx.medicine.create({
                data: {
                  hospitalId,
                  name: med.name,
                  category: 'tablet',
                  unit: 'tablet',
                  price: 0,
                },
              });
              console.log('[Consultation] Created medicine:', medicine.id);
            }

            await tx.prescriptionItem.create({
              data: {
                prescriptionId: prescription.id,
                medicineId: medicine.id,
                dosage: med.dosage || '',
                frequency: med.frequency || '',
                durationDays: parseInt(med.duration) || 0,
                quantity: parseInt(med.duration) || 0,
                instructions: med.instructions || '',
              },
            });
          }

          console.log('[Consultation] Prescription items created:', medicines.length);
        }

        // Create lab orders if recommended
        if (labTestsRecommended && Array.isArray(labTestsRecommended) && labTestsRecommended.length > 0) {
          console.log('[Consultation] Processing lab tests:', labTestsRecommended.length);

          // Generate order number
          const labOrderCount = await tx.labOrder.count({
            where: { hospitalId },
          });
          const orderNumber = `LAB-${String(labOrderCount + 1).padStart(6, '0')}`;

          const labOrder = await tx.labOrder.create({
            data: {
              hospitalId,
              patientId,
              consultationId: consultation.id,
              doctorId,
              orderNumber,
              status: 'ordered',
              priority: 'normal',
            },
          });

          // Create lab order items
          for (const testId of labTestsRecommended) {
            const test = await tx.labTest.findUnique({
              where: { id: testId },
            });

            if (test) {
              await tx.labOrderItem.create({
                data: {
                  orderId: labOrder.id,
                  testId: test.id,
                  status: 'pending',
                },
              });
            }
          }

          console.log('[Consultation] Lab order created:', labOrder.id);
        }

        // If completing consultation, update statuses
        if (status === 'COMPLETED') {
          console.log('[Consultation] Completing consultation');

          // Update appointment status
          await tx.appointment.update({
            where: { id: appointmentId },
            data: { status: 'COMPLETED' },
          });

          // Update queue entry
          await tx.queueEntry.updateMany({
            where: { appointmentId },
            data: {
              status: 'COMPLETED',
              completedAt: new Date(),
            },
          });

          console.log('[Consultation] Status updated to COMPLETED');
        }

        return consultation;
      });

      console.log('[Consultation] Transaction completed successfully');

      res.json({
        success: true,
        message: status === 'COMPLETED' ? 'Consultation completed successfully' : 'Consultation saved successfully',
        data: {
          consultationId: result.id,
          status,
        },
      });
    } catch (error: any) {
      console.error('[Consultation] Error details:', error);
      console.error('[Consultation] Error message:', error?.message);
      console.error('[Consultation] Error stack:', error?.stack);
      
      // Return a proper error response
      res.status(500).json({
        success: false,
        message: 'Failed to save consultation',
        error: error?.message || 'Internal server error',
        details: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
      });
    }
  }
);

// @route   GET /api/doctors/consultation/:appointmentId
// @desc    Get consultation by appointment ID
// @access  Private (Doctor)
router.get('/consultation/:appointmentId', authenticate, authorize('DOCTOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appointmentId } = req.params;
    const doctorId = req.user!.id;

    const consultation = await prisma.consultation.findUnique({
      where: { appointmentId },
      include: {
        prescriptions: {
          include: {
            items: {
              include: {
                medicine: true,
              },
            },
          },
        },
        labOrders: {
          include: {
            items: {
              include: {
                test: true,
              },
            },
          },
        },
      },
    });

    if (!consultation) {
      return res.json({
        success: true,
        data: null,
      });
    }

    // Verify this consultation belongs to this doctor
    if (consultation.doctorId !== doctorId) {
      throw ApiError.forbidden('Access denied', 'ACCESS_DENIED');
    }

    res.json({
      success: true,
      data: consultation,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/doctors/patients/:patientId/records
// @desc    Get medical records for a specific patient (for doctor consultation)
// @access  Private (Doctor)
router.get('/patients/:patientId/records', authenticate, authorize('DOCTOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user!.id;
    const hospitalId = req.user!.hospitalId;

    console.log('[Doctor Patient Records] Fetching records for patient:', patientId, 'by doctor:', doctorId);

    // Verify patient exists and belongs to same hospital
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        hospitalId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!patient) {
      throw ApiError.notFound('Patient not found', 'PATIENT_NOT_FOUND');
    }

    // Get all consultations (medical records) for this patient
    const consultations = await prisma.consultation.findMany({
      where: {
        patientId,
        hospitalId,
      },
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        prescriptions: {
          include: {
            items: {
              include: {
                medicine: {
                  select: {
                    name: true,
                  },
                },
              },
            },
          },
        },
        appointment: {
          select: {
            appointmentDate: true,
            startTime: true,
            appointmentType: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to last 50 records for performance
    });

    const formattedRecords = consultations.map((consult) => ({
      id: consult.id,
      date: consult.createdAt.toISOString().split('T')[0],
      appointmentDate: consult.appointment?.appointmentDate?.toISOString().split('T')[0] || consult.createdAt.toISOString().split('T')[0],
      appointmentType: consult.appointment?.appointmentType || 'General',
      doctorName: `${consult.doctor.firstName} ${consult.doctor.lastName}`,
      specialization: consult.doctor.specialty || 'General',
      chiefComplaint: consult.chiefComplaint || '',
      diagnosis: consult.provisionalDiagnosis || 'General Consultation',
      prescription: consult.prescriptions[0]?.items
        ?.map((item) => `${item.medicine.name} ${item.dosage}`)
        .join('\n') || '',
      notes: consult.advice || '',
      followUpDate: consult.followUpDate?.toISOString().split('T')[0] || null,
    }));

    console.log('[Doctor Patient Records] Found', formattedRecords.length, 'records for patient:', patientId);

    res.json({
      success: true,
      data: formattedRecords,
    });
  } catch (error) {
    console.error('[Doctor Patient Records] Error:', error);
    next(error);
  }
});

// @route   GET /api/doctors/patients/:patientId/lab-reports
// @desc    Get lab reports for a specific patient (for doctor consultation)
// @access  Private (Doctor)
router.get('/patients/:patientId/lab-reports', authenticate, authorize('DOCTOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user!.id;
    const hospitalId = req.user!.hospitalId;
    const { status } = req.query;

    console.log('[Doctor Lab Reports] Fetching lab reports for patient:', patientId, 'by doctor:', doctorId);

    // Verify patient exists and belongs to same hospital
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        hospitalId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!patient) {
      throw ApiError.notFound('Patient not found', 'PATIENT_NOT_FOUND');
    }

    const whereClause: any = {
      patientId,
      hospitalId,
    };

    if (status) {
      whereClause.status = status;
    }

    const labOrders = await prisma.labOrder.findMany({
      where: whereClause,
      include: {
        doctor: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        items: {
          include: {
            test: {
              select: {
                name: true,
                category: true,
                parameters: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 50, // Limit to last 50 reports for performance
    });

    const formattedReports = labOrders.map((order) => {
      // Parse results from items
      const results = order.items.map((item) => {
        let parameterResults: any[] = [];
        try {
          if (item.parameterResults) {
            parameterResults = JSON.parse(item.parameterResults);
          }
        } catch {
          parameterResults = [];
        }

        return {
          id: item.id,
          parameter: item.test.name,
          value: item.resultValue || '',
          unit: item.unit || '',
          referenceRange: item.referenceRange || '',
          interpretation: item.interpretation || 'NORMAL',
          status: item.status,
        };
      });

      return {
        id: order.id,
        orderNumber: order.orderNumber,
        date: order.createdAt.toISOString().split('T')[0],
        testName: order.items.length > 1 
          ? `${order.items[0]?.test?.name || 'Lab Test'} +${order.items.length - 1} more`
          : order.items[0]?.test?.name || 'Lab Test',
        tests: order.items.map((item) => ({
          id: item.id,
          name: item.test.name,
          category: item.test.category,
          status: item.status,
        })),
        category: order.items[0]?.test?.category || 'General',
        doctorName: order.doctor ? `${order.doctor.firstName} ${order.doctor.lastName}` : 'N/A',
        status: order.status.toUpperCase(),
        results,
        notes: order.notes || '',
        isUrgent: order.isUrgent || false,
      };
    });

    console.log('[Doctor Lab Reports] Found', formattedReports.length, 'reports for patient:', patientId);

    res.json({
      success: true,
      data: formattedReports,
    });
  } catch (error) {
    console.error('[Doctor Lab Reports] Error:', error);
    next(error);
  }
});

// @route   GET /api/doctors/patients/:patientId/documents
// @desc    Get uploaded documents for a specific patient (for doctor consultation)
// @access  Private (Doctor)
router.get('/patients/:patientId/documents', authenticate, authorize('DOCTOR'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { patientId } = req.params;
    const doctorId = req.user!.id;
    const hospitalId = req.user!.hospitalId;
    const { type } = req.query;

    console.log('[Doctor Patient Documents] Fetching documents for patient:', patientId, 'by doctor:', doctorId);

    // Verify patient exists and belongs to same hospital
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        hospitalId,
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
      },
    });

    if (!patient) {
      throw ApiError.notFound('Patient not found', 'PATIENT_NOT_FOUND');
    }

    const whereClause: any = {
      patientId,
      hospitalId,
    };

    if (type) {
      whereClause.documentType = type;
    }

    const documents = await prisma.patientDocument.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
      take: 100, // Limit for performance
    });

    const formattedDocuments = documents.map((doc: any) => ({
      id: doc.id,
      documentName: doc.documentName,
      documentType: doc.documentType,
      fileType: doc.fileType,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      uploadedBy: doc.uploadedBy,
      uploadedById: doc.uploadedById,
      appointmentId: doc.appointmentId,
      notes: doc.notes,
      uploadDate: doc.createdAt.toISOString().split('T')[0],
      createdAt: doc.createdAt.toISOString(),
    }));

    console.log('[Doctor Patient Documents] Found', formattedDocuments.length, 'documents for patient:', patientId);

    res.json({
      success: true,
      data: formattedDocuments,
    });
  } catch (error) {
    console.error('[Doctor Patient Documents] Error:', error);
    next(error);
  }
});

export default router;
