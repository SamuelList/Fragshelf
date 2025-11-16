# Neon PostgreSQL Setup for FragShelf

## Prerequisites
- Netlify account with Neon extension installed
- GitHub repository connected to Netlify

## Step 1: Create Neon Database

1. Go to your Netlify dashboard
2. Navigate to your FragShelf site
3. Click on **Integrations** in the left sidebar
4. Find **Neon** and click **Configure** (or **Enable** if not yet installed)
5. Click **Create database** or select an existing database
6. Copy the connection string (starts with `postgresql://`)

## Step 2: Add Environment Variable

1. In your Netlify site dashboard, go to **Site configuration** → **Environment variables**
2. Click **Add a variable**
3. Set:
   - **Key**: `DATABASE_URL`
   - **Value**: Your Neon connection string from Step 1
   - **Scopes**: Check both "Same value for all deploy contexts"
4. Click **Save**

## Step 3: Deploy and Initialize Database

1. Push your code to trigger a deployment:
   ```bash
   git add -A
   git commit -m "Add PostgreSQL integration"
   git push origin main
   ```

2. Once deployed, initialize the database schema by visiting:
   ```
   https://your-site.netlify.app/api/migrate
   ```
   
   You should see:
   ```json
   {
     "message": "Database schema initialized successfully",
     "timestamp": "..."
   }
   ```

## Step 4: Test the Setup

1. Sign up for a new account on your site
2. Add some fragrances
3. Close the browser and come back later
4. Your account and fragrances should still be there! 🎉

## Debugging

View current database contents:
- **Users**: `https://your-site.netlify.app/api/auth/debug`
- **Fragrances**: `https://your-site.netlify.app/api/fragrances/debug`

## Local Development

To test locally with Neon:

1. Create a `.env` file in the project root:
   ```env
   DATABASE_URL=your_neon_connection_string
   ```

2. Run your local dev server (if using Netlify Dev, it will pick up the env var)

## Database Schema

The migration creates two tables:

### `users` table
- `id` (serial, primary key)
- `username` (varchar, unique)
- `password` (varchar) - *TODO: Hash passwords for production*
- `created_at` (timestamp)

### `fragrances` table
- `id` (serial, primary key)
- `user_id` (integer, foreign key to users)
- `brand` (varchar)
- `name` (varchar)
- `image_url` (text)
- `seasons` (jsonb)
- `occasions` (jsonb)
- `types` (jsonb)
- `created_at` (timestamp)
- `updated_at` (timestamp)

## Next Steps (Optional Improvements)

1. **Password Hashing**: Use bcrypt to hash passwords
2. **JWT Tokens**: Replace base64 tokens with proper JWT
3. **Input Validation**: Add more robust validation
4. **Indexes**: Add more indexes for better query performance
5. **Remove Debug Endpoints**: Delete `/debug` endpoints before production

## Troubleshooting

**Error: "DATABASE_URL environment variable is not set"**
- Make sure you added the environment variable in Netlify
- Redeploy after adding the variable

**Error: "Failed to initialize schema"**
- Check that your Neon database is active
- Verify the connection string is correct
- Make sure your Neon project has enough resources (check free tier limits)

**Data still disappearing**
- Make sure you visited `/api/migrate` to create the tables
- Check the debug endpoints to verify data is being saved
- Check Netlify function logs for errors
