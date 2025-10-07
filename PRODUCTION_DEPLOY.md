# 🚀 Production Deployment Guide

Полная инструкция по деплою SMIIO Backtest Platform в production.

## 📋 Подготовка

### 1. Требования

- **Сервер**: Linux (Ubuntu 22.04+ / Debian 11+ / CentOS 8+)
- **RAM**: Минимум 4GB (рекомендуется 8GB+)
- **CPU**: 2+ cores
- **Диск**: 20GB+ свободного места
- **Docker**: 24.0+
- **Docker Compose**: 2.20+

### 2. Установка Docker

```bash
# Ubuntu/Debian
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Docker Compose
sudo apt-get update
sudo apt-get install docker-compose-plugin

# Проверка
docker --version
docker compose version
```

## 🔧 Настройка

### 1. Клонировать проект

```bash
git clone your-repo-url
cd smiio-backtest-platform
```

### 2. Создать production переменные окружения

```bash
cp env.production.example .env.production
nano .env.production
```

**Обязательно измените:**

```env
# Сильные пароли!
POSTGRES_PASSWORD=your_super_secure_db_password_here
REDIS_PASSWORD=your_super_secure_redis_password_here

# Случайный SECRET_KEY (можно сгенерировать):
# openssl rand -hex 32
SECRET_KEY=your_64_character_random_secret_key_here

# Ваш домен
NEXT_PUBLIC_API_URL=https://api.yourdomain.com
DOMAIN=yourdomain.com
EMAIL=admin@yourdomain.com
```

### 3. Настроить SSL (опционально, но рекомендуется)

#### Вариант A: Let's Encrypt (бесплатный SSL)

```bash
# Установить certbot
sudo apt-get install certbot

# Получить сертификат
sudo certbot certonly --standalone -d yourdomain.com -d api.yourdomain.com

# Скопировать сертификаты
sudo mkdir -p nginx/ssl
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/
```

#### Вариант B: Самоподписанный сертификат (только для тестирования)

```bash
mkdir -p nginx/ssl
openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout nginx/ssl/privkey.pem \
  -out nginx/ssl/fullchain.pem \
  -subj "/CN=localhost"
```

### 4. Раскомментировать HTTPS в nginx.conf

Отредактируйте `nginx/nginx.conf` и раскомментируйте секцию `server { listen 443 ssl ...`.

## 🚀 Запуск

### 1. Собрать образы

```bash
docker compose -f docker-compose.prod.yml build
```

### 2. Запустить все сервисы

```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

### 3. Проверить статус

```bash
docker compose -f docker-compose.prod.yml ps
```

Все сервисы должны быть `healthy`.

### 4. Просмотр логов

```bash
# Все логи
docker compose -f docker-compose.prod.yml logs -f

# Только бэкенд
docker compose -f docker-compose.prod.yml logs -f backend

# Только фронтенд
docker compose -f docker-compose.prod.yml logs -f frontend
```

## 🔐 Первоначальная настройка

### 1. Создать админа

```bash
# Войти в контейнер бэкенда
docker compose -f docker-compose.prod.yml exec backend bash

# Запустить Python shell
python

# Создать админа
from sqlalchemy.orm import Session
from database import SessionLocal, engine
from models import User
from auth import get_password_hash

db = SessionLocal()

admin = User(
    username="admin",
    hashed_password=get_password_hash("your_secure_admin_password"),
    is_admin=True,
    activated=True
)

db.add(admin)
db.commit()
db.close()

exit()
exit
```

### 2. Проверить подключение

```bash
curl http://localhost/api/health
curl http://localhost:8000/docs
```

## 🌐 DNS настройка

Для работы с доменом настройте A-записи:

```
yourdomain.com        → IP_вашего_сервера
api.yourdomain.com    → IP_вашего_сервера
```

## 📊 Мониторинг

### Healthchecks

Все сервисы имеют healthchecks:

```bash
docker compose -f docker-compose.prod.yml ps
```

### Использование ресурсов

```bash
docker stats
```

### Логи в реальном времени

```bash
docker compose -f docker-compose.prod.yml logs -f --tail=100
```

## 🔄 Обновление

### 1. Остановить сервисы

```bash
docker compose -f docker-compose.prod.yml down
```

### 2. Обновить код

```bash
git pull origin main
```

### 3. Пересобрать и запустить

```bash
docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

