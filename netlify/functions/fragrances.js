// Mock data
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

// In-memory storage (will reset on each deployment)
let fragrances = [...MOCK_DATA];

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  const path = event.path.replace('/.netlify/functions/fragrances', '');
  const segments = path.split('/').filter(Boolean);

  try {
    // GET /api/fragrances or GET /api/fragrances/:id
    if (event.httpMethod === 'GET') {
      if (segments.length === 0) {
        // Get all fragrances
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(fragrances)
        };
      } else {
        // Get single fragrance
        const id = segments[0];
        const fragrance = fragrances.find(f => f.id === id);
        
        if (!fragrance) {
          return {
            statusCode: 404,
            headers,
            body: JSON.stringify({ error: 'Fragrance not found' })
          };
        }
        
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(fragrance)
        };
      }
    }

    // POST /api/fragrances
    if (event.httpMethod === 'POST') {
      const newFragrance = JSON.parse(event.body);
      newFragrance.id = Date.now().toString();
      fragrances.push(newFragrance);
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newFragrance)
      };
    }

    // PUT /api/fragrances/:id
    if (event.httpMethod === 'PUT') {
      const id = segments[0];
      const index = fragrances.findIndex(f => f.id === id);
      
      if (index === -1) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Fragrance not found' })
        };
      }
      
      const updatedFragrance = JSON.parse(event.body);
      fragrances[index] = { ...updatedFragrance, id };
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(fragrances[index])
      };
    }

    // DELETE /api/fragrances/:id
    if (event.httpMethod === 'DELETE') {
      const id = segments[0];
      const initialLength = fragrances.length;
      fragrances = fragrances.filter(f => f.id !== id);
      
      if (fragrances.length === initialLength) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Fragrance not found' })
        };
      }
      
      return {
        statusCode: 204,
        headers,
        body: ''
      };
    }

    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
