**Activity Tracker — Bootstrap**

- Stack: Next.js 14 (App Router) + TypeScript. Dark, shadcn-inspired UI via CSS variables (no Tailwind yet).
- Architecture summary: `docs/ARCHITECTURE.md`.

**Getting Started**
- Prereqs: Node 18+.
- Install deps: `npm install`
- Dev server: `npm run dev` then open `http://localhost:3000`

**Database Setup (Prisma + Postgres)**
- Use Neon (recommended for Vercel) or any other Postgres provider
  - Create a Neon project/database.
  - Get two connection strings:
    - Pooled (pgBouncer) → set as `DATABASE_URL` (use `?sslmode=require`).
    - Direct (non-pooled) → set as `DIRECT_URL` (use `?sslmode=require`).
  - Copy env: `Copy-Item .env.example .env` and fill both URLs.
  - Run migrations: `npm run prisma:migrate`.
  - Dev: `npm run dev` (uses pooled URL).

Scripts:
- `npm run prisma:generate` — generate Prisma Client
- `npm run prisma:migrate` — create/apply migrations to DB
- `npm run prisma:studio` — web UI to view/edit data
- `npm run db:push` — push schema without migrations (useful for throwaway dev)

**Vercel + Neon**
- In Vercel Project Settings → Environment Variables:
  - Set `DATABASE_URL` to Neon pooled URL
  - Set `DIRECT_URL` to Neon direct URL
- Redeploy. For production migrations, run from your machine or CI with the same env vars.

**Prevent Committing Secrets (optional but recommended)**
- `.gitignore` already ignores `.env` and `.env.*`.
- Install a pre-commit hook (Windows PowerShell):
  - `Copy-Item scripts/pre-commit.ps1 .git/hooks/pre-commit`
  - Ensure execution allowed: `Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass`
  - The hook blocks commits that include env files or staged diffs containing `DATABASE_URL=`, `DIRECT_URL=`, `PGPASSWORD=`, etc.


**Project Structure**
- `app/layout.tsx` — root layout and global shell
- `app/page.tsx` — homepage with Status Bar, Activity Feed, Hydration placeholder
- `components/*` — UI components
- `app/globals.css` — dark theme tokens and utilities
- `prisma/schema.prisma` — DB models (PostgreSQL)
- `docs/ARCHITECTURE.md` — high-level architecture

**Next Steps**
- Add API routes under `app/api/*` and wire mock data to real data.
- Integrate NextAuth.js and session state.
- Add charting (e.g., Recharts) to Hydration/Weight.
- Add Tailwind + shadcn/ui if desired for richer components.
