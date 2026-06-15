# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## About this project

"currently-ooo" is a trip-planning app (Next.js App Router + React 19 + TypeScript + Tailwind CSS v4). It is very early-stage: currently only the data model and a localStorage-backed persistence layer exist (`lib/types.ts`, `lib/storage.ts`); `app/page.tsx` is still the default `create-next-app` scaffold and has not been built out yet.

## Important: this is an unfamiliar Next.js version

This repo uses `next@16.2.9`, a version with breaking changes vs. what you may know from training data — APIs, conventions, and file structure may differ. Before writing or modifying any Next.js code (routing, data fetching, navigation, server/client components, etc.), read the relevant docs under `node_modules/next/dist/docs/` (organized into `01-app`, `02-pages`, `03-architecture`, `04-community`). Pay attention to deprecation notices. In particular, if working on client-side navigation/loading behavior, see `01-app/02-guides/instant-navigation.mdx` regarding `unstable_instant`.

## Commands

- `npm run dev` — start the dev server
- `npm run build` — production build
- `npm run start` — run the production build
- `npm run lint` — run ESLint (flat config in `eslint.config.mjs`, based on `eslint-config-next`'s core-web-vitals + typescript configs)

There is no test setup yet.

## Architecture

### Data model (`lib/types.ts`)

Everything revolves around `Trip`, the top-level container:
- `Trip` has `startDate`/`endDate` and arrays of `Destination`, `Lodging`, `Transportation`, and `Activity`.
- `Destination` is a place visited during the trip with its own date sub-range (e.g. Tokyo Aug 1-4, Kyoto Aug 5-7). `Lodging` and `Activity` can optionally reference a `destinationId`.
- `Lodging`, `Transportation`, and `Activity` are the bookable/plannable items, each tied to `tripId`.
- `ItineraryItem` is a discriminated union (`{ kind: "lodging" | "transportation" | "activity", data: ... }`) intended for rendering a unified, chronologically-sorted day-by-day timeline.

### Persistence (`lib/storage.ts`)

All data is stored client-side in `localStorage` under the key `currently-ooo:trips`, as a JSON array of `Trip` objects. Key points:
- `readTrips`/`writeTrips` are internal helpers that no-op/return `[]` on the server (`typeof window === "undefined"`), since this data layer is used from client components.
- `getTrips()` returns all trips sorted by `startDate`.
- `saveTrip(trip)` upserts by `id` and stamps `updatedAt`.
- `createTrip(name, startDate, endDate)` builds a new `Trip` with empty arrays and `id`/timestamps set, but does **not** persist it — call `saveTrip` afterwards.
- `addDestination`/`addLodging`/`addTransportation`/`addActivity` each read the trip, push a new item (generating its `id` via `crypto.randomUUID()` and setting `tripId`), and save the whole trip back. No update/delete helpers exist yet for nested items.

Since there's no backend, all reads/writes must happen in client components (`"use client"`), and any new persistence logic should follow the same read-modify-write-whole-trip pattern.
