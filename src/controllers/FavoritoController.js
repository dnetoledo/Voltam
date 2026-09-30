// FavoritoController – padrão GRASP Controller (RF09 – Favoritar pontos de recarga)
const repositorioFavorito = require('../repositories/RepositorioFavorito');
const repositorioPonto = require('../repositories/RepositorioPontoDeRecarga');

module.exports = {
  // GET /api/favoritos
  async listar(req, res) {
    return res.json(await repositorioFavorito.listar(req.usuario.id));
  },

  // PUT /api/favoritos/:pontoId
  async adicionar(req, res) {
    const ponto = await repositorioPonto.buscarPorId(Number(req.params.pontoId));
    if (!ponto) return res.status(404).json({ erro: 'Ponto de recarga não encontrado.' });
    await repositorioFavorito.adicionar(req.usuario.id, ponto.id);
    return res.json({ favorito: true });
  },

  // DELETE /api/favoritos/:pontoId
  async remover(req, res) {
    await repositorioFavorito.remover(req.usuario.id, Number(req.params.pontoId));
    return res.json({ favorito: false });
  },

  // GET /api/favoritos/:pontoId
  async verificar(req, res) {
    return res.json({ favorito: await repositorioFavorito.ehFavorito(req.usuario.id, Number(req.params.pontoId)) });
  },
};
