// TelaMapa – UC02: Buscar pontos de recarga próximos
const SAO_PAULO = { lat: -23.5505, lng: -46.6333 };
const CONECTORES = ['Tipo 1', 'Tipo 2', 'CCS Combo', 'CHAdeMO', 'GB/T'];
const FILTRO_STATUS = ['DISPONIVEL', 'OCUPADO', 'NAO_VERIFICADO', 'FORA_DE_SERVICO'];

const el = (id) => document.getElementById(id);
const aviso = el('aviso');
let centro = null;
let marcadorCentro = null;
const camadaPontos = L.layerGroup();
const marcadores = new Map();

montarTopo();
montarConviteInstalacao();
const mapa = L.map('mapa', { zoomControl: true }).setView([SAO_PAULO.lat, SAO_PAULO.lng], 12);
camadaMapa(mapa);
camadaPontos.addTo(mapa);

// ---------- Filtros ----------
function criarChips(container, valores, rotulo = (v) => v) {
  container.innerHTML = valores.map((v) =>
    `<button type="button" class="chip" aria-pressed="false" data-valor="${esc(v)}">${esc(rotulo(v))}</button>`).join('');
  container.addEventListener('click', (e) => {
    const chip = e.target.closest('.chip');
    if (!chip) return;
    chip.setAttribute('aria-pressed', chip.getAttribute('aria-pressed') === 'true' ? 'false' : 'true');
    buscar();
  });
}
const selecionados = (container) =>
  [...container.querySelectorAll('.chip[aria-pressed="true"]')].map((c) => c.dataset.valor);

criarChips(el('filtro-conectores'), CONECTORES);
criarChips(el('filtro-status'), FILTRO_STATUS, (s) => STATUS_ROTULO[s]);
el('filtro-potencia').onchange = () => buscar();
el('filtro-raio').onchange = () => buscar();
el('btn-filtros').onclick = () => {
  const aberto = el('filtros').classList.toggle('aberto');
  el('btn-filtros').setAttribute('aria-expanded', aberto);
  setTimeout(() => mapa.invalidateSize(), 50);
};

// ---------- Localização ----------
function definirCentro(lat, lng, rotulo) {
  centro = { lat, lng };
  if (marcadorCentro) marcadorCentro.remove();
  marcadorCentro = L.circleMarker([lat, lng], { radius: 9, color: '#fff', weight: 3, fillColor: '#2563eb', fillOpacity: 1 })
    .addTo(mapa).bindTooltip(rotulo);
}

function usarMinhaLocalizacao() {
  if (!navigator.geolocation) return pedirEndereco();
  el('resumo').textContent = 'Obtendo sua localização…';
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      definirCentro(pos.coords.latitude, pos.coords.longitude, 'Você está aqui');
      buscar({ ajustarMapa: true });
    },
    pedirEndereco,
    { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 },
  );
}

// A2 – geolocalização não autorizada: pedir endereço
function pedirEndereco() {
  mostrarAviso(aviso, 'Não foi possível usar sua localização. Digite um endereço na busca acima para encontrar pontos próximos.', 'info');
  el('resumo').textContent = '';
  el('endereco').focus();
}

el('btn-local').onclick = () => { esconderAviso(aviso); usarMinhaLocalizacao(); };

el('form-busca').onsubmit = async (e) => {
  e.preventDefault();
  const texto = el('endereco').value.trim();
  if (!texto) return;
  esconderAviso(aviso);
  el('resumo').textContent = 'Procurando endereço…';
  try {
    const lugar = await geocodificar(texto);
    if (!lugar) {
      el('resumo').textContent = '';
      return mostrarAviso(aviso, 'Endereço não encontrado. Tente incluir a cidade (ex.: "Rua Augusta, São Paulo").');
    }
    definirCentro(lugar.lat, lugar.lng, texto);
    buscar({ ajustarMapa: true });
  } catch {
    mostrarAviso(aviso, 'Não foi possível buscar o endereço agora. Tente novamente.');
  }
};

// ---------- Busca ----------
// Mostra "Buscar nesta área" só quando o motorista arrasta o mapa
mapa.on('dragend', () => { if (centro) el('buscar-area').classList.add('visivel'); });
el('buscar-area').onclick = () => {
  const c = mapa.getCenter();
  definirCentro(c.lat, c.lng, 'Centro da busca');
  el('buscar-area').classList.remove('visivel');
  buscar();
};

