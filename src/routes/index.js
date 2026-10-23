const express = require('express');
const autenticacao = require('../middlewares/autenticacao');
const { exigirAdministrador } = require('../middlewares/autenticacao');
const AutenticacaoController = require('../controllers/AutenticacaoController');
const BuscaPontosController = require('../controllers/BuscaPontosController');
const CadastroPontoController = require('../controllers/CadastroPontoController');
const CheckInController = require('../controllers/CheckInController');
const FavoritoController = require('../controllers/FavoritoController');
const PerfilController = require('../controllers/PerfilController');
const PagamentoController = require('../controllers/PagamentoController');
const AvaliacaoController = require('../controllers/AvaliacaoController');
const FotoController = require('../controllers/FotoController');
const DenunciaController = require('../controllers/DenunciaController');
const ModeracaoController = require('../controllers/ModeracaoController');
const GestaoUsuariosController = require('../controllers/GestaoUsuariosController');
const NotificacaoController = require('../controllers/NotificacaoController');
const { version } = require('../../package.json');

const router = express.Router();
const iniciadoEm = new Date();

router.get('/health', (req, res) => res.json({ status: 'ok', app: 'VoltMap', versao: version }));

// Versão publicada (tela "Sobre o VoltMap")
router.get('/versao', (req, res) => res.json({
  versao: version,
  commit: process.env.RENDER_GIT_COMMIT || null,
  branch: process.env.RENDER_GIT_BRANCH || null,
  publicadoEm: iniciadoEm,
  ambiente: process.env.RENDER ? 'Render (nuvem)' : 'Desenvolvimento',
  node: process.version,
}));

// UC01 – Autenticar-se / RF01 – Criar conta
router.post('/usuarios', AutenticacaoController.criarConta);
router.post('/auth/login', AutenticacaoController.autenticar);

// UC02 – Buscar pontos de recarga próximos / RF05 – Detalhes
router.get('/pontos', BuscaPontosController.buscarPontosProximos);
router.get('/pontos/:id', BuscaPontosController.obterDetalhesPonto);

// UC03 – Cadastrar novo ponto de recarga (inclui UC01)
router.post('/pontos', autenticacao, CadastroPontoController.cadastrarPonto);

// UC04 – Check-in / atualizar status do ponto e recarga ativa
router.get('/pontos/:id/checkins', CheckInController.listarCheckIns);
router.post('/pontos/:id/checkins', autenticacao, CheckInController.registrarCheckIn);
router.post('/recargas', autenticacao, CheckInController.iniciarRecarga);
router.get('/recargas', autenticacao, CheckInController.historicoRecargas);
router.get('/recargas/ativa', autenticacao, CheckInController.recargaAtiva);
router.post('/recargas/ativa/encerrar', autenticacao, CheckInController.encerrarRecarga);

// RF09 – Favoritos
router.get('/favoritos', autenticacao, FavoritoController.listar);
router.get('/favoritos/:pontoId', autenticacao, FavoritoController.verificar);
router.put('/favoritos/:pontoId', autenticacao, FavoritoController.adicionar);
router.delete('/favoritos/:pontoId', autenticacao, FavoritoController.remover);

// Formas de pagamento da recarga (MODO DEMONSTRAÇÃO – sem cobrança)
router.get('/pagamentos/cartoes', autenticacao, PagamentoController.listar);
router.post('/pagamentos/cartoes', autenticacao, PagamentoController.adicionar);
router.put('/pagamentos/cartoes/:id/padrao', autenticacao, PagamentoController.definirPadrao);
router.delete('/pagamentos/cartoes/:id', autenticacao, PagamentoController.remover);

// Meu Perfil
router.get('/perfil', autenticacao, PerfilController.obterPerfil);
router.put('/perfil', autenticacao, PerfilController.atualizarDados);
router.put('/perfil/senha', autenticacao, PerfilController.alterarSenha);

// ---------------- Iteração C2 ----------------

// RF08 – Avaliar ponto de recarga
router.get('/pontos/:id/avaliacoes', AvaliacaoController.listar);
router.get('/pontos/:id/avaliacoes/minha', autenticacao, AvaliacaoController.minha);
router.post('/pontos/:id/avaliacoes', autenticacao, AvaliacaoController.avaliar);

// RF05 – Fotos do ponto de recarga
router.get('/pontos/:id/fotos', FotoController.listar);
router.post('/pontos/:id/fotos', autenticacao, FotoController.enviar);
router.get('/fotos/:id', FotoController.imagem);

// RF10 – Denunciar informação incorreta, avaliação inadequada ou foto imprópria
router.post('/denuncias', autenticacao, DenunciaController.registrar);

// Notificações do usuário (ex.: conteúdo removido pela moderação)
router.get('/notificacoes', autenticacao, NotificacaoController.listar);
router.post('/notificacoes/lidas', autenticacao, NotificacaoController.marcarComoLidas);

// UC05 – Moderar Denúncias (somente administrador; estendido por Remover Conteúdo e Suspender Ponto)
const admin = [autenticacao, exigirAdministrador];
router.get('/moderacao/denuncias', admin, ModeracaoController.listarDenunciasPendentes);
router.get('/moderacao/denuncias/:id', admin, ModeracaoController.obterDetalhes);
router.post('/moderacao/denuncias/:id/decisao', admin, ModeracaoController.decidirDenuncia);
router.get('/moderacao/historico', admin, ModeracaoController.historico);
router.get('/moderacao/pontos-suspensos', admin, ModeracaoController.pontosSuspensos);
router.post('/moderacao/pontos/:id/reativar', admin, ModeracaoController.reativarPonto);

// RF12 – Gerenciar usuários (bloquear / desbloquear acesso)
router.get('/admin/usuarios', admin, GestaoUsuariosController.listar);
router.put('/admin/usuarios/:id/bloqueio', admin, GestaoUsuariosController.alterarBloqueio);

module.exports = router;
