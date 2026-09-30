// Funções compartilhadas pelas telas (sessão, chamadas à API e serviços do OpenStreetMap)
const Sessao = {
  get token() { try { return localStorage.getItem('voltmap_token'); } catch { return null; } },
  get usuario() { try { return JSON.parse(localStorage.getItem('voltmap_usuario')); } catch { return null; } },
  salvar({ token, usuario }) {
    localStorage.setItem('voltmap_token', token);
    localStorage.setItem('voltmap_usuario', JSON.stringify(usuario));
  },
  sair() { localStorage.removeItem('voltmap_token'); localStorage.removeItem('voltmap_usuario'); },
};

async function api(metodo, caminho, corpo) {
  const headers = { 'Content-Type': 'application/json' };
  if (Sessao.token) headers.Authorization = `Bearer ${Sessao.token}`;
  let resposta;
  try {
    resposta = await fetch(`/api${caminho}`, { method: metodo, headers, body: corpo ? JSON.stringify(corpo) : undefined });
  } catch {
    throw Object.assign(new Error('Sem conexão com o servidor. Tente novamente.'), { status: 0 });
  }
  const dados = await resposta.json().catch(() => ({}));
  if (!resposta.ok) throw Object.assign(new Error(dados.erro || 'Erro inesperado.'), { status: resposta.status, dados });
  return dados;
}

const STATUS_ROTULO = {
  DISPONIVEL: 'Disponível', OCUPADO: 'Ocupado', FORA_DE_SERVICO: 'Fora de serviço', NAO_VERIFICADO: 'Não verificado',
};
const STATUS_COR = { DISPONIVEL: '#16a34a', OCUPADO: '#d97706', FORA_DE_SERVICO: '#dc2626', NAO_VERIFICADO: '#6b7280' };

function esc(texto) {
  return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function seloStatus(status) {
  return `<span class="status status-${esc(status)}">${esc(STATUS_ROTULO[status] || status)}</span>`;
}
function formatarKm(km) {
  return km < 1 ? `${Math.round(km * 1000)} m` : `${km.toFixed(1).replace('.', ',')} km`;
}
function mostrarAviso(el, texto, tipo = 'erro') {
  el.textContent = texto;
  el.className = `aviso ${tipo} visivel`;
}
function esconderAviso(el) { el.className = 'aviso'; }

// Geocodificação (endereço -> coordenadas) pelo Nominatim / OpenStreetMap
async function geocodificar(endereco) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=br&q=${encodeURIComponent(endereco)}`;
  const r = await fetch(url, { headers: { 'Accept-Language': 'pt-BR' } });
  const [lugar] = await r.json();
  return lugar ? { lat: Number(lugar.lat), lng: Number(lugar.lon), nome: lugar.display_name } : null;
}
async function enderecoDe(lat, lng) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&zoom=18&lat=${lat}&lon=${lng}`,
      { headers: { 'Accept-Language': 'pt-BR' } });
    const d = await r.json();
    const a = d.address || {};
    const rua = [a.road, a.house_number].filter(Boolean).join(', ');
    return [rua, a.suburb || a.neighbourhood, a.city || a.town].filter(Boolean).join(' – ') || d.display_name || '';
  } catch { return ''; }
}

function camadaMapa(mapa) {
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; OpenStreetMap',
  }).addTo(mapa);
}

// Cabeçalho: mostra "Entrar" ou o nome do usuário com "Sair"
function montarTopo() {
  const area = document.getElementById('topo-acoes');
  if (!area) return;
  const u = Sessao.usuario;
  if (u && Sessao.token) {
    area.innerHTML = `<span class="usuario-nome">Olá, ${esc(u.nome.split(' ')[0])}</span>
      <button class="btn btn-link" id="sair">Sair</button>`;
    document.getElementById('sair').onclick = () => { Sessao.sair(); location.reload(); };
  } else {
    area.innerHTML = `<a class="btn btn-secundario" href="login.html?voltar=${encodeURIComponent(location.pathname + location.search)}">Entrar</a>`;
  }
}
