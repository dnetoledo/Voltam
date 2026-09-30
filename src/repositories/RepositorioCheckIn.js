// RepositorioCheckIn – padrão GRASP Pure Fabrication
const db = require('../config/db');
const CheckIn = require('../models/CheckIn');

const comNomes = `SELECT c.*, u.nome AS motorista_nome, p.nome AS ponto_nome
  FROM check_in c JOIN usuario u ON u.id = c.motorista_id JOIN ponto_de_recarga p ON p.id = c.ponto_id`;

module.exports = {
  async salvar(c) {
    const { rows } = await db.query(
      `INSERT INTO check_in (ponto_id, motorista_id, status_informado, comentario, carregando)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [c.pontoId, c.motoristaId, c.statusInformado, c.comentario, c.carregando],
    );
    return new CheckIn(rows[0]);
  },

  async listarPorPonto(pontoId, limite = 5) {
    const { rows } = await db.query(`${comNomes} WHERE c.ponto_id = $1 ORDER BY c.data_hora DESC LIMIT $2`, [pontoId, limite]);
    return rows.map((r) => new CheckIn(r));
  },

  async listarPorMotorista(motoristaId, limite = 5) {
    const { rows } = await db.query(`${comNomes} WHERE c.motorista_id = $1 ORDER BY c.data_hora DESC LIMIT $2`, [motoristaId, limite]);
    return rows.map((r) => new CheckIn(r));
  },

  // Recarga ativa: check-in "carregando" não encerrado e dentro da validade
  async buscarRecargaAtiva(motoristaId) {
    const { rows } = await db.query(
      `${comNomes} WHERE c.motorista_id = $1 AND c.carregando AND c.encerrado_em IS NULL AND c.validade > NOW()
       ORDER BY c.data_hora DESC LIMIT 1`, [motoristaId],
    );
    return rows[0] ? new CheckIn(rows[0]) : null;
  },

  async encerrar(id) {
    const { rows } = await db.query('UPDATE check_in SET encerrado_em = NOW() WHERE id = $1 RETURNING *', [id]);
    return new CheckIn(rows[0]);
  },
};
