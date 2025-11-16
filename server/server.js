import express from 'express';
import cors from 'cors';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const DATA_FILE = path.join(__dirname, 'data', 'fragrances.json');

// Middleware
app.use(cors());
app.use(express.json());

// Ensure data directory exists
async function ensureDataDir() {
  const dataDir = path.join(__dirname, 'data');
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
    // If file doesn't exist, return empty array
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

// Initialize with mock data if file doesn't exist
async function initializeData() {
  try {
    await fs.access(DATA_FILE);
  } catch {
    const mockData = [
      {
        id: '1',
        brand: 'Tom Ford',
        name: 'Oud Wood',
        imageUrl: '/images/oudwood.jpg',
        seasons: { spring: 10, summer: 0, autumn: 45, winter: 45 },
        occasions: { daily: 10, business: 30, leisure: 20, sport: 0, evening: 30, 'night out': 10 },
        types: {
          Woody: 60,
          Resinous: 20,
          Spicy: 20,
          Animalic: 0, Aquatic: 0, Floral: 0, Chypre: 0, Creamy: 0, Earthy: 0,
          Fougere: 0, Fresh: 0, Fruity: 0, Gourmand: 0, Green: 0, Leathery: 0,
          Oriental: 0, Powdery: 0, Smoky: 0, Sweet: 0, Synthetic: 0, Citrus: 0
        }
      },
      {
        id: '2',
        brand: 'Dior',
        name: 'Sauvage',
        imageUrl: '/images/sauvage.jpg',
        seasons: { spring: 25, summer: 30, autumn: 25, winter: 20 },
        occasions: { daily: 40, business: 20, leisure: 20, sport: 10, evening: 10, 'night out': 0 },
        types: {
          Fresh: 40,
          Citrus: 30,
          Spicy: 20,
          Woody: 10,
          Animalic: 0, Aquatic: 0, Floral: 0, Chypre: 0, Creamy: 0, Earthy: 0,
          Fougere: 0, Fruity: 0, Gourmand: 0, Green: 0, Leathery: 0,
          Oriental: 0, Powdery: 0, Smoky: 0, Resinous: 0, Sweet: 0, Synthetic: 0
        }
      },
      {
        id: '3',
        brand: 'Chanel',
        name: 'Bleu de Chanel',
        imageUrl: '/images/bleu.jpg',
        seasons: { spring: 30, summer: 20, autumn: 30, winter: 20 },
        occasions: { daily: 20, business: 35, leisure: 15, sport: 5, evening: 20, 'night out': 5 },
        types: {
          Woody: 35,
          Citrus: 25,
          Fresh: 20,
          Spicy: 15,
          Synthetic: 5,
          Animalic: 0, Aquatic: 0, Floral: 0, Chypre: 0, Creamy: 0, Earthy: 0,
          Fougere: 0, Fruity: 0, Gourmand: 0, Green: 0, Leathery: 0,
          Oriental: 0, Powdery: 0, Smoky: 0, Resinous: 0, Sweet: 0
        }
      },
      {
        id: '4',
        brand: 'Yves Saint Laurent',
        name: "La Nuit de L'Homme",
        imageUrl: '/images/lanuit.jpg',
        seasons: { spring: 15, summer: 5, autumn: 35, winter: 45 },
        occasions: { daily: 5, business: 10, leisure: 10, sport: 0, evening: 40, 'night out': 35 },
        types: {
          Spicy: 35,
          Oriental: 30,
          Woody: 20,
          Sweet: 10,
          Powdery: 5,
          Animalic: 0, Aquatic: 0, Floral: 0, Chypre: 0, Creamy: 0, Earthy: 0,
          Fougere: 0, Fresh: 0, Fruity: 0, Gourmand: 0, Green: 0, Leathery: 0,
          Smoky: 0, Resinous: 0, Synthetic: 0, Citrus: 0
        }
      }
    ];
    await writeFragrances(mockData);
    console.log('✅ Initialized with mock data');
  }
}

// Start server
app.listen(PORT, async () => {
  await initializeData();
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
