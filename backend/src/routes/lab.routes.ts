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

    console.log('[Lab Dashboard] Fetching stats for hospital:', hospitalId);

    // Get counts for each status - include 'recommended' and 'ordered' as pending
    const [pendingOrders, samplesCollected, resultsPending, completedToday, criticalAlerts, recommendedOrders] = await Promise.all([
      prisma.labOrder.count({
        where: { hospitalId, status: { in: ['ordered', 'recommended'] } },
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
      prisma.labOrder.count({
        where: { hospitalId, status: 'recommended' },
      }),
    ]);

    console.log('[Lab Dashboard] Stats:', { pendingOrders, recommendedOrders, samplesCollected, resultsPending, completedToday, criticalAlerts });

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
        recommendedOrders,
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
      const statusStr = status as string;
      if (statusStr.includes(',')) {
        whereClause.status = { in: statusStr.split(',').map(s => s.trim()) };
      } else {
        whereClause.status = statusStr;
      }
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

      // Accept both 'ordered' and 'recommended' statuses for sample collection
      if (!['ordered', 'recommended'].includes(existingOrder.status)) {
        return res.status(400).json({
          success: false,
          message: 'Sample can only be collected for orders with "ordered" or "recommended" status',
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

        // Create DB notifications (matching Path B pattern for NotificationBell visibility)
        if (order.patientId) {
          await prisma.notification.create({
            data: {
              hospitalId,
              userId: order.patientId,
              type: 'LAB_RESULT_READY',
              title: 'Lab Report Ready',
              message: 'Your lab test results are now available.',
              data: JSON.stringify({ orderId: id }),
            },
          });
        }
        if (order.doctorId) {
          await prisma.notification.create({
            data: {
              hospitalId,
              userId: order.doctorId,
              type: 'LAB_RESULT_READY',
              title: 'Lab Result Available',
              message: 'Lab results for your patient are available for review.',
              data: JSON.stringify({ orderId: id, patientId: order.patientId }),
            },
          });
        }

        // Notify doctor and patient via socket
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

// ============================================
// LAB RECOMMENDATION ENDPOINTS (Doctor -> Lab)
// ============================================

// @route   POST /api/lab/recommend
// @desc    Doctor recommends lab tests for a patient
// @access  Private (Doctor)
router.post(
  '/recommend',
  authenticate,
  authorize('DOCTOR'),
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('appointmentId').notEmpty().withMessage('Appointment ID is required'),
    body('testList').isArray({ min: 1 }).withMessage('At least one test is required'),
    body('notes').optional().isString(),
    body('isUrgent').optional().isBoolean(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { patientId, appointmentId, testList, notes, isUrgent } = req.body;
      const doctorId = req.user!.id;
      const hospitalId = req.user!.hospitalId;

      // Check for duplicate lab orders for this appointment
      const existingOrder = await prisma.labOrder.findFirst({
        where: {
          hospitalId,
          appointmentId,
          status: { in: ['recommended', 'ordered', 'sample_collected', 'processing'] },
        },
      });

      if (existingOrder) {
        return res.status(400).json({
          success: false,
          message: 'Lab order already exists for this appointment',
        });
      }

      // Generate order number
      const labOrderCount = await prisma.labOrder.count({ where: { hospitalId } });
      const orderNumber = `LAB-${String(labOrderCount + 1).padStart(6, '0')}`;

      // Get or create consultation
      let consultation = await prisma.consultation.findFirst({
        where: { appointmentId },
      });

      // Create lab order with recommended status
      const labOrder = await prisma.labOrder.create({
        data: {
          hospitalId,
          patientId,
          doctorId,
          appointmentId,
          consultationId: consultation?.id,
          orderNumber,
          priority: isUrgent ? 'urgent' : 'normal',
          status: 'recommended',
          isUrgent: isUrgent || false,
          notes,
          items: {
            create: testList.map((test: { testId: string; testName: string; testCategory?: string }) => ({
              testId: test.testId,
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
          patient: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              patientNumber: true,
            },
          },
        },
      });

      // Create notification for patient
      await prisma.notification.create({
        data: {
          hospitalId,
          userId: patientId,
          type: 'LAB_TEST_RECOMMENDED',
          title: 'Lab Test Recommended',
          message: `Your doctor has recommended lab tests. Please visit the lab for sample collection.`,
          data: JSON.stringify({
            orderId: labOrder.id,
            orderNumber: labOrder.orderNumber,
            appointmentId,
          }),
        },
      });

      // Emit real-time notification
      if (io) {
        io.to(`user:${patientId}`).emit('notification', {
          type: 'LAB_TEST_RECOMMENDED',
          title: 'Lab Test Recommended',
          message: 'Your doctor has recommended lab tests.',
          data: { orderId: labOrder.id },
        });

        // Notify lab dashboard
        io.to(`hospital:${hospitalId}:role:LAB_TECH`).emit('new-lab-order', {
          orderId: labOrder.id,
          orderNumber: labOrder.orderNumber,
          patientName: `${labOrder.patient.firstName} ${labOrder.patient.lastName}`,
          priority: labOrder.priority,
        });
      }

      res.status(201).json({
        success: true,
        message: 'Lab tests recommended successfully',
        data: {
          id: labOrder.id,
          orderNumber: labOrder.orderNumber,
          status: labOrder.status,
          tests: labOrder.items.map(item => ({
            id: item.id,
            name: item.test.name,
            code: item.test.code,
          })),
        },
      });
    } catch (error) {
      console.error('[Lab Recommend] Error:', error);
      next(error);
    }
  }
);

// @route   POST /api/lab/orders/:id/accept
// @desc    Lab accepts a recommended order
// @access  Private (Lab Tech)
router.post(
  '/orders/:id/accept',
  authenticate,
  authorize('LAB_TECH'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const hospitalId = req.user!.hospitalId;

      const order = await prisma.labOrder.findFirst({
        where: { id, hospitalId },
        include: { patient: true },
      });

      if (!order) {
        throw ApiError.notFound('Lab order not found', 'ORDER_NOT_FOUND');
      }

      if (order.status !== 'recommended') {
        return res.status(400).json({
          success: false,
          message: 'Only recommended orders can be accepted',
        });
      }

      // Update status to assigned (ordered)
      const updatedOrder = await prisma.labOrder.update({
        where: { id },
        data: { status: 'ordered' },
      });

      // Notify patient
      await prisma.notification.create({
        data: {
          hospitalId,
          userId: order.patientId,
          type: 'LAB_ORDER_ACCEPTED',
          title: 'Lab Order Accepted',
          message: 'Your lab test order has been accepted. Please proceed for sample collection.',
          data: JSON.stringify({ orderId: id }),
        },
      });

      if (io) {
        io.to(`user:${order.patientId}`).emit('notification', {
          type: 'LAB_ORDER_ACCEPTED',
          title: 'Lab Order Accepted',
          message: 'Your lab test order has been accepted.',
        });
      }

      res.json({
        success: true,
        message: 'Lab order accepted successfully',
        data: { orderId: id, status: updatedOrder.status },
      });
    } catch (error) {
      console.error('[Lab Accept] Error:', error);
      next(error);
    }
  }
);

// @route   POST /api/lab/result
// @desc    Lab submits test results with optional file
// @access  Private (Lab Tech)
router.post(
  '/result',
  authenticate,
  authorize('LAB_TECH'),
  [
    body('labOrderId').notEmpty().withMessage('Lab order ID is required'),
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('resultData').notEmpty().withMessage('Result data is required'),
    body('fileUrl').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { labOrderId, patientId, resultData, fileUrl, fileType, notes } = req.body;
      const hospitalId = req.user!.hospitalId;
      const createdBy = req.user!.id;

      // Verify order exists and belongs to hospital
      const order = await prisma.labOrder.findFirst({
        where: { id: labOrderId, hospitalId },
        include: {
          items: { include: { test: true } },
          doctor: true
        },
      });

      if (!order) {
        throw ApiError.notFound('Lab order not found', 'ORDER_NOT_FOUND');
      }

      // SECURITY: Always use the doctor ID from the verified lab order.
      // Never accept doctorId from request body as it could be spoofed.
      const verifiedDoctorId = order.doctorId;

      // Parse result data if string
      const parsedResultData = typeof resultData === 'string' ? resultData : JSON.stringify(resultData);

      // Create lab result
      const labResult = await prisma.labResult.create({
        data: {
          labOrderId,
          patientId,
          doctorId: verifiedDoctorId,
          testName: order.items.map(i => i.test?.name || i.testId).join(', '),
          resultData: parsedResultData,
          fileUrl,
          fileType,
          status: 'completed',
          notes,
          createdBy,
        },
      });

      // Update lab order status to completed
      await prisma.labOrder.update({
        where: { id: labOrderId },
        data: {
          status: 'completed',
          reportUrl: fileUrl,
        },
      });

      // Update all order items to completed
      await prisma.labOrderItem.updateMany({
        where: { orderId: labOrderId },
        data: { status: 'completed', completedAt: new Date() },
      });

      // Notify patient
      await prisma.notification.create({
        data: {
          hospitalId,
          userId: patientId,
          type: 'LAB_RESULT_READY',
          title: 'Lab Report Ready',
          message: 'Your lab test results are now available. You can view or download your report.',
          data: JSON.stringify({ orderId: labOrderId, resultId: labResult.id }),
        },
      });

      // Notify doctor
      if (order.doctorId) {
        await prisma.notification.create({
          data: {
            hospitalId,
            userId: order.doctorId,
            type: 'LAB_RESULT_READY',
            title: 'Lab Result Available',
            message: `Lab results for patient are now available for review.`,
            data: JSON.stringify({ orderId: labOrderId, resultId: labResult.id, patientId }),
          },
        });
      }

      // Real-time notifications
      if (io) {
        io.to(`user:${patientId}`).emit('notification', {
          type: 'LAB_RESULT_READY',
          title: 'Lab Report Ready',
          message: 'Your lab test results are now available.',
          data: { orderId: labOrderId, resultId: labResult.id },
        });

        if (order.doctorId) {
          io.to(`user:${order.doctorId}`).emit('notification', {
            type: 'LAB_RESULT_READY',
            title: 'Lab Result Available',
            message: 'Lab results for your patient are available.',
            data: { orderId: labOrderId, patientId },
          });
        }

        emitLabResultReady(io, patientId, order.doctorId || '', { orderId: labOrderId });
      }

      res.status(201).json({
        success: true,
        message: 'Lab results submitted successfully',
        data: {
          resultId: labResult.id,
          orderId: labOrderId,
          status: 'completed',
        },
      });
    } catch (error) {
      console.error('[Lab Result] Error:', error);
      next(error);
    }
  }
);

// @route   GET /api/lab/results/:patientId
// @desc    Get lab results for a specific patient
// @access  Private (Patient, Doctor, Lab Tech)
router.get(
  '/results/:patientId',
  authenticate,
  authorize('PATIENT', 'DOCTOR', 'LAB_TECH', 'PHARMACIST', 'ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { patientId } = req.params;
      const hospitalId = req.user!.hospitalId;
      const userRole = req.user!.role;
      const userId = req.user!.id;

      // Authorization check - patients can only see their own results
      if (userRole === 'PATIENT' && userId !== patientId) {
        throw ApiError.forbidden('You can only view your own lab results', 'ACCESS_DENIED');
      }

      // Get all lab results for the patient
      const labResults = await prisma.labResult.findMany({
        where: { patientId },
        include: {
          labOrder: {
            include: {
              doctor: {
                select: {
                  firstName: true,
                  lastName: true,
                  specialty: true,
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
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const transformedResults = labResults.map(result => ({
        id: result.id,
        orderId: result.labOrderId,
        orderNumber: result.labOrder.orderNumber,
        date: result.createdAt.toISOString(),
        testName: result.testName,
        tests: result.labOrder.items.map(item => ({
          id: item.id,
          name: item.test.name,
          code: item.test.code,
          category: item.test.category,
          status: item.status,
          resultValue: item.resultValue,
          unit: item.unit,
          referenceRange: item.referenceRange,
          interpretation: item.interpretation,
        })),
        resultData: result.resultData,
        reportFileUrl: result.fileUrl,
        reportFileType: result.fileType,
        status: result.status.toUpperCase(),
        doctorName: result.labOrder.doctor
          ? `Dr. ${result.labOrder.doctor.firstName} ${result.labOrder.doctor.lastName}`
          : 'N/A',
        notes: result.notes,
      }));

      res.json({
        success: true,
        data: transformedResults,
      });
    } catch (error) {
      console.error('[Get Lab Results] Error:', error);
      next(error);
    }
  }
);

// @route   GET /api/lab/tests/catalog
// @desc    Get lab test catalog (public for doctors/patients)
// @access  Private
router.get('/tests/catalog', authenticate, async (req: Request, res: Response, next: NextFunction) => {
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

    const transformedTests = tests.map(test => ({
      id: test.id,
      code: test.code,
      name: test.name,
      category: test.category,
      price: Number(test.price),
      turnaroundHours: test.turnaroundHours,
      description: test.description,
      parameters: test.parameters,
    }));

    res.json({
      success: true,
      data: transformedTests,
    });
  } catch (error) {
    console.error('[Lab Test Catalog] Error:', error);
    next(error);
  }
});

export default router;
