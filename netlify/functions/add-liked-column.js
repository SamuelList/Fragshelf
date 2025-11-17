const { getDb } = require('./db');

// Migration to add liked column
exports.handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const sql = getDb();
    
    // Add liked column if it doesn't exist
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='fragrances' AND column_name='liked'
        ) THEN
          ALTER TABLE fragrances ADD COLUMN liked BOOLEAN DEFAULT NULL;
        END IF;
      END $$;
    `;
    
    console.log('Successfully added liked column');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Successfully added liked column to fragrances table',
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error('Migration error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to add liked column',
        details: error.message
      }),
    };
  }
};
