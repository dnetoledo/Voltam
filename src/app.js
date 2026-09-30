const path = require('path');
const express = require('express');
const rotas = require('./routes');

const app = express();

app.use(express.json({ limit: '100kb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));
// Biblioteca de mapas Leaflet servida pela própria aplicação
app.use('/vendor/leaflet', express.static(path.dirname(require.resolve('leaflet/dist/leaflet.js'))));
app.use('/api', rotas);

// Rota de API inexistente
app.use('/api', (req, res) => res.status(404).json({ erro: 'Rota não encontrada.' }));

// Tratamento de erros inesperados
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ erro: 'JSON inválido.' });
  console.error(err);
  return res.status(500).json({ erro: 'Erro interno. Tente novamente em instantes.' });
});

module.exports = app;
