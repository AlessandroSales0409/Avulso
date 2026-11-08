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

formulario.addEventListener("submit", async function (evento) {
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

  // Só pedidos geram código. Dúvidas e trocas só confirmam o recebimento.
  if (assunto !== "pedido") {
    mostrarRetorno("Valeu, " + nome + "! Recebemos sua mensagem.", "sucesso");
    formulario.reset();
    return;
  }

  try {
    const resposta = await fetch("/api/pedidos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nome: nome, email: email, pedido: mensagem }),
    });
    const dados = await resposta.json();
    if (!resposta.ok) throw new Error(dados.erro || "Erro " + resposta.status);

    mostrarRetorno(
      "Pedido registrado, " + nome + "! Seu código é " + dados.codigo +
        ". Guarde ele para consultar em Meus pedidos.",
      "sucesso"
    );
    formulario.reset();
  } catch (erro) {
    mostrarRetorno("Não foi possível registrar o pedido agora. (" + erro.message + ")", "erro");
  }
});

// Botões "Tenho interesse": preenchem o formulário com o produto escolhido.
const botoesInteresse = document.querySelectorAll(".cartao-produto .botao");

botoesInteresse.forEach(function (botao) {
  botao.addEventListener("click", function () {
    const cartao = botao.closest(".cartao-produto");
    const produto = cartao.querySelector("h3").textContent;

    campoAssunto.value = "pedido";
    campoMensagem.value = "Tenho interesse no produto: " + produto + ".";
  });
});