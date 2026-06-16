"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";
import { getTrips, saveTrip } from "@/lib/storage";
import { Trip } from "@/lib/types";
import TripCard from "@/components/trip/TripCard";

type EditForm = { name: string; startDate: string; endDate: string };
type EditErrors = Partial<Record<keyof EditForm, string>>;

export default function Home() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [editingTrip, setEditingTrip] = useState<Trip | null>(null);
  const [form, setForm] = useState<EditForm>({ name: "", startDate: "", endDate: "" });
  const [errors, setErrors] = useState<EditErrors>({});

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTrips(getTrips());
    setLoaded(true);
  }, []);

  function openEdit(trip: Trip) {
    setEditingTrip(trip);
    setForm({ name: trip.name, startDate: trip.startDate, endDate: trip.endDate });
    setErrors({});
  }

  function closeEdit() {
    setEditingTrip(null);
    setErrors({});
  }

  function handleSave() {
    const next: EditErrors = {};
    if (!form.name.trim()) next.name = "Trip name is required.";
    if (!form.startDate) next.startDate = "Start date is required.";
    if (!form.endDate) next.endDate = "End date is required.";
    if (form.startDate && form.endDate && form.endDate < form.startDate)
      next.endDate = "End date must be on or after start date.";
    if (Object.keys(next).length > 0) { setErrors(next); return; }

    saveTrip({
      ...editingTrip!,
      name: form.name.trim(),
      startDate: form.startDate,
      endDate: form.endDate,
      updatedAt: new Date().toISOString(),
    });
    setTrips(getTrips());
    closeEdit();
  }

  if (!loaded) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-8">
        <span className="text-sm font-extrabold tracking-tight">Currently Out Of Office</span>
        <div className="flex-1" />
        <Link
          href="/trips/new"
          className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800"
        >
          + New Trip
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8">
        {trips.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-teal-700 text-3xl font-light text-teal-700">
              +
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                No trips yet
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Start planning your next adventure.
              </p>
            </div>
            <Link
              href="/trips/new"
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800"
            >
              Create New Trip
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <h1 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                Your Trips
              </h1>
              <span className="text-xs text-zinc-400">
                {trips.length} {trips.length === 1 ? "trip" : "trips"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/trips/new"
                className="flex min-h-[208px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 text-teal-700 hover:border-teal-700 hover:bg-teal-50 dark:border-zinc-700 dark:hover:bg-teal-950/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-teal-700 text-2xl font-light">
                  +
                </div>
                <span className="text-sm font-bold">Create New Trip</span>
              </Link>

              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onDelete={() => setTrips(getTrips())}
                  onEdit={() => openEdit(trip)}
                />
              ))}
            </div>
          </>
        )}
      </main>

      {/* Edit trip modal */}
      {editingTrip && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 pt-16"
          onClick={closeEdit}
        >
          <div
            className="w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                Edit trip
              </h2>
              <button
                onClick={closeEdit}
                className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800"
              >
                <X size={16} />
              </button>
            </div>

            <div className="flex flex-col gap-4">
              <div>
                <label className="mb-1 block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                  Trip name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => { setForm((f) => ({ ...f, name: e.target.value })); setErrors((err) => ({ ...err, name: undefined })); }}
                  placeholder="e.g. Japan Spring 2026"
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 placeholder-zinc-400 focus:border-teal-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                />
                {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
              </div>

              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    Start date
                  </label>
                  <input
                    type="date"
                    value={form.startDate}
                    onChange={(e) => { setForm((f) => ({ ...f, startDate: e.target.value })); setErrors((err) => ({ ...err, startDate: undefined, endDate: undefined })); }}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-teal-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                  />
                  {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>}
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-xs font-bold text-zinc-700 dark:text-zinc-300">
                    End date
                  </label>
                  <input
                    type="date"
                    value={form.endDate}
                    onChange={(e) => { setForm((f) => ({ ...f, endDate: e.target.value })); setErrors((err) => ({ ...err, endDate: undefined })); }}
                    className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900 focus:border-teal-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-50"
                  />
                  {errors.endDate && <p className="mt-1 text-xs text-red-500">{errors.endDate}</p>}
                </div>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={closeEdit}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
