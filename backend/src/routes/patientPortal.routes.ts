import { Router, Request, Response, NextFunction } from 'express';
import { query, validationResult } from 'express-validator';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import prisma from '../config/database';
import { authenticate } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';

const router = Router();

// Configure multer for file uploads (in-memory storage for base64 conversion)
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['application/pdf', 'image/png', 'image/jpeg', 'image/jpg'];
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, PNG, JPEG, and JPG are allowed.'));
    }
  },
});

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

// Helper function to generate 15-minute interval time slots
function generateTimeSlots(): string[] {
  const slots: string[] = [];
  // Morning session: 09:00 to 13:00
  for (let hour = 9; hour < 13; hour++) {
    for (let min = 0; min < 60; min += 15) {
      slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }
  }
  // Evening session: 14:00 to 20:00
  for (let hour = 14; hour < 20; hour++) {
    for (let min = 0; min < 60; min += 15) {
      slots.push(`${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`);
    }
  }
  // Add 20:00 slot
  slots.push('20:00');
  return slots;
}

// Helper function to filter past time slots for today
function filterPastSlots(slots: string[], dateStr: string): { slot: string; isAvailable: boolean }[] {
  const now = new Date();
  const todayStr = now.toISOString().split('T')[0];
  const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  return slots.map(slot => {
    let isAvailable = true;
    if (dateStr === todayStr) {
      // For today, mark past slots as unavailable
      isAvailable = slot > currentTimeStr;
    }
    return { slot, isAvailable };
  });
}

