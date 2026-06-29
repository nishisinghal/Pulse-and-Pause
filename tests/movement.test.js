const request = require('supertest');
const app = require('../server');
const { getToken } = require('./auth.test');

describe('POST /api/movement', () => {
  it('saves movement data and returns the log', async () => {
    const { token } = await getToken('mv1');
    const res = await request(app)
      .post('/api/movement')
      .set('Authorization', `Bearer ${token}`)
      .send({ steps: 5000, distance_km: 3.5, workout_type: 'walk', workout_duration: 30 });

    expect(res.statusCode).toBe(200);
    expect(res.body.steps).toBe(5000);
    expect(res.body.distance_km).toBe(3.5);
    expect(res.body.workout_type).toBe('walk');
  });

  it('rejects negative steps with 400', async () => {
    const { token } = await getToken('mv2');
    const res = await request(app)
      .post('/api/movement')
      .set('Authorization', `Bearer ${token}`)
      .send({ steps: -100 });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/steps/i);
  });

  it('rejects steps over 100,000 with 400', async () => {
    const { token } = await getToken('mv3');
    const res = await request(app)
      .post('/api/movement')
      .set('Authorization', `Bearer ${token}`)
      .send({ steps: 999999 });

    expect(res.statusCode).toBe(400);
  });

  it('rejects distance over 200 km with 400', async () => {
    const { token } = await getToken('mv4');
    const res = await request(app)
      .post('/api/movement')
      .set('Authorization', `Bearer ${token}`)
      .send({ steps: 100, distance_km: 500 });

    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/distance/i);
  });

  it('rejects unauthenticated requests with 401', async () => {
    const res = await request(app)
      .post('/api/movement')
      .send({ steps: 1000 });

    expect(res.statusCode).toBe(401);
  });
});

describe('GET /api/movement', () => {
  it('returns movement history for authenticated user', async () => {
    const { token } = await getToken('mv5');
    // Log some data first
    await request(app)
      .post('/api/movement')
      .set('Authorization', `Bearer ${token}`)
      .send({ steps: 8000, distance_km: 5 });

    const res = await request(app)
      .get('/api/movement?range=week')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);
    expect(res.body[0].steps).toBe(8000);
  });

  it('returns empty array for a new user with no history', async () => {
    const { token } = await getToken('mv6');
    const res = await request(app)
      .get('/api/movement?range=week')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(0);
  });
});
