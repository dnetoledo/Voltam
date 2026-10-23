// GestaoUsuariosController – padrão GRASP Controller (RF12 – Gerenciar usuários: bloquear / desbloquear acesso)
const repositorioUsuario = require('../repositories/RepositorioUsuario');

function paraLista(u) {
  return { id: u.id, nome: u.nome, email: u.email, tipo: u.tipo, status: u.status, dataCadastro: u.dataCadastro,
    totalPontos: u.totalPontos, denunciasRecebidas: u.denunciasRecebidas };
}

module.exports = {
  // GET /api/admin/usuarios?busca=
  async listar(req, res) {
    const usuarios = await repositorioUsuario.listar({ busca: String(req.query.busca || '') });
    return res.json(usuarios.map(paraLista));
  },

  // PUT /api/admin/usuarios/:id/bloqueio  { bloqueado: true | false }
  async alterarBloqueio(req, res) {
    if (typeof req.body?.bloqueado !== 'boolean') return res.status(400).json({ erro: 'Informe se o usuário deve ser bloqueado.' });
    const usuario = await repositorioUsuario.buscarPorId(Number(req.params.id));
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    try {
      req.usuarioObj.alterarAcesso(usuario, req.body.bloqueado);
    } catch (err) {
      return res.status(409).json({ erro: err.message });
    }
    await repositorioUsuario.atualizarStatus(usuario);
    return res.json({
      mensagem: usuario.estaBloqueado() ? `${usuario.nome} foi bloqueado(a) e não consegue mais acessar o VoltMap.`
        : `${usuario.nome} foi desbloqueado(a).`,
      usuario: { id: usuario.id, nome: usuario.nome, status: usuario.status },
    });
  },
};
