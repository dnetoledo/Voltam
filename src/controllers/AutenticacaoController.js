// AutenticacaoController – padrão GRASP Controller (UC01 – Autenticar-se e RF01 – Criar conta)
const jwt = require('jsonwebtoken');
const Usuario = require('../models/Usuario');
const repositorioUsuario = require('../repositories/RepositorioUsuario');

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function gerarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, nome: usuario.nome, tipo: usuario.tipo },
    process.env.JWT_SECRET,
    { expiresIn: '8h' },
  );
}

module.exports = {
  // RF01 – POST /api/usuarios
  async criarConta(req, res) {
    const { nome, email, senha } = req.body || {};
    const erros = [];
    if (!nome || nome.trim().length < 3) erros.push('Informe seu nome (mínimo 3 caracteres).');
    if (!email || !EMAIL_VALIDO.test(email)) erros.push('Informe um e-mail válido.');
    if (!senha || senha.length < 6) erros.push('A senha deve ter pelo menos 6 caracteres.');
    if (erros.length) return res.status(400).json({ erro: erros.join(' '), erros });

    if (await repositorioUsuario.buscarPorEmail(email)) {
      return res.status(409).json({ erro: 'Já existe uma conta com este e-mail.' });
    }

    const senhaHash = await Usuario.gerarHash(senha);
    const usuario = await repositorioUsuario.salvar({ nome: nome.trim(), email: email.trim(), senhaHash });
    return res.status(201).json({ usuario, token: gerarToken(usuario) });
  },

  // UC01 – POST /api/auth/login
  async autenticar(req, res) {
    const { email, senha } = req.body || {};
    if (!email || !senha) return res.status(400).json({ erro: 'Informe e-mail e senha.' });

    const usuario = await repositorioUsuario.buscarPorEmail(email.trim());
    // A1 – credenciais inválidas
    if (!usuario || !(await usuario.verificarSenha(senha))) {
      return res.status(401).json({ erro: 'E-mail ou senha inválidos.' });
    }
    // A2 – conta bloqueada
    if (usuario.estaBloqueado()) {
      return res.status(403).json({ erro: 'Sua conta está bloqueada. Entre em contato com o suporte.' });
    }
    return res.json({ usuario, token: gerarToken(usuario) });
  },
};
