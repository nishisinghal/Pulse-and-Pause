const request = require('supertest');
const app = require('../server');
const { getToken } = require('./auth.test');

describe('GET /api/streaks', () => {
  it('returns 0 streak for a brand new user', async () => {
    const { token } = await getToken('stk1');
    const res = await request(app)
      .get('/api/streaks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.current_streak).toBe(0);
    expect(res.body.longest_streak).toBe(0);
  });

  it('returns streak of 1 when all 4 pillars are logged today', async () => {
    const { token } = await getToken('stk2');
    const today = new Date().toISOString().split('T')[0];

    // Log all 4 pillars for today
    await request(app).post('/api/movement').set('Authorization', `Bearer ${token}`)
      .send({ steps: 3000, date: today });
    await request(app).post('/api/sleep').set('Authorization', `Bearer ${token}`)
      .send({ bedtime: '22:00', wake_time: '06:00', quality: 3, date: today });
    await request(app).post('/api/nutrition').set('Authorization', `Bearer ${token}`)
      .send({ breakfast: 1, lunch: 1, snacks: 1, dinner: 1, date: today });
    await request(app).post('/api/mood').set('Authorization', `Bearer ${token}`)
      .send({ mood: 'good', date: today });

    const res = await request(app)
      .get('/api/streaks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.current_streak).toBe(1);
  });

  it('counts a rest day as a valid streak day', async () => {
    const { token } = await getToken('stk3');
    // Mark today as rest day
    await request(app).post('/api/restdays').set('Authorization', `Bearer ${token}`)
      .send({});

    const res = await request(app)
      .get('/api/streaks')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(res.body.current_streak).toBe(1);
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app).get('/api/streaks');
    expect(res.statusCode).toBe(401);
  });
});
