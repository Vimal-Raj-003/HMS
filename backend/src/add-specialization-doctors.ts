import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Script to add doctors for specializations that are missing in the database.
 * This resolves the issue where certain specializations cannot be selected
 * in the Patient Appointment Booking module because no doctors are assigned.
 * 
 * Specializations covered:
 * - Cardiology
 * - Dermatology
 * - Orthopedics
 * - Pediatrics
 */

async function main() {
  console.log('🏥 Adding doctors for missing specializations...\n');

  // Get the hospital (assuming single hospital setup)
  const hospital = await prisma.hospital.findFirst();

  if (!hospital) {
    console.error('❌ No hospital found in database. Please run the main seed first.');
    process.exit(1);
  }

  console.log(`📋 Hospital: ${hospital.name} (${hospital.code})\n`);

  // Password for all doctors
  const defaultPassword = await bcrypt.hash('password123', 10);

  // Define doctors for each required specialization
  const doctorsData = [
    // Cardiology - 2 doctors
    {
      email: 'cardio1@hospital.com',
      firstName: 'Rajesh',
      lastName: 'Kumar',
      phone: '+91-9876543301',
      qualifications: 'MBBS, MD, DM (Cardiology)',
      specialty: 'Cardiology',
      consultationFee: 800.00,
      roomNumber: '201',
      bio: 'Senior cardiologist with expertise in interventional cardiology and heart diseases.',
    },
    {
      email: 'cardio2@hospital.com',
      firstName: 'Priya',
      lastName: 'Menon',
      phone: '+91-9876543302',
      qualifications: 'MBBS, MD, DM (Cardiology)',
      specialty: 'Cardiology',
      consultationFee: 750.00,
      roomNumber: '202',
      bio: 'Specialized in non-invasive cardiology and preventive cardiac care.',
    },
    // Dermatology - 2 doctors
    {
      email: 'derma1@hospital.com',
      firstName: 'Anita',
      lastName: 'Sharma',
      phone: '+91-9876543303',
      qualifications: 'MBBS, MD (Dermatology)',
      specialty: 'Dermatology',
      consultationFee: 600.00,
      roomNumber: '301',
      bio: 'Expert in skin disorders, cosmetic dermatology, and laser treatments.',
    },
    {
      email: 'derma2@hospital.com',
      firstName: 'Vikram',
      lastName: 'Patel',
      phone: '+91-9876543304',
      qualifications: 'MBBS, MD (Dermatology)',
      specialty: 'Dermatology',
      consultationFee: 550.00,
      roomNumber: '302',
      bio: 'Specialized in treating acne, eczema, and skin allergies.',
    },
    // Orthopedics - 2 doctors
    {
      email: 'ortho1@hospital.com',
      firstName: 'Suresh',
      lastName: 'Reddy',
      phone: '+91-9876543305',
      qualifications: 'MBBS, MS (Orthopedics)',
      specialty: 'Orthopedics',
      consultationFee: 700.00,
      roomNumber: '401',
      bio: 'Orthopedic surgeon specializing in joint replacements and sports medicine.',
    },
    {
      email: 'ortho2@hospital.com',
      firstName: 'Meera',
      lastName: 'Iyer',
      phone: '+91-9876543306',
      qualifications: 'MBBS, MS (Orthopedics)',
      specialty: 'Orthopedics',
      consultationFee: 650.00,
      roomNumber: '402',
      bio: 'Expert in spine surgery and minimally invasive orthopedic procedures.',
    },
    // Pediatrics - 2 doctors
    {
      email: 'ped1@hospital.com',
      firstName: 'Arun',
      lastName: 'Nair',
      phone: '+91-9876543307',
      qualifications: 'MBBS, MD (Pediatrics)',
      specialty: 'Pediatrics',
      consultationFee: 500.00,
      roomNumber: '501',
      bio: 'Pediatrician with 20 years of experience in child healthcare.',
    },
    {
      email: 'ped2@hospital.com',
      firstName: 'Sunita',
      lastName: 'Gupta',
      phone: '+91-9876543308',
      qualifications: 'MBBS, MD (Pediatrics)',
      specialty: 'Pediatrics',
      consultationFee: 450.00,
      roomNumber: '502',
      bio: 'Specialized in neonatology and pediatric emergencies.',
    },
  ];

  const targetSpecializations = ['Cardiology', 'Dermatology', 'Orthopedics', 'Pediatrics'];

  // Check existing doctors for each specialization
  console.log('🔍 Checking existing doctors by specialization:\n');

  for (const spec of targetSpecializations) {
    const existingDoctors = await prisma.user.findMany({
      where: {
        hospitalId: hospital.id,
        role: UserRole.DOCTOR,
        specialty: spec,
      },
    });

    console.log(`   ${spec}: ${existingDoctors.length} doctor(s) found`);
  }

  console.log('\n📝 Adding doctors...\n');

  let addedCount = 0;
  let skippedCount = 0;

  for (const docData of doctorsData) {
    // Check if doctor already exists
    const existingDoctor = await prisma.user.findUnique({
      where: {
        hospitalId_email: {
          hospitalId: hospital.id,
          email: docData.email,
        },
      },
    });

    if (existingDoctor) {
      console.log(`   ⏭️  Skipped: ${docData.email} already exists`);
      skippedCount++;
      continue;
    }

    // Create the doctor
    const doctor = await prisma.user.create({
      data: {
        hospitalId: hospital.id,
        email: docData.email,
        password: defaultPassword,
        firstName: docData.firstName,
        lastName: docData.lastName,
        phone: docData.phone,
        role: UserRole.DOCTOR,
        qualifications: docData.qualifications,
        specialty: docData.specialty,
        consultationFee: docData.consultationFee,
        payoutPercentage: 70.00,
        availableDays: JSON.stringify(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']),
        availableHours: JSON.stringify({ morning: { start: '09:00', end: '13:00' }, evening: { start: '14:00', end: '20:00' } }),
        roomNumber: docData.roomNumber,
        bio: docData.bio,
        isActive: true,
      },
    });

    addedCount++;
    console.log(`   ✅ Added: Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialty}) - ₹${doctor.consultationFee}`);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(60));
  console.log(`   Doctors added:   ${addedCount}`);
  console.log(`   Doctors skipped: ${skippedCount}`);
  console.log('═'.repeat(60));

  // Verify final state
  console.log('\n🔍 Final verification - Doctors by specialization:\n');

  for (const spec of targetSpecializations) {
    const doctors = await prisma.user.findMany({
      where: {
        hospitalId: hospital.id,
        role: UserRole.DOCTOR,
        specialty: spec,
        isActive: true,
      },
      select: {
        firstName: true,
        lastName: true,
        consultationFee: true,
        isActive: true,
      },
    });

    console.log(`   ${spec}:`);
    if (doctors.length === 0) {
      console.log(`      ⚠️  No doctors available`);
    } else {
      doctors.forEach(d => {
        console.log(`      - Dr. ${d.firstName} ${d.lastName} (₹${d.consultationFee}) [${d.isActive ? 'Active' : 'Inactive'}]`);
      });
    }
  }

  console.log('\n✅ Doctor addition completed successfully!\n');
}

main()
  .catch((e) => {
    console.error('❌ Error adding doctors:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
