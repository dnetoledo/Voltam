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
        try {
          const x = await api('POST', '/recargas/ativa/encerrar');
          mostrarAviso(el('aviso'), x.mensagem, 'ok');
          mostrarResumoRecarga(x.resumo);
          carregarPerfil();
        } catch (err) { mostrarAviso(el('aviso'), err.message); }
        el('secao-recarga').classList.add('oculto');
        window.scrollTo({ top: 0, behavior: 'smooth' });
      };
    }

    el('recargas').innerHTML = d.recargas.length ? d.recargas.map((r) => `
        <li><span class="icone-recarga" aria-hidden="true">⚡</span><div>
          <a href="ponto.html?id=${r.pontoId}"><strong>${esc(r.pontoNome)}</strong></a>
          <span class="quando">${new Date(r.dataHora).toLocaleDateString('pt-BR')}</span>
          <p>${!r.encerradoEm ? '<strong>Em andamento</strong>' : r.energiaKwh == null ? 'Encerrada'
            : `${String(r.energiaKwh).replace('.', ',')} kWh · <strong>${moeda(r.valorEstimado)}</strong>`}
          ${r.formaPagamento ? ` · ${esc(r.formaPagamento)}` : ''}</p></div></li>`).join('')
      : '<li class="dica">Nenhuma recarga ainda. Abra um ponto e toque em "⚡ Iniciar recarga aqui".</li>';
    mostrarCartoes(d.cartoes);

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

// ---------- Formas de pagamento (MODO DEMONSTRAÇÃO) ----------
function mostrarCartoes(cartoes) {
  el('cartoes').innerHTML = cartoes.map((c) => `
    <li><span class="icone-pagto">💳</span>
      <div><strong>${esc(c.descricao)}</strong>${c.padrao ? ' <span class="selo-padrao">Padrão</span>' : ''}
      <br><span class="dica">${esc(c.titular)} · validade ${esc(c.validade)}</span></div>
      <div class="acoes-cartao">
        ${c.padrao ? '' : `<button class="btn btn-link" data-padrao="${c.id}">Tornar padrão</button>`}
        <button class="btn btn-link remover" data-remover="${c.id}">Remover</button>
      </div></li>`).join('');
}

el('cartoes').addEventListener('click', async (e) => {
  const padrao = e.target.closest('[data-padrao]');
  const remover = e.target.closest('[data-remover]');
  try {
    if (padrao) await api('PUT', `/pagamentos/cartoes/${padrao.dataset.padrao}/padrao`);
    if (remover) await api('DELETE', `/pagamentos/cartoes/${remover.dataset.remover}`);
    if (padrao || remover) mostrarCartoes(await api('GET', '/pagamentos/cartoes'));
  } catch (err) { mostrarAviso(el('aviso-cartao'), err.message); }
});

function detectarBandeira(n) {
  if (/^4/.test(n)) return 'Visa';
  if (/^(5[1-5]|2(2[2-9]|[3-6]\d|7[01]|720))/.test(n)) return 'Mastercard';
  if (/^3[47]/.test(n)) return 'American Express';
  if (/^(606282|3841)/.test(n)) return 'Hipercard';
  if (/^(4011|4312|4389|4514|4576|5041|5066|5067|509|6277|6362|6363|650|6516|6550)/.test(n)) return 'Elo';
  return null;
}
function luhnValido(n) {
  let soma = 0;
  for (let i = 0; i < n.length; i++) {
    let d = Number(n[n.length - 1 - i]);
    if (i % 2 === 1) { d *= 2; if (d > 9) d -= 9; }
    soma += d;
  }
  return n.length >= 13 && soma % 10 === 0;
}

el('cartao-numero').addEventListener('input', (e) => {
  const n = e.target.value.replace(/\D/g, '').slice(0, 19);
  e.target.value = n.replace(/(\d{4})(?=\d)/g, '$1 ');
  const b = detectarBandeira(n);
  el('cartao-bandeira').textContent = b ? `Bandeira: ${b}` : '';
});
el('cartao-validade').addEventListener('input', (e) => {
  const v = e.target.value.replace(/\D/g, '').slice(0, 4);
  e.target.value = v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v;
});

el('form-cartao').onsubmit = async (e) => {
  e.preventDefault();
  const aviso = el('aviso-cartao');
  esconderAviso(aviso);
  const numero = el('cartao-numero').value.replace(/\D/g, '');
  const bandeira = detectarBandeira(numero);
  if (!luhnValido(numero)) return mostrarAviso(aviso, 'Número de cartão inválido.');
  if (!bandeira) return mostrarAviso(aviso, 'Bandeira não aceita. Use Visa, Mastercard, Elo, American Express ou Hipercard.');
  // Apenas bandeira, 4 últimos dígitos, validade e titular são enviados ao servidor
  const dados = { bandeira, final: numero.slice(-4), validade: el('cartao-validade').value, titular: el('cartao-nome').value.trim() };
  try {
    await api('POST', '/pagamentos/cartoes', dados);
    e.target.reset();
    el('cartao-bandeira').textContent = '';
    el('novo-cartao').open = false;
    mostrarCartoes(await api('GET', '/pagamentos/cartoes'));
    mostrarAviso(aviso, `Cartão ${bandeira} •••• ${dados.final} salvo.`, 'ok');
  } catch (err) { mostrarAviso(aviso, err.message); }
  return undefined;
};
if (location.hash === '#pagamentos') el('novo-cartao').open = true;

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
