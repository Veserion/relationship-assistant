# Relationship Reminder Bot — Документация

Сводка по приложению для передачи другому агенту/разработчику.

## Структура документации

| Файл | Описание |
|------|----------|
| [01-overview.md](./01-overview.md) | Назначение, идея, целевая аудитория |
| [02-architecture.md](./02-architecture.md) | Архитектура, слои, потоки данных |
| [03-implementation.md](./03-implementation.md) | Реализованный функционал, ключевые решения |
| [04-data-model.md](./04-data-model.md) | Схема БД, сервисы, типы |
| [05-configuration.md](./05-configuration.md) | Переменные окружения, запуск, деплой |

## Быстрый старт

```bash
npm install
cp .env.example .env
# Заполнить: BOT_TOKEN, OWNER_ID, PARTNER_ID
npm run build && npm start
```

Стек: **Node.js, TypeScript, Telegraf, SQLite, node-cron**
