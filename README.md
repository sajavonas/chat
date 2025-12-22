
# Чат (готов для Render, пароли — секреты, интерфейс на русском)

Этот пакет структурирован так, чтобы деплой на Render проходил **без ошибок**:

- В корне репозитория находится папка **public/** с файлами `index.html`, `app.js`, `styles.css`, `config.js`.
- Сервис на Render создаётся как **Static Site** со следующими настройками:
  - **Root Directory:** *(оставьте пустым)*
  - **Publish Directory:** `public`
  - **Build Command:** `bash -c 'true'` *(пустой шаг сборки — мы не билдим)*

## Что внутри
- Вход по **секретному паролю** (пароли хранятся как хэши в БД Supabase, в коде не видны).
- После верного пароля показывается приветствие: **«Привет, Катерина!»**.
- Мгновенные сообщения (Supabase Realtime).
- Отображение **даты и времени** у каждого сообщения.
- **Мягкое удаление** (поле `deleted_at`; у админа видны удалённые).
- Загрузка **изображений** в Supabase Storage (публичный бакет `chat-media`).
- Кнопка **«Выйти»** (возврат к вводу пароля).
- Сообщения **не удаляются автоматически**.

## Настройка Supabase (шаги)
1. Создайте проект Supabase.
2. В **Settings → API** скопируйте **Project URL** и **anon / publishable key**.
3. Откройте **SQL editor** и выполните SQL из `supabase/schema.sql`.
   - Создаётся таблица `messages` (с мягким удалением и `image_url`).
   - Создаётся **публичный бакет** хранения `chat-media`.
   - Создаётся таблица `secrets` для хэшей паролей и функция `check_password()` (проверяет пароль на сервере и возвращает роль).
4. **Включите Realtime** для таблицы `public.messages` (Dashboard → Database → Replication → Realtime) или выполните:
   ```sql
   alter publication supabase_realtime add table public.messages;
   ```
5. Откройте `public/config.js` и вставьте свои ключи:
   ```js
   window.SUPABASE_URL = "https://ВАШ_ПРОЕКТ.supabase.co";
   window.SUPABASE_ANON_KEY = "ВАШ_ANON_ИЛИ_PUBLISHABLE_KEY";
   ```

## Установка **секретных паролей**
Пароли не хранятся в коде, а добавляются как **bcrypt‑хэши** в таблицу `secrets`:

```sql
-- Пользовательский пароль (например, userpass) и админ‑пароль (например, adminpass)
insert into public.secrets(role, hash)
values
  ('user', crypt('userpass', gen_salt('bf'))),
  ('admin', crypt('adminpass', gen_salt('bf')));
```

- Функция `check_password(p_password text)` проверяет введённый пароль на сервере и возвращает `'user'` или `'admin'`.
- Таблица `secrets` **не доступна** для чтения анонимно; RPC‑функция работает с правами владельца.

> **Примечание по безопасности:** это лёгкий демо‑вариант без полноценной аутентификации. Для продакшена лучше использовать Supabase Auth + строгие RLS‑политики.

## Локальный тест
```bash
cd public
python -m http.server 8000
# затем откройте http://localhost:8000
```

## Деплой на Render
1) Создайте **Static Site** → подключите репозиторий.
2) Укажите: Root Directory — пусто, Publish Directory — `public`, Build Command — `bash -c 'true'`.
3) Нажмите **Clear build cache & deploy**.
