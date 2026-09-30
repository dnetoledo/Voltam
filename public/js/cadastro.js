// TelaCadastroUsuario – RF01: Criar conta de motorista
function destinoSeguro() {
  const v = new URLSearchParams(location.search).get('voltar') || '';
  return v.startsWith('/') && !v.startsWith('//') ? v : 'index.html';
}
document.getElementById('link-login').href = `login.html${location.search}`;

const form = document.getElementById('form-cadastro');
const aviso = document.getElementById('aviso');
const botao = document.getElementById('enviar');

form.onsubmit = async (e) => {
  e.preventDefault();
  esconderAviso(aviso);
  const nome = form.nome.value.trim();
  const email = form.email.value.trim();
  const senha = form.senha.value;

  if (nome.length < 3) return mostrarAviso(aviso, 'Informe seu nome.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return mostrarAviso(aviso, 'Informe um e-mail válido.');
  if (senha.length < 6) return mostrarAviso(aviso, 'A senha deve ter pelo menos 6 caracteres.');
  if (senha !== form.confirmacao.value) return mostrarAviso(aviso, 'As senhas não conferem.');

  botao.disabled = true;
  botao.textContent = 'Criando conta…';
  try {
    Sessao.salvar(await api('POST', '/usuarios', { nome, email, senha }));
    location.href = destinoSeguro();
  } catch (err) {
    mostrarAviso(aviso, err.message);
    botao.disabled = false;
    botao.textContent = 'Criar conta';
  }
};
