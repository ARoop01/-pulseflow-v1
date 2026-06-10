import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { createPatient, createDoctor, cleanTestData, prisma } from './helpers/factories.js';

let patientToken, doctorToken;

beforeAll(async () => {
  const p = await createPatient();
  patientToken = p.token;

  const d = await createDoctor({ specialty: 'Cardiology' });
  doctorToken = d.token;
});

afterAll(async () => {
  await cleanTestData();
  await prisma.$disconnect();
});

describe('POST /api/consult-requests', () => {
  it('creates a consult request and returns token', async () => {
    const res = await request(app)
      .post('/api/consult-requests')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ specialty: 'Cardiology', symptomsSummary: 'Chest tightness and palpitations' });

    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.status).toBe('PENDING');
  });

  it('returns 400 when specialty is missing', async () => {
    const res = await request(app)
      .post('/api/consult-requests')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ symptomsSummary: 'Headache' });

    expect(res.status).toBe(400);
  });

  it('returns 403 when a doctor tries to create a consult request', async () => {
    const res = await request(app)
      .post('/api/consult-requests')
      .set('Authorization', `Bearer ${doctorToken}`)
      .send({ specialty: 'Cardiology', symptomsSummary: 'Test' });

    expect(res.status).toBe(403);
  });

  it('returns 401 for unauthenticated requests', async () => {
    const res = await request(app)
      .post('/api/consult-requests')
      .send({ specialty: 'Cardiology' });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/consult-requests/:token', () => {
  let consultToken;

  beforeAll(async () => {
    const res = await request(app)
      .post('/api/consult-requests')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ specialty: 'Neurology', symptomsSummary: 'Dizziness' });
    consultToken = res.body.token;
  });

  it('returns the consult request with status PENDING', async () => {
    const res = await request(app)
      .get(`/api/consult-requests/${consultToken}`)
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(res.body.status).toBe('PENDING');
    expect(res.body.requestToken).toBe(consultToken);
  });

  it('returns 404 for an unknown token', async () => {
    const res = await request(app)
      .get('/api/consult-requests/nonexistent-token-12345')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(404);
  });
});
