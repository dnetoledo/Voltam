const request = require('supertest');
const { descreverComBanco, recriarBanco } = require('./ajuda');

descreverComBanco('UC04 – Check-in, recarga ativa, favoritos e perfil', () => {
  let app; let db; let token; let pontoId; let outroPontoId;
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    db = await recriarBanco();
    app = require('../src/app');
    token = (await request(app).post('/api/usuarios').send({ nome: 'Dayane Teste', email: 'd@teste.com', senha: 'segredo123' })).body.token;
    const novo = (dados) => request(app).post('/api/pontos').set(auth())
      .send({ tipos_conector: ['Tipo 2'], potencia_kw: 22, ...dados });
    pontoId = (await novo({ nome: 'Ponto A', latitude: -23.56, longitude: -46.65 })).body.id;
    outroPontoId = (await novo({ nome: 'Ponto B', latitude: -23.60, longitude: -46.70 })).body.id;
  });
  afterAll(() => db.end());

  test('check-in exige login e status válido', async () => {
    expect((await request(app).post(`/api/pontos/${pontoId}/checkins`).send({ status: 'DISPONIVEL' })).status).toBe(401);
    expect((await request(app).post(`/api/pontos/${pontoId}/checkins`).set(auth()).send({ status: 'X' })).status).toBe(400);
  });

  test('check-in atualiza o status do ponto e aparece no histórico', async () => {
    const res = await request(app).post(`/api/pontos/${pontoId}/checkins`).set(auth())
      .send({ status: 'DISPONIVEL', comentario: 'Funcionando bem' });
    expect(res.status).toBe(201);
    expect(res.body.ponto.status).toBe('DISPONIVEL');
    const hist = await request(app).get(`/api/pontos/${pontoId}/checkins`);
    expect(hist.body[0]).toMatchObject({ status: 'DISPONIVEL', comentario: 'Funcionando bem', motorista: 'Dayane' });
  });

  test('A1 – ponto com defeito fica fora de serviço e sinalizado', async () => {
    const res = await request(app).post(`/api/pontos/${outroPontoId}/checkins`).set(auth()).send({ status: 'FORA_DE_SERVICO' });
    expect(res.body.ponto.status).toBe('FORA_DE_SERVICO');
    expect(res.body.aviso).toMatch(/verificação/);
  });

  test('status informado por check-in expira após 2 horas', async () => {
    await db.query("UPDATE ponto_de_recarga SET status_atualizado_em = NOW() - INTERVAL '3 hours' WHERE id = $1", [pontoId]);
    const res = await request(app).get(`/api/pontos/${pontoId}`);
    expect(res.body.status).toBe('NAO_VERIFICADO');
  });

  test('recarga ativa: iniciar, consultar, impedir duplicada e encerrar', async () => {
    expect((await request(app).post('/api/recargas').set(auth()).send({ pontoId })).status).toBe(400); // sem pagamento
    const inicio = await request(app).post('/api/recargas').set(auth()).send({ pontoId, pagamento: { tipo: 'PIX' } });
    expect(inicio.status).toBe(201);
    expect(inicio.body.ponto.status).toBe('OCUPADO');
    const ativa = await request(app).get('/api/recargas/ativa').set(auth());
    expect(ativa.body.recarga).toMatchObject({ pontoNome: 'Ponto A', ativo: true });
    expect((await request(app).post('/api/recargas').set(auth()).send({ pontoId, pagamento: { tipo: 'PIX' } })).status).toBe(409);
    const fim = await request(app).post('/api/recargas/ativa/encerrar').set(auth());
    expect(fim.status).toBe(200);
    expect(fim.body.resumo).toMatchObject({ formaPagamento: 'Pix', demonstracao: true });
    expect(fim.body.resumo.valor).toBeGreaterThan(0);
    expect(fim.body.resumo.pixCopiaECola).toMatch(/VOLTMAP-DEMO/);
    expect((await request(app).get(`/api/pontos/${pontoId}`)).body.status).toBe('DISPONIVEL');
    expect((await request(app).get('/api/recargas/ativa').set(auth())).body.recarga).toBeNull();
  });

  test('não inicia recarga em ponto fora de serviço', async () => {
    expect((await request(app).post('/api/recargas').set(auth()).send({ pontoId: outroPontoId, pagamento: { tipo: 'PIX' } })).status).toBe(409);
  });

  test('favoritos: adicionar, verificar, listar e remover', async () => {
    expect((await request(app).put(`/api/favoritos/${pontoId}`).set(auth())).body.favorito).toBe(true);
    expect((await request(app).get(`/api/favoritos/${pontoId}`).set(auth())).body.favorito).toBe(true);
    expect((await request(app).get('/api/favoritos').set(auth())).body.map((p) => p.nome)).toEqual(['Ponto A']);
    await request(app).delete(`/api/favoritos/${pontoId}`).set(auth());
    expect((await request(app).get('/api/favoritos').set(auth())).body).toHaveLength(0);
  });

  test('perfil: dados, alterar nome e senha', async () => {
    await request(app).put(`/api/favoritos/${pontoId}`).set(auth());
    const p = await request(app).get('/api/perfil').set(auth());
    expect(p.body.usuario.email).toBe('d@teste.com');
    expect(p.body.pontosCadastrados).toHaveLength(2);
    expect(p.body.favoritos).toHaveLength(1);
    expect(p.body.checkIns.length).toBeGreaterThan(0);
    expect((await request(app).put('/api/perfil').set(auth()).send({ nome: 'Dayane Toledo' })).body.usuario.nome).toBe('Dayane Toledo');
    expect((await request(app).put('/api/perfil/senha').set(auth()).send({ senhaAtual: 'errada', novaSenha: 'nova1234' })).status).toBe(400);
    expect((await request(app).put('/api/perfil/senha').set(auth()).send({ senhaAtual: 'segredo123', novaSenha: 'nova1234' })).status).toBe(200);
    const login = await request(app).post('/api/auth/login').send({ email: 'd@teste.com', senha: 'nova1234' });
    expect(login.status).toBe(200);
  });

  test('cartões: guarda só bandeira e final, recusa número completo, paga recarga com cartão', async () => {
    expect((await request(app).post('/api/pagamentos/cartoes').set(auth())
      .send({ numero: '4111111111111111', bandeira: 'Visa', final: '1111', validade: '12/30', titular: 'D T' })).status).toBe(400);
    expect((await request(app).post('/api/pagamentos/cartoes').set(auth())
      .send({ bandeira: 'Visa', final: '1111', validade: '01/20', titular: 'Dayane T' })).body.erro).toMatch(/vencido/);
    const c = await request(app).post('/api/pagamentos/cartoes').set(auth())
      .send({ bandeira: 'Visa', final: '4242', validade: '12/30', titular: 'Dayane Toledo' });
    expect(c.status).toBe(201);
    expect(c.body).toMatchObject({ descricao: 'Visa •••• 4242', padrao: true, titular: 'DAYANE TOLEDO' });
    const { rows } = await db.query('SELECT * FROM forma_pagamento');
    expect(JSON.stringify(rows)).not.toMatch(/\d{8,}/);
    const ini = await request(app).post('/api/recargas').set(auth()).send({ pontoId, pagamento: { tipo: 'CARTAO', cartaoId: c.body.id } });
    expect(ini.status).toBe(201);
    const fim = await request(app).post('/api/recargas/ativa/encerrar').set(auth());
    expect(fim.body.resumo).toMatchObject({ formaPagamento: 'Visa •••• 4242', situacao: 'Pagamento aprovado (simulação)' });
    const hist = await request(app).get('/api/recargas').set(auth());
    expect(hist.body[0]).toMatchObject({ formaPagamento: 'Visa •••• 4242' });
    expect(hist.body[0].valorEstimado).toBeGreaterThan(0);
    await request(app).delete(`/api/pagamentos/cartoes/${c.body.id}`).set(auth());
    expect((await request(app).get('/api/pagamentos/cartoes').set(auth())).body).toHaveLength(0);
  });

  test('versão publicada', async () => {
    const v = await request(app).get('/api/versao');
    expect(v.body.versao).toBe(require('../package.json').version);
  });
});
