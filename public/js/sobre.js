// TelaSobre – versão publicada (API) e histórico de versões (GitHub)
montarTopo();
const el = (id) => document.getElementById(id);
const REPO = 'dnetoledo/Voltam';

async function carregarVersao() {
  try {
    const v = await api('GET', '/versao');
    el('versao-selo').textContent = `versão ${v.versao}`;
    el('v-versao').textContent = v.versao;
    const tag = `v${v.versao.split('.').slice(0, 2).join('.')}`;
    el('v-tag').textContent = tag;
    el('v-tag').href = `https://github.com/${REPO}/releases/tag/${tag}`;
    el('v-commit').innerHTML = v.commit
      ? `<a href="https://github.com/${REPO}/commit/${esc(v.commit)}" target="_blank" rel="noopener"><code>${esc(v.commit.slice(0, 7))}</code></a> (branch ${esc(v.branch || 'main')})`
      : 'versão local de desenvolvimento';
    el('v-data').textContent = new Date(v.publicadoEm).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
    el('v-ambiente').textContent = `${v.ambiente} · Node.js ${v.node}`;
    el('v-url').textContent = location.origin;
  } catch (err) {
    el('v-versao').textContent = 'indisponível';
  }
}

async function carregarCommits() {
  const lista = el('commits');
  try {
    const r = await fetch(`https://api.github.com/repos/${REPO}/commits?per_page=8`);
    if (!r.ok) throw new Error();
    const commits = await r.json();
    lista.innerHTML = commits.map((c) => `
      <li><a href="${esc(c.html_url)}" target="_blank" rel="noopener"><code>${esc(c.sha.slice(0, 7))}</code></a>
        <div><strong>${esc(c.commit.message.split('\n')[0])}</strong>
        <span class="quando">${new Date(c.commit.author.date).toLocaleDateString('pt-BR')}</span></div></li>`).join('');
  } catch {
    lista.innerHTML = `<li class="dica">Veja o histórico completo em <a href="https://github.com/${REPO}/commits/main" target="_blank" rel="noopener">github.com/${REPO}</a>.</li>`;
  }
}

carregarVersao();
carregarCommits();