async function buscar({ ajustarMapa = false } = {}) {
  if (!centro) return;
  esconderAviso(aviso);
  const raio = Number(el('filtro-raio').value);
  const params = new URLSearchParams({ lat: centro.lat, lng: centro.lng, raio });
  const conectores = selecionados(el('filtro-conectores'));
  const status = selecionados(el('filtro-status'));
  if (conectores.length) params.set('conectores', conectores.join(','));
  if (status.length) params.set('status', status.join(','));
  if (el('filtro-potencia').value) params.set('potenciaMin', el('filtro-potencia').value);

  el('resumo').textContent = 'Buscando pontos de recarga…';
  try {
    const r = await api('GET', `/pontos?${params}`);
    exibir(r, raio, ajustarMapa);
  } catch (err) {
    el('resumo').textContent = '';
    mostrarAviso(aviso, err.message);
  }
}

function exibir({ pontos, sugestao }, raio, ajustarMapa) {
  camadaPontos.clearLayers();
  marcadores.clear();
  const lista = el('lista');

  if (pontos.length === 0) {
    el('resumo').textContent = '';
    // A1 – nenhum ponto no raio: sugerir aumentar
    const proximo = [5, 10, 25, 50].find((r) => r > raio);
    lista.innerHTML = `<li class="vazio">
        <p><strong>Nenhum ponto de recarga encontrado em ${raio} km.</strong></p>
        <p>${sugestao ? 'Tente aumentar o raio de busca ou remover alguns filtros.' : 'Tente remover alguns filtros.'}</p>
        ${proximo ? `<button class="btn btn-primario" id="aumentar">Buscar em ${proximo} km</button>` : ''}
      </li>`;
    if (proximo) el('aumentar').onclick = () => { el('filtro-raio').value = String(proximo); buscar({ ajustarMapa: true }); };
    if (ajustarMapa) mapa.setView([centro.lat, centro.lng], 12);
    return;
  }

  el('resumo').textContent = `${pontos.length} ponto${pontos.length > 1 ? 's' : ''} de recarga em até ${raio} km, do mais próximo ao mais distante`;
  lista.innerHTML = pontos.map((p) => `
    <li><a class="item-ponto" href="ponto.html?id=${p.id}" data-id="${p.id}">
      <div class="item-topo">
        <div>
          <h3>${esc(p.nome)}</h3>
          <p class="endereco">${esc(p.endereco || '')}</p>
        </div>
        ${seloStatus(p.status)}
      </div>
      <div class="item-meta">
        <span><strong>${formatarKm(p.distanciaKm)}</strong></span>
        <span>${esc(p.tiposConector.join(' · '))}</span>
        <span>${String(p.potenciaKw).replace('.', ',')} kW</span>
      </div>
    </a></li>`).join('');

  pontos.forEach((p) => {
    const m = L.circleMarker([p.latitude, p.longitude], {
      radius: 10, color: '#fff', weight: 3, fillColor: STATUS_COR[p.status] || '#6b7280', fillOpacity: 1,
    }).addTo(camadaPontos);
    m.bindPopup(`<strong>${esc(p.nome)}</strong><br>${esc(p.tiposConector.join(' · '))} · ${p.potenciaKw} kW<br>
      ${formatarKm(p.distanciaKm)} · <a href="ponto.html?id=${p.id}">Ver detalhes</a>`);
    m.on('click', () => destacar(p.id));
    marcadores.set(String(p.id), m);
  });

  if (ajustarMapa) {
    const limites = L.latLngBounds(pontos.map((p) => [p.latitude, p.longitude])).extend([centro.lat, centro.lng]);
    mapa.fitBounds(limites, { padding: [30, 30], maxZoom: 15 });
  }
}

function destacar(id) {
  document.querySelectorAll('.item-ponto').forEach((i) => i.classList.toggle('destaque', i.dataset.id === String(id)));
  document.querySelector(`.item-ponto[data-id="${id}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
el('lista').addEventListener('mouseover', (e) => {
  const item = e.target.closest('.item-ponto');
  if (item) marcadores.get(item.dataset.id)?.openPopup();
});

usarMinhaLocalizacao();
