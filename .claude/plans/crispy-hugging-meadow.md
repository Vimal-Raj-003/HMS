# Plan: HMS UI Theme Modernization — SaaS-Style Healthcare Dashboard

## Context

The HMS frontend uses Tailwind CSS v3.4.1 with an extensive custom design system (1938-line `index.css` with CSS variables, component classes, utility grids). The current design is light-mode only with no dark mode. Dashboards are inconsistent — Doctor/Admin/Nurse use `StatCard` but Lab/Pharmacy/Patient use hand-coded inline cards. Recharts v2.12.0 is installed but unused. All `CollapsibleCard` sections default to collapsed. The reference design (ProvoHeal) shows a modern SaaS dashboard with dark sidebar, card-based KPIs with sparklines, smooth charts, and clean tables.

**Goal:** Upgrade the entire HMS frontend to a modern SaaS healthcare theme with dark mode, consistent components, and improved data visualization — without touching any backend logic, API calls, or data flow.

**Constraint:** Only modify UI/UX layer (styling, layout, visual components). Keep the landing page unchanged.

---

## Architecture Decision

**Approach:** CSS-first theme update leveraging the existing CSS custom property system. Dark mode via Tailwind's `class` strategy + a `ThemeProvider` context. Rather than rewriting every dashboard from scratch, update the shared design tokens, shared components, and then adapt each dashboard to use the updated components consistently.

**Key principle:** The existing `index.css` already has 50+ CSS variables on `:root`. We'll add a `html.dark` block that overrides these same variables, so all components using `var(--color-*)` automatically adapt. For Tailwind utility classes, we'll add `dark:` variants.

---

## Files to Create/Modify

| # | File | Action | Purpose |
|---|------|--------|---------|
| 1 | `frontend/tailwind.config.js` | Modify | Enable `darkMode: 'class'` |
| 2 | `frontend/src/index.css` | Modify | Add `html.dark` CSS variable overrides |
| 3 | `frontend/src/contexts/ThemeContext.tsx` | **Create** | Theme toggle context + localStorage persistence |
| 4 | `frontend/src/App.tsx` | Modify | Wrap app in ThemeProvider |
| 5 | `frontend/src/layouts/DashboardLayout.tsx` | Modify | Add dark mode toggle, update sidebar/header styling |
| 6 | `frontend/src/components/ui/StatCard.tsx` | Modify | Dark mode support, improved design |
| 7 | `frontend/src/components/ui/CollapsibleCard.tsx` | Modify | Dark mode support, improved design |
| 8 | `frontend/src/components/ui/Skeleton.tsx` | Modify | Dark mode support |
| 9 | `frontend/src/components/ui/MiniChart.tsx` | **Create** | Sparkline component using Recharts |
| 10 | `frontend/src/pages/doctor/Dashboard.tsx` | Modify | Consistent StatCard, dark mode, charts |
| 11 | `frontend/src/pages/patient/Dashboard.tsx` | Modify | Use StatCard instead of inline cards, dark mode |
| 12 | `frontend/src/pages/admin/Dashboard.tsx` | Modify | Dark mode, chart for queue, improved table |
| 13 | `frontend/src/pages/lab/Dashboard.tsx` | Modify | Use StatCard, SkeletonDashboard, fix duplication, dark mode |
| 14 | `frontend/src/pages/pharmacy/Dashboard.tsx` | Modify | Use StatCard, dark mode, improved layout |
| 15 | `frontend/src/pages/nurse/Dashboard.tsx` | Modify | Dark mode, improved layout |

---

## Step 1: Enable Dark Mode in Tailwind Config

**File:** `frontend/tailwind.config.js`

Add `darkMode: 'class'` to the config object. This enables `dark:` variant classes throughout the app.

---

## Step 2: Dark Mode CSS Variables

**File:** `frontend/src/index.css`

Add a `html.dark` block after the existing `:root` block that overrides all `--color-*` variables with dark theme values:

