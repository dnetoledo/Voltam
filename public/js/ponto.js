// TelaDetalhesPonto – RF05 (detalhes), UC04 (check-in e recarga ativa) e RF09 (favoritos)
montarTopo();
const el = (id) => document.getElementById(id);
const idPonto = new URLSearchParams(location.search).get('id');
const logado = Boolean(Sessao.token);
let ponto = null;
let statusEscolhido = null;

function preencher(p) {
  ponto = p;
  document.title = `${p.nome} – VoltMap`;
  el('nome').textContent = p.nome;
  el('endereco').textContent = p.endereco || '';
  el('status').innerHTML = seloStatus(p.status);
  el('atualizacao').textContent = p.statusAtualizadoEm
    ? `Status informado por check-in ${tempoRelativo(p.statusAtualizadoEm)}` : 'Ainda sem check-in recente';
  el('conectores').textContent = p.tiposConector.join(' / ');
  el('potencia').textContent = `${String(p.potenciaKw).replace('.', ',')} kW`;
  el('vagas').textContent = p.numeroVagas;
  el('horario').textContent = p.horarioFuncionamento || 'Não informado';
  el('data').textContent = new Date(p.dataCadastro).toLocaleDateString('pt-BR');
  el('rota').href = `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`;
}

async function carregar() {
  try {
    const p = await api('GET', `/pontos/${encodeURIComponent(idPonto || '')}`);
    preencher(p);
    el('cartao').classList.remove('oculto');
    if (new URLSearchParams(location.search).get('novo')) {
      mostrarAviso(el('aviso'), 'Ponto cadastrado com sucesso! Ele aparece para os outros motoristas como "Não verificado".', 'ok');
    }
    const mapa = L.map('mini-mapa', { zoomControl: false, dragging: false, scrollWheelZoom: false })
      .setView([p.latitude, p.longitude], 16);
    camadaMapa(mapa);
    L.circleMarker([p.latitude, p.longitude], {
      radius: 11, color: '#fff', weight: 3, fillColor: STATUS_COR[p.status] || '#6b7280', fillOpacity: 1,
    }).addTo(mapa);

    el('secao-checkin').classList.remove('oculto');
    el('secao-recarga').classList.remove('oculto');
    if (logado) {
      el('form-checkin').classList.remove('oculto');
      carregarFavorito();
    } else {
      el('checkin-login').classList.remove('oculto');
      el('link-login-checkin').href = `login.html?voltar=${encodeURIComponent(location.pathname + location.search)}`;
    }
    carregarRecarga();
    carregarHistorico();
  } catch (err) {
    mostrarAviso(el('aviso'), err.status === 404 ? 'Ponto de recarga não encontrado.' : err.message);
  }
}

// ---------- RF09 – Favoritos ----------
async function carregarFavorito() {
  const botao = el('favorito');
  const marcar = (fav) => {
    botao.setAttribute('aria-pressed', String(fav));
    botao.textContent = fav ? '★' : '☆';
    botao.title = fav ? 'Remover dos favoritos' : 'Adicionar aos favoritos';
  };
  try { marcar((await api('GET', `/favoritos/${ponto.id}`)).favorito); } catch { /* sem login válido */ }
  botao.onclick = async () => {
    const fav = botao.getAttribute('aria-pressed') !== 'true';
    marcar(fav);
    try { await api(fav ? 'PUT' : 'DELETE', `/favoritos/${ponto.id}`); } catch (err) { marcar(!fav); mostrarAviso(el('aviso'), err.message); }
  };
}
if (!logado) el('favorito').onclick = () => { location.href = `login.html?voltar=${encodeURIComponent(location.pathname + location.search)}`; };

