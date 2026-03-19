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

// Helper function to get status counts
const getStatusCounts = async (hospitalId: string) => {
  const [ordered, sampleCollected, processing, completed] = await Promise.all([
    prisma.labOrder.count({ where: { hospitalId, status: 'ordered' } }),
    prisma.labOrder.count({ where: { hospitalId, status: 'sample_collected' } }),
    prisma.labOrder.count({ where: { hospitalId, status: 'processing' } }),
    prisma.labOrder.count({ where: { hospitalId, status: 'completed' } }),
  ]);
  return { ordered, sampleCollected, processing, completed };
};

// @route   GET /api/lab/dashboard-stats
// @desc    Get lab dashboard statistics
// @access  Private (Lab Tech)
router.get('/dashboard-stats', authenticate, authorize('LAB_TECH'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get counts for each status
    const [pendingOrders, samplesCollected, resultsPending, completedToday, criticalAlerts] = await Promise.all([
      prisma.labOrder.count({
        where: { hospitalId, status: 'ordered' },
      }),
      prisma.labOrder.count({
        where: { hospitalId, status: 'sample_collected' },
      }),
      prisma.labOrder.count({
        where: { hospitalId, status: 'processing' },
      }),
      prisma.labOrder.count({
        where: { hospitalId, status: 'completed', updatedAt: { gte: today } },
      }),
      prisma.labOrderItem.count({
        where: {
          order: { hospitalId },
          isCritical: true,
        },
      }),
    ]);

    // Calculate today's revenue from lab billing
    const todayRevenueResult = await prisma.labBilling.aggregate({
      where: {
        hospitalId,
        createdAt: { gte: today },
        paymentStatus: { in: ['paid', 'partial'] },
      },
      _sum: {
        finalAmount: true,
      },
    });

    res.json({
      success: true,
      data: {
        pendingOrders,
        samplesCollected,
        resultsPending,
        completedToday,
        criticalAlerts,
        todayRevenue: Number(todayRevenueResult._sum.finalAmount || 0),
      },
    });
  } catch (error) {
    console.error('[Lab Dashboard] Error:', error);
    next(error);
  }
});

