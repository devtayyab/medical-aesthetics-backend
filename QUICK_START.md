# Quick Start - EC2 Docker Deployment

Fast track guide to deploy your NestJS backend to EC2 in 15 minutes.

## Prerequisites
- AWS Account
- EC2 instance launched (t3.medium recommended)
- SSH access to EC2
- Your EC2 public IP address

---

## Step 1: Connect to EC2 (2 minutes)

```bash
# On your local machine
chmod 400 your-key.pem
ssh -i your-key.pem ec2-user@YOUR_EC2_IP
```

---

## Step 2: Install Docker & Docker Compose (3 minutes)

```bash
# Run these commands on EC2
sudo yum update -y
sudo yum install -y docker git
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -a -G docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Logout and login again
exit
ssh -i your-key.pem ec2-user@YOUR_EC2_IP
```

---

## Step 3: Clone Repository (1 minute)

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/medical-aesthetics-backend.git
cd medical-aesthetics-backend
```

---

## Step 4: Configure Environment (3 minutes)

```bash
# Copy example env
cp .env.example .env

# Edit environment file
nano .env
```

**Minimum required changes:**
```bash
# Generate secrets first
openssl rand -base64 32  # Copy output for JWT_SECRET
openssl rand -base64 32  # Copy output for DATABASE_PASSWORD
openssl rand -base64 24  # Copy output for REDIS_PASSWORD

# Update these in .env:
DATABASE_PASSWORD=<paste_generated_password>
JWT_SECRET=<paste_generated_secret>
JWT_ACCESS_SECRET=<paste_generated_secret>
JWT_REFRESH_SECRET=<paste_generated_secret>
REDIS_PASSWORD=<paste_generated_password>
API_BASE_URL=http://YOUR_EC2_IP:3001
```

Save and exit (Ctrl+X, Y, Enter)

---

## Step 5: Deploy Application (5 minutes)

```bash
# Make scripts executable
chmod +x deploy.sh backup.sh restore.sh logs.sh

# Deploy!
./deploy.sh
```

Wait for deployment to complete. You should see:
```
✓ Backend container is running
✓ PostgreSQL container is running
✓ Redis container is running
Deployment completed successfully!
```

---

## Step 6: Verify Deployment (1 minute)

```bash
# Check if containers are running
docker ps

# Test API
curl http://localhost:3001/health

# View logs
docker logs medical-aesthetics-backend
```

---

## Step 7: Test from Outside

From your local machine:
```bash
curl http://YOUR_EC2_IP:3001/health
```

If you get a response, **congratulations! Your application is deployed!** 🎉

---

## Common Issues & Quick Fixes

### Issue: Can't access from outside
**Fix:** Check AWS Security Group - ensure port 3001 is open
```bash
# AWS Console → EC2 → Security Groups → Your SG → Inbound Rules
# Add rule: Custom TCP, Port 3001, Source 0.0.0.0/0
```

### Issue: Container won't start
**Fix:** Check logs
```bash
docker logs medical-aesthetics-backend
# Look for error messages
```

### Issue: Database connection error
**Fix:** Ensure DATABASE_PASSWORD in .env matches docker-compose.prod.yml
```bash
# Check environment variables
docker exec medical-aesthetics-backend env | grep DATABASE
```

### Issue: Out of memory
**Fix:** Upgrade EC2 instance type to t3.medium or larger

---

## Useful Commands

```bash
# View logs
./logs.sh

# Restart application
docker restart medical-aesthetics-backend

# Stop everything
docker-compose -f docker-compose.prod.yml down

# Start everything
docker-compose -f docker-compose.prod.yml up -d

# Update application
git pull origin main
./deploy.sh

# Backup database
./backup.sh

# View all containers
docker ps -a

# Check resource usage
docker stats
```

---

## Next Steps

1. **Setup Domain & SSL** (Optional but recommended)
   - Point your domain to EC2 IP
   - Install Nginx and Certbot
   - See full guide in DEPLOYMENT_GUIDE.md

2. **Setup Automatic Backups**
   ```bash
   # Add to crontab
   crontab -e
   # Add: 0 2 * * * /home/ec2-user/medical-aesthetics-backend/backup.sh
   ```

3. **Monitor Application**
   - Setup CloudWatch alarms
   - Monitor disk space: `df -h`
   - Monitor memory: `free -h`

4. **Security Hardening**
   - Change default passwords
   - Restrict SSH to your IP only
   - Enable AWS CloudTrail
   - Regular security updates

---

## Support

For detailed documentation, see:
- **DEPLOYMENT_GUIDE.md** - Complete deployment guide
- **README.md** - Application documentation
- **ADMIN_API.md** - API documentation

---

**Your application is now live at:** `http://YOUR_EC2_IP:3001`

**API Documentation:** `http://YOUR_EC2_IP:3001/api`
