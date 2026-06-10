import { describe, it, beforeAll, afterAll, expect } from '@jest/globals';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { app } from '../src/app.js';
import { cleanTestData, prisma } from './helpers/factories.js';

afterAll(async () => {
  await cleanTestData();
  await prisma.$disconnect();
});

describe('POST /api/auth/register', () => {
  it('registers a new patient and returns 201 with HttpOnly cookie', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Reg Patient', email: `reg_${Date.now()}@test.local`, phone: '9111111111', password: 'test1234', role: 'PATIENT' });

    expect(res.status).toBe(201);
    expect(res.body.user.role).toBe('PATIENT');
    expect(res.body.user.passwordHash).toBeUndefined();
    // Token is in HttpOnly cookie, NOT in response body
    expect(res.body.token).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
    expect(res.headers['set-cookie'][0]).toMatch(/token=/);
    expect(res.headers['set-cookie'][0]).toMatch(/HttpOnly/i);
  });

  it('returns 409 when email is already registered', async () => {
    const email = `dup_${Date.now()}@test.local`;
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'First', email, phone: '9222222222', password: 'test1234', role: 'PATIENT' });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Second', email, phone: '9222222222', password: 'test1234', role: 'PATIENT' });

    expect(res.status).toBe(409);
  });

  it('returns 400 when required fields are missing', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'No Email', password: 'test1234', role: 'PATIENT' });

    expect(res.status).toBe(400);
  });
});

describe('POST /api/auth/login', () => {
  const email = `login_${Date.now()}@test.local`;

  beforeAll(async () => {
    await request(app)
      .post('/api/auth/register')
      .send({ name: 'Login User', email, phone: '9333333333', password: 'correct_pass', role: 'PATIENT' });
  });

  it('returns 200 and sets HttpOnly cookie on correct credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'correct_pass' });

    expect(res.status).toBe(200);
    expect(res.body.user.email).toBe(email);
    expect(res.body.token).toBeUndefined();
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('returns 401 on wrong password', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrong_password' });

    expect(res.status).toBe(401);
  });

  it('returns 401 for non-existent email', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@test.local', password: 'test1234' });

    expect(res.status).toBe(401);
  });
});

describe('Protected route', () => {
  it('returns 401 when no token is provided', async () => {
    const res = await request(app).get('/api/users/me');
    expect(res.status).toBe(401);
  });

  it('returns 401 for an expired JWT', async () => {
    const expiredToken = jwt.sign(
      { id: 'fake-id', role: 'PATIENT', email: 'expired@test.local' },
      process.env.JWT_SECRET,
      { expiresIn: '-1s' }
    );
    const res = await request(app)
      .get('/api/users/me')
      .set('Authorization', `Bearer ${expiredToken}`);

    expect(res.status).toBe(401);
  });
});
