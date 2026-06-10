import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic();

export async function analyseSymptoms(symptoms, severity, duration, patientIntake) {
  const intakeSummary = patientIntake
    ? `Occupation: ${patientIntake.occupation || 'Unknown'}, ` +
      `Work exertion: ${patientIntake.workExertion || 'Moderate'}, ` +
      `Personal history: ${patientIntake.personalHistory || 'None'}, ` +
      `Hereditary conditions: ${patientIntake.hereditary?.join(', ') || 'None reported'}, ` +
      `Occupational exposures: ${patientIntake.exposures?.join(', ') || 'None'}`
    : 'Not available';

  const response = await client.messages.create({
    model: 'claude-opus-4-8',
    max_tokens: 700,
    messages: [
      {
        role: 'user',
        content: `You are a clinical triage assistant for an Indian telehealth platform. Analyse the patient data below and return a structured JSON triage result.

Patient profile: ${intakeSummary}
Reported symptoms: ${symptoms.map((s) => s.label).join(', ')}
Severity (1–10): ${severity}
Duration (days): ${duration}

Provide a thorough assessment considering the patient's occupation, hereditary conditions, exposures, and the full symptom cluster — not just the primary symptom. Respond with ONLY valid JSON in this exact shape — no markdown, no extra text:
{
  "condition": "<concise clinical condition name, 3-6 words>",
  "prob": <integer 50-95>,
  "recommendedDept": "<one of: Cardiology | Neurology | Psychiatry | Dermatology | Orthopedics | ENT | Ophthalmology | Gastroenterology | Pulmonology | Pediatrics | General Health>",
  "assessment": "<2-3 sentences: clinical reasoning that references the patient's specific context — occupation, hereditary risks, exposures, and symptom pattern together>",
  "advice": "<1-2 sentences of specific, actionable, immediate home-care guidance>",
  "urgencyLevel": "<routine | urgent | emergency>"
}`,
      },
    ],
  });

  const text = response.content[0].text.trim();
  return JSON.parse(text);
}

