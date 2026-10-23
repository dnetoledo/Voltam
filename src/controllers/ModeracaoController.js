// ModeracaoController – padrão GRASP Controller (UC05 – Moderar Denúncias)
// Segue o diagrama de sequência de projeto DSP05: o controlador chama conteudo.remover() sem saber se o
// conteúdo é um PontoDeRecarga, uma Avaliacao ou uma FotoPonto (Polimorfismo).
const Denuncia = require('../models/Denuncia');
const repositorioDenuncia = require('../repositories/RepositorioDenuncia');
const repositorioPonto = require('../repositories/RepositorioPontoDeRecarga');
const repositorioNotificacao = require('../repositories/RepositorioNotificacao');

// Dados do conteúdo denunciado exibidos ao administrador (passo 3 do UC05)
async function detalharConteudo(conteudo) {
  if (!conteudo) return { disponivel: false, texto: 'Conteúdo não encontrado (pode ter sido apagado).' };
  const ponto = conteudo.tipoConteudo === 'PONTO'
    ? conteudo : await repositorioPonto.buscarPorIdIncluindoSuspensos(conteudo.pontoRelacionadoId);
  const base = {
    disponivel: !conteudo.removida && !(conteudo.tipoConteudo === 'PONTO' && conteudo.estaSuspenso()),
    descricao: conteudo.descricao(),
    ponto: ponto ? { id: ponto.id, nome: ponto.nome, endereco: ponto.endereco, status: ponto.status,
      potenciaKw: ponto.potenciaKw, tiposConector: ponto.tiposConector } : null,
  };
  if (conteudo.tipoConteudo === 'AVALIACAO') {
    return { ...base, texto: conteudo.comentario || '(sem comentário)', nota: conteudo.nota,
      autor: conteudo.motoristaNome, dataHora: conteudo.dataHora };
  }
  if (conteudo.tipoConteudo === 'FOTO') {
    return { ...base, texto: 'Foto enviada por um motorista', fotoUrl: `/api/fotos/${conteudo.id}`,
      autor: conteudo.motoristaNome, dataHora: conteudo.dataEnvio };
  }
  return { ...base, texto: `${ponto.nome}${ponto.endereco ? ` – ${ponto.endereco}` : ''}` };
}

async function resumoDenuncia(d) {
  const conteudo = await repositorioDenuncia.buscarConteudo(d.conteudoTipo, d.conteudoId);
  const det = await detalharConteudo(conteudo);
  return { ...d.toJSON(), trecho: det.texto, pontoNome: det.ponto?.nome || null };
}

