# 🚀 Deployment Package - Medical Aesthetics Backend

Complete Docker deployment package for AWS EC2.

## 📦 What's Included

### Documentation
- **QUICK_START.md** - 15-minute deployment guide (START HERE!)
- **DEPLOYMENT_GUIDE.md** - Complete detailed deployment documentation
- **DEPLOYMENT_README.md** - This file

### Docker Files
- **Dockerfile** - Multi-stage production & development builds
- **docker-compose.yml** - Development environment
- **docker-compose.prod.yml** - Production environment
- **.dockerignore** - Optimized Docker build context
- **.env.production** - Production environment template

### Deployment Scripts
- **setup-ec2.sh** - Initial EC2 setup (Docker, Docker Compose, Git)
- **deploy.sh** - Main deployment script
- **backup.sh** - Database backup script
- **restore.sh** - Database restore script
- **logs.sh** - Interactive log viewer
- **monitor.sh** - System monitoring dashboard

---

## 🎯 Quick Start

### For First-Time Deployment

1. **Read QUICK_START.md** - Follow the 15-minute guide
2. **Or follow these steps:**

```bash
# On EC2 instance
git clone <your-repo>
cd medical-aesthetics-backend

# Make scripts executable
chmod +x *.sh

# Setup EC2 (first time only)
./setup-ec2.sh
# Logout and login again

# Configure environment
cp .env.production .env
nano .env  # Update passwords and secrets

# Deploy
./deploy.sh
```

---

## 📋 Script Reference

### setup-ec2.sh
**Purpose:** Initial EC2 instance setup  
**When to use:** First time on a new EC2 instance  
**What it does:**
- Installs Docker
- Installs Docker Compose
- Installs Git
- Configures Docker permissions

```bash
./setup-ec2.sh
```

### deploy.sh
**Purpose:** Deploy or update the application  
**When to use:** Initial deployment and updates  
**What it does:**
- Pulls latest code (if git repo)
- Stops existing containers
- Builds new Docker images
- Starts all services
- Runs database migrations
- Shows status and logs

```bash
./deploy.sh
```

### backup.sh
**Purpose:** Backup databases  
**When to use:** Before major changes, or scheduled via cron  
**What it does:**
- Backs up PostgreSQL database
- Backs up Redis data
- Compresses backups
- Cleans old backups (7 days retention)

```bash
./backup.sh

# Schedule daily backups
crontab -e
# Add: 0 2 * * * /home/ec2-user/medical-aesthetics-backend/backup.sh
```

### restore.sh
**Purpose:** Restore database from backup  
**When to use:** Disaster recovery or rollback  
**What it does:**
- Creates safety backup of current database
- Restores from specified backup file
- Restarts services

```bash
./restore.sh /path/to/backup.sql.gz
```

### logs.sh
**Purpose:** View container logs  
**When to use:** Debugging or monitoring  
**What it does:**
- Interactive menu to select container
- Shows real-time logs

```bash
./logs.sh
```

### monitor.sh
**Purpose:** System health dashboard  
**When to use:** Regular monitoring  
**What it does:**
- Shows system resources (CPU, Memory, Disk)
- Shows container status
- Shows application health
- Shows recent errors

```bash
./monitor.sh
```

---

## 🔧 Common Tasks

### Deploy for First Time
```bash
./setup-ec2.sh  # First time only
# Logout and login
cp .env.production .env
nano .env  # Configure
./deploy.sh
```

### Update Application
```bash
git pull origin main
./deploy.sh
```

### View Logs
```bash
./logs.sh
# Or directly:
docker logs -f medical-aesthetics-backend
```

### Backup Database
```bash
./backup.sh
```

### Restore Database
```bash
./restore.sh /home/ec2-user/backups/db_backup_20250116_120000.sql.gz
```

### Monitor System
```bash
./monitor.sh
```

### Restart Application
```bash
docker restart medical-aesthetics-backend
```

### Stop Everything
```bash
docker-compose -f docker-compose.prod.yml down
```

### Start Everything
```bash
docker-compose -f docker-compose.prod.yml up -d
```

### Check Container Status
```bash
docker ps
docker-compose -f docker-compose.prod.yml ps
```

### Access Database
```bash
docker exec -it medical-aesthetics-postgres psql -U postgres -d medical_aesthetics
```

### Execute Command in Container
```bash
docker exec -it medical-aesthetics-backend sh
```

---

## 🔐 Security Checklist

Before deploying to production:

- [ ] Generate strong passwords for DATABASE_PASSWORD
- [ ] Generate strong secrets for JWT_SECRET, JWT_ACCESS_SECRET, JWT_REFRESH_SECRET
- [ ] Set REDIS_PASSWORD
- [ ] Update API_BASE_URL with your domain or EC2 IP
- [ ] Configure Firebase credentials (if using)
- [ ] Configure SMS/Viber credentials (if using)
- [ ] Verify .env is in .gitignore
- [ ] Setup AWS Security Group rules properly
- [ ] Restrict SSH access to your IP only
- [ ] Setup SSL certificate (if using domain)
- [ ] Enable automatic backups
- [ ] Test disaster recovery procedure

