# Roadmap — Currently OOO

> Living plan + status tracker for the app. Update the status emoji as work lands so a
> fresh session (or another agent) can pick up where we left off.
>
> **For architecture, data model, conventions, and commands, see [`CLAUDE.md`](./CLAUDE.md).**
> This doc is *only* the plan and status — it intentionally does not duplicate that.

## Vision

**Currently OOO** is a personal trip-planning web app and UI Engineer portfolio piece.
It replaces spreadsheet-based itinerary planning: a traveler creates a trip, adds lodging,
transportation, and activities, and sees them assembled into a chronological day-by-day
itinerary with a budget summary.

Design wireframes: "Wayfarer Wireframes" — https://claude.ai/design/p/99c07230-3e6e-424a-8f6c-d9031eed280f (8 screens)

## Status legend

| Emoji | Meaning |
|-------|---------|
| ✅ | Done & tested |
| 🏗️ | In progress |
| 🔲 | Not started |
| 💡 | Stretch goal (Phase 2) |

## Phase 1 — Core features

| Feature | Status | Key files | Notes |
|---------|--------|-----------|-------|
| Trip dashboard | ✅ | `app/page.tsx`, `components/trip/TripCard.tsx` | Lists trips; empty state; delete on card hover |
| Create new trip | ✅ | `app/trips/new/page.tsx` | Name + date range; validates end after start |
| Trip overview | ✅ | `app/trips/[tripId]/page.tsx` | Tab nav hub for a trip |
| Lodging | ✅ | `app/trips/[tripId]/lodging/page.tsx`, `components/trip/LodgingCard.tsx` | Add / edit / delete |
| Transportation | ✅ | `app/trips/[tripId]/transportation/page.tsx`, `components/trip/TransportationCard.tsx` | Add / edit / delete |
| Activities | ✅ | `app/trips/[tripId]/activities/page.tsx`, `components/trip/ActivityCard.tsx` | Add / edit / delete |
| Day-by-Day itinerary | ✅ | `app/trips/[tripId]/itinerary/page.tsx`, `components/itinerary/ItineraryDayColumn.tsx` | Generates a day per trip date; collects + chronologically sorts lodging check-in/out, transport departures, activities; per-kind styling; "Nothing planned yet" empty state. Tests passing. |
| Budget summary | 🔲 | `app/trips/[tripId]/budget/page.tsx` (todo) | Total cost by category (lodging / transport / activities) with a recharts chart; per-day or per-destination breakdown. Tab already exists in nav. |

## Phase 2 — Stretch goals

| Goal | Status | Notes |
|------|--------|-------|
| Drag-and-drop reordering of activities within a day | 💡 | Use dnd-kit |
| Interactive map view | 💡 | Leaflet or Mapbox; plot destinations / lodging |
| Supabase backend | 💡 | Replace localStorage — should only require changing `lib/storage.ts` (see Decision log) |
| Export / print view | 💡 | Print-friendly itinerary |
| Trip sharing via read-only link | 💡 | Depends on a real backend |

## Conventions checklist (definition of done per feature)

Every new page/component should satisfy these before it's considered done:

- [ ] Client component (`"use client"`) — all data reads/writes go through `lib/storage.ts`, never `localStorage` directly
- [ ] Edit (pencil) + Delete (trash) icons revealed on card hover (`group-hover:opacity-100`)
- [ ] Delete shows a confirmation dialog before executing
- [ ] Edit opens the same add modal, pre-filled with existing data
- [ ] Back link returns to the parent page (trip overview or dashboard)
- [ ] Icons from `lucide-react`, type-specific per item kind
- [ ] Form validation: required fields enforced; date logic validated (end after start)
- [ ] Tests added: rendering, interactions (edit/delete), and validation — `npm test` green

## Decision log

Dated one-liners for choices a fresh session shouldn't have to re-derive.

- **2026-06-16** — Persistence is abstracted behind `lib/storage.ts` (localStorage, key `currently-ooo:trips`). Components never touch `localStorage` directly so we can swap to a real DB (e.g. Supabase) by changing only that file.
- **2026-06-16** — `ItineraryItem` is a discriminated union (`kind` + `data`) so the itinerary timeline can render lodging, transport, and activities uniformly. The itinerary page uses a slightly richer `ItineraryDayItem` variant adding `event` ("checkin"/"checkout") and `sortKey` for in-day ordering.
- **2026-06-16** — One feature per commit (see git history pattern).

## References

- Architecture / conventions / commands: [`CLAUDE.md`](./CLAUDE.md)
- Design wireframes: https://claude.ai/design/p/99c07230-3e6e-424a-8f6c-d9031eed280f
- Tests: `npm test` (Vitest + React Testing Library)
