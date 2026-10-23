// ConteudoModeravel – classe abstrata (Modelo de Domínio – Seção 9)
// Generaliza tudo o que pode ser denunciado: PontoDeRecarga, Avaliacao e FotoPonto.
// Polimorfismo (GRASP): cada subclasse decide como "remover a si própria" (UC05 – A1).
class ConteudoModeravel {
  constructor() {
    if (new.target === ConteudoModeravel) {
      throw new TypeError('ConteudoModeravel é abstrata: use PontoDeRecarga, Avaliacao ou FotoPonto.');
    }
  }

  // Tipo usado na denúncia: 'PONTO', 'AVALIACAO' ou 'FOTO'
  get tipoConteudo() { throw new Error('Subclasse deve informar o tipo do conteúdo.'); }

  // Id do motorista responsável pelo conteúdo (quem recebe a notificação de remoção)
  get autorId() { return this.motoristaId || null; }

  // Id do ponto de recarga ao qual o conteúdo se refere
  get pontoRelacionadoId() { return this.pontoId || null; }

  // Descrição curta exibida ao administrador e na notificação
  descricao() { throw new Error('Subclasse deve descrever o conteúdo.'); }

  // Operação polimórfica: implementada de forma diferente em cada subclasse
  remover() { throw new Error('Subclasse deve implementar remover().'); }
}

module.exports = ConteudoModeravel;
