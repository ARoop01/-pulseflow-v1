import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function analyseSymptoms(symptoms, severity, duration, patientIntake) {
  const intakeSummary = patientIntake
    ? `Occupation: ${patientIntake.occupation || 'Unknown'}, Work exertion: ${patientIntake.workExertion || 'Moderate'}, ` +
      `Personal history: ${patientIntake.personalHistory || 'None'}, ` +
      `Hereditary conditions: ${patientIntake.hereditary?.join(', ') || 'None reported'}, ` +
      `Occupational exposures: ${patientIntake.exposures?.join(', ') || 'None'}`
    : 'Not available';

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 500,
    messages: [
      {
        role: 'user',
        content: `You are a medical triage assistant. Analyse the following patient data and return a structured JSON triage result.

Patient profile: ${intakeSummary}
Reported symptoms: ${symptoms.map((s) => s.label).join(', ')}
Severity (1–10): ${severity}
Duration (days): ${duration}

Respond with ONLY valid JSON in this exact shape — no markdown, no prose:
{
  "condition": "<concise clinical condition name, 3-6 words>",
  "prob": <integer 50-95>,
  "recommendedDept": "<one of: Cardiology | Neurology | Psychiatry | Dermatology | Orthopedics | Pediatrics | General Health>",
  "advice": "<2 sentences of actionable patient advice>",
  "urgencyLevel": "<routine | urgent | emergency>"
}`,
      },
    ],
  });

  const text = response.content[0].text.trim();
  return JSON.parse(text);
}

// Rule-based fallback used when ANTHROPIC_API_KEY is absent or API call fails
export function getDiagnosticsFallback(symptoms) {
  const mainSymptom = symptoms[0]?.id;

  if (['chest', 'sob', 'palpitations'].includes(mainSymptom))
    return { condition: 'Cardiovascular Assessment Triggered', prob: 78, recommendedDept: 'Cardiology', urgencyLevel: 'urgent', advice: 'Avoid physical strain immediately, rest in a comfortable sitting posture, and record your heart rate vitals.' };
  if (['headache', 'dizzy', 'migraine'].includes(mainSymptom))
    return { condition: 'Neurological Tension / Migraine Syndrome', prob: 85, recommendedDept: 'Neurology', urgencyLevel: 'routine', advice: 'Stay hydrated, dim screen light sources immediately, and rest in a dark, quiet room.' };
  if (['anxiety', 'insomnia', 'panic_attack'].includes(mainSymptom))
    return { condition: 'Autonomic Hyperarousal & Stress Response', prob: 84, recommendedDept: 'Psychiatry', urgencyLevel: 'routine', advice: 'Practice box breathing (4-4-4-4) in our Wellness Hub and log water intake.' };
  if (['indigestion', 'acid_reflux'].includes(mainSymptom))
    return { condition: 'Acute Gastrointestinal Reflux / Dyspepsia', prob: 72, recommendedDept: 'General Health', urgencyLevel: 'routine', advice: 'Maintain a bland light diet, hydrate regularly, and avoid lying down flat immediately after meals.' };
  if (mainSymptom === 'joint_pain')
    return { condition: 'Inflammatory Joint / Back Strain', prob: 65, recommendedDept: 'General Health', urgencyLevel: 'routine', advice: 'Apply warm compress, practice light stretches, and keep moving gently.' };
  if (mainSymptom === 'blurry_vision')
    return { condition: 'Ocular Strain / Visual Fatigue', prob: 60, recommendedDept: 'General Health', urgencyLevel: 'routine', advice: 'Follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds.' };
  if (mainSymptom === 'skin_rash')
    return { condition: 'Contact Dermatitis / Urticaria', prob: 68, recommendedDept: 'Dermatology', urgencyLevel: 'routine', advice: 'Avoid scratching the affected region, keep skin moisturized, and wash with mild cool water.' };
  return { condition: 'Acute Viral Syndrome / Coryza', prob: 70, recommendedDept: 'General Health', urgencyLevel: 'routine', advice: 'Maintain adequate fluid hydration, get physical rest, and track core body temperature indices.' };
}
