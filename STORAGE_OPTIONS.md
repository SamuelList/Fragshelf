# Storage Options for FragShelf

## Current Problem
- Serverless functions reset on cold starts (~15 min inactivity)
- In-memory storage loses all user accounts and fragrances
- localStorage only works client-side, not shared across devices

## Solutions (Best to Easiest)

### 1. **Neon PostgreSQL (RECOMMENDED)** ⭐
- **Why**: You already have Neon extension installed in Netlify
- **Setup**: 5-10 minutes
- **Cost**: Free tier: 500MB storage, 1 project
- **Pros**: 
  - Real SQL database with relations
  - Serverless-friendly (connection pooling)
  - Auto-scaling, no maintenance
  - Persist forever
- **Cons**: Need to write SQL queries or use an ORM

**Implementation:**
```bash
npm install @neondatabase/serverless
```

### 2. **Netlify Blobs**
- **Why**: Built into Netlify, zero config
- **Setup**: 2 minutes
- **Cost**: Free tier: 1GB storage
- **Pros**:
  - Simple key-value storage
  - No external services
  - Works immediately
- **Cons**: 
  - Simple key-value only (no queries)
  - Need to structure data carefully

**Implementation:**
```bash
npm install @netlify/blobs
```

### 3. **Supabase** (PostgreSQL + Auth)
- **Why**: PostgreSQL + built-in authentication
- **Setup**: 10-15 minutes
- **Cost**: Free tier: 500MB database, 50K monthly active users
- **Pros**:
  - Full PostgreSQL database
  - Built-in authentication (replace custom auth)
  - Real-time subscriptions
  - Auto-generated REST API
- **Cons**: Another external service

### 4. **MongoDB Atlas**
- **Why**: NoSQL document database
- **Setup**: 10 minutes
- **Cost**: Free tier: 512MB storage
- **Pros**:
  - Document model matches your JSON structure
  - Easy to get started
  - Good free tier
- **Cons**: Another external service

### 5. **Upstash Redis**
- **Why**: Serverless Redis for session data
- **Setup**: 5 minutes
- **Cost**: Free tier: 10K commands/day
- **Pros**:
  - Very fast
  - Serverless-optimized
  - Good for caching + session storage
- **Cons**: Not ideal for complex queries

## Recommendation for FragShelf

**Go with Neon PostgreSQL** because:
1. You already have it installed in Netlify
2. Perfect for your data structure (users, fragrances with relations)
3. Free tier is generous
4. Serverless-native (no connection pool issues)
5. Easy to query with SQL

### Quick Setup:
1. Create Neon database in Netlify dashboard
2. Get connection string
3. Add to environment variables
4. Update functions to use Neon instead of in-memory Map

Would you like me to implement Neon integration?
