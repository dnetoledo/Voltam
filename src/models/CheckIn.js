// Entidade CheckIn (Modelo de Domínio – Seção 9)
// Registra o status informado por um motorista; vale por 2 horas (RNF de confiabilidade dos dados).
const VALIDADE_HORAS = 2;
const STATUS_PERMITIDOS = ['DISPONIVEL', 'OCUPADO', 'FORA_DE_SERVICO'];

class CheckIn {
  constructor({ id, ponto_id, motorista_id, status_informado, comentario, carregando, data_hora, validade,
    encerrado_em, motorista_nome, ponto_nome }) {
    this.id = id;
    this.pontoId = ponto_id;
    this.motoristaId = motorista_id;
    this.statusInformado = status_informado;
    this.comentario = comentario || null;
    this.carregando = Boolean(carregando);
    this.dataHora = data_hora ? new Date(data_hora) : new Date();
    this.validade = validade ? new Date(validade)
      : new Date(this.dataHora.getTime() + VALIDADE_HORAS * 3600 * 1000);
    this.encerradoEm = encerrado_em ? new Date(encerrado_em) : null;
    this.motoristaNome = motorista_nome;
    this.pontoNome = ponto_nome;
  }

  estaValido(agora = new Date()) {
    return !this.encerradoEm && agora < this.validade;
  }

  static validar({ status, comentario }) {
    const erros = [];
    if (!STATUS_PERMITIDOS.includes(status)) erros.push('Informe o status: disponível, ocupado ou fora de serviço.');
    if (comentario && String(comentario).length > 280) erros.push('O comentário deve ter no máximo 280 caracteres.');
    return erros;
  }

  toJSON() {
    return {
      id: this.id,
      pontoId: this.pontoId,
      ...(this.pontoNome && { pontoNome: this.pontoNome }),
      status: this.statusInformado,
      comentario: this.comentario,
      carregando: this.carregando,
      dataHora: this.dataHora,
      validade: this.validade,
      encerradoEm: this.encerradoEm,
      ativo: this.estaValido(),
      ...(this.motoristaNome && { motorista: this.motoristaNome.split(' ')[0] }),
    };
  }
}

CheckIn.VALIDADE_HORAS = VALIDADE_HORAS;
module.exports = CheckIn;
