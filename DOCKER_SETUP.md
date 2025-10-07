# 🐳 Docker Setup Guide

Запуск всего проекта (фронтенд + бэкенд + база данных) одной командой.

## 📋 Предварительные требования

1. **Docker** и **Docker Compose** установлены
2. **Бэкенд проект** находится рядом с фронтендом (в `../smiio-backend/`)

## 🚀 Быстрый старт

### 1. Запустить все сервисы

```bash
docker-compose up -d
```

### 2. Проверить статус

```bash
docker-compose ps
```

### 3. Открыть в браузере

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs

### 4. Остановить все сервисы

```bash
docker-compose down
```

### 5. Остановить и удалить данные

```bash
docker-compose down -v
```

## 📦 Сервисы

| Сервис | Порт | Описание |
|--------|------|----------|
| `frontend` | 3000 | Next.js фронтенд |
| `backend` | 8000 | FastAPI бэкенд |
| `postgres` | 5432 | PostgreSQL база данных |
| `redis` | 6379 | Redis для очередей |

## 🔧 Конфигурация

### Переменные окружения

Создайте `.env.local` для переопределения дефолтных значений:

```env
# API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Database (если нужно переопределить)
DATABASE_URL=postgresql://smiio_user:smiio_password@postgres:5432/smiio_backtest

# Redis
REDIS_URL=redis://redis:6379/0
```

### Изменить порты

Отредактируйте `docker-compose.yml`:

```yaml
services:
  frontend:
    ports:
      - "3001:3000"  # Измените 3001 на нужный порт
```

## 📝 Полезные команды

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Только фронтенд
docker-compose logs -f frontend

# Только бэкенд
docker-compose logs -f backend
```

### Перезапустить сервис

```bash
docker-compose restart frontend
docker-compose restart backend
```

### Пересобрать образы

```bash
docker-compose build
docker-compose up -d --build
```

### Выполнить команду в контейнере

```bash
# Bash в бэкенде
docker-compose exec backend bash

# Bash во фронтенде
docker-compose exec frontend sh
```

### Миграции базы данных

```bash
# Выполнить миграции в бэкенде
docker-compose exec backend alembic upgrade head
```

## 🛠️ Разработка

### Development mode (с hot-reload)

Docker-compose уже настроен для dev режима:
- Frontend: использует `npm run dev`
- Backend: использует `--reload` флаг

Изменения в коде автоматически применяются!

### Production build

Измените `docker-compose.yml`:

```yaml
frontend:
  command: npm start  # Вместо npm run dev
```

И пересоберите:

```bash
docker-compose up -d --build
```

## 🐛 Troubleshooting

### Порты заняты

Если порт 3000/8000 занят, измените в `docker-compose.yml`:

```yaml
ports:
  - "3001:3000"  # Фронтенд на 3001
  - "8001:8000"  # Бэкенд на 8001
```

### База данных не инициализируется

```bash
# Пересоздайте базу
docker-compose down -v
docker-compose up -d postgres
# Дождитесь запуска и затем:
docker-compose up -d
```

### Не удается подключиться к API

Проверьте `NEXT_PUBLIC_API_URL` в `.env.local`:
- Для Docker: `http://localhost:8000`
- Для ngrok: `https://your-ngrok-url.ngrok-free.app`

## 📊 Мониторинг

### Использование ресурсов

```bash
docker stats
```

### Проверить healthcheck

```bash
docker-compose ps
```

Все сервисы должны быть `healthy`.

## 🔒 Production

Для production окружения:

1. **Измените пароли** в `docker-compose.yml`
2. **Используйте секреты** вместо env переменных
3. **Настройте nginx** как reverse proxy
4. **Включите HTTPS**
5. **Используйте volume** для static файлов

## 📚 Дополнительно

- Backend Dockerfile должен находиться в `../smiio-backend/Dockerfile`
- Схема БД автоматически применяется из `supabase/schema.sql`
- Все данные хранятся в Docker volumes и сохраняются между перезапусками

