const { initSchema } = require('./db');

// Simple migration runner
exports.handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    await initSchema();
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Database schema initialized successfully',
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error('Migration error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to initialize database',
        details: error.message
      }),
    };
  }
};
