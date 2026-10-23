// Protege as rotas que exigem usuário autenticado (RNF de segurança: acesso controlado por JWT)
// Iteração C2: confere também se a conta continua ativa – um usuário bloqueado pelo administrador (RF12)
// perde o acesso imediatamente, mesmo que ainda tenha um token válido.
const jwt = require('jsonwebtoken');
const repositorioUsuario = require('../repositories/RepositorioUsuario');

async function autenticacao(req, res, next) {
  const [tipo, token] = (req.headers.authorization || '').split(' ');
  if (tipo !== 'Bearer' || !token) {
    return res.status(401).json({ erro: 'Faça login para continuar.' });
  }
  let dados;
  try {
    dados = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
  }
  try {
    const usuario = await repositorioUsuario.buscarPorId(dados.id);
    if (!usuario) return res.status(401).json({ erro: 'Sessão expirada. Faça login novamente.' });
    if (usuario.estaBloqueado()) {
      return res.status(403).json({ erro: 'Sua conta está bloqueada. Entre em contato com o suporte.', bloqueado: true });
    }
    req.usuario = { id: usuario.id, nome: usuario.nome, tipo: usuario.tipo };
    req.usuarioObj = usuario; // Motorista ou Administrador já carregado
    return next();
  } catch (err) {
    return next(err);
  }
}

// Somente administradores (UC05 – Moderar Denúncias e RF12 – Gerenciar Usuários)
function exigirAdministrador(req, res, next) {
  if (req.usuario?.tipo !== 'ADMINISTRADOR') {
    return res.status(403).json({ erro: 'Acesso permitido somente ao administrador.' });
  }
  return next();
}

module.exports = autenticacao;
module.exports.exigirAdministrador = exigirAdministrador;
