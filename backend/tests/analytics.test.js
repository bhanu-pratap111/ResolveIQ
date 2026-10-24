const request = require('supertest');
const app = require('../src/app');
const { pool } = require('../src/config/database');

let adminToken;

beforeAll(async () => {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'super_admin@resolveiq.demo', password: 'Admin@123456' });
  adminToken = res.body.data?.accessToken;
});

afterAll(async () => {
  await pool.end();
});

describe('Analytics', () => {
  test('Dashboard returns numeric KPIs from database', async () => {
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const stats = res.body.data.stats;
    expect(typeof stats.total).toBe('number');
    expect(typeof stats.resolved).toBe('number');
    expect(stats.total).toBeGreaterThan(0);
  });

  test('Bureau stats returns array with bureau data', async () => {
    const res = await request(app)
      .get('/api/analytics/bureau-stats')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.data.length).toBeGreaterThan(0);
    expect(res.body.data[0]).toHaveProperty('bureau_name');
    expect(res.body.data[0]).toHaveProperty('total');
  });

  test('Complaint trends returns monthly data', async () => {
    const res = await request(app)
      .get('/api/analytics/complaint-trends')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  test('Status distribution returns status counts', async () => {
    const res = await request(app)
      .get('/api/analytics/status-distribution')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    const statuses = res.body.data.map(d => d.status);
    expect(statuses).toContain('REGISTERED');
  });

  test('Date filtering works on bureau stats', async () => {
    const res = await request(app)
      .get('/api/analytics/bureau-stats?start_date=2020-01-01&end_date=2030-12-31')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });

  test('Dashboard total >= sum of statuses (consistency check)', async () => {
    const res = await request(app)
      .get('/api/analytics/dashboard')
      .set('Authorization', `Bearer ${adminToken}`);
    const s = res.body.data.stats;
    const statusSum = (s.registered || 0) + (s.under_review || 0) + (s.under_action || 0)
      + (s.awaiting_response || 0) + (s.resolved || 0) + (s.closed || 0) + (s.rejected || 0);
    expect(s.total).toBe(statusSum);
  });

  test('Audit logs are paginated and admin-only', async () => {
    const res = await request(app)
      .get('/api/audit-logs')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
    expect(res.body.pagination).toHaveProperty('total');
  });

  test('Related cases endpoint returns confirmed/potential links', async () => {
    const [rows] = await pool.execute(`SELECT id FROM complaints ORDER BY id LIMIT 1`);
    const res = await request(app)
      .get(`/api/related-cases/${rows[0].id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.data).toBeInstanceOf(Array);
  });
});

