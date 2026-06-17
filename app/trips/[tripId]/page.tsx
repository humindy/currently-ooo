"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getTrip } from "@/lib/storage";
import type { Trip } from "@/lib/types";
import { generateDates, buildDayItems } from "@/lib/itinerary";
import ItineraryDayColumn from "@/components/itinerary/ItineraryDayColumn";

const TABS = [
  { label: "Itinerary", slug: null },
  { label: "Lodging", slug: "lodging" },
  { label: "Transport", slug: "transportation" },
  { label: "Activities", slug: "activities" },
  { label: "Budget", slug: "budget" },
] as const;

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", opts);
}

function fullDateRange(start: string, end: string) {
  const s = fmt(start, { month: "short", day: "numeric" });
  const e = fmt(end, { month: "short", day: "numeric", year: "numeric" });
  return `${s} – ${e}`;
}

function totalDays(start: string, end: string) {
  const s = new Date(start + "T00:00:00").getTime();
  const e = new Date(end + "T00:00:00").getTime();
  return Math.round((e - s) / 86_400_000) + 1;
}

export default function TripPage() {
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
        <p className="text-sm text-zinc-500">
          This trip may have been deleted or the link is incorrect.
        </p>
        <Link href="/" className="text-sm font-bold text-teal-700 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const days = totalDays(trip.startDate, trip.endDate);
  const dates = generateDates(trip.startDate, trip.endDate);

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      {/* Cover banner */}
      <div className="relative h-36 bg-gradient-to-br from-zinc-300 to-zinc-400 dark:from-zinc-700 dark:to-zinc-800 sm:h-44">
        <Link
          href="/"
          aria-label="Back to dashboard"
          className="absolute left-4 top-4 flex h-7 w-7 items-center justify-center rounded-lg bg-white/85 text-base font-semibold text-zinc-700 shadow-sm hover:bg-white dark:bg-black/60 dark:text-zinc-200"
        >
          ‹
        </Link>
        <div className="absolute bottom-0 left-0 right-0 px-5 pb-4">
          <h1 className="text-xl font-extrabold leading-tight text-zinc-900 drop-shadow-sm dark:text-zinc-50 sm:text-2xl">
            {trip.name}
          </h1>
          <p className="mt-1 text-xs text-zinc-700 dark:text-zinc-300">
            {fullDateRange(trip.startDate, trip.endDate)}
            {" · "}
            {days} {days === 1 ? "day" : "days"}
          </p>
        </div>
      </div>

      {/* Tab nav */}
      <div className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto max-w-5xl">
          <nav className="flex gap-5 overflow-x-auto px-4 text-sm sm:px-8">
            {TABS.map(({ label, slug }) => {
              const isActive = slug === null;
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
