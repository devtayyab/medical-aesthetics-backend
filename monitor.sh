#!/bin/bash

# System Monitoring Script
# Quick overview of system and container health

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

clear

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}   Medical Aesthetics - System Monitor${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# System Information
echo -e "${BLUE}=== System Information ===${NC}"
echo -e "${YELLOW}Hostname:${NC} $(hostname)"
echo -e "${YELLOW}Uptime:${NC} $(uptime -p)"
echo -e "${YELLOW}Current Time:${NC} $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# CPU Usage
echo -e "${BLUE}=== CPU Usage ===${NC}"
top -bn1 | grep "Cpu(s)" | sed "s/.*, *\([0-9.]*\)%* id.*/\1/" | awk '{print "CPU Usage: " 100 - $1"%"}'
echo ""

# Memory Usage
echo -e "${BLUE}=== Memory Usage ===${NC}"
free -h | awk 'NR==2{printf "Used: %s / %s (%.2f%%)\n", $3, $2, $3*100/$2}'
echo ""

# Disk Usage
echo -e "${BLUE}=== Disk Usage ===${NC}"
df -h / | awk 'NR==2{printf "Used: %s / %s (%s)\n", $3, $2, $5}'
echo ""

# Docker Information
echo -e "${BLUE}=== Docker Containers ===${NC}"
if command -v docker &> /dev/null; then
    RUNNING=$(docker ps -q | wc -l)
    TOTAL=$(docker ps -aq | wc -l)
    echo -e "${YELLOW}Running Containers:${NC} $RUNNING / $TOTAL"
    echo ""
    
    # Container Status
    echo -e "${YELLOW}Container Status:${NC}"
    docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}" | grep medical-aesthetics || echo "No containers running"
    echo ""
    
    # Container Resource Usage
    echo -e "${BLUE}=== Container Resources ===${NC}"
    docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}" | grep medical-aesthetics || echo "No containers running"
    echo ""
else
    echo -e "${RED}Docker is not installed${NC}"
    echo ""
fi

# Network Connections
echo -e "${BLUE}=== Network Connections ===${NC}"
if command -v netstat &> /dev/null; then
    CONNECTIONS=$(netstat -an | grep :3001 | grep ESTABLISHED | wc -l)
    echo -e "${YELLOW}Active connections on port 3001:${NC} $CONNECTIONS"
else
    echo -e "${YELLOW}netstat not available${NC}"
fi
echo ""

# Application Health Check
echo -e "${BLUE}=== Application Health ===${NC}"
if curl -s http://localhost:3001/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is responding${NC}"
else
    echo -e "${RED}✗ Backend is not responding${NC}"
fi

# Database Health Check
if docker ps | grep -q medical-aesthetics-postgres; then
    if docker exec medical-aesthetics-postgres pg_isready -U postgres > /dev/null 2>&1; then
        echo -e "${GREEN}✓ PostgreSQL is healthy${NC}"
    else
        echo -e "${RED}✗ PostgreSQL is not responding${NC}"
    fi
else
    echo -e "${RED}✗ PostgreSQL container is not running${NC}"
fi

# Redis Health Check
if docker ps | grep -q medical-aesthetics-redis; then
    if docker exec medical-aesthetics-redis redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis is healthy${NC}"
    else
        echo -e "${RED}✗ Redis is not responding${NC}"
    fi
else
    echo -e "${RED}✗ Redis container is not running${NC}"
fi
echo ""

# Recent Errors (last 10 error lines from backend logs)
echo -e "${BLUE}=== Recent Errors (Last 10) ===${NC}"
if docker ps | grep -q medical-aesthetics-backend; then
    ERRORS=$(docker logs --tail 100 medical-aesthetics-backend 2>&1 | grep -i "error" | tail -10)
    if [ -z "$ERRORS" ]; then
        echo -e "${GREEN}No recent errors${NC}"
    else
        echo -e "${RED}$ERRORS${NC}"
    fi
else
    echo -e "${YELLOW}Backend container is not running${NC}"
fi
echo ""

# Docker Disk Usage
echo -e "${BLUE}=== Docker Disk Usage ===${NC}"
if command -v docker &> /dev/null; then
    docker system df
else
    echo -e "${YELLOW}Docker is not installed${NC}"
fi
echo ""

echo -e "${GREEN}========================================${NC}"
echo -e "${YELLOW}Press any key to exit or Ctrl+C${NC}"
read -n 1 -s
