// Iteração C2 – testes de unidade das classes de domínio (sem banco de dados)
const ConteudoModeravel = require('../src/models/ConteudoModeravel');
const PontoDeRecarga = require('../src/models/PontoDeRecarga');
const Avaliacao = require('../src/models/Avaliacao');
const FotoPonto = require('../src/models/FotoPonto');
const Denuncia = require('../src/models/Denuncia');
const Motorista = require('../src/models/Motorista');
const Administrador = require('../src/models/Administrador');
const Usuario = require('../src/models/Usuario');

const ponto = () => new PontoDeRecarga({ id: 1, nome: 'Posto X', latitude: -23.5, longitude: -46.6, motorista_id: 10, status: 'DISPONIVEL' });
const avaliacao = () => new Avaliacao({ id: 2, ponto_id: 1, motorista_id: 11, nota: 1, comentario: 'Péssimo' });
const foto = () => new FotoPonto({ id: 3, ponto_id: 1, motorista_id: 12, tipo_mime: 'image/jpeg' });

describe('ConteudoModeravel (classe abstrata + Polimorfismo)', () => {
  test('não pode ser instanciada diretamente', () => {
    expect(() => new ConteudoModeravel()).toThrow(/abstrata/);
  });

  test('PontoDeRecarga, Avaliacao e FotoPonto são conteúdos moderáveis', () => {
    [ponto(), avaliacao(), foto()].forEach((c) => expect(c).toBeInstanceOf(ConteudoModeravel));
  });

  test('remover() tem comportamento diferente em cada subclasse', () => {
    const p = ponto(); const a = avaliacao(); const f = foto();
    [p, a, f].forEach((c) => c.remover()); // mesma chamada, sem saber o tipo
    expect(p.status).toBe('SUSPENSO');
    expect(a.removida).toBe(true);
    expect(f.removida).toBe(true);
  });

  test('cada conteúdo informa seu tipo, autor e ponto relacionado', () => {
    expect([ponto(), avaliacao(), foto()].map((c) => [c.tipoConteudo, c.autorId, c.pontoRelacionadoId]))
      .toEqual([['PONTO', 10, 1], ['AVALIACAO', 11, 1], ['FOTO', 12, 1]]);
  });
});

describe('Avaliacao e FotoPonto', () => {
  test('valida nota de 1 a 5 e tamanho do comentário', () => {
    expect(Avaliacao.validar({ nota: 5 })).toEqual([]);
    expect(Avaliacao.validar({ nota: 0 })).toHaveLength(1);
    expect(Avaliacao.validar({ nota: 3.5 })).toHaveLength(1);
    expect(Avaliacao.validar({ nota: 4, comentario: 'x'.repeat(501) })).toHaveLength(1);
  });

  test('decodifica a foto e recusa formatos inválidos', () => {
    const ok = FotoPonto.decodificar(`data:image/jpeg;base64,${Buffer.from('abc').toString('base64')}`);
    expect(ok.tipoMime).toBe('image/jpeg');
    expect(ok.imagem.toString()).toBe('abc');
    expect(FotoPonto.decodificar('data:text/html;base64,PGI+').erro).toBeDefined();
    expect(FotoPonto.decodificar('').erro).toBeDefined();
  });
});

describe('Motorista (Creator) – avaliação, foto e denúncia', () => {
  const m = new Motorista({ id: 20, tipo: 'MOTORISTA' });

  test('escreve avaliação e envia foto vinculadas ao ponto', () => {
    const a = m.escreverAvaliacao(ponto(), { nota: 4, comentario: '  Bom  ' });
    expect(a).toMatchObject({ pontoId: 1, motoristaId: 20, nota: 4, comentario: 'Bom' });
    const f = m.enviarFoto(ponto(), { tipoMime: 'image/png', imagem: Buffer.from('x') });
    expect(f).toMatchObject({ pontoId: 1, motoristaId: 20, tipoMime: 'image/png' });
  });

  test('registra denúncia pendente sobre um conteúdo', () => {
    const d = m.registrarDenuncia(avaliacao(), { motivo: 'AVALIACAO_INADEQUADA' });
    expect(d).toMatchObject({ denuncianteId: 20, conteudoTipo: 'AVALIACAO', conteudoId: 2, status: 'PENDENTE' });
  });

  test('não denuncia a própria avaliação', () => {
    const minha = new Avaliacao({ id: 5, ponto_id: 1, motorista_id: 20, nota: 5 });
    expect(() => m.registrarDenuncia(minha, { motivo: 'OUTRO', descricao: 'x' })).toThrow();
  });

  test('valida motivo da denúncia', () => {
    expect(Denuncia.validar({ tipo: 'PONTO', conteudoId: 1, motivo: 'PONTO_INEXISTENTE' })).toEqual([]);
    expect(Denuncia.validar({ tipo: 'PONTO', conteudoId: 1, motivo: 'X' })).toHaveLength(1);
    expect(Denuncia.validar({ tipo: 'PONTO', conteudoId: 1, motivo: 'OUTRO' })).toHaveLength(1);
  });
});

describe('Administrador – UC05 e RF12', () => {
  const admin = new Administrador({ id: 1, tipo: 'ADMINISTRADOR' });
  const nova = (c) => new Motorista({ id: 30 }).registrarDenuncia(c, { motivo: 'CONTEUDO_IMPROPRIO' });

  test('A1 – remover conteúdo: resolve a denúncia e gera notificação ao autor', () => {
    const a = avaliacao(); const d = nova(a);
    const n = admin.moderarDenuncia(d, 'REMOVER_CONTEUDO', { conteudo: a });
    expect(a.removida).toBe(true);
    expect(d).toMatchObject({ status: 'RESOLVIDA', acaoTomada: 'REMOVER_CONTEUDO', administradorId: 1 });
    expect(n).toMatchObject({ usuarioId: 11, tipo: 'CONTEUDO_REMOVIDO' });
    expect(n.mensagem).toMatch(/Sua avaliação/);
  });

  test('A2 – suspender ponto relacionado a uma avaliação', () => {
    const p = ponto(); const d = nova(avaliacao());
    expect(admin.moderarDenuncia(d, 'SUSPENDER_PONTO', { conteudo: avaliacao(), ponto: p })).toBeNull();
    expect(p.estaSuspenso()).toBe(true);
    expect(d.status).toBe('RESOLVIDA');
  });

  test('arquivar sem ação e impedir nova decisão', () => {
    const d = nova(foto());
    admin.moderarDenuncia(d, 'ARQUIVAR', { conteudo: foto() });
    expect(d).toMatchObject({ status: 'ARQUIVADA', acaoTomada: 'ARQUIVAR' });
    expect(() => admin.moderarDenuncia(d, 'ARQUIVAR', {})).toThrow(/já foi analisada/);
  });

  test('RF12 – bloqueia e desbloqueia motorista, mas não a si mesmo nem outro administrador', () => {
    const u = new Motorista({ id: 40, status: 'ATIVO' });
    admin.alterarAcesso(u, true);
    expect(u.estaBloqueado()).toBe(true);
    admin.alterarAcesso(u, false);
    expect(u.estaBloqueado()).toBe(false);
    expect(() => admin.alterarAcesso(admin, true)).toThrow();
    expect(() => admin.alterarAcesso(new Administrador({ id: 2 }), true)).toThrow();
    expect(new Usuario({ tipo: 'ADMINISTRADOR' }).ehAdministrador()).toBe(true);
  });
});
