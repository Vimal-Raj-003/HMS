# Hostinger VPS Deployment Guide

This guide will help you deploy the HMS backend on your Hostinger VPS and connect it to your Vercel frontend with Neon database.

## Prerequisites

- Hostinger VPS with SSH access
- Docker and Docker Compose installed on VPS
- Neon PostgreSQL database (already set up)
- Vercel account with frontend deployed

## Step 1: SSH into Your Hostinger VPS

```bash
ssh root@your-vps-ip
# Your VPS IP: 82.25.108.30
```

## Step 2: Navigate to Your Project Directory

```bash
cd ~/HMS
# or wherever your project is located
```

## Step 3: Create the .env File

Create a `.env` file in the same directory as `docker-compose.yml`:

```bash
nano .env
```

Paste the following content (replace with your actual values):

```env
# Database (Neon PostgreSQL)
# Replace with your actual Neon database connection string
DATABASE_URL="postgresql://username:password@your-neon-host.neon.tech/neondb?sslmode=require"

# JWT Configuration
# IMPORTANT: Change this to a strong random string (at least 32 characters)!
JWT_SECRET="your-super-secret-jwt-key-change-in-production-min-32-chars"
JWT_REFRESH_SECRET="your-refresh-secret-key-change-in-production"
JWT_EXPIRES_IN="7d"
JWT_REFRESH_EXPIRES_IN="30d"

# Server Configuration
PORT=5000
NODE_ENV=production

# Frontend URL (CORS - comma separated)
FRONTEND_URL="http://localhost:3000,https://hms-ten-indol.vercel.app"
```

Save and exit (Ctrl+O, Enter, Ctrl+X)

## Step 4: Stop and Remove Existing Containers

```bash
docker-compose down
```

## Step 5: Rebuild and Start Containers

```bash
# Rebuild the Docker image
docker-compose build --no-cache

# Start the container
docker-compose up -d
```

## Step 6: Verify the Deployment

Check if the container is running:

```bash
docker-compose ps
```

Check the logs:

```bash
docker-compose logs -f
```

Test the health endpoint:

```bash
curl http://localhost:5000/api/health
```

## Step 7: Configure Firewall (if needed)

Make sure port 5000 is open on your VPS firewall:

```bash
# For UFW (Ubuntu)
sudo ufw allow 5000/tcp

# For firewalld (CentOS/RHEL)
sudo firewall-cmd --permanent --add-port=5000/tcp
sudo firewall-cmd --reload
```

## Step 8: Test from External

From your local machine, test the backend:

```bash
curl http://82.25.108.30:5000/api/health
```

You should see a response like:
```json
{"status":"ok","timestamp":"..."}
```

## Vercel Frontend Configuration

### Step 1: Set Environment Variables in Vercel

Go to your Vercel project settings:
1. Navigate to **Settings** → **Environment Variables**
2. Add the following variable:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `http://82.25.108.30:5000` |

### Step 2: Redeploy Frontend

After setting the environment variable:
1. Go to **Deployments** tab
2. Click **Redeploy** on the latest deployment

## Troubleshooting

### Issue: "DATABASE_URL variable is not set"

**Solution**: Make sure the `.env` file exists in the same directory as `docker-compose.yml` and contains the `DATABASE_URL` variable.

```bash
# Check if .env file exists
ls -la .env

# View .env content (be careful with sensitive data)
cat .env
```

### Issue: "JWT_SECRET variable is not set"

**Solution**: Same as above - add `JWT_SECRET` to your `.env` file.

### Issue: Prisma Migration Errors

**Solution**: The migrations should run automatically. If they fail, check that your Neon database is accessible:

```bash
# Test database connection from VPS
docker exec -it hms-backend sh
npx prisma db pull
```

### Issue: CORS Errors in Frontend

**Solution**: Make sure your Vercel URL is in the `FRONTEND_URL` environment variable:

```env
FRONTEND_URL="http://localhost:3000,https://hms-ten-indol.vercel.app"
```

### Issue: Connection Refused

**Solution**: Check if the container is running and port 5000 is accessible:

```bash
# Check container status
docker ps

# Check if port 5000 is listening
netstat -tlnp | grep 5000

# Test locally on VPS
curl http://localhost:5000/api/health
```

## Quick Reference Commands

```bash
# Start services
docker-compose up -d

# Stop services
docker-compose down

# View logs
docker-compose logs -f

# Restart services
docker-compose restart

# Rebuild and restart
docker-compose up -d --build

# Execute command in container
docker exec -it hms-backend sh
```

## Security Recommendations

1. **Change JWT_SECRET**: Use a strong, random string (at least 32 characters)
2. **Enable HTTPS**: Consider using a reverse proxy like Nginx with Let's Encrypt SSL
3. **Restrict Port Access**: Use firewall rules to limit access to port 5000
4. **Regular Updates**: Keep Docker and your system updated

## Using a Domain with SSL (Recommended)

For production, it's better to use a domain with SSL:

1. Point a subdomain (e.g., `api.yourdomain.com`) to your VPS IP
2. Install Nginx and Certbot on your VPS
3. Configure Nginx as a reverse proxy to port 5000
4. Enable HTTPS with Let's Encrypt

Example Nginx config:

```nginx
server {
    listen 80;
    server_name api.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl;
    server_name api.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/api.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/api.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```
