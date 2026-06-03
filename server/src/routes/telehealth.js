import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();

function generateRecordCode() {
  return `REC-${Math.floor(10000 + Math.random() * 90000)}`;
}

// GET /api/sessions/:id
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const session = await prisma.telehealthSession.findUnique({
      where: { id: req.params.id },
      include: {
        chatMessages: { orderBy: { sentAt: 'asc' } },
        patient: { include: { user: { select: { name: true, avatarUrl: true } } } },
        doctor: { include: { user: { select: { name: true, avatarUrl: true } } } },
      },
    });
    if (!session) return res.status(404).json({ error: 'Session not found' });
    res.json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions/:id/end  — End session and auto-generate prescription
router.post('/:id/end', verifyToken, async (req, res) => {
  try {
    const session = await prisma.telehealthSession.findUnique({
      where: { id: req.params.id },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
        patient: true,
      },
    });

    if (!session) return res.status(404).json({ error: 'Session not found' });
    if (session.status === 'ENDED') return res.status(409).json({ error: 'Session already ended' });

    // End the session
    await prisma.telehealthSession.update({
      where: { id: session.id },
      data: { status: 'ENDED', endedAt: new Date() },
    });

    // Auto-generate prescription health record
    const prescId = generateRecordCode();
    const doctorName = session.doctor.user.name;
    const record = await prisma.healthRecord.create({
      data: {
        recordCode: prescId,
        patientId: session.patientId,
        title: `Clinical Consultation - ${doctorName}`,
        category: 'PRESCRIPTIONS',
        authorizedByDoctorId: session.doctorId,
        authorizedByName: doctorName,
        authorizedDate: new Date().toISOString().split('T')[0],
        description: `Telehealth follow-up consult summary notes. Authorized by ${doctorName}. Advised active recovery rest cycle, mindful breathing to regulate autonomic triggers, and logging 8 cups of water. Prescription signed digitally via PulseFlow.`,
        source: 'DOCTOR_ISSUED',
      },
    });

    res.json({
      sessionId: session.id,
      prescription: {
        id: record.recordCode,
        title: record.title,
        category: 'Prescriptions',
        doctor: record.authorizedByName,
        date: record.authorizedDate,
        desc: record.description,
      },
    });
  } catch (err) {
    console.error('[telehealth/end]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/sessions (create manually for scheduled appointment launch)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { appointmentId, patientId, doctorId } = req.body;

    const session = await prisma.telehealthSession.create({
      data: {
        sessionType: 'SCHEDULED',
        appointmentId: appointmentId || null,
        patientId,
        doctorId,
        status: 'ACTIVE',
      },
    });

    res.status(201).json(session);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
