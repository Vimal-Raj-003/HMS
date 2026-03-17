import { Router, Request, Response, NextFunction } from 'express';
import { body, validationResult } from 'express-validator';
import authService from '../services/auth.service';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { ApiError } from '../middleware/error.middleware';

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

// @route   POST /api/auth/register
// @desc    Register new staff user (Admin only)
// @access  Private (Admin)
router.post(
  '/register',
  authenticate,
  authorize('ADMIN'),
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('phone').isMobilePhone('any').withMessage('Valid phone number is required'),
    body('role').isIn(['ADMIN', 'DOCTOR', 'NURSE', 'PHARMACIST', 'LAB_TECH', 'RECEPTIONIST']).withMessage('Valid role is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.register({
        hospitalId: req.user!.hospitalId,
        ...req.body,
      });

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/auth/login
// @desc    Login user
// @access  Public
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.login(req.body);

      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/auth/refresh
// @desc    Refresh access token
// @access  Public
router.post(
  '/refresh',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.refreshToken(req.body.refreshToken);

      res.json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/auth/logout
// @desc    Logout user
// @access  Public
router.post(
  '/logout',
  [body('refreshToken').notEmpty().withMessage('Refresh token is required')],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.logout(req.body.refreshToken);

      res.json({
        success: true,
        message: 'Logged out successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/auth/profile
// @desc    Get current user profile
// @access  Private
router.get('/profile', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const profile = await authService.getProfile(req.user!.id);

    res.json({
      success: true,
      data: profile,
    });
  } catch (error) {
    next(error);
  }
});

// @route   PUT /api/auth/password
// @desc    Change password
// @access  Private
router.put(
  '/password',
  authenticate,
  [
    body('oldPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.changePassword(
        req.user!.id,
        req.body.oldPassword,
        req.body.newPassword
      );

      res.json({
        success: true,
        message: 'Password changed successfully. Please login again.',
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/auth/reset-password/:userId
// @desc    Reset user password (Admin only)
// @access  Private (Admin)
router.post(
  '/reset-password/:userId',
  authenticate,
  authorize('ADMIN'),
  [
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      await authService.resetPassword(req.params.userId, req.body.newPassword);

      res.json({
        success: true,
        message: 'Password reset successfully',
      });
    } catch (error) {
      next(error);
    }
  }
);

// ============================================
// PATIENT OTP AUTHENTICATION ROUTES
// ============================================

// @route   POST /api/auth/send-otp
// @desc    Send OTP to patient's mobile number
// @access  Public
router.post(
  '/send-otp',
  [
    body('mobile')
      .matches(/^[0-9]{10}$/)
      .withMessage('Valid 10-digit mobile number is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.sendOTP(req.body.mobile);

      res.json({
        success: true,
        message: result.message,
        ...(result.otp && { otp: result.otp }), // Only in development
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/auth/verify-otp
// @desc    Verify OTP and login/register patient
// @access  Public
router.post(
  '/verify-otp',
  [
    body('mobile')
      .matches(/^[0-9]{10}$/)
      .withMessage('Valid 10-digit mobile number is required'),
    body('otp')
      .matches(/^[0-9]{6}$/)
      .withMessage('Valid 6-digit OTP is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.verifyOTP(req.body.mobile, req.body.otp);

      res.json({
        success: true,
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/auth/resend-otp
// @desc    Resend OTP to patient's mobile number
// @access  Public
router.post(
  '/resend-otp',
  [
    body('mobile')
      .matches(/^[0-9]{10}$/)
      .withMessage('Valid 10-digit mobile number is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await authService.resendOTP(req.body.mobile);

      res.json({
        success: true,
        message: result.message,
        ...(result.otp && { otp: result.otp }), // Only in development
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
