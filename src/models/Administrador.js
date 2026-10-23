// Entidade Administrador (especialização de Usuario)
// Responsável pela moderação de denúncias (UC05) e pela gestão de usuários (RF12).
const Usuario = require('./Usuario');
const Denuncia = require('./Denuncia');
const Notificacao = require('./Notificacao');

class Administrador extends Usuario {
  // UC05 – decide o que fazer com a denúncia. Retorna a notificação a enviar ao autor (ou null).
  //   conteudo: o ConteudoModeravel denunciado; ponto: o ponto relacionado (para "suspender ponto")
  moderarDenuncia(denuncia, acao, { conteudo, ponto } = {}) {
    switch (acao) {
      case Denuncia.ACOES.REMOVER_CONTEUDO: {
        if (!conteudo) throw new Error('O conteúdo denunciado não existe mais.');
        conteudo.remover(); // Polimorfismo: ponto é suspenso, avaliação e foto são apagadas
        denuncia.resolver(acao, this.id);
        const motivo = Denuncia.MOTIVOS[denuncia.motivo] || denuncia.motivo;
        return conteudo.autorId ? Notificacao.deRemocao(conteudo, motivo).enviar() : null;
      }
      case Denuncia.ACOES.SUSPENDER_PONTO:
        if (!ponto) throw new Error('O ponto de recarga relacionado não existe mais.');
        ponto.suspender();
        denuncia.resolver(acao, this.id);
        return null;
      case Denuncia.ACOES.ARQUIVAR:
        denuncia.arquivar(this.id);
        return null;
      default:
        throw new Error('Ação de moderação inválida.');
    }
  }

  // RF12 – bloquear / desbloquear o acesso de um usuário
  alterarAcesso(usuario, bloquear) {
    if (usuario.id === this.id) throw new Error('Você não pode bloquear a sua própria conta.');
    if (usuario instanceof Administrador) throw new Error('Não é possível bloquear outro administrador.');
    if (bloquear) usuario.bloquear(); else usuario.desbloquear();
  }
}

module.exports = Administrador;
