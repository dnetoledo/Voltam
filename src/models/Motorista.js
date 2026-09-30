// Entidade Motorista (especialização de Usuario)
// Creator: o Motorista cria os objetos PontoDeRecarga (associação "cadastra") e CheckIn (associação "realiza").
const Usuario = require('./Usuario');
const PontoDeRecarga = require('./PontoDeRecarga');
const CheckIn = require('./CheckIn');

class Motorista extends Usuario {
  criarPontoDeRecarga(dados) {
    return new PontoDeRecarga({
      ...dados,
      status: PontoDeRecarga.STATUS.NAO_VERIFICADO,
      motorista_id: this.id,
    });
  }

  realizarCheckIn(ponto, { status, comentario, carregando = false }) {
    return new CheckIn({
      ponto_id: ponto.id,
      motorista_id: this.id,
      status_informado: status,
      comentario: comentario ? String(comentario).trim() : null,
      carregando,
    });
  }
}

module.exports = Motorista;
