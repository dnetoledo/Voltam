// Painel administrativo – UC05 (Moderar Denúncias: estendido por Remover Conteúdo e Suspender Ponto)
// e RF12 (Gerenciar Usuários: bloquear / desbloquear)
const el = (id) => document.getElementById(id);
const TIPO_ROTULO = { PONTO: 'Ponto de recarga', AVALIACAO: 'Avaliação', FOTO: 'Foto' };
const ACAO_ROTULO = { REMOVER_CONTEUDO: 'Conteúdo removido', SUSPENDER_PONTO: 'Ponto suspenso', ARQUIVAR: 'Arquivada sem ação' };
let denunciaAberta = null;

if (exigirLogin()) {
  if (Sessao.usuario?.tipo !== 'ADMINISTRADOR') {
    document.querySelector('.admin').innerHTML = '<main class="pagina"><div class="aviso erro visivel">Acesso permitido somente ao administrador.</div><a class="btn btn-secundario" href="index.html">Voltar ao mapa</a></main>';
  } else {
    montarTopo();
    window.addEventListener('hashchange', abrirSecao);
    abrirSecao();
  }
}

function tratarErro(err) {
  if (err.status === 401) { Sessao.sair(); exigirLogin(); return; }
  mostrarAviso(el('aviso'), err.message);
}

function abrirSecao() {
  const secao = (location.hash || '#denuncias').slice(1);
  document.querySelectorAll('.secao-admin').forEach((s) => { s.hidden = s.id !== `secao-${secao}`; });
  document.querySelectorAll('.menu-admin a[data-secao]').forEach((a) => a.classList.toggle('ativo', a.dataset.secao === secao));
  esconderAviso(el('aviso'));
  ({ denuncias: carregarDenuncias, usuarios: carregarUsuarios, suspensos: carregarSuspensos, historico: carregarHistorico }[secao] || carregarDenuncias)();
}

// ---------- UC05 – Passo 1: lista de denúncias pendentes ----------
async function carregarDenuncias() {
  try {
    const { total, denuncias } = await api('GET', '/moderacao/denuncias');
    el('titulo-denuncias').textContent = `Denúncias pendentes (${total})`;
    el('contador-denuncias').textContent = total || '';
    el('lista-denuncias').innerHTML = total ? denuncias.map((d) => `
      <li><button type="button" class="item-denuncia" data-id="${d.id}">
        <span class="denuncia-topo"><strong class="motivo">${esc(d.motivoTexto)}</strong><span class="quando">${tempoRelativo(d.dataHora)}</span></span>
        <span class="trecho">${esc(TIPO_ROTULO[d.tipo])}: ${esc(d.trecho)}</span>
        <span class="ponto-rel">${esc(d.pontoNome || '')}${d.totalDenuncias > 1 ? ` · ${d.totalDenuncias} denúncias` : ''}</span>
      </button></li>`).join('')
      : '<li class="vazio">🎉 Nenhuma denúncia pendente.</li>';
    if (!total) el('detalhe-denuncia').innerHTML = '<p class="dica">Tudo em dia por aqui.</p>';
    const alvo = denuncias.find((d) => d.id === denunciaAberta) || denuncias[0];
    if (alvo) abrirDenuncia(alvo.id);
  } catch (err) { tratarErro(err); }
}

el('lista-denuncias').addEventListener('click', (e) => {
  const b = e.target.closest('.item-denuncia');
  if (b) abrirDenuncia(Number(b.dataset.id));
});

