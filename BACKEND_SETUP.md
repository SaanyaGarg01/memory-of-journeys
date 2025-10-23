# Backend Setup Guide

## Quick Fix Summary

The backend was missing journey endpoints. All endpoints have been added to support:
- ✅ Creating journeys
- ✅ Reading/listing journeys
- ✅ Updating journeys
- ✅ Deleting journeys
- ✅ Liking journeys
- ✅ Viewing journey counts
- ✅ User profile journeys

## Database Setup

### 1. Install MariaDB
Make sure MariaDB is installed and running on your system.

### 2. Create Database
```sql
CREATE DATABASE IF NOT EXISTS memory_of_journeys;
USE memory_of_journeys;
```

The tables will be created automatically when you start the backend for the first time.

## Backend Python Setup

### 1. Navigate to backend folder
```bash
cd backend-python
```

### 2. Create .env file
Create a `.env` file in the `backend-python` folder with the following content:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password_here
DB_NAME=memory_of_journeys
```

**Important**: Replace `your_password_here` with your actual MariaDB root password.

### 3. Install Python dependencies
```bash
# Create virtual environment (if not exists)
python -m venv .venv

# Activate virtual environment
# On Windows:
.venv\Scripts\activate
# On Mac/Linux:
source .venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

### 4. Start the backend server
```bash
python main.py
```

The backend will start on `http://localhost:8000` and automatically:
- Create database tables (journeys, journey_likes, album_photos, album_pages, future_plans)
- Initialize the connection pool
- Start serving API endpoints

## Frontend Setup

### 1. Install Node dependencies (if not done)
```bash
npm install
```

### 2. Start the Vite dev server
```bash
npm run dev
```

The frontend will start on `http://localhost:5173` and automatically proxy API requests to the Python backend.

## Testing the Backend

### Test Endpoints
Once both servers are running, you can test the endpoints:

1. **Health Check**
   ```bash
   curl http://localhost:8000/api/health
   ```

2. **List Journeys**
   ```bash
   curl http://localhost:8000/api/journeys
   ```

3. **Create Journey** (replace USER_ID with actual Firebase UID)
   ```bash
   curl -X POST http://localhost:8000/api/journeys \
     -H "Content-Type: application/json" \
     -d '{
       "user_id": "test-user-123",
       "title": "My Test Journey",
       "journey_type": "solo",
       "legs": [],
       "keywords": ["adventure", "exploration"]
     }'
   ```

## API Endpoints Reference

### Journeys
- `GET /api/journeys` - List all public journeys (supports ?visibility=public&journey_type=solo&limit=20)
- `GET /api/users/{user_id}/journeys` - Get journeys for a specific user
- `POST /api/journeys` - Create new journey
- `GET /api/journeys/{journey_id}` - Get journey by ID (increments views)
- `PUT /api/journeys/{journey_id}` - Update journey
- `DELETE /api/journeys/{journey_id}` - Delete journey
- `POST /api/journeys/{journey_id}/like` - Like a journey

### Albums
- `GET /api/albums?user_id={user_id}` - List all albums for a user
- `POST /api/albums` - Create new album
- `GET /api/albums/{album_id}` - Get single album
- `PUT /api/albums/{album_id}` - Update album
- `DELETE /api/albums/{album_id}` - Delete album (and all photos/pages)

### Album Photos
- `GET /api/albums/{album_id}/photos` - List photos in album
- `POST /api/albums/{album_id}/photos` - Add photo to album
- `PUT /api/albums/{album_id}/photos/{photo_id}` - Update photo (caption, page)
- `DELETE /api/albums/{album_id}/photos/{photo_id}` - Delete photo

### Album Pages
- `GET /api/albums/{album_id}/pages` - List album pages with notes
- `POST /api/albums/{album_id}/pages` - Create/update page notes
- `PUT /api/albums/{album_id}/pages/{page_number}` - Update specific page notes

### Plans
- `GET /api/users/{user_id}/plans` - List user's future plans
- `POST /api/plans` - Create new plan
- `PUT /api/plans/{plan_id}` - Update plan
- `DELETE /api/plans/{plan_id}` - Delete plan

## Troubleshooting

### Backend won't start
- Make sure MariaDB is running
- Check database credentials in `.env`
- Verify port 8000 is not in use (backend now uses 8000 instead of 8080)

### Frontend can't connect to backend
- Ensure both frontend (port 5173) and backend (port 8000) are running
- Check Vite proxy configuration in `vite.config.ts`
- Look for CORS errors in browser console

### Database errors
- Make sure database `memory_of_journeys` exists
- Check that your MySQL user has proper permissions
- Verify MariaDB version is 10.5+ (for JSON support)

### Journey data not saving
- Check browser console for API errors
- Verify backend logs for error messages
- Test endpoints directly with curl
- Ensure user is logged in with Firebase (journeys need user_id)

## Changes Made

### Database Schema (`backend-python/db.py`)
- Added `journeys` table with full schema
- Added `journey_likes` table for tracking likes
- Tables auto-create on startup

### API Endpoints (`backend-python/main.py`)
- Added complete CRUD operations for journeys
- Added journey listing with filters
- Added user-specific journey retrieval
- Added like functionality
- Added automatic view counting
- All endpoints return proper JSON responses

### Data Flow
1. Frontend creates journey → POST `/api/journeys`
2. Backend saves to MariaDB → Returns journey with ID
3. Frontend displays journey in feed
4. User likes journey → POST `/api/journeys/{id}/like`
5. Backend increments counter → Returns new count
6. User deletes journey → DELETE `/api/journeys/{id}`
7. Backend removes from DB → Frontend updates UI

All backend issues should now be resolved!
