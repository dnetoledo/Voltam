// Cria as tabelas e insere dados de exemplo (seed). Uso: npm run db:setup
require('dotenv').config({ quiet: true });
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const Usuario = require('../src/models/Usuario');

const PONTOS = [
  ['Eletroposto Paulista Center', 'Av. Paulista, 1000 – Bela Vista', -23.5646, -46.6527, ['Tipo 2', 'CCS Combo'], 60, 2, '24 horas', 'DISPONIVEL'],
  ['Recarga Shopping Consolação', 'Rua da Consolação, 2200 – Consolação', -23.5536, -46.6598, ['Tipo 2'], 22, 4, '10h às 22h', 'OCUPADO'],
  ['Estacionamento Higienópolis', 'Av. Higienópolis, 600 – Higienópolis', -23.5451, -46.6563, ['Tipo 2'], 7.4, 2, '07h às 23h', 'DISPONIVEL'],
  ['Posto Rápido Rebouças', 'Av. Rebouças, 3000 – Pinheiros', -23.5672, -46.6934, ['CCS Combo', 'CHAdeMO'], 150, 2, '24 horas', 'DISPONIVEL'],
  ['Supermercado Vila Madalena', 'Rua Fradique Coutinho, 900 – Vila Madalena', -23.5569, -46.6890, ['Tipo 2'], 11, 3, '08h às 22h', 'FORA_DE_SERVICO'],
  ['Hotel Jardins Carregador', 'Alameda Santos, 1500 – Jardins', -23.5638, -46.6575, ['Tipo 2'], 22, 1, '24 horas', 'NAO_VERIFICADO'],
  ['Eletroposto Ibirapuera', 'Av. República do Líbano, 1100 – Ibirapuera', -23.5920, -46.6618, ['CCS Combo', 'Tipo 2'], 50, 2, '06h às 22h', 'DISPONIVEL'],
  ['Shopping Vila Olímpia', 'Rua Olimpíadas, 360 – Vila Olímpia', -23.5955, -46.6861, ['Tipo 2', 'CCS Combo'], 60, 6, '10h às 22h', 'DISPONIVEL'],
  ['Centro Empresarial Berrini', 'Av. Eng. Luís Carlos Berrini, 1500 – Brooklin', -23.6072, -46.6955, ['Tipo 2'], 22, 4, '07h às 20h', 'OCUPADO'],
  ['Estação Mooca Recarga', 'Rua da Mooca, 2500 – Mooca', -23.5580, -46.5985, ['Tipo 2', 'GB/T'], 30, 2, '24 horas', 'DISPONIVEL'],
  ['Eletroposto Santana', 'Av. Cruzeiro do Sul, 2600 – Santana', -23.5025, -46.6245, ['CCS Combo'], 120, 2, '24 horas', 'NAO_VERIFICADO'],
  ['Parque Tecnológico Butantã', 'Av. Prof. Luciano Gualberto, 300 – Butantã', -23.5613, -46.7309, ['Tipo 1', 'Tipo 2'], 7.4, 2, '08h às 18h', 'DISPONIVEL'],
];

async function main() {
  const schema = fs.readFileSync(path.join(__dirname, '..', 'database', 'schema.sql'), 'utf8');
  await db.query(schema);
  console.log('✔ Tabelas criadas');

  const senhaHash = await Usuario.gerarHash('voltmap123');
  const { rows: [motorista] } = await db.query(
    `INSERT INTO usuario (nome, email, senha_hash, tipo) VALUES
       ('Motorista Demonstração', 'motorista@voltmap.com', $1, 'MOTORISTA'),
       ('Administrador VoltMap', 'admin@voltmap.com', $1, 'ADMINISTRADOR')
     ON CONFLICT (email) DO NOTHING
     RETURNING id`,
    [senhaHash],
  );

  const { rows: [{ total }] } = await db.query('SELECT COUNT(*)::int AS total FROM ponto_de_recarga');
  if (total === 0) {
    const autorId = motorista?.id
      ?? (await db.query("SELECT id FROM usuario WHERE email = 'motorista@voltmap.com'")).rows[0].id;
    for (const p of PONTOS) {
      await db.query(
        `INSERT INTO ponto_de_recarga
          (nome, endereco, latitude, longitude, tipos_conector, potencia_kw, numero_vagas,
           horario_funcionamento, status, motorista_id)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)`,
        [...p, autorId],
      );
    }
    console.log(`✔ ${PONTOS.length} pontos de recarga de exemplo inseridos`);
  } else {
    console.log(`• Banco já possui ${total} pontos; seed de pontos ignorado`);
  }
  await seedIteracao2(senhaHash);
  console.log('✔ Usuários de teste: motorista@voltmap.com / admin@voltmap.com (senha: voltmap123)');
  await db.end();
}

