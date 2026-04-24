# 🃏 Lottery Scratch Card System

A serverless lottery scratch card platform built with Next.js and Supabase. The admin creates cards with a username and lucky number — each card generates a unique link with an interactive scratch animation. Once scratched, the card is permanently marked as used.

## Features

- **Admin panel** — password-protected, create scratch cards, see full history with timestamps and scratch status
- **Duplicate username warning** — alerts admin if a username already has a card, with option to create another anyway
- **Interactive scratch card** — canvas-based gold scratch animation (mouse + touch)
- **One-time use** — after scratching, reopening the link shows "Already Scratched"
- **WhatsApp share** — one-click button to send the link to the user
- **Serverless** — runs entirely on Vercel edge functions, no dedicated server needed

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router, Turbopack) |
| Database | Supabase (PostgreSQL) |
| Hosting | Vercel (serverless functions) |
| Styling | Tailwind CSS |

---

## Setup Guide

### 1. Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** and run the contents of [`supabase/schema.sql`](supabase/schema.sql)
3. Go to **Project Settings → Data API** and copy:
   - Project URL
   - `anon` / public key
   - `service_role` / secret key

### 2. Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_PASSWORD=your-chosen-password
```

### 3. Local Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to `/admin`.

### 4. Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
3. In **Environment Variables**, add the same 4 variables from `.env.local`
4. Click **Deploy**

---

## How It Works

### Admin Flow (`/admin`)

1. Go to `/admin` and enter your password
2. All previously created cards load automatically (with timestamps and scratch status)
3. Enter a **username** and **lottery number** → click **Generate Scratch Card Link**
   - If the username already has a card, a warning appears — you can cancel or create anyway
4. Copy the link or use the **WhatsApp** button to send it to the user

### User Flow (`/scratch/[token]`)

1. User opens their unique link
2. A gold scratch card appears — they scratch with finger or mouse
3. When 55% is scratched, the lucky number fully reveals
4. **If the same link is opened again** → shows "Already Scratched" with the number visible

---

## Project Structure

```
app/
├── admin/page.tsx              # Admin panel (client component)
├── scratch/[token]/page.tsx    # User scratch card page (server component)
├── api/
│   ├── create-card/route.ts    # POST — create a new card
│   ├── scratch/[token]/route.ts # POST — mark card as scratched
│   └── cards/route.ts          # GET  — fetch all cards (admin only)
components/
├── ScratchCard.tsx             # Canvas scratch animation
└── ScratchCardView.tsx         # Client wrapper with API call
lib/
└── supabase.ts                 # Supabase client factory
supabase/
└── schema.sql                  # Database schema (run once in Supabase)
```

---

## Database Schema

```sql
CREATE TABLE lottery_cards (
  id             UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  token          TEXT        UNIQUE NOT NULL,      -- used in the scratch URL
  username       TEXT        NOT NULL,
  lottery_number TEXT        NOT NULL,
  is_scratched   BOOLEAN     DEFAULT FALSE NOT NULL,
  scratched_at   TIMESTAMPTZ,                      -- set when user scratches
  created_at     TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

---

## Security Notes

- The `SUPABASE_SERVICE_ROLE_KEY` is only used server-side in API routes — it is never exposed to the browser
- The `ADMIN_PASSWORD` is validated server-side on every API call — the client never stores a "logged in" token
- Each scratch card token is a UUID (v4) — not guessable
- Once scratched, the DB state cannot be reversed through the app
