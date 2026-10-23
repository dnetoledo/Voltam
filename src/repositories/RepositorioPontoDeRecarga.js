// RepositorioPontoDeRecarga – padrão GRASP Pure Fabrication
// Nenhum PontoDeRecarga isolado conhece os demais; o repositório consulta todos no banco.
const db = require('../config/db');
const PontoDeRecarga = require('../models/PontoDeRecarga');

const KM_POR_GRAU_LAT = 111.32;

// RF08 – cada ponto vem com a nota média e o total de avaliações (avaliações removidas não contam)
const COM_AVALIACOES = `SELECT p.*, a.nota_media, a.total_avaliacoes FROM ponto_de_recarga p
  LEFT JOIN (SELECT ponto_id, AVG(nota) AS nota_media, COUNT(*) AS total_avaliacoes
             FROM avaliacao WHERE NOT removida GROUP BY ponto_id) a ON a.ponto_id = p.id`;

// Retângulo que envolve o círculo de busca (filtro rápido feito pelo índice do banco)
function areaDeBusca(lat, lng, raioKm) {
  const dLat = raioKm / KM_POR_GRAU_LAT;
  const dLng = raioKm / (KM_POR_GRAU_LAT * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
  return { latMin: lat - dLat, latMax: lat + dLat, lngMin: lng - dLng, lngMax: lng + dLng };
}

module.exports = {
  async buscarProximos({ latitude, longitude }, raioKm, filtros = {}) {
    const a = areaDeBusca(latitude, longitude, raioKm);
    const cond = ['p.latitude BETWEEN $1 AND $2', 'p.longitude BETWEEN $3 AND $4', "p.status <> 'SUSPENSO'"];
    const params = [a.latMin, a.latMax, a.lngMin, a.lngMax];

    if (filtros.conectores?.length) {
      params.push(filtros.conectores);
      cond.push(`p.tipos_conector && $${params.length}::text[]`);
    }
    if (filtros.potenciaMin) {
      params.push(filtros.potenciaMin);
      cond.push(`p.potencia_kw >= $${params.length}`);
    }

    const { rows } = await db.query(`${COM_AVALIACOES} WHERE ${cond.join(' AND ')}`, params);
    return rows.map((r) => new PontoDeRecarga(r));
  },

  async buscarPorId(id) {
    const { rows } = await db.query(`${COM_AVALIACOES} WHERE p.id = $1 AND p.status <> 'SUSPENSO'`, [id]);
    return rows[0] ? new PontoDeRecarga(rows[0]) : null;
  },

  // Moderação (UC05): o administrador também enxerga pontos suspensos
  async buscarPorIdIncluindoSuspensos(id) {
    const { rows } = await db.query(`${COM_AVALIACOES} WHERE p.id = $1`, [id]);
    return rows[0] ? new PontoDeRecarga(rows[0]) : null;
  },

  async listarSuspensos() {
    const { rows } = await db.query(`${COM_AVALIACOES} WHERE p.status = 'SUSPENSO' ORDER BY p.status_atualizado_em DESC NULLS LAST`);
    return rows.map((r) => new PontoDeRecarga(r));
  },

  // Fluxo alternativo A1 do UC03: já existe ponto a menos de "raioMetros"?
  async existePontoProximo({ latitude, longitude }, raioMetros = 50) {
    const candidatos = await this.buscarProximos({ latitude, longitude }, raioMetros / 1000);
    return candidatos.some((p) => p.calcularDistancia(latitude, longitude) * 1000 <= raioMetros);
  },

  async buscarPorMotorista(motoristaId) {
    const { rows } = await db.query(
      `${COM_AVALIACOES} WHERE p.motorista_id = $1 AND p.status <> 'SUSPENSO' ORDER BY p.data_cadastro DESC`,
      [motoristaId],
    );
    return rows.map((r) => new PontoDeRecarga(r));
  },

  async atualizarStatus(ponto) {
    await db.query(
      'UPDATE ponto_de_recarga SET status = $1, status_atualizado_em = NOW() WHERE id = $2',
      [ponto.status, ponto.id],
    );
  },

  async salvar(ponto) {
    const { rows } = await db.query(
      `INSERT INTO ponto_de_recarga
        (nome, endereco, latitude, longitude, tipos_conector, potencia_kw,
         numero_vagas, horario_funcionamento, status, motorista_id)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [ponto.nome, ponto.endereco, ponto.latitude, ponto.longitude, ponto.tiposConector,
        ponto.potenciaKw, ponto.numeroVagas, ponto.horarioFuncionamento, ponto.status, ponto.motoristaId],
    );
    return new PontoDeRecarga(rows[0]);
  },
};
