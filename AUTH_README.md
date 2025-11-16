# FragShelf Authentication System

## Overview
FragShelf now includes a user authentication system that allows users to create accounts and maintain their own private fragrance collections.

## Features

### User Authentication
- **Sign Up**: Create a new account with username and password
- **Login**: Access your account with credentials
- **Logout**: Securely sign out from your session
- **Session Persistence**: Stay logged in across browser sessions

### User-Specific Collections
- Each user has their own isolated fragrance collection
- Data is stored per-user in memory (will reset on function cold start)
- Users cannot access other users' fragrances

### Demo Account
For testing purposes, a demo account is available:
- Username: `demo`
- Password: `demo123`

## Technical Implementation

### Frontend Components
- **AuthModal**: Login/signup form with validation
- **AuthContext**: React context providing authentication state
- **useAuth Hook**: Access authentication methods anywhere in the app

### Backend
- **Authentication Function** (`/netlify/functions/auth.js`):
  - `/api/auth/login`: Login endpoint
  - `/api/auth/signup`: User registration
  - `/api/auth/verify`: Token validation
  
- **Fragrances Function** (`/netlify/functions/fragrances.js`):
  - Now requires authentication token
  - Stores fragrances per user in Map
  - Validates tokens on every request

### Security
- Tokens are base64-encoded (for demo purposes)
- ⚠️ **Note**: In production, you should:
  - Use JWT tokens with proper signing
  - Hash passwords with bcrypt
  - Use a real database for persistent storage
  - Implement proper session management

### Authentication Flow
1. User opens app → AuthModal appears if not logged in
2. User signs up/logs in → Token stored in localStorage
3. Token sent with all API requests via Authorization header
4. Backend validates token and associates data with user
5. User clicks logout → Token cleared from localStorage

## API Endpoints

### Auth Endpoints
```
POST /api/auth/login
Body: { username: string, password: string }
Response: { user: { id, username }, token: string }

POST /api/auth/signup
Body: { username: string, password: string }
Response: { user: { id, username }, token: string }

GET /api/auth/verify
Headers: { Authorization: "Bearer <token>" }
Response: { user: { id, username } }
```

### Fragrance Endpoints
All fragrance endpoints now require authentication:
```
Authorization: Bearer <token>
```

## Local Development
```bash
# Start dev server with Netlify functions
npx netlify dev

# App will be available at http://localhost:8888
```

## Usage
1. Open the app
2. Sign up with a new username/password or use demo account
3. Add, view, filter, and delete fragrances
4. Your collection is private to your account
5. Logout when done

## Future Improvements
- Implement JWT with proper signing
- Add password hashing (bcryptjs)
- Use a database for persistent storage
- Add password reset functionality
- Implement email verification
- Add OAuth providers (Google, GitHub, etc.)
- Add profile management
- Implement refresh tokens
