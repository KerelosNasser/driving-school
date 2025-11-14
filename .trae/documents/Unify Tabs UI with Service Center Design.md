## Extracted Design Elements

### Color Scheme

* Primary: emerald scale (`--theme-primary-*`) mapped to `--primary` for UI accents; see `app/globals.css:155-166` and `app/globals.css:127-131`

* Secondary: teal scale (`--theme-secondary-*`) supporting gradients and highlights; see `app/globals.css:168-177`

* Accent: blue scale (`--theme-accent-*`) for information states; see `app/globals.css:180-189`

* Background/Foreground: OKLCH tokens (`--background`, `--foreground`, `--card`, `--muted`, `--accent`, `--border`, `--input`, `--ring`); see `app/globals.css:121-139` and dark variants `app/globals.css:271-303`

* Text/Icon colors: service center uses light foreground on dark gradient headers (`text-emerald-100`, `text-blue-100`) and neutral for inactive states; see `app/service-center/page.tsx:236-245` and `app/service-center/page.tsx:387-392`

* State colors: active tab uses emerald→teal gradient with white text and shadow; inactive uses gray text with emerald hover; see `app/service-center/page.tsx:387-392` and `app/service-center/page.tsx:399-404`

### Measurements

* Tabs list height: default `h-9` (`components/ui/tabs.tsx:29-31`); service center uses `h-12` (`app/service-center/page.tsx:384-385`)

* Trigger padding: default `px-2 py-1` and `text-sm` (`components/ui/tabs.tsx:45`); service center uses compact `font-medium text-xs` and rounded `rounded-md` (`app/service-center/page.tsx:387-393`)

* Border radii: global `--radius` with Tailwind mappings (`@theme inline` radii); see `app/globals.css:113-117`, theme radii `app/globals.css:228-234`; service center uses `rounded-lg` list and `rounded-md` triggers (`app/service-center/page.tsx:384-392`)

* Spacing: triggers use `gap-1.5` by default (`components/ui/tabs.tsx:45`), service center adds `space-x-1` and grid layout (`app/service-center/page.tsx:384-446`)

* Typography: fonts from Geist (`app/layout.tsx:18-30`), mapped via CSS variables (`app/globals.css:82-83`); sizes `text-xs|sm|lg` used across cards and tabs (`app/service-center/page.tsx:246-266`, `app/service-center/page.tsx:387-393`)

### Visual Hierarchy

* Current tab indication: gradient background `from-emerald-500 to-teal-600`, `text-white`, `shadow-md`; see `app/service-center/page.tsx:387-392`

* Hover effects: inactive `hover:text-emerald-600` and `hover:bg-emerald-50`; see `app/service-center/page.tsx:390-392`

* Focus states: global ring tokens with focus-visible on triggers; see `components/ui/tabs.tsx:45`

* Transitions: `transition-all duration-200` on service center tabs; base tabs use `transition-[color,box-shadow]`; see `app/service-center/page.tsx:392` and `components/ui/tabs.tsx:45`

## Implementation Plan

### 1) Centralize Service Center Styling in Tabs Component

* Extend `components/ui/tabs.tsx` to accept `variant` (`"default" | "service"`) and `size` (`"sm" | "md" | "lg"`)

* For `TabsList` when `variant="service"`:

  * Apply `h-12 bg-gradient-to-r from-[var(--theme-neutral-50)] via-[color:var(--theme-primary-50/0.9)] to-[color:var(--theme-accent-50/0.9)] backdrop-blur-sm border border-[color:var(--theme-primary-200/0.5)] shadow-lg rounded-lg p-1` while preserving `inline-flex` layout

* For `TabsTrigger` when `variant="service"`:

  * Base: keep accessibility and layout (`inline-flex`, `gap-1.5`, `rounded-md`, `disabled:opacity-50`, focus ring from ring token)

  * Active: `data-[state=active]:bg-gradient-to-r data-[state=active]:from-[var(--theme-primary-500)] data-[state=active]:to-[var(--theme-secondary-600)] data-[state=active]:text-white data-[state=active]:shadow-md`

  * Inactive: `data-[state=inactive]:text-[var(--theme-neutral-700)] data-[state=inactive]:hover:text-[var(--theme-primary-600)] data-[state=inactive]:hover:bg-[color:var(--theme-primary-50)]`

  * Size mappings: `sm → h-8 px-2 py-1 text-xs`, `md → h-9 px-3 py-2 text-sm`, `lg → h-12 px-4 py-2 text-sm`

* Preserve current default styling for other contexts to avoid regressions (`components/ui/tabs.tsx:29-31`, `components/ui/tabs.tsx:45` remain default for `variant="default"`)

### 2) Apply Variant in Service Center

* Update `app/service-center/page.tsx` tabs usage to:

  * `<Tabs ...>` unchanged

  * `<TabsList variant="service" size="lg" className="grid grid-cols-6 w-full max-w-3xl" />`

  * `<TabsTrigger variant="service" />` for each trigger; remove repeated per-trigger gradient and inactive classes

* Preserve `hidden sm:inline` for trigger labels to match current responsive behavior

### 3) Use Theme Tokens for Consistency

* Replace hard-coded color utilities in tabs with CSS variables via Tailwind arbitrary values, ensuring the palette aligns with `app/globals.css:153-269`

* Continue leveraging global tokens (`bg-muted`, `text-muted-foreground`, `ring`, `input`) where appropriate for base states

### 4) Accessibility Compliance

* Ensure minimum contrast:

  * Active gradient (emerald-500 → teal-600) with `text-white` meets ≥4.5:1 on both ends

  * Inactive text `--theme-neutral-700` versus `--background` meets ≥4.5:1

* Keep `focus-visible` ring and outline from `ring` token (`components/ui/tabs.tsx:45`)

* Maintain Radix roles/ARIA (`tablist`, `tab`, `aria-selected`) from current wrappers

* Where labels hide on small screens, ensure icons have accessible names via visible text at `sm:` or `aria-label`

### 5) Responsive Behavior

* Retain current grid layout and breakpoints in service center usage (`app/service-center/page.tsx:382-446`)

* Size prop enables consistent heights across contexts; service center uses `lg` to match `h-12`

* Keep text visibility pattern (`hidden sm:inline`) to preserve compact mobile nav

### 6) Verification

* Visual audit:

  * Compare tabs in service center against cards and headers to ensure no jarring transitions

  * Check active/inactive/hover/disabled states in light/dark modes

* Accessibility checks:

  * Use browser accessibility tools to verify contrast ratios for active and inactive states

  * Keyboard navigation: cycle tabs with arrow keys; focus ring visible

* Responsive checks:

  * Validate layout and truncation at `sm`, `md`, `lg` widths; ensure labels appear at `sm+`

* Regression guard:

  * Confirm admin tabs retain default visuals where `variant` not applied

## Deliverables

* Updated `components/ui/tabs.tsx` with `variant` and `size` support and service styling using theme tokens

* Service center tabs migrated to the variant without custom per-trigger classes

* Consistency and accessibility verification checklist executed

## Notes

* Tailwind v4 “CSS-first” setup with tokens in `app/globals.css` (confirmed via `postcss.config.mjs:1-3` and `components.json:6-12`) ensures theme cohesion

* Changes preserve existing functionality and interaction patterns while unifying the visual language across components

