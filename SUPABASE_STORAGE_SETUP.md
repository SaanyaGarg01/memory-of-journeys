# Supabase Storage Setup for Photo Albums

## Problem
Getting "Failed to upload photos" error when trying to upload photos to albums.

## Solution

### Step 1: Create Supabase Storage Bucket

1. Go to your Supabase Dashboard: https://app.supabase.com
2. Select your project
3. Navigate to **Storage** in the left sidebar
4. Click **"New bucket"**
5. Create a bucket with these settings:
   - **Name:** `albums`
   - **Public bucket:** ✅ **YES** (Check this box!)
   - **File size limit:** 50 MB (or as needed)
   - **Allowed MIME types:** Leave empty for all image types

### Step 2: Set Bucket Policies

After creating the bucket, you need to set proper policies:

1. Click on the `albums` bucket
2. Go to **"Policies"** tab
3. Click **"New Policy"**

#### Policy 1: Allow Public Read Access
```sql
-- Policy Name: Public Read Access
-- Allowed operation: SELECT

CREATE POLICY "Public can view album photos"
ON storage.objects FOR SELECT
USING ( bucket_id = 'albums' );
```

#### Policy 2: Allow Authenticated Users to Upload
```sql
-- Policy Name: Authenticated Upload
-- Allowed operation: INSERT

CREATE POLICY "Authenticated users can upload album photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'albums' 
  AND auth.role() = 'authenticated'
);
```

#### Policy 3: Allow Users to Update Their Own Files
```sql
-- Policy Name: Users Update Own Files
-- Allowed operation: UPDATE

CREATE POLICY "Users can update own album photos"
ON storage.objects FOR UPDATE
USING ( 
  bucket_id = 'albums' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### Policy 4: Allow Users to Delete Their Own Files
```sql
-- Policy Name: Users Delete Own Files
-- Allowed operation: DELETE

CREATE POLICY "Users can delete own album photos"
ON storage.objects FOR DELETE
USING ( 
  bucket_id = 'albums' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Step 3: Configure Environment Variables

1. In your Supabase Dashboard, go to **Settings** → **API**
2. Copy your **Project URL** and **anon public** key
3. Create a `.env` file in the root of your project:

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Important:** 
- Replace `your-project-id` with your actual Supabase project ID
- Replace the anon key with your actual key from the dashboard
- DO NOT commit the `.env` file to git (it's already in .gitignore)

### Step 4: Alternative - Quick Policy Setup (Simplified)

If you want to quickly allow all authenticated users to manage files:

```sql
-- Allow all authenticated users full access (development only)
CREATE POLICY "Allow authenticated full access"
ON storage.objects
FOR ALL
TO authenticated
USING ( bucket_id = 'albums' )
WITH CHECK ( bucket_id = 'albums' );

-- Allow public read
CREATE POLICY "Allow public read"
ON storage.objects
FOR SELECT
TO public
USING ( bucket_id = 'albums' );
```

⚠️ **Warning:** This is less secure and should only be used for development/testing.

### Step 5: Test Upload

After setting up:

1. Restart your Vite dev server: `npm run dev`
2. Go to Photo Album section
3. Create a new album
4. Try uploading a photo

If it still fails, check the browser console (F12) for detailed error messages.

---

## Troubleshooting

### Error: "Invalid API key"
- Check that your `.env` file has the correct `VITE_SUPABASE_ANON_KEY`
- Restart the dev server after creating/updating `.env`

### Error: "Bucket not found"
- Verify the bucket name is exactly `albums` (lowercase)
- Check that the bucket exists in Supabase Storage

### Error: "Permission denied" or "Policy violation"
- Ensure the bucket is marked as **Public**
- Verify storage policies are set up correctly
- Make sure you're logged in with Firebase Auth

### Error: "No public URL returned"
- Check that the bucket has public read access enabled
- Verify the policy allows SELECT operations

### Files upload but don't appear
- Check the backend API is running on port 8000
- Verify the photo metadata is being saved to MariaDB
- Check browser console for API errors

---

## File Structure in Supabase Storage

Photos will be organized as:
```
albums/
  └── {user_firebase_uid}/
      └── {album_id}/
          ├── 1234567890_photo1.jpg
          ├── 1234567891_photo2.jpg
          └── ...
```

This structure:
- ✅ Organizes photos by user
- ✅ Groups photos by album
- ✅ Prevents filename conflicts (timestamp prefix)
- ✅ Allows easy permission management (users can only access their folders)

---

## Quick Setup Checklist

- [ ] Created `albums` bucket in Supabase
- [ ] Set bucket to **Public**
- [ ] Added storage policies (at minimum: public read + authenticated upload)
- [ ] Created `.env` file with Supabase credentials
- [ ] Restarted dev server
- [ ] Tested photo upload
- [ ] Backend running on port 8000
- [ ] Frontend running on port 5173

---

## Getting Your Supabase Credentials

### 1. Project URL
1. Go to https://app.supabase.com
2. Select your project
3. Go to **Settings** → **API**
4. Copy **Project URL** (looks like: `https://xxxxx.supabase.co`)

### 2. Anon Key
1. Same page (**Settings** → **API**)
2. Under **Project API keys**
3. Copy the **anon** **public** key (starts with `eyJ...`)

⚠️ **DO NOT** use the `service_role` key - it has full admin access!

---

## Example `.env` File

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Then edit `.env`:
```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjQzODUwMCwiZXhwIjoxOTMxOTk4NTAwfQ.xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

All done! Your photo uploads should work now. 📸✨
