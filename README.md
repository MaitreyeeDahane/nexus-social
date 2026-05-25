# 🔥 Nexus Social

A production-grade, full-stack Reddit-style social platform built with **Next.js 15**, **TypeScript**, **PostgreSQL**, and modern tooling. Fully deployable for free on **Vercel + Supabase**.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## ✨ Features

### Core Platform
- 🏘️ **Communities** — Create, join, moderate topic-based communities with rules, flairs, banners
- 📝 **Rich Posts** — Text, image, link, and poll posts with full content support
- 🗳️ **Smart Voting** — Upvote/downvote with optimistic UI updates and score aggregation
- 💬 **Nested Comments** — Threaded discussions, collapsible threads, infinite nesting
- 🔔 **Notifications** — Real-time activity alerts with unread counts
- 🔍 **Full-Text Search** — Search posts, communities, users, and comments

### User Features
- 👤 **Profiles** — Karma system, achievement badges, follow/unfollow, activity history
- 🔖 **Bookmarks** — Save and access posts later
- 🎨 **Dark/Light Mode** — System-aware theme with smooth switching
- 📱 **PWA** — Installable progressive web app with mobile nav

### Admin & Moderation
- 🛡️ **Admin Dashboard** — Platform stats, user management, content moderation
- 📋 **Reports System** — Full report lifecycle: pending → reviewing → resolved/dismissed
- 📊 **Mod Logs** — Complete audit trail of all moderation actions
- 🚫 **Ban System** — User banning with reason tracking

### Technical
- ♾️ **Infinite Scroll** — Cursor-based pagination on all feeds
- ⚡ **Optimistic UI** — Instant feedback on votes and bookmarks
- 🔐 **Auth** — GitHub OAuth, Google OAuth, Email/Password credentials
- 🖼️ **Cloudinary** — Image uploads for posts, avatars, and banners
- 🔒 **Rate Limiting** — Per-endpoint rate limiting on all API routes
- 🏗️ **CI/CD** — GitHub Actions pipeline with type-check, lint, test, deploy

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Framework** | Next.js 15 (App Router, Server Actions) |
| **Language** | TypeScript 5 (strict mode) |
| **Styling** | Tailwind CSS 3 + shadcn/ui |
| **State** | Zustand + TanStack Query v5 |
| **Forms** | React Hook Form + Zod |
| **Database** | PostgreSQL (Supabase free tier) |
| **ORM** | Prisma 5 |
| **Auth** | NextAuth.js v5 (beta) |
| **Uploads** | Cloudinary free tier |
| **Animations** | Framer Motion |
| **Testing** | Vitest + Testing Library |
| **CI/CD** | GitHub Actions |
| **Deployment** | Vercel free tier |

---

## 🚀 Quick Start (Local Dev)

### Prerequisites
- Node.js 20+
- npm 9+
- PostgreSQL (local or Supabase)

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env.local
# Edit .env.local with your values (see below)
```

### 3. Setup database
```bash
npm run db:generate    # Generate Prisma client
npm run db:push        # Push schema to database
npm run db:seed        # Seed with demo data
```

### 4. Start dev server
```bash
npm run dev
# Open http://localhost:3000
```

---

## 🔧 Environment Variables

Copy `.env.example` to `.env.local` and fill in:

```bash
# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="run: openssl rand -base64 32"

# Database (Supabase)
DATABASE_URL="postgresql://..."    # Transaction/pooled URL (port 6543)
DIRECT_URL="postgresql://..."     # Session/direct URL (port 5432)

# GitHub OAuth
GITHUB_CLIENT_ID="..."
GITHUB_CLIENT_SECRET="..."

# Google OAuth
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."
CLOUDINARY_UPLOAD_PRESET="nexus-uploads"
```

---

## 🔐 OAuth Setup

### GitHub
1. Go to https://github.com/settings/developers → New OAuth App
2. Homepage URL: `http://localhost:3000`
3. Callback URL: `http://localhost:3000/api/auth/callback/github`
4. Copy Client ID + Secret to `.env.local`

### Google
1. Go to https://console.cloud.google.com → APIs & Services → Credentials
2. Create OAuth 2.0 Client ID (Web application)
3. Authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID + Secret to `.env.local`

### Cloudinary
1. Sign up at https://cloudinary.com (free tier = 25GB)
2. Dashboard → Settings → Upload → Add unsigned preset named `nexus-uploads`
3. Copy cloud name, API key, API secret to `.env.local`

---

## 🗄️ Database Commands

```bash
npm run db:generate      # Generate Prisma client (after schema changes)
npm run db:push          # Push schema (dev, no migration files)
npm run db:migrate       # Create migration file + push (dev)
npm run db:migrate:prod  # Deploy migrations (production)
npm run db:seed          # Seed demo data
npm run db:studio        # Open Prisma Studio GUI
npm run db:reset         # Reset database (⚠️ destroys all data)
```

---

## 🧪 Testing

```bash
npm test                 # Run tests (watch mode)
npm run test:coverage    # Coverage report
npm run test:ui          # Vitest UI
```

