import { Router } from 'express';
import { verifyToken, requireRole } from '../middleware/auth.js';
import prisma from '../lib/prisma.js';

const router = Router();

function getDiagnostics(symptoms) {
  const mainSymptom = symptoms[0]?.id;

  if (['chest', 'sob', 'palpitations'].includes(mainSymptom)) {
    return { condition: 'Cardiovascular Assessment Triggered', prob: 78, dept: 'Cardiology', advice: 'Avoid physical strain immediately, rest in a comfortable sitting posture, and record your heart rate vitals.' };
  }
  if (['headache', 'dizzy', 'migraine'].includes(mainSymptom)) {
    return { condition: 'Neurological Tension / Migraine Syndrome', prob: 85, dept: 'Neurology', advice: 'Stay hydrated, dim screen light sources immediately, and rest in a dark, quiet room.' };
  }
  if (['anxiety', 'insomnia', 'panic_attack'].includes(mainSymptom)) {
    return { condition: 'Autonomic Hyperarousal & Stress Response', prob: 84, dept: 'Psychiatry', advice: 'Practice box breathing (4-4-4-4) in our Wellness Hub and log water intake.' };
  }
  if (['indigestion', 'acid_reflux'].includes(mainSymptom)) {
    return { condition: 'Acute Gastrointestinal Reflux / Dyspepsia', prob: 72, dept: 'General Health', advice: 'Maintain a bland light diet, hydrate regularly, and avoid lying down flat immediately after meals.' };
  }
  if (mainSymptom === 'joint_pain') {
    return { condition: 'Inflammatory Joint / Back Strain', prob: 65, dept: 'General Health', advice: 'Apply warm compress, practice light stretches, and keep moving gently.' };
  }
  if (mainSymptom === 'blurry_vision') {
    return { condition: 'Ocular Strain / Visual Fatigue', prob: 60, dept: 'General Health', advice: 'Follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds.' };
  }
  if (mainSymptom === 'skin_rash') {
    return { condition: 'Contact Dermatitis / Urticaria', prob: 68, dept: 'General Health', advice: 'Avoid scratching the affected region, keep skin moisturized, and wash with mild cool water.' };
  }
  return { condition: 'Acute Viral Syndrome / Coryza', prob: 70, dept: 'General Health', advice: 'Maintain adequate fluid hydration, get physical rest, and track core body temperature indices.' };
}

// POST /api/symptom-checks
router.post('/', verifyToken, requireRole('PATIENT'), async (req, res) => {
  try {
    const { symptoms, severity, duration } = req.body;
    if (!symptoms?.length) return res.status(400).json({ error: 'At least one symptom required' });

    const patient = await prisma.patient.findUnique({ where: { userId: req.user.id } });
    if (!patient) return res.status(404).json({ error: 'Patient not found' });

    const diag = getDiagnostics(symptoms);

    const session = await prisma.symptomCheckSession.create({
      data: {
        patientId: patient.id,
        severity: severity || 5,
        durationDays: duration || 1,
        recommendedDepartment: diag.dept,
        diagnosisCondition: diag.condition,
        diagnosisProbability: diag.prob,
        items: {
          create: symptoms.map((s) => ({
            symptomId: s.id,
            symptomLabel: s.label,
            mappedDepartment: s.dept || 'General Health',
          })),
        },
      },
    });

    res.status(201).json({
      sessionId: session.id,
      condition: diag.condition,
      prob: diag.prob,
      recommendedDept: diag.dept,
      advice: diag.advice,
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
