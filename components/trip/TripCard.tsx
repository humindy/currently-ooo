"use client";

import { useState } from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { Trip } from "@/lib/types";
import { deleteTrip } from "@/lib/storage";

function formatDateRange(startDate: string, endDate: string): string {
  const start = new Date(`${startDate}T00:00:00Z`);
  const end = new Date(`${endDate}T00:00:00Z`);

  const startMonth = start.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  const endMonth = end.toLocaleDateString("en-US", { month: "short", timeZone: "UTC" });
  const startDay = start.getUTCDate();
  const endDay = end.getUTCDate();
  const startYear = start.getUTCFullYear();
  const endYear = end.getUTCFullYear();

  if (startMonth === endMonth && startYear === endYear) {
    return `${startMonth} ${startDay} – ${endDay}, ${endYear}`;
  }

  return `${startMonth} ${startDay}, ${startYear} – ${endMonth} ${endDay}, ${endYear}`;
}

export default function TripCard({
  trip,
  onDelete,
  onEdit,
}: {
  trip: Trip;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const destinationCount = trip.destinations.length;

  function handleDelete() {
    deleteTrip(trip.id);
    setShowConfirm(false);
    onDelete();
  }

  return (
    <>
      {/* Outer div carries `group` so hover state works for both Link and buttons */}
      <div className="group relative flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900">
        <Link href={`/trips/${trip.id}`} className="flex flex-col">
          <div className="flex h-24 items-end bg-[repeating-linear-gradient(45deg,theme(colors.zinc.100),theme(colors.zinc.100)_6px,theme(colors.zinc.200)_6px,theme(colors.zinc.200)_12px)] p-2 dark:bg-[repeating-linear-gradient(45deg,theme(colors.zinc.800),theme(colors.zinc.800)_6px,theme(colors.zinc.700)_6px,theme(colors.zinc.700)_12px)]">
            {trip.coverImage && (
              <span className="font-mono text-[9px] uppercase tracking-wide text-zinc-500">
                {trip.coverImage}
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-col gap-2 p-3">
            <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
              {trip.name}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400">
              {formatDateRange(trip.startDate, trip.endDate)}
            </div>

            {destinationCount > 0 && (
              <div className="flex flex-wrap gap-1">
                {trip.destinations.slice(0, 3).map((destination) => (
                  <span
                    key={destination.id}
                    className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
                  >
                    {destination.name}
                  </span>
                ))}
                {destinationCount > 3 && (
                  <span className="rounded-md bg-zinc-100 px-2 py-0.5 text-[10px] text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
                    +{destinationCount - 3}
                  </span>
                )}
              </div>
            )}

            <div className="mt-auto pt-2 font-mono text-[9px] uppercase tracking-wide text-zinc-400 dark:text-zinc-500">
              {destinationCount === 1
                ? "1 destination"
                : `${destinationCount} destinations`}
            </div>
          </div>
        </Link>

        {/* Edit + Delete — siblings to Link to avoid nested interactive elements */}
        <div className="absolute right-2 top-2 flex items-center gap-0.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
          <button
            onClick={onEdit}
            aria-label={`Edit ${trip.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-zinc-400 shadow-sm transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:bg-zinc-800/90 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            aria-label={`Delete ${trip.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg bg-white/90 text-zinc-400 shadow-sm transition-colors hover:bg-red-50 hover:text-red-500 dark:bg-zinc-800/90 dark:hover:bg-red-950/40 dark:hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Confirmation dialog */}
      {showConfirm && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setShowConfirm(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
              Delete trip?
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to delete{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {trip.name}
              </span>
              ? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
