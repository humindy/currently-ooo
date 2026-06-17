"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getTrip } from "@/lib/storage";
import type { Trip } from "@/lib/types";
import BudgetChart from "@/components/budget/BudgetChart";

const TABS = [
  { label: "Overview", slug: null },
  { label: "Day-by-Day", slug: "itinerary" },
  { label: "Lodging", slug: "lodging" },
  { label: "Transport", slug: "transportation" },
  { label: "Activities", slug: "activities" },
  { label: "Budget", slug: "budget" },
] as const;

export interface CategoryTotal {
  label: string;
  total: number;
  count: number;
  color: string;
}

/** Nights between two ISO dates, never negative. */
export function nightsBetween(checkIn: string, checkOut: string): number {
  const a = new Date(checkIn + "T00:00:00").getTime();
  const b = new Date(checkOut + "T00:00:00").getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

/**
 * Per-category cost breakdown. Lodging cost is per-night (matches the
 * lodging page and trip overview), so it's multiplied by nights stayed.
 * Transportation and activity costs are flat per-item. Missing costs count as 0.
 */
export function computeCategoryTotals(trip: Trip): CategoryTotal[] {
  const lodgingTotal = trip.lodging.reduce(
    (s, l) => s + (l.cost ?? 0) * nightsBetween(l.checkIn, l.checkOut),
    0
  );
  const transportationTotal = trip.transportation.reduce(
    (s, t) => s + (t.cost ?? 0),
    0
  );
  const activitiesTotal = trip.activities.reduce(
    (s, a) => s + (a.cost ?? 0),
    0
  );

  return [
    {
      label: "Lodging",
      total: lodgingTotal,
      count: trip.lodging.length,
      color: "#3b82f6",
    },
    {
      label: "Transportation",
      total: transportationTotal,
      count: trip.transportation.length,
      color: "#f59e0b",
    },
    {
      label: "Activities",
      total: activitiesTotal,
      count: trip.activities.length,
      color: "#14b8a6",
    },
  ];
}

function usd(n: number) {
  return "$" + Math.round(n).toLocaleString();
}

export default function BudgetPage() {
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

  const categories = computeCategoryTotals(trip);
  const totalCost = categories.reduce((s, c) => s + c.total, 0);
  const hasCosts = totalCost > 0;

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
              const isActive = slug === "budget";
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
        <div className="mb-6 flex items-center gap-3">
          <h1 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
            Budget
          </h1>
          {hasCosts && (
            <span className="text-xs text-zinc-400">{usd(totalCost)} total</span>
          )}
        </div>

        {!hasCosts ? (
          <div className="rounded-xl border border-dashed border-zinc-300 px-5 py-12 text-center text-sm text-zinc-400 dark:border-zinc-700">
            No costs added yet.
          </div>
        ) : (
          <div className="flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:gap-12">
            <BudgetChart
              data={categories.map(({ label, total, color }) => ({ label, total, color }))}
              totalCost={totalCost}
            />

            <div className="w-full flex-1 divide-y divide-zinc-200 rounded-xl border border-zinc-200 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-900">
              {categories.map((cat) => (
                <div
                  key={cat.label}
                  className="flex items-center justify-between gap-3 px-4 py-3.5"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="h-2.5 w-2.5 flex-none rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <div>
                      <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                        {cat.label}
                      </div>
                      <div className="text-xs text-zinc-400">
                        {cat.count} {cat.count === 1 ? "item" : "items"}
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
                    {usd(cat.total)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
