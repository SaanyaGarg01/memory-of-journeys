# 📸 Photo Upload Troubleshooting - "Internal Server Error"

## 🔍 Finding the Exact Problem

Since you're getting "internal server error", let's diagnose exactly where it's failing.

---

## Step 1: Check Backend is Running

**Open a terminal and run:**
```bash
cd backend-python
python main.py
```

**You should see:**
```
INFO:     Started server process
INFO:     Waiting for application startup.
INFO:     Application startup complete.
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ **If you see this** → Backend is running, continue to Step 2  
❌ **If you see errors** → Check the error message and fix it first

**Common backend errors:**
- `Connection refused` → MariaDB is not running
- `Access denied` → Wrong database password in `.env`
- `Unknown database` → Database 'memory_of_journeys' doesn't exist

---

## Step 2: Verify Database Connection

**In the backend terminal, you should see:**
```
INFO:     Application startup complete.
```

This means the database tables were created successfully.

**If you see database errors:**
1. Make sure MariaDB is running
2. Create the database:
   ```sql
   CREATE DATABASE IF NOT EXISTS memory_of_journeys;
   ```
3. Check your `backend-python/.env` file has correct credentials

---

## Step 3: Test the Backend API Directly

**Open a new terminal and run:**
```bash
# Test health check
curl http://localhost:8000/api/health
```

**Expected response:**
```json
{"ok":true,"time":"2024-..."}
```

✅ **If you get this** → Backend API is working!  
❌ **If connection refused** → Backend is not running on port 8000

---

## Step 4: Test Album Creation

**Create a test album:**
```bash
curl -X POST http://localhost:8000/api/albums \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"test-user-123\",\"title\":\"Test Album\",\"visibility\":\"public\"}"
```

**Expected response:**
```json
{
  "id":"some-uuid",
  "user_id":"test-user-123",
  "title":"Test Album",
  ...
}
```

✅ **If you get this** → Database is working, album table exists!  
❌ **If you get error** → Check the error message in backend terminal

---

## Step 5: Try Photo Upload in Browser

**Now try uploading a photo:**

1. **Open browser DevTools** (Press F12)
2. **Go to Console tab**
3. **Try uploading a photo**
4. **Watch the console output**

You should see:
```
📤 Uploading: photo.jpg
📁 Upload path: user-id/album-id/123456_photo.jpg
✅ Uploaded to Supabase
🔗 Public URL: https://...
💾 Saving metadata: {...}
✅ Photo saved successfully: {...}
```

### What Each Step Means:

**Step 1:** `📤 Uploading: photo.jpg`
- Starting upload process

**Step 2:** `✅ Uploaded to Supabase`
- File successfully uploaded to Supabase Storage
- ❌ **If fails here:** Check Supabase bucket policies

**Step 3:** `🔗 Public URL: https://...`
- Got public URL from Supabase
- ❌ **If fails here:** Bucket must be marked as "Public"

**Step 4:** `💾 Saving metadata`
- Sending data to backend API
- ❌ **If fails here:** Backend not running or wrong port

**Step 5:** `✅ Photo saved successfully`
- Photo metadata saved to MariaDB
- ❌ **If fails here:** Check backend terminal for database errors

---

## Common Errors & Solutions

### Error: "Backend API (500): Database error"

**Backend terminal shows:**
```
❌ Error saving photo: Table 'memory_of_journeys.album_photos' doesn't exist
```

**Solution:**
1. Stop backend (Ctrl+C)
2. Run again: `python main.py`
3. Tables will be created automatically

---

### Error: "Backend API (500): Connection refused"

**Backend is not running!**

**Solution:**
```bash
cd backend-python
python main.py
```

---

### Error: "Supabase: new row violates row-level security policy"

**Supabase policies are not set correctly**

**Solution:**
1. Go to Supabase Dashboard → Storage → `albums` bucket
2. Click "Policies" tab
3. Add these policies:

```sql
-- Policy 1: Allow INSERT for authenticated users
CREATE POLICY "Allow authenticated insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'albums');

-- Policy 2: Allow SELECT for everyone (public read)
CREATE POLICY "Allow public select"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'albums');

-- Policy 3: Allow UPDATE for authenticated users
CREATE POLICY "Allow authenticated update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'albums');

-- Policy 4: Allow DELETE for authenticated users
CREATE POLICY "Allow authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'albums');
```

---

### Error: "No public URL returned"

**Bucket is not marked as Public**

**Solution:**
1. Go to Supabase Dashboard → Storage
2. Click on `albums` bucket
3. Click settings (⚙️ icon)
4. Check ✅ "Public bucket"
5. Save

---

### Error: "Failed to fetch"

**CORS error or backend not running**

**Solution:**
1. Make sure backend is running on port 8000
2. Make sure frontend is running on port 5173
3. Check `vite.config.ts` has proxy to port 8000:
   ```ts
   proxy: {
     '/api': {
       target: 'http://localhost:8000',
       changeOrigin: true,
     },
   }
   ```

---

## Complete Checklist

Run through this checklist:

### Backend
- [ ] MariaDB is running
- [ ] Database `memory_of_journeys` exists
- [ ] `backend-python/.env` file exists with correct DB credentials
- [ ] Backend running: `cd backend-python && python main.py`
- [ ] Backend shows: "Application startup complete"
- [ ] Can access: http://localhost:8000/api/health

### Supabase
- [ ] Bucket `albums` created in Supabase Storage
- [ ] Bucket is marked as **Public** ✅
- [ ] SELECT policy added (public read)
- [ ] INSERT policy added (authenticated)
- [ ] UPDATE policy added (authenticated)
- [ ] DELETE policy added (authenticated)
- [ ] `.env` file has `VITE_SUPABASE_URL`
- [ ] `.env` file has `VITE_SUPABASE_ANON_KEY`

### Frontend
- [ ] Frontend running: `npm run dev`
- [ ] Can access: http://localhost:5173
- [ ] Logged in with Firebase Auth
- [ ] Browser console (F12) shows no errors

---

## Debug Command Sequence

**Run these commands in order to test everything:**

```bash
# Terminal 1 - Start MariaDB (if not running)
# Windows: Start XAMPP or MariaDB service
# Mac/Linux: sudo systemctl start mariadb

# Terminal 2 - Start Backend
cd backend-python
python main.py
# Wait for "Application startup complete"

# Terminal 3 - Test Backend
curl http://localhost:8000/api/health
# Should return: {"ok":true,"time":"..."}

# Terminal 4 - Start Frontend
npm run dev
# Wait for "Local: http://localhost:5173"
```

**Then in browser:**
1. Open http://localhost:5173
2. Press F12 → Console tab
3. Login with your account
4. Go to Photo Album
5. Create an album
6. Try uploading a photo
7. Watch console output

---

## Still Not Working?

**Copy the EXACT error message from:**
1. Browser console (F12 → Console)
2. Backend terminal

**And check:**
- What step in the console log fails?
- What error appears in backend terminal?
- What HTTP status code? (400, 500, etc.)

**Most common issue:** Backend is not running on port 8000!

**Quick test:**
```bash
curl http://localhost:8000/api/health
```

If this fails, backend is not running properly.

---

## Final Verification

**If everything is working, you'll see:**

**Backend terminal:**
```
📸 Inserting photo: album_id=xxx, user_id=yyy
✅ Photo saved successfully: zzz
```

**Browser console:**
```
📤 Uploading: photo.jpg
✅ Uploaded to Supabase
🔗 Public URL: https://...
💾 Saving metadata: {...}
✅ Photo saved successfully
```

**Browser alert:**
```
✅ Photos uploaded successfully!
```

🎉 **Success!**
