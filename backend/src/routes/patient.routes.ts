import { Router, Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';
import patientService from '../services/patient.service';
import { authenticate, optionalAuth } from '../middleware/auth.middleware';

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

// @route   POST /api/patients/send-otp
// @desc    Send OTP to patient mobile
// @access  Public
router.post(
  '/send-otp',
  [
    body('mobile').isMobilePhone('any').withMessage('Valid mobile number is required'),
    body('purpose').isIn(['login', 'registration', 'verify']).withMessage('Valid purpose is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await patientService.sendOtp(req.body);
      res.json({
        success: true,
        message: result.message,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/patients/verify-otp
// @desc    Verify OTP
// @access  Public
router.post(
  '/verify-otp',
  [
    body('mobile').isMobilePhone('any').withMessage('Valid mobile number is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('6-digit OTP is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await patientService.verifyOtp(req.body);
      res.json({
        success: true,
        message: 'OTP verified successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/patients/register
// @desc    Register new patient
// @access  Public
router.post(
  '/register',
  [
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('phone').isMobilePhone('any').withMessage('Valid mobile number is required'),
    body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = req.tenantId || req.body.hospitalId;
      const patient = await patientService.registerPatient({
        hospitalId,
        ...req.body,
      });

      res.status(201).json({
        success: true,
        message: 'Patient registered successfully',
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/patients/quick-register
// @desc    Quick registration for walk-in patients
// @access  Private (Admin, Receptionist)
router.post(
  '/quick-register',
  authenticate,
  [
    body('mobileNumber').isMobilePhone('any').withMessage('Valid mobile number is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await patientService.quickRegister({
        hospitalId: req.user!.hospitalId,
        ...req.body,
      });

      res.status(result.isNew ? 201 : 200).json({
        success: true,
        message: result.isNew ? 'Patient registered successfully' : 'Patient already exists',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/patients/login
// @desc    Patient login with OTP
// @access  Public
router.post(
  '/login',
  [
    body('mobile').isMobilePhone('any').withMessage('Valid mobile number is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('6-digit OTP is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const hospitalId = req.tenantId || req.body.hospitalId;
      const result = await patientService.loginWithOtp(req.body.mobile, req.body.otp, hospitalId);

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

// @route   GET /api/patients/search
// @desc    Search patients
// @access  Private (Admin, Doctor, Nurse, Receptionist)
router.get(
  '/search',
  authenticate,
  [
    query('mobile').optional().isMobilePhone('any'),
    query('patientNumber').optional().isString(),
    query('name').optional().isString(),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patients = await patientService.searchPatients({
        mobile: req.query.mobile as string,
        patientNumber: req.query.patientNumber as string,
        name: req.query.name as string,
        hospitalId: req.user!.hospitalId,
      });

      res.json({
        success: true,
        data: patients,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/patients/:id
// @desc    Get patient by ID
// @access  Private
router.get(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patient = await patientService.getPatientById(
        req.params.id,
        req.user!.hospitalId
      );

      res.json({
        success: true,
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   PUT /api/patients/:id
// @desc    Update patient profile
// @access  Private
router.put(
  '/:id',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const patient = await patientService.updatePatient(
        req.params.id,
        req.user!.hospitalId,
        req.body
      );

      res.json({
        success: true,
        message: 'Patient updated successfully',
        data: patient,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/patients/:id/medical-history
// @desc    Get patient medical history
// @access  Private
router.get(
  '/:id/medical-history',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const history = await patientService.getMedicalHistory(
        req.params.id,
        req.user!.hospitalId
      );

      res.json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/patients/:id/vitals
// @desc    Get patient vitals history
// @access  Private
router.get(
  '/:id/vitals',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const vitals = await patientService.getVitalsHistory(
        req.params.id,
        req.user!.hospitalId,
        limit
      );

      res.json({
        success: true,
        data: vitals,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/patients/:id/prescriptions
// @desc    Get patient prescriptions
// @access  Private
router.get(
  '/:id/prescriptions',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const prescriptions = await patientService.getPrescriptions(
        req.params.id,
        req.user!.hospitalId
      );

      res.json({
        success: true,
        data: prescriptions,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/patients/:id/lab-reports
// @desc    Get patient lab reports
// @access  Private
router.get(
  '/:id/lab-reports',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const labReports = await patientService.getLabReports(
        req.params.id,
        req.user!.hospitalId
      );

      res.json({
        success: true,
        data: labReports,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   POST /api/patients/:id/dependents
// @desc    Add dependent to patient
// @access  Private
router.post(
  '/:id/dependents',
  authenticate,
  [
    body('relationship').notEmpty().withMessage('Relationship is required'),
    body('firstName').notEmpty().withMessage('First name is required'),
    body('lastName').notEmpty().withMessage('Last name is required'),
    body('dateOfBirth').isISO8601().withMessage('Valid date of birth is required'),
    body('gender').isIn(['male', 'female', 'other']).withMessage('Valid gender is required'),
  ],
  validate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dependent = await patientService.addDependent(req.params.id, req.body);

      res.status(201).json({
        success: true,
        message: 'Dependent added successfully',
        data: dependent,
      });
    } catch (error) {
      next(error);
    }
  }
);

// @route   GET /api/patients/:id/dependents
// @desc    Get patient dependents
// @access  Private
router.get(
  '/:id/dependents',
  authenticate,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const dependents = await patientService.getDependents(req.params.id);

      res.json({
        success: true,
        data: dependents,
      });
    } catch (error) {
      next(error);
    }
  }
);

export default router;
