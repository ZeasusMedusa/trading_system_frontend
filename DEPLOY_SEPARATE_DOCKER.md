# 🐳 Деплой с отдельными Docker контейнерами

Если фронтенд и бэкенд в **разных Docker Compose файлах**, но на **одном сервере**.

---

## 🔧 Вариант 1: Через Docker Network (рекомендуется)

### Создать общую сеть

```bash
# Создать Docker network для связи между контейнерами
docker network create smiio_shared_network
```

### Настроить бэкенд

В вашем **бэкенд `docker-compose.yml`**:

```yaml
version: '3.8'

services:
  backend:
    # ... ваша конфигурация
    networks:
      - smiio_shared_network  # Добавить эту сеть

networks:
  smiio_shared_network:
    external: true  # Использовать внешнюю сеть
```

Запустить бэкенд:
```bash
cd ../smiio-backend
docker compose up -d
```

### Настроить фронтенд

**Вариант A: Если бэкенд доступен на host порту 8000**

В `.env.production`:
```env
# Использовать localhost (host машины)
NEXT_PUBLIC_API_URL=http://localhost:8000
```

**Вариант B: Через Docker network**

В `.env.production`:
```env
# Использовать имя контейнера бэкенда
NEXT_PUBLIC_API_URL=http://backend_container_name:8000
```

В **фронтенд `docker-compose.yml`** (или `docker-compose.prod.yml`):
```yaml
version: '3.8'

services:
  frontend:
    # ... ваша конфигурация
    extra_hosts:
      - "host.docker.internal:host-gateway"  # Для доступа к host localhost
    networks:
      - smiio_shared_network

networks:
  smiio_shared_network:
    external: true
```

Запустить фронтенд:
```bash
docker compose -f docker-compose.prod.yml --env-file .env.production up -d
```

---

## 🔧 Вариант 2: Через host network (проще)

### Для фронтенда

В `.env.production`:
```env
# Бэкенд доступен на localhost хост-машины
NEXT_PUBLIC_API_URL=http://localhost:8000
```

В `docker-compose.prod.yml`:
```yaml
services:
  frontend:
    # ... остальная конфигурация
    extra_hosts:
      - "host.docker.internal:host-gateway"
    environment:
      NEXT_PUBLIC_API_URL: http://host.docker.internal:8000
```

---

## 🔧 Вариант 3: Nginx Reverse Proxy (лучше всего)

Самый правильный вариант - использовать nginx как reverse proxy.

### Структура:

```
                    ┌─────────────┐
                    │   Nginx     │
                    │   (port 80) │
                    └─────┬───────┘
                          │
            ┌─────────────┴──────────────┐
            │                            │
    ┌───────▼────────┐         ┌────────▼─────────┐
    │   Frontend     │         │    Backend       │
    │  (port 3000)   │         │   (port 8000)    │
    └────────────────┘         └──────────────────┘
```

### Nginx конфигурация

Создайте отдельный `nginx/docker-compose.yml`:

```yaml
version: '3.8'

services:
  nginx:
    image: nginx:alpine
    container_name: smiio_nginx
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

### Nginx конфигурация (`nginx.conf`):

```nginx
events {
    worker_connections 1024;
}

http {
    upstream frontend {
        server host.docker.internal:3000;
    }

    upstream backend {
        server host.docker.internal:8000;
    }

    server {
        listen 80;
        server_name _;

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        }

        # Backend API
        location /api {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
        }

        location /auth {
            proxy_pass http://backend;
            proxy_set_header Host $host;
        }

        location /backtest {
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_read_timeout 300s;
        }

        location /strategy {
            proxy_pass http://backend;
            proxy_set_header Host $host;
        }

        location /admin {
            proxy_pass http://backend;
            proxy_set_header Host $host;
        }

        location /parse {
            proxy_pass http://backend;
            proxy_set_header Host $host;
        }

        location /docs {
            proxy_pass http://backend;
            proxy_set_header Host $host;
        }
    }
}
```

### Запуск через Nginx

```bash
# 1. Запустить бэкенд (на порту 8000)
cd ../smiio-backend
docker compose up -d

# 2. Запустить фронтенд (на порту 3000)
cd ../smiio-backtest-platform
docker compose up -d frontend

# 3. Запустить Nginx
cd nginx
docker compose up -d

# 4. Проверить
curl http://localhost
```

**В `.env.production` фронтенда:**
```env
# Через Nginx все идет на один домен
NEXT_PUBLIC_API_URL=http://localhost
# или для production с доменом:
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

---

## 🎯 Самый простой способ (рекомендую)

### 1. Настроить `.env.production`

```bash
cd smiio-backtest-platform
cp env.production.example .env.production
nano .env.production
```

Заполнить:
```env
POSTGRES_PASSWORD=сильный_пароль_123
REDIS_PASSWORD=сильный_пароль_456
SECRET_KEY=случайная_строка_64_символа
NEXT_PUBLIC_API_URL=http://host.docker.internal:8000
```

### 2. Изменить `docker-compose.prod.yml`

Убрать `backend` и `postgres` и `redis` секции (они уже запущены отдельно):

```yaml
version: '3.8'

services:
  # Frontend (Next.js)
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.prod
    container_name: smiio_frontend_prod
    restart: always
    environment:
      NEXT_PUBLIC_API_URL: http://host.docker.internal:8000
      NODE_ENV: production
    ports:
      - "3000:3000"
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

### 3. Запустить фронтенд

```bash
docker compose -f docker-compose.prod.yml up -d
```

---

## 📊 Проверка

```bash
# 1. Бэкенд доступен?
curl http://localhost:8000/docs

# 2. Фронтенд доступен?
curl http://localhost:3000

# 3. API доступен из фронтенда?
# Откройте http://localhost:3000 в браузере и попробуйте залогиниться
```

---

## 🎯 Итоговая команда для деплоя

```bash
# 1. Убедитесь что бэкенд уже запущен и доступен на :8000
curl http://localhost:8000/docs

# 2. Настройте .env.production
cp env.production.example .env.production
nano .env.production
# Установите: NEXT_PUBLIC_API_URL=http://host.docker.internal:8000

# 3. Запустите только фронтенд
docker compose -f docker-compose.prod.yml up -d frontend

# Готово!
```

Какой вариант вам больше подходит? Подскажите и я создам точную конфигурацию для вас!
