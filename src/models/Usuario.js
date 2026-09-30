// Entidade Usuario (abstrata no Modelo de Domínio)
// Information Expert: é quem conhece o próprio hash e verifica a senha.
const bcrypt = require('bcryptjs');

class Usuario {
  constructor({ id, nome, email, senha_hash, tipo, status, data_cadastro }) {
    this.id = id;
    this.nome = nome;
    this.email = email;
    this.senhaHash = senha_hash;
    this.tipo = tipo;
    this.status = status;
    this.dataCadastro = data_cadastro;
  }

  verificarSenha(senha) {
    return bcrypt.compare(senha, this.senhaHash);
  }

  estaBloqueado() {
    return this.status === 'BLOQUEADO';
  }

  static gerarHash(senha) {
    return bcrypt.hash(senha, 10);
  }

  toJSON() {
    return { id: this.id, nome: this.nome, email: this.email, tipo: this.tipo };
  }
}

module.exports = Usuario;
