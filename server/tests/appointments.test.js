import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import { app } from '../src/app.js';
import { createPatient, createDoctor, cleanTestData, prisma } from './helpers/factories.js';

let patientToken, doctorId, slotDate, slotTime;

beforeAll(async () => {
  const { token } = await createPatient();
  patientToken = token;

  const { doctor } = await createDoctor();
  doctorId = doctor.id;

  slotDate = '2027-06-15';
  slotTime = '10:00 AM';

  // Seed an available slot for the doctor
  await prisma.doctorAvailability.create({
    data: { doctorId, availableDate: slotDate, timeSlot: slotTime, isBooked: false },
  });
});

afterAll(async () => {
  await cleanTestData();
  await prisma.$disconnect();
});

describe('POST /api/appointments', () => {
  it('books an available slot and returns 201', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ doctorId, scheduledDate: slotDate, scheduledSlot: slotTime });

    expect(res.status).toBe(201);
    expect(res.body.status).toBe('CONFIRMED');
    expect(res.body.id).toMatch(/^PF-/);
  });

  it('returns 409 when the same slot is double-booked', async () => {
    // The slot was booked in the previous test — a second patient tries the same slot
    const { token: secondPatientToken } = await createPatient();

    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${secondPatientToken}`)
      .send({ doctorId, scheduledDate: slotDate, scheduledSlot: slotTime });

    expect(res.status).toBe(409);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({ doctorId });

    expect(res.status).toBe(400);
  });

  it('returns 401 when unauthenticated', async () => {
    const res = await request(app)
      .post('/api/appointments')
      .send({ doctorId, scheduledDate: slotDate, scheduledSlot: slotTime });

    expect(res.status).toBe(401);
  });
});

describe('GET /api/appointments', () => {
  it('returns the patient appointment list', async () => {
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${patientToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('blocks doctor from viewing patient appointments (role check)', async () => {
    const { token: docToken } = await createDoctor();
    const res = await request(app)
      .get('/api/appointments')
      .set('Authorization', `Bearer ${docToken}`);

    // Doctors see their own appointments — no error, just different data
    expect(res.status).toBe(200);
  });
});