// ---------- UC05 – Passos 2 e 3: detalhes do conteúdo denunciado ----------
async function abrirDenuncia(id) {
  denunciaAberta = id;
  document.querySelectorAll('.item-denuncia').forEach((b) => b.classList.toggle('selecionada', Number(b.dataset.id) === id));
  try {
    const { denuncia: d, conteudo: c, denunciadoPor, motivos } = await api('GET', `/moderacao/denuncias/${id}`);
    const conteudoHtml = c.fotoUrl
      ? `<img class="foto-denunciada" src="${esc(c.fotoUrl)}" alt="Foto denunciada">`
      : `<blockquote class="conteudo-denunciado">${c.nota ? `${estrelas(c.nota)}<br>` : ''}"${esc(c.texto)}"
          ${c.autor ? `<footer>— publicado por ${esc(c.autor)}${c.dataHora ? ` · ${tempoRelativo(c.dataHora)}` : ''}</footer>` : ''}</blockquote>`;
    const podeRemover = c.disponivel;
    const podeSuspender = c.ponto && c.ponto.status !== 'SUSPENSO';
    el('detalhe-denuncia').innerHTML = `
      <h2>${esc(d.motivoTexto)} — ${esc(c.ponto?.nome || TIPO_ROTULO[d.tipo])}</h2>
      ${conteudoHtml}
      <dl class="dados-denuncia">
        <dt>Tipo de conteúdo</dt><dd>${esc(TIPO_ROTULO[d.tipo])}</dd>
        <dt>Denunciado por</dt><dd>${denunciadoPor} motorista${denunciadoPor > 1 ? 's' : ''}</dd>
        <dt>Motivo${motivos.length > 1 ? 's' : ''}</dt><dd>${motivos.map((m) => `${esc(m.motivo)}${m.descricao ? `: <em>${esc(m.descricao)}</em>` : ''}`).join('<br>')}</dd>
        <dt>Ponto relacionado</dt><dd>${c.ponto ? `<a href="ponto.html?id=${c.ponto.id}" target="_blank">${esc(c.ponto.nome)}</a>` : '—'}</dd>
        <dt>Status atual do ponto</dt><dd>${c.ponto ? seloStatus(c.ponto.status) : '—'}</dd>
      </dl>
      <div class="acoes-moderacao">
        <button class="btn btn-contorno" data-acao="ARQUIVAR" type="button">Arquivar denúncia</button>
        <button class="btn btn-alerta" data-acao="SUSPENDER_PONTO" type="button" ${podeSuspender ? '' : 'disabled'}>Suspender ponto</button>
        <button class="btn btn-perigo" data-acao="REMOVER_CONTEUDO" type="button" ${podeRemover ? '' : 'disabled'}>Remover conteúdo</button>
      </div>
      <p class="dica">${d.tipo === 'PONTO' ? 'Remover um ponto o suspende e avisa quem o cadastrou.' : 'Remover apaga o conteúdo e avisa o autor.'}</p>`;
  } catch (err) { tratarErro(err); }
}

// ---------- UC05 – Passo 4: decisão do administrador ----------
const CONFIRMACAO = {
  ARQUIVAR: 'Arquivar a denúncia sem nenhuma ação?',
  SUSPENDER_PONTO: 'Suspender o ponto de recarga? Ele deixa de aparecer nas buscas até nova verificação.',
  REMOVER_CONTEUDO: 'Remover o conteúdo denunciado? O autor será notificado.',
};
el('detalhe-denuncia').addEventListener('click', (e) => {
  const b = e.target.closest('[data-acao]');
  if (!b || b.disabled) return;
  const acao = b.dataset.acao;
  const j = abrirJanela(`<h2>Confirmar</h2><p>${CONFIRMACAO[acao]}</p>
    <div class="acoes"><button class="btn btn-secundario" data-fechar type="button">Cancelar</button>
    <button class="btn btn-primario" id="confirmar-acao" type="button">Confirmar</button></div>`);
  j.el.querySelector('#confirmar-acao').onclick = async () => {
    j.fechar();
    try {
      const r = await api('POST', `/moderacao/denuncias/${denunciaAberta}/decisao`, { acao });
      mostrarAviso(el('aviso'), r.mensagem + (r.resolvidas > 1 ? ` (${r.resolvidas} denúncias sobre o mesmo conteúdo)` : ''), 'ok');
      denunciaAberta = null;
      carregarDenuncias();
    } catch (err) { tratarErro(err); }
  };
});

