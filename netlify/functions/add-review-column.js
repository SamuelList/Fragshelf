const { getDb } = require('./db');

// Migration to add review column to fragrances table
exports.handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const sql = getDb();
    
    // Add review column if it doesn't exist
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='fragrances' AND column_name='review'
        ) THEN
          ALTER TABLE fragrances ADD COLUMN review TEXT;
        END IF;
      END $$;
    `;

    console.log('Review column added successfully');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'Review column migration completed successfully',
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error('Migration error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to add review column',
        details: error.message
      }),
    };
  }
};
