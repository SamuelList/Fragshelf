import express from 'express';
import serverless from 'serverless-http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const DATA_FILE = path.join(__dirname, '../../data/fragrances.json');

app.use(express.json());

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(__dirname, '../../data');
  try {
    await fs.access(dataDir);
  } catch {
    await fs.mkdir(dataDir, { recursive: true });
  }
}

// Read fragrances from file
async function readFragrances() {
  try {
    const data = await fs.readFile(DATA_FILE, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

// Write fragrances to file
async function writeFragrances(fragrances) {
  await ensureDataDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(fragrances, null, 2));
}

// GET all fragrances
app.get('/api/fragrances', async (req, res) => {
  try {
    const fragrances = await readFragrances();
    res.json(fragrances);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fragrances' });
  }
});

// GET single fragrance by ID
app.get('/api/fragrances/:id', async (req, res) => {
  try {
    const fragrances = await readFragrances();
    const fragrance = fragrances.find(f => f.id === req.params.id);
    
    if (!fragrance) {
      return res.status(404).json({ error: 'Fragrance not found' });
    }
    
    res.json(fragrance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fragrance' });
  }
});

// POST new fragrance
app.post('/api/fragrances', async (req, res) => {
  try {
    const fragrances = await readFragrances();
    const newFragrance = {
      ...req.body,
      id: Date.now().toString()
    };
    
    fragrances.push(newFragrance);
    await writeFragrances(fragrances);
    
    res.status(201).json(newFragrance);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create fragrance' });
  }
});

// PUT update fragrance
app.put('/api/fragrances/:id', async (req, res) => {
  try {
    const fragrances = await readFragrances();
    const index = fragrances.findIndex(f => f.id === req.params.id);
    
    if (index === -1) {
      return res.status(404).json({ error: 'Fragrance not found' });
    }
    
    fragrances[index] = { ...req.body, id: req.params.id };
    await writeFragrances(fragrances);
    
    res.json(fragrances[index]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update fragrance' });
  }
});

// DELETE fragrance
app.delete('/api/fragrances/:id', async (req, res) => {
  try {
    const fragrances = await readFragrances();
    const filteredFragrances = fragrances.filter(f => f.id !== req.params.id);
    
    if (filteredFragrances.length === fragrances.length) {
      return res.status(404).json({ error: 'Fragrance not found' });
    }
    
    await writeFragrances(filteredFragrances);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete fragrance' });
  }
});

export const handler = serverless(app);
