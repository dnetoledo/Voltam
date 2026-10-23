// Entidade Avaliacao (RF08 – avaliar ponto de recarga com nota e comentário)
// Especialização de ConteudoModeravel: pode ser denunciada e, na moderação, é apagada.
const ConteudoModeravel = require('./ConteudoModeravel');

const NOTA_MIN = 1;
const NOTA_MAX = 5;
const TAMANHO_COMENTARIO = 500;

class Avaliacao extends ConteudoModeravel {
  constructor({ id, ponto_id, motorista_id, nota, comentario, data_hora, removida, motorista_nome, ponto_nome }) {
    super();
    this.id = id;
    this.pontoId = ponto_id;
    this.motoristaId = motorista_id;
    this.nota = Number(nota);
    this.comentario = comentario || null;
    this.dataHora = data_hora ? new Date(data_hora) : new Date();
    this.removida = Boolean(removida);
    this.motoristaNome = motorista_nome;
    this.pontoNome = ponto_nome;
  }

  get tipoConteudo() { return 'AVALIACAO'; }

  descricao() {
    const trecho = this.comentario ? `: "${this.comentario.slice(0, 80)}${this.comentario.length > 80 ? '…' : ''}"` : '';
    return `avaliação de ${this.nota} estrela${this.nota > 1 ? 's' : ''}${trecho}`;
  }

  // Polimorfismo: remover uma avaliação significa apagá-la (não aparece mais e não conta na média)
  remover() { this.removida = true; }

  static validar({ nota, comentario }) {
    const erros = [];
    const n = Number(nota);
    if (!Number.isInteger(n) || n < NOTA_MIN || n > NOTA_MAX) erros.push('Escolha uma nota de 1 a 5 estrelas.');
    if (comentario && String(comentario).length > TAMANHO_COMENTARIO) {
      erros.push(`O comentário deve ter no máximo ${TAMANHO_COMENTARIO} caracteres.`);
    }
    return erros;
  }

  toJSON() {
    return {
      id: this.id,
      pontoId: this.pontoId,
      ...(this.pontoNome && { pontoNome: this.pontoNome }),
      nota: this.nota,
      comentario: this.comentario,
      dataHora: this.dataHora,
      ...(this.motoristaNome && { motorista: this.motoristaNome.split(' ')[0] }),
    };
  }
}

module.exports = Avaliacao;
