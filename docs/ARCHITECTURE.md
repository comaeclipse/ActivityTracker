**Overview**
- Next.js 14 (App Router) monorepo-style app with API routes under `app/api/*`.
- TypeScript throughout for type safety.
- PostgreSQL via Prisma ORM (Neon serverless database).
- Authentication via bcryptjs password hashing with session management.
- UI uses Tailwind CSS v4 with shadcn/ui components and CSS variables.
- GPS location tracking via Leaflet maps.
- Performance monitoring via Vercel Speed Insights.

**Technology Stack**
- Framework: Next.js 14 with App Router
- Language: TypeScript
- Database: PostgreSQL (Neon) via Prisma ORM
- Styling: Tailwind CSS v4, shadcn/ui components
- Maps: Leaflet + react-leaflet
- Icons: lucide-react
- Auth: bcryptjs for password hashing
- Monitoring: Vercel Speed Insights

**Layers**
- Frontend (React / Next.js):
  - `app/page.tsx`: Homepage with ActivityLogger, StatsCards, ActivityFeed
  - `app/login/page.tsx`: Login/signup with anonymous username generation
  - `app/profile/page.tsx`: User profile with activities and stats
  - `app/profile/calendar/page.tsx`: Workout calendar view
  - `app/user/[username]/page.tsx`: Public user profiles
  - `app/goals/page.tsx`: Goal tracking and progress
  - `app/location/page.tsx`: GPS location testing page
  - Components under `components/*`
- API (Next.js Route Handlers):
  - `app/api/activities/route.ts` (POST) - Create activities with optional GPS location
  - `app/api/activities/[activityId]/like/route.ts` (POST) - Like/unlike activities
  - `app/api/feed/route.ts` (GET) - Fetch activity feed with filters
  - `app/api/auth/login/route.ts` (POST) - User login
  - `app/api/auth/register/route.ts` (POST) - User registration
  - `app/api/goals/route.ts` (GET, POST) - Goal management
  - `app/api/goals/[goalId]/route.ts` (PUT, DELETE) - Goal updates
  - `app/api/users/[username]/route.ts` (GET) - Public user data
  - `app/api/weight/route.ts` (GET, POST) - Weight logging
- Data (Prisma):
  - `prisma/schema.prisma` (models: User, Activity, WeightLog, ActivityLike, Goal, GoalUpdate)

**Data Model (Prisma)**
- User: `id`, `username`, `password`, `showWeightPublicly`, timestamps
  - Relations: activities[], weightLogs[], activityLikes[], goals[]
- Activity: `id`, `userId`, `type`, `value`, `unit`, `durationMinutes`, `notes`, `latitude`, `longitude`, `activityDate`, timestamps
  - Relations: user, likes[]
  - Types: RUN, WALK, SWIM, WEIGHTS, BIKE, HYDRATION
- WeightLog: `id`, `userId`, `weight`, `unit`, `isPublic`, timestamps
  - Relations: user
- ActivityLike: `id`, `userId`, `activityId`, timestamps
  - Relations: user, activity
  - Unique constraint on [userId, activityId]
- Goal: `id`, `userId`, `title`, `description`, `goalType`, `targetValue`, `currentValue`, `unit`, `deadline`, `status`, timestamps
  - Relations: user, updates[]
  - Types: INCREASE, DECREASE
  - Status: ACTIVE, COMPLETED, ARCHIVED
- GoalUpdate: `id`, `goalId`, `value`, `notes`, timestamps
  - Relations: goal

**Key Components**
- ActivityLogger: Form for logging activities with optional GPS location
- LocationPicker: GPS location selector with interactive Leaflet map
- ActivityMap: Compact 96x96px map displaying activity location
- ActivityFeed: Real-time feed of user activities with like functionality
- UserActivityList: Profile activity list with location maps
- WorkoutCalendar: Calendar view of workout history
- GoalCard: Individual goal display with progress tracking
- GoalForm: Create/edit goals
- GoalUpdateForm: Log progress updates for goals
- StatsCards: Dashboard statistics display
- ProfileView: User profile with activities and stats

**Routing**
- `/` - Homepage with activity logger, stats, and feed
- `/login` - Login/signup with anonymous username generation
- `/profile` - User profile with activity history
- `/profile/calendar` - Workout calendar view
- `/user/[username]` - Public user profiles
- `/goals` - Goal tracking and management
- `/location` - GPS location testing and debugging

**Features**
- Anonymous fitness tracking with auto-generated usernames
- Activity logging with optional GPS location tracking
- Interactive maps showing workout locations
- Social features: like activities, view public profiles
- Goal setting and progress tracking
- Workout calendar visualization
- Weight tracking
- Performance monitoring with Vercel Speed Insights

**Theming**
- Tailwind CSS v4 with custom configuration
- Dark-first design with CSS variables: `--background`, `--foreground`, `--card`, `--muted`, `--border`, `--primary`, etc.
- shadcn/ui component system with customizable variants
- Responsive design with mobile-first approach

**Authentication Flow**
- Users register with username/password (bcryptjs hashing)
- Random username generator for anonymous fitness tracking
- Session management via context (useAuth hook)
- Protected routes redirect to login when unauthenticated

**Location Features**
- Browser Geolocation API for GPS coordinates
- Leaflet maps for interactive location display
- Optional location capture during activity logging
- Compact map previews on activity cards
- Location test page for debugging GPS functionality

