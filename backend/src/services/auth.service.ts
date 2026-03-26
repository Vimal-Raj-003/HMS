import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { ApiError } from '../middleware/error.middleware';
import { sendOTP } from './sms.service';

interface RegisterInput {
  hospitalId: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: string;
  qualifications?: string;
  specialty?: string;
  consultationFee?: number;
  payoutPercentage?: number;
  availableDays?: string[];
  availableHours?: { start: string; end: string };
  roomNumber?: string;
}

interface LoginInput {
  email: string;
  password: string;
  hospitalId?: string;
}

interface AuthResponse {
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    phone: string;
    hospitalId: string;
  };
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  // Generate tokens
  private generateTokens(userId: string, email: string, role: string, hospitalId: string) {
    const jwtSecret = process.env.JWT_SECRET!;
    const refreshSecret = jwtSecret + '_refresh';
    
    const accessToken = jwt.sign(
      { id: userId, email, role, hospitalId },
      jwtSecret,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { id: userId },
      refreshSecret,
      { expiresIn: '30d' }
    );

    return { accessToken, refreshToken };
  }

  // Hash password
  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  // Compare password
  private async comparePassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
  }

  // Register new staff user (Admin only)
  async register(input: RegisterInput): Promise<AuthResponse> {
    const existingUser = await prisma.user.findFirst({
      where: {
        email: input.email,
        hospitalId: input.hospitalId,
      },
    });

    if (existingUser) {
      throw ApiError.conflict('User with this email already exists', 'EMAIL_EXISTS');
    }

    const hashedPassword = await this.hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        id: uuidv4(),
        hospitalId: input.hospitalId,
        email: input.email,
        password: hashedPassword,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        role: input.role as any,
        qualifications: input.qualifications,
        specialty: input.specialty,
        consultationFee: input.consultationFee,
        payoutPercentage: input.payoutPercentage,
        availableDays: input.availableDays ? JSON.stringify(input.availableDays) : null,
        availableHours: input.availableHours ? JSON.stringify(input.availableHours) : null,
        roomNumber: input.roomNumber,
      },
    });

    const { accessToken, refreshToken } = this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.hospitalId
    );

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        hospitalId: user.hospitalId,
      },
      accessToken,
      refreshToken,
    };
  }

  // Login
  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await prisma.user.findFirst({
      where: {
        email: input.email,
        ...(input.hospitalId && { hospitalId: input.hospitalId }),
      },
    });

    if (!user) {
      throw ApiError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    if (!user.isActive) {
      throw ApiError.unauthorized('Account is deactivated', 'ACCOUNT_DEACTIVATED');
    }

    const isPasswordValid = await this.comparePassword(input.password, user.password);

    if (!isPasswordValid) {
      throw ApiError.unauthorized('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    const { accessToken, refreshToken } = this.generateTokens(
      user.id,
      user.email,
      user.role,
      user.hospitalId
    );

    // Store refresh token
    await prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        userId: user.id,
        token: refreshToken,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return {
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        phone: user.phone,
        hospitalId: user.hospitalId,
      },
      accessToken,
      refreshToken,
    };
  }

  // Refresh token
  async refreshToken(refreshToken: string): Promise<{ accessToken: string }> {
    const storedToken = await prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken) {
      throw ApiError.unauthorized('Invalid refresh token', 'INVALID_REFRESH_TOKEN');
    }

    if (storedToken.expiresAt < new Date()) {
      await prisma.refreshToken.delete({ where: { id: storedToken.id } });
      throw ApiError.unauthorized('Refresh token expired', 'REFRESH_TOKEN_EXPIRED');
    }

    const { accessToken } = this.generateTokens(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.role,
      storedToken.user.hospitalId
    );

    return { accessToken };
  }

  // Logout
  async logout(refreshToken: string): Promise<void> {
    await prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  // Change password
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    const isPasswordValid = await this.comparePassword(oldPassword, user.password);

    if (!isPasswordValid) {
      throw ApiError.badRequest('Current password is incorrect', 'INVALID_PASSWORD');
    }

    const hashedPassword = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  // Reset password (Admin only)
  async resetPassword(userId: string, newPassword: string): Promise<void> {
    const hashedPassword = await this.hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    // Invalidate all refresh tokens
    await prisma.refreshToken.deleteMany({ where: { userId } });
  }

  // Get user profile
  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        role: true,
        hospitalId: true,
        qualifications: true,
        specialty: true,
        consultationFee: true,
        payoutPercentage: true,
        availableDays: true,
        availableHours: true,
        roomNumber: true,
        bio: true,
        createdAt: true,
        hospital: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
          },
        },
      },
    });

    if (!user) {
      throw ApiError.notFound('User not found', 'USER_NOT_FOUND');
    }

    return user;
  }

  // ============================================
  // PATIENT OTP AUTHENTICATION
  // ============================================

  // Generate a 6-digit OTP
  private generateOTP(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Send OTP to mobile number
  async sendOTP(mobile: string): Promise<{ message: string; otp?: string }> {
    // Check if patient exists with this mobile number
    const patient = await prisma.patient.findFirst({
      where: { phone: mobile },
    });

    // Generate OTP
    const otp = this.generateOTP();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes expiry

    // Invalidate any existing OTPs for this mobile and purpose
    await prisma.otpVerification.deleteMany({
      where: {
        mobile,
        purpose: 'login',
      },
    });

    // Store OTP in database
    await prisma.otpVerification.create({
      data: {
        id: uuidv4(),
        patientId: patient?.id || null,
        mobile,
        otp,
        purpose: 'login',
        isVerified: false,
        expiresAt,
      },
    });

    // Log OTP to console in development mode
    if (process.env.NODE_ENV !== 'production') {
      console.log(`\n========================================`);
      console.log(`📱 OTP for ${mobile}: ${otp}`);
      console.log(`⏳ Expires at: ${expiresAt.toLocaleTimeString()}`);
      console.log(`========================================\n`);
    }

    // Send OTP via SMS provider
    const smsSent = await sendOTP(mobile, otp);

    const isDevelopment = process.env.NODE_ENV !== 'production';

    return {
      message: smsSent ? 'OTP sent successfully' : 'OTP generated (SMS delivery pending)',
      ...(isDevelopment && { otp }), // Include OTP in development mode for testing
    };
  }

  // Verify OTP and login/register patient
  async verifyOTP(mobile: string, otp: string): Promise<{
    user: any;
    accessToken: string;
    refreshToken: string;
    isNewUser: boolean;
  }> {
    // Find the OTP record
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        mobile,
        purpose: 'login',
        isVerified: false,
        expiresAt: {
          gte: new Date(), // Not expired
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!otpRecord) {
      throw ApiError.unauthorized('OTP expired or not found. Please request a new OTP.', 'OTP_EXPIRED');
    }

    if (otpRecord.otp !== otp) {
      throw ApiError.unauthorized('Invalid OTP', 'INVALID_OTP');
    }

    // Mark OTP as verified
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isVerified: true },
    });

    // Check if patient exists
    let patient = await prisma.patient.findFirst({
      where: { phone: mobile },
    });

    let isNewUser = false;

    // If patient doesn't exist, create a new one (auto-registration)
    if (!patient) {
      isNewUser = true;
      
      // Get hospital (use first active hospital or a default)
      const hospital = await prisma.hospital.findFirst({
        where: { isActive: true },
      });

      if (!hospital) {
        throw ApiError.internal('No active hospital found', 'NO_HOSPITAL');
      }

      // Generate patient number
      const patientCount = await prisma.patient.count({
        where: { hospitalId: hospital.id },
      });
      const patientNumber = `PT-${String(patientCount + 1).padStart(6, '0')}`;

      // Create new patient with minimal info
      patient = await prisma.patient.create({
        data: {
          id: uuidv4(),
          hospitalId: hospital.id,
          patientNumber,
          firstName: 'New',
          lastName: 'Patient',
          phone: mobile,
          dateOfBirth: new Date('1990-01-01'), // Default DOB, user should update
          gender: 'other', // Default, user should update
        },
      });
    }

    // Generate tokens for patient
    const jwtSecret = process.env.JWT_SECRET!;
    const refreshSecret = jwtSecret + '_refresh';

    const accessToken = jwt.sign(
      { id: patient.id, phone: patient.phone, role: 'PATIENT', hospitalId: patient.hospitalId },
      jwtSecret,
      { expiresIn: '7d' }
    );

    const refreshToken = jwt.sign(
      { id: patient.id },
      refreshSecret,
      { expiresIn: '30d' }
    );

    // Clean up used OTP
    await prisma.otpVerification.delete({
      where: { id: otpRecord.id },
    });

    return {
      user: {
        id: patient.id,
        patientNumber: patient.patientNumber,
        firstName: patient.firstName,
        lastName: patient.lastName,
        phone: patient.phone,
        email: patient.email,
        role: 'PATIENT',
        hospitalId: patient.hospitalId,
      },
      accessToken,
      refreshToken,
      isNewUser,
    };
  }

  // Resend OTP
  async resendOTP(mobile: string): Promise<{ message: string; otp?: string }> {
    // Check if there's a recent OTP (rate limiting)
    const recentOtp = await prisma.otpVerification.findFirst({
      where: {
        mobile,
        purpose: 'login',
        createdAt: {
          gte: new Date(Date.now() - 60 * 1000), // Within last 1 minute
        },
      },
    });

    if (recentOtp) {
      throw ApiError.tooManyRequests('Please wait before requesting a new OTP', 'RATE_LIMITED');
    }

    // Use sendOTP to generate and store new OTP
    return this.sendOTP(mobile);
  }
}

export default new AuthService();
