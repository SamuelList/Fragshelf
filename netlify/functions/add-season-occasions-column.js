const { getDb } = require('./db');

// Migration to add season_occasions column to fragrances table
exports.handler = async () => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json',
  };

  try {
    const sql = getDb();
    
    // Add season_occasions column if it doesn't exist
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='fragrances' AND column_name='season_occasions'
        ) THEN
          ALTER TABLE fragrances ADD COLUMN season_occasions JSONB;
        END IF;
      END $$;
    `;

    console.log('season_occasions column added successfully');
    
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({ 
        message: 'season_occasions column migration completed successfully',
        timestamp: new Date().toISOString()
      }),
    };
  } catch (error) {
    console.error('Migration error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: 'Failed to add season_occasions column',
        details: error.message
      }),
    };
  }
};
