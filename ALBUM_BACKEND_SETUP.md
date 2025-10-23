# Photo Album Backend - Complete Setup

## What Was Added

The photo album backend now has **complete CRUD operations** for albums, photos, and pages.

## Database Schema

### Albums Table
```sql
CREATE TABLE IF NOT EXISTS albums (
  id CHAR(36) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  title VARCHAR(500) NOT NULL,
  description TEXT,
  journey_id CHAR(36),  -- Optional link to a journey
  visibility VARCHAR(20) DEFAULT 'public',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_albums_user (user_id),
  INDEX idx_albums_journey (journey_id)
)
```

### Album Photos Table
```sql
CREATE TABLE IF NOT EXISTS album_photos (
  id CHAR(36) PRIMARY KEY,
  album_id CHAR(36) NOT NULL,
  user_id VARCHAR(64) NOT NULL,
  image_url TEXT NOT NULL,
  caption VARCHAR(500),
  page_number INT DEFAULT 1,
  meta TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_album_photos_album (album_id),
  INDEX idx_album_photos_page (album_id, page_number)
)
```

### Album Pages Table
```sql
CREATE TABLE IF NOT EXISTS album_pages (
  id CHAR(36) PRIMARY KEY,
  album_id CHAR(36) NOT NULL,
  page_number INT NOT NULL,
  content TEXT,  -- User's notes/journal for this page
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uniq_album_page (album_id, page_number)
)
```

## API Endpoints

### Album Management

#### 1. List User's Albums
**GET** `/api/albums?user_id={user_id}`

**Response:**
```json
[
  {
    "id": "uuid",
    "user_id": "firebase-uid",
    "title": "My Europe Trip",
    "description": "Summer vacation 2024",
    "journey_id": "journey-uuid-or-null",
    "visibility": "public",
    "created_at": "2024-01-01T00:00:00",
    "updated_at": "2024-01-01T00:00:00"
  }
]
```

#### 2. Create Album
**POST** `/api/albums`

**Request Body:**
```json
{
  "user_id": "firebase-uid",
  "title": "My Album",
  "description": "Optional description",
  "journey_id": "optional-journey-uuid",
  "visibility": "public"
}
```

**Response:** Returns created album with generated `id`

#### 3. Get Single Album
**GET** `/api/albums/{album_id}`

**Response:** Single album object

#### 4. Update Album
**PUT** `/api/albums/{album_id}`

**Request Body:** (all fields optional)
```json
{
  "title": "Updated Title",
  "description": "New description",
  "journey_id": "new-journey-id",
  "visibility": "private"
}
```

#### 5. Delete Album
**DELETE** `/api/albums/{album_id}`

- Deletes album and all associated photos and pages
- Returns 204 No Content

---

### Photo Management

#### 1. List Photos in Album
**GET** `/api/albums/{album_id}/photos`

**Response:**
```json
[
  {
    "id": "photo-uuid",
    "album_id": "album-uuid",
    "user_id": "firebase-uid",
    "image_url": "https://...",
    "caption": "Beautiful sunset",
    "page_number": 1,
    "meta": null,
    "created_at": "2024-01-01T00:00:00"
  }
]
```

#### 2. Add Photo to Album
**POST** `/api/albums/{album_id}/photos`

**Request Body:**
```json
{
  "user_id": "firebase-uid",
  "image_url": "https://supabase-storage.../photo.jpg",
  "caption": "Optional caption",
  "page_number": 1
}
```

#### 3. Update Photo
**PUT** `/api/albums/{album_id}/photos/{photo_id}`

**Request Body:** (all fields optional)
```json
{
  "caption": "Updated caption",
  "page_number": 2
}
```

#### 4. Delete Photo
**DELETE** `/api/albums/{album_id}/photos/{photo_id}`

---

### Page Notes Management

#### 1. List All Pages
**GET** `/api/albums/{album_id}/pages`

**Response:**
```json
[
  {
    "page_number": 1,
    "content": "Notes for page 1..."
  },
  {
    "page_number": 2,
    "content": "Notes for page 2..."
  }
]
```

