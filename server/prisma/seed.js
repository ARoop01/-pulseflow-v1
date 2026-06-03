import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const AVATAR_BASE = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=256';

// ── Doctor avatar map (same paths used by the frontend) ──────────────────────
const AVATARS = {
  'dr-sharma':   '/src/assets/dr_vance.png',
  'dr-mehta':    '/src/assets/dr_jenkins.png',
  'dr-malhotra': '/src/assets/dr_mercer.png',
  'dr-rao':      '/src/assets/dr_rostova.png',
  'dr-nair':     '/src/assets/dr_jenkins.png',
  'dr-patel':    '/src/assets/dr_patel.png',
  'dr-verma':    '/src/assets/dr_vance.png',
  'dr-krishnan': '/src/assets/dr_rostova.png',
  'dr-divan':    '/src/assets/dr_mercer.png',
};

// ── Doctor definitions (exact match with App.jsx state) ─────────────────────
const doctorDefs = [
  {
    slug: 'dr-sharma',
    name: 'Dr. Rajesh Sharma',
    email: 'sharma@apollo.in',
    phone: '+91 99112 23344',
    specialty: 'Cardiology',
    qualification: 'MBBS, MD, DM (Cardiology)',
    workplace: 'Senior Consultant Cardiologist at Apollo Hospital, Delhi',
    location: 'Delhi, India',
    feeInr: 1500,
    availMinutes: 270,
    exp: 18,
    rating: 4.9,
    reviews: 184,
    degrees: ['MBBS', 'MD (General Medicine)', 'DM (Cardiology)'],
    days: ['Mon, May 25', 'Wed, May 27', 'Fri, May 29'],
    slots: ['09:00 AM', '10:30 AM', '01:00 PM', '02:30 PM', '04:00 PM'],
  },
  {
    slug: 'dr-mehta',
    name: 'Dr. Anjali Mehta',
    email: 'mehta@fortis.in',
    phone: '+91 98123 45678',
    specialty: 'Cardiology',
    qualification: 'MBBS, MD, DNB (Cardiology)',
    workplace: 'Consultant Cardiologist at Fortis Escorts Clinic, Mumbai',
    location: 'Mumbai, India',
    feeInr: 1200,
    availMinutes: 240,
    exp: 10,
    rating: 4.7,
    reviews: 112,
    degrees: ['MBBS', 'MD (General Medicine)', 'DNB'],
    days: ['Tue, May 26', 'Thu, May 28'],
    slots: ['10:00 AM', '11:30 AM', '03:00 PM', '04:30 PM'],
  },
  {
    slug: 'dr-malhotra',
    name: 'Dr. Vikram Malhotra',
    email: 'malhotra@max.in',
    phone: '+91 97111 22333',
    specialty: 'Neurology',
    qualification: 'MBBS, MD, DM (Neurology)',
    workplace: 'Senior Neurologist at Max Super Speciality Hospital, Gurgaon',
    location: 'Gurgaon, India',
    feeInr: 1400,
    availMinutes: 240,
    exp: 15,
    rating: 4.8,
    reviews: 98,
    degrees: ['MBBS', 'MD (General Medicine)', 'DM (Neurology)'],
    days: ['Mon, May 25', 'Wed, May 27', 'Fri, May 29'],
    slots: ['09:30 AM', '11:00 AM', '02:00 PM', '03:30 PM'],
  },
  {
    slug: 'dr-rao',
    name: 'Dr. Sneha Rao',
    email: 'rao@brainspine.in',
    phone: '+91 95444 55666',
    specialty: 'Neurology',
    qualification: 'MBBS, MD, DM (Neurology)',
    workplace: 'Neurology Specialist at Brain & Spine Care Clinic, Bangalore',
    location: 'Bangalore, India',
    feeInr: 1000,
    availMinutes: 180,
    exp: 8,
    rating: 4.6,
    reviews: 74,
    degrees: ['MBBS', 'MD (General Medicine)', 'DM (Neurology)'],
    days: ['Tue, May 26', 'Thu, May 28'],
    slots: ['10:30 AM', '12:00 PM', '04:00 PM', '05:30 PM'],
  },
  {
    slug: 'dr-nair',
    name: 'Dr. Priya Nair',
    email: 'nair@rainbow.in',
    phone: '+91 96777 88999',
    specialty: 'Pediatrics',
    qualification: 'MBBS, MD, DCH (Pediatrics)',
    workplace: 'Consultant Pediatrician at Rainbow Children Hospital, Hyderabad',
    location: 'Hyderabad, India',
    feeInr: 900,
    availMinutes: 300,
    exp: 12,
    rating: 4.9,
    reviews: 210,
    degrees: ['MBBS', 'MD (Pediatrics)', 'DCH'],
    days: ['Mon, May 25', 'Tue, May 26', 'Thu, May 28'],
    slots: ['09:00 AM', '10:30 AM', '11:30 AM', '03:00 PM', '04:30 PM'],
  },
  {
    slug: 'dr-patel',
    name: 'Dr. Amit Patel',
    email: 'patel@kidscare.in',
    phone: '+91 94333 22111',
    specialty: 'Pediatrics',
    qualification: 'MBBS, DNB, DCH',
    workplace: 'Senior Pediatrician at Patel Kids Private Clinic, Ahmedabad',
    location: 'Ahmedabad, India',
    feeInr: 700,
    availMinutes: 150,
    exp: 7,
    rating: 4.5,
    reviews: 88,
    degrees: ['MBBS', 'DNB', 'DCH'],
    days: ['Wed, May 27', 'Fri, May 29'],
    slots: ['10:00 AM', '11:30 AM', '02:30 PM', '04:00 PM'],
  },
  {
    slug: 'dr-verma',
    name: 'Dr. Rahul Verma',
    email: 'verma@apollo.in',
    phone: '+91 93555 44222',
    specialty: 'General Health',
    qualification: 'MBBS, MD (General Medicine)',
    workplace: 'Consultant General Physician at Apollo Clinic, Pune',
    location: 'Pune, India',
    feeInr: 600,
    availMinutes: 360,
    exp: 11,
    rating: 4.7,
    reviews: 145,
    degrees: ['MBBS', 'MD (General Medicine)'],
    days: ['Mon, May 25', 'Wed, May 27', 'Fri, May 29'],
    slots: ['09:00 AM', '10:00 AM', '11:00 AM', '02:00 PM', '03:00 PM', '04:00 PM'],
  },
  {
    slug: 'dr-krishnan',
    name: 'Dr. Deepa Krishnan',
    email: 'krishnan@familycare.in',
    phone: '+91 92666 33444',
    specialty: 'General Health',
    qualification: 'MBBS, MD, DNB (General Medicine)',
    workplace: 'Senior General Practitioner at Family Care Clinic, Chennai',
    location: 'Chennai, India',
    feeInr: 800,
    availMinutes: 300,
    exp: 14,
    rating: 4.8,
    reviews: 162,
    degrees: ['MBBS', 'MD (General Medicine)', 'DNB'],
    days: ['Tue, May 26', 'Thu, May 28'],
    slots: ['09:30 AM', '11:30 AM', '02:30 PM', '03:30 PM', '04:30 PM'],
  },
  {
    slug: 'dr-divan',
    name: 'Dr. Rohan Divan',
    email: 'divan@medanta.in',
    phone: '+91 91888 77555',
    specialty: 'Psychiatry',
    qualification: 'MBBS, MD (Psychiatry)',
    workplace: 'Consultant Psychiatrist at Medanta Hospital & MindCare Clinic, Delhi',
    location: 'Delhi, India',
    feeInr: 1800,
    availMinutes: 240,
    exp: 16,
    rating: 4.9,
    reviews: 130,
    degrees: ['MBBS', 'MD (Psychiatry)'],
    days: ['Mon, May 25', 'Wed, May 27', 'Fri, May 29'],
    slots: ['10:00 AM', '12:00 PM', '03:00 PM', '05:00 PM'],
  },
];

