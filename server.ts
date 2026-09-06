import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, Modality } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const PORT = 3000;
const app = express();

app.use(express.json({ limit: '50mb' }));

// Helper to split long text into natural sentence/paragraph chunks for TTS (max ~550 chars per chunk)
function splitTextIntoTTSChunks(text: string, maxChunkChars = 550): string[] {
  const trimmed = text.trim();
  if (trimmed.length <= maxChunkChars) {
    return [trimmed];
  }

  // Split by double newlines (paragraphs) first
  const paragraphs = trimmed.split(/\n\s*\n/);
  const chunks: string[] = [];
  let currentChunk = '';

  for (const para of paragraphs) {
    const cleanPara = para.trim();
    if (!cleanPara) continue;

    if (currentChunk && (currentChunk.length + cleanPara.length + 2 <= maxChunkChars)) {
      currentChunk += '\n\n' + cleanPara;
    } else if (!currentChunk && cleanPara.length <= maxChunkChars) {
      currentChunk = cleanPara;
    } else {
      if (currentChunk) {
        chunks.push(currentChunk);
        currentChunk = '';
      }

      if (cleanPara.length <= maxChunkChars) {
        currentChunk = cleanPara;
      } else {
        // Sentence level splitting
        const sentenceRegex = /[^.!?\n]+[.!?]+(?:\s+|$)|[^.!?\n]+$/g;
        const sentences = cleanPara.match(sentenceRegex) || [cleanPara];
        for (const sent of sentences) {
          const cleanSent = sent.trim();
          if (!cleanSent) continue;

          if (currentChunk && (currentChunk.length + cleanSent.length + 1 <= maxChunkChars)) {
            currentChunk += ' ' + cleanSent;
          } else {
            if (currentChunk) {
              chunks.push(currentChunk);
              currentChunk = '';
            }
            if (cleanSent.length <= maxChunkChars) {
              currentChunk = cleanSent;
            } else {
              // Word level fallback for unusually long single sentences
              const words = cleanSent.split(/\s+/);
              let temp = '';
              for (const w of words) {
                if (temp && (temp.length + w.length + 1 > maxChunkChars)) {
                  chunks.push(temp);
                  temp = w;
                } else {
                  temp = temp ? temp + ' ' + w : w;
                }
              }
              if (temp) {
                currentChunk = temp;
              }
            }
          }
        }
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.filter((c) => c.trim().length > 0);
}

// Helper to initialize GoogleGenAI client
function getGenAIClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Convert raw 16-bit PCM little-endian audio into a valid standard RIFF WAV buffer
function pcmToWav(pcmBuffer: Buffer, sampleRate = 24000, numChannels = 1, bitsPerSample = 16): Buffer {
  if (pcmBuffer.length >= 12 && pcmBuffer.toString('ascii', 0, 4) === 'RIFF') {
    return pcmBuffer;
  }
  const byteRate = (sampleRate * numChannels * bitsPerSample) / 8;
  const blockAlign = (numChannels * bitsPerSample) / 8;
  const subChunk2Size = pcmBuffer.length;
  const chunkSize = 36 + subChunk2Size;
  const header = Buffer.alloc(44);

  header.write('RIFF', 0);
  header.writeUInt32LE(chunkSize, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16); // 16 for PCM format chunk
  header.writeUInt16LE(1, 20);  // 1 = Linear PCM
  header.writeUInt16LE(numChannels, 22);
  header.writeUInt32LE(sampleRate, 24);
  header.writeUInt32LE(byteRate, 28);
  header.writeUInt16LE(blockAlign, 32);
  header.writeUInt16LE(bitsPerSample, 34);
  header.write('data', 36);
  header.writeUInt32LE(subChunk2Size, 40);

  return Buffer.concat([header, pcmBuffer]);
}

// 1. Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasApiKey: !!process.env.GEMINI_API_KEY,
    time: new Date().toISOString(),
  });
});

// Helper to generate speech for a single text chunk using Gemini TTS
async function generateTTSChunkAudio(
  ai: GoogleGenAI,
  promptText: string,
  voiceName: string
): Promise<Buffer> {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-tts-preview',
    contents: [{ parts: [{ text: promptText }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: { voiceName },
        },
      },
    },
  });

  const rawBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!rawBase64) {
    throw new Error('Speech synthesis engine did not return audio for segment');
  }
  return Buffer.from(rawBase64, 'base64');
}

