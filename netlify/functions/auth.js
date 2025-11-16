const { getDb } = require('./db');

// Simple token generation (in production, use JWT)
const generateToken = (userId) => {
  return Buffer.from(`${userId}:${Date.now()}`).toString('base64');
};

// Verify token and return userId
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
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  const path = event.path.replace('/.netlify/functions/auth', '').replace('/api/auth', '');

  try {
    const sql = getDb();

    // LOGIN
    if (path === '/login' && event.httpMethod === 'POST') {
      const { username, password } = JSON.parse(event.body);

      if (!username || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Username and password required' }),
        };
      }

      const users = await sql`
        SELECT id, username FROM users 
        WHERE username = ${username} AND password = ${password}
      `;

      if (users.length === 0) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'Invalid username or password' }),
        };
      }

      const user = users[0];
      const token = generateToken(String(user.id));

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          user: { id: String(user.id), username: user.username },
          token,
        }),
      };
    }

    // SIGNUP
    if (path === '/signup' && event.httpMethod === 'POST') {
      const { username, password } = JSON.parse(event.body);

      if (!username || !password) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Username and password required' }),
        };
      }

      if (password.length < 6) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ message: 'Password must be at least 6 characters' }),
        };
      }

      // Check if username already exists
      const existing = await sql`
        SELECT id FROM users WHERE username = ${username}
      `;

      if (existing.length > 0) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ message: 'Username already exists' }),
        };
      }

      // Create new user
      const newUsers = await sql`
        INSERT INTO users (username, password)
        VALUES (${username}, ${password})
        RETURNING id, username
      `;

      const newUser = newUsers[0];
      const token = generateToken(String(newUser.id));

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          user: { id: String(newUser.id), username: newUser.username },
          token,
        }),
      };
    }

    // VERIFY TOKEN (for session validation)
    if (path === '/verify' && event.httpMethod === 'GET') {
      const authHeader = event.headers.authorization;
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'Unauthorized' }),
        };
      }

      const token = authHeader.substring(7);
      const userId = verifyToken(token);

      if (!userId) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'Invalid token' }),
        };
      }

      const users = await sql`
        SELECT id, username FROM users WHERE id = ${parseInt(userId)}
      `;

      if (users.length === 0) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'User not found' }),
        };
      }

      const user = users[0];

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          user: { id: String(user.id), username: user.username },
        }),
      };
    }

    // DEBUG: View all users (remove in production!)
    if (path === '/debug' && event.httpMethod === 'GET') {
      const allUsers = await sql`
        SELECT id, username, created_at FROM users ORDER BY id
      `;

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          users: allUsers.map(u => ({ 
            id: String(u.id), 
            username: u.username,
            created_at: u.created_at
          })),
          totalUsers: allUsers.length,
          timestamp: new Date().toISOString(),
        }),
      };
    }

    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: 'Not found' }),
    };
  } catch (error) {
    console.error('Auth error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ message: 'Server error' }),
    };
  }
};
