import { Router, Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';
import prisma from '../config/database';
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

// ============================================
// DASHBOARD STATISTICS
// ============================================

// @route   GET /api/pharmacy/dashboard-stats
// @desc    Get pharmacy dashboard statistics
// @access  Private (Pharmacist)
router.get('/dashboard-stats', authenticate, authorize('PHARMACIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const [
      pendingPrescriptions,
      todaySalesResult,
      lowStockItems,
      expiringItems,
      recentTransactions,
      monthlySales,
      topSellingMedicines,
    ] = await Promise.all([
      // Pending prescriptions count
      prisma.prescription.count({
        where: { hospitalId, status: { in: ['pending', 'partial'] } },
      }),
      
      // Today's sales
      prisma.pharmacyBill.aggregate({
        where: { 
          hospitalId, 
          createdAt: { gte: today },
          paymentStatus: { not: 'refunded' }
        },
        _sum: { totalAmount: true },
      }),
      
      // Low stock items
      prisma.inventory.count({
        where: {
          medicine: { hospitalId },
          quantity: { lte: prisma.inventory.fields.reorderLevel },
        },
      }),
      
      // Expiring within 60 days
      prisma.inventory.count({
        where: {
          medicine: { hospitalId },
          expiryDate: { lte: sixtyDaysFromNow, gte: new Date() },
        },
      }),
      
      // Recent transactions
      prisma.pharmacyDispense.findMany({
        where: { hospitalId },
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          patient: {
            select: { firstName: true, lastName: true, patientNumber: true },
          },
        },
      }),
      
      // Monthly sales
      prisma.pharmacyBill.aggregate({
        where: {
          hospitalId,
          createdAt: { gte: new Date(new Date().setDate(1)) }, // First day of current month
          paymentStatus: { not: 'refunded' }
        },
        _sum: { totalAmount: true },
      }),
      
      // Top selling medicines (last 30 days)
      prisma.pharmacyBillItem.groupBy({
        by: ['medicineId', 'medicineName'],
        where: {
          bill: {
            hospitalId,
            createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
          },
        },
        _sum: { quantity: true, totalPrice: true },
        orderBy: { _sum: { quantity: 'desc' } },
        take: 5,
      }),
    ]);

    res.json({
      success: true,
      data: {
        pendingPrescriptions,
        todaySales: todaySalesResult._sum.totalAmount || 0,
        lowStockItems,
        expiringItems,
        monthlySales: monthlySales._sum.totalAmount || 0,
        recentTransactions: recentTransactions.map((t) => ({
          id: t.id,
          dispenseNumber: t.dispenseNumber,
          patientName: `${t.patient.firstName} ${t.patient.lastName}`,
          patientNumber: t.patient.patientNumber,
          amount: t.finalAmount,
          time: t.createdAt,
        })),
        topSellingMedicines: topSellingMedicines.map((m) => ({
          medicineId: m.medicineId,
          medicineName: m.medicineName,
          totalQuantity: m._sum.quantity || 0,
          totalRevenue: m._sum.totalPrice || 0,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// PATIENT SEARCH (for manual billing)
// ============================================

// @route   GET /api/pharmacy/patients/search
// @desc    Search patients for manual billing
// @access  Private (Pharmacist)
router.get('/patients/search', authenticate, authorize('PHARMACIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;
    const hospitalId = req.user!.hospitalId;

    if (!search || (search as string).trim().length < 2) {
      return res.json({ success: true, data: [] });
    }

    const patients = await prisma.patient.findMany({
      where: {
        hospitalId,
        OR: [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { patientNumber: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string } },
        ],
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        patientNumber: true,
        phone: true,
        dateOfBirth: true,
        gender: true,
      },
      take: 10,
      orderBy: { firstName: 'asc' },
    });

    res.json({ success: true, data: patients });
  } catch (error) {
    next(error);
  }
});

// ============================================
// DOCTOR SEARCH (for manual billing)
// ============================================

// @route   GET /api/pharmacy/doctors/search
// @desc    Search doctors for manual billing
// @access  Private (Pharmacist)
router.get('/doctors/search', authenticate, authorize('PHARMACIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search } = req.query;
    const hospitalId = req.user!.hospitalId;

    const whereClause: any = {
      hospitalId,
      role: 'DOCTOR',
      isActive: true,
    };

    if (search && (search as string).trim().length >= 2) {
      whereClause.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { specialty: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const doctors = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        specialty: true,
      },
      take: 10,
      orderBy: { firstName: 'asc' },
    });

    res.json({ success: true, data: doctors });
  } catch (error) {
    next(error);
  }
});

// ============================================
// PRESCRIPTION MANAGEMENT
// ============================================

// @route   GET /api/pharmacy/prescriptions/pending
// @desc    Get pending prescriptions queue
// @access  Private (Pharmacist)
router.get('/prescriptions/pending', authenticate, authorize('PHARMACIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, search } = req.query;
    const hospitalId = req.user!.hospitalId;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = {
      hospitalId,
      status: { in: ['pending', 'partial'] },
    };

    if (search) {
      whereClause.OR = [
        { patient: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search as string, mode: 'insensitive' } } },
        { patient: { patientNumber: { contains: search as string, mode: 'insensitive' } } },
        { prescriptionNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [prescriptions, total] = await Promise.all([
      prisma.prescription.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
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
          consultation: {
            select: {
              provisionalDiagnosis: true,
            },
          },
          items: {
            include: {
              medicine: {
                select: {
                  id: true,
                  name: true,
                  genericName: true,
                  price: true,
                  category: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.prescription.count({ where: whereClause }),
    ]);

    // Add stock availability info for each prescription item
    const prescriptionsWithStock = await Promise.all(
      prescriptions.map(async (prescription) => {
        const itemsWithStock = await Promise.all(
          prescription.items.map(async (item) => {
            // Check if any inventory batch has stock for this medicine
            const inventoryBatches = await prisma.inventory.findMany({
              where: {
                medicineId: item.medicineId,
                hospitalId,
                quantity: { gt: 0 },
              },
              orderBy: { expiryDate: 'asc' },
            });
            const totalAvailable = inventoryBatches.reduce((sum, inv) => sum + inv.quantity, 0);
            // Use inventory MRP as price (most accurate), fall back to medicine.price
            const bestBatch = inventoryBatches[0] || null;
            const medicinePrice = Number(item.medicine.price) || 0;
            const inventoryMRP = bestBatch?.mrp ? Number(bestBatch.mrp) : 0;
            const unitPrice = inventoryMRP > 0 ? inventoryMRP : medicinePrice;
            return {
              ...item,
              available: totalAvailable >= item.quantity,
              availableQuantity: totalAvailable,
              unitPrice,
            };
          })
        );
        return {
          ...prescription,
          items: itemsWithStock,
        };
      })
    );

    res.json({
      success: true,
      data: {
        prescriptions: prescriptionsWithStock,
        pagination: {
          total,
          page: Number(page),
          limit: Number(limit),
          pages: Math.ceil(total / Number(limit)),
        },
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/pharmacy/prescriptions/:id
// @desc    Get prescription by ID with full details
// @access  Private (Pharmacist)
router.get('/prescriptions/:id', authenticate, authorize('PHARMACIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const prescription = await prisma.prescription.findFirst({
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
            address: true,
          },
        },
        doctor: {
          select: {
            firstName: true,
            lastName: true,
            specialty: true,
            phone: true,
          },
        },
        consultation: {
          select: {
            provisionalDiagnosis: true,
            finalDiagnosis: true,
            advice: true,
          },
        },
        items: {
          include: {
            medicine: {
              include: {
                inventory: {
                  where: { quantity: { gt: 0 } },
                  orderBy: { expiryDate: 'asc' },
                },
              },
            },
          },
        },
      },
    });

    if (!prescription) {
      throw ApiError.notFound('Prescription not found', 'PRESCRIPTION_NOT_FOUND');
    }

    // Add stock availability and batch info
    const itemsWithDetails = prescription.items.map((item) => {
      const availableBatches = item.medicine.inventory.filter(
        (inv) => inv.quantity >= item.quantity
      );
      const suggestedBatch = availableBatches[0] || item.medicine.inventory[0] || null;
      // Use inventory MRP as price (most accurate), fall back to medicine.price
      const medicinePrice = Number(item.medicine.price) || 0;
      const inventoryMRP = suggestedBatch?.mrp ? Number(suggestedBatch.mrp) : 0;
      const unitPrice = inventoryMRP > 0 ? inventoryMRP : medicinePrice;

      return {
        ...item,
        available: availableBatches.length > 0,
        availableQuantity: item.medicine.inventory.reduce((sum, inv) => sum + inv.quantity, 0),
        unitPrice,
        suggestedBatch,
      };
    });

    res.json({
      success: true,
      data: {
        ...prescription,
        items: itemsWithDetails,
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// MEDICINE MANAGEMENT
// ============================================

// @route   GET /api/pharmacy/medicines
// @desc    Get all medicines with inventory info
// @access  Private (Pharmacist)
router.get('/medicines', authenticate, authorize('PHARMACIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { search, category, page = 1, limit = 50 } = req.query;
    const hospitalId = req.user!.hospitalId;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = { hospitalId, isActive: true };

    if (search) {
      whereClause.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { genericName: { contains: search as string, mode: 'insensitive' } },
        { brand: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    if (category) {
      whereClause.category = category;
    }

    const [medicines, total] = await Promise.all([
      prisma.medicine.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
        include: {
          inventory: {
            where: { quantity: { gt: 0 } },
            orderBy: { expiryDate: 'asc' },
          },
        },
        orderBy: { name: 'asc' },
      }),
      prisma.medicine.count({ where: whereClause }),
    ]);

    // Calculate total stock for each medicine
    const medicinesWithStock = medicines.map((medicine) => ({
      ...medicine,
      totalStock: medicine.inventory.reduce((sum, inv) => sum + inv.quantity, 0),
      nearestExpiry: medicine.inventory.length > 0 ? medicine.inventory[0].expiryDate : null,
    }));

    res.json({
      success: true,
      data: medicinesWithStock,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/pharmacy/medicines
// @desc    Create a new medicine
// @access  Private (Pharmacist)
router.post(
  '/medicines',
  authenticate,
  authorize('PHARMACIST'),
  [
    body('name').notEmpty().withMessage('Medicine name is required'),
    body('category').notEmpty().withMessage('Category is required'),
    body('unit').notEmpty().withMessage('Unit is required'),
    body('price').isFloat({ min: 0 }).withMessage('Valid price is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = req.user!.hospitalId;
      
      const medicine = await prisma.medicine.create({
        data: {
          id: undefined,
          hospitalId,
          name: req.body.name,
          genericName: req.body.genericName,
          brand: req.body.brand,
          molecule: req.body.molecule,
          category: req.body.category,
          dosageForm: req.body.dosageForm,
          strength: req.body.strength,
          unit: req.body.unit,
          price: req.body.price,
          gstPercentage: req.body.gstPercentage || 5,
          requiresPrescription: req.body.requiresPrescription || false,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Medicine created successfully',
        data: medicine,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/pharmacy/medicines/:id/substitutes
// @desc    Get medicine substitutes
// @access  Private (Pharmacist)
router.get('/medicines/:id/substitutes', authenticate, authorize('PHARMACIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const medicine = await prisma.medicine.findFirst({
      where: {
        id: req.params.id,
        hospitalId: req.user!.hospitalId,
      },
    });

    if (!medicine) {
      throw ApiError.notFound('Medicine not found', 'MEDICINE_NOT_FOUND');
    }

    // Find brand substitutes (same molecule)
    const brandSubstitutes = await prisma.medicine.findMany({
      where: {
        hospitalId: req.user!.hospitalId,
        molecule: medicine.molecule,
        id: { not: medicine.id },
        isActive: true,
      },
      include: {
        inventory: {
          where: { quantity: { gt: 0 } },
        },
      },
    });

    res.json({
      success: true,
      data: {
        medicine: {
          id: medicine.id,
          name: medicine.name,
          molecule: medicine.molecule,
        },
        brandSubstitutes: brandSubstitutes.map((s) => ({
          id: s.id,
          name: s.name,
          molecule: s.molecule,
          price: s.price,
          stock: s.inventory.reduce((sum, i) => sum + i.quantity, 0),
          requiresApproval: false,
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// INVENTORY MANAGEMENT
// ============================================

// @route   GET /api/pharmacy/inventory
// @desc    Get inventory with filters
// @access  Private (Pharmacist)
router.get('/inventory', authenticate, authorize('PHARMACIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { lowStock, expiring, outOfStock, search, page = 1, limit = 50 } = req.query;
    const hospitalId = req.user!.hospitalId;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = {
      medicine: { hospitalId },
    };

    if (lowStock === 'true') {
      whereClause.quantity = { lte: prisma.inventory.fields.reorderLevel, gt: 0 };
    }

    if (outOfStock === 'true') {
      whereClause.quantity = 0;
    }

    if (expiring === 'true') {
      const sixtyDaysFromNow = new Date();
      sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);
      whereClause.expiryDate = { lte: sixtyDaysFromNow, gte: new Date() };
    }

    if (search) {
      whereClause.medicine = {
        ...whereClause.medicine,
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { genericName: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }

    const [inventory, total] = await Promise.all([
      prisma.inventory.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
        include: {
          medicine: true,
        },
        orderBy: { expiryDate: 'asc' },
      }),
      prisma.inventory.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      data: inventory,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/pharmacy/inventory
// @desc    Add new inventory (Stock In)
// @access  Private (Pharmacist)
router.post(
  '/inventory',
  authenticate,
  authorize('PHARMACIST'),
  [
    body('medicineId').notEmpty().withMessage('Medicine ID is required'),
    body('batchNumber').notEmpty().withMessage('Batch number is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be positive'),
    body('expiryDate').isISO8601().withMessage('Valid expiry date is required'),
    body('purchasePrice').isFloat({ min: 0 }).withMessage('Valid purchase price is required'),
    body('mrp').isFloat({ min: 0 }).withMessage('Valid MRP is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = req.user!.hospitalId;
      const userId = req.user!.id;
      const { medicineId, batchNumber, quantity, expiryDate, purchasePrice, mrp, supplier, location, reorderLevel } = req.body;

      // Check if batch already exists
      const existingInventory = await prisma.inventory.findFirst({
        where: {
          medicineId,
          batchNumber,
        },
      });

      let inventory;
      if (existingInventory) {
        // Update existing inventory
        inventory = await prisma.inventory.update({
          where: { id: existingInventory.id },
          data: {
            quantity: { increment: quantity },
            purchasePrice,
            mrp,
            supplier,
            location,
          },
        });
      } else {
        // Create new inventory
        inventory = await prisma.inventory.create({
          data: {
            id: undefined,
            hospitalId,
            medicineId,
            batchNumber,
            quantity,
            reorderLevel: reorderLevel || 10,
            expiryDate: new Date(expiryDate),
            purchasePrice,
            mrp,
            supplier,
            location,
          },
        });
      }

      // Log stock transaction
      await prisma.pharmacyStockTransaction.create({
        data: {
          id: undefined,
          hospitalId,
          medicineId,
          inventoryId: inventory.id,
          transactionType: 'IN',
          quantity,
          referenceType: 'purchase',
          batchNumber,
          notes: `Stock added - Batch: ${batchNumber}`,
          createdBy: userId,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Inventory added successfully',
        data: inventory,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/pharmacy/inventory/:id
// @desc    Update inventory item
// @access  Private (Pharmacist)
router.put(
  '/inventory/:id',
  authenticate,
  authorize('PHARMACIST'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { reorderLevel, location, supplier } = req.body;

      const inventory = await prisma.inventory.update({
        where: { id },
        data: {
          reorderLevel,
          location,
          supplier,
        },
      });

      res.json({
        success: true,
        message: 'Inventory updated successfully',
        data: inventory,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/pharmacy/inventory/:id/restock
// @desc    Restock existing inventory
// @access  Private (Pharmacist)
router.post(
  '/inventory/:id/restock',
  authenticate,
  authorize('PHARMACIST'),
  [
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be positive'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { quantity } = req.body;
      const hospitalId = req.user!.hospitalId;
      const userId = req.user!.id;

      const inventory = await prisma.inventory.findFirst({
        where: { id, medicine: { hospitalId } },
        include: { medicine: true },
      });

      if (!inventory) {
        throw ApiError.notFound('Inventory item not found', 'INVENTORY_NOT_FOUND');
      }

      // Update inventory quantity
      const updatedInventory = await prisma.inventory.update({
        where: { id },
        data: { quantity: { increment: quantity } },
      });

      // Log stock transaction
      await prisma.pharmacyStockTransaction.create({
        data: {
          id: undefined,
          hospitalId,
          medicineId: inventory.medicineId,
          inventoryId: inventory.id,
          transactionType: 'IN',
          quantity,
          referenceType: 'purchase',
          batchNumber: inventory.batchNumber,
          notes: `Restock - Added ${quantity} units`,
          createdBy: userId,
        },
      });

      res.json({
        success: true,
        message: 'Inventory restocked successfully',
        data: updatedInventory,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/pharmacy/inventory/alerts
// @desc    Get inventory alerts (low stock and expiring)
// @access  Private (Pharmacist)
router.get('/inventory/alerts', authenticate, authorize('PHARMACIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const sixtyDaysFromNow = new Date();
    sixtyDaysFromNow.setDate(sixtyDaysFromNow.getDate() + 60);

    const [lowStock, expiringSoon, outOfStock] = await Promise.all([
      // Low stock items
      prisma.inventory.findMany({
        where: {
          medicine: { hospitalId },
          quantity: { lte: prisma.inventory.fields.reorderLevel, gt: 0 },
        },
        include: { medicine: true },
        orderBy: { quantity: 'asc' },
      }),
      
      // Expiring soon
      prisma.inventory.findMany({
        where: {
          medicine: { hospitalId },
          expiryDate: { lte: sixtyDaysFromNow, gte: new Date() },
        },
        include: { medicine: true },
        orderBy: { expiryDate: 'asc' },
      }),
      
      // Out of stock
      prisma.inventory.findMany({
        where: {
          medicine: { hospitalId },
          quantity: 0,
        },
        include: { medicine: true },
      }),
    ]);

    res.json({
      success: true,
      data: {
        lowStock: lowStock.map((item) => ({
          ...item,
          alertType: 'low_stock',
          daysUntilExpiry: Math.ceil((item.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        })),
        expiringSoon: expiringSoon.map((item) => ({
          ...item,
          alertType: 'expiring_soon',
          daysUntilExpiry: Math.ceil((item.expiryDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
        })),
        outOfStock: outOfStock.map((item) => ({
          ...item,
          alertType: 'out_of_stock',
        })),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// DISPENSING & BILLING
// ============================================

// @route   POST /api/pharmacy/dispense
// @desc    Dispense medicines and generate bill
// @access  Private (Pharmacist)
router.post(
  '/dispense',
  authenticate,
  authorize('PHARMACIST'),
  [
    body('prescriptionId').optional().isString(),
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('items.*.medicineId').notEmpty().withMessage('Medicine ID is required for each item'),
    body('items.*.quantity').isInt({ min: 1 }).withMessage('Valid quantity is required for each item'),
    body('paymentMethod').isIn(['cash', 'upi', 'card', 'netbanking']).withMessage('Valid payment method is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = req.user!.hospitalId;
      const pharmacistId = req.user!.id;
      const { prescriptionId, patientId, items, paymentMethod, discount = 0, notes, doctorId } = req.body;

      // ====================================================================
      // PHASE 1: Validate & prepare all data OUTSIDE the transaction (reads only)
      // This avoids consuming transaction time on read queries.
      // ====================================================================
      let subtotal = 0;
      let totalCgst = 0;
      let totalSgst = 0;
      const dispenseItems: any[] = [];
      const billItems: any[] = [];
      const stockUpdates: any[] = [];

      for (const item of items) {
        const medicine = await prisma.medicine.findFirst({
          where: { id: item.medicineId, hospitalId },
          include: {
            inventory: {
              where: { quantity: { gte: item.quantity } },
              orderBy: { expiryDate: 'asc' },
              take: 1,
            },
          },
        });

        if (!medicine) {
          throw ApiError.badRequest(`Medicine not found: ${item.medicineId}`, 'MEDICINE_NOT_FOUND');
        }

        if (medicine.inventory.length === 0) {
          throw ApiError.badRequest(`Insufficient stock for ${medicine.name}`, 'INSUFFICIENT_STOCK');
        }

        const inventoryItem = medicine.inventory[0];
        const inventoryMRP = inventoryItem.mrp ? Number(inventoryItem.mrp) : 0;
        const medicineBasePrice = Number(medicine.price) || 0;
        const unitPrice = item.unitPrice || (inventoryMRP > 0 ? inventoryMRP : medicineBasePrice);
        const itemTotal = unitPrice * item.quantity;
        subtotal += itemTotal;

        const gstPercent = medicine.gstPercentage ? Number(medicine.gstPercentage) : 5;
        const itemCgst = itemTotal * (gstPercent / 2) / 100;
        const itemSgst = itemTotal * (gstPercent / 2) / 100;
        totalCgst += itemCgst;
        totalSgst += itemSgst;

        dispenseItems.push({
          medicineId: item.medicineId,
          quantity: item.quantity,
          batchNumber: inventoryItem.batchNumber,
          expiryDate: inventoryItem.expiryDate,
          rate: unitPrice,
          amount: itemTotal,
          originalMedicineId: item.originalMedicineId,
          substitutionType: item.substitutionType,
          substitutionReason: item.substitutionReason,
        });

        billItems.push({
          medicineId: item.medicineId,
          medicineName: medicine.name,
          quantity: item.quantity,
          unitPrice,
          totalPrice: itemTotal,
          batchNumber: inventoryItem.batchNumber,
          expiryDate: inventoryItem.expiryDate,
        });

        stockUpdates.push({
          inventoryId: inventoryItem.id,
          quantity: item.quantity,
          medicineId: item.medicineId,
        });
      }

      const tax = Math.round((totalCgst + totalSgst) * 100) / 100;
      const finalAmount = subtotal + tax - discount;

      // Pre-generate sequential numbers outside transaction
      const dispenseCount = await prisma.pharmacyDispense.count({ where: { hospitalId } });
      const billCount = await prisma.pharmacyBill.count({ where: { hospitalId } });
      const dispenseNumber = `DSP-${String(dispenseCount + 1).padStart(6, '0')}`;
      const billNumber = `PHB-${new Date().getFullYear()}-${String(billCount + 1).padStart(6, '0')}`;

      // ====================================================================
      // PHASE 2: Write-only transaction (fast — only creates and updates)
      // ====================================================================
      const result = await prisma.$transaction(async (tx) => {
        // Create dispense record
        const dispense = await tx.pharmacyDispense.create({
          data: {
            hospitalId,
            patientId,
            prescriptionId,
            dispenseNumber,
            totalAmount: subtotal,
            discount,
            tax,
            finalAmount,
            paymentStatus: 'paid',
            dispensedBy: pharmacistId,
            notes,
          },
        });

        // Batch create dispense items
        await tx.dispensingItem.createMany({
          data: dispenseItems.map(item => ({
            dispenseId: dispense.id,
            medicineId: item.medicineId,
            quantity: item.quantity,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
            rate: item.rate,
            amount: item.amount,
            originalMedicineId: item.originalMedicineId,
            substitutionType: item.substitutionType,
            substitutionReason: item.substitutionReason,
          })),
        });

        // Create bill
        const bill = await tx.pharmacyBill.create({
          data: {
            hospitalId,
            patientId,
            prescriptionId,
            dispenseId: dispense.id,
            billNumber,
            subtotal,
            discount,
            tax,
            totalAmount: finalAmount,
            paymentMethod,
            paymentStatus: 'paid',
            createdBy: pharmacistId,
          },
        });

        // Batch create bill items
        await tx.pharmacyBillItem.createMany({
          data: billItems.map(item => ({
            billId: bill.id,
            medicineId: item.medicineId,
            medicineName: item.medicineName,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            totalPrice: item.totalPrice,
            batchNumber: item.batchNumber,
            expiryDate: item.expiryDate,
          })),
        });

        // Batch create stock transactions data
        const stockTxData = stockUpdates.map(update => ({
          hospitalId,
          medicineId: update.medicineId,
          inventoryId: update.inventoryId,
          transactionType: 'OUT',
          quantity: update.quantity,
          referenceType: 'prescription',
          referenceId: dispense.id,
          notes: `Dispensed - ${dispenseNumber}`,
          createdBy: pharmacistId,
        }));

        // Update inventory (sequential — each is a single fast update)
        for (const update of stockUpdates) {
          await tx.inventory.update({
            where: { id: update.inventoryId },
            data: { quantity: { decrement: update.quantity } },
          });
        }

        // Batch create all stock transactions in one call
        await tx.pharmacyStockTransaction.createMany({ data: stockTxData });

        // Update prescription status
        if (prescriptionId) {
          await tx.prescription.update({
            where: { id: prescriptionId },
            data: { status: 'dispensed' },
          });

          const rxItemsToUpdate = items.filter((item: any) => item.prescriptionItemId);
          if (rxItemsToUpdate.length > 0) {
            await Promise.all(
              rxItemsToUpdate.map((item: any) =>
                tx.prescriptionItem.update({
                  where: { id: item.prescriptionItemId },
                  data: { isDispensed: true, dispensedQuantity: item.quantity },
                })
              )
            );
          }
        }

        return { dispense, bill, dispenseNumber, billNumber, totalCgst, totalSgst, billItems };
      });

      // Notify patient that prescription was dispensed
      try {
        await prisma.notification.create({
          data: {
            hospitalId,
            patientId,
            type: 'PRESCRIPTION_DISPENSED',
            title: 'Prescription Filled',
            message: `Your prescription has been dispensed. Bill number: ${result.billNumber}.`,
            data: JSON.stringify({
              dispenseId: result.dispense.id,
              billNumber: result.billNumber,
            }),
          },
        });
      } catch (notifError) {
        console.error('[Pharmacy] Failed to create dispense notification:', notifError);
      }

      if (io) {
        io.to(`user:${patientId}`).emit('notification', {
          type: 'PRESCRIPTION_DISPENSED',
          title: 'Prescription Filled',
          message: 'Your prescription has been dispensed.',
        });
      }

      res.status(201).json({
        success: true,
        message: 'Medicines dispensed and bill generated successfully',
        data: {
          dispenseId: result.dispense.id,
          billId: result.bill.id,
          dispenseNumber: result.dispenseNumber,
          billNumber: result.billNumber,
          subtotal: result.dispense.totalAmount,
          tax: result.dispense.tax,
          cgst: Math.round(result.totalCgst * 100) / 100,
          sgst: Math.round(result.totalSgst * 100) / 100,
          discount: result.dispense.discount,
          finalAmount: result.dispense.finalAmount,
          items: result.billItems,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// BILLING MANAGEMENT
// ============================================

// @route   GET /api/pharmacy/bills
// @desc    Get pharmacy bills
// @access  Private (Pharmacist)
router.get('/bills', authenticate, authorize('PHARMACIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, startDate, endDate, paymentStatus, search } = req.query;
    const hospitalId = req.user!.hospitalId;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = { hospitalId };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (paymentStatus) {
      whereClause.paymentStatus = paymentStatus;
    }

    if (search) {
      whereClause.OR = [
        { billNumber: { contains: search as string, mode: 'insensitive' } },
        { patient: { firstName: { contains: search as string, mode: 'insensitive' } } },
        { patient: { lastName: { contains: search as string, mode: 'insensitive' } } },
        { patient: { patientNumber: { contains: search as string, mode: 'insensitive' } } },
      ];
    }

    const [bills, total] = await Promise.all([
      prisma.pharmacyBill.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
        include: {
          patient: {
            select: {
              firstName: true,
              lastName: true,
              patientNumber: true,
              phone: true,
            },
          },
          items: {
            select: {
              medicineName: true,
              quantity: true,
              unitPrice: true,
              totalPrice: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pharmacyBill.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      data: bills,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/pharmacy/bills/:id
// @desc    Get bill by ID with full details
// @access  Private (Pharmacist)
router.get('/bills/:id', authenticate, authorize('PHARMACIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bill = await prisma.pharmacyBill.findFirst({
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
            patientNumber: true,
            phone: true,
            address: true,
          },
        },
        prescription: {
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
        items: true,
      },
    });

    if (!bill) {
      throw ApiError.notFound('Bill not found', 'BILL_NOT_FOUND');
    }

    res.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/pharmacy/bills/:id/download
// @desc    Download bill as PDF data
// @access  Private (Pharmacist)
router.get('/bills/:id/download', authenticate, authorize('PHARMACIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bill = await prisma.pharmacyBill.findFirst({
      where: {
        id: req.params.id,
        hospitalId: req.user!.hospitalId,
      },
      include: {
        patient: true,
        prescription: {
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
        items: {
          include: {
            medicine: {
              select: {
                gstPercentage: true,
                category: true,
                genericName: true,
              },
            },
          },
        },
      },
    });

    if (!bill) {
      throw ApiError.notFound('Bill not found', 'BILL_NOT_FOUND');
    }

    // Get hospital info
    const hospital = await prisma.hospital.findUnique({
      where: { id: req.user!.hospitalId },
    });

    // Enhance items with GST breakdown computed at read-time
    const enhancedItems = bill.items.map((item: any) => {
      const gstPercent = item.medicine?.gstPercentage ? Number(item.medicine.gstPercentage) : 5;
      const taxableAmount = Number(item.totalPrice);
      const cgst = Math.round(taxableAmount * (gstPercent / 2) / 100 * 100) / 100;
      const sgst = Math.round(taxableAmount * (gstPercent / 2) / 100 * 100) / 100;
      return {
        ...item,
        gstPercentage: gstPercent,
        cgst,
        sgst,
        hsnCode: '3004', // Default HSN for pharmaceutical preparations
        mrp: item.unitPrice, // Use unit price as MRP fallback
      };
    });

    // Return bill data for PDF generation on frontend
    res.json({
      success: true,
      data: {
        bill: { ...bill, items: enhancedItems },
        hospital,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// EXPENSE MANAGEMENT
// ============================================

// @route   GET /api/pharmacy/expenses
// @desc    Get pharmacy expenses
// @access  Private (Pharmacist)
router.get('/expenses', authenticate, authorize('PHARMACIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { page = 1, limit = 20, category, startDate, endDate } = req.query;
    const hospitalId = req.user!.hospitalId;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = { hospitalId };

    if (category) {
      whereClause.expenseCategory = category;
    }

    if (startDate && endDate) {
      whereClause.expenseDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const [expenses, total, totalAmount] = await Promise.all([
      prisma.pharmacyExpense.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
        orderBy: { expenseDate: 'desc' },
      }),
      prisma.pharmacyExpense.count({ where: whereClause }),
      prisma.pharmacyExpense.aggregate({
        where: whereClause,
        _sum: { amount: true },
      }),
    ]);

    res.json({
      success: true,
      data: expenses,
      summary: {
        totalAmount: totalAmount._sum.amount || 0,
      },
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/pharmacy/expenses
// @desc    Create pharmacy expense
// @access  Private (Pharmacist)
router.post(
  '/expenses',
  authenticate,
  authorize('PHARMACIST'),
  [
    body('expenseCategory').isIn(['Medicine Purchase', 'Operational Cost', 'Equipment', 'Miscellaneous']).withMessage('Valid category is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('amount').isFloat({ min: 0 }).withMessage('Valid amount is required'),
    body('expenseDate').isISO8601().withMessage('Valid date is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = req.user!.hospitalId;
      const userId = req.user!.id;

      const expense = await prisma.pharmacyExpense.create({
        data: {
          id: undefined,
          hospitalId,
          expenseCategory: req.body.expenseCategory,
          description: req.body.description,
          amount: req.body.amount,
          expenseDate: new Date(req.body.expenseDate),
          receiptNumber: req.body.receiptNumber,
          supplierName: req.body.supplierName,
          notes: req.body.notes,
          createdBy: userId,
        },
      });

      res.status(201).json({
        success: true,
        message: 'Expense recorded successfully',
        data: expense,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/pharmacy/expenses/:id
// @desc    Update pharmacy expense
// @access  Private (Pharmacist)
router.put(
  '/expenses/:id',
  authenticate,
  authorize('PHARMACIST'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const hospitalId = req.user!.hospitalId;

      const expense = await prisma.pharmacyExpense.findFirst({
        where: { id, hospitalId },
      });

      if (!expense) {
        throw ApiError.notFound('Expense not found', 'EXPENSE_NOT_FOUND');
      }

      const updatedExpense = await prisma.pharmacyExpense.update({
        where: { id },
        data: {
          expenseCategory: req.body.expenseCategory,
          description: req.body.description,
          amount: req.body.amount,
          expenseDate: req.body.expenseDate ? new Date(req.body.expenseDate) : undefined,
          receiptNumber: req.body.receiptNumber,
          supplierName: req.body.supplierName,
          notes: req.body.notes,
        },
      });

      res.json({
        success: true,
        message: 'Expense updated successfully',
        data: updatedExpense,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/pharmacy/expenses/:id
// @desc    Delete pharmacy expense
// @access  Private (Pharmacist)
router.delete('/expenses/:id', authenticate, authorize('PHARMACIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user!.hospitalId;

    const expense = await prisma.pharmacyExpense.findFirst({
      where: { id, hospitalId },
    });

    if (!expense) {
      throw ApiError.notFound('Expense not found', 'EXPENSE_NOT_FOUND');
    }

    await prisma.pharmacyExpense.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Expense deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// REPORTS
// ============================================

// @route   GET /api/pharmacy/reports/sales
// @desc    Get sales reports
// @access  Private (Pharmacist)
router.get('/reports/sales', authenticate, authorize('PHARMACIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = 'daily', startDate, endDate } = req.query;
    const hospitalId = req.user!.hospitalId;

    let groupBy: any;
    let dateFilter: any = {};

    if (startDate && endDate) {
      dateFilter = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    } else {
      switch (period) {
        case 'daily':
          dateFilter = { gte: new Date(new Date().setHours(0, 0, 0, 0)) };
          break;
        case 'weekly':
          const weekAgo = new Date();
          weekAgo.setDate(weekAgo.getDate() - 7);
          dateFilter = { gte: weekAgo };
          break;
        case 'monthly':
          const monthAgo = new Date();
          monthAgo.setMonth(monthAgo.getMonth() - 1);
          dateFilter = { gte: monthAgo };
          break;
      }
    }

    const sales = await prisma.pharmacyBill.findMany({
      where: {
        hospitalId,
        createdAt: dateFilter,
        paymentStatus: { not: 'refunded' },
      },
      include: {
        items: true,
        patient: {
          select: { firstName: true, lastName: true, patientNumber: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    const summary = {
      totalBills: sales.length,
      totalRevenue: sales.reduce((sum, bill) => sum + bill.totalAmount.toNumber(), 0),
      totalTax: sales.reduce((sum, bill) => sum + bill.tax.toNumber(), 0),
      totalDiscount: sales.reduce((sum, bill) => sum + bill.discount.toNumber(), 0),
      averageBillValue: sales.length > 0 
        ? sales.reduce((sum, bill) => sum + bill.totalAmount.toNumber(), 0) / sales.length 
        : 0,
    };

    res.json({
      success: true,
      data: {
        sales,
        summary,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/pharmacy/reports/top-medicines
// @desc    Get top selling medicines report
// @access  Private (Pharmacist)
router.get('/reports/top-medicines', authenticate, authorize('PHARMACIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { period = 'monthly', limit = 10 } = req.query;
    const hospitalId = req.user!.hospitalId;

    let dateFilter: any = {};
    switch (period) {
      case 'daily':
        dateFilter = { gte: new Date(new Date().setHours(0, 0, 0, 0)) };
        break;
      case 'weekly':
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        dateFilter = { gte: weekAgo };
        break;
      case 'monthly':
        const monthAgo = new Date();
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        dateFilter = { gte: monthAgo };
        break;
    }

    const topMedicines = await prisma.pharmacyBillItem.groupBy({
      by: ['medicineId', 'medicineName'],
      where: {
        bill: { hospitalId, createdAt: dateFilter },
      },
      _sum: {
        quantity: true,
        totalPrice: true,
      },
      _count: {
        id: true,
      },
      orderBy: {
        _sum: { totalPrice: 'desc' },
      },
      take: Number(limit),
    });

    res.json({
      success: true,
      data: topMedicines.map((m) => ({
        medicineId: m.medicineId,
        medicineName: m.medicineName,
        totalQuantity: m._sum.quantity || 0,
        totalRevenue: m._sum.totalPrice || 0,
        billCount: m._count.id,
      })),
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/pharmacy/reports/stock-transactions
// @desc    Get stock transaction report
// @access  Private (Pharmacist)
router.get('/reports/stock-transactions', authenticate, authorize('PHARMACIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, type, page = 1, limit = 50 } = req.query;
    const hospitalId = req.user!.hospitalId;
    const skip = (Number(page) - 1) * Number(limit);

    const whereClause: any = { hospitalId };

    if (type && (type === 'IN' || type === 'OUT')) {
      whereClause.transactionType = type;
    }

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    const [transactions, total] = await Promise.all([
      prisma.pharmacyStockTransaction.findMany({
        where: whereClause,
        skip,
        take: Number(limit),
        include: {
          medicine: {
            select: { name: true, genericName: true, category: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.pharmacyStockTransaction.count({ where: whereClause }),
    ]);

    res.json({
      success: true,
      data: transactions,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/pharmacy/reports/expenses
// @desc    Get expense report
// @access  Private (Pharmacist)
router.get('/reports/expenses', authenticate, authorize('PHARMACIST'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, groupBy = 'category' } = req.query;
    const hospitalId = req.user!.hospitalId;

    const whereClause: any = { hospitalId };

    if (startDate && endDate) {
      whereClause.expenseDate = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (groupBy === 'category') {
      const byCategory = await prisma.pharmacyExpense.groupBy({
        by: ['expenseCategory'],
        where: whereClause,
        _sum: { amount: true },
        _count: { id: true },
      });

      res.json({
        success: true,
        data: byCategory.map((c) => ({
          category: c.expenseCategory,
          totalAmount: c._sum.amount || 0,
          count: c._count.id,
        })),
      });
    } else {
      const expenses = await prisma.pharmacyExpense.findMany({
        where: whereClause,
        orderBy: { expenseDate: 'desc' },
      });

      res.json({
        success: true,
        data: expenses,
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router;
