const { neon } = require('@netlify/neon');

// Initialize database connection (automatically uses NETLIFY_DATABASE_URL)
const getDb = () => {
  return neon();
};

// Initialize database schema
const initSchema = async () => {
  const sql = getDb();
  
  try {
    // Create users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create fragrances table
    await sql`
      CREATE TABLE IF NOT EXISTS fragrances (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        brand VARCHAR(255) NOT NULL,
        name VARCHAR(255) NOT NULL,
        image_url TEXT,
        seasons JSONB NOT NULL DEFAULT '{}',
        occasions JSONB NOT NULL DEFAULT '{}',
        types JSONB NOT NULL DEFAULT '{}',
        liked BOOLEAN DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Add liked column if it doesn't exist (for existing databases)
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

    // Add rating column (1-5 stars, replaces liked)
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='fragrances' AND column_name='rating'
        ) THEN
          ALTER TABLE fragrances ADD COLUMN rating INTEGER DEFAULT NULL;
        END IF;
      END $$;
    `;

    // Add hidden column (replaces dislike behavior)
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='fragrances' AND column_name='hidden'
        ) THEN
          ALTER TABLE fragrances ADD COLUMN hidden BOOLEAN DEFAULT FALSE;
        END IF;
      END $$;
    `;

    // Add review column if it doesn't exist (for existing databases)
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

    // Add wearability column if it doesn't exist (for existing databases)
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='fragrances' AND column_name='wearability'
        ) THEN
          ALTER TABLE fragrances ADD COLUMN wearability JSONB DEFAULT '{"special_occasion": 50, "daily_wear": 50}';
        END IF;
      END $$;
    `;

    // Add occasion_months column if it doesn't exist (for "What to Wear" feature)
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='fragrances' AND column_name='occasion_months'
        ) THEN
          ALTER TABLE fragrances ADD COLUMN occasion_months JSONB DEFAULT NULL;
        END IF;
      END $$;
    `;

    // Add formality column if it doesn't exist
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='fragrances' AND column_name='formality'
        ) THEN
          ALTER TABLE fragrances ADD COLUMN formality VARCHAR(50) DEFAULT NULL;
        END IF;
      END $$;
    `;

    // Add midday_touch_up column if it doesn't exist
    await sql`
      DO $$ 
      BEGIN 
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='fragrances' AND column_name='midday_touch_up'
        ) THEN
          ALTER TABLE fragrances ADD COLUMN midday_touch_up BOOLEAN DEFAULT NULL;
        END IF;
      END $$;
    `;

    // Create index on user_id for faster queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_fragrances_user_id ON fragrances(user_id)
    `;

    console.log('Database schema initialized successfully');
    return true;
  } catch (error) {
    console.error('Failed to initialize schema:', error);
    throw error;
  }
};

module.exports = { getDb, initSchema };
