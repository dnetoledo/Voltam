// Entidade Notificacao – enviada ao autor quando seu conteúdo é removido (UC05 – A1, caso de uso Enviar Notificação)
// Nesta versão a notificação é entregue dentro do próprio VoltMap (tela Meu Perfil).
class Notificacao {
  constructor({ id, usuario_id, tipo, mensagem, lida, data_envio }) {
    this.id = id;
    this.usuarioId = usuario_id;
    this.tipo = tipo;
    this.mensagem = mensagem;
    this.lida = Boolean(lida);
    this.dataEnvio = data_envio ? new Date(data_envio) : null;
  }

  // Cria a notificação de remoção de conteúdo para o autor
  static deRemocao(conteudo, motivoTexto) {
    const frases = {
      PONTO: `Seu ${conteudo.descricao()} foi suspenso pela moderação do VoltMap`,
      AVALIACAO: `Sua ${conteudo.descricao()} foi removida pela moderação do VoltMap`,
      FOTO: 'Uma foto que você enviou foi removida pela moderação do VoltMap',
    };
    return new Notificacao({
      usuario_id: conteudo.autorId,
      tipo: 'CONTEUDO_REMOVIDO',
      mensagem: `${frases[conteudo.tipoConteudo]} (motivo: ${motivoTexto}).`,
    });
  }

  // "Enviar" = marcar o momento de envio; a persistência fica com o RepositorioNotificacao
  enviar() {
    this.dataEnvio = new Date();
    return this;
  }

  toJSON() {
    return { id: this.id, tipo: this.tipo, mensagem: this.mensagem, lida: this.lida, dataEnvio: this.dataEnvio };
  }
}

module.exports = Notificacao;
