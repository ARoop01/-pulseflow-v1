import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import { upload, persistFile } from '../middleware/upload.js';
import prisma from '../lib/prisma.js';

const router = Router();

function generateRecordCode() {
  return `REC-${Math.floor(10000 + Math.random() * 90000)}`;
}

// GET /api/health-records
router.get('/', verifyToken, requireRole('PATIENT'), async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const { category } = req.query;
    const where = { patientId: patient.id };
    if (category && category !== 'All') {
      const map = { Prescriptions: 'PRESCRIPTIONS', 'Lab Reports': 'LAB_REPORTS', Vaccines: 'VACCINES' };
      where.category = map[category] || category;
    }

    const records = await prisma.healthRecord.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    const categoryDisplay = { PRESCRIPTIONS: 'Prescriptions', LAB_REPORTS: 'Lab Reports', VACCINES: 'Vaccines' };

    const formatted = records.map((r) => ({
      id: r.recordCode,
      title: r.title,
      category: categoryDisplay[r.category] || r.category,
      doctor: r.authorizedByName,
      date: r.authorizedDate,
      desc: r.description,
      fileUrl: r.fileUrl,
      source: r.source,
    }));

    res.json(formatted);
  } catch (err) {
    console.error('[records/list]', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/health-records
router.post('/', verifyToken, requireRole('PATIENT'), upload.single('file'), persistFile, async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const { title, category, authorizedByName, authorizedDate, description } = req.body;
    if (!title) return res.status(400).json({ error: 'title is required' });

    const categoryMap = { Prescription: 'PRESCRIPTIONS', 'Lab Report': 'LAB_REPORTS', Vaccine: 'VACCINES' };
    const dbCategory = categoryMap[category] || 'PRESCRIPTIONS';

    const fileUrl = req.file?.fileUrl ?? null;

    const record = await prisma.healthRecord.create({
      data: {
        recordCode: generateRecordCode(),
        patientId: patient.id,
        title,
        category: dbCategory,
        authorizedByName: authorizedByName || 'Self-Uploaded',
        authorizedDate: authorizedDate || new Date().toISOString().split('T')[0],
        description: description || 'Patient uploaded document.',
        fileUrl,
        source: 'SELF_UPLOADED',
      },
    });

    res.status(201).json({
      id: record.recordCode,
      title: record.title,
      category: { PRESCRIPTIONS: 'Prescriptions', LAB_REPORTS: 'Lab Reports', VACCINES: 'Vaccines' }[record.category],
      doctor: record.authorizedByName,
      date: record.authorizedDate,
      desc: record.description,
      fileUrl: record.fileUrl,
    });
  } catch (err) {
    console.error('[records/create]', err);
    res.status(500).json({ error: err.message });
  }
});

export default router;
