#!/bin/bash

# Database Restore Script
# Run this script to restore PostgreSQL from backup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database Restore Script${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if backup file is provided
if [ -z "$1" ]; then
    echo -e "${RED}Error: No backup file specified${NC}"
    echo -e "${YELLOW}Usage: ./restore.sh <backup_file.sql.gz>${NC}"
    echo ""
    echo -e "${YELLOW}Available backups:${NC}"
    ls -lh /home/ec2-user/backups/*.sql.gz 2>/dev/null || echo "No backups found"
    exit 1
fi

BACKUP_FILE=$1

# Check if file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo -e "${RED}Error: Backup file not found: $BACKUP_FILE${NC}"
    exit 1
fi

# Confirm restore
echo -e "${YELLOW}⚠ WARNING: This will replace the current database!${NC}"
echo -e "${YELLOW}Backup file: $BACKUP_FILE${NC}"
echo -e "${RED}Are you sure you want to continue? (yes/no)${NC}"
read -r CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${YELLOW}Restore cancelled${NC}"
    exit 0
fi

# Check if PostgreSQL container is running
if ! docker ps | grep -q medical-aesthetics-postgres; then
    echo -e "${RED}Error: PostgreSQL container is not running${NC}"
    exit 1
fi

# Create a backup of current database before restore
echo -e "${YELLOW}Creating safety backup of current database...${NC}"
SAFETY_BACKUP="/tmp/pre_restore_backup_$(date +%Y%m%d_%H%M%S).sql"
docker exec medical-aesthetics-postgres pg_dump -U postgres medical_aesthetics > $SAFETY_BACKUP
echo -e "${GREEN}✓ Safety backup created: $SAFETY_BACKUP${NC}"

# Decompress backup if needed
TEMP_FILE="/tmp/restore_temp.sql"
if [[ $BACKUP_FILE == *.gz ]]; then
    echo -e "${YELLOW}Decompressing backup file...${NC}"
    gunzip -c $BACKUP_FILE > $TEMP_FILE
else
    cp $BACKUP_FILE $TEMP_FILE
fi

# Stop backend to prevent connections
echo -e "${YELLOW}Stopping backend container...${NC}"
docker stop medical-aesthetics-backend || true

# Drop and recreate database
echo -e "${YELLOW}Dropping existing database...${NC}"
docker exec medical-aesthetics-postgres psql -U postgres -c "DROP DATABASE IF EXISTS medical_aesthetics;"
docker exec medical-aesthetics-postgres psql -U postgres -c "CREATE DATABASE medical_aesthetics;"

# Restore database
echo -e "${YELLOW}Restoring database from backup...${NC}"
cat $TEMP_FILE | docker exec -i medical-aesthetics-postgres psql -U postgres -d medical_aesthetics

# Clean up temp file
rm -f $TEMP_FILE

# Start backend
echo -e "${YELLOW}Starting backend container...${NC}"
docker start medical-aesthetics-backend

# Wait for backend to be ready
echo -e "${YELLOW}Waiting for backend to be ready...${NC}"
sleep 5

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Database restored successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Safety backup location: $SAFETY_BACKUP${NC}"
echo -e "${YELLOW}You can delete it after verifying the restore${NC}"

# Show container status
echo ""
echo -e "${YELLOW}Container status:${NC}"
docker ps | grep medical-aesthetics
