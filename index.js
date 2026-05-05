const { Client, LocalAuth } = require('whatsapp-web.js');
const qrTerminal = require('qrcode-terminal');
const fs = require('fs');
const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');

const client = new Client({
  authStrategy: new LocalAuth()
});

client.on('qr', (qr) => {
  console.log('\nEscaneie o QR Code abaixo para fazer login:\n');
  qrTerminal.generate(qr, { small: true });
  console.log('\n');
});

client.on('ready', async () => {
  console.log('WhatsApp conectado com sucesso!\n');

  console.log('Aguardando 15 segundos para o WhatsApp sincronizar o histórico e as mensagens lidas...');
  await new Promise(resolve => setTimeout(resolve, 15000));

  console.log('\nAnalisando mensagens não lidas...\n');

  try {
    const chats = await client.getChats();
    const unreadChats = chats.filter(chat => chat.unreadCount > 0);

    if (unreadChats.length === 0) {
      console.log('Nenhuma mensagem não lida encontrada.');
      process.exit(0);
    }

    console.log(`Encontrado(s) ${unreadChats.length} chat(s) com mensagens não lidas.`);
    console.log('Processando mensagens e baixando áudios... Aguarde.\n');

    const relatorioData = [];

    // Cria a pasta para áudios se não existir
    const audiosDir = './audios';
    if (!fs.existsSync(audiosDir)) {
      fs.mkdirSync(audiosDir);
    }

    for (const chat of unreadChats) {
      const contact = await chat.getContact();

      // Busca uma margem maior de mensagens e pega apenas as não lidas
      // O limite de 10 pode ser padrão caso não passe nada direito, então forçamos mais se necessário
      const limit = chat.unreadCount > 1000 ? chat.unreadCount : 1000;
      let messages = await chat.fetchMessages({ limit: limit });

      // Filtra apenas as mensagens referentes à quantidade de "não lidas"
      messages = messages.slice(-chat.unreadCount);

      const chatName = contact.name || contact.pushname || contact.number || 'Desconhecido';
      const phone = contact.number || 'N/A';
      const isGroup = chat.isGroup;
      const groupName = isGroup && chat.groupMetadata ? chat.name : 'N/A';

      for (let i = 0; i < messages.length; i++) {
        const msg = messages[i];

        let remetenteOriginal = msg.author || contact.name || contact.pushname || 'Desconhecido';
        const from = msg.fromMe ? 'Você' : remetenteOriginal;

        const timestamp = new Date(msg.timestamp * 1000).toLocaleString('pt-BR');

        let textoMensagem = msg.body || '(sem conteúdo de texto)';
        let infoMidia = 'Não';

        if (msg.hasMedia) {
          const media = await msg.downloadMedia();
          if (media) {
            const mimetype = media.mimetype || '';
            if (mimetype.includes('audio') || mimetype.includes('ogg')) {
              // Pegar a extensão correta (ex: ogg, mp3, mp4)
              let ext = 'ogg';
              if (mimetype.includes('/')) {
                ext = mimetype.split('/')[1].split(';')[0];
                if (ext === 'ogg' || ext === 'mpeg') ext = 'mp3'; // WhatsApp costuma enviar como ogg ou mp3/mp4
              }
              const audioName = `audio_${msg.id.id}.${ext}`;
              const audioPath = `${audiosDir}/${audioName}`;

              // Salva o arquivo de áudio
              fs.writeFileSync(audioPath, media.data, 'base64');

              infoMidia = `Áudio salvo: ${audioName}`;
              textoMensagem = `[Áudio recebido] O arquivo foi salvo em: ${audioPath}`;
            } else {
              infoMidia = 'Sim (Imagem/Vídeo/Documento)';
            }
          }
        }

        // Adiciona a mensagem formatada na lista de dados do relatório
        relatorioData.push({
          remetente: from,
          telefone: phone,
          tipo_chat: isGroup ? 'Grupo' : 'Individual',
          grupo: groupName,
          data_hora: timestamp,
          mensagem: textoMensagem,
          possui_midia: infoMidia
        });
      }
    }

    console.log(`\nTotal: ${unreadChats.length} chat(s) e ${relatorioData.length} mensagens analisadas.`);
    console.log('Gerando relatórios (JSON, CSV, PDF)...');

    // 1. Gerar JSON
    fs.writeFileSync('relatorio_mensagens.json', JSON.stringify(relatorioData, null, 2), 'utf-8');

    // 2. Gerar CSV
    const csvWriter = createObjectCsvWriter({
      path: 'relatorio_mensagens.csv',
      header: [
        { id: 'remetente', title: 'Remetente' },
        { id: 'telefone', title: 'Telefone' },
        { id: 'tipo_chat', title: 'Tipo de Chat' },
        { id: 'grupo', title: 'Grupo' },
        { id: 'data_hora', title: 'Data/Hora' },
        { id: 'mensagem', title: 'Mensagem' },
        { id: 'possui_midia', title: 'Possui Midia' }
      ]
    });
    await csvWriter.writeRecords(relatorioData);

    // 3. Gerar PDF de forma garantida (Usando Promise para esperar a gravação no disco)
    await new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 30 });
      const stream = fs.createWriteStream('relatorio_mensagens.pdf');

      stream.on('finish', resolve);
      stream.on('error', reject);

      doc.pipe(stream);

      doc.fontSize(18).text('Relatorio de Mensagens Não Lidas', { align: 'center' });
      doc.moveDown();

      // Remove emojis e caracteres não suportados pelo PDFKit
      const limpaTextoPDF = (texto) => texto ? String(texto).replace(/[^\p{L}\p{N}\p{P}\p{Z}\n]/gu, '') : '';

      relatorioData.forEach((item, index) => {
        doc.fontSize(12).font('Helvetica-Bold').text(`Demanda ${index + 1} - ${item.data_hora}`);
        doc.fontSize(10).font('Helvetica');
        doc.text(`Remetente: ${limpaTextoPDF(item.remetente)} (${item.telefone})`);
        if (item.tipo_chat === 'Grupo') {
          doc.text(`Grupo: ${limpaTextoPDF(item.grupo)}`);
        }
        doc.text(`Possui Mídia: ${item.possui_midia}`);
        doc.text(`Conteúdo: ${limpaTextoPDF(item.mensagem)}`);
        doc.moveDown();
      });

      doc.end();
    });

    console.log('Relatórios gerados com sucesso! Verifique os arquivos na pasta raiz do projeto.');
    process.exit(0);

  } catch (error) {
    console.error('Erro ao analisar mensagens:', error.message);
    process.exit(1);
  }
});

client.on('auth_failure', (msg) => {
  console.error('Falha na autenticação:', msg);
});

client.on('disconnected', (reason) => {
  console.log('Cliente desconectado:', reason);
});

client.initialize();
