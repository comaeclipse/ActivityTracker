**Overview**
- Next.js 14 (App Router) monorepo-style app with API routes under `app/api/*`.
- TypeScript throughout for type safety.
- PostgreSQL via Prisma ORM for users, activities, and weight logs.
- Auth via NextAuth.js (scaffold planned; not yet wired).
- UI uses a dark, shadcn-inspired design system via CSS variables and utility classes (no Tailwind dependency yet).

**Layers**
- Frontend (React / Next.js):
  - `app/page.tsx`: Homepage with Status Bar, Activity Feed, Hydration Chart (placeholder)
  - Components under `components/*`
- API (Next.js Route Handlers):
  - Planned: `app/api/activities/route.ts` (POST), `app/api/feed/route.ts` (GET)
  - Planned: `app/api/auth/signup/route.ts` (POST), `app/api/weight/route.ts` (GET/POST)
- Data (Prisma):
  - `prisma/schema.prisma` (models: User, Activity, WeightLog; enum ActivityType)

**Data Model (Prisma)**
- User: `id`, `username`, `password`, `showWeightPublicly`, timestamps
- Activity: `id`, `userId`, `type`, `value`, `unit`, `notes`, timestamps
- WeightLog: `id`, `userId`, `weight`, `unit`, `isPublic`, timestamps

**Routing**
- `/` Homepage: feed (center), status bar (top), hydration chart (sidebar)
- `/auth` Auth (login/signup) — planned
- `/profile` User profile with weight tracker — planned
- `/hydration` Rich hydration dashboard — planned

**Theming**
- Dark-first tokens inspired by shadcn: CSS variables for `--background`, `--foreground`, `--card`, `--muted`, `--border`, `--primary`.
- Utility classes for common components (button, card, input) without Tailwind.

**Next Steps**
- Wire up API routes and mock data for feed/hydration.
- Add NextAuth.js session handling.
- Integrate a chart library (e.g., Recharts) for hydration/weight.

