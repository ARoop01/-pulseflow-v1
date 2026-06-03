import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/doctors/:id/availability
router.get('/:id/availability', async (req, res) => {
  try {
    const slots = await prisma.doctorAvailability.findMany({
      where: { doctorId: req.params.id, isBooked: false },
      orderBy: [{ availableDate: 'asc' }, { timeSlot: 'asc' }],
    });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/doctors/:id/availability  (doctor adds own slots)
router.post('/:id/availability', verifyToken, async (req, res) => {
  try {
    const { availableDate, timeSlot } = req.body;
    const slot = await prisma.doctorAvailability.create({
      data: { doctorId: req.params.id, availableDate, timeSlot, isBooked: false },
    });
    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
