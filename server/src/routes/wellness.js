import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();

// POST /api/wellness
router.post('/', verifyToken, requireRole('PATIENT'), async (req, res) => {
  try {
    const { sessionType, value } = req.body;
    if (!sessionType || value === undefined) {
      return res.status(400).json({ error: 'sessionType and value are required' });
    }
    if (!['BREATHING', 'HYDRATION'].includes(sessionType)) {
      return res.status(400).json({ error: 'sessionType must be BREATHING or HYDRATION' });
    }

    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const entry = await prisma.wellnessSession.create({
      data: { patientId: patient.id, sessionType, value: parseInt(value) },
    });

    res.status(201).json(entry);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/wellness/today
router.get('/today', verifyToken, requireRole('PATIENT'), async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const sessions = await prisma.wellnessSession.findMany({
      where: { patientId: patient.id, completedAt: { gte: startOfDay } },
    });

    const breathingCycles = sessions.filter((s) => s.sessionType === 'BREATHING').reduce((sum, s) => sum + s.value, 0);
    const hydrationCups = sessions.filter((s) => s.sessionType === 'HYDRATION').reduce((sum, s) => sum + s.value, 0);

    res.json({ breathingCycles, hydrationCups, sessions });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
