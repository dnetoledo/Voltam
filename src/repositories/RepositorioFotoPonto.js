// RepositorioFotoPonto – padrão GRASP Pure Fabrication (fotos dos pontos de recarga)
const db = require('../config/db');
const FotoPonto = require('../models/FotoPonto');

const SEM_IMAGEM = `SELECT f.id, f.ponto_id, f.motorista_id, f.tipo_mime, f.data_envio, f.removida, u.nome AS motorista_nome
  FROM foto_ponto f JOIN usuario u ON u.id = f.motorista_id`;

module.exports = {
  async salvar(foto) {
    const { rows } = await db.query(
      `INSERT INTO foto_ponto (ponto_id, motorista_id, tipo_mime, imagem) VALUES ($1,$2,$3,$4)
       RETURNING id, ponto_id, motorista_id, tipo_mime, data_envio, removida`,
      [foto.pontoId, foto.motoristaId, foto.tipoMime, foto.imagem],
    );
    return new FotoPonto(rows[0]);
  },

  async contarPorPonto(pontoId) {
    const { rows } = await db.query('SELECT COUNT(*)::int AS n FROM foto_ponto WHERE ponto_id = $1 AND NOT removida', [pontoId]);
    return rows[0].n;
  },

  async listarPorPonto(pontoId) {
    const { rows } = await db.query(`${SEM_IMAGEM} WHERE f.ponto_id = $1 AND NOT f.removida ORDER BY f.data_envio DESC`, [pontoId]);
    return rows.map((r) => new FotoPonto(r));
  },

  // Sem a imagem (para moderação e denúncias)
  async buscarPorId(id) {
    const { rows } = await db.query(`${SEM_IMAGEM} WHERE f.id = $1`, [id]);
    return rows[0] ? new FotoPonto(rows[0]) : null;
  },

  // Com a imagem (para exibir); incluirRemovidas = true somente para o administrador
  async buscarImagem(id, { incluirRemovidas = false } = {}) {
    const { rows } = await db.query(
      `SELECT * FROM foto_ponto WHERE id = $1 ${incluirRemovidas ? '' : 'AND NOT removida'}`, [id],
    );
    return rows[0] ? new FotoPonto(rows[0]) : null;
  },

  async atualizar(foto) {
    await db.query('UPDATE foto_ponto SET removida = $1 WHERE id = $2', [foto.removida, foto.id]);
  },
};
