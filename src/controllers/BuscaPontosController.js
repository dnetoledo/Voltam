// BuscaPontosController – padrão GRASP Controller (UC02 – Buscar Pontos de Recarga Próximos)
const repositorioPonto = require('../repositories/RepositorioPontoDeRecarga');

const RAIO_PADRAO_KM = 10;
const RAIO_MAXIMO_KM = 50;

function lista(valor) {
  if (!valor) return [];
  return String(valor).split(',').map((v) => v.trim()).filter(Boolean);
}

module.exports = {
  // GET /api/pontos?lat=&lng=&raio=&conectores=&potenciaMin=&status=
  async buscarPontosProximos(req, res) {
    const lat = Number(req.query.lat);
    const lng = Number(req.query.lng);
    if (req.query.lat === undefined || req.query.lng === undefined || Number.isNaN(lat) || Number.isNaN(lng)) {
      return res.status(400).json({ erro: 'Informe a localização (lat e lng).' });
    }
    const raio = Math.min(Number(req.query.raio) || RAIO_PADRAO_KM, RAIO_MAXIMO_KM);
    const filtros = {
      conectores: lista(req.query.conectores),
      potenciaMin: Number(req.query.potenciaMin) || 0,
      status: lista(req.query.status),
    };

    const candidatos = await repositorioPonto.buscarProximos({ latitude: lat, longitude: lng }, raio, filtros);

    // Information Expert: cada ponto calcula a própria distância
    const pontos = candidatos
      .map((p) => Object.assign(p, { distanciaKm: p.calcularDistancia(lat, lng) }))
      .filter((p) => p.distanciaKm <= raio)
      .sort((a, b) => a.distanciaKm - b.distanciaKm);

    return res.json({
      raioKm: raio,
      total: pontos.length,
      pontos,
      // A1 – nenhum ponto encontrado: sugerir aumentar o raio
      ...(pontos.length === 0 && raio < RAIO_MAXIMO_KM && {
        sugestao: `Nenhum ponto encontrado em ${raio} km. Tente aumentar o raio de busca.`,
      }),
    });
  },

  // RF05 – GET /api/pontos/:id
  async obterDetalhesPonto(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ erro: 'Identificador inválido.' });
    const ponto = await repositorioPonto.buscarPorId(id);
    if (!ponto) return res.status(404).json({ erro: 'Ponto de recarga não encontrado.' });
    return res.json(ponto);
  },
};
