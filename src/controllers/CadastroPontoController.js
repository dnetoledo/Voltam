// CadastroPontoController – padrão GRASP Controller (UC03 – Cadastrar Novo Ponto de Recarga)
const PontoDeRecarga = require('../models/PontoDeRecarga');
const Motorista = require('../models/Motorista');
const repositorioPonto = require('../repositories/RepositorioPontoDeRecarga');
const repositorioUsuario = require('../repositories/RepositorioUsuario');

module.exports = {
  // POST /api/pontos  (rota autenticada)
  async cadastrarPonto(req, res) {
    const dados = req.body || {};
    const erros = PontoDeRecarga.validar(dados);
    if (erros.length) return res.status(400).json({ erro: erros.join(' '), erros });

    const motorista = await repositorioUsuario.buscarPorId(req.usuario.id);
    if (!(motorista instanceof Motorista)) {
      return res.status(403).json({ erro: 'Somente motoristas podem cadastrar pontos de recarga.' });
    }

    const localizacao = { latitude: Number(dados.latitude), longitude: Number(dados.longitude) };

    // A1 – possível duplicidade: pede confirmação antes de salvar
    if (!dados.confirmarDuplicidade && await repositorioPonto.existePontoProximo(localizacao)) {
      return res.status(409).json({
        duplicidade: true,
        erro: 'Já existe um ponto de recarga muito próximo deste local. Deseja cadastrar mesmo assim?',
      });
    }

    // Creator: o Motorista cria o PontoDeRecarga (status "não verificado")
    const ponto = motorista.criarPontoDeRecarga({
      nome: String(dados.nome).trim(),
      endereco: dados.endereco ? String(dados.endereco).trim() : null,
      ...localizacao,
      tipos_conector: dados.tipos_conector,
      potencia_kw: Number(dados.potencia_kw),
      numero_vagas: Number(dados.numero_vagas) || 1,
      horario_funcionamento: dados.horario_funcionamento ? String(dados.horario_funcionamento).trim() : null,
    });

    const salvo = await repositorioPonto.salvar(ponto);
    return res.status(201).json(salvo);
  },
};
