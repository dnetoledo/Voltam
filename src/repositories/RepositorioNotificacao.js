// RepositorioNotificacao – padrão GRASP Pure Fabrication
const db = require('../config/db');
const Notificacao = require('../models/Notificacao');

module.exports = {
  async salvar(n) {
    const { rows } = await db.query(
      'INSERT INTO notificacao (usuario_id, tipo, mensagem, data_envio) VALUES ($1,$2,$3,COALESCE($4, NOW())) RETURNING *',
      [n.usuarioId, n.tipo, n.mensagem, n.dataEnvio],
    );
    return new Notificacao(rows[0]);
  },

  async listar(usuarioId, limite = 20) {
    const { rows } = await db.query(
      'SELECT * FROM notificacao WHERE usuario_id = $1 ORDER BY data_envio DESC LIMIT $2', [usuarioId, limite],
    );
    return rows.map((r) => new Notificacao(r));
  },

  async contarNaoLidas(usuarioId) {
    const { rows } = await db.query('SELECT COUNT(*)::int AS n FROM notificacao WHERE usuario_id = $1 AND NOT lida', [usuarioId]);
    return rows[0].n;
  },

  async marcarTodasComoLidas(usuarioId) {
    await db.query('UPDATE notificacao SET lida = TRUE WHERE usuario_id = $1 AND NOT lida', [usuarioId]);
  },
};
