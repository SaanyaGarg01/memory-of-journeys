# Python Backend - Memory of Journeys

## ✅ Complete FastAPI Backend with All Features

### Features Implemented:
- ✅ **Albums** - Photo album management
- ✅ **Future Plans** - Travel planning
- ✅ **Journeys** - Journey CRUD operations
- ✅ **Memory Circles** - Private groups for sharing journeys
- ✅ **Collaborative Journals** - Co-write travel stories
- ✅ **Anonymous Story Exchange** - Trade travel memories anonymously

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd backend-python
pip install -r requirements.txt
```

### 2. Configure Database

Create/edit `.env` file:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=memory_of_journeys
```

### 3. Run the Server

```bash
python main.py
```

**Server will start on: `http://localhost:8080`**

---

## 📡 API Endpoints

### Memory Circles
- `POST /api/memory-circles` - Create circle
- `GET /api/memory-circles?user_id={uid}` - List user's circles
- `GET /api/memory-circles/{id}` - Get circle details
- `POST /api/memory-circles/{id}/members` - Add member
- `POST /api/memory-circles/{id}/journeys` - Share journey

### Collaborative Journals
- `POST /api/collaborative-journals` - Create journal
- `GET /api/collaborative-journals?user_id={uid}` - List user's journals
- `GET /api/collaborative-journals/{id}` - Get journal details
- `POST /api/collaborative-journals/{id}/entries` - Add entry
- `POST /api/collaborative-journals/{id}/members` - Add member

### Anonymous Story Exchange
- `POST /api/anonymous-memories` - Submit memory
- `GET /api/anonymous-memories?travel_type={type}` - List memories
- `POST /api/memory-exchanges` - Exchange memories
- `GET /api/memory-exchanges/{userId}` - Get user's exchanges

### Journeys
- `POST /api/journeys` - Create journey
- `GET /api/journeys?visibility=public` - List journeys
- `GET /api/users/{user_id}/journeys` - Get user journeys
- `GET /api/journeys/{id}` - Get journey details
- `PUT /api/journeys/{id}` - Update journey
- `POST /api/journeys/{id}/like` - Like journey

### Albums
- `POST /api/albums` - Create album
- `GET /api/albums?user_id={uid}` - List user albums
- `GET /api/albums/{id}` - Get album details
- `PUT /api/albums/{id}` - Update album
- `DELETE /api/albums/{id}` - Delete album
- `POST /api/albums/{id}/photos` - Add photo
- `GET /api/albums/{id}/photos` - List photos

### Future Plans
- `POST /api/plans` - Create plan
- `GET /api/users/{user_id}/plans` - List user plans
- `PUT /api/plans/{id}` - Update plan
- `DELETE /api/plans/{id}` - Delete plan

### Health Check
- `GET /api/health` - Server status

---

## 🗄️ Database Tables

Auto-created on startup:
- `albums`, `album_photos`, `album_pages`
- `future_plans`
- `journeys`, `journey_likes`
- `memory_circles`, `memory_circle_members`, `memory_circle_journeys`
- `collaborative_journals`, `collaborative_journal_members`, `collaborative_journal_entries`
- `anonymous_memories`, `memory_exchanges`

---

## 🔧 Configuration

### Port Configuration
Default: `8080`  
To change: Edit line 1265 in `main.py`:
```python
uvicorn.run("main:app", host="0.0.0.0", port=8080, reload=True)
```

### CORS
Currently allows all origins for development. Configured in `main.py` lines 22-30.

---

## 📝 Testing

### Test with curl:
```bash
# Health check
curl http://localhost:8080/api/health

# Create a memory circle (replace user_id with your Firebase UID)
curl -X POST http://localhost:8080/api/memory-circles \
  -H "Content-Type: application/json" \
  -d '{"name":"My Circle","description":"Friends group","owner_id":"your_user_id"}'
```

### Test with Browser:
Open: `http://localhost:8080/docs` (FastAPI auto-generated docs)

---

## 🎯 Run with Frontend

**Terminal 1 - Backend:**
```bash
cd backend-python
python main.py
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

**Frontend will connect to backend on port 8080**

---

## 🐛 Troubleshooting

### Database Connection Error
1. Check MariaDB is running: `mysql -u root -p`
2. Check credentials in `.env` file
3. Create database if missing: `CREATE DATABASE memory_of_journeys;`

### Port Already in Use
Kill process on port 8080:
```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Linux/Mac
lsof -ti:8080 | xargs kill -9
```

### Module Not Found
```bash
pip install -r requirements.txt
```

---

## 💡 Development

### Hot Reload
Server automatically reloads on code changes (uvicorn reload mode).

### Logs
All logs appear in console. Check for:
- `✅ All database tables created successfully!` on startup
- API request logs for debugging

---

## 📊 Tech Stack
- **FastAPI** - Modern async web framework
- **aiomysql** - Async MySQL/MariaDB driver
- **Uvicorn** - ASGI server
- **Pydantic** - Data validation

---

## ✨ All Features Working!
Ready for production use with persistent MariaDB storage! 🚀
