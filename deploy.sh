#!/bin/bash

# SMIIO Backtest Platform - Production Deployment Script
# Usage: ./deploy.sh

set -e  # Exit on error

echo "🚀 SMIIO Backtest Platform - Production Deployment"
echo "=================================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.production exists
if [ ! -f .env.production ]; then
    echo -e "${RED}❌ Error: .env.production not found!${NC}"
    echo "📝 Please copy env.production.example to .env.production and configure it."
    exit 1
fi

# Load environment variables
set -a
source .env.production
set +a

echo "✅ Environment variables loaded"
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo -e "${RED}❌ Error: Docker is not running!${NC}"
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if backend directory exists
BACKEND_PATH="../smiio-backend"
if [ ! -d "$BACKEND_PATH" ]; then
    echo -e "${YELLOW}⚠️  Warning: Backend directory not found at $BACKEND_PATH${NC}"
    read -p "Enter backend directory path: " BACKEND_PATH
fi

echo "✅ Backend directory: $BACKEND_PATH"
echo ""

# Pull latest changes
echo "📥 Pulling latest changes from git..."
git pull origin main || echo "⚠️  Git pull failed or not a git repository"
echo ""

# Build Docker images
echo "🔨 Building Docker images..."
docker compose -f docker-compose.prod.yml build --no-cache
echo "✅ Images built successfully"
echo ""

# Stop existing containers
echo "🛑 Stopping existing containers..."
docker compose -f docker-compose.prod.yml down
echo "✅ Containers stopped"
echo ""

# Start services
echo "🚀 Starting production services..."
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
echo ""

# Wait for services to be healthy
echo "⏳ Waiting for services to be healthy..."
sleep 10

# Check health
echo "🏥 Checking service health..."
docker compose -f docker-compose.prod.yml ps

echo ""
echo "=================================================="
echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "📊 Frontend: http://localhost (or your domain)"
echo "🔧 Backend API: http://localhost:8000 (or your domain/api)"
echo "📚 API Docs: http://localhost:8000/docs"
echo ""
echo "📝 Useful commands:"
echo "  make prod-logs    - View logs"
echo "  make prod-stop    - Stop services"
echo "  make backup       - Backup database"
echo ""
echo "🎉 Happy backtesting!"

