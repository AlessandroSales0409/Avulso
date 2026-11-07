// chatbot.js — conversa com o Kai, atendente virtual da Avulso.
// O site nunca fala direto com o Gemini: ele pergunta ao nosso servidor
// (/api/chat), que tem a chave e a persona.

const botaoAbrir = document.getElementById("botao-abrir-chat");
const botaoFechar = document.getElementById("botao-fechar-chat");
const janelaChat = document.getElementById("janela-chat");
const areaMensagens = document.getElementById("chat-mensagens");
const campoChat = document.getElementById("campo-chat");
const botaoEnviar = document.getElementById("botao-enviar-chat");

// Código único deste visitante: o servidor usa para lembrar da conversa.
const sessionId = crypto.randomUUID();

// Abrir e fechar a janela do chat.
botaoAbrir.addEventListener("click", function () {
  janelaChat.classList.toggle("oculto");
  campoChat.focus();
});

botaoFechar.addEventListener("click", function () {
  janelaChat.classList.add("oculto");
});

// Enviar pelo botão ou apertando Enter.
botaoEnviar.addEventListener("click", enviarMensagem);
campoChat.addEventListener("keydown", function (evento) {
  if (evento.key === "Enter") {
    enviarMensagem();
  }
});

// Cria um balão no chat. tipo = "usuario" | "bot" | "erro".
function adicionarMensagem(tipo, texto) {
  const balao = document.createElement("div");
  balao.className = tipo;
  // textContent mostra texto puro: se alguém digitar HTML, não é executado.
  balao.textContent = texto;
  areaMensagens.appendChild(balao);
  areaMensagens.scrollTop = areaMensagens.scrollHeight;
  return balao;
}

// Envia a pergunta ao servidor e mostra a resposta do Kai.
async function enviarMensagem() {
  const texto = campoChat.value.trim();
  if (texto === "") return;

  adicionarMensagem("usuario", texto);
  campoChat.value = "";

  // Bloqueia o envio enquanto espera a resposta.
  campoChat.disabled = true;
  botaoEnviar.disabled = true;
  const digitando = adicionarMensagem("bot", "Kai está digitando...");

  try {
    const respostaHTTP = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mensagem: texto, sessionId: sessionId }),
    });

    const dados = await respostaHTTP.json();

    if (!respostaHTTP.ok) {
      throw new Error(dados.erro || "Erro " + respostaHTTP.status);
    }

    digitando.remove();
    adicionarMensagem("bot", dados.resposta);
  } catch (erro) {
    digitando.remove();
    adicionarMensagem("erro", "Ops! O Kai não conseguiu responder agora. (" + erro.message + ")");
    console.error(erro);
  } finally {
    campoChat.disabled = false;
    botaoEnviar.disabled = false;
    campoChat.focus();
  }
}