# Service Center Unified Design System

## Overview
This document outlines the unified design system applied to the Service Center tabs and components, following Tailwind v4 best practices.

## Design Principles

### 1. **Consistent Color Palette**
- **Primary**: Emerald (emerald-50 to emerald-700)
- **Secondary**: Teal (teal-50 to teal-700)
- **Accent**: Blue (blue-50 to blue-700)
- **Neutral**: Gray (gray-50 to gray-900)

### 2. **Unified Spacing & Dimensions**

#### Border Radius
- **Small**: `rounded-lg` (8px)
- **Medium**: `rounded-xl` (12px)
- **Large**: `rounded-2xl` (16px)

#### Padding
- **Compact**: `p-4` (16px)
- **Standard**: `p-6` (24px)
- **Spacious**: `p-8` (32px)

#### Gaps
- **Tight**: `gap-2` (8px)
- **Standard**: `gap-3` or `gap-4` (12-16px)
- **Loose**: `gap-6` (24px)

### 3. **Component Styling Standards**

#### Tabs Component
```tsx
// TabsList
- Height: h-14 (56px) for large size
- Padding: p-1.5 (6px)
- Background: bg-white/95 with backdrop-blur-md
- Border: border-emerald-200/60
- Border Radius: rounded-xl
- Shadow: shadow-lg

// TabsTrigger
- Active State: gradient from emerald-600 to teal-600
- Inactive State: gray-700 text with emerald-50/80 hover
- Padding: px-6 py-3 for large size
- Border Radius: rounded-lg
- Font: font-medium
- Transition: transition-all duration-200
```

#### Card Components
```tsx
// Standard Card
- Border: border-emerald-200/60
- Border Radius: rounded-xl
- Shadow: shadow-lg or shadow-md
- Background: bg-white/95 with backdrop-blur-md

// Card Header (Gradient)
- Background: bg-gradient-to-r from-emerald-600 to-teal-700
- Text: text-white
- Border Radius: rounded-t-xl
- Title Font: text-xl font-bold

// Card Content
- Padding: p-6 (standard)
```

#### Icon Containers
```tsx
// Standard Icon Container
- Padding: p-2
- Background: bg-{color}-100
- Border Radius: rounded-lg
- Icon Size: h-5 w-5
- Icon Color: text-{color}-600
```

#### Buttons
```tsx
// Primary Button
- Background: bg-gradient-to-r from-emerald-600 to-teal-600
- Hover: hover:from-emerald-700 hover:to-teal-700
- Text: text-white font-bold
- Border Radius: rounded-xl
- Padding: px-6 py-3
- Shadow: shadow-lg
- Hover Effect: hover:shadow-xl hover:scale-105
- Transition: transition-all duration-200

// Secondary Button
- Border: border-emerald-200
- Text: text-emerald-700
- Hover: hover:bg-emerald-50
- Border Radius: rounded-xl
```

#### Stats Cards
```tsx
// Gradient Stats Card
- Background: bg-gradient-to-br from-{color}-500 to-{color}-600
- Text: text-white
- Padding: p-4
- Border Radius: rounded-xl
- Shadow: shadow-md
- Value Font: text-2xl font-bold
- Label Font: text-xs font-medium opacity-90
```

### 4. **Typography Scale**

#### Headings
- **H1**: `text-2xl sm:text-3xl lg:text-4xl font-bold`
- **H2**: `text-xl font-bold`
- **H3**: `text-lg font-bold`
- **H4**: `text-base font-bold`

#### Body Text
- **Large**: `text-base font-medium`
- **Standard**: `text-sm`
- **Small**: `text-xs`

#### Colors
- **Primary Text**: `text-gray-900` or `text-gray-800`
- **Secondary Text**: `text-gray-600`
- **Muted Text**: `text-gray-500`

### 5. **Shadow System**

- **Small**: `shadow-sm` - Subtle elevation
- **Medium**: `shadow-md` - Standard cards
- **Large**: `shadow-lg` - Important elements
- **Extra Large**: `shadow-xl` - Hover states

### 6. **Opacity & Transparency**

- **Background Overlays**: `/95` or `/90`
- **Border Transparency**: `/60`
- **Hover States**: `/80`
- **Disabled States**: `opacity-50`

