import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { verifyToken, requireRole } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();

// POST /api/consult-requests  — Patient dispatches a Rapido live request
router.post('/', verifyToken, requireRole('PATIENT'), async (req, res) => {
  try {
    const { doctorId, symptomsSummary, medicalIntake } = req.body;
    if (!doctorId) return res.status(400).json({ error: 'doctorId is required' });

    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const doctor = await prisma.doctor.findUnique({ where: { id: doctorId } });
    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    const requestToken = uuidv4();

    const request = await prisma.consultRequest.create({
      data: {
        requestToken,
        patientId: patient.id,
        doctorId,
        symptomsSummary: symptomsSummary || 'Instant consult requested',
        status: 'PENDING',
        medicalIntakeSnapshot: medicalIntake || {},
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