---

## 📊 Monitoring & Maintenance

### Daily Tasks
- Check application logs: `./logs.sh`
- Monitor system resources: `./monitor.sh`

### Weekly Tasks
- Review error logs
- Check disk space: `df -h`
- Verify backups are running

### Monthly Tasks
- Update system packages: `sudo yum update -y`
- Update Docker images: `./deploy.sh`
- Review security group rules
- Test backup restore procedure
- Rotate secrets (recommended)

---

## 🆘 Troubleshooting

### Application Won't Start
```bash
# Check logs
docker logs medical-aesthetics-backend

# Check if port is in use
sudo netstat -tulpn | grep 3001

# Restart Docker
sudo systemctl restart docker
```

### Database Connection Error
```bash
# Check PostgreSQL is running
docker ps | grep postgres

# Check environment variables
docker exec medical-aesthetics-backend env | grep DATABASE

# Check PostgreSQL logs
docker logs medical-aesthetics-postgres
```

### Out of Disk Space
```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -a --volumes

# Clean old logs
sudo journalctl --vacuum-time=7d
```

### Can't Access from Outside
1. Check AWS Security Group - ensure port 3001 is open
2. Check if application is listening: `sudo netstat -tulpn | grep 3001`
3. Test locally first: `curl http://localhost:3001/health`

---

## 📚 Additional Resources

- **NestJS Documentation:** https://docs.nestjs.com/
- **Docker Documentation:** https://docs.docker.com/
- **AWS EC2 Documentation:** https://docs.aws.amazon.com/ec2/
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/

---

## 🎓 Architecture Overview

```
┌─────────────────────────────────────────┐
│           AWS EC2 Instance              │
│                                         │
│  ┌─────────────────────────────────┐   │
│  │   Docker Compose Network        │   │
│  │                                 │   │
│  │  ┌──────────────────────────┐  │   │
│  │  │  Backend Container       │  │   │
│  │  │  (NestJS App)            │  │   │
│  │  │  Port: 3001              │  │   │
│  │  └──────────┬───────────────┘  │   │
│  │             │                   │   │
│  │  ┌──────────▼───────────────┐  │   │
│  │  │  PostgreSQL Container    │  │   │
│  │  │  Port: 5432              │  │   │
│  │  │  Volume: postgres_data   │  │   │
│  │  └──────────────────────────┘  │   │
│  │                                 │   │
│  │  ┌──────────────────────────┐  │   │
│  │  │  Redis Container         │  │   │
│  │  │  Port: 6379              │  │   │
│  │  │  Volume: redis_data      │  │   │
│  │  └──────────────────────────┘  │   │
│  └─────────────────────────────────┘   │
│                                         │
│  Security Group:                        │
│  - Port 22 (SSH)                        │
│  - Port 3001 (API)                      │
│  - Port 80/443 (HTTP/HTTPS - optional)  │
└─────────────────────────────────────────┘
```

---

## 📝 Environment Variables Reference

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| DATABASE_HOST | Yes | postgres | Database host |
| DATABASE_PORT | Yes | 5432 | Database port |
| DATABASE_USERNAME | Yes | postgres | Database user |
| DATABASE_PASSWORD | Yes | - | Database password |
| DATABASE_NAME | Yes | medical_aesthetics | Database name |
| JWT_SECRET | Yes | - | JWT signing secret |
| JWT_ACCESS_SECRET | Yes | - | Access token secret |
| JWT_REFRESH_SECRET | Yes | - | Refresh token secret |
| REDIS_HOST | Yes | redis | Redis host |
| REDIS_PORT | Yes | 6379 | Redis port |
| REDIS_PASSWORD | Yes | - | Redis password |
| NODE_ENV | Yes | production | Environment |
| PORT | Yes | 3001 | Application port |
| API_BASE_URL | Yes | - | Public API URL |

---

## 🔄 Deployment Workflow

```
1. Code Changes (Local)
   ↓
2. Commit & Push to Git
   ↓
3. SSH to EC2
   ↓
4. git pull origin main
   ↓
5. ./deploy.sh
   ↓
6. Verify Deployment
   ↓
7. Monitor Logs
```

---

## ✅ Post-Deployment Checklist

After successful deployment:

- [ ] Application is accessible from outside
- [ ] API documentation is available at /api
- [ ] Database migrations ran successfully
- [ ] All containers are running
- [ ] Health check endpoint responds
- [ ] Logs show no errors
- [ ] Backup script is scheduled
- [ ] Monitoring is in place
- [ ] SSL is configured (if using domain)
- [ ] Environment variables are correct

---

## 🎉 Success!

Your Medical Aesthetics Backend is now deployed on EC2!

**Access your application:**
- API: `http://YOUR_EC2_IP:3001`
- API Docs: `http://YOUR_EC2_IP:3001/api`
- Health Check: `http://YOUR_EC2_IP:3001/health`

**Need help?** Check DEPLOYMENT_GUIDE.md for detailed documentation.

---

**Last Updated:** 2025-01-16  
**Version:** 1.0.0
