// Simple Express server for audio transcription via OpenAI Whisper
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Node 18+ has global fetch, FormData, Blob
// If your Node version is older, upgrade Node or add appropriate polyfills

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '25mb' })); // accept base64 payloads

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || process.env.OPENAI_KEY || '';
const DEEPGRAM_API_KEY = process.env.DEEPGRAM_API_KEY || '';
const ASSEMBLYAI_API_KEY = process.env.ASSEMBLYAI_API_KEY || '';

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/transcribe', async (req, res) => {
  try {
    const { audioBase64, mimeType = 'audio/webm', language = 'en-US' } = req.body || {};
    if (!audioBase64) {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    // Decode base64 to buffer
    const base64Data = audioBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    // 1) Try AssemblyAI if key is provided
    // helper: normalize language for AssemblyAI
    const normalizeAssemblyLang = (lang) => {
      if (!lang) return '';
      const l = String(lang).toLowerCase();
      const map = {
        'en-in': 'en_us',
        'en-us': 'en_us',
        'en': 'en_us',
        'en-gb': 'en_uk',
        'hi-in': 'hi',
        'hi': 'hi',
      };
      return map[l] || '';
    };
    const assemblyLang = normalizeAssemblyLang(language);

    if (ASSEMBLYAI_API_KEY) {
      try {
        // Upload raw bytes to AssemblyAI
        const uploadResp = await fetch('https://api.assemblyai.com/v2/upload', {
          method: 'POST',
          headers: {
            Authorization: ASSEMBLYAI_API_KEY,
            'Content-Type': 'application/octet-stream',
          },
          body: buffer,
        });
        const uploadText = await uploadResp.text();
        if (!uploadResp.ok) {
          return res.status(uploadResp.status).json({ error: 'AssemblyAI upload error', detail: uploadText });
        }
        const uploadJson = JSON.parse(uploadText);
        const audio_url = uploadJson?.upload_url;
        if (!audio_url) {
          return res.status(500).json({ error: 'AssemblyAI upload did not return upload_url', detail: uploadText });
        }

        // Create transcription request (correct endpoint)
        const createResp = await fetch('https://api.assemblyai.com/v2/transcript', {
          method: 'POST',
          headers: {
            Authorization: ASSEMBLYAI_API_KEY,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(Object.fromEntries(Object.entries({
            audio_url,
            language_code: assemblyLang, // omit if empty
            punctuate: true,
            format_text: true,
          }).filter(([k,v]) => v !== '' && v !== undefined))),
        });
        const createText = await createResp.text();
        if (!createResp.ok) {
          return res.status(createResp.status).json({ error: 'AssemblyAI create error', detail: createText });
        }
        const createJson = JSON.parse(createText);
        const transcriptId = createJson?.id;
        if (!transcriptId) {
          return res.status(500).json({ error: 'AssemblyAI did not return id', detail: createText });
        }

        // Poll until completed
        const statusUrl = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;
        let attempts = 0;
        while (attempts < 40) {
          attempts++;
          await new Promise(r => setTimeout(r, 1500));
          const statResp = await fetch(statusUrl, {
            headers: { Authorization: ASSEMBLYAI_API_KEY },
          });
          const statText = await statResp.text();
          if (!statResp.ok) {
            return res.status(statResp.status).json({ error: 'AssemblyAI status error', detail: statText });
          }
          const statJson = JSON.parse(statText);
          if (statJson.status === 'completed') {
            return res.json({ transcript: statJson.text || '' });
          }
          if (statJson.status === 'error') {
            return res.status(500).json({ error: 'AssemblyAI transcription error', detail: statText });
          }
        }
        return res.status(504).json({ error: 'AssemblyAI timeout', detail: 'Polling exceeded attempts' });
      } catch (err) {
        // fall through to other providers if AssemblyAI fails catastrophically
        console.error('AssemblyAI path error, falling back:', err);
      }
    }

    // 2) Try Deepgram if key is provided
    if (DEEPGRAM_API_KEY) {
      // Use Deepgram prerecorded endpoint
      const dgUrl = `https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&detect_language=true${language ? `&language=${encodeURIComponent(language)}` : ''}`;
      const r = await fetch(dgUrl, {
        method: 'POST',
        headers: {
          Authorization: `Token ${DEEPGRAM_API_KEY}`,
          'Content-Type': mimeType || 'audio/webm',
        },
        // Deepgram accepts the raw audio bytes
        body: buffer,
      });
      const text = await r.text();
      if (!r.ok) {
        return res.status(r.status).json({ error: 'Deepgram error', detail: text });
      }
      const json = JSON.parse(text);
      const transcript = json?.results?.channels?.[0]?.alternatives?.[0]?.transcript || '';
      return res.json({ transcript });
    }

    // Fallback to OpenAI Whisper if Deepgram key is not set
    if (!OPENAI_API_KEY) {
      return res.status(500).json({ error: 'Missing DEEPGRAM_API_KEY and OPENAI_API_KEY in environment' });
    }
    const fileBlob = new Blob([buffer], { type: mimeType });
    const form = new FormData();
    form.append('file', fileBlob, 'recording.webm');
    form.append('model', 'whisper-1');
    if (language) form.append('language', language);

    const r = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: form,
    });

    if (!r.ok) {
      const text = await r.text();
      return res.status(r.status).json({ error: 'OpenAI error', detail: text });
    }

    const data = await r.json();
    return res.json({ transcript: data?.text || '' });
  } catch (e) {
    console.error('Transcription error', e);
    return res.status(500).json({ error: 'Server error', detail: String(e) });
  }
});

const port = process.env.PORT || 8787;
app.listen(port, () => {
  console.log(`Transcription server listening on http://localhost:${port}`);
});