// ── Vitals data (exact match with Dashboard.jsx chartData) ────────────────────
const vitalsData = [
  { day: 'Mon', heartRateBpm: 68, systolicBp: 120, diastolicBp: 76, sleepHours: 7.2, dailySteps: 6500, daysAgo: 6 },
  { day: 'Tue', heartRateBpm: 74, systolicBp: 118, diastolicBp: 76, sleepHours: 7.8, dailySteps: 8100, daysAgo: 5 },
  { day: 'Wed', heartRateBpm: 65, systolicBp: 122, diastolicBp: 76, sleepHours: 8.5, dailySteps: 9400, daysAgo: 4 },
  { day: 'Thu', heartRateBpm: 82, systolicBp: 115, diastolicBp: 76, sleepHours: 6.9, dailySteps: 5900, daysAgo: 3 },
  { day: 'Fri', heartRateBpm: 70, systolicBp: 119, diastolicBp: 76, sleepHours: 8.1, dailySteps: 7600, daysAgo: 2 },
  { day: 'Sat', heartRateBpm: 73, systolicBp: 116, diastolicBp: 76, sleepHours: 8.9, dailySteps: 10200, daysAgo: 1 },
  { day: 'Sun', heartRateBpm: 69, systolicBp: 118, diastolicBp: 76, sleepHours: 8.2, dailySteps: 8432, daysAgo: 0 },
];

