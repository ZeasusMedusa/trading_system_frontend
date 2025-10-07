# 🎯 Команды для деплоя - Шпаргалка

## 🚀 Быстрый деплой

### Одной командой (рекомендуется):
```bash
./deploy.sh
```

### Или через Makefile:
```bash
make prod
```

### Или вручную:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

---

## 📋 Пошаговый деплой

### 1️⃣ Первый раз (Initial Setup)

```bash
# 1. Скопировать и настроить env файл
cp env.production.example .env.production
nano .env.production  # Заполнить все переменные!

# 2. Создать директорию для SSL (если используете)
mkdir -p nginx/ssl

# 3. Получить SSL сертификаты (опционально)
sudo certbot certonly --standalone -d yourdomain.com

# 4. Скопировать сертификаты
sudo cp /etc/letsencrypt/live/yourdomain.com/fullchain.pem nginx/ssl/
sudo cp /etc/letsencrypt/live/yourdomain.com/privkey.pem nginx/ssl/

# 5. Запустить
make prod
```

### 2️⃣ Обновление (Updates)

```bash
# 1. Остановить сервисы
make prod-stop

# 2. Обновить код
git pull origin main

# 3. Пересобрать образы
make build-prod

# 4. Запустить
make prod

# 5. Проверить логи
make prod-logs
```

---

## 🛠️ Полезные команды

### Просмотр статуса
```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml top
```

### Логи
```bash
# Все сервисы
make prod-logs

# Конкретный сервис
docker compose -f docker-compose.prod.yml logs -f backend
docker compose -f docker-compose.prod.yml logs -f frontend
docker compose -f docker-compose.prod.yml logs -f nginx

# Последние 100 строк
docker compose -f docker-compose.prod.yml logs --tail=100
```

### Перезапуск
```bash
# Все сервисы
make prod-restart

# Конкретный сервис
docker compose -f docker-compose.prod.yml restart backend
docker compose -f docker-compose.prod.yml restart frontend
docker compose -f docker-compose.prod.yml restart nginx
```

### Shell доступ
```bash
# Backend
make shell-backend
# или
docker compose -f docker-compose.prod.yml exec backend bash

# Frontend
make shell-frontend
# или
docker compose -f docker-compose.prod.yml exec frontend sh

# Database
docker compose -f docker-compose.prod.yml exec postgres psql -U smiio_user -d smiio_backtest

# Redis
docker compose -f docker-compose.prod.yml exec redis redis-cli --pass YOUR_REDIS_PASSWORD
```

---

## 💾 Backup & Restore

### Создать backup
```bash
make backup
# или вручную:
docker compose -f docker-compose.prod.yml exec postgres pg_dump -U smiio_user smiio_backtest > backup.sql
```

### Восстановить из backup
```bash
docker compose -f docker-compose.prod.yml exec -T postgres psql -U smiio_user smiio_backtest < backup.sql
```

### Автоматический backup (crontab)
```bash
# Редактировать crontab
crontab -e

# Добавить (backup каждую ночь в 3:00)
0 3 * * * cd /path/to/smiio-backtest-platform && make backup
```

---

## 🔍 Мониторинг

### Использование ресурсов
```bash
make stats
# или
docker stats --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
```

### Health checks
```bash
make health
# или
curl http://localhost/health
curl http://localhost:8000/health
```

### Размер volumes
```bash
docker system df -v
```

---

## 🧹 Очистка

### Остановить сервисы
```bash
make prod-stop
```

### Удалить контейнеры и volumes (⚠️ ПОТЕРЯ ДАННЫХ!)
```bash
make clean
```

### Удалить неиспользуемые образы
```bash
docker image prune -a
```

### Полная очистка Docker
```bash
docker system prune -a --volumes
```

---

## 🔐 Безопасность

### Изменить пароль админа
```bash
# Войти в backend
make shell-backend

# Запустить Python
python

# Изменить пароль
from sqlalchemy.orm import Session
from database import SessionLocal
from models import User
from auth import get_password_hash

db = SessionLocal()
admin = db.query(User).filter(User.username == "admin").first()
admin.hashed_password = get_password_hash("new_secure_password")
db.commit()
db.close()
exit()
```

### Обновить SSL сертификаты
```bash
make ssl-renew
```

---

## 🚨 Troubleshooting

### Контейнер не запускается
```bash
# Смотрим логи
docker compose -f docker-compose.prod.yml logs backend

# Смотрим детали контейнера
docker inspect smiio_backend_prod
```

### База данных недоступна
```bash
# Проверить healthcheck
docker compose -f docker-compose.prod.yml ps postgres

# Проверить логи
docker compose -f docker-compose.prod.yml logs postgres

# Подключиться вручную
docker compose -f docker-compose.prod.yml exec postgres psql -U smiio_user -d smiio_backtest
```

### Nginx 502 Bad Gateway
```bash
# Проверить что backend запущен
docker compose -f docker-compose.prod.yml ps backend

# Проверить логи nginx
docker compose -f docker-compose.prod.yml logs nginx

# Перезапустить nginx
docker compose -f docker-compose.prod.yml restart nginx
```

### Порт занят
```bash
# Найти процесс на порту 80
sudo lsof -i :80

# Убить процесс
sudo kill -9 PID
```

---

## 📦 Production Checklist

Перед запуском в production:

- [ ] `.env.production` создан и все переменные заполнены
- [ ] Все пароли изменены на сильные (min 16 символов)
- [ ] `SECRET_KEY` сгенерирован случайно: `openssl rand -hex 32`
- [ ] SSL сертификаты получены и настроены
- [ ] DNS A-записи настроены
- [ ] Firewall настроен (порты 80, 443)
- [ ] Backup скрипт настроен (crontab)
- [ ] Мониторинг настроен
- [ ] Тестовый деплой выполнен успешно

---

## 🎯 Быстрые команды

| Команда | Описание |
|---------|----------|
| `make prod` | Запустить production |
| `make prod-stop` | Остановить production |
| `make prod-logs` | Просмотр логов |
| `make backup` | Создать backup БД |
| `make health` | Проверить здоровье сервисов |
| `make stats` | Показать использование ресурсов |
| `./deploy.sh` | Полный деплой (pull + build + start) |

---

**📚 Детальная документация:** `PRODUCTION_DEPLOY.md`

