# 🚀 FRONTEND INTEGRATION GUIDE

## 📋 Содержание
1. [Что готово](#что-готово)
2. [Структура проекта](#структура-проекта)
3. [API Слой](#api-слой)
4. [Авторизация](#авторизация)
5. [Админ-панель](#админ-панель)
6. [Настройки](#настройки)
7. [Подключение бэкенда](#подключение-бэкенда)
8. [Что осталось сделать](#что-осталось-сделать)

---

## ✅ Что готово

### **Фаза 1: API Слой (100%)**
- ✅ Централизованная конфигурация (`lib/api/config.ts`)
- ✅ Axios клиент с interceptors (`lib/api/client.ts`)
- ✅ Полная типизация API (`lib/api/types.ts`)
- ✅ Mock API для разработки (`lib/api/mock.ts`)
- ✅ Endpoints модули:
  - `lib/api/endpoints/backtest.ts` - бэктестинг с polling
  - `lib/api/endpoints/auth.ts` - авторизация
  - `lib/api/endpoints/admin.ts` - админ-панель
  - `lib/api/endpoints/settings.ts` - настройки API/Telegram

### **Фаза 2: Схема БД (100%)**
- ✅ Обновлена `supabase/schema.sql`
- ✅ Добавлена таблица `trades`
- ✅ Добавлено поле `strategy_code` в `backtests`
- ✅ Все поля аналитики из backend API
- ✅ Индексы и RLS политики

### **Фаза 3: UI Компоненты (100%)**
- ✅ AuthProvider (React Context)
- ✅ Страница Login (`app/login/page.tsx`)
- ✅ Админ-панель (`app/admin/page.tsx`)
  - UsersTable - CRUD для пользователей
  - SymbolsTable - CRUD для символов
  - SyncStatus - управление синхронизацией
- ✅ Настройки (`app/settings/page.tsx`)
  - ApiKeysSection - API ключи бирж
  - TelegramSection - настройки Telegram

---

## 📁 Структура проекта

```
smiio-backtest-platform/
├── app/
│   ├── providers/
│   │   └── AuthProvider.tsx          # ✅ Контекст авторизации
│   ├── login/
│   │   └── page.tsx                  # ✅ Страница логина
│   ├── admin/
│   │   ├── page.tsx                  # ✅ Админ-панель
│   │   └── components/
│   │       ├── UsersTable.tsx        # ✅ Управление пользователями
│   │       ├── SymbolsTable.tsx      # ✅ Управление символами
│   │       └── SyncStatus.tsx        # ✅ Статус синхронизации
│   ├── settings/
│   │   ├── page.tsx                  # ✅ Страница настроек
│   │   └── components/
│   │       ├── ApiKeysSection.tsx    # ✅ API ключи бирж
│   │       └── TelegramSection.tsx   # ✅ Настройки Telegram
│   ├── backtest/
│   │   └── page.tsx                  # ⏳ Нужна интеграция с API
│   ├── page.tsx                      # ⏳ Нужна интеграция с API
│   └── layout.tsx                    # ✅ С AuthProvider
├── lib/
│   ├── api/
│   │   ├── config.ts                 # ✅ Конфигурация API
│   │   ├── client.ts                 # ✅ Axios клиент
│   │   ├── types.ts                  # ✅ TypeScript типы
│   │   ├── mock.ts                   # ✅ Mock данные
│   │   ├── index.ts                  # ✅ Главный export
│   │   └── endpoints/
│   │       ├── backtest.ts           # ✅ Бэктестинг API
│   │       ├── auth.ts               # ✅ Авторизация API
│   │       ├── admin.ts              # ✅ Админ API
│   │       └── settings.ts           # ✅ Настройки API
│   └── supabase.ts                   # Существующий клиент
├── supabase/
│   └── schema.sql                    # ✅ Обновлена схема БД
├── .env.local                        # ✅ С новыми переменными
└── .env.example                      # ✅ С документацией

✅ = Готово
⏳ = Требует интеграции
```

---

## 🔌 API Слой

### Использование

```typescript
import { api } from '@/lib/api';

// Backtest
const { job_id } = await api.backtest.submitBacktest(strategy);
const results = await api.backtest.pollBacktestResults(job_id);

// Или все в одном:
const results = await api.backtest.runBacktest(strategy, (status) => {
  console.log('Status:', status);
});

// Auth
await api.auth.login({ username, password });
const user = await api.auth.getCurrentUser();
api.auth.logout();

// Admin
const users = await api.admin.getUsers();
await api.admin.createUser({ username, password, is_admin, activated });
await api.admin.deleteUser(userId);

const symbols = await api.admin.getSymbols();
await api.admin.createSymbol({ exchange, symbol, enabled });

await api.admin.startSync();
const syncStatus = await api.admin.getSyncStatus();

// Settings
await api.settings.saveAPIKeys({ exchange, api_key, api_secret });
await api.settings.saveTelegramSettings({ token, chat_id });
```

### Конфигурация

```bash
# .env.local

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:8000

# Mock mode (true/false)
NEXT_PUBLIC_USE_MOCK=true
```

**Переключение режимов:**
- `NEXT_PUBLIC_USE_MOCK=true` → использует mock данные
- `NEXT_PUBLIC_USE_MOCK=false` → использует реальный backend

---

## 🔐 Авторизация

### AuthProvider

Провайдер уже интегрирован в `app/layout.tsx`:

```typescript
import { useAuth } from './providers/AuthProvider';

function MyComponent() {
  const { user, loading, login, logout } = useAuth();

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>Not logged in</div>;

  return (
    <div>
      <p>Hello, {user.username}!</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### JWT Token

- Автоматически добавляется в headers через interceptor
- Хранится в `localStorage` как `auth_token`
- При 401 автоматически редиректит на `/login`

### Страница Login

- URL: `/login`
- Mock credentials: `admin / admin`
- После логина редиректит на дашборд

---

## 🛠️ Админ-панель

### Доступ

- URL: `/admin`
- Только для `is_admin = true`
- Автоматический редирект если не админ

### Возможности

#### 👥 Users Tab
- Просмотр всех пользователей
- Создание нового пользователя
- Редактирование (username, password, is_admin, activated)
- Удаление пользователя

#### 📊 Symbols Tab
- Просмотр всех символов для парсинга
- Добавление нового символа (exchange, symbol)
- Включение/выключение символа
- Редактирование
- Удаление

#### 🔄 Sync Status Tab
- Общий статус синхронизации
- Статус по каждой бирже
- Кнопка "Start Sync"
- Автообновление каждые 5 секунд

---

## ⚙️ Настройки

### Доступ

- URL: `/settings`
- Требует авторизации
- Доступно всем пользователям

### Секции

#### 🔑 Exchange API Keys
- Выбор биржи (binance, bybit, okx, kraken)
- Ввод API Key и Secret
- Сохранение (отправляется зашифрованным)
- Удаление ключей

#### 📱 Telegram Notifications
- Ввод Bot Token
- Ввод Chat ID
- Инструкция по настройке
- Сохранение настроек
- Удаление настроек

---

## 🔗 Подключение бэкенда

### Шаг 1: Укажите URL бэкенда

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://your-backend-url:8000
NEXT_PUBLIC_USE_MOCK=false
```

### Шаг 2: Проверьте endpoints

Все endpoints уже настроены в `lib/api/config.ts`:

```typescript
export const ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/token',      // POST
    ME: '/auth/me',            // GET
  },
  BACKTEST: {
    TEST: '/backtest/test',    // POST
    RESULT: (jobId) => `/backtest/${jobId}`,  // GET
  },
  ADMIN: {
    USERS: '/admin/users',     // GET, POST
    USER: (id) => `/admin/users/${id}`,  // GET, PUT, DELETE
    SYMBOLS: '/admin/parsed-symbols',
    SYMBOL: (id) => `/admin/parsed-symbols/${id}`,
  },
  SETTINGS: {
    API_KEYS: '/auth/api-keys',
    API_KEY: (exchange) => `/auth/api-keys/${exchange}`,
    TELEGRAM: '/auth/telegram-settings',
  },
  PARSE: {
    SYNC_START: '/parse/sync/start',
    SYNC_STATUS: '/parse/sync/status',
  },
};
```

### Шаг 3: Restart dev server

```bash
npm run dev
```

### Шаг 4: Тестирование

1. Откройте `/login`
2. Войдите с реальными credentials
3. Проверьте админ-панель `/admin`
4. Проверьте настройки `/settings`
5. Запустите бэктест `/backtest`

---

## ⏳ Что осталось сделать

### 1. Интеграция страницы Backtest ⚠️ **СРЕДНИЙ РИСК**

**Файл:** `app/backtest/page.tsx`

**Что нужно:**
```typescript
// Заменить mock функцию на реальный API
import { api } from '@/lib/api';

async function handleRunBacktest() {
  try {
    const strategy = JSON.parse(strategyCode);

    // Использовать API вместо createMockBacktest
    const results = await api.backtest.runBacktest(strategy, (status, data) => {
      // Обновлять UI с прогрессом
      if (status === 'pending') {
        addTerminalLine('> Waiting for results...');
      } else if (status === 'finished') {
        addTerminalLine('> ✅ Backtest completed!');
        setCompletedBacktest(data.analytics);
      }
    });

    // Сохранить в Supabase (опционально)
    // await supabase.from('backtests').insert({...})

  } catch (error) {
    addTerminalLine(`> ❌ ERROR: ${error.message}`);
  }
}
```

**Проверить после изменений:**
- [ ] Запуск бэктеста работает
- [ ] Polling показывает статус
- [ ] Результаты отображаются
- [ ] Скачивание работает
- [ ] Модалка с деталями работает

### 2. Интеграция Dashboard ⚠️ **НИЗКИЙ РИСК**

**Файл:** `app/page.tsx`

**Что нужно:**
- Загружать backtests из обновленной БД
- Отображать новые поля аналитики
- Фильтровать по `user_id` после auth

### 3. Middleware для защиты роутов (Опционально)

**Файл:** `middleware.ts` (создать)

```typescript
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token');
  const { pathname } = request.nextUrl;

  // Protected routes
  if (pathname.startsWith('/admin') && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/settings/:path*'],
};
```

---

## 🧪 Тестирование

### Mock Mode (по умолчанию)

```bash
# .env.local
NEXT_PUBLIC_USE_MOCK=true

# Credentials
username: admin
password: admin
```

**Что работает:**
- Вход/выход
- Все страницы админки
- Все настройки
- Mock backtests (5 сек задержка)

### Real Backend Mode

```bash
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_USE_MOCK=false

# Реальные credentials с бэкенда
```

**Что нужно проверить:**
- Login с реальной БД
- CRUD операции в админке
- Сохранение настроек
- Запуск реального бэктеста

---

## 📊 Схема БД

### Применение обновленной схемы

1. Откройте Supabase Dashboard
2. Перейдите в SQL Editor
3. Скопируйте содержимое `supabase/schema.sql`
4. Выполните SQL

**Новые таблицы:**
- `trades` - индивидуальные сделки
- Обновлена `backtests` с полями `job_id`, `strategy_code`, и всеми метриками

---

## 🎯 Рекомендации для следующего разработчика

### Приоритет задач

1. **Высокий** - Интеграция бэктестинга (самое важное)
2. **Средний** - Обновление дашборда
3. **Низкий** - Middleware (можно отложить)

### Подход к интеграции

1. Начните с тестирования в mock mode
2. Постепенно переключайте на real API по одному endpoint
3. Всегда имейте fallback на mock для dev

### Отладка

```typescript
// Включить детальные логи
import { apiClient } from '@/lib/api';

apiClient.interceptors.response.use(
  (response) => {
    console.log('API Response:', response);
    return response;
  }
);
```

### Полезные команды

```bash
# Dev сервер
npm run dev

# Build проверка
npm run build

# Type check
npx tsc --noEmit

# Lint
npm run lint
```

---

## 📞 Контакты

Если возникли вопросы по фронтенду:
- Все файлы хорошо задокументированы
- Типы TypeScript подскажут что нужно
- Mock API показывает формат данных

**Удачи с интеграцией! 🚀**
