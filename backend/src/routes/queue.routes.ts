import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';
import prisma from '../config/database';
import { emitQueueUpdate, emitPatientCalled } from '../socket';
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

// @route   GET /api/queue
// @desc    Get all queue entries
// @access  Private
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, doctorId } = req.query;
    const hospitalId = req.user!.hospitalId;

    const whereClause: any = { hospitalId };

    if (status) {
      whereClause.status = status;
    }

    if (doctorId) {
      whereClause.doctorId = doctorId;
    }

    const queue = await prisma.queueEntry.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            dateOfBirth: true,
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
        appointment: {
          select: {
            chiefComplaint: true,
            type: true,
          },
        },
      },
      orderBy: [{ priority: 'desc' }, { queueNumber: 'asc' }],
    });

    // Calculate wait times
    const queueWithWaitTime = queue.map((entry) => {
      const waitTime = Math.floor(
        (new Date().getTime() - entry.createdAt.getTime()) / (1000 * 60)
      );
      return {
        ...entry,
        waitTime,
      };
    });

    res.json({
      success: true,
      data: queueWithWaitTime,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/queue/:id/call
// @desc    Call patient from queue
// @access  Private (Doctor, Nurse)
router.post(
  '/:id/call',
  authenticate,
  authorize('DOCTOR', 'NURSE', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const hospitalId = req.user!.hospitalId;

      const queueEntry = await prisma.queueEntry.findFirst({
        where: { id, hospitalId },
        include: { patient: true },
      });

      if (!queueEntry) {
        throw ApiError.notFound('Queue entry not found', 'QUEUE_ENTRY_NOT_FOUND');
      }

      // Update queue status
      const updatedEntry = await prisma.queueEntry.update({
        where: { id },
        data: {
          status: 'CALLED',
          calledAt: new Date(),
        },
      });

      // Emit socket event
      if (io) {
        emitPatientCalled(io, hospitalId, {
          patientId: queueEntry.patientId,
          tokenNumber: queueEntry.queueNumber,
        });
      }

      res.json({
        success: true,
        message: `Token #${queueEntry.queueNumber} called`,
        data: updatedEntry,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/queue/:id/start-consultation
// @desc    Start consultation (mark as with-doctor)
// @access  Private (Doctor)
router.post(
  '/:id/start-consultation',
  authenticate,
  authorize('DOCTOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const queueEntry = await prisma.queueEntry.update({
        where: { id },
        data: {
          status: 'WITH_DOCTOR',
          doctorStartedAt: new Date(),
        },
      });

      // Update appointment status
      if (queueEntry.appointmentId) {
        await prisma.appointment.update({
          where: { id: queueEntry.appointmentId },
          data: { status: 'IN_PROGRESS' },
        });
      }

      res.json({
        success: true,
        message: 'Consultation started',
        data: queueEntry,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/queue/:id/complete
// @desc    Complete consultation
// @access  Private (Doctor)
router.post(
  '/:id/complete',
  authenticate,
  authorize('DOCTOR'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const queueEntry = await prisma.queueEntry.update({
        where: { id },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });

      // Update appointment status
      if (queueEntry.appointmentId) {
        await prisma.appointment.update({
          where: { id: queueEntry.appointmentId },
          data: { status: 'COMPLETED' },
        });
      }

      res.json({
        success: true,
        message: 'Consultation completed',
        data: queueEntry,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/queue/:id/hold
// @desc    Put patient on hold
// @access  Private (Doctor, Admin)
router.post(
  '/:id/hold',
  authenticate,
  authorize('DOCTOR', 'ADMIN'),
  [
    body('reason').notEmpty().withMessage('Reason is required'),
    body('estimatedReturnMinutes').optional().isInt({ min: 1 }),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reason, estimatedReturnMinutes } = req.body;

      const queueEntry = await prisma.queueEntry.findFirst({
        where: { id, hospitalId: req.user!.hospitalId },
      });

      if (!queueEntry) {
        throw ApiError.notFound('Queue entry not found', 'QUEUE_ENTRY_NOT_FOUND');
      }

      const updatedEntry = await prisma.queueEntry.update({
        where: { id },
        data: {
          status: 'HOLD',
          holdCount: { increment: 1 },
          holdReason: reason,
          holdStartedAt: new Date(),
        },
      });

      res.json({
        success: true,
        message: 'Patient put on hold',
        data: updatedEntry,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/queue/:id/resume
// @desc    Resume patient from hold
// @access  Private (Doctor, Admin)
router.post(
  '/:id/resume',
  authenticate,
  authorize('DOCTOR', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;

      const queueEntry = await prisma.queueEntry.update({
        where: { id },
        data: {
          status: 'WAITING',
          holdReason: null,
          holdStartedAt: null,
        },
      });

      res.json({
        success: true,
        message: 'Patient resumed',
        data: queueEntry,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/queue/:id/skip
// @desc    Skip patient token
// @access  Private (Doctor, Admin)
router.post(
  '/:id/skip',
  authenticate,
  authorize('DOCTOR', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const hospitalId = req.user!.hospitalId;

      const queueEntry = await prisma.queueEntry.findFirst({
        where: { id, hospitalId },
      });

      if (!queueEntry) {
        throw ApiError.notFound('Queue entry not found', 'QUEUE_ENTRY_NOT_FOUND');
      }

      // Calculate new position based on skip count
      const skipCount = queueEntry.skipCount + 1;
      let pushBackPositions = 3;
      
      if (skipCount === 2) pushBackPositions = 5;
      if (skipCount >= 3) pushBackPositions = 10;

      // Get current queue length
      const queueLength = await prisma.queueEntry.count({
        where: {
          hospitalId,
          status: { in: ['WAITING', 'VITALS_DONE'] },
        },
      });

      const newPosition = Math.min(
        (queueEntry.currentPosition || queueEntry.queueNumber) + pushBackPositions,
        queueLength
      );

      const updatedEntry = await prisma.queueEntry.update({
        where: { id },
        data: {
          status: 'SKIPPED',
          skipCount: { increment: 1 },
          currentPosition: newPosition,
        },
      });

      res.json({
        success: true,
        message: `Token #${queueEntry.queueNumber} skipped`,
        data: {
          queueEntryId: updatedEntry.id,
          tokenNumber: queueEntry.queueNumber,
          newPosition,
          skipCount,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/queue/:id/priority
// @desc    Update queue priority
// @access  Private (Admin)
router.put(
  '/:id/priority',
  authenticate,
  authorize('ADMIN'),
  [
    body('priority').isInt({ min: 0, max: 10 }).withMessage('Priority must be between 0 and 10'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { priority } = req.body;

      const queueEntry = await prisma.queueEntry.update({
        where: { id },
        data: { priority },
      });

      res.json({
        success: true,
        message: 'Priority updated',
        data: queueEntry,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/queue/:id/transfer
// @desc    Transfer patient to another doctor
// @access  Private (Admin)
router.post(
  '/:id/transfer',
  authenticate,
  authorize('ADMIN'),
  [
    body('doctorId').notEmpty().withMessage('Target doctor ID is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { doctorId } = req.body;
      const hospitalId = req.user!.hospitalId;

      // Verify target doctor exists
      const doctor = await prisma.user.findFirst({
        where: { id: doctorId, hospitalId, role: 'DOCTOR' },
      });

      if (!doctor) {
        throw ApiError.notFound('Target doctor not found', 'DOCTOR_NOT_FOUND');
      }

      const queueEntry = await prisma.queueEntry.update({
        where: { id },
        data: {
          doctorId,
          status: 'WAITING',
        },
      });

      // Update appointment if exists
      if (queueEntry.appointmentId) {
        await prisma.appointment.update({
          where: { id: queueEntry.appointmentId },
          data: { doctorId },
        });
      }

      res.json({
        success: true,
        message: 'Patient transferred successfully',
        data: queueEntry,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
