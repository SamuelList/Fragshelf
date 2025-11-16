// Mock data - each user gets their own copy
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

// In-memory storage per user (will reset on each deployment)
const userFragrances = new Map();

// Helper to verify token and get userId
const verifyToken = (token) => {
  try {
    const decoded = Buffer.from(token, 'base64').toString();
    const [userId] = decoded.split(':');
    return userId;
  } catch {
    return null;
  }
};

// Helper to get or initialize user's fragrances
const getUserFragrances = (userId) => {
  if (!userFragrances.has(userId)) {
    userFragrances.set(userId, [...MOCK_DATA]);
  }
  return userFragrances.get(userId);
};

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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

  // Parse the path to get ID if present
  const pathParts = event.path.split('/').filter(Boolean);
  const hasId = pathParts.length > 2;
  const id = hasId ? pathParts[pathParts.length - 1] : null;

  // Check for auth token (optional for GET)
  const authHeader = event.headers.authorization || event.headers.Authorization;
  let userId = null;
  let userFragrancesArray = null;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    userId = verifyToken(token);
    if (userId) {
      userFragrancesArray = getUserFragrances(userId);
    }
  }

  // For GET requests
  if (event.httpMethod === 'GET') {
    // If authenticated, return user's fragrances, otherwise return public
    const fragrances = userFragrancesArray || [...MOCK_DATA];
    
    if (!id) {
      // Get all fragrances
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(fragrances)
      };
    } else {
      // Get single fragrance
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

  // For non-GET requests, require authentication
  if (!userId) {
    return {
      statusCode: 401,
      headers,
      body: JSON.stringify({ error: 'Unauthorized' })
    };
  }

  // Get user's fragrance collection
  let fragrances = getUserFragrances(userId);

  try {

    // POST /api/fragrances
    if (event.httpMethod === 'POST') {
      const newFragrance = JSON.parse(event.body);
      newFragrance.id = Date.now().toString();
      fragrances.push(newFragrance);
      userFragrances.set(userId, fragrances); // Update the map
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(newFragrance)
      };
    }

    // PUT /api/fragrances/:id
    if (event.httpMethod === 'PUT' && id) {
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
      userFragrances.set(userId, fragrances); // Update the map
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(fragrances[index])
      };
    }

    // DELETE /api/fragrances/:id
    if (event.httpMethod === 'DELETE' && id) {
      console.log('DELETE request - ID:', id, 'Fragrances:', fragrances.map(f => f.id));
      const initialLength = fragrances.length;
      const filtered = fragrances.filter(f => f.id !== id);
      
      if (filtered.length === initialLength) {
        console.log('Fragrance not found:', id);
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Fragrance not found' })
        };
      }
      
      userFragrances.set(userId, filtered); // Update the map
      console.log('Deleted successfully, new count:', filtered.length);
      
      return {
        statusCode: 204,
        headers,
        body: ''
      };
    }

    // DEBUG: View all data (remove in production!)
    if (event.path.includes('/debug') && event.httpMethod === 'GET') {
      const allData = {};
      for (const [uid, frags] of userFragrances.entries()) {
        allData[uid] = {
          count: frags.length,
          fragrances: frags.map(f => ({ id: f.id, brand: f.brand, name: f.name }))
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          totalUsers: userFragrances.size,
          userData: allData,
          timestamp: new Date().toISOString(),
        })
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
