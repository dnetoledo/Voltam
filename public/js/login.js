// TelaLogin – UC01: Autenticar-se
function destinoSeguro() {
  const v = new URLSearchParams(location.search).get('voltar') || '';
  return v.startsWith('/') && !v.startsWith('//') ? v : 'index.html';
}
document.getElementById('link-cadastro').href = `cadastro.html${location.search}`;

const form = document.getElementById('form-login');
const aviso = document.getElementById('aviso');
const botao = document.getElementById('enviar');

form.onsubmit = async (e) => {
  e.preventDefault();
  esconderAviso(aviso);
  const email = form.email.value.trim();
  const senha = form.senha.value;
  if (!email || !senha) return mostrarAviso(aviso, 'Informe e-mail e senha.');

  botao.disabled = true;
  botao.textContent = 'Entrando…';
  try {
    Sessao.salvar(await api('POST', '/auth/login', { email, senha }));
    location.href = destinoSeguro();
  } catch (err) {
    // A1 – credenciais inválidas / A2 – conta bloqueada: permanece na tela com a mensagem
    mostrarAviso(aviso, err.message);
    botao.disabled = false;
    botao.textContent = 'Entrar';
  }
};
