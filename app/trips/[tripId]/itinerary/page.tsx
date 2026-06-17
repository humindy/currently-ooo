"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getTrip } from "@/lib/storage";
import type { Trip } from "@/lib/types";
import ItineraryDayColumn, {
  type ItineraryDayItem,
} from "@/components/itinerary/ItineraryDayColumn";

const TABS = [
  { label: "Overview", slug: null },
  { label: "Day-by-Day", slug: "itinerary" },
  { label: "Lodging", slug: "lodging" },
  { label: "Transport", slug: "transportation" },
  { label: "Activities", slug: "activities" },
  { label: "Budget", slug: "budget" },
] as const;

/** Returns an ISO date string for each day between startDate and endDate inclusive. */
export function generateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const d = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  while (d <= end) {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${y}-${mo}-${day}`);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

/** Collects and sorts all ItineraryDayItems that fall on a given date. */
export function buildDayItems(trip: Trip, date: string): ItineraryDayItem[] {
  const items: ItineraryDayItem[] = [];

  for (const l of trip.lodging) {
    if (l.checkIn === date && l.checkOut === date) {
      // 0-night stay: treat as check-in only
      items.push({ kind: "lodging", event: "checkin", data: l, sortKey: "15:00" });
    } else if (l.checkOut === date) {
      items.push({ kind: "lodging", event: "checkout", data: l, sortKey: "11:00" });
    } else if (l.checkIn === date) {
      items.push({ kind: "lodging", event: "checkin", data: l, sortKey: "15:00" });
    }
  }

  for (const t of trip.transportation) {
    if (t.departureDateTime.slice(0, 10) === date) {
      const timePart = t.departureDateTime.length >= 16
        ? t.departureDateTime.slice(11, 16)
        : "00:00";
      items.push({ kind: "transportation", data: t, sortKey: timePart });
    }
  }

  for (const a of trip.activities) {
    if (a.date === date) {
      items.push({ kind: "activity", data: a, sortKey: a.startTime ?? "12:00" });
    }
  }

  return items.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}

export default function ItineraryPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);

  useEffect(() => {
    setTrip(getTrip(tripId) ?? null);
  }, [tripId]);

  if (trip === undefined) return null;

  if (trip === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4 dark:bg-black">
        <p className="text-base font-bold text-zinc-800 dark:text-zinc-100">
          Trip not found
        </p>
        <Link
          href="/"
          className="text-sm font-bold text-teal-700 hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const dates = generateDates(trip.startDate, trip.endDate);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      {/* Tab nav */}
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl">
          <nav className="flex gap-5 overflow-x-auto px-4 text-sm sm:px-8">
            <Link
              href={`/trips/${tripId}`}
              className="flex-none whitespace-nowrap py-3 text-sm font-extrabold text-zinc-900 hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-400"
            >
              {trip.name}
            </Link>
            {TABS.map(({ label, slug }) => {
              const isActive = slug === "itinerary";
              const href = slug
                ? `/trips/${tripId}/${slug}`
                : `/trips/${tripId}`;
              return (
                <Link
                  key={label}
                  href={href}
                  className={`whitespace-nowrap py-3 font-bold transition-colors ${
                    isActive
                      ? "border-b-2 border-teal-700 text-zinc-900 dark:text-zinc-50"
                      : "text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300"
                  }`}
                >
                  {label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Body */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8">
        <div className="flex flex-col gap-6">
          {dates.map((date, i) => (
            <ItineraryDayColumn
              key={date}
              date={date}
              dayNumber={i + 1}
              items={buildDayItems(trip, date)}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
