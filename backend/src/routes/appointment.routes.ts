import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';
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

// @route   POST /api/appointments
// @desc    Create appointment (online booking)
// @access  Public (with patient auth)
router.post(
  '/',
  optionalAuth,
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('doctorId').notEmpty().withMessage('Doctor ID is required'),
    body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required (HH:mm)'),
    body('chiefComplaint').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = req.tenantId || req.body.hospitalId;
      const { patientId, doctorId, appointmentDate, startTime, chiefComplaint } = req.body;

      // Check if slot is available
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          hospitalId,
          doctorId,
          appointmentDate: new Date(appointmentDate),
          startTime,
          status: { not: 'CANCELLED' },
        },
      });

      if (existingAppointment) {
        throw ApiError.conflict('This slot is already booked', 'SLOT_UNAVAILABLE');
      }

      // Get next token number
      const lastQueue = await prisma.queueEntry.findFirst({
        where: {
          hospitalId,
          createdAt: {
            gte: new Date(new Date(appointmentDate).setHours(0, 0, 0, 0)),
          },
        },
        orderBy: { queueNumber: 'desc' },
      });
      const tokenNumber = (lastQueue?.queueNumber || 0) + 1;

      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          id: undefined,
          hospitalId,
          patientId,
          doctorId,
          appointmentDate: new Date(appointmentDate),
          startTime,
          status: 'SCHEDULED',
          type: 'ONLINE',
          tokenNumber,
          chiefComplaint,
        },
        include: {
          patient: true,
          doctor: {
            select: {
              firstName: true,
              lastName: true,
              specialty: true,
            },
          },
        },
      });

      // Create queue entry
      await prisma.queueEntry.create({
        data: {
          id: undefined,
          hospitalId,
          appointmentId: appointment.id,
          patientId,
          doctorId,
          queueNumber: tokenNumber,
          status: 'WAITING',
          originalPosition: tokenNumber,
          currentPosition: tokenNumber,
        },
      });

      // Create notification for the doctor
      const patientName = `${appointment.patient.firstName} ${appointment.patient.lastName}`;
      const formattedDate = new Date(appointmentDate).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
      
      const notificationMessage = `New appointment booked by patient ${patientName} for ${formattedDate} at ${startTime}.`;
      
      await prisma.notification.create({
        data: {
          id: undefined,
          hospitalId,
          userId: doctorId,
          type: 'APPOINTMENT',
          title: 'New Appointment Booked',
          message: notificationMessage,
          data: JSON.stringify({
            appointmentId: appointment.id,
            patientId,
            patientName,
            appointmentDate,
            appointmentTime: startTime,
            chiefComplaint,
            type: 'NEW_APPOINTMENT',
          }),
          isRead: false,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Appointment booked successfully',
        data: {
          appointment,
          tokenNumber,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/appointments/:id
// @desc    Get appointment by ID
// @access  Private
router.get('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointment = await prisma.appointment.findFirst({
      where: {
        id: req.params.id,
        hospitalId: req.user!.hospitalId,
      },
      include: {
        patient: true,
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
            qualifications: true,
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

// @route   PUT /api/appointments/:id/cancel
// @desc    Cancel appointment
// @access  Private
router.put(
  '/:id/cancel',
  authenticate,
  [
    body('reason').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
    const { id } = req.params;
    const { reason } = req.body;

    const appointment = await prisma.appointment.findFirst({
      where: { id, hospitalId: req.user!.hospitalId },
    });

    if (!appointment) {
      throw ApiError.notFound('Appointment not found', 'APPOINTMENT_NOT_FOUND');
    }

    if (appointment.status === 'CANCELLED') {
      throw ApiError.badRequest('Appointment is already cancelled', 'ALREADY_CANCELLED');
    }

    // Check if cancellation is within allowed time (24 hours before)
    const appointmentTime = new Date(appointment.appointmentDate);
    const hoursDiff = (appointmentTime.getTime() - Date.now()) / (1000 * 60 * 60);
    
    if (hoursDiff < 24) {
      throw ApiError.badRequest('Cannot cancel within 24 hours of appointment', 'CANCELLATION_NOT_ALLOWED');
    }

    const updatedAppointment = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date(),
        cancelledReason: reason,
      },
    });

    // Update queue entry
    await prisma.queueEntry.updateMany({
      where: { appointmentId: id },
      data: { status: 'CANCELLED' },
    });

    res.json({
      success: true,
      message: 'Appointment cancelled successfully',
      data: updatedAppointment,
    });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/appointments/:id/reschedule
// @desc    Reschedule appointment
// @access  Private
router.put(
  '/:id/reschedule',
  authenticate,
  [
    body('appointmentDate').isISO8601().withMessage('Valid appointment date is required'),
    body('startTime').matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/).withMessage('Valid start time is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { appointmentDate, startTime } = req.body;

      const appointment = await prisma.appointment.findFirst({
        where: { id, hospitalId: req.user!.hospitalId },
      });

      if (!appointment) {
        throw ApiError.notFound('Appointment not found', 'APPOINTMENT_NOT_FOUND');
      }

      // Check if new slot is available
      const existingAppointment = await prisma.appointment.findFirst({
        where: {
          hospitalId: req.user!.hospitalId,
          doctorId: appointment.doctorId,
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
      });

      res.json({
        success: true,
        message: 'Appointment rescheduled successfully',
        data: updatedAppointment,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/appointments/patient/:patientId
// @desc    Get patient's appointments
// @access  Private
router.get('/patient/:patientId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const appointments = await prisma.appointment.findMany({
      where: {
        patientId: req.params.patientId,
        hospitalId: req.user!.hospitalId,
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
      orderBy: [{ appointmentDate: 'desc' }, { startTime: 'desc' }],
      take: 20,
    });

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
