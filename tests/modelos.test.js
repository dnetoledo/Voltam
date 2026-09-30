const PontoDeRecarga = require('../src/models/PontoDeRecarga');
const Motorista = require('../src/models/Motorista');

describe('PontoDeRecarga (Information Expert)', () => {
  test('calcula distância entre Av. Paulista e Mackenzie (~1,5 km)', () => {
    const ponto = new PontoDeRecarga({ latitude: -23.5614, longitude: -46.6559 });
    const d = ponto.calcularDistancia(-23.5475, -46.6520);
    expect(d).toBeGreaterThan(1.4);
    expect(d).toBeLessThan(1.7);
  });

  test('valida dados obrigatórios do cadastro', () => {
    expect(PontoDeRecarga.validar({})).toHaveLength(5);
    expect(PontoDeRecarga.validar({
      nome: 'Posto', latitude: -23.5, longitude: -46.6, tipos_conector: ['Tipo 2'], potencia_kw: 22,
    })).toEqual([]);
    expect(PontoDeRecarga.validar({
      nome: 'Posto', latitude: 100, longitude: -46.6, tipos_conector: ['Tomada'], potencia_kw: 22,
    })).toHaveLength(2);
  });
});

describe('Motorista (Creator)', () => {
  test('cria ponto de recarga com status "não verificado" e vinculado a ele', () => {
    const motorista = new Motorista({ id: 7, tipo: 'MOTORISTA' });
    const ponto = motorista.criarPontoDeRecarga({ nome: 'X', latitude: 0, longitude: 0, status: 'DISPONIVEL' });
    expect(ponto.status).toBe('NAO_VERIFICADO');
    expect(ponto.motoristaId).toBe(7);
  });
});
