# HMS Deployment Guide

This guide covers deploying the Hospital Management System (HMS) with:
- **Frontend**: Vercel (React + Vite)
- **Backend**: Render (Express + Socket.IO)
- **Database**: Neon PostgreSQL (Free tier)
- **Redis**: Upstash Redis (Free tier)

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Vercel        │     │   Render        │     │   External      │
│   (Frontend)    │────▶│   (Backend)     │────▶│   Services      │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │                        │
                               ▼                        ▼
                        ┌─────────────────┐     ┌─────────────────┐
                        │   Neon          │     │   Upstash       │
                        │   (PostgreSQL)  │     │   (Redis)       │
                        └─────────────────┘     └─────────────────┘
```

---

## Prerequisites

1. **GitHub Account** - For code repository
2. **Vercel Account** - [vercel.com](https://vercel.com) (Free tier available)
3. **Render Account** - [render.com](https://render.com) (Free tier available)
4. **Neon Account** - [neon.tech](https://neon.tech) (Free tier: 0.5 GB storage)
5. **Upstash Account** - [upstash.com](https://upstash.com) (Free tier: 10,000 requests/day)

---

## Step 1: Set Up External Services

### 1.1 Create Neon PostgreSQL Database

1. Go to [neon.tech](https://neon.tech) and sign up/login
2. Click "Create a project"
3. Name it `hms-database`
4. Select a region close to your users
5. Click "Create project"
6. **Copy the connection string** (looks like: `postgresql://username:password@ep-xxx.region.aws.neon.tech/neondb?sslmode=require`)

### 1.2 Create Upstash Redis

1. Go to [upstash.com](https://upstash.com) and sign up/login
2. Click "Create Database"
3. Name it `hms-redis`
4. Select a region close to your users
5. Click "Create"
6. **Copy the Redis URL** (looks like: `redis://default:xxx@xxx.upstash.io:6379`)

---

## Step 2: Push Code to GitHub

1. Initialize git repository (if not already done):
```bash
git init
git add .
git commit -m "Initial commit"
```

2. Create a GitHub repository and push:
```bash
git remote add origin https://github.com/YOUR_USERNAME/hms.git
git branch -M main
git push -u origin main
```

---

## Step 3: Deploy Backend to Render

### Option A: Using render.yaml (Blueprint)

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New" → "Blueprint"
3. Connect your GitHub repository
4. Render will detect the `render.yaml` file
5. Update the `FRONTEND_URL` in the YAML to your Vercel URL (after frontend deployment)
6. Click "Apply"

### Option B: Manual Setup

1. Go to [render.com](https://render.com) and sign up/login
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Configure the service:
   - **Name**: `hms-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npx prisma generate && npm run build`
   - **Start Command**: `npx prisma migrate deploy && npm start`
   - **Plan**: Free (or upgrade for production)

5. Add Environment Variables:

| Variable | Value |
|----------|-------|
| `NODE_ENV` | `production` |
| `DATABASE_URL` | (Your Neon connection string) |
| `REDIS_URL` | (Your Upstash Redis URL) |
| `JWT_SECRET` | (Generate a random 64-character string) |
| `JWT_EXPIRES_IN` | `7d` |
| `JWT_REFRESH_EXPIRES_IN` | `30d` |
| `FRONTEND_URL` | `https://your-app.vercel.app` (update after frontend deploy) |

6. Click "Create Web Service"
7. Wait for deployment to complete (may take 5-10 minutes)
8. **Copy your backend URL** (e.g., `https://hms-backend.onrender.com`)

---

## Step 4: Deploy Frontend to Vercel

### Option A: Using Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy from the frontend directory:
```bash
cd frontend
vercel --prod
```

4. Set environment variables when prompted or in Vercel dashboard

### Option B: Using Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and sign up/login
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Vite
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

5. Add Environment Variables:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `https://your-backend.onrender.com` |

6. Click "Deploy"
7. Wait for deployment to complete
8. **Copy your frontend URL** (e.g., `https://hms.vercel.app`)

---

## Step 5: Update CORS Settings

After both deployments are complete:

1. Go to Render dashboard
2. Update the `FRONTEND_URL` environment variable to include your Vercel URL
3. Redeploy the backend if necessary

---

## Step 6: Seed the Database (Optional)

If you need to seed initial data:

1. Go to Render dashboard
2. Open the Shell for your web service
3. Run:
```bash
npm run db:seed
```

---

## Environment Variables Reference

### Frontend (Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_API_URL` | Yes | Backend API URL (e.g., `https://hms-backend.onrender.com`) |

### Backend (Render)

| Variable | Required | Description |
|----------|----------|-------------|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | No | Auto-assigned by Render |
| `DATABASE_URL` | Yes | Neon PostgreSQL connection string |
| `REDIS_URL` | Yes | Upstash Redis connection string |
| `JWT_SECRET` | Yes | Random 64-character secret |
| `JWT_EXPIRES_IN` | No | Token expiry (default: `7d`) |
| `JWT_REFRESH_EXPIRES_IN` | No | Refresh token expiry (default: `30d`) |
| `FRONTEND_URL` | Yes | Your Vercel frontend URL |

### Optional Services

| Variable | Service | Description |
|----------|---------|-------------|
| `SMS_API_KEY` | MSG91/Twilio | SMS notifications |
| `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` | Email | Email notifications |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY` | AWS S3 | File storage |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET` | Razorpay | Payment gateway |

---

## Troubleshooting

### Frontend shows "Network Error"

1. Check that `VITE_API_URL` is correctly set in Vercel
2. Verify the backend is running (visit `https://your-backend.onrender.com/health`)
3. Check CORS settings in the backend

### Backend fails to start

1. Check Render logs for errors
2. Verify `DATABASE_URL` is correct
3. Ensure Prisma migrations have run

### Database connection issues

1. Verify Neon database is not suspended (free tier suspends after inactivity)
2. Check connection string format
3. Ensure SSL mode is enabled (`?sslmode=require`)

### Socket.IO not working

1. Ensure WebSocket support is enabled (Render supports WebSockets)
2. Check `FRONTEND_URL` includes all necessary domains
3. Verify CORS configuration

---

## Free Tier Limits

| Service | Free Tier Limits |
|---------|------------------|
| Vercel | 100 GB bandwidth, 100 builds/day |
| Render | 750 hours/month, spins down after inactivity |
| Neon | 0.5 GB storage, 100 connections |
| Upstash | 10,000 requests/day, 256 MB storage |

---

## Production Checklist

Before going to production:

- [ ] Update `JWT_SECRET` to a secure random string
- [ ] Enable HTTPS (automatic on Vercel/Render)
- [ ] Set up proper error monitoring (e.g., Sentry)
- [ ] Configure database backups
- [ ] Set up logging (Render provides built-in logging)
- [ ] Review CORS settings
- [ ] Enable rate limiting
- [ ] Set up SSL certificates (automatic on Vercel/Render)
- [ ] Configure custom domain (optional)

---

## Custom Domain Setup

### Vercel (Frontend)

1. Go to your project in Vercel dashboard
2. Click "Settings" → "Domains"
3. Add your custom domain
4. Update DNS records as instructed

### Render (Backend)

1. Go to your web service in Render dashboard
2. Click "Settings" → "Custom Domains"
3. Add your custom domain
4. Update DNS records as instructed

---

## Support

For issues specific to:
- **Vercel**: [vercel.com/docs](https://vercel.com/docs)
- **Render**: [render.com/docs](https://render.com/docs)
- **Neon**: [neon.tech/docs](https://neon.tech/docs)
- **Upstash**: [upstash.com/docs](https://upstash.com/docs)
