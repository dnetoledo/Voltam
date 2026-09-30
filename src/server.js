require('dotenv').config({ quiet: true });

if (!process.env.JWT_SECRET) {
  console.error('Defina a variável JWT_SECRET (veja o arquivo .env.example).');
  process.exit(1);
}

const app = require('./app');

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`VoltMap rodando em http://localhost:${PORT}`);
});
