# Vercel Deployment Guide

## 🚀 Deploy Memory of Journeys to Vercel

### Prerequisites
- Vercel account (sign up at https://vercel.com)
- GitHub repository connected

### Deployment Steps

#### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/new
   - Sign in with your GitHub account

2. **Import Your Repository**
   - Click "Import Project"
   - Select `SaanyaGarg01/memory-of-journeys`
   - Click "Import"

3. **Configure Project**
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

4. **Add Environment Variables** (CRITICAL!)
   Click "Environment Variables" and add:
   
   ```
   VITE_SUPABASE_URL=https://hgbejfekzsvxsqxmrtgg.supabase.co
   VITE_SUPABASE_ANON_KEY=<your-anon-key-from-.env>
   ```
   
   ⚠️ **Important**: Copy the exact values from your `.env` file!

5. **Deploy**
   - Click "Deploy"
   - Wait 2-3 minutes for build to complete
   - Your app will be live at: `https://<your-project>.vercel.app`

#### Option 2: Deploy via Vercel CLI

1. **Install Vercel CLI**
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**
   ```bash
   vercel login
   ```

3. **Deploy**
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy? **Y**
   - Which scope? Select your account
   - Link to existing project? **N**
   - Project name? `memory-of-journeys`
   - Directory? `./`
   - Override settings? **N**

4. **Add Environment Variables**
   ```bash
   vercel env add VITE_SUPABASE_URL
   vercel env add VITE_SUPABASE_ANON_KEY
   ```

5. **Deploy to Production**
   ```bash
   vercel --prod
   ```

### Post-Deployment

1. **Update Supabase Settings**
   - Go to: https://supabase.com/dashboard/project/hgbejfekzsvxsqxmrtgg/settings/api
   - Under "URL Configuration" → Add your Vercel URL to allowed domains

2. **Test Your Deployment**
   - Visit your Vercel URL
   - Check if green "Connected" indicator appears
   - Try creating a journey
   - Test all AI features

### Automatic Deployments

Once connected, Vercel will automatically deploy:
- ✅ Every push to `main` branch → Production
- ✅ Every pull request → Preview deployment
- ✅ Updates take 1-2 minutes to go live

### Troubleshooting

**Issue: White screen / Blank page**
- Check browser console for errors
- Verify environment variables are set in Vercel dashboard

**Issue: Database errors**
- Verify `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct
- Check Supabase project is not paused

**Issue: Build failed**
- Check build logs in Vercel dashboard
- Ensure all dependencies are in package.json

### Your Deployment URLs

After deployment, you'll get:
- **Production**: `https://memory-of-journeys.vercel.app` (or custom domain)
- **Preview**: Auto-generated for each PR
- **Development**: Your local http://localhost:5173

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Supabase Docs: https://supabase.com/docs
- This repo: https://github.com/SaanyaGarg01/memory-of-journeys
