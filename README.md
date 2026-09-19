# Books

A private reading list — same stack and look as chill-subs (Vite + React + TS +
shadcn/ui + Tailwind + Supabase), installable as a PWA and readable offline.

## Features

- Add/edit books: title, author, category, acquisition, published date, cover
  image, link, notes.
- **Categories** and **acquisition methods** are dropdowns you manage in
  **Settings** (rename re-tags books; delete clears the tag but keeps the books).
- **Add by URL**: paste a publisher/retailer link and hit *Fetch* to autofill
  full title + subtitle, author, published date, and cover. Because most of the
  list is forthcoming titles, it scrapes the publisher page (Jina Reader for
  title/author/date, microlink for the cover) and uses Google Books by ISBN when
  the book is already indexed. Results are validated against the URL (slug match +
  junk filter) so cookie-walls or wrong-book pages get rejected and a Google
  search rescues them. Only empty fields are filled — review before saving.
- List view (grouped by category) and a cover **grid** view.
- Search + category/acquisition filters.
- **Single passphrase** unlock (no accounts).
- **Offline**: install to your home screen; the list opens and is searchable with
  no signal. Cover images are cached too. Edits happen when online.

## One-time setup

### 1. Create a Supabase project
At [supabase.com](https://supabase.com), create a project. From
**Project Settings → API**, copy the **Project URL** and the **anon public** key.

### 2. Run the schema
In the Supabase **SQL Editor**, paste and run
[`supabase/migrations/v1-schema.sql`](supabase/migrations/v1-schema.sql).

### 3. Create your single user
**Authentication → Users → Add user** (email + password). The password *is* your
app passphrase. Then, so you never need email confirmation:
**Authentication → Providers → Email** — you can leave "Confirm email" on and just
click the confirmation, or turn it off for this solo project.

### 4. Configure env
```bash
cp .env.example .env
```
Fill in `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, and `VITE_APP_EMAIL`
(the email from step 3).

### 5. Run
```bash
npm install
npm run dev        # http://localhost:8080
```

## Deploy (Vercel)

Import the repo, framework preset **Vite**, and add the same three environment
variables (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_APP_EMAIL`) in
Vercel's project settings. `vercel.json` already handles SPA routing.

On your iPhone: open the deployed URL in Safari → Share → **Add to Home Screen**.

## Categories seed

On first login, if you have no categories, three defaults are created (General;
Science/Technology/Built; Philosophy/Meditation/Psychedelics). Edit them in
Settings. Acquisition methods start empty — add your own (Libby, MVLC, Buy…).

## Later: auto-adding books

The `books` table has a `source` column (defaults to `manual`). Your Friday Libby
script can `INSERT` new finds with `source = 'libby_script'` and they'll appear in
the app automatically — no app changes needed. (A "To Consider" section keyed off
`source` is the natural next step.)
