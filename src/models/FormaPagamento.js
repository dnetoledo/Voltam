// Entidade FormaPagamento – cartão salvo pelo motorista (MODO DEMONSTRAÇÃO: nenhuma cobrança é feita)
// Segurança: o VoltMap nunca recebe nem guarda o número completo do cartão nem o código de segurança (CVV).
const BANDEIRAS = ['Visa', 'Mastercard', 'Elo', 'American Express', 'Hipercard'];

class FormaPagamento {
  constructor({ id, motorista_id, bandeira, final_cartao, validade, titular, padrao, criado_em }) {
    Object.assign(this, { id, motoristaId: motorista_id, bandeira, finalCartao: final_cartao, validade, titular, padrao: Boolean(padrao), criadoEm: criado_em });
  }

  descricao() {
    return `${this.bandeira} •••• ${this.finalCartao}`;
  }

  static validar(d, agora = new Date()) {
    const erros = [];
    // Proteção: recusa qualquer campo que pareça um número de cartão completo
    const texto = JSON.stringify(d || {});
    if (d?.numero || d?.cvv || /\d{8,}/.test(texto.replace(/\s/g, ''))) {
      erros.push('Por segurança, envie apenas a bandeira e os 4 últimos dígitos do cartão.');
      return erros;
    }
    if (!BANDEIRAS.includes(d?.bandeira)) erros.push('Bandeira do cartão não reconhecida.');
    if (!/^\d{4}$/.test(d?.final || '')) erros.push('Informe os 4 últimos dígitos do cartão.');
    const m = /^(0[1-9]|1[0-2])\/(\d{2})$/.exec(d?.validade || '');
    if (!m) erros.push('Validade no formato MM/AA.');
    else if (new Date(2000 + Number(m[2]), Number(m[1]), 0, 23, 59) < agora) erros.push('Cartão vencido.');
    if (!d?.titular || String(d.titular).trim().length < 3) erros.push('Informe o nome impresso no cartão.');
    return erros;
  }

  toJSON() {
    return { id: this.id, bandeira: this.bandeira, final: this.finalCartao, validade: this.validade,
      titular: this.titular, padrao: this.padrao, descricao: this.descricao() };
  }
}

FormaPagamento.BANDEIRAS = BANDEIRAS;
module.exports = FormaPagamento;
