// PagamentoController – padrão GRASP Controller (formas de pagamento da recarga – MODO DEMONSTRAÇÃO)
const FormaPagamento = require('../models/FormaPagamento');
const repositorio = require('../repositories/RepositorioFormaPagamento');

module.exports = {
  // GET /api/pagamentos/cartoes
  async listar(req, res) {
    return res.json(await repositorio.listar(req.usuario.id));
  },

  // POST /api/pagamentos/cartoes  { bandeira, final, validade, titular }
  async adicionar(req, res) {
    const erros = FormaPagamento.validar(req.body);
    if (erros.length) return res.status(400).json({ erro: erros.join(' '), erros });
    return res.status(201).json(await repositorio.salvar(req.usuario.id, req.body));
  },

  // PUT /api/pagamentos/cartoes/:id/padrao
  async definirPadrao(req, res) {
    const cartao = await repositorio.buscar(req.usuario.id, Number(req.params.id));
    if (!cartao) return res.status(404).json({ erro: 'Cartão não encontrado.' });
    await repositorio.definirPadrao(req.usuario.id, cartao.id);
    return res.json({ ok: true });
  },

  // DELETE /api/pagamentos/cartoes/:id
  async remover(req, res) {
    await repositorio.remover(req.usuario.id, Number(req.params.id));
    return res.json({ ok: true });
  },
};
