// PerfilController – padrão GRASP Controller (Meu Perfil)
const Usuario = require('../models/Usuario');
const repositorioUsuario = require('../repositories/RepositorioUsuario');
const repositorioPonto = require('../repositories/RepositorioPontoDeRecarga');
const repositorioFavorito = require('../repositories/RepositorioFavorito');
const repositorioCheckIn = require('../repositories/RepositorioCheckIn');

module.exports = {
  // GET /api/perfil
  async obterPerfil(req, res) {
    const usuario = await repositorioUsuario.buscarPorId(req.usuario.id);
    if (!usuario) return res.status(404).json({ erro: 'Usuário não encontrado.' });
    const [pontos, favoritos, checkIns, recargaAtiva] = await Promise.all([
      repositorioPonto.buscarPorMotorista(usuario.id),
      repositorioFavorito.listar(usuario.id),
      repositorioCheckIn.listarPorMotorista(usuario.id, 5),
      repositorioCheckIn.buscarRecargaAtiva(usuario.id),
    ]);
    return res.json({
      usuario: { ...usuario.toJSON(), dataCadastro: usuario.dataCadastro },
      pontosCadastrados: pontos,
      favoritos,
      checkIns,
      recargaAtiva,
    });
  },

  // PUT /api/perfil  { nome }
  async atualizarDados(req, res) {
    const nome = String(req.body?.nome || '').trim();
    if (nome.length < 3) return res.status(400).json({ erro: 'Informe seu nome (mínimo 3 caracteres).' });
    const usuario = await repositorioUsuario.atualizarNome(req.usuario.id, nome);
    return res.json({ usuario });
  },

  // PUT /api/perfil/senha  { senhaAtual, novaSenha }
  async alterarSenha(req, res) {
    const { senhaAtual, novaSenha } = req.body || {};
    if (!novaSenha || novaSenha.length < 6) return res.status(400).json({ erro: 'A nova senha deve ter pelo menos 6 caracteres.' });
    const usuario = await repositorioUsuario.buscarPorId(req.usuario.id);
    if (!usuario || !(await usuario.verificarSenha(senhaAtual || ''))) {
      return res.status(400).json({ erro: 'A senha atual está incorreta.' });
    }
    await repositorioUsuario.atualizarSenha(usuario.id, await Usuario.gerarHash(novaSenha));
    return res.json({ mensagem: 'Senha alterada com sucesso.' });
  },
};
