# 🚗 EG Driving School - Quick Reference Guide

> **For Kiro AI**: Fast lookup for common development tasks

---

## 🎯 Project Essentials

**Type**: Full-stack Next.js 15 driving school management platform  
**Database**: Supabase (PostgreSQL)  
**Auth**: Clerk  
**Deployment**: Vercel  
**Location**: Brisbane, Australia

---

## 📁 Key Directories

```
app/          → Pages & API routes
components/   → React components (100+)
lib/          → Utilities & services
contexts/     → React Context providers
hooks/        → Custom React hooks
sql/          → Database migrations
```

---

## 🔑 Most Important Files

1. **`app/layout.tsx`** - Root layout, providers
2. **`app/page.tsx`** - Homepage
3. **`app/admin/page.tsx`** - Admin dashboard
4. **`lib/types.ts`** - All TypeScript types
5. **`contexts/editModeContext.tsx`** - Edit mode & real-time
6. **`middleware.ts`** - Clerk authentication
7. **`next.config.ts`** - Configuration

---

## 🗄️ Database Tables (20+)

**Core Tables**:
- `users` - User accounts (synced from Clerk)
- `packages` - Driving lesson packages
- `bookings` - Lesson bookings
- `reviews` - Customer testimonials
- `manual_payment_sessions` - PayID payments
- `user_quotas` - Lesson hours tracking
- `quota_transactions` - Quota audit log
- `site_content` - CMS content
- `content_versions` - Version history

---

## 🔌 API Routes (40+)

### Public
- `GET /api/packages` - List packages
- `POST /api/chatbot` - AI chatbot
- `GET /api/manual-payment` - Payment details

### Protected
- `GET /api/quota` - User quota
- `POST /api/init-user` - Initialize user

### Admin
- `POST /api/packages` - Create package
- `PUT /api/admin/content` - Update content
- `POST /api/admin/theme` - Update theme

### GraphQL
- `POST /api/graphql` - All GraphQL operations

---

## 🎨 Component Categories

- **`components/home/`** - Homepage sections (8)
- **`components/admin/`** - Admin dashboard (20+)
- **`components/ui/`** - shadcn/ui base (40+)
- **`components/drag-drop/`** - Page builder (15+)
- **`components/chatbot/`** - AI chatbot UI
- **`components/maps/`** - Leaflet maps

---

## 🪝 Custom Hooks

```typescript
useBookings()              // Booking management
useNavigationManager()     // Navigation CRUD
usePages()                 // Page management
useProfileCompletion()     // Profile check
useRealTimeNotifications() // SSE notifications
```

---

## 🌐 React Contexts

```typescript
useEditMode()        // Edit mode, real-time, permissions
useGlobalContent()   // Global business info
useTheme()           // Theme customization
```

---

## 🔐 Authentication

**Flow**: Clerk → Middleware → API → Supabase  
**Roles**: admin, editor, viewer, guest  
**Sync**: Automatic Clerk ↔ Supabase user sync

---

## 🎨 Theme System

**Location**: Admin Dashboard → Theme Tab  
**Features**: Colors, typography, layout, dark mode  
**Storage**: Supabase `site_content` table  
**Apply**: Real-time CSS variable injection

---

## 🔄 Real-time Features

**Infrastructure**: `lib/realtime/`  
**Components**: RealtimeClient, PresenceTracker, EventRouter  
**Events**: content_change, component_add, conflict_detected  
**Presence**: Track active editors per page

---

## 📊 GraphQL

**Endpoint**: `/api/graphql`  
**Server**: Apollo Server 4  
**Features**: Queries, Mutations, Subscriptions, DataLoaders  
**Security**: Query complexity limits, depth limits

---

## 💳 Payment System

**Primary**: PayID (0431512095)  
**Flow**: Create session → Display instructions → User pays → Admin confirms  
**Table**: `manual_payment_sessions`  
**Expiry**: 24 hours

---

## 🤖 AI Chatbot

**Providers**: Hyperbolic → OpenRouter → Groq (fallback chain)  
**Context**: Live database data + knowledge base  
**Features**: User-specific responses, booking info  
**Fallback**: Rule-based responses

---

## 🧪 Testing

```bash
npm run test        # Jest unit tests
npm run test:e2e    # Playwright E2E tests
npm run lint        # ESLint
npm run type-check  # TypeScript
```

---

## 🚀 Development Commands

```bash
npm run dev         # Start dev server (Turbopack)
npm run build       # Production build
npm run start       # Start production server
```

---

## 🐛 Common Issues & Solutions

### "User not found"
→ Run `/api/init-user` to sync Clerk user to Supabase

### "Unauthorized"
→ Check Clerk session, verify middleware is running

### "Content not saving"
→ Check edit mode is enabled, user has admin role

### "Real-time not working"
→ Check WebSocket connection, verify Supabase real-time enabled

### "GraphQL errors"
→ Check query complexity, verify authentication

---

## 📝 Code Patterns

### Server Component (Default)
```typescript
export default async function Page() {
  const data = await fetchData();
  return <div>{data}</div>;
}
```

### Client Component
```typescript
'use client';
export default function Component() {
  const [state, setState] = useState();
  return <div>{state}</div>;
}
```

### API Route
```typescript
export async function GET(request: NextRequest) {
  return NextResponse.json({ data });
}
```

### Custom Hook
```typescript
export function useCustomHook() {
  const [state, setState] = useState();
  return { state, setState };
}
```

---

## 🔍 Quick Lookups

### Find Component
→ Search in `components/` directory

### Find API Route
→ Search in `app/api/` directory

### Find Type Definition
→ Check `lib/types.ts`

### Find Database Table
→ Check `schema.sql` or Supabase dashboard

### Find GraphQL Schema
→ Check `lib/graphql/schema.ts`

---

## 📞 External Services

- **Clerk**: https://dashboard.clerk.com
- **Supabase**: https://supabase.com/dashboard
- **Sentry**: https://sentry.io
- **Vercel**: https://vercel.com/dashboard
- **Resend**: https://resend.com/dashboard

---

## 🎯 Development Priorities

1. **Type Safety**: Always use TypeScript
2. **Error Handling**: Try-catch + user-friendly messages
3. **Performance**: Use caching, DataLoaders, pagination
4. **Security**: Validate inputs, check permissions
5. **Real-time**: Use optimistic updates, handle conflicts

---

**Quick Tip**: For detailed information, refer to `KIRO_CONTEXT.md`
