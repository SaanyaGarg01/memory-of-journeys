// server.js
import express from 'express';
import cors from 'cors';
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8080;

app.use(cors());
app.use(express.json());

// Catch-all proxy for any GET request
app.use(async (req, res, next) => {
  try {
    const targetUrl = req.originalUrl.slice(1); // remove leading "/"
    if (!targetUrl.startsWith('http')) {
      return res.status(400).send('Invalid URL');
    }

    const response = await fetch(targetUrl);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('Proxy error:', err);
    res.status(500).send({ error: 'Proxy fetch failed', details: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ CORS proxy running at http://localhost:${PORT}`);
});
