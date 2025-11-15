# Admin Dashboard - Current State Documentation

**Date:** November 15, 2025  
**Purpose:** Complete documentation before refactoring

---

## Overview

The admin dashboard is located at `/admin` and provides comprehensive management tools for:
- Users, bookings, packages, reviews
- Calendar settings and scheduling
- Referral rewards system
- Email announcements
- Content/theme/SEO management

---

## Architecture

### Main Files
- `app/admin/page.tsx` - Server component (data fetching)
- `app/admin/components/AdminDashboardClient.tsx` - Main client component
- `app/admin/components/*Tab.tsx` - Individual feature tabs

### Data Flow
1. Server fetches from Clerk + Supabase
2. Merges user data
3. Passes to client component
4. Client manages state and renders tabs

---

## Key Components

### 1. OverviewTab
- User stats (total, new)
- Booking stats (total, pending)
- Revenue charts (mocked)
- Bookings by month chart

### 2. BookingsTab
- Search/filter bookings
- View booking details
- Update status (sends email)
- Cancel bookings with refund

### 3. UsersTab
- Search users
- View merged Clerk + Supabase data
- Display sync status

### 4. PackagesTab
- CRUD operations for packages
- Set pricing, hours, features
- Mark as popular

### 5. ReviewsTab
- Approve/reject reviews
- Sync external reviews (Google, Facebook)

### 6. CalendarTab
- Visual calendar view
- Booking visualization

### 7. CalendarSettingsTab
- Working hours
- Buffer time
- Lesson duration
- Vacation days

### 8. ReferralRewardsTab
- Manage reward tiers
- Gift rewards
- View statistics

### 9. AnnouncementTab
- Send email announcements
- View history

### 10. PagesTab
- WordPress-like editor
- Live preview
- Block-based editing

### 11. ThemeTab
- Color customization
- Typography
- Custom CSS

### 12. SEOTab
- Meta tags
- Sitemap
- Analytics

---

## API Routes

```
/api/admin/
├── announcements/
│   ├── history/
│   └── send/
├── bookings/[id]/cancel/
├── component-templates/
├── content/
├── direct-pages/
│   ├── content/
│   ├── create/
│   └── update/
├── facebook-reviews/
├── google-reviews/
├── media/
├── pages/
├── referral-rewards/
│   ├── gift/
│   ├── rewards/
│   ├── stats/
│   └── tiers/
├── scheduling-constraints/
├── seo/
├── theme/
└── upload-image/
```

---

## Database Tables

### Core Tables
- `users` - User profiles
- `bookings` - Lesson bookings
- `packages` - Lesson packages
- `reviews` - Customer reviews
- `quota_transactions` - Hour transactions
- `referral_rewards` - Reward records
- `referral_reward_tiers` - Reward tiers
- `calendar_settings` - Calendar config
- `vacation_days` - Blocked dates
- `announcements` - Email history

---

## Features to Remove/Redo

### Planned Changes
1. **Simplify booking management**
2. **Remove complex page builder**
3. **Streamline referral system**
4. **Simplify calendar settings**
5. **Remove unused features**

---

## Dependencies

- Next.js 14+
- Clerk (auth)
- Supabase (database)
- Tailwind CSS
- Shadcn/ui
- Recharts
- Sonner
- Lucide React
- date-fns

---

**Status:** Ready for refactoring
