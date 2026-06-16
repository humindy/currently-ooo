"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getTrip, saveTrip } from "@/lib/storage";
import type { Destination, Trip } from "@/lib/types";
import { Pencil, Trash2, X } from "lucide-react";

const TABS = [
  { label: "Overview", slug: null },
  { label: "Day-by-Day", slug: "itinerary" },
  { label: "Lodging", slug: "lodging" },
  { label: "Transport", slug: "transportation" },
  { label: "Activities", slug: "activities" },
  { label: "Budget", slug: "budget" },
] as const;

function fmt(iso: string, opts: Intl.DateTimeFormatOptions) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", opts);
}

function shortDate(iso: string) {
  return fmt(iso, { month: "short", day: "numeric" });
}

function fullDateRange(start: string, end: string) {
  const s = fmt(start, { month: "short", day: "numeric" });
  const e = fmt(end, { month: "short", day: "numeric", year: "numeric" });
  return `${s} – ${e}`;
}

function dayNumber(tripStart: string, date: string) {
  const base = new Date(tripStart + "T00:00:00").getTime();
  const d = new Date(date + "T00:00:00").getTime();
  return Math.round((d - base) / 86_400_000) + 1;
}

function totalDays(start: string, end: string) {
  const s = new Date(start + "T00:00:00").getTime();
  const e = new Date(end + "T00:00:00").getTime();
  return Math.round((e - s) / 86_400_000) + 1;
}

function usd(n: number) {
  return "$" + n.toLocaleString();
}

