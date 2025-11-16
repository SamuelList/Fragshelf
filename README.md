# Fragshelf
A simple app to store and organize my frags

## Setup

### Install Dependencies

```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

## Running the App

### Option 1: Run Both (Recommended)
```bash
npm start
```
This runs both the frontend (port 5173) and backend (port 3001) simultaneously.

### Option 2: Run Separately

**Terminal 1 - Backend:**
```bash
npm run server
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

## Access

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:3001/api

## Features

- View fragrance collection in a responsive grid
- Add new fragrances with detailed attributes
- Filter by season and occasion
- Mobile-first design
- Persistent data storage

## Tech Stack

- **Frontend:** React, TypeScript, Vite, SASS (CSS Modules)
- **Backend:** Node.js, Express
- **Storage:** JSON file-based database