// Rule-based fallback — used when ANTHROPIC_API_KEY is absent or Claude call fails
export function getDiagnosticsFallback(symptoms) {
  const ids = symptoms.map(s => s.id);
  const has = (...ids_) => ids_.some(id => ids.includes(id));

  if (has('chest', 'palpitations', 'sob'))
    return {
      condition: 'Cardiovascular Assessment Triggered',
      prob: 78,
      recommendedDept: 'Cardiology',
      urgencyLevel: 'urgent',
      assessment: 'Your reported chest symptoms and cardiac indicators suggest possible cardiovascular involvement. Given the severity reported, an early evaluation is recommended to rule out hypertensive or ischemic causes.',
      advice: 'Avoid physical strain, rest upright, and monitor your heart rate. Seek emergency care if chest pain worsens or you feel faint.',
    };

  if (has('wheezing', 'breathlessness', 'chest_congestion'))
    return {
      condition: 'Respiratory Tract Obstruction / Bronchospasm',
      prob: 74,
      recommendedDept: 'Pulmonology',
      urgencyLevel: 'urgent',
      assessment: 'Wheezing and breathlessness suggest bronchial constriction or airway inflammation, consistent with asthma, COPD exacerbation, or allergic bronchitis. Severity and exposure history should be evaluated.',
      advice: 'Sit upright in a well-ventilated area, use a prescribed inhaler if available, and avoid known respiratory triggers. Seek immediate care if breathing does not improve.',
    };

  if (has('headache', 'dizzy', 'migraine', 'numbness'))
    return {
      condition: 'Neurological Tension / Migraine Syndrome',
      prob: 85,
      recommendedDept: 'Neurology',
      urgencyLevel: 'routine',
      assessment: 'Recurring or severe headache with dizziness points to tension-type headache or migraine, possibly aggravated by stress, prolonged screen exposure, or dehydration. Numbness in the extremities warrants neurological evaluation.',
      advice: 'Rest in a dark, quiet room, stay hydrated, and apply a cold compress to your forehead. Limit screen exposure until symptoms resolve.',
    };

  if (has('anxiety', 'insomnia', 'panic_attack', 'depression'))
    return {
      condition: 'Autonomic Hyperarousal & Stress Response',
      prob: 84,
      recommendedDept: 'Psychiatry',
      urgencyLevel: 'routine',
      assessment: 'Elevated anxiety, sleep disturbances, and mood changes suggest autonomic dysregulation, commonly linked to chronic occupational stress, hormonal shifts, or an underlying mood disorder. Early intervention improves outcomes.',
      advice: 'Practice box breathing (inhale 4s, hold 4s, exhale 4s, hold 4s), limit caffeine, and maintain a consistent sleep schedule. Use the Wellness Hub for guided relaxation.',
    };

  if (has('nausea', 'vomiting', 'bloating', 'diarrhea', 'abdominal_cramps', 'indigestion', 'acid_reflux'))
    return {
      condition: 'Gastrointestinal Inflammation / Dyspepsia',
      prob: 72,
      recommendedDept: 'Gastroenterology',
      urgencyLevel: 'routine',
      assessment: 'Your digestive symptoms indicate GI tract irritation, likely caused by dietary triggers, acid hypersecretion, or a mild gastrointestinal infection. Persistent vomiting or blood in stool warrants urgent evaluation.',
      advice: 'Follow a bland BRAT diet, sip fluids frequently, avoid spicy or acidic foods, and rest. OTC antacids may relieve mild reflux symptoms.',
    };

  if (has('joint_pain', 'swollen_joints', 'bone_pain', 'stiffness'))
    return {
      condition: 'Inflammatory Arthropathy / Musculoskeletal Strain',
      prob: 68,
      recommendedDept: 'Orthopedics',
      urgencyLevel: 'routine',
      assessment: 'Joint pain with swelling or stiffness suggests inflammatory arthritis, repetitive strain, or early degenerative changes. Sedentary desk work and poor ergonomics are common aggravating factors.',
      advice: 'Apply a warm compress to affected joints, perform gentle range-of-motion stretches, and avoid high-impact activity. Review your workstation ergonomics.',
    };

  if (has('ear_pain', 'hearing_loss', 'nasal_congestion', 'sinus_pressure'))
    return {
      condition: 'Upper Respiratory / Sinusitis Syndrome',
      prob: 75,
      recommendedDept: 'ENT',
      urgencyLevel: 'routine',
      assessment: 'Ear pain, nasal congestion, and sinus pressure are hallmarks of sinusitis or upper respiratory tract infection, typically triggered by viral pathogens or seasonal allergens.',
      advice: 'Use saline nasal rinses twice daily, inhale steam to relieve congestion, stay well hydrated, and avoid cold or dry environments.',
    };

  if (has('red_eyes', 'watery_eyes', 'blurry_vision'))
    return {
      condition: 'Ocular Irritation / Conjunctival Inflammation',
      prob: 65,
      recommendedDept: 'Ophthalmology',
      urgencyLevel: 'routine',
      assessment: 'Redness, watering, or blurred vision suggests conjunctivitis, allergic eye reaction, or digital eye strain. Prolonged screen exposure without adequate breaks is a key contributing factor.',
      advice: 'Avoid rubbing your eyes, apply preservative-free lubricating eye drops, and follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds.',
    };

  if (has('skin_rash', 'acne', 'hair_loss', 'dry_skin'))
    return {
      condition: 'Inflammatory Dermatological Condition',
      prob: 68,
      recommendedDept: 'Dermatology',
      urgencyLevel: 'routine',
      assessment: 'Skin changes including rash, severe acne, dryness, or hair loss may indicate contact dermatitis, seborrheic conditions, or hormonal disruption. Environmental triggers and dietary factors should be evaluated.',
      advice: 'Use a mild, fragrance-free moisturiser, avoid known skin irritants, and do not apply topical steroids without medical guidance. Track any new soaps or products introduced recently.',
    };

  return {
    condition: 'Acute Viral Syndrome / Coryza',
    prob: 70,
    recommendedDept: 'General Health',
    urgencyLevel: 'routine',
    assessment: 'Your symptom profile is consistent with a common viral respiratory infection. Fever, fatigue, and body ache typically resolve within 5-7 days with adequate rest and supportive care.',
    advice: 'Drink plenty of fluids, rest, monitor your temperature, and consider OTC antipyretics if fever exceeds 38.5°C. Seek care if symptoms worsen after 3 days.',
  };
}
