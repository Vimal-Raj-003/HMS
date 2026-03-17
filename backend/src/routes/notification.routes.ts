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

// @route   GET /api/notifications
// @desc    Get notifications for the logged-in user
// @access  Private
router.get('/', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;
    const { unreadOnly, limit = 20, offset = 0 } = req.query;

    const whereClause: any = {
      userId,
    };

    if (unreadOnly === 'true') {
      whereClause.isRead = false;
    }

    const notifications = await prisma.notification.findMany({
      where: whereClause,
      orderBy: { sentAt: 'desc' },
      take: Number(limit),
      skip: Number(offset),
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    const totalCount = await prisma.notification.count({
      where: whereClause,
    });

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        totalCount,
      },
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/notifications/unread-count
// @desc    Get unread notification count
// @access  Private
router.get('/unread-count', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    const unreadCount = await prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });

    res.json({
      success: true,
      data: { unreadCount },
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/notifications/:id/read
// @desc    Mark a notification as read
// @access  Private
router.put('/:id/read', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      throw ApiError.notFound('Notification not found', 'NOTIFICATION_NOT_FOUND');
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'Notification marked as read',
      data: updatedNotification,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/notifications/read-all
// @desc    Mark all notifications as read
// @access  Private
router.put('/read-all', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.id;

    await prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    res.json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    next(error);
  }
});

// @route   DELETE /api/notifications/:id
// @desc    Delete a notification
// @access  Private
router.delete('/:id', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.user!.id;

    const notification = await prisma.notification.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!notification) {
      throw ApiError.notFound('Notification not found', 'NOTIFICATION_NOT_FOUND');
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    next(error);
  }
});

// @route   GET /api/notifications/appointment/:appointmentId
// @desc    Get notification by appointment ID
// @access  Private
router.get('/appointment/:appointmentId', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { appointmentId } = req.params;
    const userId = req.user!.id;

    const notifications = await prisma.notification.findMany({
      where: {
        userId,
        type: 'APPOINTMENT',
      },
      orderBy: { sentAt: 'desc' },
    });

    // Filter notifications that contain the appointmentId in their data JSON
    const notification = notifications.find((n) => {
      try {
        const data = n.data ? JSON.parse(n.data) : null;
        return data?.appointmentId === appointmentId;
      } catch {
        return false;
      }
    });

    if (!notification) {
      throw ApiError.notFound('Notification not found for this appointment', 'NOTIFICATION_NOT_FOUND');
    }

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
