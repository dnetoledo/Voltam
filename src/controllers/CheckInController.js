// CheckInController – padrão GRASP Controller (UC04 – Fazer Check-in / Atualizar Status do Ponto)
// Também controla a "recarga ativa": um check-in em que o motorista informa que está carregando no ponto.
const CheckIn = require('../models/CheckIn');
const Motorista = require('../models/Motorista');
const repositorioPonto = require('../repositories/RepositorioPontoDeRecarga');
const repositorioUsuario = require('../repositories/RepositorioUsuario');
const repositorioCheckIn = require('../repositories/RepositorioCheckIn');
const repositorioPagamento = require('../repositories/RepositorioFormaPagamento');

// Código Pix de DEMONSTRAÇÃO (não pagável): identifica a recarga e o valor
function codigoPixDemonstracao(recargaId, valor) {
  const v = valor.toFixed(2);
  return `00020126360014BR.GOV.BCB.PIX0114VOLTMAP-DEMO52040000530398654${String(v.length).padStart(2, '0')}${v}5802BR5907VOLTMAP6009SAO PAULO62${String(`RECARGA${recargaId}`.length + 4).padStart(2, '0')}05${String(`RECARGA${recargaId}`.length).padStart(2, '0')}RECARGA${recargaId}6304DEMO`;
}

async function motoristaLogado(req, res) {
  const motorista = await repositorioUsuario.buscarPorId(req.usuario.id);
  if (!(motorista instanceof Motorista)) {
    res.status(403).json({ erro: 'Somente motoristas podem fazer check-in.' });
    return null;
  }
  return motorista;
}

async function pontoDaRota(req, res, id = req.params.id) {
  const ponto = await repositorioPonto.buscarPorId(Number(id));
  if (!ponto) res.status(404).json({ erro: 'Ponto de recarga não encontrado.' });
  return ponto;
}

// Fluxo comum: Motorista cria o CheckIn (Creator) e o ponto atualiza o próprio status (Information Expert)
async function registrar(motorista, ponto, dados) {
  const checkIn = motorista.realizarCheckIn(ponto, dados);
  const precisaVerificacao = ponto.atualizarStatus(checkIn);
  const salvo = await repositorioCheckIn.salvar(checkIn);
  await repositorioPonto.atualizarStatus(ponto);
  return { checkIn: salvo, ponto, precisaVerificacao };
}

module.exports = {
  // POST /api/pontos/:id/checkins
  async registrarCheckIn(req, res) {
    const erros = CheckIn.validar(req.body || {});
    if (erros.length) return res.status(400).json({ erro: erros.join(' '), erros });
    const motorista = await motoristaLogado(req, res); if (!motorista) return undefined;
    const ponto = await pontoDaRota(req, res); if (!ponto) return undefined;

    const r = await registrar(motorista, ponto, { status: req.body.status, comentario: req.body.comentario });
    return res.status(201).json({
      checkIn: r.checkIn,
      ponto: r.ponto,
      // A1 – ponto com defeito: fica "fora de serviço" e sinalizado para verificação
      ...(r.precisaVerificacao && { aviso: 'Obrigado! O ponto foi marcado como fora de serviço e sinalizado para verificação.' }),
    });
  },

  // GET /api/pontos/:id/checkins
  async listarCheckIns(req, res) {
    const ponto = await pontoDaRota(req, res); if (!ponto) return undefined;
    return res.json(await repositorioCheckIn.listarPorPonto(ponto.id, 5));
  },

  // POST /api/recargas  { pontoId }
  async iniciarRecarga(req, res) {
    const motorista = await motoristaLogado(req, res); if (!motorista) return undefined;
    const ativa = await repositorioCheckIn.buscarRecargaAtiva(motorista.id);
    if (ativa) {
      return res.status(409).json({ erro: `Você já tem uma recarga ativa em ${ativa.pontoNome}. Encerre-a antes de iniciar outra.`, recarga: ativa });
    }
    const ponto = await pontoDaRota(req, res, req.body?.pontoId); if (!ponto) return undefined;
    if (ponto.statusVigente() === 'FORA_DE_SERVICO') {
      return res.status(409).json({ erro: 'Este ponto está fora de serviço.' });
    }
    // Forma de pagamento escolhida (MODO DEMONSTRAÇÃO – nenhuma cobrança é realizada)
    const pagamento = req.body?.pagamento || {};
    let formaPagamento;
    if (pagamento.tipo === 'PIX') {
      formaPagamento = 'Pix';
    } else if (pagamento.tipo === 'CARTAO') {
      const cartao = await repositorioPagamento.buscar(motorista.id, Number(pagamento.cartaoId));
      if (!cartao) return res.status(400).json({ erro: 'Cartão não encontrado. Escolha outra forma de pagamento.' });
      formaPagamento = cartao.descricao();
    } else {
      return res.status(400).json({ erro: 'Escolha a forma de pagamento: Pix ou cartão de crédito.' });
    }
    const r = await registrar(motorista, ponto, { status: 'OCUPADO', comentario: 'Recarga iniciada', carregando: true, formaPagamento });
    r.checkIn.pontoNome = ponto.nome;
    return res.status(201).json({ recarga: r.checkIn, ponto: r.ponto });
  },

  // GET /api/recargas (histórico do motorista)
  async historicoRecargas(req, res) {
    return res.json(await repositorioCheckIn.listarRecargas(req.usuario.id, 10));
  },

  // GET /api/recargas/ativa
  async recargaAtiva(req, res) {
    return res.json({ recarga: await repositorioCheckIn.buscarRecargaAtiva(req.usuario.id) });
  },

  // POST /api/recargas/ativa/encerrar
  async encerrarRecarga(req, res) {
    const motorista = await motoristaLogado(req, res); if (!motorista) return undefined;
    const ativa = await repositorioCheckIn.buscarRecargaAtiva(motorista.id);
    if (!ativa) return res.status(404).json({ erro: 'Você não tem recarga ativa.' });
    const ponto = await repositorioPonto.buscarPorId(ativa.pontoId);
    // Information Expert: a própria recarga calcula duração, energia e valor estimados
    const consumo = ativa.calcularConsumo(ponto ? ponto.potenciaKw : 7.4);
    await repositorioCheckIn.encerrar(ativa.id, consumo);
    if (ponto) await registrar(motorista, ponto, { status: 'DISPONIVEL', comentario: 'Recarga encerrada – vaga liberada' });
    const pix = ativa.formaPagamento === 'Pix';
    return res.json({
      mensagem: `Recarga encerrada após ${consumo.minutos} min. A vaga foi liberada.`,
      resumo: {
        ponto: ativa.pontoNome,
        ...consumo,
        formaPagamento: ativa.formaPagamento,
        situacao: pix ? 'Pix gerado (simulação)' : 'Pagamento aprovado (simulação)',
        ...(pix && { pixCopiaECola: codigoPixDemonstracao(ativa.id, consumo.valor) }),
        demonstracao: true,
      },
      minutos: consumo.minutos,
    });
  },
};
