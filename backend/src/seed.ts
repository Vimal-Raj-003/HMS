import { PrismaClient, UserRole } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create Hospital
  const hospital = await prisma.hospital.upsert({
    where: { code: 'HMS001' },
    update: {},
    create: {
      name: 'City General Hospital',
      code: 'HMS001',
      address: '123 Healthcare Avenue',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      contactEmail: 'info@cityhospital.com',
      contactPhone: '+91-22-12345678',
      gstNumber: '27AABCU9603R1ZM',
      planType: 'premium',
    },
  });

  console.log('✅ Hospital created:', hospital.name);

  // Password for all test users
  const defaultPassword = await bcrypt.hash('password123', 10);

  // Create Admin User
  const admin = await prisma.user.upsert({
    where: {
      hospitalId_email: {
        hospitalId: hospital.id,
        email: 'admin@hospital.com',
      },
    },
    update: {},
    create: {
      hospitalId: hospital.id,
      email: 'admin@hospital.com',
      password: defaultPassword,
      firstName: 'Admin',
      lastName: 'User',
      phone: '+91-9876543210',
      role: UserRole.ADMIN,
    },
  });

  console.log('✅ Admin created:', admin.email);

  // Create Doctors for each specialization
  // Specializations: Cardiology, Dermatology, Orthopedics, Pediatrics, General Medicine
  // Each with 2 doctors

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
    // General Medicine - 2 doctors
    {
      email: 'genmed1@hospital.com',
      firstName: 'John',
      lastName: 'Smith',
      phone: '+91-9876543309',
      qualifications: 'MBBS, MD',
      specialty: 'General Medicine',
      consultationFee: 400.00,
      roomNumber: '101',
      bio: 'Experienced general physician with 15 years of practice.',
    },
    {
      email: 'genmed2@hospital.com',
      firstName: 'Kavita',
      lastName: 'Rao',
      phone: '+91-9876543310',
      qualifications: 'MBBS, MD',
      specialty: 'General Medicine',
      consultationFee: 350.00,
      roomNumber: '102',
      bio: 'General physician focused on preventive care and chronic disease management.',
    },
  ];

  const createdDoctors: any[] = [];
  for (const docData of doctorsData) {
    const doctor = await prisma.user.upsert({
      where: {
        hospitalId_email: {
          hospitalId: hospital.id,
          email: docData.email,
        },
      },
      update: {},
      create: {
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
      },
    });
    createdDoctors.push(doctor);
    console.log(`✅ Doctor created: Dr. ${doctor.firstName} ${doctor.lastName} (${doctor.specialty}) - ₹${doctor.consultationFee}`);
  }

  // Create Nurse User
  const nurse = await prisma.user.upsert({
    where: {
      hospitalId_email: {
        hospitalId: hospital.id,
        email: 'nurse@hospital.com',
      },
    },
    update: {},
    create: {
      hospitalId: hospital.id,
      email: 'nurse@hospital.com',
      password: defaultPassword,
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+91-9876543212',
      role: UserRole.NURSE,
    },
  });

  console.log('✅ Nurse created:', nurse.email);

  // Create Pharmacist User
  const pharmacist = await prisma.user.upsert({
    where: {
      hospitalId_email: {
        hospitalId: hospital.id,
        email: 'pharmacy@hospital.com',
      },
    },
    update: {},
    create: {
      hospitalId: hospital.id,
      email: 'pharmacy@hospital.com',
      password: defaultPassword,
      firstName: 'Mike',
      lastName: 'Williams',
      phone: '+91-9876543213',
      role: UserRole.PHARMACIST,
    },
  });

  console.log('✅ Pharmacist created:', pharmacist.email);

  // Create Lab Tech User
  const labTech = await prisma.user.upsert({
    where: {
      hospitalId_email: {
        hospitalId: hospital.id,
        email: 'lab@hospital.com',
      },
    },
    update: {},
    create: {
      hospitalId: hospital.id,
      email: 'lab@hospital.com',
      password: defaultPassword,
      firstName: 'Emily',
      lastName: 'Davis',
      phone: '+91-9876543214',
      role: UserRole.LAB_TECH,
    },
  });

  console.log('✅ Lab Tech created:', labTech.email);

  // Create Receptionist User
  const receptionist = await prisma.user.upsert({
    where: {
      hospitalId_email: {
        hospitalId: hospital.id,
        email: 'reception@hospital.com',
      },
    },
    update: {},
    create: {
      hospitalId: hospital.id,
      email: 'reception@hospital.com',
      password: defaultPassword,
      firstName: 'Lisa',
      lastName: 'Brown',
      phone: '+91-9876543215',
      role: UserRole.RECEPTIONIST,
    },
  });

  console.log('✅ Receptionist created:', receptionist.email);

  // Create Test Patient
  const patient = await prisma.patient.upsert({
    where: {
      hospitalId_patientNumber: {
        hospitalId: hospital.id,
        patientNumber: 'PT-000001',
      },
    },
    update: {},
    create: {
      hospitalId: hospital.id,
      patientNumber: 'PT-000001',
      firstName: 'Rahul',
      lastName: 'Sharma',
      phone: '+91-9876543220',
      email: 'rahul.sharma@email.com',
      dateOfBirth: new Date('1990-05-15'),
      gender: 'male',
      bloodGroup: 'O+',
      address: '456 Park Street, Andheri',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400053',
      emergencyContact: 'Priya Sharma',
      emergencyPhone: '+91-9876543221',
      preExistingConditions: ['Diabetes'],
      allergies: ['Penicillin'],
    },
  });

  console.log('✅ Patient created:', patient.patientNumber, '-', patient.firstName, patient.lastName);

  // Create sample medicines
  const medicines = [
    { name: 'Paracetamol', genericName: 'Acetaminophen', category: 'Tablet', strength: '500mg', unit: 'tablet', price: 2.50, stock: 1000 },
    { name: 'Amoxicillin', genericName: 'Amoxicillin', category: 'Capsule', strength: '250mg', unit: 'capsule', price: 15.00, stock: 500 },
    { name: 'Metformin', genericName: 'Metformin', category: 'Tablet', strength: '500mg', unit: 'tablet', price: 5.00, stock: 800 },
    { name: 'Omeprazole', genericName: 'Omeprazole', category: 'Capsule', strength: '20mg', unit: 'capsule', price: 8.00, stock: 600 },
    { name: 'Cetirizine', genericName: 'Cetirizine', category: 'Tablet', strength: '10mg', unit: 'tablet', price: 3.00, stock: 1000 },
  ];

  for (const med of medicines) {
    await prisma.medicine.upsert({
      where: {
        hospitalId_name_strength: {
          hospitalId: hospital.id,
          name: med.name,
          strength: med.strength,
        },
      },
      update: {},
      create: {
        hospitalId: hospital.id,
        name: med.name,
        genericName: med.genericName,
        category: med.category,
        strength: med.strength,
        unit: med.unit,
        price: med.price,
      },
    });
  }

  console.log('✅ Medicines created:', medicines.length);

  // Create inventory for medicines
  const allMedicines = await prisma.medicine.findMany({
    where: { hospitalId: hospital.id },
  });

  for (const medicine of allMedicines) {
    const stockData = medicines.find(m => m.name === medicine.name && m.strength === medicine.strength);
    await prisma.inventory.create({
      data: {
        hospitalId: hospital.id,
        medicineId: medicine.id,
        quantity: stockData?.stock || 100,
        batchNumber: 'BATCH001',
        reorderLevel: 100,
        expiryDate: new Date(Date.now() + 2 * 365 * 24 * 60 * 60 * 1000), // 2 years from now
        purchasePrice: (stockData?.price || 5) * 0.7,
        mrp: stockData?.price || 5,
      },
    });
  }

  console.log('✅ Inventory created');

  // Create sample lab tests
  const labTests = [
    { name: 'Complete Blood Count (CBC)', code: 'CBC', category: 'Hematology', price: 300.00, turnaroundHours: 24, parameters: JSON.stringify([{name: 'Hemoglobin', unit: 'g/dL', referenceRange: '12-17'}, {name: 'WBC', unit: '/cumm', referenceRange: '4000-11000'}]) },
    { name: 'Blood Sugar Fasting', code: 'BSF', category: 'Biochemistry', price: 150.00, turnaroundHours: 6, parameters: JSON.stringify([{name: 'Glucose Fasting', unit: 'mg/dL', referenceRange: '70-100'}]) },
    { name: 'Blood Sugar Post Prandial', code: 'BSPP', category: 'Biochemistry', price: 150.00, turnaroundHours: 6, parameters: JSON.stringify([{name: 'Glucose PP', unit: 'mg/dL', referenceRange: '100-140'}]) },
    { name: 'HbA1c', code: 'HBA1C', category: 'Biochemistry', price: 500.00, turnaroundHours: 48, parameters: JSON.stringify([{name: 'HbA1c', unit: '%', referenceRange: '4-6'}]) },
    { name: 'Lipid Profile', code: 'LP', category: 'Biochemistry', price: 600.00, turnaroundHours: 24, parameters: JSON.stringify([{name: 'Total Cholesterol', unit: 'mg/dL', referenceRange: '150-200'}, {name: 'HDL', unit: 'mg/dL', referenceRange: '40-60'}]) },
    { name: 'Liver Function Test', code: 'LFT', category: 'Biochemistry', price: 700.00, turnaroundHours: 24, parameters: JSON.stringify([{name: 'Bilirubin', unit: 'mg/dL', referenceRange: '0.1-1.2'}, {name: 'SGPT', unit: 'U/L', referenceRange: '7-56'}]) },
    { name: 'Kidney Function Test', code: 'KFT', category: 'Biochemistry', price: 650.00, turnaroundHours: 24, parameters: JSON.stringify([{name: 'Creatinine', unit: 'mg/dL', referenceRange: '0.7-1.3'}, {name: 'Urea', unit: 'mg/dL', referenceRange: '7-20'}]) },
    { name: 'Thyroid Profile (T3, T4, TSH)', code: 'TP', category: 'Endocrinology', price: 800.00, turnaroundHours: 48, parameters: JSON.stringify([{name: 'T3', unit: 'ng/dL', referenceRange: '80-200'}, {name: 'T4', unit: 'ug/dL', referenceRange: '5-12'}, {name: 'TSH', unit: 'mIU/L', referenceRange: '0.4-4'}]) },
    { name: 'Urine Routine', code: 'UR', category: 'Pathology', price: 100.00, turnaroundHours: 6, parameters: JSON.stringify([{name: 'Color', unit: '', referenceRange: 'Pale Yellow'}, {name: 'pH', unit: '', referenceRange: '4.6-8'}]) },
    { name: 'Chest X-Ray', code: 'CXR', category: 'Radiology', price: 400.00, turnaroundHours: 24, parameters: JSON.stringify([{name: 'Chest PA View', unit: '', referenceRange: 'Normal'}]) },
  ];

  for (const test of labTests) {
    await prisma.labTest.upsert({
      where: {
        hospitalId_code: {
          hospitalId: hospital.id,
          code: test.code,
        },
      },
      update: {},
      create: {
        hospitalId: hospital.id,
        name: test.name,
        code: test.code,
        category: test.category,
        price: test.price,
        turnaroundHours: test.turnaroundHours,
        parameters: test.parameters,
        isActive: true,
      },
    });
  }

  console.log('✅ Lab Tests created:', labTests.length);

  console.log('\n🎉 Seeding completed successfully!\n');
  console.log('════════════════════════════════════════════════════════════');
  console.log('📋 LOGIN CREDENTIALS');
  console.log('════════════════════════════════════════════════════════════');
  console.log('\n👥 STAFF LOGIN (Email/Password):');
  console.log('   Password for all staff: password123\n');
  console.log('   Admin:        admin@hospital.com');
  console.log('   Nurse:        nurse@hospital.com');
  console.log('   Pharmacist:   pharmacy@hospital.com');
  console.log('   Lab Tech:     lab@hospital.com');
  console.log('   Receptionist: reception@hospital.com');
  console.log('\n👨‍⚕️ DOCTORS BY SPECIALIZATION:');
  console.log('   Password for all doctors: password123\n');
  console.log('   CARDIOLOGY:');
  console.log('     - cardio1@hospital.com (Dr. Rajesh Kumar) - ₹800');
  console.log('     - cardio2@hospital.com (Dr. Priya Menon) - ₹750');
  console.log('   DERMATOLOGY:');
  console.log('     - derma1@hospital.com (Dr. Anita Sharma) - ₹600');
  console.log('     - derma2@hospital.com (Dr. Vikram Patel) - ₹550');
  console.log('   ORTHOPEDICS:');
  console.log('     - ortho1@hospital.com (Dr. Suresh Reddy) - ₹700');
  console.log('     - ortho2@hospital.com (Dr. Meera Iyer) - ₹650');
  console.log('   PEDIATRICS:');
  console.log('     - ped1@hospital.com (Dr. Arun Nair) - ₹500');
  console.log('     - ped2@hospital.com (Dr. Sunita Gupta) - ₹450');
  console.log('   GENERAL MEDICINE:');
  console.log('     - genmed1@hospital.com (Dr. John Smith) - ₹400');
  console.log('     - genmed2@hospital.com (Dr. Kavita Rao) - ₹350');
  console.log('\n👤 PATIENT LOGIN (OTP-based):');
  console.log('   Mobile: +91-9876543220');
  console.log('   (OTP will be sent to this number in production)');
  console.log('════════════════════════════════════════════════════════════\n');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
