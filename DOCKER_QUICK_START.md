# 🚀 Быстрый старт с Docker

## Одной командой запустить весь проект

```bash
docker-compose up -d
```

## ✅ Что запустится:

1. ✅ **PostgreSQL** (база данных) - порт 5432
2. ✅ **Redis** (очереди задач) - порт 6379
3. ✅ **Backend** (FastAPI) - порт 8000
4. ✅ **Frontend** (Next.js) - порт 3000

## 📝 После запуска:

1. **Откройте браузер**: http://localhost:3000
2. **Залогиньтесь** (дефолтный админ: `admin` / `admin`)
3. **Начните работу!**

## 🛑 Остановить все:

```bash
docker-compose down
```

## 📊 Просмотр логов:

```bash
docker-compose logs -f
```

## 🔄 Перезапустить после изменений:

```bash
docker-compose restart frontend
# или
docker-compose restart backend
```

## ⚙️ Настройка (опционально)

Если нужно изменить URL бэкенда, создайте `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## 📚 Подробная документация

См. `DOCKER_SETUP.md` для детальной информации.

