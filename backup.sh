#!/bin/bash

# Database Backup Script
# Run this script to backup PostgreSQL and Redis data

set -e

# Configuration
BACKUP_DIR="/home/ec2-user/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=7

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database Backup Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Create backup directory if it doesn't exist
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
echo -e "${YELLOW}Backing up PostgreSQL database...${NC}"
if docker ps | grep -q medical-aesthetics-postgres; then
    docker exec medical-aesthetics-postgres pg_dump -U postgres medical_aesthetics > $BACKUP_DIR/db_backup_$DATE.sql
    
    # Compress backup
    gzip $BACKUP_DIR/db_backup_$DATE.sql
    
    echo -e "${GREEN}✓ PostgreSQL backup completed: db_backup_$DATE.sql.gz${NC}"
else
    echo -e "${RED}✗ PostgreSQL container is not running${NC}"
fi

# Backup Redis
echo -e "${YELLOW}Backing up Redis data...${NC}"
if docker ps | grep -q medical-aesthetics-redis; then
    docker exec medical-aesthetics-redis redis-cli SAVE
    docker cp medical-aesthetics-redis:/data/dump.rdb $BACKUP_DIR/redis_backup_$DATE.rdb
    
    # Compress backup
    gzip $BACKUP_DIR/redis_backup_$DATE.rdb
    
    echo -e "${GREEN}✓ Redis backup completed: redis_backup_$DATE.rdb.gz${NC}"
else
    echo -e "${RED}✗ Redis container is not running${NC}"
fi

# Backup environment file (without sensitive data)
echo -e "${YELLOW}Backing up configuration...${NC}"
if [ -f .env ]; then
    # Create a sanitized version without passwords
    grep -v "PASSWORD\|SECRET\|KEY\|TOKEN" .env > $BACKUP_DIR/env_backup_$DATE.txt 2>/dev/null || true
    echo -e "${GREEN}✓ Configuration backup completed${NC}"
fi

# Clean up old backups
echo -e "${YELLOW}Cleaning up old backups (older than $RETENTION_DAYS days)...${NC}"
find $BACKUP_DIR -name "*.sql.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.rdb.gz" -mtime +$RETENTION_DAYS -delete
find $BACKUP_DIR -name "*.txt" -mtime +$RETENTION_DAYS -delete

# Show backup size
BACKUP_SIZE=$(du -sh $BACKUP_DIR | cut -f1)

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Backup completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Backup location: $BACKUP_DIR${NC}"
echo -e "${YELLOW}Total backup size: $BACKUP_SIZE${NC}"
echo -e "${YELLOW}Backup date: $DATE${NC}"

# List recent backups
echo ""
echo -e "${YELLOW}Recent backups:${NC}"
ls -lh $BACKUP_DIR | tail -10