### 7. **Transitions & Animations**

```css
/* Standard Transition */
transition-all duration-200

/* Hover Scale */
hover:scale-105

/* Color Transitions */
transition-colors

/* Backdrop Blur */
backdrop-blur-md
```

## Component-Specific Guidelines

### Quota Management Tab
- Calendar: White background with emerald-100 border
- Time Slots: Emerald-500 for selected, gray-200 for available
- Booking Confirmation: Gradient from emerald-50 to teal-50
- Stats Cards: Gradient backgrounds (emerald, teal, blue)

### Negotiation Tab
- Message Composer: Emerald to teal gradient header
- Message History: Teal to blue gradient header
- Help Section: Emerald to teal gradient background
- Form Inputs: Rounded-xl with emerald focus ring

### Transaction History Tab
- Header: Emerald to teal gradient
- Transaction Items: White background with hover state
- Pagination: Emerald-themed buttons
- Filters: Emerald-themed select component

### Profile Tab
- User Data Display: Gradient stat cards (blue, green, purple)
- User Data Review: Emerald-themed cards with icon containers
- Completion Progress: Gradient from blue-500 to green-500

## Accessibility Considerations

1. **Focus States**: All interactive elements have visible focus rings
2. **Color Contrast**: All text meets WCAG AA standards
3. **Touch Targets**: Minimum 44x44px for mobile
4. **Hover States**: Clear visual feedback on all interactive elements

## Responsive Design

### Breakpoints
- **Mobile**: Default (< 640px)
- **Tablet**: `sm:` (≥ 640px)
- **Desktop**: `lg:` (≥ 1024px)

### Responsive Patterns
- Grid layouts: `grid-cols-1 lg:grid-cols-2`
- Flex direction: `flex-col sm:flex-row`
- Text sizing: `text-sm sm:text-base lg:text-lg`
- Spacing: `gap-3 sm:gap-4 lg:gap-6`

## Best Practices

1. **Use Semantic HTML**: Proper heading hierarchy and ARIA labels
2. **Consistent Spacing**: Use the spacing scale consistently
3. **Color Harmony**: Stick to the defined color palette
4. **Shadow Hierarchy**: Use shadows to indicate elevation
5. **Smooth Transitions**: Add transitions for better UX
6. **Mobile-First**: Design for mobile, enhance for desktop
7. **Performance**: Use backdrop-blur sparingly, optimize images

## Tailwind v4 Updates Applied

1. **Removed deprecated classes**: Updated all outdated Tailwind syntax
2. **Modern opacity syntax**: Using `/60`, `/80`, `/95` format
3. **Improved gradient syntax**: Using `from-` and `to-` prefixes
4. **Better spacing**: Consistent use of spacing scale
5. **Enhanced shadows**: Using the new shadow system
6. **Backdrop filters**: Modern backdrop-blur implementation

## File Changes Summary

### Updated Files
1. `components/ui/tabs.tsx` - Unified tab styling
2. `app/service-center/page.tsx` - Main page layout
3. `app/service-center/components/QuotaManagementTab.tsx` - Booking interface
4. `app/service-center/components/NegotiationTab.tsx` - Messaging interface
5. `app/service-center/components/TransactionHistoryTab.tsx` - History view
6. `app/service-center/components/UserDataDisplay.tsx` - User stats
7. `app/service-center/components/UserDataReview.tsx` - Profile review

### Key Improvements
- ✅ Unified color scheme across all components
- ✅ Consistent border radius (rounded-xl, rounded-2xl)
- ✅ Standardized padding and spacing
- ✅ Modern shadow system
- ✅ Improved typography hierarchy
- ✅ Better icon containers with backgrounds
- ✅ Enhanced hover and focus states
- ✅ Smooth transitions throughout
- ✅ Mobile-responsive design
- ✅ Accessibility improvements

## Maintenance Guidelines

1. **Adding New Components**: Follow the established patterns
2. **Color Changes**: Update the color palette variables
3. **Spacing Adjustments**: Use the defined spacing scale
4. **Testing**: Check all breakpoints and states
5. **Documentation**: Update this file when making changes

---

**Last Updated**: November 15, 2025
**Version**: 1.0.0
