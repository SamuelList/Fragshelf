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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
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