// Helper to generate speech for dialogue turns using Gemini Multi-Speaker TTS
async function generateTTSDialogueAudio(
  ai: GoogleGenAI,
  promptText: string,
  speaker1: [string, string],
  speaker2: [string, string]
): Promise<Buffer> {
  const response = await ai.models.generateContent({
    model: 'gemini-3.1-flash-tts-preview',
    contents: [{ parts: [{ text: promptText }] }],
    config: {
      responseModalities: [Modality.AUDIO],
      speechConfig: {
        multiSpeakerVoiceConfig: {
          speakerVoiceConfigs: [
            {
              speaker: speaker1[0],
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: speaker1[1] },
              },
            },
            {
              speaker: speaker2[0],
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: speaker2[1] },
              },
            },
          ],
        },
      },
    },
  });

  const rawBase64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
  if (!rawBase64) {
    throw new Error('Model did not return synthesized audio stream for dialogue turn');
  }
  return Buffer.from(rawBase64, 'base64');
}

// Helper to build expressive speech prompt directives with feelings, emotions, and languages
function buildTTSPromptDirective(emotionOrTone: string, language: string, customInstruction?: string): string {
  const emotionMap: Record<string, string> = {
    sad: 'Say with a deeply sad, sorrowful, melancholic, and heartbroken voice with dejected pauses',
    happy: 'Say with a joyful, beaming, happy, and cheerful tone with warm smiling inflection',
    angry: 'Say with a furious, sharp, heated, and angry voice with intense vocal tension',
    excited: 'Say with high excitement, boundless enthusiasm, and thrilling joyful energy',
    silly: 'Say with a goofy, playful, silly, and mischievous whimsical chuckle',
    bored: 'Say with a dull, flat, unenthusiastic, tired, and bored monotone sigh',
    shy: 'Say with a timid, soft, hesitant, modest, and shy quiet voice',
    worried: 'Say with an anxious, nervous, trembling, and worried voice of distressed concern',
    disappointed: 'Say with a crestfallen, deflated, and deeply disappointed heavy sighing tone',
    frustrated: 'Say with an exasperated, irritated, annoyed, and frustrated tense cadence',
    embarrassed: 'Say with a flustered, self-conscious, sheepish, and embarrassed awkward delivery',
    surprised: 'Say with a stunned, gasped, wide-eyed, and surprised tone of disbelief and astonishment',
    storyteller: 'Say with rich narrative cadence, evocative pauses, and audiobook warmth',
    professional: 'Say with crisp, articulate, authoritative corporate broadcast delivery',
    friendly: 'Say with warm, welcoming, smiling, and friendly inflection',
    calm: 'Say with a serene, gentle, unhurried, and relaxed breathing cadence',
    dramatic: 'Say with intense cinematic emotion, heightened suspense, and deep gravity',
    whisper: 'Whisper quietly close to the microphone with intimate ASMR softness',
    natural: 'Speak naturally and expressively',
  };

  const cleanTone = (emotionOrTone || 'natural').toLowerCase().trim();
  const emotionDirective = emotionMap[cleanTone] || (cleanTone !== 'natural' ? `Say with a ${cleanTone} feeling` : 'Speak naturally');

  let langDirective = '';
  const cleanLang = (language || 'English').toLowerCase().trim();
  if (cleanLang === 'hinglish') {
    langDirective = 'in colloquial Hinglish (natural, modern conversational Hindi-English mix)';
  } else if (cleanLang !== 'english') {
    langDirective = `in ${language}`;
  }

  let full = emotionDirective;
  if (langDirective) {
    full += ` ${langDirective}`;
  }
  full += ': ';

  if (customInstruction && customInstruction.trim()) {
    full = `(${customInstruction.trim()}) ` + full;
  }

  return full;
}