// @route   GET /api/lab/orders
// @desc    Get lab orders
// @access  Private (Lab Tech)
router.get('/orders', authenticate, authorize('LAB_TECH'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, priority, search } = req.query;
    const hospitalId = req.user!.hospitalId;

    const whereClause: any = { hospitalId };

    if (status && status !== 'all') {
      whereClause.status = status;
    }

    if (priority && priority !== 'all') {
      whereClause.priority = priority;
    }

    if (search) {
      whereClause.OR = [
        { patient: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search as string, mode: 'insensitive' } } },
        { patient: { patientNumber: { contains: search as string, mode: 'insensitive' } } },
        { orderNumber: { contains: search as string, mode: 'insensitive' } },
      ];
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
        sample: true,
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });

    // Transform data for frontend compatibility
    const transformedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      patientId: order.patientId,
      patientName: `${order.patient.firstName} ${order.patient.lastName}`,
      patientNumber: order.patient.patientNumber,
      patient: order.patient,
      doctorName: order.doctor ? `Dr. ${order.doctor.firstName} ${order.doctor.lastName}` : 'N/A',
      doctor: order.doctor,
      orderedAt: order.createdAt.toISOString(),
      priority: order.priority.toUpperCase(),
      status: order.status.toUpperCase(),
      tests: order.items.map(item => ({
        id: item.id,
        testId: item.testId,
        name: item.test.name,
        code: item.test.code,
        category: item.test.category,
        status: item.status.toUpperCase(),
        resultValue: item.resultValue,
        unit: item.unit,
        referenceRange: item.referenceRange,
        interpretation: item.interpretation,
        isCritical: item.isCritical,
      })),
      sample: order.sample,
      notes: order.notes,
    }));

    res.json({
      success: true,
      data: transformedOrders,
    });
  } catch (error) {
    console.error('[Lab Orders] Error:', error);
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
        sample: true,
        billing: true,
      },
    });

    if (!order) {
      throw ApiError.notFound('Lab order not found', 'ORDER_NOT_FOUND');
    }

    // Transform data for frontend compatibility
    const transformedOrder = {
      id: order.id,
      orderNumber: order.orderNumber,
      patientId: order.patientId,
      patientName: `${order.patient.firstName} ${order.patient.lastName}`,
      patientNumber: order.patient.patientNumber,
      patient: order.patient,
      doctorName: order.doctor ? `Dr. ${order.doctor.firstName} ${order.doctor.lastName}` : 'N/A',
      doctor: order.doctor,
      orderedAt: order.createdAt.toISOString(),
      priority: order.priority.toUpperCase(),
      status: order.status.toUpperCase(),
      tests: order.items.map(item => ({
        id: item.id,
        testId: item.testId,
        name: item.test.name,
        code: item.test.code,
        category: item.test.category,
        sampleType: item.test.description || 'Blood',
        status: item.status.toUpperCase(),
        resultValue: item.resultValue,
        unit: item.unit,
        referenceRange: item.referenceRange,
        interpretation: item.interpretation,
        isCritical: item.isCritical,
        parameters: item.test.parameters,
      })),
      sample: order.sample,
      billing: order.billing,
      notes: order.notes,
    };

    res.json({
      success: true,
      data: transformedOrder,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/lab/orders
// @desc    Create a new lab order (manual creation by lab tech)
// @access  Private (Lab Tech)
router.post(
  '/orders',
  authenticate,
  authorize('LAB_TECH'),
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('testIds').isArray({ min: 1 }).withMessage('At least one test is required'),
    body('priority').optional().isIn(['normal', 'urgent', 'critical']),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { patientId, testIds, priority = 'normal', notes, doctorId, appointmentId } = req.body;
      const hospitalId = req.user!.hospitalId;

      // Generate order number
      const labOrderCount = await prisma.labOrder.count({ where: { hospitalId } });
      const orderNumber = `LAB-${String(labOrderCount + 1).padStart(6, '0')}`;

      // Create lab order with items
      const labOrder = await prisma.labOrder.create({
        data: {
          hospitalId,
          patientId,
          doctorId,
          appointmentId,
          orderNumber,
          priority,
          status: 'ordered',
          notes,
          items: {
            create: testIds.map((testId: string) => ({
              testId,
              status: 'pending',
            })),
          },
        },
        include: {
          items: {
            include: {
              test: true,
            },
          },
        },
      });

      // Create billing for the lab order
      const totalAmount = labOrder.items.reduce((sum, item) => sum + Number(item.test.price), 0);
      const billNumber = `LB-${String(labOrderCount + 1).padStart(6, '0')}`;

      await prisma.labBilling.create({
        data: {
          hospitalId,
          patientId,
          labOrderId: labOrder.id,
          billNumber,
          totalAmount,
          discount: 0,
          tax: 0,
          finalAmount: totalAmount,
          paymentStatus: 'pending',
        },
      });

      res.status(201).json({
        success: true,
        message: 'Lab order created successfully',
        data: labOrder,
      });
    } catch (error) {
      console.error('[Lab Order Create] Error:', error);
      next(error);
    }
  }
);

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
      const { sampleType, collectionNotes } = req.body;
      const hospitalId = req.user!.hospitalId;
      const collectedBy = req.user!.id;

      // Check if order exists and belongs to hospital
      const existingOrder = await prisma.labOrder.findFirst({
        where: { id, hospitalId },
        include: { patient: true },
      });

      if (!existingOrder) {
        throw ApiError.notFound('Lab order not found', 'ORDER_NOT_FOUND');
      }

      if (existingOrder.status !== 'ordered') {
        return res.status(400).json({
          success: false,
          message: 'Sample can only be collected for orders with "ordered" status',
        });
      }

      // Generate sample ID
      const sampleCount = await prisma.labSample.count({ where: { hospitalId } });
      const sampleId = `SPL-${new Date().getFullYear()}-${String(sampleCount + 1).padStart(6, '0')}`;

      // Use transaction to update order and create sample record
      const result = await prisma.$transaction(async (tx) => {
        // Update lab order status
        const order = await tx.labOrder.update({
          where: { id },
          data: {
            status: 'sample_collected',
            sampleId,
            sampleType,
            sampleCollectedAt: new Date(),
            collectedBy,
            notes: collectionNotes,
          },
        });

        // Create lab sample record
        const sample = await tx.labSample.create({
          data: {
            hospitalId,
            labOrderId: id,
            patientId: existingOrder.patientId,
            sampleId,
            sampleType,
            collectedBy,
            status: 'collected',
            notes: collectionNotes,
          },
        });

        return { order, sample };
      });

      res.json({
        success: true,
        message: 'Sample collected successfully',
        data: {
          orderId: result.order.id,
          sampleId,
          status: result.order.status,
          sample: result.sample,
        },
      });
    } catch (error) {
      console.error('[Sample Collection] Error:', error);
      next(error);
    }
  }
);

