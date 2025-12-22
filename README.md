
# Chat (Public Folder Ready for Render)

This package is structured so Render can deploy it **without errors**:

- Repo root contains a **public/** folder with `index.html`, `app.js`, `styles.css`, `config.js`.
- Use Render **Static Site** with:
  - **Root Directory:** *(leave blank)*
  - **Publish Directory:** `public`
  - **Build Command:** `bash -c 'true'` (a no-op, because we don't need a build)

## Features
- Password gate: `bulbul` (user) and `kakutis` (admin)
- Instant messages (Supabase Realtime)
- Time & day shown on each message
- Soft delete with `deleted_at` (admin sees deleted ones)
- Image uploads via Supabase Storage (public bucket `chat-media`)
- Log off button
- No TTL/auto-delete

## Supabase setup
1. Create project → **Settings → API**: copy **Project URL** & **anon/publishable key**.
2. **SQL Editor** → paste the SQL from `supabase/schema.sql` and run it.
3. Enable Realtime for `public.messages` (Dashboard → Database → Replication → Realtime) or run:
   ```sql
   alter publication supabase_realtime add table public.messages;
   ```
4. Open `public/config.js` and set your URL & key.

## Local test
```bash
cd public
python -m http.server 8000
# open http://localhost:8000
```

## Security note
This demo allows the `anon` role to read/insert/update with RLS enabled. For production, use Supabase Auth and stricter policies or a backend.