// 2. Synthesize Speech Endpoint supporting up to 10,000 characters & words (up to 15 min audio)
app.post('/api/tts/synthesize', async (req, res) => {
  try {
    const ai = getGenAIClient();
    if (!ai) {
      return res.status(503).json({
        success: false,
        error: 'Gemini API key is not configured. You can use the local Web Speech synthesizer in the meantime or provide an API key in Settings > Secrets.',
      });
    }

    const {
      text,
      voice = 'Kore',
      language = 'English',
      tone = 'natural',
      customInstruction = '',
      mode = 'single',
      dialogue = []
    } = req.body;

    if (mode === 'dialogue') {
      if (!Array.isArray(dialogue) || dialogue.length === 0) {
        return res.status(400).json({ success: false, error: 'Dialogue lines are required for dialogue mode' });
      }

      // Collect speaker names and their voices
      const speakerVoiceMap = new Map<string, string>();
      for (const line of dialogue) {
        const spkName = (line.speaker || 'Speaker').trim();
        const spkVoice = line.voice || 'Kore';
        if (!speakerVoiceMap.has(spkName) && speakerVoiceMap.size < 2) {
          speakerVoiceMap.set(spkName, spkVoice);
        }
      }

      // Gemini multi-speaker requires exactly 2 speaker configurations
      const speakerEntries = Array.from(speakerVoiceMap.entries());
      if (speakerEntries.length < 2) {
        speakerEntries.push(['Narrator', 'Kore']);
      }
      const [speaker1, speaker2] = speakerEntries.slice(0, 2);

      // Group dialogue lines into batches of ~4-6 lines so long multi-speaker conversations don't truncate
      const dialogueBatches: Array<typeof dialogue> = [];
      let currentBatch: typeof dialogue = [];
      let currentBatchChars = 0;

      for (const line of dialogue) {
        const lineLen = (line.text || '').length;
        if (currentBatch.length > 0 && (currentBatchChars + lineLen > 650 || currentBatch.length >= 6)) {
          dialogueBatches.push(currentBatch);
          currentBatch = [];
          currentBatchChars = 0;
        }
        currentBatch.push(line);
        currentBatchChars += lineLen;
      }
      if (currentBatch.length > 0) {
        dialogueBatches.push(currentBatch);
      }

      const pcmBuffers: Buffer[] = [];
      const silencePause = Buffer.alloc(4800); // 100ms silence at 24kHz 16-bit mono

      for (let bIndex = 0; bIndex < dialogueBatches.length; bIndex++) {
        const batch = dialogueBatches[bIndex];
        const formattedLines = batch.map((l: { speaker?: string; text?: string; emotion?: string }) => {
          const sName = (l.speaker || 'Speaker').trim();
          const emoTag = l.emotion && l.emotion !== 'natural' ? ` [feeling: ${l.emotion}]` : '';
          return `${sName}${emoTag}: ${l.text}`;
        });

        const langSpec = language.toLowerCase() === 'hinglish'
          ? 'colloquial Hinglish (natural Hindi-English conversational mix)'
          : language;

        const promptText = `TTS the following conversation between ${speaker1[0]} and ${speaker2[0]} in ${langSpec}. Express all emotions and feelings (like happy, sad, angry, excited, surprised, worried, frustrated, embarrassed, shy, silly, bored, disappointed) authentically:\n` +
          formattedLines.join('\n');

        const chunkPcm = await generateTTSDialogueAudio(ai, promptText, speaker1, speaker2);
        pcmBuffers.push(chunkPcm);
        if (bIndex < dialogueBatches.length - 1) {
          pcmBuffers.push(silencePause);
        }
      }

      const combinedPcm = Buffer.concat(pcmBuffers);
      const wavBuffer = pcmToWav(combinedPcm, 24000, 1, 16);
      const audioBase64 = wavBuffer.toString('base64');
      const durationEstimate = combinedPcm.length / (24000 * 2);

      return res.json({
        success: true,
        audioBase64,
        mimeType: 'audio/wav',
        sampleRate: 24000,
        durationEstimate,
        mode: 'dialogue',
        chunkCount: dialogueBatches.length,
      });
    }

    // Single speaker mode with support for up to 10,000 characters / words
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Text prompt cannot be empty' });
    }

    // Sanitize and cap at 10,000 characters
    let sanitizedText = text.trim();
    if (sanitizedText.length > 10000) {
      sanitizedText = sanitizedText.slice(0, 10000);
    }

    const promptDirective = buildTTSPromptDirective(tone, language, customInstruction);

    // Split text into speech-optimized chunks (up to 550 chars each)
    const chunks = splitTextIntoTTSChunks(sanitizedText, 550);
    const pcmBuffers: Buffer[] = [];
    const silencePause = Buffer.alloc(4800); // 100ms natural conversational pause

    for (let i = 0; i < chunks.length; i++) {
      const chunkText = chunks[i];
      const fullPrompt = promptDirective ? `${promptDirective}${chunkText}` : chunkText;
      const chunkPcm = await generateTTSChunkAudio(ai, fullPrompt, voice);
      pcmBuffers.push(chunkPcm);
      if (i < chunks.length - 1) {
        pcmBuffers.push(silencePause);
      }
    }

    const combinedPcm = Buffer.concat(pcmBuffers);
    const wavBuffer = pcmToWav(combinedPcm, 24000, 1, 16);
    const audioBase64 = wavBuffer.toString('base64');
    const durationEstimate = combinedPcm.length / (24000 * 2);

    return res.json({
      success: true,
      audioBase64,
      mimeType: 'audio/wav',
      sampleRate: 24000,
      durationEstimate,
      voice,
      language,
      chunkCount: chunks.length,
      totalCharacters: sanitizedText.length,
      totalWords: sanitizedText.split(/\s+/).length,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('TTS Synthesis Error:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Speech generation encountered an error',
    });
  }
});

