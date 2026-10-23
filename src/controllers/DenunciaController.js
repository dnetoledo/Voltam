// DenunciaController – padrão GRASP Controller (RF10 – Denunciar informação incorreta ou avaliação inadequada)
const Denuncia = require('../models/Denuncia');
const Motorista = require('../models/Motorista');
const repositorioDenuncia = require('../repositories/RepositorioDenuncia');

module.exports = {
  // POST /api/denuncias  { tipo: PONTO|AVALIACAO|FOTO, conteudoId, motivo, descricao }  (rota autenticada)
  async registrar(req, res) {
    const dados = req.body || {};
    const erros = Denuncia.validar(dados);
    if (erros.length) return res.status(400).json({ erro: [...new Set(erros)].join(' '), erros });
    const motorista = req.usuarioObj;
    if (!(motorista instanceof Motorista)) return res.status(403).json({ erro: 'Somente motoristas podem registrar denúncias.' });

    const conteudo = await repositorioDenuncia.buscarConteudo(dados.tipo, dados.conteudoId);
    if (!conteudo || conteudo.removida || conteudo.estaSuspenso?.()) {
      return res.status(404).json({ erro: 'O conteúdo denunciado não está mais disponível.' });
    }

    let denuncia;
    try {
      // Creator: o Motorista registra a Denuncia sobre o ConteudoModeravel
      denuncia = motorista.registrarDenuncia(conteudo, dados);
    } catch (err) {
      return res.status(400).json({ erro: err.message });
    }
    const salva = await repositorioDenuncia.salvar(denuncia);
    if (!salva) return res.status(409).json({ erro: 'Você já denunciou este conteúdo. A denúncia está em análise.' });
    return res.status(201).json({
      denuncia: salva,
      mensagem: 'Denúncia enviada. Obrigado! Um administrador vai analisar o conteúdo.',
    });
  },
};