// Iteração C2: motoristas extras, avaliações (RF08) e denúncias pendentes (UC05) para demonstração
async function seedIteracao2(senhaHash) {
  const { rows: [{ total }] } = await db.query('SELECT COUNT(*)::int AS total FROM avaliacao');
  if (total > 0) { console.log('• Avaliações já existem; seed da iteração 2 ignorado'); return; }

  await db.query(
    `INSERT INTO usuario (nome, email, senha_hash, tipo) VALUES
       ('João Motorista', 'joao@voltmap.com', $1, 'MOTORISTA'),
       ('Maria Eletrificada', 'maria@voltmap.com', $1, 'MOTORISTA')
     ON CONFLICT (email) DO NOTHING`, [senhaHash],
  );
  const id = async (email) => (await db.query('SELECT id FROM usuario WHERE email = $1', [email])).rows[0].id;
  const ponto = async (nome) => (await db.query('SELECT id FROM ponto_de_recarga WHERE nome = $1', [nome])).rows[0]?.id;
  const [demo, joao, maria] = [await id('motorista@voltmap.com'), await id('joao@voltmap.com'), await id('maria@voltmap.com')];

  const AVALIACOES = [
    ['Eletroposto Paulista Center', demo, 5, 'Carregador rápido e vagas bem sinalizadas.'],
    ['Eletroposto Paulista Center', maria, 4, 'Funciona bem, mas o estacionamento é pago.'],
    ['Recarga Shopping Consolação', maria, 4, 'Fácil de achar, no 2º subsolo.'],
    ['Recarga Shopping Consolação', joao, 1, 'Péssimo, o carregador nunca funciona, perda de tempo total, não recomendo pra ninguém!!!'],
    ['Posto Rápido Rebouças', demo, 5, 'O mais rápido da região.'],
    ['Eletroposto Ibirapuera', joao, 3, 'Às vezes tem fila no fim de semana.'],
  ];
  const avaliacaoIds = {};
  for (const [nome, autor, nota, comentario] of AVALIACOES) {
    const pid = await ponto(nome);
    if (!pid) continue;
    const { rows: [a] } = await db.query(
      'INSERT INTO avaliacao (ponto_id, motorista_id, nota, comentario) VALUES ($1,$2,$3,$4) RETURNING id',
      [pid, autor, nota, comentario],
    );
    avaliacaoIds[`${nome}|${autor}`] = a.id;
  }

  // Denúncias pendentes (protótipo do painel administrativo – Figura 4)
  const ofensiva = avaliacaoIds[`Recarga Shopping Consolação|${joao}`];
  const DENUNCIAS = [
    [demo, 'AVALIACAO', ofensiva, 'AVALIACAO_INADEQUADA', null],
    [maria, 'AVALIACAO', ofensiva, 'AVALIACAO_INADEQUADA', 'Linguagem agressiva.'],
    [joao, 'PONTO', await ponto('Posto Rápido Rebouças'), 'INFORMACAO_INCORRETA', 'Potência cadastrada como 150 kW, mas o carregador entrega 50 kW.'],
    [maria, 'PONTO', await ponto('Hotel Jardins Carregador'), 'PONTO_INEXISTENTE', 'Fui até o local e não existe nenhum carregador aqui.'],
  ];
  for (const [denunciante, tipo, conteudoId, motivo, descricao] of DENUNCIAS) {
    if (!conteudoId) continue;
    await db.query(
      'INSERT INTO denuncia (denunciante_id, conteudo_tipo, conteudo_id, motivo, descricao) VALUES ($1,$2,$3,$4,$5)',
      [denunciante, tipo, conteudoId, motivo, descricao],
    );
  }
  console.log(`✔ ${AVALIACOES.length} avaliações e ${DENUNCIAS.length} denúncias de exemplo inseridas (iteração 2)`);
}

main().catch(async (e) => {
  console.error('Erro ao criar o banco:', e.message);
  await db.end();
  process.exit(1);
});