async function main() {
  console.log('🌱 Starting PulseFlow seed...\n');
  const pw = await bcrypt.hash('pulseflow123', 12);

  // ── 1. Seed Patient: Alex Rivera ──────────────────────────────────────────
  console.log('👤 Seeding patient Alex Rivera...');
  const alexUser = await prisma.user.upsert({
    where: { email: 'alex@pulseflow.in' },
    update: {},
    create: {
      id: 'user-alex-rivera',
      name: 'Alex Rivera',
      email: 'alex@pulseflow.in',
      phone: '+91 98765 43210',
      passwordHash: pw,
      role: 'PATIENT',
      avatarUrl: AVATAR_BASE,
    },
  });

  const alexPatient = await prisma.patient.upsert({
    where: { userId: alexUser.id },
    update: {},
    create: {
      id: 'patient-alex-rivera',
      userId: alexUser.id,
      bloodType: 'O-Positive',
      gender: 'Male',
    },
  });

  await prisma.patientMedicalIntake.upsert({
    where: { patientId: alexPatient.id },
    update: {},
    create: {
      patientId: alexPatient.id,
      occupation: 'Desk Job / IT Developer',
      workHoursWeekly: 45,
      workExertion: 'Moderate',
      personalHistory: 'Occasional mild eye strain and sleeplessness after late-night release builds.',
    },
  });

  // Hereditary conditions
  const hereditaryList = ['High Blood Pressure', 'Diabetes (Type 2)'];
  for (const cond of hereditaryList) {
    const exists = await prisma.patientHereditaryCondition.findFirst({
      where: { patientId: alexPatient.id, conditionName: cond },
    });
    if (!exists) {
      await prisma.patientHereditaryCondition.create({
        data: { patientId: alexPatient.id, conditionName: cond },
      });
    }
  }

  // Occupational exposures
  const exposureList = ['screens'];
  for (const exp of exposureList) {
    const exists = await prisma.patientOccupationalExposure.findFirst({
      where: { patientId: alexPatient.id, exposureType: exp },
    });
    if (!exists) {
      await prisma.patientOccupationalExposure.create({
        data: { patientId: alexPatient.id, exposureType: exp },
      });
    }
  }

  // ── 2. Seed Vitals for Alex ────────────────────────────────────────────────
  console.log('📊 Seeding patient vitals...');
  const existingVitals = await prisma.patientVitals.count({ where: { patientId: alexPatient.id } });
  if (existingVitals === 0) {
    for (const v of vitalsData) {
      const d = new Date();
      d.setDate(d.getDate() - v.daysAgo);
      d.setHours(8, 0, 0, 0);
      await prisma.patientVitals.create({
        data: {
          patientId: alexPatient.id,
          recordedAt: d,
          heartRateBpm: v.heartRateBpm,
          systolicBp: v.systolicBp,
          diastolicBp: v.diastolicBp,
          sleepHours: v.sleepHours,
          dailySteps: v.dailySteps,
        },
      });
    }
  }

  // ── 3. Seed 9 Doctors ─────────────────────────────────────────────────────
  console.log('👨‍⚕️ Seeding 9 doctors...');
  const doctorMap = {};

  for (const def of doctorDefs) {
    const docUser = await prisma.user.upsert({
      where: { email: def.email },
      update: {},
      create: {
        id: `user-${def.slug}`,
        name: def.name,
        email: def.email,
        phone: def.phone,
        passwordHash: pw,
        role: 'DOCTOR',
        avatarUrl: AVATARS[def.slug],
      },
    });

    const doctor = await prisma.doctor.upsert({
      where: { id: def.slug },
      update: {
        rating: def.rating,
        reviewCount: def.reviews,
      },
      create: {
        id: def.slug,
        userId: docUser.id,
        specialty: def.specialty,
        qualification: def.qualification,
        workplace: def.workplace,
        location: def.location,
        feeInr: def.feeInr,
        availableMinutesDaily: def.availMinutes,
        experienceYears: def.exp,
        rating: def.rating,
        reviewCount: def.reviews,
        isVerified: true,
      },
    });

    doctorMap[def.slug] = doctor;

    // Certifications (one per degree)
    for (const deg of def.degrees) {
      const exists = await prisma.doctorCertification.findFirst({
        where: { doctorId: doctor.id, degreeName: deg },
      });
      if (!exists) {
        await prisma.doctorCertification.create({
          data: { doctorId: doctor.id, degreeName: deg },
        });
      }
    }

    // Availability slots
    for (const day of def.days) {
      for (const slot of def.slots) {
        await prisma.doctorAvailability.upsert({
          where: { doctorId_availableDate_timeSlot: { doctorId: doctor.id, availableDate: day, timeSlot: slot } },
          update: {},
          create: { doctorId: doctor.id, availableDate: day, timeSlot: slot, isBooked: false },
        });
      }
    }

    console.log(`  ✓ ${def.name}`);
  }

  // ── 4. Seed Pre-existing Appointment PF-491208 ────────────────────────────
  console.log('\n📅 Seeding appointment PF-491208...');
  await prisma.appointment.upsert({
    where: { confirmationCode: 'PF-491208' },
    update: {},
    create: {
      confirmationCode: 'PF-491208',
      patientId: alexPatient.id,
      doctorId: 'dr-sharma',
      scheduledDate: 'Mon, May 25',
      scheduledSlot: 'Mon, May 25 at 10:30 AM',
      type: 'SCHEDULED',
      status: 'CONFIRMED',
    },
  });

  // Mark that slot as booked
  await prisma.doctorAvailability.updateMany({
    where: { doctorId: 'dr-sharma', availableDate: 'Mon, May 25', timeSlot: '10:30 AM' },
    data: { isBooked: true },
  });

  // ── 5. Seed 3 Health Records ──────────────────────────────────────────────
  console.log('🗄️  Seeding health records...');
  const records = [
    {
      recordCode: 'REC-39201',
      title: 'Cardiac Telemetry Intake Brief',
      category: 'LAB_REPORTS',
      authorizedByDoctorId: 'dr-sharma',
      authorizedByName: 'Dr. Rajesh Sharma (Apollo Hospital)',
      authorizedDate: '2026-05-18',
      description: 'ECG baseline readings showing strong sinus rhythm at 72bpm. Recommended standard monitoring parameters.',
      source: 'DOCTOR_ISSUED',
    },
    {
      recordCode: 'REC-84910',
      title: 'Pfizer Booster Certification',
      category: 'VACCINES',
      authorizedByDoctorId: null,
      authorizedByName: 'Max Hospital Vaccination Center',
      authorizedDate: '2026-02-12',
      description: 'COVID-19 Spike Glycoprotein booster dose verified and recorded securely in patient immunization index.',
      source: 'DOCTOR_ISSUED',
    },
    {
      recordCode: 'REC-19283',
      title: 'Lipid Profiles & Metabolic Panel',
      category: 'LAB_REPORTS',
      authorizedByDoctorId: 'dr-verma',
      authorizedByName: 'Dr. Rahul Verma (Apollo Clinic)',
      authorizedDate: '2026-04-10',
      description: 'Cholesterol: 180 mg/dL, HDL: 52 mg/dL, LDL: 104 mg/dL. All metabolic parameters show healthy baseline ranges.',
      source: 'DOCTOR_ISSUED',
    },
  ];

  for (const rec of records) {
    await prisma.healthRecord.upsert({
      where: { recordCode: rec.recordCode },
      update: {},
      create: { ...rec, patientId: alexPatient.id },
    });
    console.log(`  ✓ ${rec.recordCode}: ${rec.title}`);
  }

  console.log('\n✅ Seed complete!');
  console.log(`   Patient: alex@pulseflow.in / pulseflow123`);
  console.log(`   Doctor:  sharma@apollo.in  / pulseflow123`);
  console.log(`   (All 9 doctors share password: pulseflow123)\n`);
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
