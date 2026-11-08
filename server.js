// server.js — a ponte entre o site da Avulso e o Gemini.
// [Site no navegador] --fetch--> [ESTE SERVIDOR] --SDK--> [Gemini]
// A chave fica só aqui, nunca no site.

import express from "express";
import dotenv from "dotenv";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { PERSONA, CONHECIMENTO, REGRAS } from "./persona.js";
import crypto from "crypto";

dotenv.config({ quiet: true });

// ---------- 1) CONFIGURAÇÕES ----------
const PORTA = 3000;

// Se der "model not found", troque só esta linha por um nome da lista:
// https://ai.google.dev/gemini-api/docs/models
const MODELO = "gemini-3.5-flash-lite";

if (!process.env.GEMINI_API_KEY) {
  console.warn("\n⚠️  GEMINI_API_KEY não encontrada! Crie o arquivo .env com a sua chave.\n");
}

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const app = express();

app.use(express.json());
app.use(express.static("public")); // entrega o site (pasta public)

// ---------- 2) INSTRUÇÃO DE SISTEMA (monta a persona do Kai) ----------
const INSTRUCAO_DE_SISTEMA = `
Você é ${PERSONA.nome}, atendente virtual da ${PERSONA.empresa} (${PERSONA.ramo}).
Seu objetivo: ${PERSONA.objetivo}.
Seu tom: ${PERSONA.tom}

=== CONHECIMENTO DA EMPRESA ===
${CONHECIMENTO}

=== REGRAS ===
${REGRAS.map((regra, i) => `${i + 1}. ${regra}`).join("\n")}

Escreva em texto simples, sem markdown (não use **, # ou tabelas).
`;

// ---------- 3) HISTÓRICO DAS CONVERSAS (memória de curto prazo) ----------
// Cada visitante tem um sessionId. Fica na memória RAM: se o servidor
// desligar, as conversas somem.
const historicos = new Map();

function pegarHistorico(sessionId) {
  if (!historicos.has(sessionId)) historicos.set(sessionId, []);
  return historicos.get(sessionId);
}

// ---------- 4) FERRAMENTA: registrar_pedido ----------
// A IA não salva nada sozinha: ela PEDE para usar esta ferramenta e o
// nosso código salva o pedido em pedidos.json.
const FERRAMENTAS = [
  {
    name: "registrar_pedido",
    description:
      "Registra o interesse ou pedido de compra quando o cliente já informou nome, telefone e o que deseja.",
    parameters: {
      type: Type.OBJECT,
      properties: {
        nome: { type: Type.STRING, description: "Nome do cliente." },
        telefone: { type: Type.STRING, description: "Telefone ou WhatsApp do cliente." },
        pedido: { type: Type.STRING, description: "Produto, tamanho e observações do cliente." },
      },
      required: ["nome", "telefone", "pedido"],
    },
  },
];

const ARQUIVO_PEDIDOS = "pedidos.json";

// Gera um código fácil de ler, tipo AV-7K3F9Q.
function gerarCodigo() {
  const letras = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let codigo = "AV-";
  for (let i = 0; i < 6; i++) codigo += letras[crypto.randomInt(letras.length)];
  return codigo;
}

function lerPedidos() {
  try {
    return JSON.parse(fs.readFileSync(ARQUIVO_PEDIDOS, "utf-8"));
  } catch (e) {
    return [];
  }
}

// Salva um pedido (do formulário ou do Kai) e devolve com o código.
function salvarPedido(dados) {
  const pedidos = lerPedidos();
  const novo = { codigo: gerarCodigo(), ...dados, data: new Date().toLocaleString("pt-BR") };
  pedidos.push(novo);
  fs.writeFileSync(ARQUIVO_PEDIDOS, JSON.stringify(pedidos, null, 2));
  console.log("📥 NOVO PEDIDO:", novo);
  return novo;
}

