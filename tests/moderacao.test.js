// Iteração C2 – testes de integração: RF08, fotos, RF10, UC05 (Moderar Denúncias) e RF12
const request = require('supertest');
const { descreverComBanco, recriarBanco } = require('./ajuda');
const Usuario = require('../src/models/Usuario');

// Menor JPEG válido (1x1 pixel)
const JPEG_1PX = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/2wBDAP////////////////////////////////////////////////////////////////////////////////////8AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA/8AACwgAAQABAQERAP/EABQAAQAAAAAAAAAAAAAAAAAAAAP/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAA/AH//2Q==';

descreverComBanco('Iteração C2 – avaliações, fotos, denúncias, moderação e gestão de usuários', () => {
  let app; let db; let ana; let bia; let admin; let pontoId;
  const auth = (t) => ({ Authorization: `Bearer ${t}` });
  const conta = async (nome, email) => (await request(app).post('/api/usuarios').send({ nome, email, senha: 'segredo123' })).body.token;

  beforeAll(async () => {
    db = await recriarBanco();
    app = require('../src/app');
    ana = await conta('Ana Autora', 'ana@teste.com');
    bia = await conta('Bia Denunciante', 'bia@teste.com');
    await db.query("INSERT INTO usuario (nome, email, senha_hash, tipo) VALUES ('Admin', 'admin@teste.com', $1, 'ADMINISTRADOR')",
      [await Usuario.gerarHash('admin123')]);
    admin = (await request(app).post('/api/auth/login').send({ email: 'admin@teste.com', senha: 'admin123' })).body.token;
    pontoId = (await request(app).post('/api/pontos').set(auth(ana))
      .send({ nome: 'Estação Shopping Vila Norte', latitude: -23.5, longitude: -46.6, tipos_conector: ['Tipo 2'], potencia_kw: 22 })).body.id;
  });
  afterAll(() => db.end());

  describe('RF08 – Avaliar ponto de recarga', () => {
    test('exige login e nota válida', async () => {
      expect((await request(app).post(`/api/pontos/${pontoId}/avaliacoes`).send({ nota: 5 })).status).toBe(401);
      expect((await request(app).post(`/api/pontos/${pontoId}/avaliacoes`).set(auth(ana)).send({ nota: 9 })).status).toBe(400);
    });

    test('registra avaliações e calcula a nota média do ponto', async () => {
      const r1 = await request(app).post(`/api/pontos/${pontoId}/avaliacoes`).set(auth(ana)).send({ nota: 5, comentario: 'Ótimo' });
      expect(r1.status).toBe(201);
      await request(app).post(`/api/pontos/${pontoId}/avaliacoes`).set(auth(bia)).send({ nota: 2, comentario: 'Demorado' });
      const lista = await request(app).get(`/api/pontos/${pontoId}/avaliacoes`);
      expect(lista.body).toMatchObject({ notaMedia: 3.5, total: 2 });
      expect((await request(app).get(`/api/pontos/${pontoId}`)).body).toMatchObject({ notaMedia: 3.5, totalAvaliacoes: 2 });
    });

    test('nova avaliação do mesmo motorista substitui a anterior', async () => {
      await request(app).post(`/api/pontos/${pontoId}/avaliacoes`).set(auth(bia)).send({ nota: 1, comentario: 'Lixo, perda de tempo!!!' });
      const lista = await request(app).get(`/api/pontos/${pontoId}/avaliacoes`);
      expect(lista.body).toMatchObject({ notaMedia: 3, total: 2 });
      expect((await request(app).get(`/api/pontos/${pontoId}/avaliacoes/minha`).set(auth(bia))).body.avaliacao.nota).toBe(1);
    });
  });

  describe('RF05 – Fotos do ponto', () => {
    test('envia foto, lista e devolve a imagem', async () => {
      const r = await request(app).post(`/api/pontos/${pontoId}/fotos`).set(auth(ana)).send({ imagem: JPEG_1PX });
      expect(r.status).toBe(201);
      const fotos = (await request(app).get(`/api/pontos/${pontoId}/fotos`)).body;
      expect(fotos).toHaveLength(1);
      const img = await request(app).get(fotos[0].url);
      expect(img.status).toBe(200);
      expect(img.headers['content-type']).toBe('image/jpeg');
    });

    test('recusa arquivo que não é imagem', async () => {
      const r = await request(app).post(`/api/pontos/${pontoId}/fotos`).set(auth(ana)).send({ imagem: 'data:text/plain;base64,b2k=' });
      expect(r.status).toBe(400);
    });
  });

  describe('RF10 – Denunciar e UC05 – Moderar Denúncias', () => {
    let avaliacaoBia; let denunciaId;

    test('motorista denuncia avaliação inadequada; denúncia repetida é recusada', async () => {
      avaliacaoBia = (await request(app).get(`/api/pontos/${pontoId}/avaliacoes/minha`).set(auth(bia))).body.avaliacao;
      const r = await request(app).post('/api/denuncias').set(auth(ana))
        .send({ tipo: 'AVALIACAO', conteudoId: avaliacaoBia.id, motivo: 'AVALIACAO_INADEQUADA' });
      expect(r.status).toBe(201);
      denunciaId = r.body.denuncia.id;
      const repetida = await request(app).post('/api/denuncias').set(auth(ana))
        .send({ tipo: 'AVALIACAO', conteudoId: avaliacaoBia.id, motivo: 'AVALIACAO_INADEQUADA' });
      expect(repetida.status).toBe(409);
    });

    test('motorista não acessa a moderação', async () => {
      expect((await request(app).get('/api/moderacao/denuncias').set(auth(ana))).status).toBe(403);
      expect((await request(app).get('/api/moderacao/denuncias')).status).toBe(401);
    });

    test('passos 1 a 3 – administrador vê a lista e os detalhes da denúncia', async () => {
      const lista = await request(app).get('/api/moderacao/denuncias').set(auth(admin));
      expect(lista.body.total).toBe(1);
      expect(lista.body.denuncias[0]).toMatchObject({ tipo: 'AVALIACAO', motivoTexto: 'Avaliação ofensiva ou inadequada', pontoNome: 'Estação Shopping Vila Norte' });
      const det = await request(app).get(`/api/moderacao/denuncias/${denunciaId}`).set(auth(admin));
      expect(det.body.conteudo).toMatchObject({ texto: 'Lixo, perda de tempo!!!', nota: 1, disponivel: true });
      expect(det.body.conteudo.ponto.status).toBe('NAO_VERIFICADO');
    });

    test('A1 – remover conteúdo: avaliação some, média é recalculada e autora é notificada', async () => {
      const r = await request(app).post(`/api/moderacao/denuncias/${denunciaId}/decisao`).set(auth(admin)).send({ acao: 'REMOVER_CONTEUDO' });
      expect(r.status).toBe(200);
      expect(r.body.notificado).toBe(true);
      const lista = await request(app).get(`/api/pontos/${pontoId}/avaliacoes`);
      expect(lista.body).toMatchObject({ notaMedia: 5, total: 1 });
      const notif = await request(app).get('/api/notificacoes').set(auth(bia));
      expect(notif.body.naoLidas).toBe(1);
      expect(notif.body.notificacoes[0].mensagem).toMatch(/Sua avaliação de 1 estrela/);
      await request(app).post('/api/notificacoes/lidas').set(auth(bia));
      expect((await request(app).get('/api/notificacoes').set(auth(bia))).body.naoLidas).toBe(0);
      expect((await request(app).post(`/api/moderacao/denuncias/${denunciaId}/decisao`).set(auth(admin)).send({ acao: 'ARQUIVAR' })).status).toBe(409);
    });

    test('arquivar sem ação mantém o conteúdo', async () => {
      const fotoId = (await request(app).get(`/api/pontos/${pontoId}/fotos`)).body[0].id;
      const d = await request(app).post('/api/denuncias').set(auth(bia)).send({ tipo: 'FOTO', conteudoId: fotoId, motivo: 'CONTEUDO_IMPROPRIO' });
      const r = await request(app).post(`/api/moderacao/denuncias/${d.body.denuncia.id}/decisao`).set(auth(admin)).send({ acao: 'ARQUIVAR' });
      expect(r.body.denuncia.status).toBe('ARQUIVADA');
      expect((await request(app).get(`/api/pontos/${pontoId}/fotos`)).body).toHaveLength(1);
    });

    test('A2 – suspender ponto: várias denúncias resolvidas juntas e ponto some das buscas; administrador reativa', async () => {
      await request(app).post('/api/denuncias').set(auth(bia)).send({ tipo: 'PONTO', conteudoId: pontoId, motivo: 'PONTO_INEXISTENTE' });
      const outro = await conta('Caio Terceiro', 'caio@teste.com');
      await request(app).post('/api/denuncias').set(auth(outro)).send({ tipo: 'PONTO', conteudoId: pontoId, motivo: 'INFORMACAO_INCORRETA' });
      const lista = (await request(app).get('/api/moderacao/denuncias').set(auth(admin))).body;
      expect(lista.total).toBe(1); // uma entrada por conteúdo
      expect(lista.denuncias[0].totalDenuncias).toBe(2);
      const r = await request(app).post(`/api/moderacao/denuncias/${lista.denuncias[0].id}/decisao`).set(auth(admin)).send({ acao: 'SUSPENDER_PONTO' });
      expect(r.body.resolvidas).toBe(2);
      expect((await request(app).get(`/api/pontos/${pontoId}`)).status).toBe(404);
      expect((await request(app).get('/api/pontos?lat=-23.5&lng=-46.6')).body.total).toBe(0);
      expect((await request(app).get('/api/moderacao/denuncias').set(auth(admin))).body.total).toBe(0);
      const suspensos = (await request(app).get('/api/moderacao/pontos-suspensos').set(auth(admin))).body;
      expect(suspensos.map((p) => p.id)).toEqual([pontoId]);
      await request(app).post(`/api/moderacao/pontos/${pontoId}/reativar`).set(auth(admin));
      expect((await request(app).get(`/api/pontos/${pontoId}`)).body.status).toBe('NAO_VERIFICADO');
      expect((await request(app).get('/api/moderacao/historico').set(auth(admin))).body.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('RF12 – Gerenciar usuários', () => {
    test('administrador lista e bloqueia usuário; o bloqueio vale imediatamente', async () => {
      const usuarios = (await request(app).get('/api/admin/usuarios?busca=bia').set(auth(admin))).body;
      expect(usuarios).toHaveLength(1);
      const r = await request(app).put(`/api/admin/usuarios/${usuarios[0].id}/bloqueio`).set(auth(admin)).send({ bloqueado: true });
      expect(r.body.usuario.status).toBe('BLOQUEADO');
      // token antigo deixa de valer
      expect((await request(app).get('/api/perfil').set(auth(bia))).status).toBe(403);
      // novo login é recusado (UC01 – A2)
      expect((await request(app).post('/api/auth/login').send({ email: 'bia@teste.com', senha: 'segredo123' })).status).toBe(403);
      await request(app).put(`/api/admin/usuarios/${usuarios[0].id}/bloqueio`).set(auth(admin)).send({ bloqueado: false });
      expect((await request(app).get('/api/perfil').set(auth(bia))).status).toBe(200);
    });

    test('não bloqueia administrador e motorista não acessa a gestão', async () => {
      const [adm] = (await request(app).get('/api/admin/usuarios?busca=admin@').set(auth(admin))).body;
      expect((await request(app).put(`/api/admin/usuarios/${adm.id}/bloqueio`).set(auth(admin)).send({ bloqueado: true })).status).toBe(409);
      expect((await request(app).get('/api/admin/usuarios').set(auth(ana))).status).toBe(403);
    });
  });
});
