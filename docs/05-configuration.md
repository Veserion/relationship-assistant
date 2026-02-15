# 5. Конфигурация и деплой

## Переменные окружения

| Переменная | Обязательная | Описание |
|------------|--------------|----------|
| BOT_TOKEN | Да | Токен от @BotFather |
| OWNER_ID | Да | Telegram ID владельца (число) |
| PARTNER_ID | Да | Telegram ID партнёра (при whitelist) |
| DB_CONNECTION | Нет | Путь к SQLite (по умолчанию `./data/relationship_bot.db`) |
| DISABLE_WHITELIST | Нет | `true`/`1`/`yes` — отключить whitelist (для разработки) |
| DEBUG | Нет | `false`/`0` — отключить подробные логи |

## Скрипты

```bash
npm run build   # tsc → dist/
npm start       # node dist/index.js
npm run dev     # tsx watch src/index.ts
```

## Структура проекта

```
relationship-assistant/
├── src/
│   ├── index.ts          # Точка входа
│   ├── loadEnv.ts        # Загрузка .env (первый импорт)
│   ├── config.ts         # Конфиг, whitelist, роли
│   ├── logger.ts         # Логирование
│   ├── types.ts          # TypeScript-типы
│   ├── bot.ts            # Создание Telegraf, middleware, команды
│   ├── keyboard.ts       # Reply-клавиатура, BTN
│   ├── db/
│   │   ├── index.ts      # Подключение SQLite
│   │   └── schema.ts     # CREATE TABLE
│   ├── middleware/
│   │   ├── whitelist.ts  # Whitelist + user
│   │   └── roleGuard.ts  # Проверка роли
│   ├── services/
│   │   ├── userService.ts
│   │   ├── noteService.ts
│   │   └── dateService.ts
│   ├── scenes/
│   │   ├── addWishScene.ts
│   │   ├── addDateScene.ts
│   │   └── selectRoleScene.ts
│   ├── commands/
│   │   ├── global.ts     # /start, /help
│   │   ├── partner.ts    # /wish, /my_notes
│   │   └── owner.ts      # /date, /dates, /wishes
│   └── scheduler/
│       └── index.ts      # Cron jobs
├── docs/                 # Документация
├── data/                 # SQLite (создаётся автоматически)
├── dist/                 # Сборка tsc
├── .env
├── .env.example
├── package.json
└── tsconfig.json
```

## Cron (часовой пояс Europe/Moscow)

| Время | Задача |
|-------|--------|
| 09:00 | Напоминания о датах (сегодня = дата − remind_before_days) |
| 12:00 | Случайное пожелание партнёра (исключая последние 7 дней) |

## Рекомендации для продакшена

1. Отключить `DISABLE_WHITELIST`
2. Установить `DEBUG=false`
3. Использовать PM2 или Docker для процесса
4. Резервное копирование `data/relationship_bot.db`
