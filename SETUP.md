# 🚀 SMIIO Backtest Platform - Setup Guide

## 📋 Требования

- Node.js 20+
- npm или yarn
- Supabase аккаунт (бесплатный)

## 🔧 Быстрый старт

### 1. Установка зависимостей

```bash
npm install
```

### 2. Настройка Supabase

1. Создайте новый проект на [supabase.com](https://supabase.com)
2. Перейдите в **SQL Editor**
3. Выполните SQL из файла `supabase/schema.sql`
4. Скопируйте URL и Anon Key из **Settings → API**

### 3. Конфигурация переменных окружения

Создайте файл `.env.local` в корне проекта:

```bash
cp .env.example .env.local
```

Откройте `.env.local` и заполните:

```env
NEXT_PUBLIC_SUPABASE_URL=https://ваш-проект.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=ваш_anon_key
```

### 4. Запуск разработки

```bash
npm run dev
```

Откройте [http://localhost:3000](http://localhost:3000) в браузере.

## 📊 Структура проекта

```
smiio-backtest-platform/
├── app/
│   ├── page.tsx                    # Главная страница (Dashboard)
│   ├── backtest/
│   │   └── page.tsx               # Страница создания бэктеста
│   ├── components/
│   │   └── BacktestDetailsModal.tsx
│   └── layout.tsx
├── lib/
│   └── supabase.ts                # Supabase клиент
├── supabase/
│   └── schema.sql                 # SQL схема БД
├── ANALYSIS.md                     # Анализ качества кода
├── PROJECT_DOCUMENTATION.md        # Полная документация
├── BACKEND_INTEGRATION.md          # Гайд для бэкенда
└── package.json
```

## 🗄️ База данных

После выполнения `supabase/schema.sql` будут созданы таблицы:

- `strategies` - торговые стратегии
- `backtests` - результаты бэктестов
- `trades` - детали сделок
- `folders` - папки для организации

## 🎨 Основные возможности

### Dashboard (`/`)
- ✅ Список всех бэктестов
- ✅ Поиск, сортировка, фильтрация
- ✅ Система папок с множественным выбором
- ✅ Экспорт результатов (CSV + JSON)
- ✅ Детальная модалка с таблицей сделок

### Backtest Page (`/backtest`)
- ✅ JSON редактор стратегии
- ✅ Drag & Drop загрузка .json файлов
- ✅ Нумерация строк
- ✅ Мок-функция для создания тестовых данных
- ✅ Отображение результатов после завершения

## 🔌 Интеграция с бэкендом

Фронтенд готов к интеграции! См. `BACKEND_INTEGRATION.md` для:
- API endpoints
- Формат данных
- Примеры кода на Python
- Backtest Engine архитектура

## 📦 Production Build

```bash
npm run build
npm run start
```

## 🚀 Deployment на Vercel

1. Форкните репозиторий
2. Импортируйте в Vercel
3. Добавьте переменные окружения
4. Deploy!

## 📝 Полезные команды

```bash
# Разработка
npm run dev

# Билд
npm run build

# Запуск продакшена
npm run start

# Линтер
npm run lint
```

## 🆘 Возможные проблемы

### Ошибка подключения к Supabase
- Проверьте `.env.local`
- Убедитесь что URL и ключ правильные
- Проверьте RLS политики в Supabase

### Пустой список бэктестов
- Используйте кнопку "Create Mock Backtest" на странице `/backtest`
- Это создаст тестовые данные для демонстрации

### Ошибки TypeScript
- Убедитесь что используете Node.js 20+
- Выполните `npm install` заново

## 📚 Документация

- `PROJECT_DOCUMENTATION.md` - Полная документация проекта
- `BACKEND_INTEGRATION.md` - Для бэкенд-разработчиков
- `ANALYSIS.md` - Анализ качества кода

## 🎯 Следующие шаги

1. ✅ Фронтенд полностью готов
2. 🔧 Нужна реализация Backtest Engine (см. BACKEND_INTEGRATION.md)
3. 🔧 Индикаторы и метрики
4. 🔧 Загрузка исторических данных

**Удачи с проектом! 🚀**
