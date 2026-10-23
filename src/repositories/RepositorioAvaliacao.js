// RepositorioAvaliacao – padrão GRASP Pure Fabrication (RF08)
const db = require('../config/db');
const Avaliacao = require('../models/Avaliacao');

const COM_NOMES = `SELECT a.*, u.nome AS motorista_nome, p.nome AS ponto_nome
  FROM avaliacao a JOIN usuario u ON u.id = a.motorista_id JOIN ponto_de_recarga p ON p.id = a.ponto_id`;

module.exports = {
  // Uma avaliação por motorista em cada ponto: se já existir, é atualizada
  async salvar(av) {
    const { rows } = await db.query(
      `INSERT INTO avaliacao (ponto_id, motorista_id, nota, comentario) VALUES ($1,$2,$3,$4)
       ON CONFLICT (ponto_id, motorista_id)
       DO UPDATE SET nota = EXCLUDED.nota, comentario = EXCLUDED.comentario, data_hora = NOW(), removida = FALSE
       RETURNING *`,
      [av.pontoId, av.motoristaId, av.nota, av.comentario],
    );
    return new Avaliacao(rows[0]);
  },

  async buscarPorId(id) {
    const { rows } = await db.query(`${COM_NOMES} WHERE a.id = $1`, [id]);
    return rows[0] ? new Avaliacao(rows[0]) : null;
  },

  async listarPorPonto(pontoId, limite = 20) {
    const { rows } = await db.query(
      `${COM_NOMES} WHERE a.ponto_id = $1 AND NOT a.removida ORDER BY a.data_hora DESC LIMIT $2`, [pontoId, limite],
    );
    return rows.map((r) => new Avaliacao(r));
  },

  async buscarDoMotorista(pontoId, motoristaId) {
    const { rows } = await db.query(
      `${COM_NOMES} WHERE a.ponto_id = $1 AND a.motorista_id = $2 AND NOT a.removida`, [pontoId, motoristaId],
    );
    return rows[0] ? new Avaliacao(rows[0]) : null;
  },

  async listarPorMotorista(motoristaId, limite = 10) {
    const { rows } = await db.query(
      `${COM_NOMES} WHERE a.motorista_id = $1 AND NOT a.removida ORDER BY a.data_hora DESC LIMIT $2`, [motoristaId, limite],
    );
    return rows.map((r) => new Avaliacao(r));
  },

  async atualizar(av) {
    await db.query('UPDATE avaliacao SET removida = $1 WHERE id = $2', [av.removida, av.id]);
  },
};
