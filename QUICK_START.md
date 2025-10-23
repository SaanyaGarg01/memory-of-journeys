# 🚀 Quick Start - Fix Photo Upload Now

## The Problem
"Internal Server Error" when uploading photos = **Backend API is not working**

---

## ⚡ Quick Fix (3 Steps)

### 1️⃣ Start the Backend

**Open Terminal 1:**
```bash
cd backend-python
python main.py
```

**Wait for this message:**
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ **Backend is now running!**

❌ **If you see errors:**
- Database error → Create `.env` file in `backend-python/` with:
  ```env
  DB_HOST=localhost
  DB_PORT=3306
  DB_USER=root
  DB_PASSWORD=your_mariadb_password
  DB_NAME=memory_of_journeys
  ```
- Connection refused → Start MariaDB first

---

### 2️⃣ Configure Supabase

**Create `.env` file in project root:**
```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Get these values from:**
- Supabase Dashboard → Settings → API
- Copy "Project URL" and "anon public" key

**In Supabase Storage:**
1. Go to Storage → `albums` bucket
2. Make sure it's marked as **Public** ✅
3. Add policies (Policies tab):

```sql
CREATE POLICY "Allow public read" ON storage.objects
FOR SELECT TO public USING (bucket_id = 'albums');

CREATE POLICY "Allow authenticated insert" ON storage.objects
FOR INSERT TO authenticated WITH CHECK (bucket_id = 'albums');

CREATE POLICY "Allow authenticated update" ON storage.objects
FOR UPDATE TO authenticated USING (bucket_id = 'albums');

CREATE POLICY "Allow authenticated delete" ON storage.objects
FOR DELETE TO authenticated USING (bucket_id = 'albums');
```

---

### 3️⃣ Start Frontend

**Open Terminal 2:**
```bash
npm run dev
```

**Visit:** http://localhost:5173

---

## ✅ Test Upload

1. Press **F12** → Console tab (keep this open!)
2. Go to **Photo Album** section
3. Create a new album
4. Try uploading a photo
5. **Watch the console** - you'll see exactly where it fails:

```
📤 Uploading: photo.jpg
📁 Upload path: ...
✅ Uploaded to Supabase       ← Supabase is working
🔗 Public URL: https://...   ← Got public URL
💾 Saving metadata: {...}    ← Calling backend API
✅ Photo saved successfully   ← Backend saved to database
```

---

## 🔍 Common Issues

### "Connection refused" in console
→ Backend is not running on port 8000
→ Run `cd backend-python && python main.py`

### "Supabase: new row violates row-level security"
→ Bucket policies not set
→ Add the 4 policies above in Supabase

### "Backend API (500): Database error"
→ Check backend terminal for exact error
→ Usually: MariaDB not running or wrong credentials

### "No public URL returned"
→ Bucket not marked as Public
→ Go to Supabase Storage → albums → Settings → Check "Public bucket"

---

## 📝 Checklist

Before uploading:
- [ ] Backend running (port 8000)
- [ ] MariaDB running
- [ ] Supabase bucket `albums` created
- [ ] Bucket marked as Public
- [ ] 4 policies added (SELECT, INSERT, UPDATE, DELETE)
- [ ] `.env` file in project root with Supabase credentials
- [ ] Frontend running (port 5173)
- [ ] Logged in with account

---

## 🆘 Still Not Working?

**Open F12 → Console tab and tell me:**
1. Which step shows ❌ instead of ✅?
2. What's the exact error message?

**Common answers:**
- ❌ at "Uploading to Supabase" = Supabase policy issue
- ❌ at "Saving metadata" = Backend not running or wrong port
- ❌ at "Photo saved successfully" = Database error (check backend terminal)

---

**The detailed logs will tell you exactly what's wrong!** 🔍