// ---------- Recarga ativa ----------
async function carregarRecarga() {
  const area = el('recarga-conteudo');
  if (!logado) {
    area.innerHTML = '<p class="dica">Entre na sua conta para registrar que está carregando neste ponto.</p>';
    return;
  }
  let ativa = null;
  try { ativa = (await api('GET', '/recargas/ativa')).recarga; } catch { /* segue */ }
  if (ativa && ativa.pontoId === ponto.id) {
    area.innerHTML = `<div class="recarga-ativa">
        <span class="pulso" aria-hidden="true"></span>
        <div><strong>Você está carregando aqui</strong><br><span>Iniciada ${tempoRelativo(ativa.dataHora)} · válida até ${new Date(ativa.validade).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
        ${ativa.formaPagamento ? `<br><span>Pagamento: ${esc(ativa.formaPagamento)}</span>` : ''}</div>
      </div>
      <button class="btn btn-secundario btn-bloco" id="encerrar">Encerrar recarga e liberar a vaga</button>`;
    el('encerrar').onclick = encerrarRecarga;
  } else if (ativa) {
    area.innerHTML = `<p class="dica">Você tem uma recarga ativa em <a href="ponto.html?id=${ativa.pontoId}">${esc(ativa.pontoNome)}</a>.</p>`;
  } else if (ponto.status === 'FORA_DE_SERVICO') {
    area.innerHTML = '<p class="dica">Este ponto está fora de serviço.</p>';
  } else {
    area.innerHTML = `<p class="dica">Chegou ao ponto? Avise que está carregando: o ponto aparece como ocupado para os outros motoristas.</p>
      <button class="btn btn-primario btn-bloco" id="iniciar">⚡ Iniciar recarga aqui</button>`;
    el('iniciar').onclick = iniciarRecarga;
  }
}

async function iniciarRecarga() {
  const pagamento = await escolherPagamento();
  if (!pagamento) return;
  try {
    const r = await api('POST', '/recargas', { pontoId: ponto.id, pagamento });
    preencher(r.ponto);
    mostrarAviso(el('aviso'), 'Recarga iniciada! O ponto agora aparece como ocupado.', 'ok');
    carregarRecarga(); carregarHistorico();
  } catch (err) { mostrarAviso(el('aviso'), err.message); }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

async function encerrarRecarga() {
  try {
    const r = await api('POST', '/recargas/ativa/encerrar');
    mostrarAviso(el('aviso'), r.mensagem, 'ok');
    mostrarResumoRecarga(r.resumo);
    preencher(await api('GET', `/pontos/${ponto.id}`));
    carregarRecarga(); carregarHistorico();
  } catch (err) { mostrarAviso(el('aviso'), err.message); }
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ---------- UC04 – Check-in ----------
document.querySelectorAll('.opcao-status').forEach((b) => {
  b.onclick = () => {
    statusEscolhido = b.dataset.status;
    document.querySelectorAll('.opcao-status').forEach((o) => o.setAttribute('aria-checked', String(o === b)));
  };
});

el('form-checkin').onsubmit = async (e) => {
  e.preventDefault();
  const aviso = el('aviso-checkin');
  esconderAviso(aviso);
  if (!statusEscolhido) return mostrarAviso(aviso, 'Escolha o status do ponto.');
  const botao = el('confirmar-checkin');
  botao.disabled = true;
  try {
    const r = await api('POST', `/pontos/${ponto.id}/checkins`, { status: statusEscolhido, comentario: el('comentario').value.trim() });
    preencher(r.ponto);
    mostrarAviso(aviso, r.aviso || 'Check-in registrado. Obrigado por ajudar a comunidade!', 'ok');
    el('comentario').value = '';
    statusEscolhido = null;
    document.querySelectorAll('.opcao-status').forEach((o) => o.setAttribute('aria-checked', 'false'));
    carregarHistorico(); carregarRecarga();
  } catch (err) {
    if (err.status === 401) { Sessao.sair(); return exigirLogin(); }
    mostrarAviso(aviso, err.message);
  } finally { botao.disabled = false; }
  return undefined;
};

async function carregarHistorico() {
  try {
    const lista = await api('GET', `/pontos/${ponto.id}/checkins`);
    el('secao-historico').classList.remove('oculto');
    el('historico').innerHTML = lista.length ? lista.map((c) => `
      <li>${seloStatus(c.status)}
        <div><strong>${esc(c.motorista || 'Motorista')}</strong> <span class="quando">${tempoRelativo(c.dataHora)}</span>
        ${c.comentario ? `<p>${esc(c.comentario)}</p>` : ''}</div>
      </li>`).join('') : '<li class="dica">Nenhum check-in ainda. Seja o primeiro!</li>';
  } catch { /* opcional */ }
}

carregar();
