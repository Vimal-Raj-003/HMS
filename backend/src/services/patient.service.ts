import { v4 as uuidv4 } from 'uuid';
import prisma from '../config/database';
import { ApiError } from '../middleware/error.middleware';
import { sendOTP } from './sms.service';

interface PatientSearchInput {
  mobile?: string;
  patientNumber?: string;
  name?: string;
  hospitalId: string;
}

interface RegisterPatientInput {
  hospitalId: string;
  firstName: string;
  lastName: string;
  phone: string;
  email?: string;
  dateOfBirth: string;
  gender: string;
  bloodGroup?: string;
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  preExistingConditions?: string[];
  allergies?: string[];
  abhaId?: string;
  abhaAddress?: string;
}

interface SendOtpInput {
  mobile: string;
  purpose: 'login' | 'registration' | 'verify';
}

interface VerifyOtpInput {
  mobile: string;
  otp: string;
}

export class PatientService {
  // Generate patient number
  private async generatePatientNumber(hospitalId: string): Promise<string> {
    const count = await prisma.patient.count({
      where: { hospitalId },
    });
    return `PT-${String(count + 1).padStart(6, '0')}`;
  }

  // Generate OTP
  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  // Search patients
  async searchPatients(input: PatientSearchInput) {
    const { mobile, patientNumber, name, hospitalId } = input;

    const whereClause: any = {
      hospitalId,
    };

    if (mobile) {
      whereClause.phone = { contains: mobile };
    }

    if (patientNumber) {
      whereClause.patientNumber = { contains: patientNumber };
    }

    if (name) {
      whereClause.OR = [
        { firstName: { contains: name, mode: 'insensitive' } },
        { lastName: { contains: name, mode: 'insensitive' } },
      ];
    }

    const patients = await prisma.patient.findMany({
      where: whereClause,
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        appointments: {
          where: {
            appointmentDate: {
              gte: new Date(new Date().setHours(0, 0, 0, 0)),
            },
          },
          take: 1,
          include: {
            doctor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                specialty: true,
              },
            },
          },
        },
      },
    });

    return patients;
  }

  // Get patient by ID
  async getPatientById(patientId: string, hospitalId: string) {
    const patient = await prisma.patient.findFirst({
      where: {
        id: patientId,
        hospitalId,
      },
      include: {
        appointments: {
          take: 10,
          orderBy: { createdAt: 'desc' },
          include: {
            doctor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                specialty: true,
              },
            },
          },
        },
        vitals: {
          take: 5,
          orderBy: { recordedAt: 'desc' },
        },
        medicalHistory: true,
      },
    });

    if (!patient) {
      throw ApiError.notFound('Patient not found', 'PATIENT_NOT_FOUND');
    }

    return patient;
  }

  // Register new patient
  async registerPatient(input: RegisterPatientInput) {
    // Check if patient already exists with same phone
    const existingPatient = await prisma.patient.findFirst({
      where: {
        phone: input.phone,
        hospitalId: input.hospitalId,
      },
    });

    if (existingPatient) {
      throw ApiError.conflict('Patient with this phone number already exists', 'PATIENT_EXISTS');
    }

    const patientNumber = await this.generatePatientNumber(input.hospitalId);

    const patient = await prisma.patient.create({
      data: {
        id: uuidv4(),
        hospitalId: input.hospitalId,
        patientNumber,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.phone,
        email: input.email,
        dateOfBirth: new Date(input.dateOfBirth),
        gender: input.gender,
        bloodGroup: input.bloodGroup,
        address: input.address,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        emergencyContact: input.emergencyContact,
        emergencyPhone: input.emergencyPhone,
        preExistingConditions: input.preExistingConditions || [],
        allergies: input.allergies || [],
        abhaId: input.abhaId,
        abhaAddress: input.abhaAddress,
        abhaLinkedAt: input.abhaId ? new Date() : null,
      },
    });

    return patient;
  }

  // Quick registration (for walk-ins)
  async quickRegister(input: {
    hospitalId: string;
    mobileNumber: string;
    firstName: string;
    lastName: string;
    gender: string;
    dateOfBirth?: string;
    age?: number;
    chiefComplaint?: string;
  }) {
    // Check if patient exists
    let patient = await prisma.patient.findFirst({
      where: {
        phone: input.mobileNumber,
        hospitalId: input.hospitalId,
      },
    });

    if (patient) {
      return { patient, isNew: false };
    }

    // Calculate DOB from age if provided
    let dateOfBirth: Date | undefined;
    if (input.dateOfBirth) {
      dateOfBirth = new Date(input.dateOfBirth);
    } else if (input.age) {
      dateOfBirth = new Date();
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - input.age);
    }

    const patientNumber = await this.generatePatientNumber(input.hospitalId);

    patient = await prisma.patient.create({
      data: {
        id: uuidv4(),
        hospitalId: input.hospitalId,
        patientNumber,
        firstName: input.firstName,
        lastName: input.lastName,
        phone: input.mobileNumber,
        gender: input.gender,
        dateOfBirth: dateOfBirth || new Date('1990-01-01'), // Default DOB
      },
    });

    return { patient, isNew: true };
  }

  // Update patient profile
  async updatePatient(patientId: string, hospitalId: string, input: Partial<RegisterPatientInput>) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, hospitalId },
    });

    if (!patient) {
      throw ApiError.notFound('Patient not found', 'PATIENT_NOT_FOUND');
    }

    const updatedPatient = await prisma.patient.update({
      where: { id: patientId },
      data: {
        ...input,
        dateOfBirth: input.dateOfBirth ? new Date(input.dateOfBirth) : undefined,
        abhaLinkedAt: input.abhaId && !patient.abhaId ? new Date() : undefined,
      },
    });

    return updatedPatient;
  }

  // Send OTP
  async sendOtp(input: SendOtpInput) {
    // Check rate limiting (max 3 OTPs per 10 minutes)
    const recentOtps = await prisma.otpVerification.count({
      where: {
        mobile: input.mobile,
        createdAt: {
          gte: new Date(Date.now() - 10 * 60 * 1000),
        },
      },
    });

    if (recentOtps >= 3) {
      throw ApiError.badRequest('Too many OTP requests. Please try again later.', 'RATE_LIMIT_EXCEEDED');
    }

    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Invalidate previous OTPs for this mobile/purpose
    await prisma.otpVerification.updateMany({
      where: {
        mobile: input.mobile,
        purpose: input.purpose,
        isVerified: false,
      },
      data: { isVerified: true }, // Mark as used
    });

    // Create new OTP
    await prisma.otpVerification.create({
      data: {
        id: uuidv4(),
        mobile: input.mobile,
        otp,
        purpose: input.purpose,
        expiresAt,
      },
    });

    // Send OTP via SMS provider
    const smsSent = await sendOTP(input.mobile, otp);

    return {
      message: smsSent ? 'OTP sent successfully' : 'OTP generated (SMS delivery pending)',
      // For development only - remove in production
      ...(process.env.NODE_ENV === 'development' && { otp }),
    };
  }

  // Verify OTP
  async verifyOtp(input: VerifyOtpInput) {
    const otpRecord = await prisma.otpVerification.findFirst({
      where: {
        mobile: input.mobile,
        otp: input.otp,
        isVerified: false,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otpRecord) {
      throw ApiError.badRequest('Invalid or expired OTP', 'INVALID_OTP');
    }

    // Mark OTP as verified
    await prisma.otpVerification.update({
      where: { id: otpRecord.id },
      data: { isVerified: true },
    });

    return { verified: true };
  }

  // Patient login with OTP
  async loginWithOtp(mobile: string, otp: string, hospitalId: string) {
    // Verify OTP first
    await this.verifyOtp({ mobile, otp });

    // Find patient
    const patient = await prisma.patient.findFirst({
      where: {
        phone: mobile,
        hospitalId,
      },
    });

    if (!patient) {
      throw ApiError.notFound('Patient not found. Please register first.', 'PATIENT_NOT_FOUND');
    }

    return {
      patient,
      isNewUser: false,
    };
  }

  // Get patient medical history
  async getMedicalHistory(patientId: string, hospitalId: string) {
    const patient = await prisma.patient.findFirst({
      where: { id: patientId, hospitalId },
    });

    if (!patient) {
      throw ApiError.notFound('Patient not found', 'PATIENT_NOT_FOUND');
    }

    const history = await prisma.medicalHistory.findMany({
      where: { patientId },
      orderBy: { createdAt: 'desc' },
    });

    return history;
  }

  // Get patient vitals history
  async getVitalsHistory(patientId: string, hospitalId: string, limit: number = 10) {
    const vitals = await prisma.vitals.findMany({
      where: {
        patientId,
        hospitalId,
      },
      take: limit,
      orderBy: { recordedAt: 'desc' },
      include: {
        nurse: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return vitals;
  }

  // Get patient prescriptions
  async getPrescriptions(patientId: string, hospitalId: string) {
    const prescriptions = await prisma.prescription.findMany({
      where: {
        patientId,
        hospitalId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            specialty: true,
          },
        },
        items: {
          include: {
            medicine: true,
          },
        },
      },
    });

    return prescriptions;
  }

  // Get patient lab reports
  async getLabReports(patientId: string, hospitalId: string) {
    const labOrders = await prisma.labOrder.findMany({
      where: {
        patientId,
        hospitalId,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        items: {
          include: {
            test: true,
          },
        },
        doctor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    return labOrders;
  }

  // Add dependent
  async addDependent(patientId: string, input: {
    relationship: string;
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    gender: string;
    bloodGroup?: string;
    preExistingConditions?: string[];
    allergies?: string[];
  }) {
    const dependent = await prisma.dependent.create({
      data: {
        id: uuidv4(),
        patientId,
        ...input,
        dateOfBirth: new Date(input.dateOfBirth),
        preExistingConditions: input.preExistingConditions || [],
        allergies: input.allergies || [],
      },
    });

    return dependent;
  }

  // Get dependents
  async getDependents(patientId: string) {
    const dependents = await prisma.dependent.findMany({
      where: { patientId },
    });

    return dependents;
  }
}

export default new PatientService();
