const express = require('express');
const autenticacao = require('../middlewares/autenticacao');
const AutenticacaoController = require('../controllers/AutenticacaoController');
const BuscaPontosController = require('../controllers/BuscaPontosController');
const CadastroPontoController = require('../controllers/CadastroPontoController');
const CheckInController = require('../controllers/CheckInController');
const FavoritoController = require('../controllers/FavoritoController');
const PerfilController = require('../controllers/PerfilController');
const PagamentoController = require('../controllers/PagamentoController');
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

module.exports = router;
