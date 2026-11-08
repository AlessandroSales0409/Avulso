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

// ---------- Meus pedidos: consulta pelo código ----------
const formularioPedidos = document.getElementById("formulario-pedido");
const campoCodigo = document.getElementById("codigo-pedido");
const resultadoPedido = document.getElementById("resultado-pedido");

// Mostra uma mensagem simples no resultado. tipo = "sucesso" ou "erro".
function mostrarAviso(texto, tipo) {
  resultadoPedido.replaceChildren();
  resultadoPedido.className = tipo;
  const paragrafo = document.createElement("p");
  paragrafo.textContent = texto;
  resultadoPedido.appendChild(paragrafo);
}

// Mostra os dados do pedido encontrado.
function mostrarPedido(pedido) {
  resultadoPedido.replaceChildren();
  resultadoPedido.className = "sucesso";

  const linhas = [
    ["Código", pedido.codigo],
    ["Nome", pedido.nome],
    ["Pedido", pedido.pedido],
    ["Data", pedido.data],
  ];

  linhas.forEach(function (linha) {
    const paragrafo = document.createElement("p");
    const rotulo = document.createElement("strong");
    rotulo.textContent = linha[0] + ": ";
    paragrafo.appendChild(rotulo);
    // textContent mostra texto puro, sem executar HTML digitado por alguém.
    paragrafo.appendChild(document.createTextNode(linha[1] || "-"));
    resultadoPedido.appendChild(paragrafo);
  });
}

if (formularioPedidos) {
  formularioPedidos.addEventListener("submit", async function (evento) {
    // Impede a página de recarregar ou ir para outro lugar.
    evento.preventDefault();

    const codigo = campoCodigo.value.trim().toUpperCase();
    if (codigo === "") {
      mostrarAviso("Digite o código do pedido.", "erro");
      return;
    }

    mostrarAviso("Buscando seu pedido...", "sucesso");

    try {
      const resposta = await fetch("/api/pedidos/" + encodeURIComponent(codigo));

      if (resposta.status === 404) {
        mostrarAviso("Não encontramos nenhum pedido com esse código. Confira se digitou certo.", "erro");
        return;
      }

      const dados = await resposta.json();
      if (!resposta.ok) throw new Error(dados.erro || "Erro " + resposta.status);

      mostrarPedido(dados);
    } catch (erro) {
      mostrarAviso("Não foi possível consultar agora. (" + erro.message + ")", "erro");
    }
  });
}