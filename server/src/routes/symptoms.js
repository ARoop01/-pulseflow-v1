import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';
import { analyseSymptoms, getDiagnosticsFallback } from '../services/symptomAnalysis.js';

const router = Router();

// POST /api/symptom-checks
router.post('/', verifyToken, requireRole('PATIENT'), async (req, res) => {
  try {
    const { symptoms, severity, duration } = req.body;
    if (!symptoms?.length) return res.status(400).json({ error: 'At least one symptom required' });

    const patient = await prisma.patient.findUnique({
      where: { userId: req.user.id },
      include: {
        intake: true,
        hereditary: true,
        exposures: true,
      },
    });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    // Build patient context for Claude analysis
    const patientIntake = patient.intake
      ? {
          occupation: patient.intake.occupation,
          workExertion: patient.intake.workExertion,
          personalHistory: patient.intake.personalHistory,
          hereditary: patient.hereditary.map((h) => h.conditionName),
          exposures: patient.exposures.map((e) => e.exposureType),
        }
      : null;

    let diag;
    if (process.env.ANTHROPIC_API_KEY) {
      try {
        diag = await analyseSymptoms(symptoms, severity || 5, duration || 1, patientIntake);
      } catch (aiErr) {
        console.warn('[symptoms] Claude API error, using fallback:', aiErr.message);
        diag = getDiagnosticsFallback(symptoms);
      }
    } else {
      diag = getDiagnosticsFallback(symptoms);
    }

    const session = await prisma.symptomCheckSession.create({
      data: {
        patientId: patient.id,
        severity: severity || 5,
        durationDays: duration || 1,
        recommendedDepartment: diag.recommendedDept,
        diagnosisCondition: diag.condition,
        diagnosisProbability: diag.prob,
        items: {
          create: symptoms.map((s) => ({
            symptomId: s.id,
            symptomLabel: s.label,
            mappedDepartment: s.dept || diag.recommendedDept,
          })),
        },
      },
    });

    res.status(201).json({
      sessionId: session.id,
      condition: diag.condition,
      prob: diag.prob,
      recommendedDept: diag.recommendedDept,
      advice: diag.advice,
      urgencyLevel: diag.urgencyLevel,
      aiPowered: !!process.env.ANTHROPIC_API_KEY,
    });
  } catch (err) {
    console.error('[symptoms/check]', err);
    res.status(500).json({ error: err.message });
  }
});

// GET /api/symptom-checks
router.get('/', verifyToken, requireRole('PATIENT'), async (req, res) => {
  try {
    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const sessions = await prisma.symptomCheckSession.findMany({
      where: { patientId: patient.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    res.json(sessions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
