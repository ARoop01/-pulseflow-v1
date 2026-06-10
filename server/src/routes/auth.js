import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../lib/prisma.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = Router();

const COOKIE_OPTS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
};

function signToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

// Save a base64-encoded credential file to disk; returns the URL path
async function saveCredentialFile(base64Data, mimeType) {
  const extMap = { 'application/pdf': '.pdf', 'image/jpeg': '.jpg', 'image/jpg': '.jpg', 'image/png': '.png' };
  const ext = extMap[mimeType] || '.pdf';
  const filename = `${uuidv4()}${ext}`;
  const uploadsDir = path.join(__dirname, '../../../uploads/credentials');
  await fs.mkdir(uploadsDir, { recursive: true });
  const buffer = Buffer.from(base64Data, 'base64');
  await fs.writeFile(path.join(uploadsDir, filename), buffer);
  return `/uploads/credentials/${filename}`;
}

// Compute availability dates for the next 14 days (Mon–Fri) with 3 default time slots
function buildDefaultAvailability(doctorId) {
  const WEEKDAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const defaultSlots = ['10:00 AM', '12:00 PM', '03:00 PM'];
  const workdays = new Set([1, 2, 3, 4, 5]); // Mon–Fri

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const rows = [];
  const cursor = new Date(today);
  for (let i = 0; i <= 14; i++) {
    if (workdays.has(cursor.getDay())) {
      const dateStr = `${WEEKDAY_NAMES[cursor.getDay()]}, ${MONTH_NAMES[cursor.getMonth()]} ${cursor.getDate()}`;
      for (const slot of defaultSlots) {
        rows.push({ doctorId, availableDate: dateStr, timeSlot: slot, isBooked: false });
      }
    }
    cursor.setDate(cursor.getDate() + 1);
  }
  return rows;
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

    // Save credential file before transaction if provided
    let credentialFileUrl = null;
    if (role === 'DOCTOR' && doctorProfile?.credentialBase64 && doctorProfile?.credentialMimeType) {
      try {
        credentialFileUrl = await saveCredentialFile(doctorProfile.credentialBase64, doctorProfile.credentialMimeType);
      } catch (uploadErr) {
        console.warn('[auth/register] credential file save failed, continuing:', uploadErr.message);
      }
    }

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
            data: dp.degrees.map((d) => ({
              doctorId: doctor.id,
              degreeName: d,
              certificateFileUrl: credentialFileUrl,
            })),
          });
        }

        // Auto-seed Mon–Fri availability for next 14 days so patients can book immediately
        const availRows = buildDefaultAvailability(doctor.id);
        if (availRows.length) {
          await tx.doctorAvailability.createMany({ data: availRows });
        }

        return { user, doctorId: doctor.id };
      }
    });

    const token = signToken(result.user);
    const { passwordHash: _, ...safeUser } = result.user;

    res.cookie('token', token, COOKIE_OPTS);
    res.status(201).json({
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

    res.cookie('token', token, COOKIE_OPTS);
    res.json({ user: safeUser, profileId });
  } catch (err) {
    console.error('[auth/login]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token', { httpOnly: true, sameSite: 'strict', secure: process.env.NODE_ENV === 'production' });
  res.json({ message: 'Logged out' });
});

export default router;