// 3. AI Text Enhancement for Speech (adjusts phrasing, pauses, punctuation for spoken delivery)
app.post('/api/tts/enhance-script', async (req, res) => {
  try {
    const ai = getGenAIClient();
    if (!ai) {
      return res.status(503).json({ success: false, error: 'Gemini API key is required for AI script enhancement' });
    }

    const { text, targetTone = 'natural', language = 'English' } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    let langNote = language;
    if (language && language.toLowerCase() === 'hinglish') {
      langNote = 'Hinglish (colloquial Hindi-English conversational mix written in Latin alphabet)';
    }

    const prompt = `You are an expert voice actor and audio director. 
Refine and polish the following text to sound as natural, flowing, and emotionally engaging as possible when read aloud by text-to-speech.
Language: ${langNote}
Desired Expression/Emotion/Tone: ${targetTone}

Guidelines:
- Strongly infuse the requested emotional feeling (${targetTone}) through vocal cues, rhythm, commas, and breathing cadence.
- Insert natural punctuation (ellipses, commas, exclamation points, dashes) for realistic conversational breathing pauses.
- If language is Hinglish, preserve and enhance authentic natural Hinglish phrasing (e.g. "yaar", "suno", "bilkul", "arre", "accha", "kya baat hai").
- Spell out tricky numbers or abbreviations so they are pronounced naturally.
- Preserve the exact core meaning and intent.
- Do NOT add introductory remarks or quotation marks around the final text. Return ONLY the polished speech script.

Original text:
${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const enhancedText = response.text?.trim() || text;

    return res.json({
      success: true,
      enhancedText,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Enhance Script Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Script enhancement failed' });
  }
});

// 4. AI Translation & Speech Assistant
app.post('/api/tts/translate', async (req, res) => {
  try {
    const ai = getGenAIClient();
    if (!ai) {
      return res.status(503).json({ success: false, error: 'Gemini API key is required for translation' });
    }

    const { text, targetLanguage = 'Spanish' } = req.body;
    if (!text) {
      return res.status(400).json({ success: false, error: 'Text is required' });
    }

    let langInstruction = targetLanguage;
    if (targetLanguage.toLowerCase() === 'hinglish') {
      langInstruction = 'natural, colloquial Hinglish written in Latin/English alphabet (a smooth, everyday blend of conversational Hindi and English words as spoken in urban India, e.g. "Arre yaar, I was thinking we should do this today, kya bolte ho?")';
    }

    const prompt = `Translate the following text into natural, idiomatic ${langInstruction}, suitable for spoken voice narration.
Do NOT include commentary, explanations, or quotes. Output ONLY the translated text.

Source text:
${text}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
    });

    const translatedText = response.text?.trim() || text;

    return res.json({
      success: true,
      translatedText,
      targetLanguage,
    });
  } catch (err: unknown) {
    const error = err as Error;
    console.error('Translation Error:', error);
    return res.status(500).json({ success: false, error: error.message || 'Translation failed' });
  }
});

// Setup Vite or Static File Serving
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Speech Synthesizer server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
