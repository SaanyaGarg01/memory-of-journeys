# Journey Saving Issue - Troubleshooting Guide

## Problem
Journeys are not being saved to the Supabase database.

## Root Cause
The Supabase Row Level Security (RLS) policies require authentication, but the app is designed to work for anonymous users.

## Solutions Applied

### 1. ✅ Code Fix (Already Applied)
The app now:
- Saves journeys locally immediately (always works)
- Shows journey in the UI right away
- Attempts to save to database
- Shows helpful messages in console
- Displays alerts to inform users

### 2. 🔧 Database Fix (Requires Manual Step)

You need to run this SQL in your Supabase Dashboard to allow anonymous users to save journeys:

#### Step 1: Go to Supabase SQL Editor
https://supabase.com/dashboard/project/hgbejfekzsvxsqxmrtgg/sql/new

#### Step 2: Run This SQL:

```sql
-- Allow anonymous users to insert public journeys
CREATE POLICY "Anonymous users can insert public journeys"
  ON journeys FOR INSERT
  TO anon
  WITH CHECK (visibility = 'public' AND user_id IS NULL);

-- Allow anyone to view public journeys
CREATE POLICY "Anyone can view public journeys"
  ON journeys FOR SELECT
  TO anon
  USING (visibility = 'public');
```

#### Step 3: Verify
After running the SQL:
1. Refresh your app
2. Create a new journey
3. Check the console - should see "✅ Journey saved to database"
4. Refresh the page - journey should still be there

---

## Current Behavior

### ✅ What Works Now
- Journey creation in UI
- All AI features process the journey
- Journey displays immediately in "Explore" tab
- Local state management
- All bonus features work with the journey

### ⚠️ What Needs Database Fix
- Persistence across page refreshes
- Viewing journeys from other sessions
- Database-backed features (if any)

---

## How to Test

### Test 1: Create a Journey
1. Go to **Create** tab
2. Fill in:
   - Title: "Test Journey"
   - Add a leg (e.g., LAX → JFK)
   - Select journey type
   - Add departure date
3. Click "Complete Journey"
4. Should see:
   - Success message
   - Journey appears in Explore tab
   - Console log confirming save status

### Test 2: Check Console
Open browser console (F12) and look for:
- ✅ "Journey created successfully!"
- Either:
  - ✅ "Journey saved to database" (if SQL fix applied)
  - ⚠️ "Database save failed" (if SQL fix not applied yet)

### Test 3: Page Refresh
1. Create a journey
2. Refresh the page (F5)
3. Check if journey still appears:
   - **YES** = Database is working! ✅
   - **NO** = Need to apply SQL fix 🔧

---

## Error Messages Explained

### "Database save failed: new row violates row-level security policy"
**Meaning:** RLS policy blocking anonymous inserts
**Solution:** Run the SQL fix above

### "Could not find the table 'public.journeys'"
**Meaning:** Tables haven't been created yet
**Solution:** Run the main migration SQL first

### "Journey saved locally only"
**Meaning:** App couldn't reach database
**Impact:** Journey lost on page refresh
**Solution:** Check database connection and run SQL fix

---

## Alternative: Enable Authentication

If you prefer users to log in, you can:

1. **Enable Supabase Auth:**
```typescript
// In your app, add sign-up/login
const { user, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password'
});
```

2. **Update journey creation:**
```typescript
// Use real user ID instead of null
user_id: supabase.auth.user()?.id
```

3. **No SQL changes needed** - existing policies will work

---

## Quick Fix Summary

**Option A: Anonymous Users (Recommended for Demo)**
1. Run SQL policy in Supabase Dashboard
2. Journeys save without login
3. Anyone can create and view public journeys

**Option B: Authenticated Users**
1. Implement Supabase Auth
2. Require login to create journeys
3. Full user management and privacy controls

**Option C: Local Only (Current State)**
1. No changes needed
2. Journeys work but don't persist
3. Good for development/testing

---

## Files Modified

- ✅ `src/App.tsx` - Better error handling and user feedback
- ✅ `supabase/migrations/fix_anonymous_journeys.sql` - SQL policy fix
- ✅ This guide created

---

## Next Steps

1. **Run the SQL fix** in Supabase Dashboard (2 minutes)
2. **Test journey creation** (1 minute)
3. **Verify persistence** with page refresh (30 seconds)
4. **Celebrate** - Journeys now save permanently! 🎉

---

## Support

If issues persist after applying the SQL fix:

1. Check Supabase logs in Dashboard
2. Verify database tables exist (`journeys` table)
3. Check network tab in browser DevTools
4. Look for any error messages in console
5. Ensure Supabase URL and keys are correct in `.env`

---

**Status: Fix Applied ✅**
**Requires: Manual SQL execution in Supabase**
**ETA: 2 minutes to full resolution**
