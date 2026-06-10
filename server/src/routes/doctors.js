import { Router } from 'express';
import prisma from '../lib/prisma.js';

const router = Router();

// GET /api/doctors?specialty=Cardiology
router.get('/', async (req, res) => {
  try {
    const { specialty } = req.query;
    const where = specialty && specialty !== 'All' ? { specialty } : {};

    const doctors = await prisma.doctor.findMany({
      where,
      include: {
        user: { select: { name: true, email: true, phone: true, avatarUrl: true } },
        certifications: true,
        availability: {
          where: { isBooked: false },
          orderBy: { availableDate: 'asc' },
        },
      },
      orderBy: { rating: 'desc' },
    });

    const formatted = doctors.map((d) => ({
      id: d.id,
      name: d.user.name,
      email: d.user.email,
      phone: d.user.phone,
      avatar: d.user.avatarUrl,
      specialty: d.specialty,
      qualification: d.qualification,
      workplace: d.workplace,
      location: d.location,
      fee: `₹${d.feeInr.toLocaleString('en-IN')}`,
      feeInr: d.feeInr,
      availableMinutesDaily: d.availableMinutesDaily,
      exp: d.experienceYears,
      rating: d.rating,
      reviews: d.reviewCount,
      isVerified: d.isVerified,
      certifications: d.certifications.map((c) => ({ name: c.degreeName, fileUrl: c.certificateFileUrl || null })),
      // Group availability into days/slots for frontend compatibility
      days: [...new Set(d.availability.map((a) => a.availableDate))],
      slots: [...new Set(d.availability.map((a) => a.timeSlot))],
    }));

    res.json(formatted);
  } catch (err) {
    console.error('[doctors/list]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/doctors/:id
router.get('/:id', async (req, res) => {
  try {
    const doctor = await prisma.doctor.findUnique({
      where: { id: req.params.id },
      include: {
        user: { select: { name: true, email: true, phone: true, avatarUrl: true } },
        certifications: true,
        availability: {
          where: { isBooked: false },
          orderBy: [{ availableDate: 'asc' }, { timeSlot: 'asc' }],
        },
      },
    });

    if (!doctor) return res.status(404).json({ error: 'Doctor not found' });

    res.json({
      id: doctor.id,
      name: doctor.user.name,
      email: doctor.user.email,
      phone: doctor.user.phone,
      avatar: doctor.user.avatarUrl,
      specialty: doctor.specialty,
      qualification: doctor.qualification,
      workplace: doctor.workplace,
      location: doctor.location,
      fee: `₹${doctor.feeInr.toLocaleString('en-IN')}`,
      feeInr: doctor.feeInr,
      availableMinutesDaily: doctor.availableMinutesDaily,
      exp: doctor.experienceYears,
      rating: doctor.rating,
      reviews: doctor.reviewCount,
      isVerified: doctor.isVerified,
      certifications: doctor.certifications.map((c) => ({ name: c.degreeName, fileUrl: c.certificateFileUrl || null })),
      days: [...new Set(doctor.availability.map((a) => a.availableDate))],
      slots: [...new Set(doctor.availability.map((a) => a.timeSlot))],
      availability: doctor.availability,
    });
  } catch (err) {
    console.error('[doctors/get]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
