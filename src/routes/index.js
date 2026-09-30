const express = require('express');
const autenticacao = require('../middlewares/autenticacao');
const AutenticacaoController = require('../controllers/AutenticacaoController');
const BuscaPontosController = require('../controllers/BuscaPontosController');
const CadastroPontoController = require('../controllers/CadastroPontoController');

const router = express.Router();

router.get('/health', (req, res) => res.json({ status: 'ok', app: 'VoltMap', versao: '0.1.0' }));

// UC01 – Autenticar-se / RF01 – Criar conta
router.post('/usuarios', AutenticacaoController.criarConta);
router.post('/auth/login', AutenticacaoController.autenticar);

// UC02 – Buscar pontos de recarga próximos / RF05 – Detalhes
router.get('/pontos', BuscaPontosController.buscarPontosProximos);
router.get('/pontos/:id', BuscaPontosController.obterDetalhesPonto);

// UC03 – Cadastrar novo ponto de recarga (inclui UC01)
router.post('/pontos', autenticacao, CadastroPontoController.cadastrarPonto);

module.exports = router;
