// script.js — formulário de contato da Avulso.

const formulario = document.getElementById("formulario-contato");
const campoNome = document.getElementById("nome");
const campoEmail = document.getElementById("email");
const campoAssunto = document.getElementById("assunto");
const campoMensagem = document.getElementById("mensagem");
const retorno = document.getElementById("mensagem-retorno");

// Mostra o aviso embaixo do formulário. tipo = "sucesso" ou "erro".
function mostrarRetorno(texto, tipo) {
  retorno.textContent = texto;
  retorno.className = tipo;
}

formulario.addEventListener("submit", function (evento) {
  // Impede a página de recarregar ao enviar.
  evento.preventDefault();

  const nome = campoNome.value.trim();
  const email = campoEmail.value.trim();
  const assunto = campoAssunto.value;
  const mensagem = campoMensagem.value.trim();

  if (nome === "" || email === "" || assunto === "" || mensagem === "") {
    mostrarRetorno("Preencha todos os campos antes de enviar.", "erro");
    return;
  }

  if (!email.includes("@") || !email.includes(".")) {
    mostrarRetorno("Digite um e-mail válido.", "erro");
    return;
  }

  mostrarRetorno(
    "Valeu, " + nome + "! Recebemos sua mensagem e vamos responder em " + email + ".",
    "sucesso"
  );
  formulario.reset();
});