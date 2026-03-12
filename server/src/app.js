import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import os from 'node:os';
import fs from 'node:fs';
import Anthropic from '@anthropic-ai/sdk';
import { scrapePartPricing } from './scrapers/performanceBicycle.js';

const app = express();
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const REQUIRED_TOP_LEVEL_KEYS = ['bike', 'parts', 'overall_condition', 'summary'];

const SYSTEM_PROMPT = `You are a bicycle mechanic expert. Analyze the provided bicycle image and return ONLY valid JSON — no markdown, no prose, no code fences, no explanation. Return raw JSON only.

The JSON must have exactly these top-level keys:
- "bike": object with fields: brand (string), model (string), type (string), year (string|null), color (string), frame_material (string), notes (string)
- "parts": array of part objects
- "overall_condition": string (one of: excellent, good, fair, poor, unknown)
- "summary": string (1-2 sentence summary of the bike's condition)

Each part object in "parts" must have:
- "id": string (unique identifier, e.g. "part-1")
- "name": string (part name)
- "component_group": string (one of: Drivetrain, Brakes, Wheels, Handlebars/Cockpit, Saddle/Seatpost, Frame/Fork, Accessories)
- "brand": string
- "model": string
- "condition": string (one of: excellent, good, fair, poor, unknown)
- "condition_notes": string (specific observations)
- "priority": integer 1-5 (1=Immediate replacement/repair needed, 2=Soon, 3=Monitor, 4=OK, 5=New/like new)
- "priority_label": string (one of: Immediate, Soon, Monitor, OK, New)
- "search_query": string (suggested search query to find replacement part)
- "visible_in_image": boolean

Identify 5-10 visible parts. Use component groups: Drivetrain, Brakes, Wheels, Handlebars/Cockpit, Saddle/Seatpost, Frame/Fork, Accessories.
Priority scale: 1=Immediate, 2=Soon, 3=Monitor, 4=OK, 5=New.
Condition values: excellent, good, fair, poor, unknown.

Return ONLY the JSON object. No other text.`;

// Warn (do not crash) if ANTHROPIC_API_KEY is missing
if (!process.env.ANTHROPIC_API_KEY) {
  console.warn(
    '[WARNING] ANTHROPIC_API_KEY is not set. ' +
    'Photo analysis will fail. ' +
    'Copy server/.env.example to server/.env and add your key.'
  );
}

app.use(cors({ origin: CLIENT_URL }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const ALLOWED_MIME_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

const upload = multer({
  dest: os.tmpdir(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      const err = new Error('Unsupported file type');
      err.status = 400;
      cb(err);
    }
  },
});

function deleteUploadedFile(path) {
  if (path) fs.unlink(path, () => {});
}

app.post('/api/analyze', (req, res, next) => {
  upload.single('image')(req, res, async (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'File too large' });
      }
      if (err.status === 400) {
        return res.status(400).json({ error: err.message });
      }
      return next(err);
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No image provided' });
    }

    const filePath = req.file.path;
    let cleaned = false;
    function cleanup() {
      if (!cleaned) {
        cleaned = true;
        deleteUploadedFile(filePath);
      }
    }
    res.on('finish', cleanup);
    res.on('close', cleanup);

    // Read and base64-encode the uploaded image
    let imageBase64;
    try {
      imageBase64 = fs.readFileSync(filePath).toString('base64');
    } catch (readErr) {
      return res.status(500).json({ error: 'Failed to read uploaded file' });
    }

    const mediaType = req.file.mimetype;

    // Call Claude Vision API
    let claudeText;
    try {
      const message = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        system: SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: { type: 'base64', media_type: mediaType, data: imageBase64 },
              },
              {
                type: 'text',
                text: 'Analyze this bicycle image and return the JSON as instructed.',
              },
            ],
          },
        ],
      });
      claudeText = message.content[0].text;
    } catch (apiErr) {
      return res.status(502).json({ error: `Analysis failed: ${apiErr.message}` });
    }

    // Strip markdown code fences if Claude wrapped the JSON
    const claudeJson = claudeText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim();

    // Parse and validate Claude's JSON response
    let analysis;
    try {
      analysis = JSON.parse(claudeJson);
    } catch {
      return res.status(502).json({ error: 'Analysis failed: invalid response format' });
    }

    // Validate required top-level keys
    const missingKeys = REQUIRED_TOP_LEVEL_KEYS.filter((k) => !(k in analysis));
    if (missingKeys.length > 0) {
      return res.status(502).json({ error: `Analysis failed: missing required keys: ${missingKeys.join(', ')}` });
    }

    res.json(analysis);
  });
});

app.post('/api/pricing', async (req, res) => {
  const { parts } = req.body;
  if (!Array.isArray(parts) || parts.length === 0) {
    return res.status(400).json({ error: 'parts array is required' });
  }

  const pricing = [];
  for (const part of parts) {
    const results = await scrapePartPricing(part.search_query || '');
    pricing.push({
      part_id: part.id,
      part_name: part.name,
      search_query: part.search_query,
      results,
    });
  }

  res.json({ pricing });
});

export default app;