// @route   POST /api/lab/orders/:id/start-processing
// @desc    Start processing lab order
// @access  Private (Lab Tech)
router.post(
  '/orders/:id/start-processing',
  authenticate,
  authorize('LAB_TECH'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const hospitalId = req.user!.hospitalId;

      const existingOrder = await prisma.labOrder.findFirst({
        where: { id, hospitalId },
      });

      if (!existingOrder) {
        throw ApiError.notFound('Lab order not found', 'ORDER_NOT_FOUND');
      }

      if (existingOrder.status !== 'sample_collected') {
        return res.status(400).json({
          success: false,
          message: 'Only orders with collected samples can be processed',
        });
      }

      // Update order and items status
      await prisma.$transaction([
        prisma.labOrder.update({
          where: { id },
          data: { status: 'processing' },
        }),
        prisma.labOrderItem.updateMany({
          where: { orderId: id },
          data: { status: 'in_progress' },
        }),
      ]);

      res.json({
        success: true,
        message: 'Lab order processing started',
        data: { orderId: id, status: 'processing' },
      });
    } catch (error) {
      console.error('[Start Processing] Error:', error);
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
      const hospitalId = req.user!.hospitalId;

      const order = await prisma.labOrder.findFirst({
        where: { id, hospitalId },
        include: {
          doctor: { select: { id: true } },
          patient: { select: { id: true } },
        },
      });

      if (!order) {
        throw ApiError.notFound('Lab order not found', 'ORDER_NOT_FOUND');
      }

      if (!['sample_collected', 'processing'].includes(order.status)) {
        return res.status(400).json({
          success: false,
          message: 'Results can only be submitted for orders with collected samples or in processing',
        });
      }

      // Update each result
      const criticalAlerts: any[] = [];

      for (const result of results) {
        // Determine if result is critical based on reference range
        let isCritical = result.isCritical || false;
        
        // Auto-detect critical values if reference range is provided
        if (result.referenceRange && result.resultValue) {
          const rangeMatch = result.referenceRange.match(/(\d+\.?\d*)\s*-\s*(\d+\.?\d*)/);
          if (rangeMatch) {
            const min = parseFloat(rangeMatch[1]);
            const max = parseFloat(rangeMatch[2]);
            const value = parseFloat(result.resultValue);
            if (!isNaN(value)) {
              // Critical if value is 20% beyond normal range
              const criticalLow = min * 0.8;
              const criticalHigh = max * 1.2;
              isCritical = value < criticalLow || value > criticalHigh;
            }
          }
        }

        const interpretation = result.interpretation || (isCritical ? 'critical' : 'normal');

        await prisma.labOrderItem.update({
          where: { id: result.itemId },
          data: {
            status: 'completed',
            resultValue: result.resultValue,
            unit: result.unit,
            referenceRange: result.referenceRange,
            interpretation,
            isCritical,
            technicianNotes,
            completedAt: new Date(),
            parameterResults: result.parameterResults ? JSON.stringify(result.parameterResults) : null,
          },
        });

        if (isCritical || interpretation === 'critical') {
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
      } else {
        // Update order status to processing if not already
        await prisma.labOrder.update({
          where: { id },
          data: { status: 'processing' },
        });
      }

      res.json({
        success: true,
        message: 'Results submitted successfully',
        data: {
          orderId: id,
          status: allCompleted ? 'completed' : 'processing',
          criticalAlerts,
        },
      });
    } catch (error) {
      console.error('[Submit Results] Error:', error);
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

    if (category && category !== 'all') {
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

    // Transform for frontend compatibility
    const transformedTests = tests.map(test => ({
      id: test.id,
      code: test.code,
      name: test.name,
      category: test.category,
      price: Number(test.price),
      turnaroundTime: `${test.turnaroundHours} hours`,
      turnaroundHours: test.turnaroundHours,
      description: test.description,
      sampleType: 'Blood', // Default
      preparationRequired: '',
      isActive: test.isActive,
      parameters: test.parameters,
    }));

    res.json({
      success: true,
      data: transformedTests,
    });
  } catch (error) {
    console.error('[Lab Tests] Error:', error);
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
      const hospitalId = req.user!.hospitalId;

      // Check if test code already exists
      const existingTest = await prisma.labTest.findFirst({
        where: { hospitalId, code: req.body.code },
      });

      if (existingTest) {
        return res.status(400).json({
          success: false,
          message: 'Test with this code already exists',
        });
      }

      const test = await prisma.labTest.create({
        data: {
          hospitalId,
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
      console.error('[Create Test] Error:', error);
      next(error);
    }
  }
);

// @route   PUT /api/lab/tests/:id
// @desc    Update lab test
// @access  Private (Lab Tech)
router.put(
  '/tests/:id',
  authenticate,
  authorize('LAB_TECH'),
  [
    body('name').optional().notEmpty().withMessage('Test name cannot be empty'),
    body('category').optional().notEmpty().withMessage('Category cannot be empty'),
    body('price').optional().isFloat({ min: 0 }).withMessage('Valid price is required'),
    body('turnaroundHours').optional().isInt({ min: 1 }).withMessage('Valid turnaround time is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const hospitalId = req.user!.hospitalId;

      const existingTest = await prisma.labTest.findFirst({
        where: { id, hospitalId },
      });

      if (!existingTest) {
        throw ApiError.notFound('Lab test not found', 'TEST_NOT_FOUND');
      }

      const updateData: any = {};
      if (req.body.name) updateData.name = req.body.name;
      if (req.body.category) updateData.category = req.body.category;
      if (req.body.price !== undefined) updateData.price = req.body.price;
      if (req.body.turnaroundHours) updateData.turnaroundHours = req.body.turnaroundHours;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.parameters) {
        updateData.parameters = typeof req.body.parameters === 'string' ? req.body.parameters : JSON.stringify(req.body.parameters);
      }

      const test = await prisma.labTest.update({
        where: { id },
        data: updateData,
      });

      res.json({
        success: true,
        message: 'Lab test updated successfully',
        data: test,
      });
    } catch (error) {
      console.error('[Update Test] Error:', error);
      next(error);
    }
  }
);

// @route   PATCH /api/lab/tests/:id
// @desc    Toggle lab test active status
// @access  Private (Lab Tech)
router.patch(
  '/tests/:id',
  authenticate,
  authorize('LAB_TECH'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { isActive } = req.body;
      const hospitalId = req.user!.hospitalId;

      const existingTest = await prisma.labTest.findFirst({
        where: { id, hospitalId },
      });

      if (!existingTest) {
        throw ApiError.notFound('Lab test not found', 'TEST_NOT_FOUND');
      }

      const test = await prisma.labTest.update({
        where: { id },
        data: { isActive: isActive !== undefined ? isActive : !existingTest.isActive },
      });

      res.json({
        success: true,
        message: `Lab test ${test.isActive ? 'activated' : 'deactivated'} successfully`,
        data: test,
      });
    } catch (error) {
      console.error('[Toggle Test] Error:', error);
      next(error);
    }
  }
);

// @route   DELETE /api/lab/tests/:id
// @desc    Delete lab test (soft delete by setting isActive to false)
// @access  Private (Lab Tech)
router.delete(
  '/tests/:id',
  authenticate,
  authorize('LAB_TECH'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const hospitalId = req.user!.hospitalId;

      const existingTest = await prisma.labTest.findFirst({
        where: { id, hospitalId },
      });

      if (!existingTest) {
        throw ApiError.notFound('Lab test not found', 'TEST_NOT_FOUND');
      }

      // Check if test is being used in any orders
      const usageCount = await prisma.labOrderItem.count({
        where: { testId: id },
      });

      if (usageCount > 0) {
        // Soft delete - just deactivate
        await prisma.labTest.update({
          where: { id },
          data: { isActive: false },
        });

        return res.json({
          success: true,
          message: 'Lab test deactivated (cannot delete as it is being used in orders)',
        });
      }

      // Hard delete if not used
      await prisma.labTest.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Lab test deleted successfully',
      });
    } catch (error) {
      console.error('[Delete Test] Error:', error);
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

// @route   GET /api/lab/samples/pending
// @desc    Get pending samples for collection
// @access  Private (Lab Tech)
router.get('/samples/pending', authenticate, authorize('LAB_TECH'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;

    const pendingOrders = await prisma.labOrder.findMany({
      where: {
        hospitalId,
        status: 'ordered',
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
        items: {
          include: {
            test: {
              select: {
                name: true,
                code: true,
                category: true,
              },
            },
          },
        },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'asc' },
      ],
    });

    const transformedOrders = pendingOrders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      patientId: order.patientId,
      patientName: `${order.patient.firstName} ${order.patient.lastName}`,
      patientNumber: order.patient.patientNumber,
      patient: order.patient,
      priority: order.priority.toUpperCase(),
      tests: order.items.map(item => ({
        id: item.id,
        name: item.test.name,
        code: item.test.code,
        category: item.test.category,
        sampleType: 'Blood', // Default
      })),
      createdAt: order.createdAt.toISOString(),
    }));

    res.json({
      success: true,
      data: transformedOrders,
    });
  } catch (error) {
    console.error('[Pending Samples] Error:', error);
    next(error);
  }
});

