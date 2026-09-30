// Entidade PontoDeRecarga (Modelo de Domínio – Seção 9)
// Information Expert: calcula a distância até uma localização, pois detém latitude e longitude.

const STATUS = Object.freeze({
  NAO_VERIFICADO: 'NAO_VERIFICADO',
  DISPONIVEL: 'DISPONIVEL',
  OCUPADO: 'OCUPADO',
  FORA_DE_SERVICO: 'FORA_DE_SERVICO',
  SUSPENSO: 'SUSPENSO',
});

const CONECTORES = Object.freeze(['Tipo 1', 'Tipo 2', 'CCS Combo', 'CHAdeMO', 'GB/T']);

class PontoDeRecarga {
  constructor({ id, nome, endereco, latitude, longitude, tipos_conector, potencia_kw,
    numero_vagas, horario_funcionamento, status, motorista_id, data_cadastro }) {
    this.id = id;
    this.nome = nome;
    this.endereco = endereco || null;
    this.latitude = Number(latitude);
    this.longitude = Number(longitude);
    this.tiposConector = tipos_conector || [];
    this.potenciaKw = Number(potencia_kw);
    this.numeroVagas = Number(numero_vagas || 1);
    this.horarioFuncionamento = horario_funcionamento || null;
    this.status = status || STATUS.NAO_VERIFICADO;
    this.motoristaId = motorista_id || null;
    this.dataCadastro = data_cadastro || null;
  }

  // Distância em km pela fórmula de Haversine
  calcularDistancia(lat, lng) {
    const R = 6371;
    const rad = (g) => (g * Math.PI) / 180;
    const dLat = rad(lat - this.latitude);
    const dLng = rad(lng - this.longitude);
    const a = Math.sin(dLat / 2) ** 2
      + Math.cos(rad(this.latitude)) * Math.cos(rad(lat)) * Math.sin(dLng / 2) ** 2;
    return 2 * R * Math.asin(Math.sqrt(a));
  }

  // Validação dos dados obrigatórios (passo 5 do UC03)
  static validar(d) {
    const erros = [];
    if (!d.nome || String(d.nome).trim().length < 3) erros.push('Informe o nome do local (mínimo 3 caracteres).');
    const lat = Number(d.latitude); const lng = Number(d.longitude);
    if (d.latitude === undefined || d.latitude === '' || Number.isNaN(lat) || lat < -90 || lat > 90) erros.push('Latitude inválida.');
    if (d.longitude === undefined || d.longitude === '' || Number.isNaN(lng) || lng < -180 || lng > 180) erros.push('Longitude inválida.');
    if (!Array.isArray(d.tipos_conector) || d.tipos_conector.length === 0) {
      erros.push('Selecione ao menos um tipo de conector.');
    } else if (d.tipos_conector.some((c) => !CONECTORES.includes(c))) {
      erros.push('Tipo de conector inválido.');
    }
    const pot = Number(d.potencia_kw);
    if (!pot || pot <= 0 || pot > 1000) erros.push('Informe a potência em kW (maior que zero).');
    if (d.numero_vagas !== undefined && d.numero_vagas !== '' && !(Number(d.numero_vagas) >= 1)) erros.push('Número de vagas inválido.');
    return erros;
  }

  toJSON() {
    return {
      id: this.id,
      nome: this.nome,
      endereco: this.endereco,
      latitude: this.latitude,
      longitude: this.longitude,
      tiposConector: this.tiposConector,
      potenciaKw: this.potenciaKw,
      numeroVagas: this.numeroVagas,
      horarioFuncionamento: this.horarioFuncionamento,
      status: this.status,
      dataCadastro: this.dataCadastro,
      ...(this.distanciaKm !== undefined && { distanciaKm: Math.round(this.distanciaKm * 100) / 100 }),
    };
  }
}

PontoDeRecarga.STATUS = STATUS;
PontoDeRecarga.CONECTORES = CONECTORES;

module.exports = PontoDeRecarga;
