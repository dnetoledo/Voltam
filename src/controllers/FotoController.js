// FotoController – padrão GRASP Controller (RF05 – fotos do ponto de recarga)
const FotoPonto = require('../models/FotoPonto');
const Motorista = require('../models/Motorista');
const repositorioPonto = require('../repositories/RepositorioPontoDeRecarga');
const repositorioFoto = require('../repositories/RepositorioFotoPonto');

module.exports = {
  // GET /api/pontos/:id/fotos
  async listar(req, res) {
    const ponto = await repositorioPonto.buscarPorId(Number(req.params.id));
    if (!ponto) return res.status(404).json({ erro: 'Ponto de recarga não encontrado.' });
    return res.json(await repositorioFoto.listarPorPonto(ponto.id));
  },

  // POST /api/pontos/:id/fotos  { imagem: "data:image/jpeg;base64,..." }  (rota autenticada)
  async enviar(req, res) {
    const motorista = req.usuarioObj;
    if (!(motorista instanceof Motorista)) return res.status(403).json({ erro: 'Somente motoristas podem enviar fotos.' });
    const ponto = await repositorioPonto.buscarPorId(Number(req.params.id));
    if (!ponto) return res.status(404).json({ erro: 'Ponto de recarga não encontrado.' });

    const dados = FotoPonto.decodificar(req.body?.imagem);
    if (dados.erro) return res.status(400).json({ erro: dados.erro });
    if (await repositorioFoto.contarPorPonto(ponto.id) >= FotoPonto.FOTOS_POR_PONTO) {
      return res.status(409).json({ erro: `Este ponto já tem ${FotoPonto.FOTOS_POR_PONTO} fotos.` });
    }
    // Creator: o Motorista envia a FotoPonto
    const foto = await repositorioFoto.salvar(motorista.enviarFoto(ponto, dados));
    return res.status(201).json(foto);
  },

  // GET /api/fotos/:id  (imagem)
  async imagem(req, res) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) return res.status(400).json({ erro: 'Identificador inválido.' });
    const foto = await repositorioFoto.buscarImagem(id);
    if (!foto) return res.status(404).json({ erro: 'Foto não encontrada.' });
    res.set('Content-Type', foto.tipoMime);
    res.set('Cache-Control', 'public, max-age=3600');
    return res.send(foto.imagem);
  },
};
