#!/bin/bash

# Medical Aesthetics Backend Deployment Script
# This script deploys the application on EC2 using Docker

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Medical Aesthetics Backend Deployment${NC}"
echo -e "${GREEN}========================================${NC}"

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}Error: .env file not found!${NC}"
    echo -e "${YELLOW}Please create .env file from .env.example${NC}"
    exit 1
fi

# Load environment variables
source .env

# Pull latest code (if using git)
echo -e "${YELLOW}Pulling latest code...${NC}"
if [ -d .git ]; then
    git pull origin main || git pull origin master
else
    echo -e "${YELLOW}Not a git repository, skipping pull${NC}"
fi

# Stop existing containers
echo -e "${YELLOW}Stopping existing containers...${NC}"
docker-compose -f docker-compose.prod.yml down

# Remove old images (optional - uncomment if you want to clean up)
# echo -e "${YELLOW}Removing old images...${NC}"
# docker image prune -f

# Build and start containers
echo -e "${YELLOW}Building and starting containers...${NC}"
docker-compose -f docker-compose.prod.yml up -d --build

# Wait for services to be healthy
echo -e "${YELLOW}Waiting for services to be healthy...${NC}"
sleep 10

# Check if containers are running
if docker ps | grep -q medical-aesthetics-backend; then
    echo -e "${GREEN}✓ Backend container is running${NC}"
else
    echo -e "${RED}✗ Backend container failed to start${NC}"
    docker logs medical-aesthetics-backend
    exit 1
fi

if docker ps | grep -q medical-aesthetics-postgres; then
    echo -e "${GREEN}✓ PostgreSQL container is running${NC}"
else
    echo -e "${RED}✗ PostgreSQL container failed to start${NC}"
    exit 1
fi

if docker ps | grep -q medical-aesthetics-redis; then
    echo -e "${GREEN}✓ Redis container is running${NC}"
else
    echo -e "${RED}✗ Redis container failed to start${NC}"
    exit 1
fi

# Run database migrations (if needed)
echo -e "${YELLOW}Running database migrations...${NC}"
docker exec medical-aesthetics-backend npm run migration:run || echo -e "${YELLOW}No migrations to run or migrations failed${NC}"

# Show container status
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Container Status:${NC}"
docker-compose -f docker-compose.prod.yml ps

echo ""
echo -e "${YELLOW}Application Logs (last 20 lines):${NC}"
docker logs --tail 20 medical-aesthetics-backend

echo ""
echo -e "${GREEN}Application is running at: http://localhost:3001${NC}"
echo -e "${YELLOW}To view logs: docker logs -f medical-aesthetics-backend${NC}"
echo -e "${YELLOW}To stop: docker-compose -f docker-compose.prod.yml down${NC}"
