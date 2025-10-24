# 🌸 Memory Garden - Python Backend Setup

## ✅ Everything is Ready for Python!

I've configured the Memory Garden to work with **Python backend (main.py)**.

---

## 🚀 Quick Start:

### **1. Start Python Backend:**
```bash
cd backend-python
python main.py
```

**✅ You should see:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
✅ All database tables created successfully!
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

### **2. Start Frontend:**
```bash
# In main project directory
npm run dev
```

**✅ Opens at:** `http://localhost:5174`

### **3. Test Memory Garden:**

1. **Log in** to the app
2. **Create a journey:**
   - Go to **Create**
   - Fill in: "Beach Trip to Goa"
   - Keywords: beach, ocean, sunset
   - From: Mumbai → To: Goa
   - Click **Generate Journey**

3. **View Your Garden:**
   - Go to **AI Features**
   - Scroll down to **Bonus Features**
   - Click **Virtual Memory Garden** 🌸

4. **See Your Flower!**
   - A random flower will be planted automatically
   - Click on it to see details
   - Click **Water Plant** to make it grow

---

## 🌺 What Was Added to Python Backend:

### **1. Database Table:**
```python
# backend-python/db.py
CREATE TABLE memory_garden_plants (
  id CHAR(36) PRIMARY KEY,
  user_id VARCHAR(64) NOT NULL,
  journey_id CHAR(36),
  plant_type VARCHAR(50) NOT NULL,
  plant_name VARCHAR(255),
  growth_stage INT DEFAULT 1,
  planted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_watered DATETIME DEFAULT CURRENT_TIMESTAMP,
  position_x INT DEFAULT 0,
  position_y INT DEFAULT 0,
  color VARCHAR(20)
)
```

### **2. Auto-Plant on Journey Creation:**
```python
# backend-python/main.py - Inside create_journey()
if body.user_id and not body.user_id.startswith('anon_'):
    plant_types = ['rose', 'tulip', 'sunflower', 'lotus', 'orchid', 'lily', 'daisy', 'cherry_blossom']
    colors = ['#ef4444', '#f59e0b', '#eab308', '#22c55e', '#3b82f6', '#a855f7', '#ec4899', '#f472b6']
    random_plant = random.choice(plant_types)
    random_color = random.choice(colors)
    
    # Insert flower into database
    INSERT INTO memory_garden_plants (...)
```

### **3. API Endpoints:**

**GET /api/garden/:userId**
```python
@app.get("/api/garden/{user_id}")
async def get_garden(user_id: str):
    # Returns all plants for user
```

**POST /api/garden/water/:plantId**
```python
@app.post("/api/garden/water/{plant_id}")
async def water_plant(plant_id: str):
    # Increases growth stage by 1 (max 5)
```

---

## 🧪 Testing Flow:

### **Test 1: Verify Backend is Running**
```bash
# Open new terminal
curl http://localhost:8000/api/health
```

**Should return:**
```json
{"ok": true, "time": "2024-10-24T..."}
```

### **Test 2: Create Journey & Check Auto-Plant**

1. Create a journey in UI
2. Check backend logs - should see INSERT into memory_garden_plants
3. Go to Memory Garden
4. Should see 1 flower planted

### **Test 3: Water Plant & Watch Growth**

1. Click on flower
2. Shows growth stage 1/5
3. Click **Water Plant**
4. Growth increases: 1 → 2 → 3 → 4 → 5
5. At stage 5, shows sparkles ✨

---

## 📊 Data Flow:

```
User creates journey
       ↓
POST /api/journeys
       ↓
Python Backend:
  1. Insert journey into DB ✅
  2. Auto-plant flower:
     - Random plant type
     - Random color
     - Random position
     - INSERT into memory_garden_plants ✅
       ↓
Frontend:
  Journey saved!
       ↓
User goes to Memory Garden
       ↓
GET /api/garden/{userId}
       ↓
Python returns all plants
       ↓
Frontend displays flowers on canvas
       ↓
User clicks flower
       ↓
Shows plant details
       ↓
User clicks "Water Plant"
       ↓
POST /api/garden/water/{plantId}
       ↓
Python:
  growth_stage += 1
  UPDATE memory_garden_plants
       ↓
Frontend updates plant emoji
       ↓
Stage 5 reached: Full bloom! ✨
```

