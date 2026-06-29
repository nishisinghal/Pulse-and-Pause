const request = require('supertest');
const app = require('../server');

// Helper — signs up a test user and returns a JWT token
async function getToken(suffix = '') {
  const email = `test${suffix}${Date.now()}@example.com`;
  const res = await request(app)
    .post('/api/auth/signup')
    .send({
      name: 'Test User',
      email,
      password: 'password123',
      dob: '2000-01-01',
      gender: 'male',
      country: 'IN'
    });
  return { token: res.body.token, email };
}

describe('POST /api/auth/signup', () => {
  it('creates a user and returns a token', async () => {
    const email = `newuser${Date.now()}@example.com`;
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'New User', email, password: 'pass1234', dob: '2000-06-01', gender: 'female', country: 'IN' });

    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.email).toBe(email);
  });

  it('rejects signup with missing fields', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ email: 'missing@fields.com' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toBeDefined();
  });

  it('rejects signup with invalid email format', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Bad Email', email: 'not-an-email', password: 'pass1234', dob: '2000-01-01', gender: 'male', country: 'IN' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/email/i);
  });

  it('rejects signup with password shorter than 6 characters', async () => {
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Short Pass', email: `short${Date.now()}@x.com`, password: '123', dob: '2000-01-01', gender: 'male', country: 'IN' });
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/password/i);
  });

  it('rejects duplicate email', async () => {
    const { email } = await getToken('dup');
    const res = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Dup User', email, password: 'pass1234', dob: '2000-01-01', gender: 'male', country: 'IN' });
    expect(res.statusCode).toBe(409);
  });
});

describe('POST /api/auth/login', () => {
  it('returns a token for valid credentials', async () => {
    const { email } = await getToken('login');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'password123' });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it('rejects wrong password with 401', async () => {
    const { email } = await getToken('wrongpw');
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email, password: 'wrongpassword' });
    expect(res.statusCode).toBe(401);
  });

  it('rejects non-existent email with 401', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: 'nobody@nowhere.com', password: 'anything' });
    expect(res.statusCode).toBe(401);
  });
});

module.exports = { getToken };