module.exports = {
  // Passo 1 – GET /api/moderacao/denuncias  (uma entrada por conteúdo denunciado)
  async listarDenunciasPendentes(req, res) {
    const pendentes = await repositorioDenuncia.buscarPendentes();
    const vistos = new Set();
    const unicas = pendentes.filter((d) => {
      const chave = `${d.conteudoTipo}:${d.conteudoId}`;
      if (vistos.has(chave)) return false;
      vistos.add(chave);
      return true;
    });
    const denuncias = await Promise.all(unicas.map(resumoDenuncia));
    return res.json({ total: denuncias.length, denuncias });
  },

  // Passos 2 e 3 – GET /api/moderacao/denuncias/:id
  async obterDetalhes(req, res) {
    const denuncia = await repositorioDenuncia.buscarPorId(Number(req.params.id));
    if (!denuncia) return res.status(404).json({ erro: 'Denúncia não encontrada.' });
    const conteudo = await repositorioDenuncia.buscarConteudo(denuncia.conteudoTipo, denuncia.conteudoId);
    const relacionadas = await repositorioDenuncia.buscarPendentesDoConteudo(denuncia.conteudoTipo, denuncia.conteudoId);
    return res.json({
      denuncia,
      conteudo: await detalharConteudo(conteudo),
      denunciadoPor: relacionadas.length || 1,
      motivos: relacionadas.map((r) => ({ motivo: Denuncia.MOTIVOS[r.motivo] || r.motivo, descricao: r.descricao, denunciante: r.denuncianteNome?.split(' ')[0] })),
    });
  },

  // Passo 4 – POST /api/moderacao/denuncias/:id/decisao  { acao: REMOVER_CONTEUDO | SUSPENDER_PONTO | ARQUIVAR }
  async decidirDenuncia(req, res) {
    const acao = req.body?.acao;
    if (!Object.values(Denuncia.ACOES).includes(acao)) {
      return res.status(400).json({ erro: 'Escolha a ação: remover conteúdo, suspender ponto ou arquivar.' });
    }
    const denuncia = await repositorioDenuncia.buscarPorId(Number(req.params.id));
    if (!denuncia) return res.status(404).json({ erro: 'Denúncia não encontrada.' });
    if (!denuncia.estaPendente()) return res.status(409).json({ erro: 'Esta denúncia já foi analisada.' });

    const administrador = req.usuarioObj;
    const conteudo = await repositorioDenuncia.buscarConteudo(denuncia.conteudoTipo, denuncia.conteudoId);
    const ponto = conteudo && (conteudo.tipoConteudo === 'PONTO'
      ? conteudo : await repositorioPonto.buscarPorIdIncluindoSuspensos(conteudo.pontoRelacionadoId));

    // Todas as denúncias pendentes sobre o mesmo conteúdo recebem a mesma decisão
    const relacionadas = (await repositorioDenuncia.buscarPendentesDoConteudo(denuncia.conteudoTipo, denuncia.conteudoId))
      .filter((d) => d.id !== denuncia.id);

    let notificacao;
    try {
      notificacao = administrador.moderarDenuncia(denuncia, acao, { conteudo, ponto });
      relacionadas.forEach((d) => (acao === Denuncia.ACOES.ARQUIVAR ? d.arquivar(administrador.id) : d.resolver(acao, administrador.id)));
    } catch (err) {
      return res.status(409).json({ erro: err.message });
    }

    if (acao === Denuncia.ACOES.REMOVER_CONTEUDO) await repositorioDenuncia.salvarConteudo(conteudo);
    if (acao === Denuncia.ACOES.SUSPENDER_PONTO) await repositorioPonto.atualizarStatus(ponto);
    if (notificacao) await repositorioNotificacao.salvar(notificacao);
    await Promise.all([denuncia, ...relacionadas].map((d) => repositorioDenuncia.atualizar(d)));

    const mensagens = {
      REMOVER_CONTEUDO: notificacao ? 'Conteúdo removido e autor notificado.' : 'Conteúdo removido.',
      SUSPENDER_PONTO: 'Ponto de recarga suspenso: ele não aparece mais nas buscas até nova verificação.',
      ARQUIVAR: 'Denúncia arquivada sem ação.',
    };
    return res.json({ mensagem: mensagens[acao], denuncia, resolvidas: relacionadas.length + 1, notificado: Boolean(notificacao) });
  },

  // GET /api/moderacao/historico
  async historico(req, res) {
    const lista = await repositorioDenuncia.listarResolvidas(30);
    return res.json(await Promise.all(lista.map(resumoDenuncia)));
  },

  // GET /api/moderacao/pontos-suspensos
  async pontosSuspensos(req, res) {
    return res.json(await repositorioPonto.listarSuspensos());
  },

  // POST /api/moderacao/pontos/:id/reativar  (após nova verificação o ponto volta como "não verificado")
  async reativarPonto(req, res) {
    const ponto = await repositorioPonto.buscarPorIdIncluindoSuspensos(Number(req.params.id));
    if (!ponto) return res.status(404).json({ erro: 'Ponto de recarga não encontrado.' });
    if (!ponto.estaSuspenso()) return res.status(409).json({ erro: 'Este ponto não está suspenso.' });
    ponto.reativar();
    await repositorioPonto.atualizarStatus(ponto);
    return res.json({ mensagem: 'Ponto reativado. Ele volta a aparecer nas buscas como "não verificado".', ponto });
  },
};
