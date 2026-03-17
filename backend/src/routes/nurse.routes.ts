import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';
import prisma from '../config/database';
import { emitVitalsReady } from '../socket';
import { io } from '../index';

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

// @route   GET /api/nurse/dashboard-stats
// @desc    Get nurse dashboard statistics
// @access  Private (Nurse)
router.get('/dashboard-stats', authenticate, authorize('NURSE'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const now = new Date();
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    // Get total patients today (appointments scheduled today)
    const totalPatients = await prisma.appointment.count({
      where: {
        hospitalId,
        appointmentDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
        status: {
          not: 'CANCELLED',
        },
      },
    });

    // Get vitals completed today
    const vitalsCompleted = await prisma.vitals.count({
      where: {
        hospitalId,
        recordedAt: { gte: today },
      },
    });

    // Get pending vitals (appointments today without vitals)
    const appointmentsWithVitals = await prisma.appointment.findMany({
      where: {
        hospitalId,
        appointmentDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
        status: {
          not: 'CANCELLED',
        },
      },
      include: {
        vitals: true,
      },
    });
    const pendingVitals = appointmentsWithVitals.filter(apt => !apt.vitals).length;

    // Get recent vitals (last 3)
    const recentVitals = await prisma.vitals.findMany({
      where: {
        hospitalId,
      },
      take: 3,
      orderBy: { recordedAt: 'desc' },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientNumber: true,
          },
        },
        appointment: {
          include: {
            doctor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
      },
    });

    // Get waiting for vitals - patients with appointments in next 2 hours without vitals
    const currentTime = now.toTimeString().slice(0, 5); // HH:MM format
    const twoHoursLaterTime = twoHoursLater.toTimeString().slice(0, 5);

    const waitingForVitals = await prisma.appointment.findMany({
      where: {
        hospitalId,
        appointmentDate: {
          gte: today,
          lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
        },
        startTime: {
          gte: currentTime,
          lte: twoHoursLaterTime,
        },
        status: {
          notIn: ['CANCELLED', 'COMPLETED'],
        },
        vitals: null, // No vitals recorded yet
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            patientNumber: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    res.json({
      success: true,
      data: {
        totalPatients,
        vitalsCompleted,
        pendingVitals,
        recentVitals: recentVitals.map((v) => ({
          id: v.id,
          patientId: v.patient.id,
          patientName: `${v.patient.firstName} ${v.patient.lastName}`,
          patientNumber: v.patient.patientNumber,
          doctorName: v.appointment?.doctor 
            ? `Dr. ${v.appointment.doctor.firstName} ${v.appointment.doctor.lastName}`
            : null,
          recordedAt: v.recordedAt,
        })),
        waitingForVitals: waitingForVitals.map((apt) => ({
          appointmentId: apt.id,
          patientId: apt.patient.id,
          patientName: `${apt.patient.firstName} ${apt.patient.lastName}`,
          patientNumber: apt.patient.patientNumber,
          phone: apt.patient.phone,
          appointmentTime: apt.startTime,
          doctorName: `Dr. ${apt.doctor.firstName} ${apt.doctor.lastName}`,
          doctorId: apt.doctor.id,
          specialty: apt.doctor.specialty,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/nurse/patients/search
// @desc    Search patients for nurse
// @access  Private (Nurse)
router.get(
  '/patients/search',
  authenticate,
  authorize('NURSE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { type, query } = req.query;
      const hospitalId = req.user!.hospitalId;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      let patients: any[] = [];

      if (type === 'doctorName' || type === 'doctorId') {
        // Search by doctor - find appointments for this doctor
        const doctorWhere: any = { hospitalId };
        
        if (type === 'doctorId') {
          doctorWhere.id = query as string;
        } else {
          doctorWhere.OR = [
            { firstName: { contains: query as string, mode: 'insensitive' } },
            { lastName: { contains: query as string, mode: 'insensitive' } },
          ];
        }

        const appointments = await prisma.appointment.findMany({
          where: {
            hospitalId,
            appointmentDate: {
              gte: today,
              lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
            },
            doctor: doctorWhere,
          },
          include: {
            patient: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                phone: true,
                patientNumber: true,
                dateOfBirth: true,
                bloodGroup: true,
                gender: true,
              },
            },
            doctor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                specialty: true,
              },
            },
          },
        });

        patients = appointments.map((apt) => ({
          ...apt.patient,
          appointment: {
            id: apt.id,
            appointmentDate: apt.appointmentDate,
            appointmentTime: apt.startTime,
            doctor: apt.doctor,
          },
        }));
      } else {
        // Search by patient info
        const whereClause: any = { hospitalId };

        if (type === 'phone') {
          whereClause.phone = { contains: query as string };
        } else if (type === 'name') {
          whereClause.OR = [
            { firstName: { contains: query as string, mode: 'insensitive' } },
            { lastName: { contains: query as string, mode: 'insensitive' } },
          ];
        } else if (type === 'id') {
          whereClause.patientNumber = { contains: query as string };
        }

        const patientResults = await prisma.patient.findMany({
          where: whereClause,
          take: 20,
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            patientNumber: true,
            dateOfBirth: true,
            bloodGroup: true,
            gender: true,
          },
        });

        // Get today's appointment for each patient
        const patientsWithAppointments = await Promise.all(
          patientResults.map(async (patient) => {
            const appointment = await prisma.appointment.findFirst({
              where: {
                patientId: patient.id,
                appointmentDate: {
                  gte: today,
                  lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
                },
                status: { not: 'CANCELLED' },
              },
              include: {
                doctor: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    specialty: true,
                  },
                },
              },
            });
            return {
              ...patient,
              appointment: appointment ? {
                id: appointment.id,
                appointmentDate: appointment.appointmentDate,
                appointmentTime: appointment.startTime,
                doctor: appointment.doctor,
              } : null,
            };
          })
        );

        patients = patientsWithAppointments;
      }

      res.json({
        success: true,
        data: patients,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/nurse/patient/:id
// @desc    Get patient info for nurse
// @access  Private (Nurse)
router.get(
  '/patient/:id',
  authenticate,
  authorize('NURSE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patient = await prisma.patient.findFirst({
        where: {
          id: req.params.id,
          hospitalId: req.user!.hospitalId,
        },
        select: {
          id: true,
          firstName: true,
          lastName: true,
          phone: true,
          patientNumber: true,
          dateOfBirth: true,
          bloodGroup: true,
          gender: true,
          email: true,
          address: true,
        },
      });

      if (!patient) {
        throw ApiError.notFound('Patient not found', 'PATIENT_NOT_FOUND');
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

// @route   GET /api/nurse/patient/:id/appointments
// @desc    Get patient appointments for today
// @access  Private (Nurse)
router.get(
  '/patient/:id/appointments',
  authenticate,
  authorize('NURSE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const appointments = await prisma.appointment.findMany({
        where: {
          patientId: req.params.id,
          hospitalId: req.user!.hospitalId,
          appointmentDate: {
            gte: today,
            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000),
          },
          status: { not: 'CANCELLED' },
        },
        include: {
          doctor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              specialty: true,
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      });

      res.json({
        success: true,
        data: appointments.map(apt => ({
          id: apt.id,
          appointmentDate: apt.appointmentDate,
          appointmentTime: apt.startTime,
          status: apt.status,
          doctor: apt.doctor,
        })),
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/nurse/patient/:id/vitals/latest
// @desc    Get patient's latest vitals
// @access  Private (Nurse)
router.get(
  '/patient/:id/vitals/latest',
  authenticate,
  authorize('NURSE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const vitals = await prisma.vitals.findFirst({
        where: {
          patientId: req.params.id,
          hospitalId: req.user!.hospitalId,
        },
        orderBy: {
          recordedAt: 'desc',
        },
      });

      res.json({
        success: true,
        data: vitals,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/nurse/patients/:id/profile
// @desc    Get patient profile for nurse
// @access  Private (Nurse)
router.get(
  '/patients/:id/profile',
  authenticate,
  authorize('NURSE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patient = await prisma.patient.findFirst({
        where: {
          id: req.params.id,
          hospitalId: req.user!.hospitalId,
        },
        include: {
          appointments: {
            where: {
              appointmentDate: {
                gte: new Date(new Date().setHours(0, 0, 0, 0)),
              },
            },
            take: 1,
            include: {
              doctor: {
                select: {
                  firstName: true,
                  lastName: true,
                  specialty: true,
                },
              },
            },
          },
          vitals: {
            take: 3,
            orderBy: { recordedAt: 'desc' },
          },
          medicalHistory: true,
        },
      });

      if (!patient) {
        throw ApiError.notFound('Patient not found', 'PATIENT_NOT_FOUND');
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

// @route   GET /api/nurse/queue
// @desc    Get queue for nurse
// @access  Private (Nurse)
router.get('/queue', authenticate, authorize('NURSE'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;

    const queue = await prisma.queueEntry.findMany({
      where: {
        hospitalId,
        status: { in: ['WAITING', 'IN_VITALS'] },
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            dateOfBirth: true,
            gender: true,
            phone: true,
          },
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { queueNumber: 'asc' }],
    });

    res.json({
      success: true,
      data: queue,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/nurse/vitals
// @desc    Record patient vitals
// @access  Private (Nurse)
router.post(
  '/vitals',
  authenticate,
  authorize('NURSE'),
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('bloodPressureSystolic').optional().isInt({ min: 50, max: 250 }),
    body('bloodPressureDiastolic').optional().isInt({ min: 30, max: 150 }),
    body('heartRate').optional().isInt({ min: 30, max: 200 }),
    body('temperature').optional().isFloat({ min: 90, max: 110 }),
    body('weight').optional().isFloat({ min: 1, max: 300 }),
    body('height').optional().isFloat({ min: 50, max: 250 }),
    body('oxygenSaturation').optional().isInt({ min: 50, max: 100 }),
    body('respiratoryRate').optional().isInt({ min: 8, max: 40 }),
    body('notes').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const nurseId = req.user!.id;
      const hospitalId = req.user!.hospitalId;
      const {
        patientId,
        appointmentId,
        bloodPressureSystolic,
        bloodPressureDiastolic,
        heartRate,
        temperature,
        weight,
        height,
        bloodSugarFasting,
        bloodSugarRandom,
        bloodSugarPostMeal,
        oxygenSaturation,
        respiratoryRate,
        notes,
      } = req.body;

      // Get patient and appointment info for the vital record
      const patient = await prisma.patient.findUnique({
        where: { id: patientId },
        select: { firstName: true, lastName: true },
      });

      let doctorId = null;
      let doctorName = null;

      if (appointmentId) {
        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
          include: {
            doctor: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        });
        if (appointment) {
          doctorId = appointment.doctor.id;
          doctorName = `Dr. ${appointment.doctor.firstName} ${appointment.doctor.lastName}`;
        }
      }

      // Calculate BMI if height and weight are provided
      let bmi = null;
      if (weight && height) {
        const heightInMeters = height / 100;
        bmi = parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
      }

      // Check for abnormal values
      const alerts: string[] = [];
      
      if (bloodPressureSystolic && bloodPressureSystolic > 140) {
        alerts.push('High systolic blood pressure');
      }
      if (bloodPressureDiastolic && bloodPressureDiastolic > 90) {
        alerts.push('High diastolic blood pressure');
      }
      if (heartRate && (heartRate < 60 || heartRate > 100)) {
        alerts.push('Abnormal heart rate');
      }
      if (oxygenSaturation && oxygenSaturation < 95) {
        alerts.push('Low oxygen saturation');
      }
      if (bloodSugarFasting && bloodSugarFasting > 100) {
        alerts.push('High fasting blood sugar');
      }

      // Create vitals record
      const vitals = await prisma.vitals.create({
        data: {
          id: undefined,
          hospitalId,
          patientId,
          appointmentId: appointmentId || null,
          recordedBy: nurseId,
          bloodPressureSystolic: bloodPressureSystolic || null,
          bloodPressureDiastolic: bloodPressureDiastolic || null,
          heartRate: heartRate || null,
          temperature: temperature || null,
          weight: weight || null,
          height: height || null,
          bmi,
          bloodSugarFasting: bloodSugarFasting || null,
          bloodSugarRandom: bloodSugarRandom || null,
          bloodSugarPostMeal: bloodSugarPostMeal || null,
          oxygenSaturation: oxygenSaturation || null,
          respiratoryRate: respiratoryRate || null,
          notes: notes || null,
        },
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientNumber: true,
            },
          },
        },
      });

      // Update queue status if appointment exists
      if (appointmentId) {
        await prisma.queueEntry.updateMany({
          where: { appointmentId },
          data: {
            status: 'VITALS_DONE',
            vitalsDoneAt: new Date(),
          },
        });

        // Get doctor ID for notification
        const appointment = await prisma.appointment.findUnique({
          where: { id: appointmentId },
          select: { doctorId: true },
        });

        if (appointment && io) {
          emitVitalsReady(io, appointment.doctorId, { patientId });
        }
      }

      res.status(201).json({
        success: true,
        message: 'Vitals recorded successfully',
        data: {
          ...vitals,
          patientName: `${vitals.patient.firstName} ${vitals.patient.lastName}`,
          doctorId,
          doctorName,
          alerts: alerts.length > 0 ? alerts : undefined,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/nurse/patients/:patientId/vitals-history
// @desc    Get patient vitals history
// @access  Private (Nurse)
router.get(
  '/patients/:patientId/vitals-history',
  authenticate,
  authorize('NURSE'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { patientId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;

      const vitals = await prisma.vitals.findMany({
        where: {
          patientId,
          hospitalId: req.user!.hospitalId,
        },
        take: limit,
        orderBy: { recordedAt: 'desc' },
        include: {
          nurse: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      res.json({
        success: true,
        data: vitals,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/nurse/queue/:id/status
// @desc    Update queue status
// @access  Private (Nurse)
router.put(
  '/queue/:id/status',
  authenticate,
  authorize('NURSE'),
  [
    body('status').isIn(['WAITING', 'IN_VITALS', 'VITALS_DONE']).withMessage('Valid status is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const updateData: any = { status };

      if (status === 'IN_VITALS') {
        updateData.vitalsStartedAt = new Date();
      } else if (status === 'VITALS_DONE') {
        updateData.vitalsDoneAt = new Date();
      }

      const queueEntry = await prisma.queueEntry.update({
        where: { id },
        data: updateData,
      });

      res.json({
        success: true,
        message: 'Queue status updated',
        data: queueEntry,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