function executarFerramenta(chamada) {
  if (chamada.name === "registrar_pedido") {
    const novo = salvarPedido(chamada.args);
    return { sucesso: true, codigo_do_pedido: novo.codigo };
  }
  return { sucesso: false, aviso: `Ferramenta inexistente: ${chamada.name}` };
}

// Formulário do site: registra o pedido e devolve o código.
app.post("/api/pedidos", (req, res) => {
  const { nome, email, telefone, pedido } = req.body;
  if (!nome?.trim() || !pedido?.trim()) {
    return res.status(400).json({ erro: "Dados incompletos." });
  }
  const novo = salvarPedido({
    nome: nome.trim(),
    email: email?.trim() || "",
    telefone: telefone?.trim() || "",
    pedido: pedido.trim(),
  });
  res.json({ codigo: novo.codigo });
});

// Meus pedidos: consulta pelo código.
app.get("/api/pedidos/:codigo", (req, res) => {
  const codigo = req.params.codigo.trim().toUpperCase();
  const pedido = lerPedidos().find((p) => p.codigo === codigo);
  if (!pedido) return res.status(404).json({ erro: "Pedido não encontrado." });
  res.json(pedido);
});

// Chama o Gemini e tenta de novo (até 3 vezes) se ele estiver ocupado.
async function chamarGemini(historico, tentativas = 3) {
  for (let i = 1; i <= tentativas; i++) {
    try {
      return await ai.models.generateContent({
        model: MODELO,
        contents: historico,
        config: {
          systemInstruction: INSTRUCAO_DE_SISTEMA,
          tools: [{ functionDeclarations: FERRAMENTAS }],
        },
      });
    } catch (erro) {
      const ocupado =
        erro?.status === 503 ||
        erro?.status === 429 ||
        /UNAVAILABLE|high demand/i.test(erro?.message || "");
      if (!ocupado || i === tentativas) throw erro;
      await new Promise((r) => setTimeout(r, i * 1500)); // espera e tenta de novo
    }
  }
}

// ---------- 5) ROTA DO CHAT: POST /api/chat ----------
app.post("/api/chat", async (req, res) => {
  const { mensagem, sessionId } = req.body;

  if (!mensagem?.trim()) {
    return res.status(400).json({ erro: "Mensagem vazia." });
  }
  if (mensagem.length > 500) {
    return res.status(400).json({ erro: "Mensagem muito longa (máximo 500 caracteres)." });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({ erro: "A chave do Gemini não está configurada no .env." });
  }

  const historico = pegarHistorico(sessionId || "anonimo");
  const tamanhoAntes = historico.length; // para desfazer se der erro
  historico.push({ role: "user", parts: [{ text: mensagem }] });

  try {
    let textoFinal = "";

    // Até 3 voltas: pergunta → (talvez ferramenta) → resposta final.
    for (let volta = 1; volta <= 3; volta++) {
            const resposta = await chamarGemini(historico);

      const conteudo = resposta.candidates?.[0]?.content;
      if (conteudo) historico.push(conteudo);

      const chamadas = resposta.functionCalls;
      if (!chamadas || chamadas.length === 0) {
        textoFinal = resposta.text ?? "";
        break;
      }

      const resultados = chamadas.map((chamada) => ({
        functionResponse: {
          id: chamada.id,
          name: chamada.name,
          response: executarFerramenta(chamada),
        },
      }));
      historico.push({ role: "user", parts: resultados });
    }

    return res.json({
      resposta: textoFinal || "Desculpe, não consegui responder agora. Pode repetir?",
    });
  } catch (erro) {
    console.error("❌ Erro ao falar com o Gemini:", erro);
    historico.length = tamanhoAntes;
    return res.status(500).json({ erro: erro?.message || "Falha ao falar com o Gemini." });
  }
});

// ---------- 6) LIGAR O SERVIDOR ----------
app.listen(PORTA, () => {
  console.log(`✅ ${PERSONA.empresa} no ar: http://localhost:${PORTA}`);
  console.log(`🤖 Atendente virtual: ${PERSONA.nome}`);
});