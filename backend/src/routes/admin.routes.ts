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

// @route   GET /api/admin/dashboard-stats
// @desc    Get admin dashboard statistics
// @access  Private (Admin)
router.get('/dashboard-stats', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Today's stats
    const [totalPatients, newRegistrations, appointments, revenueResult, pendingBills] = await Promise.all([
      prisma.appointment.count({
        where: { hospitalId, appointmentDate: today, status: { not: 'CANCELLED' } },
      }),
      prisma.patient.count({
        where: { hospitalId, createdAt: { gte: today } },
      }),
      prisma.appointment.count({
        where: { hospitalId, appointmentDate: today },
      }),
      prisma.payment.aggregate({
        where: { hospitalId, createdAt: { gte: today }, status: 'completed' },
        _sum: { amount: true },
      }),
      prisma.bill.count({
        where: { hospitalId, status: { in: ['pending', 'partial'] } },
      }),
    ]);

    // Queue status by department
    const queueStatusRaw = await prisma.queueEntry.groupBy({
      by: ['status'],
      where: { hospitalId, status: { in: ['WAITING', 'IN_VITALS', 'WITH_DOCTOR'] } },
      _count: true,
    });

    // Transform groupBy result to match frontend expected shape: { department, waiting, inProgress }
    const waitingCount = (queueStatusRaw.find((s: any) => s.status === 'WAITING') as any)?._count ?? 0;
    const inVitalsCount = (queueStatusRaw.find((s: any) => s.status === 'IN_VITALS') as any)?._count ?? 0;
    const withDoctorCount = (queueStatusRaw.find((s: any) => s.status === 'WITH_DOCTOR') as any)?._count ?? 0;

    const queueStatus = [{
      department: 'OPD',
      waiting: waitingCount + inVitalsCount,
      inProgress: withDoctorCount,
    }];

    // Alerts
    const allInventory = await prisma.inventory.findMany({
      where: { hospitalId },
      select: { quantity: true, reorderLevel: true },
    });
    const lowStockItems = allInventory.filter(
      (item) => item.reorderLevel !== null && item.quantity <= item.reorderLevel
    ).length;

    const overdueBills = await prisma.bill.count({
      where: {
        hospitalId,
        status: 'pending',
        dueDate: { lt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    res.json({
      success: true,
      data: {
        todayStats: {
          totalPatients,
          newRegistrations,
          appointments,
          revenue: revenueResult._sum.amount || 0,
          pendingBills,
        },
        queueStatus,
        alerts: [
          ...(lowStockItems > 0 ? [{ type: 'inventory', message: `${lowStockItems} medicines below reorder level` }] : []),
          ...(overdueBills > 0 ? [{ type: 'billing', message: `${overdueBills} pending invoices over 7 days` }] : []),
        ],
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/users
// @desc    Get all staff users
// @access  Private (Admin)
router.get('/users', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { role, search } = req.query;
    const hospitalId = req.user!.hospitalId;

    const whereClause: any = { hospitalId };

    if (role) {
      whereClause.role = role;
    }

    if (search) {
      whereClause.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const users = await prisma.user.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        specialty: true,
        qualifications: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    next(error);
  }
});

// @route   POST /api/admin/users
// @desc    Create new staff user
// @access  Private (Admin)
router.post(
  '/users',
  authenticate,
  authorize('ADMIN'),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('phone').isMobilePhone('any').withMessage('Valid phone is required'),
    body('role').isIn(['ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECH', 'RECEPTIONIST']),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = req.user!.hospitalId;
      const {
        email,
        password,
        firstName,
        lastName,
        phone,
        role,
        qualifications,
        specialty,
        consultationFee,
        payoutPercentage,
        availableDays,
        availableHours,
        roomNumber,
      } = req.body;

      // Check if user exists
      const existingUser = await prisma.user.findFirst({
        where: { email, hospitalId },
      });

      if (existingUser) {
        throw ApiError.conflict('User with this email already exists', 'EMAIL_EXISTS');
      }

      // Hash password
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await prisma.user.create({
        data: {
          id: undefined,
          hospitalId,
          email,
          password: hashedPassword,
          firstName,
          lastName,
          phone,
          role,
          qualifications,
          specialty,
          consultationFee,
          payoutPercentage,
          availableDays: availableDays ? JSON.stringify(availableDays) : null,
          availableHours: availableHours ? JSON.stringify(availableHours) : null,
          roomNumber,
        },
      });

      res.status(201).json({
        success: true,
        message: 'User created successfully',
        data: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/admin/users/:id
// @desc    Update staff user
// @access  Private (Admin)
router.put(
  '/users/:id',
  authenticate,
  authorize('ADMIN'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const hospitalId = req.user!.hospitalId;

      const user = await prisma.user.findFirst({
        where: { id, hospitalId },
      });

      if (!user) {
        throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
      }

      const updateData: any = { ...req.body };
      if (req.body.availableDays) {
        updateData.availableDays = JSON.stringify(req.body.availableDays);
      }
      if (req.body.availableHours) {
        updateData.availableHours = JSON.stringify(req.body.availableHours);
      }
      delete updateData.password; // Don't update password here
      delete updateData.id;

      const updatedUser = await prisma.user.update({
        where: { id },
        data: updateData,
      });

      res.json({
        success: true,
        message: 'User updated successfully',
        data: {
          id: updatedUser.id,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   DELETE /api/admin/users/:id
// @desc    Deactivate staff user
// @access  Private (Admin)
router.delete('/users/:id', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const hospitalId = req.user!.hospitalId;

    const user = await prisma.user.findFirst({
      where: { id, hospitalId },
    });

    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    await prisma.user.update({
      where: { id },
      data: { isActive: false },
    });

    res.json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/doctors
// @desc    Get all doctors
// @access  Private (Admin)
router.get('/doctors', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const doctors = await prisma.user.findMany({
      where: {
        hospitalId: req.user!.hospitalId,
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
        isActive: true,
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

// @route   GET /api/admin/appointments
// @desc    Get all appointments
// @access  Private (Admin)
router.get('/appointments', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { date, status, doctorId } = req.query;
    const hospitalId = req.user!.hospitalId;

    const whereClause: any = { hospitalId };

    if (date) {
      whereClause.appointmentDate = new Date(date as string);
    }

    if (status) {
      whereClause.status = status;
    }

    if (doctorId) {
      whereClause.doctorId = doctorId;
    }

    const appointments = await prisma.appointment.findMany({
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
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
      },
      orderBy: [{ appointmentDate: 'desc' }, { startTime: 'asc' }],
      take: 100,
    });

    res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/queue
// @desc    Get all queue entries
// @access  Private (Admin)
router.get('/queue', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;

    const queue = await prisma.queueEntry.findMany({
      where: { hospitalId },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
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

// @route   POST /api/admin/walk-in-appointment
// @desc    Create walk-in appointment
// @access  Private (Admin, Receptionist)
router.post(
  '/walk-in-appointment',
  authenticate,
  authorize('ADMIN', 'RECEPTIONIST'),
  [
    body('patientId').notEmpty().withMessage('Patient ID is required'),
    body('doctorId').notEmpty().withMessage('Doctor ID is required'),
    body('chiefComplaint').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = req.user!.hospitalId;
      const { patientId, doctorId, chiefComplaint } = req.body;
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Get next token number
      const lastQueue = await prisma.queueEntry.findFirst({
        where: { hospitalId, createdAt: { gte: today } },
        orderBy: { queueNumber: 'desc' },
      });
      const tokenNumber = (lastQueue?.queueNumber || 0) + 1;

      // Get current time slot
      const currentTime = new Date().toTimeString().slice(0, 5);

      // Create appointment
      const appointment = await prisma.appointment.create({
        data: {
          id: undefined,
          hospitalId,
          patientId,
          doctorId,
          appointmentDate: today,
          startTime: currentTime,
          status: 'SCHEDULED',
          type: 'WALK_IN',
          tokenNumber,
          chiefComplaint,
        },
      });

      // Create queue entry
      const queueEntry = await prisma.queueEntry.create({
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

      res.status(201).json({
        success: true,
        message: 'Walk-in appointment created successfully',
        data: {
          appointment,
          queueEntry,
          tokenNumber,
        },
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/admin/payouts
// @desc    Get doctor payouts
// @access  Private (Admin)
router.get('/payouts', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { month, year } = req.query;
    const hospitalId = req.user!.hospitalId;

    const startDate = new Date(parseInt(year as string) || new Date().getFullYear(), parseInt(month as string) || new Date().getMonth(), 1);
    const endDate = new Date(startDate);
    endDate.setMonth(endDate.getMonth() + 1);

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
        payoutPercentage: true,
        consultationFee: true,
      },
    });

    const payouts = await Promise.all(
      doctors.map(async (doctor) => {
        const consultations = await prisma.consultation.count({
          where: {
            doctorId: doctor.id,
            createdAt: {
              gte: startDate,
              lt: endDate,
            },
          },
        });

        const totalRevenue = consultations * (doctor.consultationFee?.toNumber() || 0);
        const calculatedPayout = totalRevenue * ((doctor.payoutPercentage?.toNumber() || 70) / 100);

        return {
          doctorId: doctor.id,
          doctorName: `${doctor.firstName} ${doctor.lastName}`,
          patients: consultations,
          totalRevenue,
          payoutPercentage: doctor.payoutPercentage,
          calculatedPayout,
        };
      })
    );

    res.json({
      success: true,
      data: payouts,
    });
  } catch (error) {
    next(error);
  }
});

// ============================================
// REPORTS ENDPOINTS
// ============================================

// @route   GET /api/admin/reports/summary
// @desc    Get KPI summary for date range
// @access  Private (Admin)
router.get('/reports/summary', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const startDate = new Date(req.query.startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const endDate = new Date(req.query.endDate as string || new Date().toISOString().split('T')[0]);
    endDate.setHours(23, 59, 59, 999);

    const rangeDays = Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const prevStart = new Date(startDate.getTime() - rangeDays * 24 * 60 * 60 * 1000);
    const prevEnd = new Date(startDate.getTime() - 1);

    // Current period
    const [patients, prevPatients, revenue, prevRevenue, appointments, prevAppointments] = await Promise.all([
      prisma.patient.count({
        where: { hospitalId, createdAt: { gte: startDate, lte: endDate } },
      }),
      prisma.patient.count({
        where: { hospitalId, createdAt: { gte: prevStart, lte: prevEnd } },
      }),
      prisma.payment.aggregate({
        where: { hospitalId, status: 'completed', createdAt: { gte: startDate, lte: endDate } },
        _sum: { amount: true },
      }),
      prisma.payment.aggregate({
        where: { hospitalId, status: 'completed', createdAt: { gte: prevStart, lte: prevEnd } },
        _sum: { amount: true },
      }),
      prisma.appointment.count({
        where: { hospitalId, createdAt: { gte: startDate, lte: endDate }, status: { not: 'CANCELLED' } },
      }),
      prisma.appointment.count({
        where: { hospitalId, createdAt: { gte: prevStart, lte: prevEnd }, status: { not: 'CANCELLED' } },
      }),
    ]);

    // Average wait time from queue entries
    const queueEntries = await prisma.queueEntry.findMany({
      where: {
        hospitalId,
        createdAt: { gte: startDate, lte: endDate },
        calledAt: { not: null },
      },
      select: { createdAt: true, calledAt: true },
    });

    let avgWaitMinutes = 0;
    if (queueEntries.length > 0) {
      const totalWait = queueEntries.reduce((sum, q) => {
        return sum + (q.calledAt!.getTime() - q.createdAt.getTime());
      }, 0);
      avgWaitMinutes = Math.round(totalWait / queueEntries.length / 60000);
    }

    const calcChange = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    const currRevenue = Number(revenue._sum.amount || 0);
    const prevRev = Number(prevRevenue._sum.amount || 0);

    res.json({
      success: true,
      data: [
        { label: 'Total Patients', value: patients, change: calcChange(patients, prevPatients) },
        { label: 'Total Revenue', value: `₹${currRevenue.toLocaleString('en-IN')}`, change: calcChange(currRevenue, prevRev) },
        { label: 'Appointments', value: appointments, change: calcChange(appointments, prevAppointments) },
        { label: 'Avg. Wait Time', value: `${avgWaitMinutes} min`, change: 0 },
      ],
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/reports/daily
// @desc    Get daily stats for date range
// @access  Private (Admin)
router.get('/reports/daily', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const startDate = new Date(req.query.startDate as string || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const endDate = new Date(req.query.endDate as string || new Date().toISOString().split('T')[0]);
    endDate.setHours(23, 59, 59, 999);

    // Build daily stats by iterating each day
    const dailyStats: { date: string; patients: number; revenue: number; appointments: number }[] = [];
    const current = new Date(startDate);

    while (current <= endDate) {
      const dayStart = new Date(current);
      dayStart.setHours(0, 0, 0, 0);
      const dayEnd = new Date(current);
      dayEnd.setHours(23, 59, 59, 999);

      const [patientCount, apptCount, revenueAgg] = await Promise.all([
        prisma.patient.count({
          where: { hospitalId, createdAt: { gte: dayStart, lte: dayEnd } },
        }),
        prisma.appointment.count({
          where: { hospitalId, appointmentDate: dayStart, status: { not: 'CANCELLED' } },
        }),
        prisma.payment.aggregate({
          where: { hospitalId, status: 'completed', createdAt: { gte: dayStart, lte: dayEnd } },
          _sum: { amount: true },
        }),
      ]);

      dailyStats.push({
        date: dayStart.toISOString().split('T')[0],
        patients: patientCount,
        appointments: apptCount,
        revenue: Number(revenueAgg._sum.amount || 0),
      });

      current.setDate(current.getDate() + 1);
    }

    res.json({
      success: true,
      data: dailyStats,
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/admin/reports/departments
// @desc    Get patient count by department (doctor specialty)
// @access  Private (Admin)
router.get('/reports/departments', authenticate, authorize('ADMIN'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const hospitalId = req.user!.hospitalId;
    const startDate = new Date(req.query.startDate as string || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
    const endDate = new Date(req.query.endDate as string || new Date().toISOString().split('T')[0]);
    endDate.setHours(23, 59, 59, 999);

    // Get appointments grouped by doctor specialty
    const appointments = await prisma.appointment.findMany({
      where: {
        hospitalId,
        createdAt: { gte: startDate, lte: endDate },
        status: { not: 'CANCELLED' },
      },
      select: {
        doctor: {
          select: { specialty: true },
        },
      },
    });

    // Count by specialty
    const deptMap: Record<string, number> = {};
    for (const appt of appointments) {
      const dept = appt.doctor.specialty || 'General';
      deptMap[dept] = (deptMap[dept] || 0) + 1;
    }

    const departmentStats = Object.entries(deptMap)
      .map(([department, count]) => ({ department, count }))
      .sort((a, b) => b.count - a.count);

    res.json({
      success: true,
      data: departmentStats,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
