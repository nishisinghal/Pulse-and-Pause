const request = require('supertest');
const app = require('../server');
const { getToken } = require('./auth.test');

describe('POST /api/sleep', () => {
  it('saves sleep data and returns the log', async () => {
    const { token } = await getToken('sl1');
    const res = await request(app)
      .post('/api/sleep')
      .set('Authorization', `Bearer ${token}`)
      .send({ bedtime: '22:30', wake_time: '06:30', quality: 4 });

    expect(res.statusCode).toBe(200);
    expect(res.body.bedtime).toBe('22:30');
    expect(res.body.wake_time).toBe('06:30');
    expect(res.body.duration_hours).toBe(8);
    expect(res.body.quality).toBe(4);
  });

  it('correctly calculates duration crossing midnight', async () => {
    const { token } = await getToken('sl2');
    const res = await request(app)
      .post('/api/sleep')
      .set('Authorization', `Bearer ${token}`)
      .send({ bedtime: '23:00', wake_time: '07:00', quality: 3 });

    expect(res.statusCode).toBe(200);
    expect(res.body.duration_hours).toBe(8);
  });

  it('rejects sleep quality above 5 with 400', async () => {
    const { token } = await getToken('sl3');
    const res = await request(app)
      .post('/api/sleep')
      .set('Authorization', `Bearer ${token}`)
      .send({ bedtime: '22:00', wake_time: '06:00', quality: 99 });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/quality/i);
  });

  it('rejects sleep quality below 1 with 400', async () => {
    const { token } = await getToken('sl4');
    const res = await request(app)
      .post('/api/sleep')
      .set('Authorization', `Bearer ${token}`)
      .send({ bedtime: '22:00', wake_time: '06:00', quality: 0 });

    expect(res.statusCode).toBe(400);
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app)
      .post('/api/sleep')
      .send({ bedtime: '22:00', wake_time: '06:00', quality: 3 });

    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/sleep', () => {
  it('returns sleep history for authenticated user', async () => {
    const { token } = await getToken('sl5');
    await request(app)
      .post('/api/sleep')
      .set('Authorization', `Bearer ${token}`)
      .send({ bedtime: '21:00', wake_time: '05:30', quality: 5 });

    const res = await request(app)
      .get('/api/sleep?range=week')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
  });
});
