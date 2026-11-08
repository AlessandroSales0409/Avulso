# Avulso 

Site de uma loja fictícia de roupas urbanas (streetwear), feito como trabalho da AV3 de Desenvolvimento Web para IA. O site apresenta os produtos, tem um formulário de contato e um atendente virtual com inteligência artificial chamado **Kai**.

## Integrantes

- Alessandro Sales de Morais Lopes (GitHub: AlessandroSales0409)
- João Gabriel de Oliveira Silva Gramos (GitHub: joaogabo2026)

**Divisão do trabalho:**
- Alessandro: HTML, CSS e README.
- João Gabriel: JavaScript, servidor, persona do Kai e integração com a IA.

## Tecnologias utilizadas

- HTML e CSS (cards com `display: flex` e `display: grid`, layout responsivo)
- JavaScript (formulário e chat)
- Node.js com Express (servidor)
- Biblioteca dotenv (guarda a chave de API fora do código)
- API do Google Gemini, pelo pacote `@google/genai`
- Git e GitHub

## Como instalar e rodar

**O que precisa ter:** Node.js (versão LTS), baixado em nodejs.org.

1. Baixe o projeto:
```
git clone https://github.com/AlessandroSales0409/Avulso.git
cd Avulso
```
2. Instale as bibliotecas:
```
npm install
```
3. Crie o arquivo `.env` copiando o modelo:
```
copy .env.exemplo .env
```
4. Abra o `.env` e coloque a chave do Gemini depois do sinal de igual:
```
GEMINI_API_KEY=sua_chave_aqui
```
5. Ligue o servidor:
```
node server.js
```
6. Abra no navegador: **http://localhost:3000**

Importante: o site precisa ser aberto por esse endereço. Abrir o `index.html` direto no computador mostra o visual, mas o chat não funciona, porque ele depende do servidor.

## Sobre a chave de API do chat

O chat usa o Gemini, que exige uma chave. Por segurança, a chave **não está no GitHub**. Há duas formas de configurar:

**Opção 1: usar a chave enviada pelo grupo.** Se o professor recebeu uma chave de teste por fora do repositório, é só colocá-la no `.env`, no passo 4.

**Opção 2: criar a sua própria chave.**
1. Entre em aistudio.google.com com uma conta Google.
2. Crie uma chave de API (opção "Get API key").
3. Coloque no `.env` do mesmo jeito. Há um plano gratuito, mas os limites de uso podem mudar.

Se o chat mostrar uma mensagem de erro em vermelho, confira se o `.env` existe, se o nome da variável está igual a `GEMINI_API_KEY` e se a chave é válida.

## Funcionalidades

- Cabeçalho com logo e menu de navegação com 4 itens (Início, Sobre, Produtos, Contato), cada um levando à sua seção.
- Seção Sobre com 3 cards de benefícios (flex).
- Seção Produtos com 6 cards (grid). O botão "Tenho interesse" leva ao formulário e já preenche o assunto e o produto.
- Formulário de contato com validação dos campos e mensagem de confirmação. Os dados não são salvos em lugar nenhum, a confirmação é apenas na tela.
- Rodapé com contato e redes sociais.
- Layout responsivo para computador, tablet e celular.
- Chat com o Kai, atendente virtual da loja.

## Integração com Inteligência Artificial

O atendente se chama **Kai**, um consultor de estilo da Avulso. Ele responde dúvidas sobre produtos, preços, trocas e frete, ajuda a navegar pelo site e fica dentro do assunto da loja. Perguntas sobre outros temas são recusadas educadamente.

Como funciona:
1. O site (`chatbot.js`) envia a mensagem do visitante ao nosso servidor, no endereço `/api/chat`.
2. O servidor (`server.js`) junta a mensagem com a persona e os dados da loja (`persona.js`) e chama a API do Gemini.
3. A resposta volta ao site e aparece no chat.

Outros detalhes:
- A chave de API fica só no servidor, nunca no navegador.
- O servidor guarda o histórico de cada visitante durante a conversa, para o Kai lembrar do que já foi dito. Ao reiniciar o servidor, o histórico é apagado.
- O Kai pode registrar um pedido quando o cliente informa nome, telefone e o produto. O pedido é salvo no arquivo `pedidos.json`, criado automaticamente.
- Mensagens vazias ou com mais de 500 caracteres são recusadas, e o servidor tenta de novo se o Gemini estiver ocupado.

Ferramentas de IA também foram usadas como apoio no desenvolvimento do projeto, conforme permitido no documento da avaliação.

## Estrutura de pastas

```
Avulso/
├── public/
│   ├── css/
│   │   └── style.css       (estilos do site)
│   ├── img/                (fotos dos produtos)
│   ├── js/
│   │   ├── script.js       (formulário e botões "Tenho interesse")
│   │   └── chatbot.js      (chat do Kai)
│   └── index.html          (página do site)
├── server.js               (servidor e conexão com o Gemini)
├── persona.js              (persona do Kai e dados da loja)
├── package.json            (bibliotecas do projeto)
├── .env.exemplo            (modelo do arquivo .env)
├── .gitignore
└── README.md
```