const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/database');

let adminToken, studentToken, officerToken;
let studentId, adminId;

beforeAll(async () => {
  // Login as super admin
  const adminRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'super_admin@resolveiq.demo', password: 'Admin@123456' });
  adminToken = adminRes.body.data?.accessToken;

  // Login as student
  const studentRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'student1@resolveiq.demo', password: 'Student@123' });
  studentToken = studentRes.body.data?.accessToken;

  // Login as officer
  const officerRes = await request(app)
    .post('/api/auth/login')
    .send({ email: 'officer1@resolveiq.demo', password: 'Officer@123' });
  officerToken = officerRes.body.data?.accessToken;
});

afterAll(async () => {
  await pool.end();
});

describe('Authentication', () => {
  test('POST /api/auth/login - valid credentials return tokens', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'super_admin@resolveiq.demo', password: 'Admin@123456' });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data).toHaveProperty('accessToken');
    expect(res.body.data).toHaveProperty('user');
    expect(res.body.data.user).not.toHaveProperty('password_hash');
  });

  test('POST /api/auth/login - invalid password returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'super_admin@resolveiq.demo', password: 'wrongpassword' });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  test('POST /api/auth/login - unknown email returns 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@example.com', password: 'password123' });
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me - returns current user without password', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('email', 'super_admin@resolveiq.demo');
    expect(res.body.data).not.toHaveProperty('password_hash');
  });

  test('GET /api/auth/me - no token returns 401', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
  });

  test('GET /api/auth/me - invalid token returns 401', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', 'Bearer invalidtoken123');
    expect(res.status).toBe(401);
  });

  test('POST /api/auth/register - creates new student account', async () => {
    const uniqueEmail = `test_${Date.now()}@test.com`;
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Test Student', email: uniqueEmail, password: 'TestPass123' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(uniqueEmail);
  });

  test('POST /api/auth/register - duplicate email returns 409', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ name: 'Dup User', email: 'student1@resolveiq.demo', password: 'TestPass123' });
    expect(res.status).toBe(409);
  });
});

describe('Authorization', () => {
  test('Student cannot access admin dashboard', async () => {
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  test('Student cannot access audit logs', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });

  test('Officer cannot create other officers', async () => {
    const res = await request(app)
      .post('/api/officers')
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ name: 'New Officer', email: 'new@test.com', password: 'Pass@123' });
    expect(res.status).toBe(403);
  });

  test('Admin can access dashboard', async () => {
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('stats');
  });
});

