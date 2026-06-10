import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { createPatient, createDoctor, cleanTestData, prisma } from './helpers/factories.js';

let patientToken, doctorToken;

beforeAll(async () => {
  const p = await createPatient();
  patientToken = p.token;

  const d = await createDoctor();
  doctorToken = d.token;
});

afterAll(async () => {
  await cleanTestData();
  await prisma.$disconnect();
});

describe('POST /api/vitals', () => {
  it('logs vitals and returns 201', async () => {
    const res = await request(app)
      .post('/api/vitals')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ heartRateBpm: 72, systolicBp: 120, diastolicBp: 80, sleepHours: 7.5, dailySteps: 8000 });

    expect(res.status).toBe(201);
    expect(res.body.heartRateBpm).toBe(72);
  });

  it('accepts partial vitals (only some fields)', async () => {
    const res = await request(app)
      .post('/api/vitals')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ heartRateBpm: 68 });

    expect(res.status).toBe(201);
    expect(res.body.heartRateBpm).toBe(68);
  });

  it('returns 403 when a doctor attempts to log vitals', async () => {
    const res = await request(app)
      .post('/api/vitals')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ heartRateBpm: 80 });

    expect(res.status).toBe(403);
  });

  it('returns 401 without authentication', async () => {
    const res = await request(app)
      .post('/api/vitals')
      .send({ heartRateBpm: 70 });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/vitals', () => {
  it('returns last 7 days of vitals for the patient', async () => {
    const res = await request(app)
      .get('/api/vitals')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('returns 403 for a doctor attempting to read patient vitals', async () => {
    const res = await request(app)
      .get('/api/vitals')
      .set('Authorization', `Bearer ${doctorToken}`);

    expect(res.status).toBe(403);
  });
});