// ---------- RF12 – Gerenciar usuários ----------
async function carregarUsuarios() {
  try {
    const usuarios = await api('GET', `/admin/usuarios?busca=${encodeURIComponent(el('busca-usuarios').value.trim())}`);
    const eu = Sessao.usuario?.id;
    el('tabela-usuarios').innerHTML = usuarios.length ? usuarios.map((u) => {
      const bloqueado = u.status === 'BLOQUEADO';
      const podeAlterar = u.tipo !== 'ADMINISTRADOR' && u.id !== eu;
      return `<tr>
        <td><strong>${esc(u.nome)}</strong></td><td>${esc(u.email)}</td>
        <td>${u.tipo === 'ADMINISTRADOR' ? 'Administrador' : 'Motorista'}</td>
        <td>${u.totalPontos}</td><td>${u.denunciasRecebidas || 0}</td>
        <td><span class="status ${bloqueado ? 'status-FORA_DE_SERVICO' : 'status-DISPONIVEL'}">${bloqueado ? 'Bloqueado' : 'Ativo'}</span></td>
        <td>${podeAlterar ? `<button class="btn ${bloqueado ? 'btn-secundario' : 'btn-perigo'} btn-pequeno" data-usuario="${u.id}" data-bloquear="${!bloqueado}" data-nome="${esc(u.nome)}">${bloqueado ? 'Desbloquear' : 'Bloquear'}</button>` : ''}</td>
      </tr>`;
    }).join('') : '<tr><td colspan="7" class="dica">Nenhum usuário encontrado.</td></tr>';
  } catch (err) { tratarErro(err); }
}
el('form-busca-usuarios').onsubmit = (e) => { e.preventDefault(); carregarUsuarios(); };
el('tabela-usuarios').addEventListener('click', (e) => {
  const b = e.target.closest('[data-usuario]');
  if (!b) return;
  const bloquear = b.dataset.bloquear === 'true';
  const j = abrirJanela(`<h2>${bloquear ? 'Bloquear' : 'Desbloquear'} usuário</h2>
    <p>${bloquear ? `<strong>${esc(b.dataset.nome)}</strong> não conseguirá mais entrar no VoltMap.` : `<strong>${esc(b.dataset.nome)}</strong> voltará a ter acesso ao VoltMap.`}</p>
    <div class="acoes"><button class="btn btn-secundario" data-fechar type="button">Cancelar</button>
    <button class="btn ${bloquear ? 'btn-perigo' : 'btn-primario'}" id="confirmar-bloqueio" type="button">${bloquear ? 'Bloquear' : 'Desbloquear'}</button></div>`);
  j.el.querySelector('#confirmar-bloqueio').onclick = async () => {
    j.fechar();
    try {
      const r = await api('PUT', `/admin/usuarios/${b.dataset.usuario}/bloqueio`, { bloqueado: bloquear });
      mostrarAviso(el('aviso'), r.mensagem, 'ok');
      carregarUsuarios();
    } catch (err) { tratarErro(err); }
  };
});

// ---------- Pontos suspensos ----------
async function carregarSuspensos() {
  try {
    const pontos = await api('GET', '/moderacao/pontos-suspensos');
    el('lista-suspensos').innerHTML = pontos.length ? pontos.map((p) => `
      <li><div class="linha-suspenso"><div><strong>${esc(p.nome)}</strong><span>${esc(p.endereco || '')}</span></div>
        <button class="btn btn-secundario btn-pequeno" data-reativar="${p.id}">Reativar ponto</button></div></li>`).join('')
      : '<li class="dica">Nenhum ponto suspenso.</li>';
  } catch (err) { tratarErro(err); }
}
el('lista-suspensos').addEventListener('click', async (e) => {
  const b = e.target.closest('[data-reativar]');
  if (!b) return;
  try {
    const r = await api('POST', `/moderacao/pontos/${b.dataset.reativar}/reativar`);
    mostrarAviso(el('aviso'), r.mensagem, 'ok');
    carregarSuspensos();
  } catch (err) { tratarErro(err); }
});

// ---------- Histórico ----------
async function carregarHistorico() {
  try {
    const lista = await api('GET', '/moderacao/historico');
    el('lista-historico').innerHTML = lista.length ? lista.map((d) => `
      <li><div class="linha-suspenso"><div><strong>${esc(ACAO_ROTULO[d.acaoTomada] || d.status)}</strong>
        <span>${esc(TIPO_ROTULO[d.tipo])} · ${esc(d.motivoTexto)} · ${esc(d.pontoNome || '')}</span></div>
        <span class="quando">${new Date(d.resolvidaEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</span></div></li>`).join('')
      : '<li class="dica">Nenhuma denúncia analisada ainda.</li>';
  } catch (err) { tratarErro(err); }
}
