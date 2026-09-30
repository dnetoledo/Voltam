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

  async atualizarNome(id, nome) {
    const { rows } = await db.query('UPDATE usuario SET nome = $1 WHERE id = $2 RETURNING *', [nome, id]);
    return paraObjeto(rows[0]);
  },

  async atualizarSenha(id, senhaHash) {
    await db.query('UPDATE usuario SET senha_hash = $1 WHERE id = $2', [senhaHash, id]);
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
