const { getDb } = require('./db');

// Mock data for public viewing
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

exports.handler = async (event) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
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

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7);
    userId = verifyToken(token);
  }

  try {
    const sql = getDb();

    // For GET requests
    if (event.httpMethod === 'GET') {
      // If authenticated, return user's fragrances
      if (userId) {
        const fragrances = await sql`
          SELECT 
            id, brand, name, image_url as "imageUrl",
            seasons, occasions, types, liked
          FROM fragrances 
          WHERE user_id = ${parseInt(userId)}
          ORDER BY created_at DESC
        `;
        
        if (!id) {
          // Return user's fragrances (empty array if they have none)
          return {
            statusCode: 200,
            headers,
            body: JSON.stringify(fragrances)
          };
        } else {
          const fragrance = fragrances.find(f => String(f.id) === id);
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
      } else {
        // Return public mock data for unauthenticated users only
        return {
          statusCode: 200,
          headers,
          body: JSON.stringify(MOCK_DATA)
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

    // POST /api/fragrances
    if (event.httpMethod === 'POST') {
      const { brand, name, imageUrl, seasons, occasions, types } = JSON.parse(event.body);
      
      const result = await sql`
        INSERT INTO fragrances 
          (user_id, brand, name, image_url, seasons, occasions, types)
        VALUES 
          (${parseInt(userId)}, ${brand}, ${name}, ${imageUrl}, 
           ${JSON.stringify(seasons)}, ${JSON.stringify(occasions)}, ${JSON.stringify(types)})
        RETURNING 
          id, brand, name, image_url as "imageUrl", 
          seasons, occasions, types, liked
      `;
      
      return {
        statusCode: 201,
        headers,
        body: JSON.stringify(result[0])
      };
    }

        // PUT /api/fragrances/:id
    if (event.httpMethod === 'PUT' && id) {
      const { brand, name, imageUrl, seasons, occasions, types } = JSON.parse(event.body);
      
      const result = await sql`
        UPDATE fragrances 
        SET 
          brand = ${brand},
          name = ${name},
          image_url = ${imageUrl},
          seasons = ${JSON.stringify(seasons)},
          occasions = ${JSON.stringify(occasions)},
          types = ${JSON.stringify(types)},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${parseInt(id)} AND user_id = ${parseInt(userId)}
        RETURNING 
          id, brand, name, image_url as "imageUrl",
          seasons, occasions, types, liked
      `;
      
      if (result.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Fragrance not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result[0])
      };
    }

    // PATCH /api/fragrances/:id (for updating liked status only)
    if (event.httpMethod === 'PATCH' && id) {
      const { liked } = JSON.parse(event.body);
      
      const result = await sql`
        UPDATE fragrances 
        SET 
          liked = ${liked},
          updated_at = CURRENT_TIMESTAMP
        WHERE id = ${parseInt(id)} AND user_id = ${parseInt(userId)}
        RETURNING 
          id, brand, name, image_url as "imageUrl",
          seasons, occasions, types, liked
      `;
      
      if (result.length === 0) {
        return {
          statusCode: 404,
          headers,
          body: JSON.stringify({ error: 'Fragrance not found' })
        };
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify(result[0])
      };
    }

    // DELETE /api/fragrances/:id
    if (event.httpMethod === 'DELETE' && id) {
      console.log('DELETE request:', { id, userId, parsedId: parseInt(id), parsedUserId: parseInt(userId) });
      
      const result = await sql`
        DELETE FROM fragrances 
        WHERE id = ${parseInt(id)} AND user_id = ${parseInt(userId)}
        RETURNING id
      `;
      
      console.log('DELETE result:', result);
      
      if (result.length === 0) {
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

    // DEBUG: View all data (remove in production!)
    if (event.path.includes('/debug') && event.httpMethod === 'GET') {
      const allFragrances = await sql`
        SELECT 
          f.id, f.user_id, u.username, f.brand, f.name,
          f.created_at
        FROM fragrances f
        JOIN users u ON f.user_id = u.id
        ORDER BY f.user_id, f.created_at DESC
      `;
      
      const userData = {};
      for (const frag of allFragrances) {
        const uid = String(frag.user_id);
        if (!userData[uid]) {
          userData[uid] = {
            username: frag.username,
            count: 0,
            fragrances: []
          };
        }
        userData[uid].count++;
        userData[uid].fragrances.push({
          id: String(frag.id),
          brand: frag.brand,
          name: frag.name
        });
      }
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          totalUsers: Object.keys(userData).length,
          userData,
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
    console.error('Fragrances function error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: error.message })
    };
  }
};