```css
html.dark {
  --color-bg-deep: #0B1120;
  --color-bg-soft: #111827;
  --color-bg-card: #1F2937;
  --color-bg-input: #1F2937;

  --color-sidebar-bg: #0B1120;
  --color-sidebar-hover: #1F2937;

  --color-header-bg: rgba(17, 24, 39, 0.9);
  --color-header-border: #374151;
  --color-search-bg: #1F2937;

  --color-card-bg: #1F2937;
  --color-card-border: #374151;
  --color-card-title: #F9FAFB;

  --color-border: #374151;

  --color-text-primary: #F9FAFB;
  --color-text-secondary: #9CA3AF;
  --color-text-muted: #6B7280;

  --color-dialog-bg: #1F2937;
  --color-dialog-overlay: rgba(0, 0, 0, 0.6);

  --shadow-card: 0 1px 3px rgba(0,0,0,0.3);
}
```

Also update body/html base styles to use these variables:
```css
body {
  background-color: var(--color-bg-soft);
  color: var(--color-text-primary);
}
```

Update existing component classes (`.card`, `.btn`, `.input`, `.table`, etc.) to reference CSS variables instead of hardcoded colors, or add `dark:` variants alongside existing classes.

---

## Step 3: ThemeProvider Context

**File:** `frontend/src/contexts/ThemeContext.tsx` (new)

```tsx
- createContext with { theme, toggleTheme }
- Read initial theme from localStorage('hms-theme') or system preference
- Toggle adds/removes 'dark' class on document.documentElement
- Persist choice to localStorage
- Export useTheme() hook
```

---

## Step 4: Wrap App in ThemeProvider

**File:** `frontend/src/App.tsx`

Import and wrap the router/app with `<ThemeProvider>`. No other changes.

---

## Step 5: Update DashboardLayout

**File:** `frontend/src/layouts/DashboardLayout.tsx`

Changes:
1. **Theme toggle button** in header (Sun/Moon icon from Lucide)
2. **Sidebar:** Keep dark gradient but add `dark:` border variant
3. **Header:** Update background to use `var(--color-header-bg)`, add `dark:` variants
4. **Main content area:** `bg-[var(--color-bg-soft)]`
5. **User dropdown:** Add `dark:` variants for dark background
6. **Footer:** Add `dark:` text color

The sidebar is already dark navy, so it looks good in both modes. The main changes are the header and content area.

---

## Step 6: Update StatCard

**File:** `frontend/src/components/ui/StatCard.tsx`

Changes:
1. Card background: `bg-white dark:bg-gray-800`
2. Border: `border-secondary-200 dark:border-gray-700`
3. Text colors: `dark:text-white` for values, `dark:text-gray-400` for labels
4. Icon backgrounds: lighter opacity in dark mode
5. Trend badges: adjusted for dark mode contrast
6. Add optional `sparkData` prop for mini sparkline chart (uses MiniChart component)
7. Shadow: `dark:shadow-gray-900/20`

---

## Step 7: Update CollapsibleCard

**File:** `frontend/src/components/ui/CollapsibleCard.tsx`

Changes:
1. Card: `bg-white dark:bg-gray-800`, border `dark:border-gray-700`
2. Header: `dark:border-gray-700`
3. Title: `dark:text-gray-100`
4. Subtitle: `dark:text-gray-400`
5. Collapsed content bg: `dark:bg-gray-800/50`
6. Toggle button: `dark:text-gray-400 dark:hover:bg-gray-700`

---

## Step 8: Update Skeleton

**File:** `frontend/src/components/ui/Skeleton.tsx`

Changes:
1. Base skeleton: `dark:bg-gray-700` instead of `bg-secondary-200`
2. Shimmer gradient: dark mode variant using darker grays
3. Container cards: `dark:bg-gray-800`

---

## Step 9: MiniChart Component (Sparkline)

**File:** `frontend/src/components/ui/MiniChart.tsx` (new)

