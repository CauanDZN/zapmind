const fs = require('fs');
const path = require('path');
const { OpenAI } = require('openai');

// COLOQUE SUA CHAVE AQUI
const API_KEY = 'sua-chave-api-da-openai-aqui';

const openai = new OpenAI({
  apiKey: API_KEY,
});

async function transcreverAudios() {
  const audiosDir = path.join(__dirname, 'audios');
  
  if (!fs.existsSync(audiosDir)) {
    console.log('Pasta "audios" não encontrada. Execute o index.js primeiro para baixar áudios.');
    return;
  }

  const arquivos = fs.readdirSync(audiosDir).filter(file => 
    file.endsWith('.ogg') || file.endsWith('.mp3') || file.endsWith('.mp4') || file.endsWith('.wav')
  );

  if (arquivos.length === 0) {
    console.log('Nenhum áudio encontrado para transcrever.');
    return;
  }

  console.log(`Encontrado(s) ${arquivos.length} áudio(s) para transcrição.\n`);

  for (const arquivo of arquivos) {
    const caminhoArquivo = path.join(audiosDir, arquivo);
    const caminhoTxt = path.join(audiosDir, arquivo + '.txt');
    
    // Pula se já foi transcrito
    if (fs.existsSync(caminhoTxt)) {
      console.log(`[PULANDO] ${arquivo} já transcrito.`);
      continue;
    }

    console.log(`[TRANSCREVENDO] ${arquivo}...`);
    
    try {
      const response = await openai.audio.transcriptions.create({
        file: fs.createReadStream(caminhoArquivo),
        model: 'whisper-1',
        language: 'pt'
      });

      fs.writeFileSync(caminhoTxt, response.text, 'utf-8');
      console.log(`[SUCESSO] Transcrição salva em ${arquivo}.txt`);
      console.log(`Texto: "${response.text}"\n`);
      
    } catch (error) {
      console.error(`[ERRO] Falha ao transcrever ${arquivo}:`, error.message);
    }
  }
  
  console.log('Processo de transcrição finalizado!');
}

if (API_KEY === 'sua-chave-api-da-openai-aqui') {
  console.log('ATENÇÃO: Você precisa colocar sua chave de API da OpenAI no arquivo transcrever.js');
} else {
  transcreverAudios();
}
