import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../../src/lib/prisma.js';

const hash = (pw) => bcrypt.hash(pw, 4); // 4 rounds — fast for tests

export async function createPatient(overrides = {}) {
  const email = overrides.email || `patient_${Date.now()}_${Math.random().toString(36).slice(2)}@test.local`;
  const user = await prisma.user.create({
    data: {
      name: overrides.name || 'Test Patient',
      email,
      phone: '9999999999',
      passwordHash: await hash(overrides.password || 'test1234'),
      role: 'PATIENT',
    },
  });
  const patient = await prisma.patient.create({ data: { userId: user.id } });
  const token = jwt.sign({ id: user.id, role: 'PATIENT', email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user, patient, token };
}

export async function createDoctor(overrides = {}) {
  const email = overrides.email || `doctor_${Date.now()}_${Math.random().toString(36).slice(2)}@test.local`;
  const user = await prisma.user.create({
    data: {
      name: overrides.name || 'Test Doctor',
      email,
      phone: '8888888888',
      passwordHash: await hash(overrides.password || 'test1234'),
      role: 'DOCTOR',
    },
  });
  const doctor = await prisma.doctor.create({
    data: {
      userId: user.id,
      specialty: overrides.specialty || 'General Health',
      qualification: overrides.qualification || 'MBBS',
      workplace: 'Test Hospital',
      location: 'Test City',
      feeInr: overrides.feeInr || 500,
      experienceYears: 5,
    },
  });
  const token = jwt.sign({ id: user.id, role: 'DOCTOR', email: user.email }, process.env.JWT_SECRET, { expiresIn: '1h' });
  return { user, doctor, token };
}

export async function cleanTestData() {
  // SQLite FK constraints require deleting in dependency order
  // Disable FK checks to allow bulk deletion cleanly
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = OFF;');
  await prisma.symptomCheckItem.deleteMany();
  await prisma.symptomCheckSession.deleteMany();
  await prisma.sessionChatMessage.deleteMany();
  await prisma.telehealthSession.deleteMany();
  await prisma.consultRequest.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.wellnessSession.deleteMany();
  await prisma.healthRecord.deleteMany();
  await prisma.patientVitals.deleteMany();
  await prisma.doctorAvailability.deleteMany();
  await prisma.doctorCertification.deleteMany();
  await prisma.patientOccupationalExposure.deleteMany();
  await prisma.patientHereditaryCondition.deleteMany();
  await prisma.patientMedicalIntake.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.doctor.deleteMany();
  await prisma.user.deleteMany({ where: { email: { endsWith: '@test.local' } } });
  await prisma.$executeRawUnsafe('PRAGMA foreign_keys = ON;');
}

export { prisma };
