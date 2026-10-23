// Entidade Denuncia (RF10 – denunciar; UC05 – Moderar Denúncias)
// Refere-se a um ConteudoModeravel (ponto, avaliação ou foto) e guarda a decisão do administrador.
const MOTIVOS = Object.freeze({
  INFORMACAO_INCORRETA: 'Informação incorreta',
  AVALIACAO_INADEQUADA: 'Avaliação ofensiva ou inadequada',
  PONTO_INEXISTENTE: 'Ponto inexistente',
  CONTEUDO_IMPROPRIO: 'Spam / conteúdo impróprio',
  OUTRO: 'Outro',
});
const TIPOS_CONTEUDO = ['PONTO', 'AVALIACAO', 'FOTO'];
const STATUS = Object.freeze({ PENDENTE: 'PENDENTE', RESOLVIDA: 'RESOLVIDA', ARQUIVADA: 'ARQUIVADA' });
const ACOES = Object.freeze({
  REMOVER_CONTEUDO: 'REMOVER_CONTEUDO',
  SUSPENDER_PONTO: 'SUSPENDER_PONTO',
  ARQUIVAR: 'ARQUIVAR',
});

class Denuncia {
  constructor({ id, denunciante_id, conteudo_tipo, conteudo_id, motivo, descricao, status, acao_tomada,
    administrador_id, data_hora, resolvida_em, denunciante_nome, total_denuncias }) {
    this.id = id;
    this.denuncianteId = denunciante_id;
    this.conteudoTipo = conteudo_tipo;
    this.conteudoId = conteudo_id;
    this.motivo = motivo;
    this.descricao = descricao || null;
    this.status = status || STATUS.PENDENTE;
    this.acaoTomada = acao_tomada || null;
    this.administradorId = administrador_id || null;
    this.dataHora = data_hora ? new Date(data_hora) : new Date();
    this.resolvidaEm = resolvida_em ? new Date(resolvida_em) : null;
    this.denuncianteNome = denunciante_nome;
    this.totalDenuncias = total_denuncias != null ? Number(total_denuncias) : undefined;
    this.conteudo = null; // ConteudoModeravel carregado pelo repositório
  }

  estaPendente() { return this.status === STATUS.PENDENTE; }

  // Decisão do administrador: remover conteúdo ou suspender ponto
  resolver(acao, administradorId) {
    if (!this.estaPendente()) throw new Error('Esta denúncia já foi analisada.');
    this.status = STATUS.RESOLVIDA;
    this.acaoTomada = acao;
    this.administradorId = administradorId;
    this.resolvidaEm = new Date();
  }

  // Decisão do administrador: arquivar sem ação
  arquivar(administradorId) {
    if (!this.estaPendente()) throw new Error('Esta denúncia já foi analisada.');
    this.status = STATUS.ARQUIVADA;
    this.acaoTomada = ACOES.ARQUIVAR;
    this.administradorId = administradorId;
    this.resolvidaEm = new Date();
  }

  static validar({ tipo, conteudoId, motivo, descricao }) {
    const erros = [];
    if (!TIPOS_CONTEUDO.includes(tipo)) erros.push('Conteúdo denunciado inválido.');
    if (!(Number(conteudoId) > 0)) erros.push('Conteúdo denunciado inválido.');
    if (!MOTIVOS[motivo]) erros.push('Escolha o motivo da denúncia.');
    if (motivo === 'OUTRO' && !String(descricao || '').trim()) erros.push('Descreva o problema.');
    if (descricao && String(descricao).length > 500) erros.push('A descrição deve ter no máximo 500 caracteres.');
    return erros;
  }

  toJSON() {
    return {
      id: this.id,
      tipo: this.conteudoTipo,
      conteudoId: this.conteudoId,
      motivo: this.motivo,
      motivoTexto: MOTIVOS[this.motivo] || this.motivo,
      descricao: this.descricao,
      status: this.status,
      acaoTomada: this.acaoTomada,
      dataHora: this.dataHora,
      resolvidaEm: this.resolvidaEm,
      ...(this.denuncianteNome && { denunciante: this.denuncianteNome.split(' ')[0] }),
      ...(this.totalDenuncias !== undefined && { totalDenuncias: this.totalDenuncias }),
    };
  }
}

Denuncia.MOTIVOS = MOTIVOS;
Denuncia.TIPOS_CONTEUDO = TIPOS_CONTEUDO;
Denuncia.STATUS = STATUS;
Denuncia.ACOES = ACOES;
module.exports = Denuncia;
