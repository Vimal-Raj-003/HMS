# 🚀 HMS Deployment Fixes Guide

This guide contains all the fixes needed to connect your frontend (Vercel) with your backend (Hostinger VPS).

## 📋 Prerequisites

- VPS IP: `82.25.108.30`
- Frontend URL: `https://hms-ten-indol.vercel.app`
- Backend URL: `http://82.25.108.30:5000`

---

## ✅ FIX 1: Update VPS Environment Variables

SSH into your VPS and update the `.env` file:

```bash
# SSH into your VPS
ssh root@82.25.108.30

# Navigate to your project directory
cd /path/to/Updated-HMS

# Edit the .env file
nano .env
```

Update these values:

```env
# Critical CORS fix - include BOTH URLs
FRONTEND_URL="http://localhost:3000,https://hms-ten-indol.vercel.app"

# Ensure production mode
NODE_ENV=production

# Your existing database URL (keep as is)
DATABASE_URL="your-existing-database-url"

# Your existing JWT secrets (keep as is)
JWT_SECRET="your-existing-jwt-secret"
JWT_REFRESH_SECRET="your-existing-refresh-secret"
```

---

## ✅ FIX 2: Fix Prisma Migration Error (P3009)

Run these commands on your VPS:

```bash
# Option 1: Mark the failed migration as applied
docker exec -it hms-backend npx prisma migrate resolve --applied add_patient_documents

# Option 2: If Option 1 doesn't work, deploy migrations
docker exec -it hms-backend npx prisma migrate deploy

# Option 3: If still having issues, push schema directly
docker exec -it hms-backend npx prisma db push
```

---

## ✅ FIX 3: Rebuild and Restart Docker Containers

After updating the `.env` file:

```bash
# Stop and remove existing containers
docker-compose down

# Rebuild and start containers
docker-compose up -d --build

# Check container status
docker ps

# View backend logs
docker logs hms-backend
```

---

## ✅ FIX 4: Verify Backend Health

Test that the backend is running correctly:

```bash
# Test health endpoint (from VPS)
curl http://localhost:5000/health

# Expected response:
# {"status":"ok","timestamp":"2026-03-19T...","environment":"production"}

# Test from external machine
curl http://82.25.108.30:5000/health
```

---

## ✅ FIX 5: Verify Vercel Environment Variables

Go to Vercel Dashboard → Project → Settings → Environment Variables

Ensure these are set:

| Variable | Value |
|----------|-------|
| `VITE_API_URL` | `http://82.25.108.30:5000` |

After updating, **redeploy** your frontend on Vercel.

---

## ✅ FIX 6: Test Frontend-Backend Connection

### Test 1: Check CORS

Open browser console on your Vercel frontend and run:

```javascript
fetch('http://82.25.108.30:5000/health')
  .then(res => res.json())
  .then(data => console.log('✅ Backend connected:', data))
  .catch(err => console.error('❌ Connection failed:', err));
```

### Test 2: Check Login

Try logging in from your frontend. Check the Network tab in browser DevTools:
- If you see CORS errors → FRONTEND_URL not updated correctly
- If you see connection timeout → Firewall blocking port 5000
- If you see 401/403 → Authentication issue (different problem)

---

## 🔥 VPS Firewall Configuration

If connections are timing out, ensure port 5000 is open:

```bash
# For UFW (Ubuntu)
sudo ufw allow 5000/tcp
sudo ufw reload

# For firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload

# For iptables
sudo iptables -A INPUT -p tcp --dport 5000 -j ACCEPT
sudo iptables-save
```

---

## 📊 Verification Checklist

| Check | Command | Expected Result |
|-------|---------|-----------------|
| Docker running | `docker ps` | hms-backend container listed |
| Backend health | `curl http://localhost:5000/health` | `{"status":"ok",...}` |
| CORS configured | Check logs | `Allowed origins: http://localhost:3000,https://hms-ten-indol.vercel.app` |
| Frontend env | Vercel dashboard | `VITE_API_URL=http://82.25.108.30:5000` |
| External access | `curl http://82.25.108.30:5000/health` | `{"status":"ok",...}` |

---

## 🚨 Common Issues & Solutions

### Issue: CORS errors in browser console
**Solution:** Ensure `FRONTEND_URL` includes `https://hms-ten-indol.vercel.app` and rebuild containers.

### Issue: Connection timeout
**Solution:** Check firewall allows port 5000, verify backend is running.

### Issue: Prisma migration failed
**Solution:** Run `docker exec -it hms-backend npx prisma migrate resolve --applied add_patient_documents`

### Issue: Environment shows development
**Solution:** Ensure `NODE_ENV=production` in `.env` and rebuild containers.

---

## 🎯 Quick Fix Commands (Copy-Paste)

```bash
# All-in-one fix script
cd /path/to/Updated-HMS && \
echo 'FRONTEND_URL="http://localhost:3000,https://hms-ten-indol.vercel.app"' >> .env && \
echo 'NODE_ENV=production' >> .env && \
docker-compose down && \
docker-compose up -d --build && \
docker exec -it hms-backend npx prisma migrate resolve --applied add_patient_documents && \
docker logs hms-backend
```

---

## ✅ After Fixes Applied

Your HMS should now:
- ✅ Login work
- ✅ Consultation save
- ✅ Lab module work
- ✅ Upload docs work
- ✅ Full system live

---

**Last Updated:** March 19, 2026
