import express from 'express';
import serverless from 'serverless-http';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const DATA_FILE = path.join(__dirname, '../../data/fragrances.json');

// Add CORS middleware
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// Mock data for initial setup
const MOCK_DATA = [
  {
    id: '1',
    brand: 'Dior',
    name: 'Sauvage',
    imageUrl: 'https://images.unsplash.com/photo-1541643600914-78b084683601?w=400',
    seasons: { spring: 20, summer: 35, autumn: 25, winter: 20 },
    occasions: { daily: 30, business: 20, leisure: 25, sport: 10, evening: 10, 'night out': 5 },
    types: { fresh: 40, spicy: 30, woody: 20, citrus: 10 }
  },
  {
    id: '2',
    brand: 'Chanel',
    name: 'Bleu de Chanel',
    imageUrl: 'https://images.unsplash.com/photo-1547887537-6158d64c35b3?w=400',
    seasons: { spring: 25, summer: 25, autumn: 25, winter: 25 },
    occasions: { daily: 20, business: 35, leisure: 20, sport: 5, evening: 15, 'night out': 5 },
    types: { woody: 35, fresh: 25, citrus: 20, spicy: 20 }
  },
  {
    id: '3',
    brand: 'Creed',
    name: 'Aventus',
    imageUrl: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=400',
    seasons: { spring: 30, summer: 40, autumn: 20, winter: 10 },
    occasions: { daily: 15, business: 25, leisure: 20, sport: 10, evening: 20, 'night out': 10 },
    types: { fruity: 35, fresh: 25, woody: 20, spicy: 20 }
  },
  {
    id: '4',
    brand: 'Tom Ford',
    name: 'Oud Wood',
    imageUrl: 'https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?w=400',
    seasons: { spring: 10, summer: 10, autumn: 35, winter: 45 },
    occasions: { daily: 5, business: 15, leisure: 15, sport: 0, evening: 35, 'night out': 30 },
    types: { woody: 50, oriental: 30, spicy: 15, resinous: 5 }
  }
];

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
    // Initialize with mock data if file doesn't exist
    await writeFragrances(MOCK_DATA);
    return MOCK_DATA;
  }
}

// Write fragrances to file
async function writeFragrances(fragrances) {
  await ensureDataDir();
  await fs.writeFile(DATA_FILE, JSON.stringify(fragrances, null, 2));
}

// GET all fragrances
app.get('/fragrances', async (req, res) => {
  try {
    const fragrances = await readFragrances();
    res.json(fragrances);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch fragrances' });
  }
});

// GET single fragrance by ID
app.get('/fragrances/:id', async (req, res) => {
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
app.post('/fragrances', async (req, res) => {
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
app.put('/fragrances/:id', async (req, res) => {
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
app.delete('/fragrances/:id', async (req, res) => {
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
