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

function tempoRelativo(data) {
  const min = Math.max(0, Math.round((Date.now() - new Date(data).getTime()) / 60000));
  if (min < 1) return 'agora';
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h${min % 60 ? ` ${min % 60} min` : ''}`;
  return new Date(data).toLocaleDateString('pt-BR');
}

// Cabeçalho: "Entrar" ou o nome do usuário (link para Meu Perfil) com "Sair", e o link "Sobre"
function montarTopo() {
  const area = document.getElementById('topo-acoes');
  if (!area) return;
  const u = Sessao.usuario;
  const sobre = '<a class="icone-link" href="ajuda.html" title="Guia do Usuário" aria-label="Guia do Usuário">?</a>'
    + '<a class="icone-link" href="sobre.html" title="Sobre o VoltMap" aria-label="Sobre o VoltMap">ⓘ</a>';
  if (u && Sessao.token) {
    area.innerHTML = `${sobre}<a class="usuario-nome" href="perfil.html" title="Meu perfil">
        <span class="avatar" aria-hidden="true">${esc(u.nome.trim()[0] || '?').toUpperCase()}</span>
        <span class="usuario-texto">Olá, ${esc(u.nome.split(' ')[0])}</span></a>
      <button class="btn btn-link" id="sair">Sair</button>`;
    document.getElementById('sair').onclick = () => { Sessao.sair(); location.href = 'index.html'; };
  } else {
    area.innerHTML = `${sobre}<a class="btn btn-secundario" href="login.html?voltar=${encodeURIComponent(location.pathname + location.search)}">Entrar</a>`;
  }
}

function exigirLogin() {
  if (!Sessao.token) {
    location.replace(`login.html?voltar=${encodeURIComponent(location.pathname + location.search)}`);
    return false;
  }
  return true;
}

// ---------- App instalável (PWA) ----------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}

const Instalacao = {
  instalado() {
    return window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
  },
  ehIOS() {
    return /iphone|ipad|ipod/i.test(navigator.userAgent)
      || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  },
  dispensado() { try { return localStorage.getItem('voltmap_instalar_dispensado') === '1'; } catch { return false; } },
  dispensar() { try { localStorage.setItem('voltmap_instalar_dispensado', '1'); } catch { /* sem armazenamento */ } },
};

// Mostra o convite para instalar o VoltMap na tela de início (apenas na tela do mapa)
function montarConviteInstalacao() {
  const aviso = document.getElementById('instalar');
  if (!aviso || Instalacao.instalado() || Instalacao.dispensado()) return;
  const texto = aviso.querySelector('.instalar-texto');
  const botao = aviso.querySelector('.instalar-botao');
  aviso.querySelector('.instalar-fechar').onclick = () => { aviso.hidden = true; Instalacao.dispensar(); };

  if (Instalacao.ehIOS()) {
    // iPhone/iPad: a instalação é feita pelo menu Compartilhar do Safari
    texto.innerHTML = 'Instale o VoltMap no seu iPhone: toque em <strong>Compartilhar</strong> '
      + '<span aria-hidden="true">⬆︎</span> e depois em <strong>Adicionar à Tela de Início</strong>.';
    botao.hidden = true;
    aviso.hidden = false;
    return;
  }
  // Android e navegadores de computador compatíveis: botão "Instalar"
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    texto.textContent = 'Instale o VoltMap e acesse direto da tela de início, como um app.';
    botao.hidden = false;
    aviso.hidden = false;
    botao.onclick = async () => {
      e.prompt();
      await e.userChoice;
      aviso.hidden = true;
    };
  });
  window.addEventListener('appinstalled', () => { aviso.hidden = true; });
}

// ---------- Janelas (modais) e pagamento da recarga – MODO DEMONSTRAÇÃO ----------
function abrirJanela(html) {
  const fundo = document.createElement('div');
  fundo.className = 'modal aberto';
  fundo.setAttribute('role', 'dialog');
  fundo.setAttribute('aria-modal', 'true');
  fundo.innerHTML = `<div class="cartao janela">${html}</div>`;
  document.body.appendChild(fundo);
  const fechar = () => fundo.remove();
  fundo.addEventListener('click', (e) => { if (e.target === fundo || e.target.closest('[data-fechar]')) fechar(); });
  return { el: fundo, fechar };
}

const moeda = (v) => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
const AVISO_DEMO = '<p class="demo">🧪 <strong>Modo demonstração:</strong> nenhuma cobrança é realizada.</p>';

// Escolha da forma de pagamento ao iniciar a recarga. Resolve com { tipo, cartaoId } ou null (cancelado)
async function escolherPagamento() {
  let cartoes = [];
  try { cartoes = await api('GET', '/pagamentos/cartoes'); } catch { /* segue só com Pix */ }
  const padrao = cartoes.find((c) => c.padrao);
  const opcoes = [
    ...cartoes.map((c) => `<label class="opcao-pagto"><input type="radio" name="pagto" value="CARTAO:${c.id}" ${c.padrao ? 'checked' : ''}>
        <span class="icone-pagto">💳</span><span><strong>${esc(c.descricao)}</strong><small>Crédito · validade ${esc(c.validade)}</small></span></label>`),
    `<label class="opcao-pagto"><input type="radio" name="pagto" value="PIX" ${padrao ? '' : 'checked'}>
        <span class="icone-pagto">◈</span><span><strong>Pix</strong><small>Código gerado ao encerrar a recarga</small></span></label>`,
  ].join('');
  return new Promise((resolve) => {
    const j = abrirJanela(`<h2>Como você vai pagar?</h2>
      <p class="dica">O valor é calculado pela energia estimada quando você encerrar a recarga.</p>
      <div class="opcoes-pagto">${opcoes}</div>
      <a class="btn-link-simples" href="perfil.html#pagamentos">＋ Cadastrar cartão de crédito</a>
      ${AVISO_DEMO}
      <div class="acoes"><button class="btn btn-secundario" data-fechar type="button">Cancelar</button>
      <button class="btn btn-primario" id="confirmar-pagto" type="button">⚡ Iniciar recarga</button></div>`);
    j.el.addEventListener('click', (e) => { if (e.target.closest('[data-fechar]') || e.target === j.el) resolve(null); });
    j.el.querySelector('#confirmar-pagto').onclick = () => {
      const v = j.el.querySelector('input[name="pagto"]:checked').value;
      j.fechar();
      resolve(v === 'PIX' ? { tipo: 'PIX' } : { tipo: 'CARTAO', cartaoId: Number(v.split(':')[1]) });
    };
  });
}

// Resumo exibido ao encerrar a recarga
function mostrarResumoRecarga(r) {
  const pix = r.pixCopiaECola ? `
      <div class="pix">
        <p><strong>Pix copia e cola</strong> (código de demonstração, não pagável)</p>
        <textarea readonly rows="3" id="pix-codigo">${esc(r.pixCopiaECola)}</textarea>
        <button class="btn btn-secundario btn-bloco" id="copiar-pix" type="button">Copiar código</button>
      </div>` : '';
  const j = abrirJanela(`<h2>✅ Recarga encerrada</h2>
    <dl class="resumo-recarga">
      <dt>Ponto</dt><dd>${esc(r.ponto)}</dd>
      <dt>Duração</dt><dd>${r.minutos} min</dd>
      <dt>Energia estimada</dt><dd>${String(r.energiaKwh).replace('.', ',')} kWh</dd>
      <dt>Preço de referência</dt><dd>${moeda(r.precoKwh)}/kWh</dd>
      <dt>Forma de pagamento</dt><dd>${esc(r.formaPagamento)}</dd>
      <dt>Situação</dt><dd>${esc(r.situacao)}</dd>
    </dl>
    <p class="total">Total estimado <strong>${moeda(r.valor)}</strong></p>
    ${pix}${AVISO_DEMO}
    <div class="acoes"><button class="btn btn-primario" data-fechar type="button">Concluir</button></div>`);
  const copiar = j.el.querySelector('#copiar-pix');
  if (copiar) {
    copiar.onclick = async () => {
      try { await navigator.clipboard.writeText(r.pixCopiaECola); copiar.textContent = 'Código copiado!'; }
      catch { j.el.querySelector('#pix-codigo').select(); }
    };
  }
}
