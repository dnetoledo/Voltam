// RepositorioFormaPagamento – padrão GRASP Pure Fabrication
const db = require('../config/db');
const FormaPagamento = require('../models/FormaPagamento');

module.exports = {
  async listar(motoristaId) {
    const { rows } = await db.query(
      'SELECT * FROM forma_pagamento WHERE motorista_id = $1 ORDER BY padrao DESC, criado_em DESC', [motoristaId],
    );
    return rows.map((r) => new FormaPagamento(r));
  },

  async buscar(motoristaId, id) {
    const { rows } = await db.query('SELECT * FROM forma_pagamento WHERE motorista_id = $1 AND id = $2', [motoristaId, id]);
    return rows[0] ? new FormaPagamento(rows[0]) : null;
  },

  async salvar(motoristaId, { bandeira, final, validade, titular }) {
    const { rows: [{ total }] } = await db.query('SELECT COUNT(*)::int AS total FROM forma_pagamento WHERE motorista_id = $1', [motoristaId]);
    const { rows } = await db.query(
      `INSERT INTO forma_pagamento (motorista_id, bandeira, final_cartao, validade, titular, padrao)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [motoristaId, bandeira, final, validade, String(titular).trim().toUpperCase(), total === 0],
    );
    return new FormaPagamento(rows[0]);
  },

  async remover(motoristaId, id) {
    await db.query('DELETE FROM forma_pagamento WHERE motorista_id = $1 AND id = $2', [motoristaId, id]);
  },

  async definirPadrao(motoristaId, id) {
    await db.query('UPDATE forma_pagamento SET padrao = (id = $2) WHERE motorista_id = $1', [motoristaId, id]);
  },
};