#### 2. Update Page Notes
**PUT** `/api/albums/{album_id}/pages/{page_number}`

**Request Body:**
```json
{
  "content": "Today we visited Paris..."
}
```

---

## Frontend Integration

### Creating an Album
```typescript
const createAlbum = async () => {
  const res = await fetch('/api/albums', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_id: user.uid,
      title: 'My Album',
      description: 'Travel memories',
      visibility: 'public'
    })
  });
  const album = await res.json();
  console.log('Created:', album);
};
```

### Loading User's Albums
```typescript
const loadAlbums = async () => {
  const res = await fetch(`/api/albums?user_id=${user.uid}`);
  const albums = await res.json();
  setAlbums(albums);
};
```

### Uploading Photo to Supabase Storage
```typescript
// 1. Upload to Supabase Storage
const path = `${user.uid}/${albumId}/${Date.now()}_${file.name}`;
const { data, error } = await supabase.storage
  .from('albums')
  .upload(path, file);

// 2. Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('albums')
  .getPublicUrl(path);

// 3. Save to backend
await fetch(`/api/albums/${albumId}/photos`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    user_id: user.uid,
    image_url: publicUrl,
    caption: 'My photo',
    page_number: 1
  })
});
```

### Updating Photo Caption/Page
```typescript
await fetch(`/api/albums/${albumId}/photos/${photoId}`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    caption: 'New caption',
    page_number: 2
  })
});
```

### Saving Page Notes
```typescript
await fetch(`/api/albums/${albumId}/pages/1`, {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content: 'Today we explored the city...'
  })
});
```

---

## Data Flow

### Album Creation Flow
```
Frontend: Create Album Form
    ↓
    POST /api/albums
    ↓
Backend: INSERT INTO albums
    ↓
    Returns album with ID
    ↓
Frontend: Add to albums list
```

### Photo Upload Flow
```
Frontend: Select photos
    ↓
Upload to Supabase Storage
    ↓
Get public URL
    ↓
    POST /api/albums/{id}/photos with URL
    ↓
Backend: INSERT INTO album_photos
    ↓
Frontend: Refresh photos for album
```

### Photo Organization Flow
```
Frontend: User moves photo to different page
    ↓
    PUT /api/albums/{id}/photos/{photo_id}
    ↓
Backend: UPDATE album_photos SET page_number = X
    ↓
Frontend: Re-render page layout
```

### Page Notes Flow
```
Frontend: User writes notes
    ↓
    PUT /api/albums/{id}/pages/{page_num}
    ↓
Backend: INSERT or UPDATE album_pages
    ↓
Frontend: Notes saved confirmation
```

---

## Features Now Working

✅ **Album Creation** - Users can create albums  
✅ **Album Listing** - Load user's albums  
✅ **Album Updates** - Edit title, description, visibility  
✅ **Album Deletion** - Delete albums with cascade  
✅ **Photo Upload** - Via Supabase Storage  
✅ **Photo Metadata** - Saved to MariaDB  
✅ **Photo Organization** - Move between pages  
✅ **Photo Captions** - Add/edit captions  
✅ **Photo Deletion** - Remove photos  
✅ **Page Notes** - Journal entries per page  
✅ **Journey Linking** - Link album to journey  

---

## Database Tables Summary

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `albums` | Album metadata | id, user_id, title, journey_id |
| `album_photos` | Photo metadata | id, album_id, image_url, page_number |
| `album_pages` | Page notes/journal | album_id, page_number, content |

All tables auto-create on backend startup!

---

## Testing

### Test Album Creation
```bash
curl -X POST http://localhost:8000/api/albums \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-123",
    "title": "Test Album",
    "description": "My test album",
    "visibility": "public"
  }'
```

### Test Listing Albums
```bash
curl "http://localhost:8000/api/albums?user_id=test-user-123"
```

### Test Adding Photo
```bash
curl -X POST http://localhost:8000/api/albums/{album-id}/photos \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test-user-123",
    "image_url": "https://example.com/photo.jpg",
    "caption": "Test photo",
    "page_number": 1
  }'
```

All endpoints are now live and ready to use! 🎉
