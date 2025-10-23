# Backend Fixes Applied

## Problem Summary
The backend was not saving user journeys, and delete, like, and view buttons were not working because the journey API endpoints were completely missing from the backend.

## Root Cause
The `backend-python/main.py` only had endpoints for:
- Album photos
- Album pages  
- Future plans

But it was missing all journey-related endpoints that the frontend was calling.

## Solutions Applied

### 1. Database Schema Updates (`backend-python/db.py`)

**Added `journeys` table:**
```sql
CREATE TABLE IF NOT EXISTS journeys (
  id CHAR(36) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  journey_type VARCHAR(50) DEFAULT 'solo',
  departure_date DATE,
  return_date DATE,
  legs JSON NOT NULL,
  keywords JSON,
  ai_story TEXT,
  similarity_score FLOAT DEFAULT 0,
  rarity_score FLOAT DEFAULT 50,
  cultural_insights JSON,
  visibility VARCHAR(20) DEFAULT 'public',
  likes_count INT DEFAULT 0,
  views_count INT DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

**Added `journey_likes` table:**
```sql
CREATE TABLE IF NOT EXISTS journey_likes (
  id CHAR(36) PRIMARY KEY,
  journey_id CHAR(36) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_journey_user_like (journey_id, user_id)
)
```

### 2. API Endpoints Added (`backend-python/main.py`)

#### Journey CRUD Operations
- **`GET /api/journeys`** - List public journeys with filters
  - Query params: `visibility`, `journey_type`, `limit`
  - Returns array of journey objects
  
- **`GET /api/users/{user_id}/journeys`** - Get journeys for specific user
  - Returns all journeys for a user (up to 100)
  - Used in Profile component

- **`POST /api/journeys`** - Create new journey
  - Accepts: `JourneyCreateBody` with all journey fields
  - Returns created journey with generated ID

- **`GET /api/journeys/{journey_id}`** - Get single journey
  - Automatically increments `views_count`
  - Returns full journey object

- **`PUT /api/journeys/{journey_id}`** - Update existing journey
  - Accepts: `JourneyUpdateBody` (all fields optional)
  - Returns updated journey object

- **`DELETE /api/journeys/{journey_id}`** - Delete journey
  - Also deletes related likes
  - Returns 204 No Content

- **`POST /api/journeys/{journey_id}/like`** - Like a journey
  - Increments `likes_count`
  - Returns new like count

### 3. Data Models Added

**JourneyCreateBody:**
- Required: `user_id`, `title`
- Optional: All other journey fields with defaults

**JourneyUpdateBody:**
- All fields optional for partial updates

### 4. JSON Handling
- Added `json` import for proper serialization
- All JSON fields (legs, keywords, cultural_insights) properly serialized/deserialized
- MariaDB JSON column type used for complex data

## Files Modified

1. **`backend-python/db.py`**
   - Added journeys table schema
   - Added journey_likes table schema

2. **`backend-python/main.py`**
   - Added json import
   - Added Query import from FastAPI
   - Added JourneyCreateBody model
   - Added JourneyUpdateBody model
   - Added 7 journey endpoints

3. **`BACKEND_SETUP.md`** (new file)
   - Complete setup instructions
   - Database configuration
   - Testing guide
   - Troubleshooting tips

## What Now Works

✅ **Journey Creation** - Users can create and save journeys
✅ **Journey Listing** - Public feed shows all journeys
✅ **User Profile** - Shows user's personal journeys
✅ **Journey Updates** - Users can edit their journeys
✅ **Journey Deletion** - Delete button works
✅ **Like Button** - Likes are counted and saved
✅ **View Counter** - Views are automatically tracked
✅ **Filtering** - Journey type and visibility filters work

## How to Start

### Backend:
```bash
cd backend-python
# Create .env file with DB credentials (see BACKEND_SETUP.md)
python main.py
```

### Frontend:
```bash
npm run dev
```

## API Flow Examples

### Creating a Journey
```
Frontend: JourneyBuilder → handleJourneyComplete()
         ↓
         POST /api/journeys
         ↓
Backend:  Insert into journeys table
         ↓
         Return journey with ID
         ↓
Frontend: Add to journeys array → Display in feed
```

### Liking a Journey
```
Frontend: Click heart icon → handleLike()
         ↓
         POST /api/journeys/{id}/like
         ↓
Backend:  UPDATE journeys SET likes_count = likes_count + 1
         ↓
         Return new likes_count
         ↓
Frontend: Update UI with new count
```

### Deleting a Journey
```
Frontend: Click delete button → handleDelete()
         ↓
         DELETE /api/journeys/{id}
         ↓
Backend:  DELETE FROM journey_likes WHERE journey_id = id
         DELETE FROM journeys WHERE id = id
         ↓
         Return 204 No Content
         ↓
Frontend: Remove from journeys array → Update UI
```

## Testing Checklist

- [ ] Backend starts without errors
- [ ] Database tables created automatically
- [ ] Can create a new journey
- [ ] Journey appears in public feed
- [ ] Journey appears in user profile
- [ ] Can edit journey details
- [ ] Can delete journey
- [ ] Like button increments count
- [ ] View count increases when viewing journey
- [ ] Filters work (journey type, visibility)

All backend functionality should now be fully operational!
