# EC2 Docker Deployment Guide

Complete guide to deploy the Medical Aesthetics Backend to AWS EC2 using Docker.

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [EC2 Instance Setup](#ec2-instance-setup)
3. [Initial Server Configuration](#initial-server-configuration)
4. [Application Deployment](#application-deployment)
5. [Post-Deployment](#post-deployment)
6. [Maintenance & Monitoring](#maintenance--monitoring)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

### Local Machine
- AWS Account with EC2 access
- SSH key pair for EC2 access
- Git installed
- Basic knowledge of Linux commands

### AWS Resources Needed
- EC2 Instance (recommended: t3.medium or larger)
- Security Group with appropriate ports open
- Elastic IP (optional but recommended)

---

## EC2 Instance Setup

### Step 1: Launch EC2 Instance

1. **Go to AWS Console** → EC2 → Launch Instance

2. **Configure Instance:**
   - **Name:** `medical-aesthetics-backend`
   - **AMI:** Amazon Linux 2023 (or Amazon Linux 2)
   - **Instance Type:** t3.medium (minimum: t3.small)
   - **Key Pair:** Select or create a new key pair
   - **Storage:** 20 GB gp3 (minimum)

3. **Network Settings:**
   - Create or select a security group with these inbound rules:
     ```
     SSH (22)         - Your IP
     HTTP (80)        - 0.0.0.0/0
     HTTPS (443)      - 0.0.0.0/0
     Custom (3001)    - 0.0.0.0/0 (or your frontend IP)
     ```

4. **Launch Instance** and wait for it to be running

### Step 2: Connect to EC2 Instance

```bash
# Change key permissions
chmod 400 your-key.pem

# Connect to EC2
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP
```

---

## Initial Server Configuration

### Step 1: Run Setup Script

On your EC2 instance, create and run the setup script:

```bash
# Create setup script
cat > setup-ec2.sh << 'EOF'
#!/bin/bash
set -e

echo "=========================================="
echo "EC2 Instance Setup for Docker"
echo "=========================================="

# Update system packages
echo "Updating system packages..."
sudo yum update -y

# Install Docker
echo "Installing Docker..."
sudo yum install -y docker

# Start Docker service
echo "Starting Docker service..."
sudo systemctl start docker
sudo systemctl enable docker

# Add ec2-user to docker group
echo "Adding user to docker group..."
sudo usermod -a -G docker ec2-user

# Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
echo "Installing Git..."
sudo yum install -y git

echo "=========================================="
echo "Installation Complete!"
echo "=========================================="
docker --version
docker-compose --version
git --version

echo ""
echo "✓ Setup completed successfully"
echo "⚠ Please log out and log back in for group changes to take effect"
EOF

# Make executable and run
chmod +x setup-ec2.sh
./setup-ec2.sh
```

### Step 2: Logout and Login Again

```bash
# Logout
exit

# Login again
ssh -i your-key.pem ec2-user@YOUR_EC2_PUBLIC_IP

# Verify docker works without sudo
docker ps
```

---

## Application Deployment

### Step 1: Clone Repository

```bash
# Clone your repository
git clone https://github.com/YOUR_USERNAME/medical-aesthetics-backend.git
cd medical-aesthetics-backend

# Or if using private repo
git clone https://<token>@github.com/YOUR_USERNAME/medical-aesthetics-backend.git
```

### Step 2: Configure Environment Variables

```bash
# Copy example env file
cp .env.example .env

# Edit environment file
nano .env
```

**Important Environment Variables to Update:**

```bash
# Database Configuration
DATABASE_HOST=postgres
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=YOUR_STRONG_PASSWORD_HERE  # Change this!
DATABASE_NAME=medical_aesthetics

# JWT Configuration
JWT_SECRET=YOUR_SUPER_SECRET_JWT_KEY_HERE  # Generate strong secret!
JWT_ACCESS_SECRET=YOUR_ACCESS_SECRET_HERE
JWT_REFRESH_SECRET=YOUR_REFRESH_SECRET_HERE
JWT_EXPIRATION=1d
JWT_REFRESH_EXPIRATION=7d

# Redis Configuration
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=YOUR_REDIS_PASSWORD  # Set a strong password

# Firebase Configuration (if using push notifications)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email
FIREBASE_PRIVATE_KEY=your-private-key

# Application Configuration
NODE_ENV=production
PORT=3001
API_BASE_URL=http://YOUR_EC2_PUBLIC_IP:3001  # Or your domain

# SMS & Viber (configure as needed)
SMS_GATEWAY_URL=https://api.sms-gateway.com
SMS_GATEWAY_API_KEY=your-sms-api-key
VIBER_API_URL=https://chatapi.viber.com/pa
VIBER_AUTH_TOKEN=your-viber-auth-token
```

**Generate Strong Secrets:**
```bash
# Generate random secrets
openssl rand -base64 32  # Use for JWT secrets
openssl rand -base64 24  # Use for passwords
```

### Step 3: Make Scripts Executable

```bash
chmod +x deploy.sh
chmod +x setup-ec2.sh
```

### Step 4: Deploy Application

```bash
# Run deployment script
./deploy.sh
```

This script will:
- Pull latest code (if git repo)
- Stop existing containers
- Build Docker images
- Start all services (PostgreSQL, Redis, Backend)
- Run database migrations
- Show container status and logs

### Step 5: Verify Deployment

```bash
# Check if all containers are running
docker ps

# Check application logs
docker logs -f medical-aesthetics-backend

# Test API endpoint
curl http://localhost:3001/health

# Test from outside (replace with your EC2 IP)
curl http://YOUR_EC2_PUBLIC_IP:3001/health
```

---

## Post-Deployment

### Configure Domain (Optional but Recommended)

If you have a domain, set up Nginx as reverse proxy:

```bash
# Install Nginx
sudo yum install -y nginx

# Create Nginx configuration
sudo nano /etc/nginx/conf.d/medical-aesthetics.conf
```

Add this configuration:

```nginx
server {
    listen 80;
    server_name your-domain.com www.your-domain.com;

    location / {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
# Test Nginx configuration
sudo nginx -t

# Start Nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

### Setup SSL with Let's Encrypt (Recommended)

```bash
# Install Certbot
sudo yum install -y certbot python3-certbot-nginx

# Get SSL certificate
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal is configured automatically
# Test renewal
sudo certbot renew --dry-run
```

### Setup Automatic Backups

Create backup script:

```bash
nano ~/backup.sh
```

Add:

```bash
#!/bin/bash
BACKUP_DIR="/home/ec2-user/backups"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec medical-aesthetics-postgres pg_dump -U postgres medical_aesthetics > $BACKUP_DIR/db_backup_$DATE.sql

# Backup Redis (if needed)
docker exec medical-aesthetics-redis redis-cli SAVE
docker cp medical-aesthetics-redis:/data/dump.rdb $BACKUP_DIR/redis_backup_$DATE.rdb

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.rdb" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
# Make executable
chmod +x ~/backup.sh

# Add to crontab (daily at 2 AM)
crontab -e
# Add this line:
0 2 * * * /home/ec2-user/backup.sh >> /home/ec2-user/backup.log 2>&1
```

---

## Maintenance & Monitoring

### Useful Docker Commands

```bash
# View all containers
docker ps -a

# View logs
docker logs -f medical-aesthetics-backend
docker logs -f medical-aesthetics-postgres
docker logs -f medical-aesthetics-redis

# Restart a service
docker restart medical-aesthetics-backend

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# View resource usage
docker stats

# Execute command in container
docker exec -it medical-aesthetics-backend sh
docker exec -it medical-aesthetics-postgres psql -U postgres -d medical_aesthetics

# Clean up unused resources
docker system prune -a
```

### Update Application

```bash
# Pull latest changes
git pull origin main

# Redeploy
./deploy.sh
```

### Database Operations

```bash
# Access PostgreSQL
docker exec -it medical-aesthetics-postgres psql -U postgres -d medical_aesthetics

# Backup database
docker exec medical-aesthetics-postgres pg_dump -U postgres medical_aesthetics > backup.sql

# Restore database
cat backup.sql | docker exec -i medical-aesthetics-postgres psql -U postgres -d medical_aesthetics

# Run migrations
docker exec medical-aesthetics-backend npm run migration:run
```

### Monitor System Resources

```bash
# Check disk space
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check Docker disk usage
docker system df
```

---

## Troubleshooting

### Container Won't Start

```bash
# Check logs
docker logs medical-aesthetics-backend

# Check if port is already in use
sudo netstat -tulpn | grep 3001

# Restart Docker service
sudo systemctl restart docker
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check PostgreSQL logs
docker logs medical-aesthetics-postgres

# Test connection from backend container
docker exec medical-aesthetics-backend ping postgres

# Verify environment variables
docker exec medical-aesthetics-backend env | grep DATABASE
```

### Out of Disk Space

```bash
# Check disk usage
df -h

# Clean Docker resources
docker system prune -a --volumes

# Remove old logs
sudo journalctl --vacuum-time=7d
```

### High Memory Usage

```bash
# Check container resource usage
docker stats

# Restart containers
docker-compose -f docker-compose.prod.yml restart

# Consider upgrading EC2 instance type
```

### Application Not Accessible from Outside

```bash
# Check security group rules in AWS Console
# Ensure port 3001 (or 80/443 if using Nginx) is open

# Check if application is listening
sudo netstat -tulpn | grep 3001

# Check firewall (if enabled)
sudo iptables -L
```

### SSL Certificate Issues

```bash
# Renew certificate manually
sudo certbot renew

# Check certificate status
sudo certbot certificates

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

---

## Security Best Practices

1. **Use Strong Passwords:** Generate strong passwords for database and Redis
2. **Keep Secrets Secret:** Never commit .env file to git
3. **Regular Updates:** Keep system and Docker images updated
4. **Firewall Rules:** Only open necessary ports in security group
5. **Use SSL:** Always use HTTPS in production
6. **Regular Backups:** Automate database backups
7. **Monitor Logs:** Regularly check application and system logs
8. **Non-root User:** Application runs as non-root user in Docker
9. **Rate Limiting:** Configure rate limiting in application
10. **Security Groups:** Restrict SSH access to your IP only

---

## Performance Optimization

1. **Use Elastic IP:** Prevent IP changes on instance restart
2. **Enable CloudWatch:** Monitor EC2 metrics
3. **Database Indexing:** Ensure proper database indexes
4. **Redis Caching:** Utilize Redis for caching
5. **CDN:** Use CloudFront for static assets
6. **Auto-scaling:** Consider ECS or EKS for production
7. **Load Balancer:** Use ALB for multiple instances

---

## Support & Resources

- **Docker Documentation:** https://docs.docker.com/
- **AWS EC2 Documentation:** https://docs.aws.amazon.com/ec2/
- **NestJS Documentation:** https://docs.nestjs.com/
- **PostgreSQL Documentation:** https://www.postgresql.org/docs/

---

## Quick Reference Commands

```bash
# Deploy/Update application
./deploy.sh

# View logs
docker logs -f medical-aesthetics-backend

# Restart application
docker restart medical-aesthetics-backend

# Stop all services
docker-compose -f docker-compose.prod.yml down

# Start all services
docker-compose -f docker-compose.prod.yml up -d

# Backup database
docker exec medical-aesthetics-postgres pg_dump -U postgres medical_aesthetics > backup.sql

# Check container status
docker ps

# Check resource usage
docker stats

# Clean up
docker system prune -a
```

---

**Deployment completed! Your Medical Aesthetics Backend is now running on EC2.**
