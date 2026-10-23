// RepositorioDenuncia – padrão GRASP Pure Fabrication (RF10 / UC05)
// Mantém a lista de denúncias pendentes e carrega o ConteudoModeravel a que cada uma se refere.
const db = require('../config/db');
const Denuncia = require('../models/Denuncia');
const repositorioPonto = require('./RepositorioPontoDeRecarga');
const repositorioAvaliacao = require('./RepositorioAvaliacao');
const repositorioFoto = require('./RepositorioFotoPonto');

const COM_NOMES = `SELECT d.*, u.nome AS denunciante_nome,
    (SELECT COUNT(*) FROM denuncia x WHERE x.conteudo_tipo = d.conteudo_tipo AND x.conteudo_id = d.conteudo_id
       AND x.status = 'PENDENTE') AS total_denuncias
  FROM denuncia d JOIN usuario u ON u.id = d.denunciante_id`;

// Cada tipo de conteúdo é buscado no seu próprio repositório
const BUSCAR_CONTEUDO = {
  PONTO: (id) => repositorioPonto.buscarPorIdIncluindoSuspensos(id),
  AVALIACAO: (id) => repositorioAvaliacao.buscarPorId(id),
  FOTO: (id) => repositorioFoto.buscarPorId(id),
};

// Cada tipo de conteúdo é gravado no seu próprio repositório depois de remover()
const ATUALIZAR_CONTEUDO = {
  PONTO: (c) => repositorioPonto.atualizarStatus(c),
  AVALIACAO: (c) => repositorioAvaliacao.atualizar(c),
  FOTO: (c) => repositorioFoto.atualizar(c),
};

module.exports = {
  buscarConteudo(tipo, id) {
    return BUSCAR_CONTEUDO[tipo] ? BUSCAR_CONTEUDO[tipo](Number(id)) : Promise.resolve(null);
  },

  salvarConteudo(conteudo) {
    return ATUALIZAR_CONTEUDO[conteudo.tipoConteudo](conteudo);
  },

  async salvar(d) {
    const { rows } = await db.query(
      `INSERT INTO denuncia (denunciante_id, conteudo_tipo, conteudo_id, motivo, descricao)
       VALUES ($1,$2,$3,$4,$5)
       ON CONFLICT (denunciante_id, conteudo_tipo, conteudo_id) WHERE status = 'PENDENTE' DO NOTHING
       RETURNING *`,
      [d.denuncianteId, d.conteudoTipo, d.conteudoId, d.motivo, d.descricao],
    );
    return rows[0] ? new Denuncia(rows[0]) : null; // null = já existe denúncia pendente deste motorista
  },

  // Passo 1 do UC05: lista de denúncias pendentes (mais antigas primeiro)
  async buscarPendentes() {
    const { rows } = await db.query(`${COM_NOMES} WHERE d.status = 'PENDENTE' ORDER BY d.data_hora`);
    return rows.map((r) => new Denuncia(r));
  },

  async listarResolvidas(limite = 20) {
    const { rows } = await db.query(
      `${COM_NOMES} WHERE d.status <> 'PENDENTE' ORDER BY d.resolvida_em DESC LIMIT $1`, [limite],
    );
    return rows.map((r) => new Denuncia(r));
  },

  async buscarPorId(id) {
    const { rows } = await db.query(`${COM_NOMES} WHERE d.id = $1`, [id]);
    return rows[0] ? new Denuncia(rows[0]) : null;
  },

  // Outras denúncias pendentes sobre o mesmo conteúdo (resolvidas junto com a analisada)
  async buscarPendentesDoConteudo(tipo, conteudoId) {
    const { rows } = await db.query(
      `${COM_NOMES} WHERE d.status = 'PENDENTE' AND d.conteudo_tipo = $1 AND d.conteudo_id = $2`, [tipo, conteudoId],
    );
    return rows.map((r) => new Denuncia(r));
  },

  async atualizar(d) {
    await db.query(
      'UPDATE denuncia SET status = $1, acao_tomada = $2, administrador_id = $3, resolvida_em = $4 WHERE id = $5',
      [d.status, d.acaoTomada, d.administradorId, d.resolvidaEm, d.id],
    );
  },
};
