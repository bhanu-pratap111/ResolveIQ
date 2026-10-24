const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/database');

let adminToken, studentToken, student2Token, officerToken;
let testComplaintId;

beforeAll(async () => {
  const [adminRes, studentRes, student2Res, officerRes] = await Promise.all([
    request(app).post('/api/auth/login').send({ email: 'super_admin@resolveiq.demo', password: 'Admin@123456' }),
    request(app).post('/api/auth/login').send({ email: 'student1@resolveiq.demo', password: 'Student@123' }),
    request(app).post('/api/auth/login').send({ email: 'student2@resolveiq.demo', password: 'Student@123' }),
    request(app).post('/api/auth/login').send({ email: 'officer1@resolveiq.demo', password: 'Officer@123' }),
  ]);
  adminToken = adminRes.body.data?.accessToken;
  studentToken = studentRes.body.data?.accessToken;
  student2Token = student2Res.body.data?.accessToken;
  officerToken = officerRes.body.data?.accessToken;
});

afterAll(async () => {
  await pool.end();
});

describe('Complaint Workflow', () => {
  test('Student can submit a complaint with valid data', async () => {
    const [instRows] = await pool.execute(`SELECT id FROM institutions LIMIT 1`);
    const [catRows] = await pool.execute(`SELECT id FROM complaint_categories LIMIT 1`);

    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        institution_id: instRows[0].id,
        category_id: catRows[0].id,
        title: 'Test Complaint from Automated Test',
        description: 'This is a test complaint with sufficient detail to pass the minimum length validation check.',
        privacy_acknowledged: true,
        declaration_acknowledged: true,
      });
    expect(res.status).toBe(201);
    expect(res.body.data).toHaveProperty('reference_number');
    testComplaintId = res.body.data.id;
  });

  test('Complaint submission fails without required fields', async () => {
    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ title: 'Missing institution' });
    expect(res.status).toBe(400);
  });

  test('Complaint submission fails with short description', async () => {
    const [instRows] = await pool.execute(`SELECT id FROM institutions LIMIT 1`);
    const res = await request(app)
      .post('/api/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        institution_id: instRows[0].id,
        title: 'Short desc',
        description: 'Too short',
        privacy_acknowledged: true,
        declaration_acknowledged: true,
      });
    expect(res.status).toBe(400);
  });

  test('Student can view own complaint', async () => {
    if (!testComplaintId) return;
    const res = await request(app)
      .get(`/api/complaints/${testComplaintId}`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data.id).toBe(testComplaintId);
  });

  test('Student2 cannot view Student1 complaint', async () => {
    if (!testComplaintId) return;
    const res = await request(app)
      .get(`/api/complaints/${testComplaintId}`)
      .set('Authorization', `Bearer ${student2Token}`);
    expect(res.status).toBe(404);
  });

  test('Student cannot change complaint status', async () => {
    if (!testComplaintId) return;
    const res = await request(app)
      .post(`/api/complaints/${testComplaintId}/status`)
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ status: 'UNDER_REVIEW' });
    expect(res.status).toBe(403);
  });

  test('Invalid status transition is rejected', async () => {
    if (!testComplaintId) return;
    // Cannot go from REGISTERED to RESOLVED
    const res = await request(app)
      .post(`/api/complaints/${testComplaintId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'RESOLVED' });
    expect(res.status).toBe(400);
  });

  test('Valid status transition succeeds', async () => {
    if (!testComplaintId) return;
    const res = await request(app)
      .post(`/api/complaints/${testComplaintId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'UNDER_REVIEW', reason: 'Moving to review' });
    expect(res.status).toBe(200);
  });

  test('Rejection requires a reason', async () => {
    if (!testComplaintId) return;
    const res = await request(app)
      .post(`/api/complaints/${testComplaintId}/status`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ status: 'REJECTED' }); // no reason
    expect(res.status).toBe(400);
  });

  test('Admin can view all complaints', async () => {
    const res = await request(app)
      .get('/api/complaints')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toHaveProperty('total');
  });

  test('Complaint timeline returns history entries', async () => {
    if (!testComplaintId) return;
    const res = await request(app)
      .get(`/api/complaints/${testComplaintId}/timeline`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('Officer can add internal note', async () => {
    if (!testComplaintId) return;
    const res = await request(app)
      .post(`/api/complaints/${testComplaintId}/notes`)
      .set('Authorization', `Bearer ${officerToken}`)
      .send({ note: 'This is a test internal note.' });
    expect(res.status).toBe(201);
  });

  test('Student cannot see internal notes', async () => {
    if (!testComplaintId) return;
    const res = await request(app)
      .get(`/api/complaints/${testComplaintId}/notes`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });
});

describe('Institution API', () => {
  test('Public list of institutions is accessible', async () => {
    const res = await request(app)
      .get('/api/institutions')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
  });

  test('Institution 360 is accessible to admin', async () => {
    const [rows] = await pool.execute(`SELECT id FROM institutions LIMIT 1`);
    const res = await request(app)
      .get(`/api/institutions/${rows[0].id}/360`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toHaveProperty('stats');
    expect(res.body.data).toHaveProperty('trend');
  });

  test('Student cannot access Institution 360', async () => {
    const [rows] = await pool.execute(`SELECT id FROM institutions LIMIT 1`);
    const res = await request(app)
      .get(`/api/institutions/${rows[0].id}/360`)
      .set('Authorization', `Bearer ${studentToken}`);
    expect(res.status).toBe(403);
  });
});

