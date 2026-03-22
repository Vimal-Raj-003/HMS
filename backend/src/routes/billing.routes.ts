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

// @route   GET /api/billing/bills
// @desc    Get all bills
// @access  Private (Admin)
router.get('/bills', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, patientId } = req.query;
    const hospitalId = req.user!.hospitalId;

    const whereClause: any = { hospitalId };

    if (status) {
      whereClause.status = status;
    }

    if (patientId) {
      whereClause.patientId = patientId;
    }

    const bills = await prisma.bill.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
            patientNumber: true,
          },
        },
        items: true,
        payments: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: bills,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/billing/bills/:id
// @desc    Get bill by ID
// @access  Private
router.get('/bills/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const bill = await prisma.bill.findFirst({
      where: {
        id: req.params.id,
        hospitalId: req.user!.hospitalId,
      },
      include: {
        patient: true,
        items: true,
        payments: true,
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

// @route   POST /api/billing/bills
// @desc    Create bill
// @access  Private (Admin)
router.post(
  '/bills',
  authenticate,
  authorize('ADMIN'),
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('billType').isIn(['consultation', 'lab', 'pharmacy', 'ipd']).withMessage('Valid bill type is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = req.user!.hospitalId;
      const { patientId, billType, referenceId, items, discount, dueDate } = req.body;

      // Calculate totals
      let subtotal = 0;
      for (const item of items) {
        subtotal += item.rate * item.quantity;
      }

      const discountAmount = discount || 0;
      const taxableAmount = subtotal - discountAmount;
      const tax = taxableAmount * 0.18; // 18% GST on discounted amount
      const totalAmount = taxableAmount + tax;

      // Generate bill number
      const count = await prisma.bill.count({ where: { hospitalId } });
      const billNumber = `INV-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

      // Create bill
      const bill = await prisma.bill.create({
        data: {
          id: undefined,
          hospitalId,
          patientId,
          billNumber,
          billType,
          referenceId,
          subtotal,
          discount: discountAmount,
          tax,
          totalAmount,
          balanceDue: totalAmount,
          dueDate: dueDate ? new Date(dueDate) : null,
        },
      });

      // Create bill items
      for (const item of items) {
        await prisma.billItem.create({
          data: {
            id: undefined,
            billId: bill.id,
            itemType: item.itemType,
            description: item.description,
            quantity: item.quantity,
            rate: item.rate,
            amount: item.rate * item.quantity,
          },
        });
      }

      res.status(201).json({
        success: true,
        message: 'Bill created successfully',
        data: { billId: bill.id, billNumber },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/billing/bills/:id/payment
// @desc    Process payment for bill
// @access  Private (Admin)
router.post(
  '/bills/:id/payment',
  authenticate,
  authorize('ADMIN'),
  [
    body('paymentMethod').isIn(['cash', 'upi', 'card', 'netbanking']).withMessage('Valid payment method is required'),
    body('amount').isFloat({ min: 0.01 }).withMessage('Valid amount is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const { paymentMethod, amount, transactionId, notes } = req.body;
      const hospitalId = req.user!.hospitalId;

      const bill = await prisma.bill.findFirst({
        where: { id, hospitalId },
      });

      if (!bill) {
        throw ApiError.notFound('Bill not found', 'BILL_NOT_FOUND');
      }

      // Generate payment number
      const count = await prisma.payment.count({ where: { hospitalId } });
      const paymentNumber = `PAY-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;

      // Create payment record
      const payment = await prisma.payment.create({
        data: {
          id: undefined,
          hospitalId,
          patientId: bill.patientId,
          billId: id,
          paymentNumber,
          amount,
          paymentMethod,
          transactionId,
          status: 'completed',
          notes,
          receivedBy: req.user!.id,
        },
      });

      // Update bill
      const newAmountPaid = bill.amountPaid.toNumber() + amount;
      const newBalanceDue = bill.totalAmount.toNumber() - newAmountPaid;
      
      await prisma.bill.update({
        where: { id },
        data: {
          amountPaid: newAmountPaid,
          balanceDue: newBalanceDue,
          status: newBalanceDue <= 0 ? 'paid' : 'partial',
        },
      });

      res.json({
        success: true,
        message: 'Payment processed successfully',
        data: {
          paymentId: payment.id,
          paymentNumber,
          receiptNumber: paymentNumber,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/billing/payments
// @desc    Get payments
// @access  Private (Admin)
router.get('/payments', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { startDate, endDate, method } = req.query;
    const hospitalId = req.user!.hospitalId;

    const whereClause: any = { hospitalId };

    if (startDate && endDate) {
      whereClause.createdAt = {
        gte: new Date(startDate as string),
        lte: new Date(endDate as string),
      };
    }

    if (method) {
      whereClause.paymentMethod = method;
    }

    const payments = await prisma.payment.findMany({
      where: whereClause,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    res.json({
      success: true,
      data: payments,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/billing/master-bill/:visitId
// @desc    Get master bill for visit
// @access  Private
router.get('/master-bill/:visitId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { visitId } = req.params;

    const masterBill = await prisma.masterBill.findFirst({
      where: {
        visitId,
        hospitalId: req.user!.hospitalId,
      },
      include: {
        lineItems: true,
        payments: true,
        patient: {
          select: {
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
      },
    });

    if (!masterBill) {
      throw ApiError.notFound('Master bill not found', 'MASTER_BILL_NOT_FOUND');
    }

    res.json({
      success: true,
      data: masterBill,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/billing/master-bill/:visitId/line-item
// @desc    Add line item to master bill
// @access  Private (Admin)
router.post(
  '/master-bill/:visitId/line-item',
  authenticate,
  authorize('ADMIN'),
  [
    body('itemType').isIn(['CONSULTATION', 'LAB', 'PHARMACY', 'PROCEDURE']).withMessage('Valid item type is required'),
    body('itemReference').notEmpty().withMessage('Item reference is required'),
    body('description').notEmpty().withMessage('Description is required'),
    body('rate').isFloat({ min: 0 }).withMessage('Valid rate is required'),
    body('quantity').isInt({ min: 1 }).withMessage('Valid quantity is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { visitId } = req.params;
      const { itemType, itemReference, description, rate, quantity } = req.body;
      const hospitalId = req.user!.hospitalId;

      // Find or create master bill
      let masterBill = await prisma.masterBill.findFirst({
        where: { visitId, hospitalId },
      });

      if (!masterBill) {
        const count = await prisma.masterBill.count({ where: { hospitalId } });
        const billNumber = `MB-${new Date().getFullYear()}-${String(count + 1).padStart(6, '0')}`;
        
        const visit = await prisma.patientVisit.findUnique({
          where: { id: visitId },
        });

        if (!visit) {
          throw ApiError.notFound('Visit not found', 'VISIT_NOT_FOUND');
        }

        masterBill = await prisma.masterBill.create({
          data: {
            id: undefined,
            billNumber,
            visitId,
            hospitalId,
            patientId: visit.patientId,
          },
        });
      }

      const amount = rate * quantity;

      // Create line item
      await prisma.masterBillLineItem.create({
        data: {
          id: undefined,
          masterBillId: masterBill.id,
          itemType,
          itemReference,
          description,
          quantity,
          rate,
          amount,
        },
      });

      // Update master bill totals
      const lineItems = await prisma.masterBillLineItem.findMany({
        where: { masterBillId: masterBill.id },
      });

      const subtotal = lineItems.reduce((sum, item) => sum + item.amount.toNumber(), 0);
      const existingDiscount = masterBill.discount?.toNumber() || 0;
      const taxableAmount = subtotal - existingDiscount;
      const tax = taxableAmount * 0.18;
      const totalAmount = taxableAmount + tax;

      await prisma.masterBill.update({
        where: { id: masterBill.id },
        data: {
          subtotal,
          tax,
          totalAmount,
          balanceDue: totalAmount - (masterBill.amountPaid.toNumber()),
        },
      });

      res.json({
        success: true,
        message: 'Line item added successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
