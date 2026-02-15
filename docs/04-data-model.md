# 4. Модель данных

## Схема БД (SQLite)

### users

| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PK | Внутренний ID |
| telegram_id | INTEGER UNIQUE | Telegram user ID |
| role | TEXT | 'OWNER' \| 'PARTNER' |
| created_at | TEXT | ISO datetime |

### notes

| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PK | |
| user_id | INTEGER FK | → users.id |
| text | TEXT | Текст заметки |
| category | TEXT | 'wish' \| 'idea' \| 'preference' \| 'memory' |
| priority | INTEGER | По умолчанию 0 |
| created_at | TEXT | |

### important_dates

| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PK | |
| owner_id | INTEGER FK | → users.id |
| title | TEXT | Название события |
| date | TEXT | YYYY-MM-DD |
| reminder_type | TEXT | 'yearly' \| 'once' |
| remind_before_days | INTEGER | За сколько дней напомнить |
| created_at | TEXT | |

### reminder_logs

| Поле | Тип | Описание |
|------|-----|----------|
| id | INTEGER PK | |
| reminder_type | TEXT | 'date' \| 'random_note' |
| reference_id | INTEGER | ID даты или заметки |
| sent_at | TEXT | |

## Сервисы

### userService

- `ensureUser(telegramId, role)` — создать пользователя, если нет
- `getUserByTelegramId(telegramId)` — получить по telegram_id
- `createUserWithRole(telegramId, role)` — создать или обновить роль
- `getOrCreateOwner(telegramId)` — только для OWNER_ID

### noteService

- `addNote(userId, text, category?, priority?)` — добавить заметку
- `getNotesByUser(userId)` — заметки пользователя
- `getNotesForOwner(ownerUserId)` — заметки партнёра для организатора
- `getRandomNoteExcludingRecent(excludeIds, limit)` — для random reminder
- `getRecentReminderNoteIds(days)` — не показывать недавние
- `logReminder(type, referenceId)` — запись в reminder_logs

### dateService

- `addImportantDate(ownerId, title, date, reminderType?, remindBeforeDays?)` — добавить дату
- `getDatesByOwner(ownerId)` — даты организатора
- `getDatesDueForReminderToday(ownerId)` — даты для напоминания сегодня
- `deleteDate(id, ownerId)` — удалить дату

## Типы (src/types.ts)

- `User`, `Note`, `ImportantDate` — сущности БД
- `BotState` — `{ user?: User; pendingRoleSelection?: number }`
- `BotContext` — Telegraf Context + state + scene
- `AddDateSceneSession` — состояние сцены addDate