---

## 🎨 Plant Types in Python:

```python
plant_types = [
    'rose',           # 🌱 → 🌿 → 🥀 → 🌹 → 🌺
    'tulip',          # 🌱 → 🌿 → 🌷 → 🌷 → 🌷
    'sunflower',      # 🌱 → 🌿 → 🌻 → 🌻 → 🌻
    'lotus',          # 🌱 → 🌿 → 🪷 → 🪷 → 🪷
    'orchid',         # 🌱 → 🌿 → 🌸 → 🌸 → 🌸
    'lily',           # 🌱 → 🌿 → 🌺 → 🌺 → 🌺
    'daisy',          # 🌱 → 🌿 → 🌼 → 🌼 → 🌼
    'cherry_blossom'  # 🌱 → 🌿 → 🌸 → 🌸 → 🌸
]

colors = [
    '#ef4444',  # Red
    '#f59e0b',  # Orange
    '#eab308',  # Yellow
    '#22c55e',  # Green
    '#3b82f6',  # Blue
    '#a855f7',  # Purple
    '#ec4899',  # Pink
    '#f472b6'   # Light Pink
]
```

---

## 🔍 Debugging:

### **Check if table was created:**
```bash
# Connect to MariaDB
mysql -u root -p travel_memory

# Check table
SHOW TABLES LIKE 'memory_garden_plants';
DESCRIBE memory_garden_plants;
```

### **Check if flowers are being planted:**
```sql
SELECT * FROM memory_garden_plants;
```

### **Check Python logs:**
Look for errors in terminal where `python main.py` is running.

### **Test endpoints directly:**
```bash
# Get garden (replace with your user ID)
curl http://localhost:8000/api/garden/YOUR_USER_ID

# Water plant (replace with plant ID)
curl -X POST http://localhost:8000/api/garden/water/PLANT_ID
```

---

## ✅ Checklist:

- [ ] Python backend running on port 8000
- [ ] Database `travel_memory` exists
- [ ] Table `memory_garden_plants` created
- [ ] Frontend running on port 5174
- [ ] `vite.config.ts` points to port 8000
- [ ] Logged into application
- [ ] Created at least 1 journey
- [ ] Flower appeared in garden
- [ ] Can click flower to see details
- [ ] Can water flower to grow it

---

## 🎯 Expected Results:

### **After Creating 1 Journey:**
```
Memory Garden Stats:
- Total Plants: 1
- Fully Grown: 0
- Growing: 1

Garden Canvas:
- 1 flower visible (🌱 seedling)
- Random position on canvas
- Random color
```

### **After Watering 4 Times:**
```
Growth Progress:
Stage 1: 🌱 Seedling
Stage 2: 🌿 Sprout
Stage 3: 🥀 Bud
Stage 4: 🌹 Blooming
Stage 5: 🌺 Full Bloom ✨ (sparkles!)

Memory Garden Stats:
- Total Plants: 1
- Fully Grown: 1 ✨
- Growing: 0
```

### **After Creating 5 Journeys:**
```
Memory Garden Stats:
- Total Plants: 5
- Fully Grown: varies
- Growing: varies

Garden Canvas:
- 5 flowers at different positions
- Different plant types and colors
- Various growth stages
```

---

## 🚨 Common Issues:

### **Issue: No flowers appearing**
**Check:**
1. Is backend running? `curl http://localhost:8000/api/health`
2. Is database connected? Check Python logs
3. Did journey save? Check `journeys` table
4. Are you logged in (not anonymous)?

### **Issue: Can't water plant**
**Check:**
1. Is plant at max growth (stage 5)?
2. Backend logs for errors
3. Network tab in browser (F12) for 404/500 errors

### **Issue: Frontend not loading garden**
**Check:**
1. Console errors (F12)
2. API call to `/api/garden/:userId` returning data?
3. User ID is correct?

---

## 🎉 Success!

When everything works:
1. ✅ Create journey → Flower plants automatically
2. ✅ Go to Memory Garden → See flowers
3. ✅ Click flower → Details panel opens
4. ✅ Water plant → Growth increases
5. ✅ Stage 5 → Sparkles appear ✨

**Each journey is now a living, growing flower in your personal garden!** 🌸
