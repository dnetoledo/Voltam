// RepositorioUsuario – padrão GRASP Pure Fabrication
// Concentra o acesso à tabela "usuario".
const db = require('../config/db');
const Usuario = require('../models/Usuario');
const Motorista = require('../models/Motorista');
const Administrador = require('../models/Administrador');

function paraObjeto(linha) {
  if (!linha) return null;
  if (linha.tipo === 'MOTORISTA') return new Motorista(linha);
  if (linha.tipo === 'ADMINISTRADOR') return new Administrador(linha);
  return new Usuario(linha);
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

  // RF12 – lista de usuários para o administrador (com busca por nome ou e-mail)
  async listar({ busca = '', limite = 50 } = {}) {
    const { rows } = await db.query(
      `SELECT u.*,
         (SELECT COUNT(*) FROM ponto_de_recarga p WHERE p.motorista_id = u.id)::int AS total_pontos,
         (SELECT COUNT(*) FROM denuncia d WHERE
            (d.conteudo_tipo = 'PONTO' AND d.conteudo_id IN (SELECT id FROM ponto_de_recarga WHERE motorista_id = u.id))
            OR (d.conteudo_tipo = 'AVALIACAO' AND d.conteudo_id IN (SELECT id FROM avaliacao WHERE motorista_id = u.id))
            OR (d.conteudo_tipo = 'FOTO' AND d.conteudo_id IN (SELECT id FROM foto_ponto WHERE motorista_id = u.id))
         )::int AS denuncias_recebidas
       FROM usuario u
       WHERE $1 = '' OR u.nome ILIKE '%' || $1 || '%' OR u.email ILIKE '%' || $1 || '%'
       ORDER BY u.tipo DESC, u.nome LIMIT $2`,
      [busca.trim(), limite],
    );
    return rows.map((r) => Object.assign(paraObjeto(r), { totalPontos: r.total_pontos, denunciasRecebidas: r.denuncias_recebidas }));
  },

  async atualizarStatus(usuario) {
    await db.query('UPDATE usuario SET status = $1 WHERE id = $2', [usuario.status, usuario.id]);
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
