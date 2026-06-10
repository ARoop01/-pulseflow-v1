import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken, requireRole } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();

// POST /api/consult-requests
// Patient dispatches a Rapido live request to a specialty queue
router.post('/', verifyToken, requireRole('PATIENT'), async (req, res) => {
  try {
    const { specialty, symptomsSummary, medicalIntake } = req.body;
    if (!specialty) return res.status(400).json({ error: 'specialty is required' });

    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const requestToken = uuidv4();

    const request = await prisma.consultRequest.create({
      data: {
        requestToken,
        patientId: patient.id,
        specialty,
        symptomsSummary: symptomsSummary || 'Instant consult requested',
        status: 'PENDING',
        medicalIntakeSnapshot: medicalIntake ? JSON.stringify(medicalIntake) : null,
      },
    });

    res.status(201).json({
      requestId: request.id,
      token: requestToken,
      status: request.status,
    });
  } catch (err) {
    console.error('[consults/create]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/consult-requests/:token  — Poll status
router.get('/:token', verifyToken, async (req, res) => {
  try {
    const request = await prisma.consultRequest.findUnique({
      where: { requestToken: req.params.token },
      include: {
        session: { select: { id: true, status: true } },
      },
    });
    if (!request) return res.status(404).json({ error: 'Request not found' });
    res.json(request);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
