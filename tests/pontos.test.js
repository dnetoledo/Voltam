const request = require('supertest');
const { descreverComBanco, recriarBanco } = require('./ajuda');

const PAULISTA = { lat: -23.5614, lng: -46.6559 };

descreverComBanco('UC02 – Buscar pontos e UC03 – Cadastrar ponto', () => {
  let app; let db; let token;
  beforeAll(async () => {
    db = await recriarBanco();
    app = require('../src/app');
    const res = await request(app).post('/api/usuarios')
      .send({ nome: 'Motorista', email: 'm@teste.com', senha: 'segredo123' });
    token = res.body.token;
  });
  afterAll(() => db.end());

  const novoPonto = (extra = {}) => ({
    nome: 'Eletroposto Teste', endereco: 'Av. Paulista, 1000', latitude: PAULISTA.lat, longitude: PAULISTA.lng,
    tipos_conector: ['Tipo 2', 'CCS Combo'], potencia_kw: 60, numero_vagas: 2, ...extra,
  });

  test('UC03 exige autenticação', async () => {
    const res = await request(app).post('/api/pontos').send(novoPonto());
    expect(res.status).toBe(401);
  });

  test('UC03 cadastra ponto com status "não verificado"', async () => {
    const res = await request(app).post('/api/pontos').set('Authorization', `Bearer ${token}`).send(novoPonto());
    expect(res.status).toBe(201);
    expect(res.body.status).toBe('NAO_VERIFICADO');
    const { rows } = await db.query('SELECT motorista_id FROM ponto_de_recarga WHERE id = $1', [res.body.id]);
    expect(rows[0].motorista_id).not.toBeNull();
  });

  test('UC03 A1 – alerta duplicidade e permite confirmar', async () => {
    const pertinho = novoPonto({ nome: 'Duplicado', latitude: PAULISTA.lat + 0.0002 });
    const alerta = await request(app).post('/api/pontos').set('Authorization', `Bearer ${token}`).send(pertinho);
    expect(alerta.status).toBe(409);
    expect(alerta.body.duplicidade).toBe(true);
    const confirmado = await request(app).post('/api/pontos').set('Authorization', `Bearer ${token}`)
      .send({ ...pertinho, confirmarDuplicidade: true });
    expect(confirmado.status).toBe(201);
  });

  test('UC03 valida dados obrigatórios', async () => {
    const res = await request(app).post('/api/pontos').set('Authorization', `Bearer ${token}`)
      .send({ nome: 'X' });
    expect(res.status).toBe(400);
  });

  test('UC02 busca pontos no raio, ordenados por distância', async () => {
    await request(app).post('/api/pontos').set('Authorization', `Bearer ${token}`)
      .send(novoPonto({ nome: 'Longe 5km', latitude: PAULISTA.lat - 0.045, tipos_conector: ['CHAdeMO'], potencia_kw: 150 }));
    const res = await request(app).get('/api/pontos').query({ ...PAULISTA, raio: 10 });
    expect(res.status).toBe(200);
    expect(res.body.total).toBe(3);
    const d = res.body.pontos.map((p) => p.distanciaKm);
    expect(d).toEqual([...d].sort((a, b) => a - b));
  });

  test('UC02 aplica filtros de conector e potência', async () => {
    const porConector = await request(app).get('/api/pontos').query({ ...PAULISTA, raio: 10, conectores: 'CHAdeMO' });
    expect(porConector.body.pontos.map((p) => p.nome)).toEqual(['Longe 5km']);
    const porPotencia = await request(app).get('/api/pontos').query({ ...PAULISTA, raio: 10, potenciaMin: 100 });
    expect(porPotencia.body.total).toBe(1);
  });

  test('UC02 não retorna pontos suspensos', async () => {
    await db.query("UPDATE ponto_de_recarga SET status = 'SUSPENSO' WHERE nome = 'Longe 5km'");
    const res = await request(app).get('/api/pontos').query({ ...PAULISTA, raio: 10 });
    expect(res.body.total).toBe(2);
  });

  test('UC02 A1 – sem pontos no raio sugere aumentar', async () => {
    const res = await request(app).get('/api/pontos').query({ lat: -22.9, lng: -47.06, raio: 5 });
    expect(res.body.total).toBe(0);
    expect(res.body.sugestao).toMatch(/aumentar o raio/);
  });

  test('RF05 detalhes do ponto', async () => {
    const lista = await request(app).get('/api/pontos').query({ ...PAULISTA, raio: 10 });
    const res = await request(app).get(`/api/pontos/${lista.body.pontos[0].id}`);
    expect(res.status).toBe(200);
    expect(res.body.tiposConector).toContain('Tipo 2');
    expect((await request(app).get('/api/pontos/99999')).status).toBe(404);
  });
});
