#!/bin/bash

# EC2 Initial Setup Script
# Run this script on a fresh EC2 instance to install Docker and Docker Compose

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}EC2 Instance Setup for Docker${NC}"
echo -e "${GREEN}========================================${NC}"

# Update system packages
echo -e "${YELLOW}Updating system packages...${NC}"
sudo yum update -y

# Install Docker
echo -e "${YELLOW}Installing Docker...${NC}"
sudo yum install -y docker

# Start Docker service
echo -e "${YELLOW}Starting Docker service...${NC}"
sudo systemctl start docker
sudo systemctl enable docker

# Add ec2-user to docker group
echo -e "${YELLOW}Adding user to docker group...${NC}"
sudo usermod -a -G docker ec2-user

# Install Docker Compose
echo -e "${YELLOW}Installing Docker Compose...${NC}"
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installations
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Installation Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo -e "${YELLOW}Docker version:${NC}"
docker --version

echo ""
echo -e "${YELLOW}Docker Compose version:${NC}"
docker-compose --version

echo ""
echo -e "${GREEN}✓ Docker and Docker Compose installed successfully${NC}"
echo -e "${YELLOW}⚠ Please log out and log back in for group changes to take effect${NC}"
echo -e "${YELLOW}⚠ Or run: newgrp docker${NC}"
echo ""
echo -e "${GREEN}Next steps:${NC}"
echo -e "1. Clone your repository"
echo -e "2. Create .env file with production credentials"
echo -e "3. Run ./deploy.sh to start the application"
