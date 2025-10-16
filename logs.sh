#!/bin/bash

# Logs Viewer Script
# Quick access to container logs

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Container Logs Viewer${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Select a container to view logs:"
echo "1) Backend"
echo "2) PostgreSQL"
echo "3) Redis"
echo "4) All containers"
echo "5) Exit"
echo ""
read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        echo -e "${YELLOW}Viewing Backend logs (Ctrl+C to exit)...${NC}"
        docker logs -f --tail 100 medical-aesthetics-backend
        ;;
    2)
        echo -e "${YELLOW}Viewing PostgreSQL logs (Ctrl+C to exit)...${NC}"
        docker logs -f --tail 100 medical-aesthetics-postgres
        ;;
    3)
        echo -e "${YELLOW}Viewing Redis logs (Ctrl+C to exit)...${NC}"
        docker logs -f --tail 100 medical-aesthetics-redis
        ;;
    4)
        echo -e "${YELLOW}Viewing all container logs...${NC}"
        docker-compose -f docker-compose.prod.yml logs --tail 50
        ;;
    5)
        echo "Exiting..."
        exit 0
        ;;
    *)
        echo "Invalid choice"
        exit 1
        ;;
esac
