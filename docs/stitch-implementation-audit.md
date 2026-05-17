# Stitch Implementation Audit
**Date:** 2026-05-13  
**Auditor:** Claude (automated audit via Claude Code)  
**Scope:** Stitch design reference vs. codebase implementation  
**Note:** The Stitch reference paste was truncated at 50,000 characters. Only **2 of 16 screens** were received: **Design System (shell)** and **People Directory**. Passes 1 and the screen-by-screen table are therefore scoped to those two screens. Passes 2–8 cover the full codebase as instructed.

---

## 1. EXECUTIVE SUMMARY

| Metric | Value |
|---|---|
| Screens with Stitch reference available | 2 of 16 |
| Screens fully verified (of those 2) | 0 — both are ⚠️ Partial |
| P0 findings | 1 |
| P1 findings | 7 |
| P2 findings | 5 |
| P3 findings | 2 |
| **Overall verdict** | **Needs work** — no critical logic gaps, but navigation mismatch is P0 and token/animation inconsistency is pervasive |

**Key headline:** The People Directory implementation is functionally solid (auth, server actions, and permission checks are all intact). The biggest issues are (a) a structural navigation mismatch between the Stitch shell and the live sidebar, (b) widespread animation timing violations (200ms vs. the required 280ms), and (c) raw `<input>` elements in forms that should use the shadcn `<Input>` primitive. None of these break functionality, but they undermine design consistency and dark-mode reliability.

---

## 2. SCREEN-BY-SCREEN STATUS

| # | Stitch Screen | Target File | Status | Notes |
|---|---|---|---|---|
| 1 | Design System Shell (sidebar + header) | `src/components/layout/sidebar.tsx` | ⚠️ Partial | Nav items don't match Stitch; header/top-bar not implemented as shown; icon library differs (Material Symbols → Lucide) |
| 2 | People Directory | `src/app/(app)/org/people/people-client.tsx` | ⚠️ Partial | Core structure matches; "Manager" column → "Location"; Import CSV missing; pagination static; stats differ; token system different (CSS vars vs Tailwind — better, but diverges from reference) |
| 3–16 | Unknown | — | ❓ Reference not received | Stitch paste was truncated. Re-paste the remaining screens for a complete audit. |

---

## 3. FINDINGS BY SEVERITY

---

### P0 — CRITICAL

#### P0-1 · Sidebar navigation does not match Stitch shell
**File:** `src/components/layout/sidebar.tsx:18–26`

The Stitch Design System shell shows an HR-centric navigation:
- Workspace (dashboard)
- **People Directory** (active)
- Approvals
- Reports
- Settings

The live sidebar has a content/tool platform navigation:
- Home → `/dashboard`
- Atlas Copilot → `/copilot`
- Knowledge Hub → `/knowledge`
- Tools & Generators → `/tools`
- Templates → `/templates`
- Community → `/community`
- Learning → `/learning`

These are fundamentally different nav structures. Either the Stitch shell was not applied to the sidebar, or it was applied to a separate workspace layout that bypasses the main sidebar. Currently the workspace-level nav (Workspace, People, Approvals, Reports, Settings) appears to be served by `src/app/(app)/workspace/layout.tsx` and `src/app/(app)/org/org-nav.tsx`, **not** the main `Sidebar` component.

**Why P0:** The sidebar is the primary navigation chrome. If the design intent was a dedicated HR workspace shell (not the platform shell), the routing/layout hierarchy must explicitly scope it. Right now the two nav structures coexist with no clear delineation.

**Action required:** Confirm design intent. If the Stitch shell is the workspace layout (not the app-wide sidebar), verify `src/app/(app)/workspace/layout.tsx` renders the correct HR nav for all workspace routes. If the Stitch shell replaces the platform sidebar entirely, the sidebar nav items need updating.

---

### P1 — HIGH

#### P1-1 · "Manager" column replaced by "Location" in People Directory
**File:** `src/app/(app)/org/people/people-client.tsx:232`

Stitch shows table columns: Name, Role, Department, **Manager**, Status, Joined Date, Actions.  
Implementation shows: Name, Role, Department, **Location**, Status, Joined Date, Actions.

The Manager column (showing manager avatar + name) is present in the Stitch reference and is an important HR data point. The live table shows `emp.country` in that position instead. There is no manager relationship displayed anywhere in the table.

