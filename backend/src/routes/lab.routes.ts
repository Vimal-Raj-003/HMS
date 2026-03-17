import { Router, Request, Response, NextFunction } from 'express';
import { body, query, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';
import prisma from '../config/database';
import { emitLabResultReady } from '../socket';
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

// @route   GET /api/lab/dashboard-stats
// @desc    Get lab dashboard statistics
// @access  Private (Lab Tech)
router.get('/dashboard-stats', authenticate, authorize('LAB_TECH'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [pendingOrders, samplesCollected, resultsPending, completedToday, criticalAlerts, todayRevenueResult] = await Promise.all([
      prisma.labOrder.count({
        where: { hospitalId, status: 'pending' },
      }),
      prisma.labOrder.count({
        where: { hospitalId, status: 'sample_collected' },
      }),
      prisma.labOrder.count({
        where: { hospitalId, status: 'in_progress' },
      }),
      prisma.labOrder.count({
        where: { hospitalId, status: 'completed', updatedAt: { gte: today } },
      }),
      prisma.labOrderItem.count({
        where: {
          order: { hospitalId },
          interpretation: 'critical',
        },
      }),
      prisma.labOrder.count({
        where: { hospitalId, status: 'completed', updatedAt: { gte: today } },
      }),
    ]);

    res.json({
      success: true,
      data: {
        pendingOrders,
        samplesCollected,
        resultsPending,
        completedToday,
        criticalAlerts,
        todayRevenue: 0, // Calculate from lab test prices
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/lab/orders
// @desc    Get lab orders
// @access  Private (Lab Tech)
router.get('/orders', authenticate, authorize('LAB_TECH'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, priority } = req.query;
    const hospitalId = req.user!.hospitalId;

    const whereClause: any = { hospitalId };

    if (status) {
      whereClause.status = status;
    }

    if (priority) {
      whereClause.priority = priority;
    }

    const orders = await prisma.labOrder.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            patientNumber: true,
          },
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        items: {
          include: {
            test: true,
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    res.json({
      success: true,
      data: orders,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/lab/orders/:id
// @desc    Get lab order by ID
// @access  Private (Lab Tech)
router.get('/orders/:id', authenticate, authorize('LAB_TECH'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const order = await prisma.labOrder.findFirst({
      where: {
        id: req.params.id,
        hospitalId: req.user!.hospitalId,
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
            gender: true,
          },
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        items: {
          include: {
            test: true,
          },
        },
      },
    });

    if (!order) {
      throw ApiError.notFound('Lab order not found', 'ORDER_NOT_FOUND');
    }

    res.json({
      success: true,
      data: order,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/lab/orders/:id/collect-sample
// @desc    Collect sample for lab order
// @access  Private (Lab Tech)
router.post(
  '/orders/:id/collect-sample',
  authenticate,
  authorize('LAB_TECH'),
  [
    body('sampleType').notEmpty().withMessage('Sample type is required'),
    body('fastingStatus').optional().isBoolean(),
    body('collectionNotes').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { sampleType, fastingStatus, collectionNotes } = req.body;

      // Generate sample ID
      const count = await prisma.labOrder.count({
        where: { hospitalId: req.user!.hospitalId },
      });
      const sampleId = `SPL-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

      const order = await prisma.labOrder.update({
        where: { id },
        data: {
          status: 'sample_collected',
          sampleId,
          sampleType,
          sampleCollectedAt: new Date(),
          collectedBy: req.user!.id,
          notes: collectionNotes,
        },
      });

      res.json({
        success: true,
        message: 'Sample collected successfully',
        data: {
          orderId: order.id,
          sampleId,
          status: order.status,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/lab/orders/:id/results
// @desc    Submit lab results
// @access  Private (Lab Tech)
router.post(
  '/orders/:id/results',
  authenticate,
  authorize('LAB_TECH'),
  [
    body('results').isArray({ min: 1 }).withMessage('Results are required'),
    body('technicianNotes').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
    const { results, technicianNotes } = req.body;

    const order = await prisma.labOrder.findFirst({
      where: { id, hospitalId: req.user!.hospitalId },
      include: {
        doctor: { select: { id: true } },
        patient: { select: { id: true } },
      },
    });

    if (!order) {
      throw ApiError.notFound('Lab order not found', 'ORDER_NOT_FOUND');
    }

    // Update each result
    const criticalAlerts: any[] = [];

    for (const result of results) {
      const interpretation = result.interpretation || 'normal';
      
      await prisma.labOrderItem.update({
        where: { id: result.itemId },
        data: {
          status: 'completed',
          resultValue: result.resultValue,
          unit: result.unit,
          referenceRange: result.referenceRange,
          interpretation,
          technicianNotes,
          completedAt: new Date(),
          parameterResults: result.parameterResults ? JSON.stringify(result.parameterResults) : null,
        },
      });

      if (interpretation === 'critical') {
        criticalAlerts.push({
          test: result.testName,
          value: result.resultValue,
          normalRange: result.referenceRange,
        });
      }
    }

    // Check if all items are completed
    const allItems = await prisma.labOrderItem.findMany({
      where: { orderId: id },
    });

    const allCompleted = allItems.every((item) => item.status === 'completed');

    if (allCompleted) {
      await prisma.labOrder.update({
        where: { id },
        data: {
          status: 'completed',
        },
      });

      // Notify doctor and patient
      if (io && order.doctorId && order.patientId) {
        emitLabResultReady(io, order.patientId, order.doctorId, { orderId: id });
      }
    }

    res.json({
      success: true,
      message: 'Results submitted successfully',
      data: {
        orderId: id,
        status: allCompleted ? 'completed' : 'in_progress',
        criticalAlerts,
      },
    });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/lab/tests
// @desc    Get lab test catalog
// @access  Private (Lab Tech)
router.get('/tests', authenticate, authorize('LAB_TECH'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category, search } = req.query;
    const hospitalId = req.user!.hospitalId;

    const whereClause: any = { hospitalId, isActive: true };

    if (category) {
      whereClause.category = category;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const tests = await prisma.labTest.findMany({
      where: whereClause,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
    });

    res.json({
      success: true,
      data: tests,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/lab/tests
// @desc    Create lab test
// @access  Private (Lab Tech)
router.post(
  '/tests',
  authenticate,
  authorize('LAB_TECH'),
  [
    body('code').notEmpty().withMessage('Test code is required'),
    body('name').notEmpty().withMessage('Test name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('turnaroundHours').isInt({ min: 1 }).withMessage('Turnaround time is required'),
    body('parameters').notEmpty().withMessage('Parameters are required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const test = await prisma.labTest.create({
        data: {
          id: undefined,
          hospitalId: req.user!.hospitalId,
          code: req.body.code,
          name: req.body.name,
          category: req.body.category,
          price: req.body.price,
          turnaroundHours: req.body.turnaroundHours,
          description: req.body.description,
          parameters: typeof req.body.parameters === 'string' ? req.body.parameters : JSON.stringify(req.body.parameters),
        },
      });

      res.status(201).json({
        success: true,
        message: 'Lab test created successfully',
        data: test,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/lab/categories
// @desc    Get lab test categories
// @access  Private (Lab Tech)
router.get('/categories', authenticate, authorize('LAB_TECH'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const categories = await prisma.labTest.groupBy({
      by: ['category'],
      where: {
        hospitalId: req.user!.hospitalId,
        isActive: true,
      },
      _count: true,
    });

    res.json({
      success: true,
      data: categories.map((c) => ({
        name: c.category,
        count: c._count,
      })),
    });
  } catch (error) {
    next(error);
  }
});

export default router;
