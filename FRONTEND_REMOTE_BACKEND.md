# 🚀 Frontend с удалённым бэкендом

## 📋 Описание

Конфигурация для запуска фронтенда с подключением к удалённому бэкенду, который работает в приватной Docker сети `trading_internal_net`.

## 🏗️ Архитектура

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Браузер       │    │   Nginx         │    │   Frontend      │
│   (внешний)     │───▶│   (порт 80)     │───▶│   (Next.js)     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │                        │
                                │                        │
                                ▼                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   API запросы    │    │   Backend       │
                       │   /api/*        │    │   (внутренний)  │
                       │   /backtest/*   │───▶│   backend:8000  │
                       │   /strategy/*   │    │   (приватный)   │
                       └─────────────────┘    └─────────────────┘
```

## 🔧 Конфигурации

### 1. **Простой фронтенд** (без Nginx)
- **Файл**: `docker-compose.frontend-only.yml`
- **Порт**: 3000 (пробрасывается наружу)
- **API**: Прямое подключение к `backend:8000`

### 2. **Фронтенд с Nginx** (рекомендуется)
- **Файл**: `docker-compose.frontend-with-nginx.yml`
- **Порт**: 80 (только Nginx наружу)
- **API**: Nginx проксирует к `backend:8000`

## 🚀 Запуск

### Вариант 1: С Nginx (рекомендуется)

```bash
# 1. Настройте environment
cp env.frontend-only.example .env.production

# 2. Убедитесь что бэкенд запущен в сети trading_internal_net
docker network ls | grep trading_internal_net

# 3. Запустите фронтенд с Nginx
make frontend-only

# 4. Проверьте статус
make frontend-logs
```

**Результат**: 
- 🌐 Фронтенд доступен на `http://localhost`
- 🔒 Бэкенд доступен только внутри Docker сети
- 📡 Nginx проксирует все API запросы

### Вариант 2: Без Nginx (простой)

```bash
# 1. Настройте environment
cp env.frontend-only.example .env.production

# 2. Запустите фронтенд
make frontend-simple

# 3. Проверьте статус
docker logs smiio_frontend -f
```

**Результат**: 
- 🌐 Фронтенд доступен на `http://localhost:3000`
- 🔒 Бэкенд доступен только внутри Docker сети

## 🔧 Environment Variables

```bash
# .env.production
FRONTEND_PORT=80                    # Порт для Nginx (или 3000 для простого)
NEXT_PUBLIC_API_URL=http://backend:8000  # Внутреннее имя бэкенда
NODE_ENV=production
```

## 📡 API Проксирование (Nginx)

Nginx автоматически проксирует:

- `/api/*` → `http://backend:8000/`
- `/backtest/*` → `http://backend:8000/backtest/`
- `/strategy/*` → `http://backend:8000/strategy/`
- `/auth/*` → `http://backend:8000/auth/`
- `/admin/*` → `http://backend:8000/admin/`

## 🛠️ Команды управления

```bash
# Запуск
make frontend-only      # С Nginx
make frontend-simple    # Без Nginx

# Логи
make frontend-logs

# Остановка
make frontend-stop

# Статус
docker compose -f docker-compose.frontend-with-nginx.yml ps
```

## 🔍 Отладка

### Проверка сети
```bash
# Убедитесь что сеть существует
docker network ls | grep trading_internal_net

# Проверьте подключение к бэкенду
docker exec smiio_frontend ping backend
```

### Проверка API
```bash
# Тест API через Nginx
curl http://localhost/api/health

# Тест API напрямую (если без Nginx)
curl http://localhost:3000/api/health
```

### Логи
```bash
# Логи фронтенда
docker logs smiio_frontend -f

# Логи Nginx
docker logs smiio_nginx -f

# Все логи
make frontend-logs
```

## 🔒 Безопасность

- ✅ **Фронтенд доступен извне** на порту 80
- ✅ **Бэкенд изолирован** в приватной сети
- ✅ **API запросы проксируются** через Nginx
- ✅ **Нет прямого доступа** к бэкенду извне

## 📊 Мониторинг

```bash
# Статус контейнеров
docker ps | grep smiio

# Использование ресурсов
docker stats smiio_frontend smiio_nginx

# Проверка здоровья
curl http://localhost/health
```

## 🚨 Устранение проблем

### Проблема: "Network not found"
```bash
# Создайте сеть если не существует
docker network create trading_internal_net
```

### Проблема: "Backend not reachable"
```bash
# Проверьте что бэкенд в той же сети
docker network inspect trading_internal_net
```

### Проблема: "API requests fail"
```bash
# Проверьте Nginx конфигурацию
docker exec smiio_nginx nginx -t

# Перезапустите Nginx
docker restart smiio_nginx
```

## 📝 Примечания

- Фронтенд автоматически подключается к существующей сети бэкенда
- Nginx обеспечивает безопасное проксирование API запросов
- Все запросы логируются для отладки
- Health checks обеспечивают автоматический перезапуск при сбоях
