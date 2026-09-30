const request = require('supertest');
const { descreverComBanco, recriarBanco } = require('./ajuda');

descreverComBanco('UC01 – Autenticar-se e RF01 – Criar conta', () => {
  let app; let db;
  beforeAll(async () => {
    db = await recriarBanco();
    app = require('../src/app');
  });
  afterAll(() => db.end());

  test('cria conta de motorista com senha protegida por hash', async () => {
    const res = await request(app).post('/api/usuarios')
      .send({ nome: 'Dayane Teste', email: 'Dayane@Teste.com', senha: 'segredo123' });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.usuario).toMatchObject({ email: 'dayane@teste.com', tipo: 'MOTORISTA' });
    expect(res.body.usuario.senhaHash).toBeUndefined();
    const { rows } = await db.query('SELECT senha_hash FROM usuario WHERE email = $1', ['dayane@teste.com']);
    expect(rows[0].senha_hash).toMatch(/^\$2[aby]\$/);
  });

  test('não permite e-mail duplicado', async () => {
    const res = await request(app).post('/api/usuarios')
      .send({ nome: 'Outra', email: 'dayane@teste.com', senha: 'segredo123' });
    expect(res.status).toBe(409);
  });

  test('valida dados da nova conta', async () => {
    const res = await request(app).post('/api/usuarios').send({ nome: 'A', email: 'x', senha: '1' });
    expect(res.status).toBe(400);
    expect(res.body.erros).toHaveLength(3);
  });

  test('login com credenciais corretas retorna token', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'dayane@teste.com', senha: 'segredo123' });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  test('A1 – credenciais inválidas', async () => {
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'dayane@teste.com', senha: 'errada' });
    expect(res.status).toBe(401);
  });

  test('A2 – conta bloqueada', async () => {
    await db.query("UPDATE usuario SET status = 'BLOQUEADO' WHERE email = 'dayane@teste.com'");
    const res = await request(app).post('/api/auth/login')
      .send({ email: 'dayane@teste.com', senha: 'segredo123' });
    expect(res.status).toBe(403);
    expect(res.body.erro).toMatch(/bloqueada/);
  });
});
