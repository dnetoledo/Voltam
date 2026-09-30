const request = require('supertest');
require('./ajuda');
const app = require('../src/app');

test('GET /api/health responde ok', async () => {
  const res = await request(app).get('/api/health');
  expect(res.status).toBe(200);
  expect(res.body.status).toBe('ok');
});

test('busca sem localização retorna 400', async () => {
  const res = await request(app).get('/api/pontos');
  expect(res.status).toBe(400);
});
