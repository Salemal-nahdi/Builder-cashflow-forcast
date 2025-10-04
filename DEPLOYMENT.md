# Deployment Guide

## Netlify Deployment

### 1. Push to GitHub
```bash
git add .
git commit -m "Add Xero integration"
git push origin main
```

### 2. Connect to Netlify
1. Go to [netlify.com](https://netlify.com)
2. Click "New site from Git"
3. Connect your GitHub repository
4. Use these build settings:
   - **Build command:** `npm run build`
   - **Publish directory:** `.next`
   - **Node version:** 18

### 3. Environment Variables
Add these in Netlify dashboard → Site settings → Environment variables:

```
DATABASE_URL=postgresql://username:password@host:port/database
NEXTAUTH_URL=https://your-app-name.netlify.app
NEXTAUTH_SECRET=your-secret-key
XERO_CLIENT_ID=your-xero-client-id
XERO_CLIENT_SECRET=your-xero-client-secret
XERO_REDIRECT_URI=https://your-app-name.netlify.app/api/xero/callback
```

### 4. Xero App Configuration
Use your Netlify URL in Xero:
- **Company or application URL:** `https://your-app-name.netlify.app`
- **Redirect URI:** `https://your-app-name.netlify.app/api/xero/callback`

## Local Development
For local testing, use:
- **Company or application URL:** `http://localhost:3000`
- **Redirect URI:** `http://localhost:3000/api/xero/callback`