Tests are in `src/tests/`:
- `utils.test.ts` — Utility function unit tests
- `validations.test.ts` — Zod schema validation tests
- `post-card.test.tsx` — PostCard component tests

---

## 🚢 Production Deployment (Vercel + Supabase)

### Step 1: Setup Supabase
1. Create account at https://supabase.com (free tier)
2. New project → wait for provisioning
3. Settings → Database → copy **Transaction** URL (port 6543) → `DATABASE_URL`
4. Settings → Database → copy **Session** URL (port 5432) → `DIRECT_URL`

### Step 2: Deploy to Vercel
1. Push code to GitHub
2. Import repo at https://vercel.com/new
3. Add all environment variables from `.env.example`
4. Update `NEXT_PUBLIC_APP_URL` and `NEXTAUTH_URL` to your Vercel domain
5. Click Deploy

### Step 3: Run production migrations
After first deploy, in Vercel dashboard → Functions → run:
```bash
npx prisma migrate deploy
```
Or run locally with production env:
```bash
DATABASE_URL="your-direct-url" npx prisma migrate deploy
npm run db:seed  # Optional: add demo data
```

### Step 4: Update OAuth callback URLs
Add your production domain to GitHub and Google OAuth apps:
- `https://your-app.vercel.app/api/auth/callback/github`
- `https://your-app.vercel.app/api/auth/callback/google`

---

## 📁 Project Structure

```
nexus-social/
├── prisma/
│   ├── schema.prisma          # 26-model database schema
│   └── seed.ts                # Demo data seeder
├── public/
│   └── manifest.json          # PWA manifest
├── src/
│   ├── app/                   # Next.js App Router
│   │   ├── (auth)/            # Login & register pages
│   │   ├── admin/             # Admin dashboard (protected)
│   │   ├── api/               # REST API routes
│   │   ├── r/[slug]/          # Community pages
│   │   ├── u/[username]/      # User profiles
│   │   └── ...                # Other pages
│   ├── components/
│   │   ├── admin/             # Admin UI components
│   │   ├── auth/              # Login/register forms
│   │   ├── comments/          # Comment system
│   │   ├── communities/       # Community UI
│   │   ├── layout/            # Navbar, sidebar, mobile nav
│   │   ├── notifications/     # Notification system
│   │   ├── posts/             # Post cards, feeds, forms
│   │   ├── profile/           # User profile components
│   │   ├── search/            # Search UI
│   │   ├── settings/          # Settings forms
│   │   └── ui/                # Base UI components (shadcn-style)
│   ├── hooks/                 # Custom React hooks
│   ├── lib/
│   │   ├── actions/           # Server Actions (posts, comments, communities)
│   │   ├── validations/       # Zod schemas
│   │   ├── db.ts              # Prisma client singleton
│   │   ├── rate-limit.ts      # Rate limiting utility
│   │   └── utils.ts           # Utility functions
│   ├── stores/                # Zustand state stores
│   ├── tests/                 # Vitest test files
│   └── types/                 # Shared TypeScript interfaces
├── .env.example               # Environment variable template
├── .github/workflows/ci.yml   # GitHub Actions CI/CD
├── Dockerfile                 # Production Docker image
├── docker-compose.yml         # Local development stack
├── vitest.config.ts           # Test configuration
└── README.md
```

---

## 🔒 Security Features

- ✅ Rate limiting on all API endpoints (per-route limits)
- ✅ Zod validation on all inputs (client + server)
- ✅ bcrypt password hashing (cost factor 12)
- ✅ CSRF protection via NextAuth secure cookies
- ✅ XSS protection via security headers
- ✅ Role-based access control (USER / MODERATOR / ADMIN / SUPER_ADMIN)
- ✅ Middleware-level route protection
- ✅ Banned user enforcement at middleware level
- ✅ SQL injection prevention via Prisma ORM
- ✅ File upload validation (type + size limits)

---

## 🎭 Demo Accounts (after seeding)

| User | Email | Password | Role |
|------|-------|----------|------|
| Nexus Admin | admin@nexus.social | any | ADMIN |
| Alice Chen | alice@demo.com | any | USER |
| Bob Martinez | bob@demo.com | any | USER |

> Note: Seeded accounts have no password hash, so they only work via OAuth in production. For local dev credentials testing, register a new account.

---

## 📋 Production Checklist

Before going live:

- [ ] All env vars set in Vercel dashboard
- [ ] `NEXTAUTH_SECRET` is a strong random value
- [ ] OAuth callback URLs updated for production domain
- [ ] Database migrations run (`prisma migrate deploy`)
- [ ] Cloudinary upload preset created
- [ ] Remove/update seeded demo accounts
- [ ] Enable Vercel Analytics (optional)
- [ ] Set up Vercel domain + SSL (automatic on Vercel)
- [ ] Test auth flows (GitHub, Google, credentials)
- [ ] Test image uploads
- [ ] Test all CRUD operations

---

## 📄 License

MIT — see [LICENSE](LICENSE)

Built with ❤️ using Next.js 15, TypeScript, Prisma, and Tailwind CSS.