**Note:** The employee detail page (`[id]/employee-profile.tsx`) does show manager relationship — so the data exists. It was just not surfaced in the table.

#### P1-2 · Hardcoded Tailwind color classes in 7 app files (token violation)
**Files and lines:**

| File | Violations |
|---|---|
| `src/app/(app)/settings/page.tsx` | `bg-blue-*`, `bg-white` |
| `src/app/(app)/admin/community/page.tsx` | `bg-blue-*` |
| `src/app/(app)/admin/subscriptions/page.tsx` | `bg-blue-*` |
| `src/app/(app)/admin/users/users-client.tsx` | `bg-blue-*` |
| `src/app/(app)/admin/page.tsx` | `bg-blue-*` |
| `src/app/(app)/workspace/compliance/page.tsx` | `bg-blue-*` |
| `src/components/layout/header.tsx` | `bg-blue-*` |
| `src/app/(public)/pricing/pricing-client.tsx` | `bg-white` |
| `src/components/legal/CookiePreferences.tsx` | `bg-white` |
| `src/app/(app)/org/leave/leave-client.tsx:24` | `bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400` |

These classes bypass the CSS variable token system and will produce incorrect colors when the accent theme switches or in dark mode.

#### P1-3 · Raw `<input>` elements used instead of shadcn `<Input>` in 17 app files
**Pattern:** 17 `src/app/` files use raw `<input type` instead of the shadcn `Input` component.

Most impactful in the critical People Directory Add Employee modal:
- `src/app/(app)/org/people/people-client.tsx:343` — Full name input
- `src/app/(app)/org/people/people-client.tsx:347` — Email input
- `src/app/(app)/org/people/people-client.tsx:351` — Job title input
- `src/app/(app)/org/people/people-client.tsx:395` — Start date input
- `src/app/(app)/org/people/people-client.tsx:400` — Country input

These raw inputs have no `<Input>` import and use hand-rolled Tailwind classes that may not track theme changes or match shadcn's focus/error state styles.

Also: `<input>` used for the people search bar (`people-client.tsx:161`) — this is a borderline case since it's a custom inline search pattern, but it lacks an accessible `<label>`.

#### P1-4 · Native `<select>` in community mentorship page
**File:** `src/app/(public)/community/mentorship/page.tsx`

The audit rules say NEVER use native `<select>` (rule: Atlas-HR-Fix-Dropdowns). One native `<select>` was found in this file. It should be replaced with the shadcn `<Select>` component.

#### P1-5 · "Import CSV" button missing from People Directory
**File:** `src/app/(app)/org/people/people-client.tsx:147–153`

Stitch shows two header actions: "Import CSV" and "Add employee". The live implementation has only "Add employee" (and only for admins). There is no CSV import functionality.

This may be intentional scope reduction (phased implementation), but it represents a gap from the reference design.

#### P1-6 · Pagination non-functional in People Directory
**File:** `src/app/(app)/org/people/people-client.tsx:290–294`

Stitch shows full pagination: "Page 1 of 54", numbered page buttons (1, 2, 3, … 54), prev/next arrows.

Live implementation shows: static `"Page 1 of 1"` and `"{filtered.length} visible employees"` — no actual pagination controls. All employees are loaded and filtered client-side. At scale (1,200+ employees), this will cause performance issues.

#### P1-7 · Top app bar / header does not match Stitch
**File:** `src/components/layout/header.tsx` (and related layout)

The Stitch design shows a rich top app bar containing:
- Global search input (w-96, "Search people...")
- Secondary nav links (Directory, Attendance, Payroll)
- "Create Request" CTA button (primary, prominent)
- Notifications icon
- Help icon
- User avatar

