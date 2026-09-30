// TelaNovoPontoRecarga – UC03: Cadastrar novo ponto de recarga (inclui UC01 – Autenticar-se)

// Passo 2 do UC03: executa Autenticar-se, caso necessário
if (!Sessao.token) {
  location.replace(`login.html?voltar=${encodeURIComponent(location.pathname)}`);
}
montarTopo();

const el = (id) => document.getElementById(id);
const aviso = el('aviso');
const CONECTORES = ['Tipo 1', 'Tipo 2', 'CCS Combo', 'CHAdeMO', 'GB/T'];

// Conectores (seleção múltipla)
el('conectores').innerHTML = CONECTORES.map((c) =>
  `<button type="button" class="chip" aria-pressed="false" data-valor="${esc(c)}">${esc(c)}</button>`).join('');
el('conectores').addEventListener('click', (e) => {
  const chip = e.target.closest('.chip');
  if (chip) chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
});

// Mapa com marcador arrastável
const inicio = [-23.5505, -46.6333];
const mapa = L.map('mapa-cadastro').setView(inicio, 13);
camadaMapa(mapa);
let marcador = null;

async function posicionar(lat, lng, { preencherEndereco = true, zoom } = {}) {
  if (!marcador) {
    marcador = L.marker([lat, lng], { draggable: true }).addTo(mapa);
    marcador.on('dragend', () => {
      const p = marcador.getLatLng();
      posicionar(p.lat, p.lng);
    });
  } else {
    marcador.setLatLng([lat, lng]);
  }
  if (zoom) mapa.setView([lat, lng], zoom);
  el('dica-mapa').textContent = `Local: ${lat.toFixed(5)}, ${lng.toFixed(5)} – arraste o marcador para ajustar.`;
  if (preencherEndereco) {
    const endereco = await enderecoDe(lat, lng);
    if (endereco) el('endereco-ponto').value = endereco;
  }
}

mapa.on('click', (e) => posicionar(e.latlng.lat, e.latlng.lng));

if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (pos) => mapa.setView([pos.coords.latitude, pos.coords.longitude], 16),
    () => {}, { timeout: 8000 },
  );
}

async function buscarLocal() {
  const texto = el('busca-local').value.trim();
  if (!texto) return;
  esconderAviso(aviso);
  const lugar = await geocodificar(texto).catch(() => null);
  if (!lugar) return mostrarAviso(aviso, 'Endereço não encontrado. Tente incluir a cidade.');
  el('endereco-ponto').value = texto;
  posicionar(lugar.lat, lugar.lng, { preencherEndereco: false, zoom: 17 });
}
el('btn-buscar-local').onclick = buscarLocal;
el('busca-local').addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); buscarLocal(); } });

// Envio do cadastro
function dadosDoFormulario() {
  const pos = marcador?.getLatLng();
  return {
    nome: el('nome').value.trim(),
    endereco: el('endereco-ponto').value.trim(),
    latitude: pos?.lat,
    longitude: pos?.lng,
    tipos_conector: [...el('conectores').querySelectorAll('.chip[aria-pressed="true"]')].map((c) => c.dataset.valor),
    potencia_kw: Number(el('potencia').value.replace(',', '.')),
    numero_vagas: Number(el('vagas').value) || 1,
    horario_funcionamento: el('horario').value.trim(),
  };
}

function validar(d) {
  if (d.latitude === undefined) return 'Marque o local do ponto no mapa.';
  if (d.nome.length < 3) return 'Informe o nome do local.';
  if (!d.tipos_conector.length) return 'Selecione ao menos um tipo de conector.';
  if (!(d.potencia_kw > 0)) return 'Informe a potência em kW.';
  return null;
}

async function enviar(dados) {
  const botao = el('salvar');
  botao.disabled = true;
  botao.textContent = 'Salvando…';
  try {
    const ponto = await api('POST', '/pontos', dados);
    location.href = `ponto.html?id=${ponto.id}&novo=1`;
  } catch (err) {
    botao.disabled = false;
    botao.textContent = 'Salvar Ponto de Recarga';
    if (err.status === 409 && err.dados?.duplicidade) return abrirDuplicidade(dados);
    if (err.status === 401) {
      Sessao.sair();
      return location.replace(`login.html?voltar=${encodeURIComponent(location.pathname)}`);
    }
    mostrarAviso(aviso, err.message);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

el('form-ponto').onsubmit = (e) => {
  e.preventDefault();
  esconderAviso(aviso);
  const dados = dadosDoFormulario();
  const problema = validar(dados);
  if (problema) {
    mostrarAviso(aviso, problema);
    return window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  enviar(dados);
};

// A1 – alerta de duplicidade: o motorista decide se continua
function abrirDuplicidade(dados) {
  const modal = el('modal-duplicidade');
  modal.classList.add('aberto');
  el('dup-confirmar').focus();
  el('dup-cancelar').onclick = () => modal.classList.remove('aberto');
  el('dup-confirmar').onclick = () => {
    modal.classList.remove('aberto');
    enviar({ ...dados, confirmarDuplicidade: true });
  };
}