// @route   GET /api/patient/doctors
// @desc    Get all doctors with available slots for booking
// @access  Private (Patient)
router.get(
  '/doctors',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = req.user!.hospitalId;
      
      // Get all active doctors
      const doctors = await prisma.user.findMany({
        where: {
          hospitalId,
          role: 'DOCTOR',
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          specialty: true,
          consultationFee: true,
          qualifications: true,
        },
        orderBy: [
          { specialty: 'asc' },
          { firstName: 'asc' },
        ],
      });

      // Generate all possible time slots (15-minute intervals)
      const allSlots = generateTimeSlots();

      // Generate available slots for next 15 days
      const today = new Date();
      const availableSlots: { date: string; dayOfWeek: string; slots: { slot: string; isAvailable: boolean }[] }[] = [];
      
      for (let i = 0; i < 15; i++) {
        const date = new Date(today);
        date.setDate(date.getDate() + i);
        const dateStr = date.toISOString().split('T')[0];
        const dayOfWeek = date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
        
        // Filter past slots for today
        const slotsWithAvailability = filterPastSlots(allSlots, dateStr);
        
        availableSlots.push({
          date: dateStr,
          dayOfWeek,
          slots: slotsWithAvailability,
        });
      }

      // Add available slots to each doctor
      const doctorsWithSlots = doctors.map(doctor => ({
        ...doctor,
        specialization: doctor.specialty || 'General Medicine',
        availableSlots,
      }));

      res.json({
        success: true,
        data: doctorsWithSlots,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Helper function to calculate end time
function calculateEndTime(startTime: string, durationMinutes: number): string {
  const [hours, minutes] = startTime.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes + durationMinutes;
  const endHours = Math.floor(totalMinutes / 60);
  const endMinutes = totalMinutes % 60;
  return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
}

// @route   POST /api/patient/appointments
// @desc    Book a new appointment
// Helper function to validate time slot format and working hours
function isValidTimeSlot(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):([0-5][0-9])$/;
  if (!timeRegex.test(time)) return false;
  
  const [hours, minutes] = time.split(':').map(Number);
  const totalMinutes = hours * 60 + minutes;
  
  // Morning session: 09:00 to 13:00 (540 to 780 minutes)
  // Evening session: 14:00 to 20:00 (840 to 1200 minutes)
  const morningStart = 9 * 60; // 540
  const morningEnd = 13 * 60; // 780
  const eveningStart = 14 * 60; // 840
  const eveningEnd = 20 * 60; // 1200
  
  // Check if it's a valid15-minute interval
  if (minutes % 15 !== 0) return false;
  
  return (totalMinutes >= morningStart && totalMinutes < morningEnd) ||
         (totalMinutes >= eveningStart && totalMinutes <= eveningEnd);
}

// @access  Private (Patient)
router.post(
  '/appointments',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.id;
      const hospitalId = req.user!.hospitalId;
      const { doctorId, date, time, type, notes } = req.body;

      console.log('[Patient Portal] Booking appointment:', {
        patientId,
        hospitalId,
        doctorId,
        date,
        time,
        type,
        notes,
      });

      if (!doctorId || !date || !time) {
        console.error('[Patient Portal] Missing required fields:', { doctorId, date, time });
        throw ApiError.badRequest('Doctor, date, and time are required', 'MISSING_FIELDS');
      }

      // Validate date format
      const appointmentDate = new Date(date);
      if (isNaN(appointmentDate.getTime())) {
        throw ApiError.badRequest('Invalid date format', 'INVALID_DATE');
      }

      // Validate date is not in the past
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (appointmentDate < today) {
        throw ApiError.badRequest('Cannot book appointments in the past', 'PAST_DATE');
      }

      // Validate date is within15 days
      const maxDate = new Date();
      maxDate.setDate(maxDate.getDate() + 15);
      maxDate.setHours(23, 59, 59, 999);
      if (appointmentDate > maxDate) {
        throw ApiError.badRequest('Appointments can only be booked within the next 15 days', 'DATE_TOO_FAR');
      }

      // Validate time slot format and working hours
      if (!isValidTimeSlot(time)) {
        throw ApiError.badRequest('Invalid time slot. Please select a valid 15-minute interval within working hours (09:00-13:00 or 14:00-20:00)', 'INVALID_TIME_SLOT');
      }

      // For today, validate time is not in the past
      const now = new Date();
      const todayStr = now.toISOString().split('T')[0];
      const currentTimeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
      if (date === todayStr && time <= currentTimeStr) {
        throw ApiError.badRequest('Cannot book appointments in the past. Please select a future time slot', 'PAST_TIME');
      }

      // Verify doctor exists and is active
      const doctor = await prisma.user.findFirst({
        where: {
          id: doctorId,
          hospitalId,
          role: 'DOCTOR',
          isActive: true,
        },
      });

      if (!doctor) {
        console.error('[Patient Portal] Doctor not found:', doctorId);
        throw ApiError.notFound('Doctor not found', 'DOCTOR_NOT_FOUND');
      }

      console.log('[Patient Portal] Doctor verified:', doctor.firstName, doctor.lastName);

      // Check if slot is already booked
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          doctorId,
          appointmentDate: new Date(date),
          startTime: time,
          status: {
            notIn: ['CANCELLED', 'NO_SHOW'],
          },
        },
      });

      if (existingAppointment) {
        console.error('[Patient Portal] Slot already booked:', existingAppointment.id);
        throw ApiError.conflict('This time slot is already booked. Please select another time', 'SLOT_BOOKED');
      }

      // Create appointment with SCHEDULED status (auto-confirmed for patient portal bookings)
      const appointment = await prisma.appointment.create({
        data: {
          id: uuidv4(),
          hospitalId,
          patientId,
          doctorId,
          appointmentDate: new Date(date),
          startTime: time,
          endTime: calculateEndTime(time, 15), // 15 min consultation
          type: type === 'WALK_IN' ? 'WALK_IN' : 'ONLINE',
          status: 'SCHEDULED',
          notes,
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              phone: true,
              dateOfBirth: true,
              gender: true,
              weight: true,
            },
          },
          doctor: {
            select: {
              firstName: true,
              lastName: true,
              specialty: true,
              consultationFee: true,
            },
          },
        },
      });

      console.log('[Patient Portal] Appointment created successfully:', appointment.id);

      // Create notification for the doctor
      const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
      const formattedDate = new Date(date).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      
      const notificationMessage = `New appointment booked by patient ${patientName} for ${formattedDate} at ${time}.`;
      
      await prisma.notification.create({
        data: {
          id: uuidv4(),
          hospitalId,
          userId: doctorId,
          type: 'APPOINTMENT',
          title: 'New Appointment Booked',
          message: notificationMessage,
          data: JSON.stringify({
            appointmentId: appointment.id,
            patientId,
            patientName,
            appointmentDate: date,
            appointmentTime: time,
            notes,
            type: 'NEW_APPOINTMENT',
          }),
          isRead: false,
        },
      });

      console.log('[Patient Portal] Notification created for doctor:', doctorId);

      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        data: appointment,
      });
    } catch (error) {
      console.error('[Patient Portal] Error booking appointment:', error);
      next(error);
    }
  }
);

