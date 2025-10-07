# Makefile for SMIIO Backtest Platform

.PHONY: help dev prod build stop clean logs backup

# Default target
help:
	@echo "🚀 SMIIO Backtest Platform - Commands"
	@echo ""
	@echo "Development:"
	@echo "  make dev          - Start development environment"
	@echo "  make dev-logs     - View development logs"
	@echo "  make dev-stop     - Stop development environment"
	@echo ""
	@echo "Production:"
	@echo "  make prod         - Start production environment"
	@echo "  make prod-logs    - View production logs"
	@echo "  make prod-stop    - Stop production environment"
	@echo "  make prod-restart - Restart production services"
	@echo ""
	@echo "Build:"
	@echo "  make build        - Build all Docker images"
	@echo "  make build-prod   - Build production images"
	@echo ""
	@echo "Maintenance:"
	@echo "  make clean        - Remove containers and volumes"
	@echo "  make backup       - Backup database"
	@echo "  make restore      - Restore database from backup"
	@echo "  make shell-backend - Open shell in backend container"
	@echo "  make shell-frontend - Open shell in frontend container"

# ===== Development =====

dev:
	@echo "🚀 Starting development environment..."
	docker compose up -d
	@echo "✅ Development environment started!"
	@echo "📊 Frontend: http://localhost:3000"
	@echo "🔧 Backend API: http://localhost:8000"
	@echo "📚 API Docs: http://localhost:8000/docs"

dev-logs:
	docker compose logs -f

dev-stop:
	docker compose down

# ===== Production =====

prod:
	@echo "🚀 Starting production environment..."
	@if [ ! -f .env.production ]; then \
		echo "❌ Error: .env.production not found!"; \
		echo "📝 Copy env.production.example to .env.production and configure it."; \
		exit 1; \
	fi
	docker compose -f docker-compose.prod.yml --env-file .env.production up -d
	@echo "✅ Production environment started!"
	@echo "🌐 Application: http://localhost"
	@echo "📊 Status: docker compose -f docker-compose.prod.yml ps"

prod-logs:
	docker compose -f docker-compose.prod.yml logs -f

prod-stop:
	docker compose -f docker-compose.prod.yml down

prod-restart:
	docker compose -f docker-compose.prod.yml restart

# ===== Build =====

build:
	@echo "🔨 Building Docker images..."
	docker compose build

build-prod:
	@echo "🔨 Building production Docker images..."
	docker compose -f docker-compose.prod.yml build

# ===== Maintenance =====

clean:
	@echo "🧹 Cleaning up containers and volumes..."
	docker compose down -v
	docker compose -f docker-compose.prod.yml down -v
	@echo "✅ Cleanup complete!"

backup:
	@echo "💾 Creating database backup..."
	@mkdir -p backups
	docker compose -f docker-compose.prod.yml exec -T postgres pg_dump -U smiio_user smiio_backtest > backups/backup_$$(date +%Y%m%d_%H%M%S).sql
	@echo "✅ Backup created in backups/ directory"

restore:
	@echo "📥 Restoring database..."
	@read -p "Enter backup file path: " backup_file; \
	docker compose -f docker-compose.prod.yml exec -T postgres psql -U smiio_user smiio_backtest < $$backup_file
	@echo "✅ Database restored!"

shell-backend:
	docker compose -f docker-compose.prod.yml exec backend bash

shell-frontend:
	docker compose -f docker-compose.prod.yml exec frontend sh

# ===== Database =====

db-migrate:
	@echo "🔄 Running database migrations..."
	docker compose -f docker-compose.prod.yml exec backend alembic upgrade head
	@echo "✅ Migrations complete!"

db-reset:
	@echo "⚠️  WARNING: This will DELETE all data!"
	@read -p "Are you sure? (yes/no): " confirm; \
	if [ "$$confirm" = "yes" ]; then \
		docker compose -f docker-compose.prod.yml down -v; \
		docker compose -f docker-compose.prod.yml up -d postgres; \
		sleep 5; \
		docker compose -f docker-compose.prod.yml up -d; \
		echo "✅ Database reset complete!"; \
	else \
		echo "❌ Cancelled."; \
	fi

# ===== Monitoring =====

stats:
	docker stats

health:
	@echo "🏥 Checking service health..."
	@docker compose -f docker-compose.prod.yml ps

# ===== SSL =====

ssl-renew:
	@echo "🔒 Renewing SSL certificates..."
	sudo certbot renew --quiet
	@echo "✅ SSL certificates renewed!"
	@echo "🔄 Restarting nginx..."
	docker compose -f docker-compose.prod.yml restart nginx
	@echo "✅ Nginx restarted!"

