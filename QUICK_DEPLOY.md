# ⚡ Быстрый деплой фронтенда (бэкенд уже в Docker)

Если ваш бэкенд уже запущен в Docker на том же сервере.

---

## 🚀 Деплой за 3 команды

```bash
# 1. Настроить переменные
cp env.frontend-only.example .env.production
nano .env.production

# 2. Запустить фронтенд
docker compose -f docker-compose.frontend-only.yml --env-file .env.production up -d --build

# 3. Проверить
curl http://localhost:3000
```

**Готово!** 🎉

---

## ⚙️ Настройка `.env.production`

### Если бэкенд на порту 8000 на хосте:

```env
NEXT_PUBLIC_API_URL=http://host.docker.internal:8000
FRONTEND_PORT=3000
```

### Если бэкенд на другом порту (например 8001):

```env
NEXT_PUBLIC_API_URL=http://host.docker.internal:8001
FRONTEND_PORT=3000
```

### Если бэкенд в Docker network с именем контейнера:

```bash
# Узнать имя контейнера бэкенда
docker ps | grep backend

# В .env.production указать имя:
```

```env
NEXT_PUBLIC_API_URL=http://имя_контейнера_бэкенда:8000
FRONTEND_PORT=3000
```

---

## 🔍 Проверка подключения

### 1. Проверить что бэкенд доступен:

```bash
# С хоста
curl http://localhost:8000/docs

# Из контейнера фронтенда
docker exec smiio_frontend wget -qO- http://host.docker.internal:8000/docs
```

### 2. Проверить фронтенд:

```bash
curl http://localhost:3000
```

### 3. Проверить логи:

```bash
docker logs smiio_frontend -f
```

---

## 🔄 Обновление

```bash
# Остановить
docker compose -f docker-compose.frontend-only.yml down

# Обновить код
git pull

# Пересобрать и запустить
docker compose -f docker-compose.frontend-only.yml --env-file .env.production up -d --build
```

---

## 🛠️ Troubleshooting

### Проблема: "Failed to connect to backend"

**Решение 1:** Проверьте что бэкенд доступен на :8000
```bash
curl http://localhost:8000/health
```

**Решение 2:** Проверьте `NEXT_PUBLIC_API_URL` в `.env.production`

**Решение 3:** Используйте IP адрес хоста вместо `host.docker.internal`
```bash
# Узнать IP хоста
ip addr show docker0 | grep inet

# В .env.production:
NEXT_PUBLIC_API_URL=http://172.17.0.1:8000
```

### Проблема: CORS ошибки

На бэкенде нужно разрешить CORS для фронтенд домена:

```python
# В backend main.py или config
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "https://yourdomain.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## 📦 Итоговая структура

```
Сервер:
├── Бэкенд Docker (уже запущен)
│   └── Порт: 8000
│
└── Фронтенд Docker (запускаем)
    └── Порт: 3000
    └── Подключается к бэкенду через host.docker.internal:8000
```

---

## 🎯 Checklist

- [ ] Бэкенд запущен и доступен на http://localhost:8000
- [ ] `.env.production` создан и настроен
- [ ] `NEXT_PUBLIC_API_URL` указывает на бэкенд
- [ ] Фронтенд собран: `docker compose -f docker-compose.frontend-only.yml build`
- [ ] Фронтенд запущен: `docker compose -f docker-compose.frontend-only.yml up -d`
- [ ] Проверено: http://localhost:3000 открывается

**Готово! 🚀**

