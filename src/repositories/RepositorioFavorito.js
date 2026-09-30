// RepositorioFavorito – padrão GRASP Pure Fabrication (RF09)
const db = require('../config/db');
const PontoDeRecarga = require('../models/PontoDeRecarga');

module.exports = {
  async listar(motoristaId) {
    const { rows } = await db.query(
      `SELECT p.*, f.data_adicionado FROM favorito f JOIN ponto_de_recarga p ON p.id = f.ponto_id
       WHERE f.motorista_id = $1 AND p.status <> 'SUSPENSO' ORDER BY f.data_adicionado DESC`, [motoristaId],
    );
    return rows.map((r) => Object.assign(new PontoDeRecarga(r), { favoritadoEm: r.data_adicionado }));
  },

  async adicionar(motoristaId, pontoId) {
    await db.query(
      'INSERT INTO favorito (motorista_id, ponto_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [motoristaId, pontoId],
    );
  },

  async remover(motoristaId, pontoId) {
    await db.query('DELETE FROM favorito WHERE motorista_id = $1 AND ponto_id = $2', [motoristaId, pontoId]);
  },

  async ehFavorito(motoristaId, pontoId) {
    const { rowCount } = await db.query(
      'SELECT 1 FROM favorito WHERE motorista_id = $1 AND ponto_id = $2', [motoristaId, pontoId],
    );
    return rowCount > 0;
  },
};
