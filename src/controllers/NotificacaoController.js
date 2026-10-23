// NotificacaoController – padrão GRASP Controller (notificações recebidas pelo usuário)
const repositorioNotificacao = require('../repositories/RepositorioNotificacao');

module.exports = {
  // GET /api/notificacoes
  async listar(req, res) {
    const [notificacoes, naoLidas] = await Promise.all([
      repositorioNotificacao.listar(req.usuario.id),
      repositorioNotificacao.contarNaoLidas(req.usuario.id),
    ]);
    return res.json({ naoLidas, notificacoes });
  },

  // POST /api/notificacoes/lidas
  async marcarComoLidas(req, res) {
    await repositorioNotificacao.marcarTodasComoLidas(req.usuario.id);
    return res.json({ naoLidas: 0 });
  },
};
