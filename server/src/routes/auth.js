import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../lib/prisma.js';

const router = Router();

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password, role, avatarUrl, medicalIntake, doctorProfile } = req.body;

    if (!name || !email || !phone || !password || !role) {
      return res.status(400).json({ error: 'name, email, phone, password, role are required' });
    }
    if (!['PATIENT', 'DOCTOR'].includes(role)) {
      return res.status(400).json({ error: 'role must be PATIENT or DOCTOR' });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return res.status(409).json({ error: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, phone, passwordHash, role, avatarUrl },
      });

      if (role === 'PATIENT') {
        const patient = await tx.patient.create({
          data: {
            userId: user.id,
            bloodType: medicalIntake?.bloodType,
          },
        });

        if (medicalIntake) {
          await tx.patientMedicalIntake.create({
            data: {
              patientId: patient.id,
              occupation: medicalIntake.occupation || 'Desk Job / IT Developer',
              workHoursWeekly: medicalIntake.workHours || 40,
              workExertion: medicalIntake.workExertion || 'Moderate',
              personalHistory: medicalIntake.personalHistory || '',
            },
          });

          if (medicalIntake.hereditary?.length) {
            await tx.patientHereditaryCondition.createMany({
              data: medicalIntake.hereditary.map((c) => ({ patientId: patient.id, conditionName: c })),
            });
          }

          if (medicalIntake.exposures?.length) {
            await tx.patientOccupationalExposure.createMany({
              data: medicalIntake.exposures.map((e) => ({ patientId: patient.id, exposureType: e })),
            });
          }
        }

        return { user, patientId: patient.id };
      }

      if (role === 'DOCTOR') {
        const dp = doctorProfile || {};
        const doctor = await tx.doctor.create({
          data: {
            id: dp.slug || undefined,
            userId: user.id,
            specialty: dp.department || dp.specialty || 'General Health',
            qualification: dp.qualification || 'MBBS',
            workplace: dp.workplace || 'Care Hospital, India',
            location: dp.location || 'India',
            feeInr: dp.feeInr || 800,
            availableMinutesDaily: dp.availMinutes || 120,
            experienceYears: dp.experienceYears || 6,
            rating: 5.0,
            reviewCount: 0,
            isVerified: false,
          },
        });

        if (dp.degrees?.length) {
          await tx.doctorCertification.createMany({
            data: dp.degrees.map((d) => ({ doctorId: doctor.id, degreeName: d })),
          });
        }

        return { user, doctorId: doctor.id };
      }
    });

    const token = signToken(result.user);
    const { passwordHash: _, ...safeUser } = result.user;

    res.status(201).json({
      token,
      user: safeUser,
      patientId: result.patientId,
      doctorId: result.doctorId,
    });
  } catch (err) {
    console.error('[auth/register]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'email and password required' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    // Fetch related profile id
    let profileId = null;
    if (user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: user.id } });
      profileId = patient?.id;
    } else {
      const doctor = await prisma.doctor.findUnique({ where: { userId: user.id } });
      profileId = doctor?.id;
    }

    const token = signToken(user);
    const { passwordHash: _, ...safeUser } = user;

    res.json({ token, user: safeUser, profileId });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
