// TelaPerfil – Meu Perfil: dados, recarga ativa, favoritos, pontos cadastrados, check-ins e senha
if (exigirLogin()) {
  montarTopo();
  carregarPerfil();
}
const el = (id) => document.getElementById(id);

function itemPonto(p, extra = '') {
  return `<li><a href="ponto.html?id=${p.id}">
      <div><strong>${esc(p.nome)}</strong><span>${esc(p.endereco || '')}</span></div>
      <div class="lado">${seloStatus(p.status)}${extra}</div></a></li>`;
}

async function carregarPerfil() {
  try {
    const d = await api('GET', '/perfil');
    const u = d.usuario;
    el('avatar').textContent = (u.nome.trim()[0] || '?').toUpperCase();
    el('nome-usuario').textContent = u.nome;
    el('email-usuario').textContent = u.email;
    el('desde').textContent = `Motorista VoltMap desde ${new Date(u.dataCadastro).toLocaleDateString('pt-BR')}`;
    el('nome').value = u.nome;
    el('email').value = u.email;

    el('qtd-pontos').textContent = d.pontosCadastrados.length;
    el('qtd-favoritos').textContent = d.favoritos.length;
    el('qtd-checkins').textContent = d.checkIns.length;

    if (d.recargaAtiva) {
      const r = d.recargaAtiva;
      el('secao-recarga').classList.remove('oculto');
      el('recarga').innerHTML = `<div class="recarga-ativa"><span class="pulso" aria-hidden="true"></span>
          <div><strong>${esc(r.pontoNome)}</strong><br><span>Iniciada ${tempoRelativo(r.dataHora)} · válida até
          ${new Date(r.validade).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span></div></div>
        <div class="linha"><a class="btn btn-secundario" href="ponto.html?id=${r.pontoId}">Ver ponto</a>
        <button class="btn btn-primario" id="encerrar">Encerrar recarga</button></div>`;
      el('encerrar').onclick = async () => {
        try { const x = await api('POST', '/recargas/ativa/encerrar'); mostrarAviso(el('aviso'), x.mensagem, 'ok'); }
        catch (err) { mostrarAviso(el('aviso'), err.message); }
        el('secao-recarga').classList.add('oculto');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    }

    el('favoritos').innerHTML = d.favoritos.length ? d.favoritos.map((p) => itemPonto(p)).join('')
      : '<li class="dica">Toque na estrela ☆ na página de um ponto para salvá-lo aqui.</li>';
    el('pontos').innerHTML = d.pontosCadastrados.length ? d.pontosCadastrados.map((p) => itemPonto(p)).join('')
      : '<li class="dica">Você ainda não cadastrou pontos. Use o botão "＋ Adicionar ponto" no mapa.</li>';
    el('checkins').innerHTML = d.checkIns.length ? d.checkIns.map((c) => `
        <li>${seloStatus(c.status)}<div><a href="ponto.html?id=${c.pontoId}"><strong>${esc(c.pontoNome)}</strong></a>
        <span class="quando">${tempoRelativo(c.dataHora)}</span>${c.comentario ? `<p>${esc(c.comentario)}</p>` : ''}</div></li>`).join('')
      : '<li class="dica">Nenhum check-in ainda.</li>';
  } catch (err) {
    if (err.status === 401) { Sessao.sair(); exigirLogin(); return; }
    mostrarAviso(el('aviso'), err.message);
  }
}

el('form-dados').onsubmit = async (e) => {
  e.preventDefault();
  try {
    const { usuario } = await api('PUT', '/perfil', { nome: el('nome').value.trim() });
    Sessao.salvar({ token: Sessao.token, usuario });
    montarTopo();
    el('nome-usuario').textContent = usuario.nome;
    el('avatar').textContent = usuario.nome.trim()[0].toUpperCase();
    mostrarAviso(el('aviso-dados'), 'Dados atualizados.', 'ok');
  } catch (err) { mostrarAviso(el('aviso-dados'), err.message); }
};

el('form-senha').onsubmit = async (e) => {
  e.preventDefault();
  const aviso = el('aviso-senha');
  const nova = el('nova-senha').value;
  if (nova.length < 6) return mostrarAviso(aviso, 'A nova senha deve ter pelo menos 6 caracteres.');
  if (nova !== el('confirmar-senha').value) return mostrarAviso(aviso, 'As senhas não conferem.');
  try {
    const r = await api('PUT', '/perfil/senha', { senhaAtual: el('senha-atual').value, novaSenha: nova });
    mostrarAviso(aviso, r.mensagem, 'ok');
    e.target.reset();
  } catch (err) { mostrarAviso(aviso, err.message); }
  return undefined;
};

el('sair-perfil').onclick = () => { Sessao.sair(); location.href = 'index.html'; };