A small reusable sparkline component using Recharts:
- Takes `data: number[]`, `color: string`, `height?: number`, `width?: number`
- Renders a `<ResponsiveContainer>` with `<AreaChart>` (no axes, no grid, just the area fill)
- Gradient fill from `color` to transparent
- Used inside StatCard for KPI trend visualization

---

## Step 10–15: Update Each Dashboard

### General Pattern for All Dashboards:
1. Replace inline hand-coded stat cards with `<StatCard>` component
2. Add `dark:` variants to any hardcoded color classes
3. Use `SkeletonDashboard` for loading (replace raw spinners in Lab/Pharmacy)
4. Fix content duplication in CollapsibleCards (Lab)
5. Change `defaultCollapsed={true}` to `defaultCollapsed={false}` for key sections (upcoming appointments, queue status) so important data is visible on load
6. Add dark mode classes to modals, alerts, banners
7. Ensure table rows, badges, and status indicators have dark mode variants

### Dashboard-Specific Changes:

**Doctor Dashboard (Step 10):**
- StatCards already used — add dark mode variants to modal overlays, appointment cards
- Set Upcoming Appointments `defaultCollapsed={false}`
- Add dark mode to appointment detail cards and modals

**Patient Dashboard (Step 11):**
- Replace 3 inline cards with `<StatCard>` components
- Add dark mode to appointment list items
- Set Upcoming Appointments `defaultCollapsed={false}`

**Admin Dashboard (Step 12):**
- StatCards already used — add dark mode
- Fix queue status table: add `dark:bg-gray-800` rows, `dark:text-gray-300`
- Alerts section: dark mode for alert items
- Set Queue Status `defaultCollapsed={false}`

**Lab Dashboard (Step 13):**
- Replace 6 inline stat cards with `<StatCard>` or `<StatCardCompact>`
- Replace raw spinner with `<SkeletonDashboard />`
- Fix collapsed/expanded content duplication (make expanded content show more detail)
- Add dark mode throughout
- Use `hms-stats-grid` for consistent grid

**Pharmacy Dashboard (Step 14):**
- Replace 4 inline cards with `<StatCard>` (keep clickable behavior via `onClick`)
- Replace raw spinner with `<SkeletonDashboard />`
- Monthly summary banner: add dark mode gradient
- Recent transactions list: dark mode
- Top selling medicines: dark mode

**Nurse Dashboard (Step 15):**
- StatCards already used — add dark mode
- Waiting list and recent vitals: dark mode for cards
- Set Waiting for Vitals `defaultCollapsed={false}`

---

## Verification

| # | Test | Expected |
|---|------|----------|
| 1 | Toggle dark mode | All dashboards switch themes correctly |
| 2 | Refresh page in dark mode | Theme persists (localStorage) |
| 3 | Check all 6 dashboards in light mode | No visual regression from current state |
| 4 | Check all 6 dashboards in dark mode | All text readable, no white backgrounds leaking |
| 5 | Check mobile responsiveness | Sidebar toggles correctly, cards stack properly |
| 6 | Landing page | Unchanged (not affected by dark mode) |
| 7 | StatCard consistency | All dashboards use StatCard component |
| 8 | Loading states | All dashboards show SkeletonDashboard |
| 9 | No backend errors | No API calls changed, no data flow altered |

## Implementation Order

1. Steps 1-4 (Infrastructure: tailwind config, CSS variables, ThemeProvider, App.tsx)
2. Steps 5-9 (Shared components: DashboardLayout, StatCard, CollapsibleCard, Skeleton, MiniChart)
3. Steps 10-15 (Individual dashboards, in order: Doctor, Patient, Admin, Lab, Pharmacy, Nurse)

## What Is NOT Changed

- Landing page design
- All backend APIs and routes
- All data flow and state management logic
- All form validation and submission logic
- All socket.io integration
- All authentication flows
- Component logic (event handlers, API calls, state updates)
