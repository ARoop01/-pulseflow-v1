import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/patients/me
router.get('/me', verifyToken, requireRole('PATIENT'), async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { name: true, email: true, phone: true, avatarUrl: true } },
        intake: true,
        hereditary: true,
        exposures: true,
      },
    });

    if (!patient) return res.status(404).json({ error: 'Patient profile not found' });

    res.json({
      id: patient.id,
      userId: patient.userId,
      name: patient.user.name,
      email: patient.user.email,
      phone: patient.user.phone,
      avatar: patient.user.avatarUrl,
      bloodType: patient.bloodType,
      gender: patient.gender,
      dateOfBirth: patient.dateOfBirth,
      medicalIntake: patient.intake
        ? {
            occupation: patient.intake.occupation,
            workHours: patient.intake.workHoursWeekly,
            workExertion: patient.intake.workExertion,
            personalHistory: patient.intake.personalHistory,
            hereditary: patient.hereditary.map((h) => h.conditionName),
            exposures: patient.exposures.map((e) => e.exposureType),
          }
        : null,
    });
  } catch (err) {
    console.error('[patients/me]', err);
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/patients/me
router.patch('/me', verifyToken, requireRole('PATIENT'), async (req, res) => {
  try {
    const { bloodType, gender, dateOfBirth, medicalIntake } = req.body;

    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    await prisma.$transaction(async (tx) => {
      await tx.patient.update({
        where: { id: patient.id },
        data: { bloodType, gender, dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined },
      });

      if (medicalIntake) {
        await tx.patientMedicalIntake.upsert({
          where: { patientId: patient.id },
          create: {
            patientId: patient.id,
            occupation: medicalIntake.occupation,
            workHoursWeekly: medicalIntake.workHours,
            workExertion: medicalIntake.workExertion,
            personalHistory: medicalIntake.personalHistory,
          },
          update: {
            occupation: medicalIntake.occupation,
            workHoursWeekly: medicalIntake.workHours,
            workExertion: medicalIntake.workExertion,
            personalHistory: medicalIntake.personalHistory,
          },
        });
      }
    });

    res.json({ message: 'Profile updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
