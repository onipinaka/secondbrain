# NeuroOS — Claude Context

**What:** Vivek's personal second brain. Private URL, no auth, single user. Replacing Notion.

## Tech Stack
Tailwind v4 (NO tailwind.config.ts — tokens in `@theme` in `src/index.css`) · Vite + React 18 + TypeScript · React Router v6 · Zustand · TanStack Query + Table · Recharts · Supabase (anon key, no backend) · BlockNote · @dnd-kit · Sonner · cmdk · Lucide React

## Hard Rules
1. Tailwind v4 only — `bg-rose` not `bg-[#D4848A]`. No tailwind.config.ts ever.
2. Never edit `src/types/database.ts` (auto-generated)
3. Never install packages without being asked
4. Cards: `bg-card rounded-card border border-border shadow-none`
5. Headings: `font-display`. Body: `font-sans`. No inline styles.
6. All Supabase calls through `src/lib/supabase.ts` only
7. Sonner toast on every add/edit/delete/error
8. Auto-save: 500ms debounce via `useDebounce`. Show "Saving..." / "Saved ✓"
9. Don't touch `Layout.tsx` or `Sidebar.tsx` unless task is specifically about them

## Folder Structure
```
src/
├── components/ui/       shadcn — never edit
├── components/layout/   Layout.tsx, Sidebar.tsx
├── components/shared/   DataTable.tsx, BlockEditor.tsx, KanbanBoard.tsx, CommandPalette.tsx
├── pages/workspace/     WorkspacePage.tsx
├── stores/              Zustand stores
├── lib/                 supabase.ts, utils.ts
├── types/               database.ts — never edit
└── hooks/               useDashboard, useTasks, useHabits, usePlanner, etc.
```

## Database
Supabase Postgres, 57 tables. Most have `workspace_id FK → workspaces`. Key shared: `topics`, `resources`, `questions`, `note_pages` (polymorphic: entity_type+entity_id), `schedule_items` (polymorphic), `quick_capture`.

## Key Patterns
- **DataTable**: reusable, pass `columns + onRowAdd/Update/Delete`. Inline editing, badge+select cells.
- **BlockEditor**: `<BlockEditor entityType="x" entityId="id" workspaceId="id" />` — auto-creates note_pages row, auto-saves.
- **KanbanBoard**: reused in Tasks (status cols) + Projects (stage cols). @dnd-kit drag → UPDATE status.
- **schedule_items**: polymorphic. Used by planner, tasks schedule modal, dashboard.
- **Stats rows**: compute client-side, never a separate query unless necessary.
- No shadcn Dialog available — build custom modal overlays (`fixed inset-0 z-50`).

## Progress & Roadmap

**Done:** Phases 1–6 (scaffold, tokens, sidebar, routing, Supabase client, types, DataTable, BlockEditor, Dashboard, **Tasks**)

| Phase | Feature | Key Files | Status |
|-------|---------|-----------|--------|
| 7 | Quick Capture / Inbox | `pages/Inbox.tsx`, `hooks/useQuickCapture.ts` | **Next** |
| 8 | Habits + Calendar | `pages/Calendar.tsx`, `hooks/useHabits.ts` | — |
| 9 | Daily Planner | `pages/Planner.tsx`, `hooks/usePlanner.ts` | — |
| 10 | Workspace Engine | `pages/workspace/WorkspacePage.tsx`, `hooks/useWorkspace.ts` | — |
| 11–17 | Workspace Tabs | per type (core_subject, business, opportunities, open_source, learning_lab, language, system_design/CP) | — |
| 18 | Projects | `pages/ProjectDetail.tsx` | — |
| 19 | Gym | 8 tabs, Recharts throughout | — |
| 20 | Personal + Reading | Goals/Journal/Books/etc. | — |
| 21 | Analytics | `pages/Analytics.tsx` | — |
| 22 | Command Palette | `shared/CommandPalette.tsx`, cmdk, Cmd+K | — |
| 23 | Settings | `pages/Settings.tsx`, 7 sections | — |
| 24 | Polish + Deploy | empty states, skeletons, vercel.json | — |

## Workspace Type → Tabs
```
core_subject    → Topics | Resources | Questions | Interview Q&A | Notes
learning_lab    → Topics | Resources | Project Ideas | Learning Path | Notes
business        → Leads | Clients | Content | Ads | Templates | SaaS | Notes
opportunities   → All | Hackathons | Competitions | Internships | Fellowships | Calendar
open_source     → Repos | Pull Requests | Issues | Notes
gym             → Workout Log | Exercises | PRs | Body Metrics | Diet | Steps | Calories | Pushups | Calisthenics
personal        → Goals | Meditation | Journal | Quotes | Gratitude | Notes
reading         → Books | Articles | Courses | Playlists | Geopolitics
projects        → Projects | Notes
language        → Vocabulary | Kanji | Grammar | Sessions | Immersion Log | Notes
competitive_prog→ Topics | Questions | Contests | Rating | Editorials | Journal
system_design   → Topics | Case Studies | Interview Q&A | Resources | Notes
standalone      → Notes only
```
