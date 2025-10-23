# 📸 Photo Upload Fix - Quick Guide

## ❌ Problem
You're getting **"Failed to upload photos"** error when trying to upload photos to albums.

## ✅ Solution - Follow These Steps

### Step 1: Get Your Supabase Credentials

1. Go to https://app.supabase.com
2. Select your project (or create one if you don't have it)
3. Click **Settings** (gear icon in sidebar) → **API**
4. You'll see two important values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

**Copy both of these!** 📋

---

### Step 2: Create the Storage Bucket

1. In Supabase Dashboard, click **Storage** in the left sidebar
2. Click **"New bucket"** button
3. Fill in:
   - **Name:** `albums` (exactly this, lowercase)
   - **Public bucket:** ✅ **CHECK THIS BOX** (very important!)
   - Click **Create bucket**

---

### Step 3: Set Up Bucket Policies

1. Click on your new `albums` bucket
2. Click the **"Policies"** tab
3. Click **"New Policy"** → **"For full customization"**
4. Use this quick policy (copy-paste):

**Policy Name:** `Allow All Operations`

**Policy Definition:**
```sql
-- Allow public read access
CREATE POLICY "Public can read albums"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'albums' );

-- Allow authenticated users to upload
CREATE POLICY "Authenticated can upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'albums' );

-- Allow authenticated users to update
CREATE POLICY "Authenticated can update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'albums' );

-- Allow authenticated users to delete
CREATE POLICY "Authenticated can delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'albums' );
```

Click **"Review"** → **"Save policy"**

---

### Step 4: Create `.env` File

1. In your project root folder, create a file named **`.env`** (exactly this name)
2. Add these lines (replace with YOUR values from Step 1):

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** 
- Replace `xxxxx.supabase.co` with YOUR Project URL
- Replace the key with YOUR anon public key
- Don't use the `service_role` key!

---

### Step 5: Restart Your Dev Server

Stop your dev server (Ctrl+C) and start again:

```bash
npm run dev
```

---

### Step 6: Test It!

1. Open http://localhost:5173
2. Login with your account
3. Go to **Photo Album** section
4. Click **"Create New Album"**
5. Fill in title and click **"Create Album"**
6. Select the album from the list
7. Click **"Choose File"** and select a photo
8. Click **Upload**

✅ **It should work now!**

---

## 🔍 Troubleshooting

### Still getting errors?

**Check the browser console (F12 → Console tab):**

#### If you see: "Supabase configuration missing"
- Your `.env` file is not found or has wrong variable names
- Make sure file is named exactly `.env` (not `.env.txt`)
- Variables must start with `VITE_`
- Restart dev server after creating `.env`

#### If you see: "Bucket not found"
- Bucket name must be exactly `albums` (lowercase)
- Check it exists in Supabase Storage

#### If you see: "Permission denied" or "new row violates row-level security"
- Bucket must be marked as **Public**
- Storage policies must be set up
- You must be logged in with Firebase

#### If you see: "Failed to save photo metadata"
- Backend must be running on port 8000
- Run: `cd backend-python && python main.py`
- Check backend logs for errors

---

## 📁 What Your `.env` File Should Look Like

```env
# Copy this template and fill in YOUR values

# From Supabase Dashboard → Settings → API
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjQzODUwMCwiZXhwIjoxOTMxOTk4NTAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# If you're also using Firebase (optional)
# VITE_FIREBASE_API_KEY=your-key
# VITE_FIREBASE_AUTH_DOMAIN=your-domain
# VITE_FIREBASE_PROJECT_ID=your-project-id
```

---

## ✅ Quick Checklist

Before testing, make sure:

- [ ] Supabase project created
- [ ] `albums` bucket created
- [ ] Bucket is marked as **Public**
- [ ] Storage policies added
- [ ] `.env` file created in project root
- [ ] `.env` has correct Supabase URL
- [ ] `.env` has correct anon key
- [ ] Dev server restarted
- [ ] Backend running on port 8000
- [ ] You're logged in with Firebase

---

## 🎉 Expected Behavior

When it works correctly:

1. Select photos → Files upload to Supabase Storage
2. Public URLs are generated
3. Photo metadata saved to MariaDB backend
4. Photos appear in your album
5. You can organize them by pages
6. You can add captions
7. You can delete photos

Photo URLs will look like:
```
https://xxxxx.supabase.co/storage/v1/object/public/albums/user-id/album-id/timestamp_photo.jpg
```

---

## 🆘 Still Not Working?

1. **Check browser console (F12)** for exact error message
2. **Check backend logs** for API errors
3. **Verify Supabase Storage bucket** is public and has policies
4. **Verify `.env` file** has correct credentials
5. **Make sure you're logged in** with Firebase Auth

If you see a specific error message, search for it in `SUPABASE_STORAGE_SETUP.md` for detailed troubleshooting.

---

Everything should work after following these steps! 📸✨
