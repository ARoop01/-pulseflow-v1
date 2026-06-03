import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/vitals  — last 7 days for current patient
router.get('/', verifyToken, requireRole('PATIENT'), async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const vitals = await prisma.patientVitals.findMany({
      where: { patientId: patient.id },
      orderBy: { recordedAt: 'desc' },
      take: 7,
    });

    res.json(vitals.reverse()); // chronological order
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/vitals
router.post('/', verifyToken, requireRole('PATIENT'), async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const { heartRateBpm, systolicBp, diastolicBp, sleepHours, dailySteps } = req.body;

    const entry = await prisma.patientVitals.create({
      data: {
        patientId: patient.id,
        heartRateBpm,
        systolicBp,
        diastolicBp,
        sleepHours,
        dailySteps,
      },
    });

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
