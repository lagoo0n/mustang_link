<div align="center">

# 🐴 MustangLink

### The student community platform for Cal Poly SLO

*Built in 14 hours at KiroHacks · Powered by AI · Student-verified*

[![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?style=flat-square&logo=vercel)](https://vercel.com)
[![Supabase](https://img.shields.io/badge/Database-Supabase-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com)
[![React](https://img.shields.io/badge/Frontend-React-61DAFB?style=flat-square&logo=react)](https://react.dev)

</div>

---

## Overview

MustangLink is a student-only community platform built specifically for Cal Poly SLO. It connects Mustangs through four focused hubs and an AI assistant that understands campus life in real time.

Access is gated to `@calpoly.edu` email addresses — so every user is a verified student.

---

## Features

| Hub | Description |
|---|---|
| 🚗 **Ride Share** | Coordinate carpools to and from SLO |
| 🔍 **Lost & Found** | Report and recover lost items on campus, with photo support |
| 💼 **Opportunities** | Jobs, internships, and campus events |
| 💬 **Social** | Questions, discussions, and student connections |

**Beyond the hubs:**
- 🤖 **AI Assistant** — Powered by Groq (Llama 3), answers questions using live post data from the platform
- 🧵 **Threaded replies** — Full conversation threads on every post
- 🖼️ **Image uploads** — Attach photos to Lost & Found posts via Supabase Storage
- 🚩 **Auto-moderation** — Posts with 3+ community reports are automatically hidden
- 🔐 **Cal Poly email gate** — Only `@calpoly.edu` addresses can sign up

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS, Framer Motion |
| Backend | Supabase (PostgreSQL, Auth, Storage, Edge Functions) |
| AI | Groq API — Llama 3.3 70B |
| Deployment | Vercel |
| Language | TypeScript |

---

## Getting Started

**Prerequisites:** Node.js 18+

```bash
# 1. Clone the repo
git clone https://github.com/lagoo0n/msutang_link.git
cd msutang_link

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Fill in your keys in .env

# 4. Start the dev server
npm run dev
```

### Environment Variables

```env
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_GROQ_API_KEY=your_groq_api_key
```

---

## Database Setup

Run the following in your Supabase SQL Editor to set up the schema:

```sql
-- Profiles
create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text not null,
  created_at timestamptz default now()
);

-- Posts
create table posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  content text not null,
  category text not null,
  subcategory text,
  image_url text,
  parent_id uuid references posts(id) on delete cascade,
  created_at timestamptz default now()
);

-- Reports
create table reports (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade not null,
  reporter_id uuid references auth.users(id) on delete cascade not null,
  reason text not null,
  created_at timestamptz default now(),
  unique(post_id, reporter_id)
);
```

---

## Deployment

Vercel auto-deploys on every push to `main`. Add your environment variables in the Vercel dashboard under **Settings → Environment Variables**.

---

## The Story

MustangLink was built in **14 hours** at **KiroHacks**, a hackathon hosted at Cal Poly San Luis Obispo. The goal: solve a real problem for real students — fragmented campus resources, no central place to coordinate rideshares, find lost items, or surface opportunities.

The standout feature is the **AI-driven contextual search system**: the assistant pulls live posts from the platform and uses them as context, so when a student asks *"is anyone driving to LA this weekend?"* — it actually knows.

---

## Team

<table>
<tr>
<td align="center"><a href="https://github.com/ethanikenaga"><b>Ethan Ikenaga</b></a></td>
<td align="center"><a href="https://github.com/boodrift1"><b>Daniel Huang</b></a></td>
<td align="center"><a href="https://github.com/pLin13cp"><b>Peter Lin</b></a></td>
<td align="center"><a href="https://github.com/lagoo0n"><b>Logan Chook</b></a></td>
</tr>
</table>

*Special thanks to **Toptal** and **Kiro** for hosting KiroHacks.*

---

<div align="center">
<sub>Built by Mustangs, for Mustangs 🌿</sub>
</div>