## 💾 Backup

### База данных

```bash
# Создать backup
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U smiio_user smiio_backtest > backup_$(date +%Y%m%d_%H%M%S).sql

# Восстановить из backup
docker compose -f docker-compose.prod.yml exec -T postgres psql -U smiio_user smiio_backtest < backup_file.sql
```

### Redis данные

```bash
# Создать snapshot
docker compose -f docker-compose.prod.yml exec redis redis-cli --pass ${REDIS_PASSWORD} SAVE

# Скопировать dump
docker cp smiio_redis_prod:/data/dump.rdb ./redis_backup_$(date +%Y%m%d_%H%M%S).rdb
```

## 🛡️ Безопасность

### 1. Firewall

```bash
# Ubuntu/Debian
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 2. Fail2ban (защита от brute-force)

```bash
sudo apt-get install fail2ban
sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### 3. Автообновление SSL сертификатов

```bash
# Добавить в crontab
sudo crontab -e

# Добавить строку:
0 0 * * 0 certbot renew --quiet && docker compose -f /path/to/docker-compose.prod.yml restart nginx
```

## ⚡ Оптимизация

### 1. Настроить автозапуск

```bash
# Создать systemd service
sudo nano /etc/systemd/system/smiio-backtest.service
```

```ini
[Unit]
Description=SMIIO Backtest Platform
Requires=docker.service
After=docker.service

[Service]
Type=oneshot
RemainAfterExit=yes
WorkingDirectory=/path/to/smiio-backtest-platform
ExecStart=/usr/bin/docker compose -f docker-compose.prod.yml --env-file .env.production up -d
ExecStop=/usr/bin/docker compose -f docker-compose.prod.yml down
User=your_user

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl enable smiio-backtest.service
sudo systemctl start smiio-backtest.service
```

### 2. Логротация

```bash
sudo nano /etc/logrotate.d/docker-containers
```

```
/var/lib/docker/containers/*/*.log {
  rotate 7
  daily
  compress
  missingok
  delaycompress
  copytruncate
}
```

## 🔍 Troubleshooting

### Проблема: Контейнер не запускается

```bash
# Проверить логи
docker compose -f docker-compose.prod.yml logs backend

# Проверить healthcheck
docker inspect smiio_backend_prod | grep -A 10 Health
```

### Проблема: База данных недоступна

```bash
# Проверить логи PostgreSQL
docker compose -f docker-compose.prod.yml logs postgres

# Подключиться вручную
docker compose -f docker-compose.prod.yml exec postgres psql -U smiio_user -d smiio_backtest
```

### Проблема: Frontend не может подключиться к Backend

Проверьте `NEXT_PUBLIC_API_URL` в `.env.production`:
- Должен быть публичный URL: `https://api.yourdomain.com`
- НЕ должен быть `http://backend:8000` (это внутренний Docker URL)

## 📈 Масштабирование

### Запустить несколько worker'ов бэкенда

```yaml
# В docker-compose.prod.yml
backend:
  deploy:
    replicas: 3
```

### Использовать внешнюю базу данных

Измените `DATABASE_URL` на managed PostgreSQL (AWS RDS, DigitalOcean, etc):

```env
DATABASE_URL=postgresql://user:pass@external-db-host:5432/dbname
```

И удалите `postgres` service из `docker-compose.prod.yml`.

## 🎯 Checklist перед запуском

- [ ] `.env.production` создан и заполнен
- [ ] Все пароли изменены на сильные
- [ ] DNS настроен (A-записи)
- [ ] SSL сертификаты получены (для HTTPS)
- [ ] Firewall настроен
- [ ] Backup скрипты настроены
- [ ] Мониторинг настроен

## 🆘 Support

При проблемах проверьте:
1. Логи: `docker compose logs`
2. Healthchecks: `docker compose ps`
3. Ресурсы: `docker stats`

🚀 **Готово! Ваш SMIIO Backtest Platform работает в production!**

