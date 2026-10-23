// AvaliacaoController – padrão GRASP Controller (RF08 – Avaliar ponto de recarga)
const Avaliacao = require('../models/Avaliacao');
const Motorista = require('../models/Motorista');
const repositorioPonto = require('../repositories/RepositorioPontoDeRecarga');
const repositorioAvaliacao = require('../repositories/RepositorioAvaliacao');

module.exports = {
  // GET /api/pontos/:id/avaliacoes
  async listar(req, res) {
    const ponto = await repositorioPonto.buscarPorId(Number(req.params.id));
    if (!ponto) return res.status(404).json({ erro: 'Ponto de recarga não encontrado.' });
    const avaliacoes = await repositorioAvaliacao.listarPorPonto(ponto.id);
    return res.json({ notaMedia: ponto.notaMedia, total: ponto.totalAvaliacoes, avaliacoes });
  },

  // GET /api/pontos/:id/avaliacoes/minha  (rota autenticada)
  async minha(req, res) {
    return res.json({ avaliacao: await repositorioAvaliacao.buscarDoMotorista(Number(req.params.id), req.usuario.id) });
  },

  // POST /api/pontos/:id/avaliacoes  { nota, comentario }  (rota autenticada)
  async avaliar(req, res) {
    const erros = Avaliacao.validar(req.body || {});
    if (erros.length) return res.status(400).json({ erro: erros.join(' '), erros });
    const motorista = req.usuarioObj;
    if (!(motorista instanceof Motorista)) return res.status(403).json({ erro: 'Somente motoristas podem avaliar pontos.' });
    const ponto = await repositorioPonto.buscarPorId(Number(req.params.id));
    if (!ponto) return res.status(404).json({ erro: 'Ponto de recarga não encontrado.' });

    // Creator: o Motorista escreve a Avaliacao
    const avaliacao = motorista.escreverAvaliacao(ponto, req.body);
    const salva = await repositorioAvaliacao.salvar(avaliacao);
    const atualizado = await repositorioPonto.buscarPorId(ponto.id);
    return res.status(201).json({ avaliacao: salva, notaMedia: atualizado.notaMedia, total: atualizado.totalAvaliacoes });
  },
};