// @route   GET /api/lab/results/pending
// @desc    Get orders with collected samples awaiting results
// @access  Private (Lab Tech)
router.get('/results/pending', authenticate, authorize('LAB_TECH'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;

    const pendingResults = await prisma.labOrder.findMany({
      where: {
        hospitalId,
        status: { in: ['sample_collected', 'processing'] },
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
        items: {
          include: {
            test: {
              select: {
                name: true,
                code: true,
                category: true,
                parameters: true,
              },
            },
          },
        },
        sample: true,
      },
      orderBy: [
        { priority: 'desc' },
        { sampleCollectedAt: 'asc' },
      ],
    });

    const transformedOrders = pendingResults.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      patientId: order.patientId,
      patientName: `${order.patient.firstName} ${order.patient.lastName}`,
      patientNumber: order.patient.patientNumber,
      patient: order.patient,
      priority: order.priority.toUpperCase(),
      status: order.status.toUpperCase(),
      sample: order.sample,
      tests: order.items.map(item => ({
        id: item.id,
        testId: item.testId,
        name: item.test.name,
        code: item.test.code,
        category: item.test.category,
        status: item.status.toUpperCase(),
        parameters: item.test.parameters,
        resultValue: item.resultValue,
        unit: item.unit,
        referenceRange: item.referenceRange,
        interpretation: item.interpretation,
        isCritical: item.isCritical,
      })),
      sampleCollectedAt: order.sampleCollectedAt?.toISOString(),
    }));

    res.json({
      success: true,
      data: transformedOrders,
    });
  } catch (error) {
    console.error('[Pending Results] Error:', error);
    next(error);
  }
});

export default router;
