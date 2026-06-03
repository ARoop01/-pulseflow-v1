import { Router } from 'express';
import { verifyToken } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();

function generateConfirmationCode() {
  return `PF-${Math.floor(100000 + Math.random() * 900000)}`;
}

// GET /api/appointments
router.get('/', verifyToken, async (req, res) => {
  try {
    let appointments;

    if (req.user.role === 'PATIENT') {
      const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
      if (!patient) return res.status(404).json({ error: 'Patient not found' });

      appointments = await prisma.appointment.findMany({
        where: { patientId: patient.id },
        include: {
          doctor: {
            include: { user: { select: { name: true, avatarUrl: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    } else {
      const doctor = await prisma.doctor.findUnique({ where: { userId: req.user.id } });
      if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

      appointments = await prisma.appointment.findMany({
        where: { doctorId: doctor.id },
        include: {
          patient: {
            include: { user: { select: { name: true, avatarUrl: true } } },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
    }

    // Shape to match frontend expectations
    const formatted = appointments.map((a) => ({
      id: a.confirmationCode,
      doctor: a.doctor
        ? {
            id: a.doctorId,
            name: a.doctor.user.name,
            specialty: a.doctor.specialty,
            avatar: a.doctor.user.avatarUrl,
            qualification: a.doctor.qualification,
            workplace: a.doctor.workplace,
            fee: `₹${a.doctor.feeInr.toLocaleString('en-IN')}`,
          }
        : undefined,
      patient: a.patient
        ? { id: a.patientId, name: a.patient.user.name, avatar: a.patient.user.avatarUrl }
        : undefined,
      date: a.scheduledDate,
      slot: a.scheduledSlot,
      type: a.type,
      status: a.status,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('[appointments/list]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/appointments
router.post('/', verifyToken, async (req, res) => {
  try {
    const { doctorId, scheduledDate, scheduledSlot, type = 'SCHEDULED' } = req.body;

    if (!doctorId || !scheduledDate || !scheduledSlot) {
      return res.status(400).json({ error: 'doctorId, scheduledDate, scheduledSlot required' });
    }

    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const result = await prisma.$transaction(async (tx) => {
      // Find and lock the slot
      const slot = await tx.doctorAvailability.findFirst({
        where: { doctorId, availableDate: scheduledDate, timeSlot: scheduledSlot, isBooked: false },
      });

      if (!slot) {
        throw Object.assign(new Error('Slot no longer available'), { status: 409 });
      }

      // Mark slot as booked
      await tx.doctorAvailability.update({
        where: { id: slot.id },
        data: { isBooked: true },
      });

      // Create appointment
      const confirmationCode = generateConfirmationCode();
      const appointment = await tx.appointment.create({
        data: {
          confirmationCode,
          patientId: patient.id,
          doctorId,
          scheduledDate,
          scheduledSlot,
          type,
          status: 'CONFIRMED',
        },
        include: {
          doctor: { include: { user: { select: { name: true, avatarUrl: true } } } },
        },
      });

      return appointment;
    });

    res.status(201).json({
      id: result.confirmationCode,
      doctor: {
        id: result.doctorId,
        name: result.doctor.user.name,
        specialty: result.doctor.specialty,
        avatar: result.doctor.user.avatarUrl,
        qualification: result.doctor.qualification,
        workplace: result.doctor.workplace,
        fee: `₹${result.doctor.feeInr.toLocaleString('en-IN')}`,
      },
      date: result.scheduledDate,
      slot: result.scheduledSlot,
      type: result.type,
      status: result.status,
    });
  } catch (err) {
    console.error('[appointments/create]', err);
    res.status(err.status || 500).json({ error: err.message });
  }
});

export default router;
