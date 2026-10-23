// Entidade Motorista (especialização de Usuario)
// Creator: o Motorista cria os objetos PontoDeRecarga ("cadastra"), CheckIn ("realiza"),
// Avaliacao ("escreve"), FotoPonto ("envia") e Denuncia ("registra").
const Usuario = require('./Usuario');
const PontoDeRecarga = require('./PontoDeRecarga');
const CheckIn = require('./CheckIn');
const Avaliacao = require('./Avaliacao');
const FotoPonto = require('./FotoPonto');
const Denuncia = require('./Denuncia');

class Motorista extends Usuario {
  criarPontoDeRecarga(dados) {
    return new PontoDeRecarga({
      ...dados,
      status: PontoDeRecarga.STATUS.NAO_VERIFICADO,
      motorista_id: this.id,
    });
  }

  realizarCheckIn(ponto, { status, comentario, carregando = false, formaPagamento = null }) {
    return new CheckIn({
      ponto_id: ponto.id,
      motorista_id: this.id,
      status_informado: status,
      comentario: comentario ? String(comentario).trim() : null,
      carregando,
      forma_pagamento: formaPagamento,
    });
  }

  // RF08 – escreve uma avaliação sobre o ponto
  escreverAvaliacao(ponto, { nota, comentario }) {
    return new Avaliacao({
      ponto_id: ponto.id,
      motorista_id: this.id,
      nota: Number(nota),
      comentario: comentario ? String(comentario).trim() : null,
    });
  }

  // RF05 – envia uma foto do ponto
  enviarFoto(ponto, { tipoMime, imagem }) {
    return new FotoPonto({ ponto_id: ponto.id, motorista_id: this.id, tipo_mime: tipoMime, imagem });
  }

  // RF10 – registra uma denúncia sobre um ConteudoModeravel
  registrarDenuncia(conteudo, { motivo, descricao }) {
    if (conteudo.autorId === this.id && conteudo.tipoConteudo !== 'PONTO') {
      throw new Error('Você não pode denunciar um conteúdo que você mesmo enviou.');
    }
    return new Denuncia({
      denunciante_id: this.id,
      conteudo_tipo: conteudo.tipoConteudo,
      conteudo_id: conteudo.id,
      motivo,
      descricao: descricao ? String(descricao).trim() : null,
    });
  }
}

module.exports = Motorista;
