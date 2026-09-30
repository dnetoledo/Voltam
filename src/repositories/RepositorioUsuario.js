// RepositorioUsuario – padrão GRASP Pure Fabrication
// Concentra o acesso à tabela "usuario".
const db = require('../config/db');
const Usuario = require('../models/Usuario');
const Motorista = require('../models/Motorista');

function paraObjeto(linha) {
  if (!linha) return null;
  return linha.tipo === 'MOTORISTA' ? new Motorista(linha) : new Usuario(linha);
}

module.exports = {
  async buscarPorEmail(email) {
    const { rows } = await db.query('SELECT * FROM usuario WHERE email = $1', [email.toLowerCase()]);
    return paraObjeto(rows[0]);
  },

  async buscarPorId(id) {
    const { rows } = await db.query('SELECT * FROM usuario WHERE id = $1', [id]);
    return paraObjeto(rows[0]);
  },

  async salvar({ nome, email, senhaHash, tipo = 'MOTORISTA' }) {
    const { rows } = await db.query(
      `INSERT INTO usuario (nome, email, senha_hash, tipo)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [nome, email.toLowerCase(), senhaHash, tipo],
    );
    return paraObjeto(rows[0]);
  },
};