// @route   GET /api/patient/doctors/:doctorId/slots
// @desc    Get available slots for a specific doctor on a specific date
// @access  Private (Patient)
router.get(
  '/doctors/:doctorId/slots',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { doctorId } = req.params;
      const { date } = req.query;
      const hospitalId = req.user!.hospitalId;

      if (!date) {
        throw ApiError.badRequest('Date is required', 'DATE_REQUIRED');
      }

      // Verify doctor exists and is active
      const doctor = await prisma.user.findFirst({
        where: {
          id: doctorId,
          hospitalId,
          role: 'DOCTOR',
          isActive: true,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          specialty: true,
          consultationFee: true,
        },
      });

      if (!doctor) {
        throw ApiError.notFound('Doctor not found', 'DOCTOR_NOT_FOUND');
      }

      // Get all booked slots for this doctor on this date
      const bookedAppointments = await prisma.appointment.findMany({
        where: {
          doctorId,
          appointmentDate: new Date(date as string),
          status: {
            notIn: ['CANCELLED', 'NO_SHOW'],
          },
        },
        select: {
          startTime: true,
        },
      });

      const bookedSlots = new Set(bookedAppointments.map(apt => apt.startTime));

      // Generate all possible time slots
      const allSlots = generateTimeSlots();
      
      // Filter past slots and mark booked slots
      const slotsWithAvailability = filterPastSlots(allSlots, date as string).map(({ slot, isAvailable }) => ({
        slot,
        isAvailable: isAvailable && !bookedSlots.has(slot),
      }));

      res.json({
        success: true,
        data: {
          doctor: {
            id: doctor.id,
            name: `Dr. ${doctor.firstName} ${doctor.lastName}`,
            specialization: doctor.specialty || 'General Medicine',
            consultationFee: doctor.consultationFee,
          },
          date,
          slots: slotsWithAvailability,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/patient/specializations
// @desc    Get all available specializations
// @access  Private (Patient)
router.get(
  '/specializations',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = req.user!.hospitalId;

      const doctors = await prisma.user.findMany({
        where: {
          hospitalId,
          role: 'DOCTOR',
          isActive: true,
        },
        select: {
          specialty: true,
        },
      });

      // Get unique specializations
      const specializations = [...new Set(doctors.map(d => d.specialty || 'General Medicine'))].sort();

      res.json({
        success: true,
        data: specializations,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/patient/appointments/upcoming
// @desc    Get upcoming appointments for patient with doctor availability status
// @access  Private (Patient)
router.get(
  '/appointments/upcoming',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.id;
      const hospitalId = req.user!.hospitalId;
      const now = new Date();

      console.log('[Patient Portal] Fetching upcoming appointments for patient:', patientId);

      const appointments = await prisma.appointment.findMany({
        where: {
          patientId,
          hospitalId,
          status: {
            in: ['PENDING_APPROVAL', 'SCHEDULED', 'CONFIRMED'],
          },
          OR: [
            {
              appointmentDate: {
                gt: now,
              },
            },
            {
              appointmentDate: {
                gte: new Date(now.setHours(0, 0, 0, 0)),
              },
              startTime: {
                gte: now.toTimeString().slice(0, 5),
              },
            },
          ],
        },
        include: {
          doctor: {
            select: {
              firstName: true,
              lastName: true,
              specialty: true,
            },
          },
        },
        orderBy: [
          { appointmentDate: 'asc' },
          { startTime: 'asc' },
        ],
        take: 10,
      });

      console.log('[Patient Portal] Found appointments:', appointments.length);

      // Check doctor availability for each appointment
      const formattedAppointments = await Promise.all(
        appointments.map(async (apt) => {
          // Check if doctor has time-off on this appointment date
          // Normalize dates to compare only the date portion (ignore time/timezone)
          const appointmentDateStr = apt.appointmentDate.toISOString().split('T')[0];
          
          const timeOff = await prisma.doctorTimeOff.findFirst({
            where: {
              doctorId: apt.doctorId,
              // Check if appointment date falls within the time-off period
              startDate: { lte: apt.appointmentDate },
              endDate: { gte: apt.appointmentDate },
            },
          });

          console.log(`[Patient Portal] Appointment ${apt.id}: date=${appointmentDateStr}, timeOff=${!!timeOff}`);

          return {
            id: apt.id,
            doctorId: apt.doctorId,
            doctorName: `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`,
            specialization: apt.doctor.specialty || 'General',
            date: appointmentDateStr,
            time: apt.startTime,
            status: apt.status,
            type: apt.type,
            doctorUnavailable: !!timeOff,
            unavailabilityReason: timeOff?.reason || null,
          };
        })
      );

      res.json({
        success: true,
        data: formattedAppointments,
      });
    } catch (error) {
      console.error('[Patient Portal] Error fetching appointments:', error);
      next(error);
    }
  }
);

// @route   GET /api/patient/appointments/count
// @desc    Get total appointments count for patient
// @access  Private (Patient)
router.get(
  '/appointments/count',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.id;
      const hospitalId = req.user!.hospitalId;

      console.log('[Patient Portal] Fetching total appointments count for patient:', patientId);

      // Get total count of appointments for this patient
      const totalCount = await prisma.appointment.count({
        where: {
          patientId,
          hospitalId,
        },
      });

      console.log('[Patient Portal] Total appointments count:', totalCount);

      res.json({
        success: true,
        data: {
          count: totalCount,
        },
      });
    } catch (error) {
      console.error('[Patient Portal] Error fetching appointments count:', error);
      next(error);
    }
  }
);

// @route   GET /api/patient/records/count
// @desc    Get total medical records count for patient
// @access  Private (Patient)
router.get(
  '/records/count',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.id;
      const hospitalId = req.user!.hospitalId;

      // Get total count of consultations (medical records) for this patient
      const totalCount = await prisma.consultation.count({
        where: {
          patientId,
          hospitalId,
        },
      });

      res.json({
        success: true,
        data: {
          count: totalCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/patient/records/recent
// @desc    Get recent medical records for patient (last 3 records)
// @access  Private (Patient)
router.get(
  '/records/recent',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.id;
      const hospitalId = req.user!.hospitalId;

      // Get last 3 consultations/visits (medical records)
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
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 3,
      });

      const formattedRecords = consultations.map((consult) => ({
        id: consult.id,
        date: consult.createdAt.toISOString().split('T')[0],
        diagnosis: consult.provisionalDiagnosis || consult.chiefComplaint || 'General Consultation',
        doctorName: `Dr. ${consult.doctor.firstName} ${consult.doctor.lastName}`,
        department: consult.doctor.specialty || 'General',
      }));

      res.json({
        success: true,
        data: formattedRecords,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/patient/records
// @desc    Get all medical records for patient
// @access  Private (Patient)
router.get(
  '/records',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.id;
      const hospitalId = req.user!.hospitalId;

      // Get all consultations with prescriptions
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
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      const formattedRecords = consultations.map((consult) => ({
        id: consult.id,
        date: consult.createdAt.toISOString().split('T')[0],
        doctorName: `${consult.doctor.firstName} ${consult.doctor.lastName}`,
        specialization: consult.doctor.specialty || 'General',
        diagnosis: consult.provisionalDiagnosis || consult.chiefComplaint || 'General Consultation',
        prescription: consult.prescriptions[0]?.items
          ?.map((item) => `${item.medicine.name} ${item.dosage}`)
          .join('\n') || '',
        notes: consult.advice || '',
        followUpDate: consult.followUpDate?.toISOString().split('T')[0] || null,
      }));

      res.json({
        success: true,
        data: formattedRecords,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/patient/prescriptions
// @desc    Get all prescriptions for patient
// @access  Private (Patient)
router.get(
  '/prescriptions',
  authenticate,
  [
    query('status').optional().isIn(['pending', 'partial', 'dispensed', 'cancelled']),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.id;
      const hospitalId = req.user!.hospitalId;
      const { status } = req.query;

      const whereClause: any = {
        patientId,
        hospitalId,
      };

      if (status) {
        whereClause.status = status;
      }

      const prescriptions = await prisma.prescription.findMany({
        where: whereClause,
        include: {
          doctor: {
            select: {
              firstName: true,
              lastName: true,
              specialty: true,
            },
          },
          consultation: {
            select: {
              provisionalDiagnosis: true,
              chiefComplaint: true,
            },
          },
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
        orderBy: {
          createdAt: 'desc',
        },
      });

      const formattedPrescriptions = prescriptions.map((rx) => ({
        id: rx.id,
        date: rx.createdAt.toISOString().split('T')[0],
        doctorName: `${rx.doctor.firstName} ${rx.doctor.lastName}`,
        specialization: rx.doctor.specialty || 'General',
        diagnosis: rx.consultation?.provisionalDiagnosis || rx.consultation?.chiefComplaint || '',
        medicines: rx.items.map((item) => ({
          name: item.medicine.name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: `${item.durationDays} days`,
          instructions: item.instructions || '',
        })),
        status: rx.status.toUpperCase(),
      }));

      res.json({
        success: true,
        data: formattedPrescriptions,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/patient/prescriptions/:id
// @desc    Get detailed prescription by ID for PDF generation
// @access  Private (Patient)
router.get(
  '/prescriptions/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.id;
      const hospitalId = req.user!.hospitalId;
      const { id } = req.params;

      // Get prescription with full details - ensure it belongs to the logged-in patient
      const prescription = await prisma.prescription.findFirst({
        where: {
          id,
          patientId,
          hospitalId,
        },
        include: {
          doctor: {
            select: {
              firstName: true,
              lastName: true,
              specialty: true,
              qualifications: true,
              phone: true,
            },
          },
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientNumber: true,
              dateOfBirth: true,
              gender: true,
              phone: true,
              address: true,
              city: true,
              state: true,
              pincode: true,
              bloodGroup: true,
            },
          },
          consultation: {
            select: {
              provisionalDiagnosis: true,
              chiefComplaint: true,
              advice: true,
              followUpDate: true,
              appointmentId: true,
              appointment: {
                select: {
                  appointmentDate: true,
                  startTime: true,
                },
              },
            },
          },
          items: {
            include: {
              medicine: {
                select: {
                  name: true,
                },
              },
            },
          },
          hospital: {
            select: {
              name: true,
              address: true,
              city: true,
              state: true,
              pincode: true,
              contactPhone: true,
              logo: true,
            },
          },
        },
      });

      if (!prescription) {
        throw ApiError.notFound('Prescription not found or access denied', 'PRESCRIPTION_NOT_FOUND');
      }

      // Calculate patient age
      const patientAge = prescription.patient.dateOfBirth
        ? Math.floor(
            (new Date().getTime() - new Date(prescription.patient.dateOfBirth).getTime()) /
              (365.25 * 24 * 60 * 60 * 1000)
          )
        : null;

      const formattedPrescription = {
        id: prescription.id,
        prescriptionNumber: prescription.prescriptionNumber,
        date: prescription.createdAt.toISOString().split('T')[0],
        createdAt: prescription.createdAt,
        status: prescription.status.toUpperCase(),
        notes: prescription.notes,
        
        // Hospital/Clinic Information
        hospital: {
          name: prescription.hospital.name,
          address: prescription.hospital.address,
          city: prescription.hospital.city,
          state: prescription.hospital.state,
          pincode: prescription.hospital.pincode,
          phone: prescription.hospital.contactPhone,
          logo: prescription.hospital.logo,
        },
        
        // Doctor Information
        doctor: {
          name: `Dr. ${prescription.doctor.firstName} ${prescription.doctor.lastName}`,
          firstName: prescription.doctor.firstName,
          lastName: prescription.doctor.lastName,
          specialization: prescription.doctor.specialty || 'General Medicine',
          qualifications: prescription.doctor.qualifications || '',
          phone: prescription.doctor.phone,
        },
        
        // Patient Information
        patient: {
          name: `${prescription.patient.firstName} ${prescription.patient.lastName}`,
          firstName: prescription.patient.firstName,
          lastName: prescription.patient.lastName,
          patientId: prescription.patient.patientNumber,
          age: patientAge,
          gender: prescription.patient.gender,
          phone: prescription.patient.phone,
          address: prescription.patient.address,
          city: prescription.patient.city,
          state: prescription.patient.state,
          bloodGroup: prescription.patient.bloodGroup,
        },
        
        // Appointment Information
        appointment: prescription.consultation?.appointment
          ? {
              date: prescription.consultation.appointment.appointmentDate.toISOString().split('T')[0],
              time: prescription.consultation.appointment.startTime,
            }
          : null,
        
        // Medical Information
        diagnosis: prescription.consultation?.provisionalDiagnosis || prescription.consultation?.chiefComplaint || '',
        chiefComplaint: prescription.consultation?.chiefComplaint || '',
        advice: prescription.consultation?.advice || '',
        followUpDate: prescription.consultation?.followUpDate?.toISOString().split('T')[0] || null,
        
        // Medicines
        medicines: prescription.items.map((item) => ({
          name: item.medicine.name,
          dosage: item.dosage,
          frequency: item.frequency,
          duration: `${item.durationDays} days`,
          durationDays: item.durationDays,
          quantity: item.quantity,
          instructions: item.instructions || '',
        })),
      };

      res.json({
        success: true,
        data: formattedPrescription,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/patient/lab-reports
// @desc    Get all lab reports for patient
// @access  Private (Patient)
router.get(
  '/lab-reports',
  authenticate,
  [
    query('status').optional().isIn(['pending', 'sample_collected', 'in_progress', 'completed', 'cancelled']),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.id;
      const hospitalId = req.user!.hospitalId;
      const { status } = req.query;

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
            parameter: item.test.name,
            value: item.resultValue || '',
            unit: item.unit || '',
            referenceRange: item.referenceRange || '',
            interpretation: item.interpretation || 'NORMAL',
          };
        });

        return {
          id: order.id,
          date: order.createdAt.toISOString().split('T')[0],
          testName: order.items[0]?.test?.name || 'Lab Test',
          category: order.items[0]?.test?.category || 'General',
          doctorName: order.doctor ? `${order.doctor.firstName} ${order.doctor.lastName}` : 'N/A',
          status: order.status.toUpperCase(),
          results,
          notes: order.notes || '',
        };
      });

      res.json({
        success: true,
        data: formattedReports,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/patient/profile
// @desc    Get patient profile
// @access  Private (Patient)
router.get(
  '/profile',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.id;
      const hospitalId = req.user!.hospitalId;

      const patient = await prisma.patient.findFirst({
        where: {
          id: patientId,
          hospitalId,
        },
        select: {
          id: true,
          patientNumber: true,
          firstName: true,
          lastName: true,
          phone: true,
          email: true,
          dateOfBirth: true,
          gender: true,
          weight: true,
          bloodGroup: true,
          address: true,
          city: true,
          state: true,
          pincode: true,
          emergencyContact: true,
          emergencyPhone: true,
          allergies: true,
          preExistingConditions: true,
        },
      });

      if (!patient) {
        throw ApiError.notFound('Patient profile not found', 'PATIENT_NOT_FOUND');
      }

      res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/patient/profile
// @desc    Update patient profile
// @access  Private (Patient)
router.put(
  '/profile',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.id;
      const hospitalId = req.user!.hospitalId;

      const {
        firstName,
        lastName,
        email,
        dateOfBirth,
        gender,
        weight,
        bloodGroup,
        address,
        city,
        state,
        pincode,
        emergencyContact,
        emergencyPhone,
        allergies,
        preExistingConditions,
      } = req.body;

      const patient = await prisma.patient.updateMany({
        where: {
          id: patientId,
          hospitalId,
        },
        data: {
          firstName,
          lastName,
          email,
          dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
          gender,
          weight: weight ? parseFloat(weight) : undefined,
          bloodGroup,
          address,
          city,
          state,
          pincode,
          emergencyContact,
          emergencyPhone,
          allergies: allergies || [],
          preExistingConditions: preExistingConditions || [],
        },
      });

      res.json({
        success: true,
        message: 'Profile updated successfully',
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// PATIENT UPLOADED DOCUMENTS
// ============================================

// @route   GET /api/patient/documents
// @desc    Get all uploaded documents for patient
// @access  Private (Patient)
router.get(
  '/documents',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.id;
      const hospitalId = req.user!.hospitalId;
      const { type } = req.query;

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

      res.json({
        success: true,
        data: formattedDocuments,
      });
    } catch (error) {
      next(error);
    }
  }
);

// Helper function to generate unique file name
function generateUniqueFileName(patientId: string, originalName: string): string {
  const timestamp = Date.now();
  const ext = originalName.split('.').pop() || 'pdf';
  const sanitizedPatientId = patientId.substring(0, 8).toUpperCase();
  const sanitizedName = originalName.replace(/\.[^/.]+$/, '').replace(/[^a-zA-Z0-9]/g, '_').substring(0, 20);
  return `${timestamp}_${sanitizedPatientId}_${sanitizedName}.${ext}`;
}

// @route   POST /api/patient/documents
// @desc    Upload a new document (with file storage in DB)
// @access  Private (Patient)
router.post(
  '/documents',
  authenticate,
  upload.single('file'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.id;
      const hospitalId = req.user!.hospitalId;
      
      // Extract form data
      const documentName = req.body.documentName as string;
      const documentType = req.body.documentType as string;
      const notes = req.body.notes as string;
      const appointmentId = req.body.appointmentId as string | undefined;
      
      // Check if file was uploaded
      if (!req.file) {
        throw ApiError.badRequest('File is required', 'FILE_REQUIRED');
      }

      if (!documentName || !documentName.trim()) {
        throw ApiError.badRequest('Document name is required', 'MISSING_DOCUMENT_NAME');
      }

      // Validate document type
      const validTypes = ['MEDICAL_RECORD', 'LAB_REPORT', 'PRESCRIPTION', 'OTHER'];
      const docType = validTypes.includes(documentType) ? documentType : 'OTHER';

      // File info
      const fileType = req.file.mimetype;
      const fileSize = req.file.size;
      const originalName = req.file.originalname;
      
      // Generate unique file name
      const uniqueFileName = generateUniqueFileName(patientId, originalName);
      
      // Convert file buffer to base64 for storage in DB
      const fileData = req.file.buffer.toString('base64');
      
      // Create data URL for fileUrl (can be used directly in browser)
      const fileUrl = `data:${fileType};base64,${fileData}`;

      // Verify appointment exists if provided
      if (appointmentId) {
        const appointment = await prisma.appointment.findFirst({
          where: {
            id: appointmentId,
            patientId,
            hospitalId,
          },
        });
        if (!appointment) {
          throw ApiError.badRequest('Invalid appointment ID', 'INVALID_APPOINTMENT');
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const document = await prisma.patientDocument.create({
        data: {
          hospitalId,
          patientId,
          appointmentId: appointmentId || null,
          documentName: documentName.trim(),
          documentType: docType,
          fileType,
          fileData,
          fileUrl,
          fileSize,
          uploadedBy: 'PATIENT',
          uploadedById: patientId,
          notes,
        } as any,
      });

      res.json({
        success: true,
        message: 'Document uploaded successfully',
        data: {
          id: document.id,
          documentName: document.documentName,
          documentType: document.documentType,
          fileType: document.fileType,
          fileSize: document.fileSize,
          appointmentId: (document as any).appointmentId,
          uploadDate: document.createdAt.toISOString().split('T')[0],
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/patient/documents/:id
// @desc    Delete an uploaded document
// @access  Private (Patient)
router.delete(
  '/documents/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patientId = req.user!.id;
      const hospitalId = req.user!.hospitalId;
      const { id } = req.params;

      // Verify document belongs to the patient
      const document = await prisma.patientDocument.findFirst({
        where: {
          id,
          patientId,
          hospitalId,
        },
      });

      if (!document) {
        throw ApiError.notFound('Document not found', 'DOCUMENT_NOT_FOUND');
      }

      await prisma.patientDocument.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Document deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
