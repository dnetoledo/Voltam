// TelaDetalhesPonto – RF05: visualizar detalhes do ponto de recarga
montarTopo();
const el = (id) => document.getElementById(id);

async function carregar() {
  const id = new URLSearchParams(location.search).get('id');
  try {
    const p = await api('GET', `/pontos/${encodeURIComponent(id || '')}`);
    document.title = `${p.nome} – VoltMap`;
    el('nome').textContent = p.nome;
    el('endereco').textContent = p.endereco || '';
    el('status').innerHTML = seloStatus(p.status);
    el('conectores').textContent = p.tiposConector.join(' / ');
    el('potencia').textContent = `${String(p.potenciaKw).replace('.', ',')} kW`;
    el('vagas').textContent = p.numeroVagas;
    el('horario').textContent = p.horarioFuncionamento || 'Não informado';
    el('data').textContent = new Date(p.dataCadastro).toLocaleDateString('pt-BR');
    el('rota').href = `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`;
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
  } catch (err) {
    mostrarAviso(el('aviso'), err.status === 404 ? 'Ponto de recarga não encontrado.' : err.message);
  }
}

carregar();
