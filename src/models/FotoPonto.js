// Entidade FotoPonto (RF05 – fotos do ponto de recarga)
// Especialização de ConteudoModeravel: uma foto imprópria pode ser denunciada e removida.
const ConteudoModeravel = require('./ConteudoModeravel');

const TIPOS = ['image/jpeg', 'image/png', 'image/webp'];
const TAMANHO_MAXIMO = 2 * 1024 * 1024; // 2 MB (a tela reduz a foto antes de enviar)
const FOTOS_POR_PONTO = 10;

class FotoPonto extends ConteudoModeravel {
  constructor({ id, ponto_id, motorista_id, tipo_mime, imagem, data_envio, removida, motorista_nome }) {
    super();
    this.id = id;
    this.pontoId = ponto_id;
    this.motoristaId = motorista_id;
    this.tipoMime = tipo_mime;
    this.imagem = imagem || null; // Buffer
    this.dataEnvio = data_envio ? new Date(data_envio) : new Date();
    this.removida = Boolean(removida);
    this.motoristaNome = motorista_nome;
  }

  get tipoConteudo() { return 'FOTO'; }

  descricao() { return 'foto enviada para o ponto de recarga'; }

  // Polimorfismo: remover uma foto significa ocultá-la do ponto
  remover() { this.removida = true; }

  // Converte "data:image/jpeg;base64,..." em { tipoMime, imagem } validando tipo e tamanho
  static decodificar(dataUrl) {
    const m = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/=]+)$/.exec(String(dataUrl || ''));
    if (!m) return { erro: 'Envie uma imagem JPEG, PNG ou WebP.' };
    const imagem = Buffer.from(m[2], 'base64');
    if (imagem.length === 0) return { erro: 'A imagem está vazia.' };
    if (imagem.length > TAMANHO_MAXIMO) return { erro: 'A foto deve ter no máximo 2 MB.' };
    return { tipoMime: m[1], imagem };
  }

  toJSON() {
    return {
      id: this.id,
      pontoId: this.pontoId,
      url: `/api/fotos/${this.id}`,
      dataEnvio: this.dataEnvio,
      ...(this.motoristaNome && { motorista: this.motoristaNome.split(' ')[0] }),
    };
  }
}

FotoPonto.TIPOS = TIPOS;
FotoPonto.TAMANHO_MAXIMO = TAMANHO_MAXIMO;
FotoPonto.FOTOS_POR_PONTO = FOTOS_POR_PONTO;
module.exports = FotoPonto;
