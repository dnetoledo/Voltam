// Entidade Motorista (especialização de Usuario)
// Creator: o Motorista cria os objetos PontoDeRecarga (associação "cadastra").
const Usuario = require('./Usuario');
const PontoDeRecarga = require('./PontoDeRecarga');

class Motorista extends Usuario {
  criarPontoDeRecarga(dados) {
    return new PontoDeRecarga({
      ...dados,
      status: PontoDeRecarga.STATUS.NAO_VERIFICADO,
      motorista_id: this.id,
    });
  }
}

module.exports = Motorista;
