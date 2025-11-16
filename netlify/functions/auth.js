// In-memory user storage (will reset on function cold start)
let users = [
  { id: '1', username: 'demo', password: 'demo123' } // Demo user for testing
];

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

      const user = users.find(
        (u) => u.username === username && u.password === password
      );

      if (!user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'Invalid username or password' }),
        };
      }

      const token = generateToken(user.id);

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          user: { id: user.id, username: user.username },
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
      if (users.find((u) => u.username === username)) {
        return {
          statusCode: 409,
          headers,
          body: JSON.stringify({ message: 'Username already exists' }),
        };
      }

      // Create new user
      const newUser = {
        id: String(users.length + 1),
        username,
        password, // In production, hash this!
      };

      users.push(newUser);

      const token = generateToken(newUser.id);

      return {
        statusCode: 201,
        headers,
        body: JSON.stringify({
          user: { id: newUser.id, username: newUser.username },
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

      const user = users.find((u) => u.id === userId);
      if (!user) {
        return {
          statusCode: 401,
          headers,
          body: JSON.stringify({ message: 'User not found' }),
        };
      }

      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          user: { id: user.id, username: user.username },
        }),
      };
    }

    // DEBUG: View all users (remove in production!)
    if (path === '/debug' && event.httpMethod === 'GET') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          users: users.map(u => ({ id: u.id, username: u.username })),
          totalUsers: users.length,
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