export default function TripOverviewPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const [deletingDestId, setDeletingDestId] = useState<string | null>(null);
  const [editingDest, setEditingDest] = useState<Destination | null>(null);
  const [destForm, setDestForm] = useState({ name: "", startDate: "", endDate: "", notes: "" });
  const [destNameError, setDestNameError] = useState(false);

  useEffect(() => {
    setTrip(getTrip(tripId) ?? null);
  }, [tripId]);

  function openEditDest(dest: Destination) {
    setDestForm({ name: dest.name, startDate: dest.startDate, endDate: dest.endDate, notes: dest.notes ?? "" });
    setDestNameError(false);
    setEditingDest(dest);
  }

  function handleDeleteDest(destId: string) {
    if (!trip) return;
    const updated = { ...trip, destinations: trip.destinations.filter((d) => d.id !== destId) };
    saveTrip(updated);
    setTrip(updated);
    setDeletingDestId(null);
  }

  function handleSaveDest(e: React.FormEvent) {
    e.preventDefault();
    if (!destForm.name.trim()) { setDestNameError(true); return; }
    if (!editingDest || !trip) return;
    const updated = {
      ...trip,
      destinations: trip.destinations.map((d) =>
        d.id === editingDest.id
          ? { ...d, name: destForm.name.trim(), startDate: destForm.startDate, endDate: destForm.endDate, notes: destForm.notes.trim() || undefined }
          : d
      ),
    };
    saveTrip(updated);
    setTrip(updated);
    setEditingDest(null);
  }

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
  const cityCount = trip.destinations.length;
  const lodgingCost = trip.lodging.reduce((s, l) => {
    if (!l.cost) return s;
    const nights = Math.max(0, Math.round(
      (new Date(l.checkOut + "T00:00:00").getTime() - new Date(l.checkIn + "T00:00:00").getTime()) / 86_400_000
    ));
    return s + l.cost * nights;
  }, 0);
  const transportCost = trip.transportation.reduce((s, t) => s + (t.cost ?? 0), 0);
  const activitiesCost = trip.activities.reduce((s, a) => s + (a.cost ?? 0), 0);
  const totalCost = lodgingCost + transportCost + activitiesCost;

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
            {cityCount > 0 &&
              ` · ${cityCount} ${cityCount === 1 ? "city" : "cities"}`}
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
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Destinations */}
          <section className="min-w-0 flex-[1.3]">
            <h2 className="mb-3 text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
              Destinations
            </h2>
            {trip.destinations.length === 0 ? (
              <div className="rounded-xl border border-dashed border-zinc-300 px-5 py-8 text-center text-sm text-zinc-400 dark:border-zinc-700">
                No destinations added yet.
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {trip.destinations.map((dest) => {
                  const startDay = dayNumber(trip.startDate, dest.startDate);
                  const endDay = dayNumber(trip.startDate, dest.endDate);
                  return (
                    <div
                      key={dest.id}
                      className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="h-12 w-12 flex-none rounded-lg bg-zinc-200 dark:bg-zinc-700" />
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                          {dest.name}
                        </div>
                        <div className="mt-0.5 text-xs text-zinc-500">
                          Days {startDay}–{endDay}
                          {" · "}
                          {shortDate(dest.startDate)}–{shortDate(dest.endDate)}
                        </div>
                      </div>
                      <div className="flex flex-none items-center gap-0.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                        <button
                          onClick={() => openEditDest(dest)}
                          aria-label={`Edit ${dest.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingDestId(dest.id)}
                          aria-label={`Delete ${dest.name}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* Quick access */}
          <section className="min-w-0 flex-1">
            <h2 className="mb-3 text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
              Quick access
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <Link
                href={`/trips/${tripId}/lodging`}
                className="rounded-xl border border-zinc-200 p-3 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
              >
                <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 font-mono text-[8px] font-semibold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                  HTL
                </div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Lodging
                </div>
                <div className="mt-0.5 text-xs text-zinc-500">
                  {trip.lodging.length} {trip.lodging.length === 1 ? "stay" : "stays"}
                  {lodgingCost > 0 && ` · ${usd(lodgingCost)}`}
                </div>
              </Link>

              <Link
                href={`/trips/${tripId}/transportation`}
                className="rounded-xl border border-zinc-200 p-3 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
              >
                <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 font-mono text-[8px] font-semibold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                  TRN
                </div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Transport
                </div>
                <div className="mt-0.5 text-xs text-zinc-500">
                  {trip.transportation.length}{" "}
                  {trip.transportation.length === 1 ? "leg" : "legs"}
                  {transportCost > 0 && ` · ${usd(transportCost)}`}
                </div>
              </Link>

              <Link
                href={`/trips/${tripId}/activities`}
                className="rounded-xl border border-zinc-200 p-3 transition-colors hover:bg-zinc-100 dark:border-zinc-800 dark:hover:bg-zinc-800/60"
              >
                <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg border border-zinc-200 bg-zinc-100 font-mono text-[8px] font-semibold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400">
                  ACT
                </div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Activities
                </div>
                <div className="mt-0.5 text-xs text-zinc-500">
                  {trip.activities.length} booked
                  {activitiesCost > 0 && ` · ${usd(activitiesCost)}`}
                </div>
              </Link>

              <Link
                href={`/trips/${tripId}/budget`}
                className="rounded-xl border border-teal-200 bg-teal-50 p-3 transition-colors hover:bg-teal-100 dark:border-teal-900 dark:bg-teal-950/30 dark:hover:bg-teal-950/50"
              >
                <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-lg bg-teal-700 font-mono text-[8px] font-semibold text-white">
                  $
                </div>
                <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                  Budget
                </div>
                <div className="mt-0.5 text-xs text-zinc-600 dark:text-zinc-400">
                  {totalCost > 0 ? `${usd(totalCost)} total` : "No costs tracked"}
                </div>
              </Link>
            </div>
          </section>
        </div>
      </main>

      {/* Delete destination confirmation */}
      {deletingDestId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDeletingDestId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
              Remove destination?
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Remove{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {trip.destinations.find((d) => d.id === deletingDestId)?.name}
              </span>
              ? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeletingDestId(null)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteDest(deletingDestId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit destination modal */}
      {editingDest && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setEditingDest(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                Edit destination
              </h2>
              <button
                onClick={() => setEditingDest(null)}
                aria-label="Close"
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleSaveDest} noValidate>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  Name
                </label>
                <input
                  type="text"
                  value={destForm.name}
                  onChange={(e) => { setDestForm((p) => ({ ...p, name: e.target.value })); setDestNameError(false); }}
                  placeholder="e.g. Tokyo, Japan"
                  className={`h-9 w-full rounded-lg border px-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-zinc-800 dark:text-zinc-100 ${destNameError ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"}`}
                />
                {destNameError && <p className="mt-1 text-xs text-red-500">Name is required.</p>}
              </div>
              <div className="mb-6 flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={destForm.startDate}
                    onChange={(e) => setDestForm((p) => ({ ...p, startDate: e.target.value }))}
                    className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    End date
                  </label>
                  <input
                    type="date"
                    value={destForm.endDate}
                    min={destForm.startDate || undefined}
                    onChange={(e) => setDestForm((p) => ({ ...p, endDate: e.target.value }))}
                    className="h-9 w-full rounded-lg border border-zinc-300 px-3 text-sm text-zinc-800 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setEditingDest(null)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-bold text-white hover:bg-teal-800"
                >
                  Save changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
