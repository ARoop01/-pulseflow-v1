import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/users/me
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true, createdAt: true },
    });
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/users/me
router.patch('/me', verifyToken, async (req, res) => {
  try {
    const { name, phone, avatarUrl } = req.body;
    const user = await prisma.user.update({
      where: { id: req.user.id },
      data: { name, phone, avatarUrl },
      select: { id: true, name: true, email: true, phone: true, role: true, avatarUrl: true },
    });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
