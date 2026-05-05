# ZapMind

ZapMind é um script em Node.js projetado para conectar-se ao WhatsApp via Web e processar mensagens não lidas. A ferramenta extrai as mensagens não lidas de conversas individuais e grupos, baixa áudios recebidos e gera relatórios detalhados em múltiplos formatos (JSON, CSV e PDF).

## Funcionalidades

- **Conexão via QR Code**: Conecta-se à sua conta do WhatsApp lendo um QR Code gerado no terminal.
- **Leitura de Mensagens Não Lidas**: Filtra automaticamente chats com mensagens não lidas e processa o histórico necessário.
- **Download de Áudios**: Identifica e salva arquivos de áudio (mensagens de voz) recebidos em uma pasta chamada `audios/`.
- **Relatórios Multiformato**: Gera três arquivos de relatório após a análise:
  - `relatorio_mensagens.json`
  - `relatorio_mensagens.csv`
  - `relatorio_mensagens.pdf`
- **Prevenção de Travamentos**: O script limpa automaticamente a pasta de cache do Chromium (`.wwebjs_cache`) a cada inicialização para evitar travamentos durante o sincronismo do histórico.

## Pré-requisitos

Para rodar este projeto, você precisa ter o [Node.js](https://nodejs.org/) instalado em seu computador.

## Instalação

1. Clone o repositório ou baixe os arquivos do projeto.
2. Abra o terminal na pasta do projeto (`zapmind`).
3. Instale as dependências executando o comando:

```bash
npm install
```

As principais bibliotecas utilizadas são:
- `whatsapp-web.js`
- `qrcode-terminal`
- `pdfkit`
- `csv-writer`

## Como Usar

1. Execute o script no terminal:

```bash
node index.js
```

2. Um QR Code será gerado no terminal (e também uma janela do Google Chrome/Chromium poderá ser aberta, caso o modo visual - *headless: false* - esteja ativado). 
3. Escaneie o QR Code usando o WhatsApp no seu celular (como se fosse conectar ao WhatsApp Web).
4. Aguarde o aviso de "WhatsApp conectado com sucesso!". O script vai aguardar alguns segundos para que o WhatsApp carregue o histórico e as mensagens.
5. Após o processamento, os arquivos de áudio estarão na pasta `audios/` e os relatórios (PDF, CSV, JSON) estarão disponíveis na raiz do projeto.

## Possíveis Problemas (Troubleshooting)

- **Script travado após ler o QR Code**: O `whatsapp-web.js` possui um problema frequente com sincronização de mensagens. O script já tenta evitar isso deletando a pasta `.wwebjs_cache` a cada execução. Caso o problema persista (mensagens carregando infinitamente no navegador), feche o script, delete manualmente a pasta `.wwebjs_auth` e tente ler o QR code novamente.
- **Falta de dependências para o Puppeteer**: O `whatsapp-web.js` instala o `puppeteer` que baixa uma versão local do Chromium. Em alguns sistemas, você pode precisar instalar bibliotecas do sistema exigidas pelo Chromium.

## Licença

Este é um projeto de uso pessoal/estudos.