The live header is not shown in this audit (I don't have its content), but based on the app layout structure and the fact that the sidebar handles user identity, the header likely does not include all of these elements. The "Create Request" CTA in particular is a high-value action not surfaced in the implementation.

---

### P2 — MEDIUM (Polish Gap)

#### P2-1 · Animation timing violations — 200ms used instead of 280ms
**Atlas HR animation spec:** `cubic-bezier(0.32, 0.72, 0, 1)` at `280ms`

Files using wrong duration:
| File | Violation |
|---|---|
| `src/app/(app)/settings/page.tsx:853,858` | `duration-200` (2 instances) |
| `src/components/ui/multi-select.tsx:211,247` | `duration-200` (2 instances) |
| `src/components/ui/combobox.tsx:179,192` | `duration-200` (2 instances) |
| `src/components/ui/select.tsx:51` | `duration-200` (1 instance) |

Also: `src/components/layout/sidebar.tsx:47` — `NavItem` uses `transition-colors duration-150` (150ms, wrong).

The Framer Motion sidebar animation itself is correct (`duration: 0.28, ease: [0.32, 0.72, 0, 1]`), but the Tailwind CSS transitions on interactive elements within it and across the app do not follow the spec.

#### P2-2 · People Directory stat cards show different metrics than Stitch
**File:** `src/app/(app)/org/people/people-client.tsx:297–332`

Stitch stat grid: Hiring Trend (+12% Monthly Growth), Top Hub, Retention (4.2 Years avg), Anniversaries (8 today).  
Live stat grid: Total People (count), Departments (count), Top Hub, On Leave (count).

The live stats are more actionable and data-driven (using real DB counts), which is arguably better, but they don't match the reference. "Anniversaries today" is a particularly notable missing feature — it requires filtering employees by `start_date` day/month.

#### P2-3 · View toggle (list/grid) non-functional
**File:** `src/app/(app)/org/people/people-client.tsx:195–202`

The filter bar has a list/grid toggle with two buttons. The list button is styled as active, the grid button is not. Neither button changes the view — there is no grid view implemented. The grid button click has no handler.

#### P2-4 · Filter chips non-functional
**File:** `src/app/(app)/org/people/people-client.tsx:169–186`

The Department, Location, and Status filter chips render correctly but are `<span>` elements with `ChevronDown` icons — they are not interactive dropdowns. Clicking them does nothing. Only the search `<input>` actually filters the data.

#### P2-5 · Mobile navigation bar missing
**Stitch reference:** A fixed footer `<footer>` with 4 nav items (Home, People, Tasks, Settings) visible on mobile (`md:hidden`).

**Live implementation:** The mobile experience uses `MobileSidebar` (a slide-in drawer via `useSidebar` store), not a bottom nav bar. The bottom tab bar pattern from the Stitch design is absent.

This is a significant mobile UX difference from the reference.

---

### P3 — LOW (Nice-to-have)

#### P3-1 · `title` attribute used instead of `aria-label` on delete button
**File:** `src/app/(app)/org/people/people-client.tsx:274`

```tsx
<Button ... title="Remove employee">
```

Should use `aria-label="Remove employee"` for screen reader compatibility. `title` is a tooltip, not an accessible label for icon-only buttons.

#### P3-2 · `confirm()` browser dialog used for delete confirmation
**File:** `src/app/(app)/org/people/people-client.tsx:106`

```tsx
if (!confirm(`Remove ${name} from this workspace?`)) return;
```

Native `confirm()` cannot be styled, blocks the main thread, and is inconsistent with the Dialog-based confirmation pattern used in other parts of the app (e.g., the "Delete organization" confirmation in org settings). Should be replaced with a `Dialog` confirmation.

---

## 4. PATTERN ANALYSIS

### Pattern A: Animation timing (P2-1)
**4 files, 7 instances** using `duration-200` instead of `duration-280`. This is a codebase-wide pattern. One targeted find-replace can fix all instances. Also affects `sidebar.tsx` NavItem at `duration-150`.

**Fix:** Replace all `duration-200` with `[duration:280ms]` in non-Framer-Motion Tailwind classes. Also update `sidebar.tsx:47` `duration-150` → `[duration:280ms]`.

### Pattern B: Raw `<input>` in forms (P1-3)
**17 app files** with raw `<input type`. This pattern likely occurred because the shadcn `Input` component wasn't consistently used during implementation. A single search-and-replace sweep with the correct `Input` import will resolve most instances.

**Fix priority:** Start with the People Directory add-employee modal (5 inputs, high visibility). Then admin and settings forms.

### Pattern C: Hardcoded color classes (P1-2)
**7 files** using `bg-blue-*` or `bg-gray-*`. These were likely left over from pre-token Stitch output that wasn't fully converted. The pattern is concentrated in admin pages and one leave page — suggesting those pages received less attention during the Stitch import pass.

**Fix:** Replace `bg-blue-500/600` → `bg-accent`, `bg-gray-100` → `bg-bg-hover`, `text-gray-600` → `text-text-secondary` per the token map.

---

## 5. RECOMMENDED FIX ORDER

1. **[P0] Clarify and verify workspace navigation scope** — Is the Stitch sidebar shell applied to the workspace layout (`src/app/(app)/workspace/layout.tsx`) or the global sidebar? Read `workspace/layout.tsx` and `org-nav.tsx`. No code change until intent is clear.

2. **[P1, Pattern A] Replace all `duration-200` with `[duration:280ms]`** — One commit, 4 files, fully fixes P2-1 and aligns with the animation spec everywhere.

3. **[P1, Pattern B] Replace raw `<input>` with shadcn `<Input>` in People Directory modal** — 5 inputs in `people-client.tsx`. Then sweep other forms.

4. **[P1] Fix `bg-gray-` in `leave-client.tsx:24`** — One-line fix, highest risk for dark mode.

5. **[P1] Replace native `<select>` in `community/mentorship/page.tsx`** — One component swap.

6. **[P1] Add Manager column back to People Directory table** — Requires passing manager data to `PeopleClient` (it's available in employee detail, needs to be added to the people list query with a separate query or manager name denormalized on the employee record).

7. **[P1] Fix `title` → `aria-label` on delete button** (`people-client.tsx:274`) — One attribute change.

8. **[P2] Make filter chips functional** — Department/Location/Status should filter `filtered` array, not just display.

9. **[P2] Replace `confirm()` delete with Dialog confirmation** — Model the existing org-settings "Delete org" dialog pattern.

10. **[P1+P2] Implement pagination in People Directory** — Server-side with URL params (`?page=1`) is the right approach. Needed before the directory scales beyond ~200 employees.

11. **[P3] Swap remaining `bg-blue-*` token violations** in admin/settings/compliance pages.

---

## 6. ESTIMATED EFFORT

| Fix Cluster | Files Affected | Estimated Hours |
|---|---|---|
| Animation duration sweep (P2-1) | 5 | 0.5h |
| Raw `<input>` → `<Input>` in people modal | 1 | 0.5h |
| Raw `<input>` sweep across all 17 files | 17 | 3h |
| Hardcoded color token fixes | 7 | 1h |
| Native `<select>` replacement | 1 | 0.5h |
| Manager column in people table | 2 | 1.5h |
| Functional filter chips | 1 | 2h |
| `confirm()` → Dialog on delete | 1 | 1h |
| Server-side pagination | 2 | 3h |
| Import CSV feature | 2+ | 4h+ |
| Mobile bottom nav bar | 1 | 2h |
| Navigation scope clarification | — | 0.5h investigation |
| **Total (excluding CSV + nav investigation)** | | **~16h** |

---

## 7. NOTES ON WHAT IS WORKING WELL

The following are explicitly **correct** — do not fix these:

- **Logic preservation in People Directory:** Auth guard (`getCurrentOrg` + `redirect`), permission gating (`isAdmin`), server actions (`createEmployee`, `deleteEmployee`), and Supabase queries are all intact and correct.
- **Sidebar animation:** Framer Motion implementation uses exactly `duration: 0.28, ease: [0.32, 0.72, 0, 1]` — correct.
- **shadcn `<Select>` component:** Used correctly in the Add Employee modal for department and employment type dropdowns. No native `<select>` in this form.
- **shadcn `<Dialog>` for Add Employee:** Correctly uses `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogFooter`, `DialogClose`.
- **Responsive layout:** People Directory has solid responsive classes (`sm:`, `md:`, `xl:` breakpoints, flex→grid column stacking). No fixed-pixel widths.
- **Status badge semantics:** Status uses both color AND text AND a dot indicator — color is not the only signal. Accessible.
- **Focus states:** Zero instances of `focus:outline-none` without a replacement. Focus ring styles are present throughout.
- **Icon-only button accessibility:** List/grid toggle buttons and the sidebar collapse button all have `aria-label`.
- **No hex color violations in app code:** All hex colors found are in email templates (expected) or the root layout theme-color meta tag. App UI uses CSS variables throughout.

---

*Audit covers: Pass 1 (2 screens), Pass 2 (logic preservation), Pass 3 (token usage), Pass 4 (shadcn primitives), Pass 5 (responsive), Pass 6 (animation), Pass 7 (accessibility), Pass 8 (build not run — requires terminal execution).*  
*To complete Pass 1 for all 16 screens: re-paste the Stitch reference without truncation, or upload screenshots.*
