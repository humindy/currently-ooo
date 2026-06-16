"use client";

import { useState } from "react";
import { Bus, Car, Pencil, Plane, Ship, Train, Trash2 } from "lucide-react";
import type { Transportation, TransportationType } from "@/lib/types";

const TYPE_LABELS: Record<TransportationType, string> = {
  flight: "Flight",
  train: "Train",
  "car-rental": "Car Rental",
  ferry: "Ferry",
  bus: "Bus",
};

const TYPE_ICONS: Record<
  TransportationType,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  flight: Plane,
  train: Train,
  "car-rental": Car,
  ferry: Ship,
  bus: Bus,
};

function fmtDateTime(iso: string): string {
  const [datePart, timePart = "00:00"] = iso.split("T");
  const d = new Date(datePart + "T00:00:00");
  const dateStr = d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
  const [h, m] = timePart.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${dateStr} · ${hour12}:${m} ${ampm}`;
}

export default function TransportationCard({
  transportation: t,
  onDelete,
  onEdit,
}: {
  transportation: Transportation;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const TypeIcon = TYPE_ICONS[t.type];
  const typeLabel = TYPE_LABELS[t.type];

  return (
    <>
      <div className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:gap-4 sm:p-4">
        {/* Type badge */}
        <div className="flex flex-none items-center gap-1.5 rounded-lg bg-zinc-100 px-2.5 py-1.5 dark:bg-zinc-800">
          <TypeIcon size={13} className="text-zinc-500 dark:text-zinc-400" />
          <span className="hidden text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400 sm:inline">
            {typeLabel}
          </span>
        </div>

        {/* Departure */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {t.departureLocation}
          </div>
          <div className="mt-0.5 text-[10px] text-zinc-400">
            {fmtDateTime(t.departureDateTime)}
          </div>
        </div>

        {/* Arrow + Arrival — omitted when arrivalLocation is not set (e.g. car rental pickup-only) */}
        {t.arrivalLocation && (
          <>
            <div className="flex-none text-xs text-zinc-400">→</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
                {t.arrivalLocation}
              </div>
              {t.arrivalDateTime && (
                <div className="mt-0.5 text-[10px] text-zinc-400">
                  {fmtDateTime(t.arrivalDateTime)}
                </div>
              )}
            </div>
          </>
        )}

        {/* Confirmation # — desktop only */}
        {t.confirmationNumber && (
          <div className="hidden font-mono text-[10px] text-zinc-400 sm:block">
            #{t.confirmationNumber}
          </div>
        )}

        {/* Cost */}
        {t.cost !== undefined && (
          <div className="flex-none text-right text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
            ${t.cost.toLocaleString()}
          </div>
        )}

        {/* Edit + Delete — in-flow so they never overlay text on mobile */}
        <div className="flex flex-none items-center gap-0.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
          <button
            onClick={onEdit}
            aria-label={`Edit ${typeLabel}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            aria-label={`Delete ${typeLabel}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

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
              Remove transportation?
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Remove{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {t.departureLocation}
                {t.arrivalLocation ? ` → ${t.arrivalLocation}` : ""}
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
                onClick={() => {
                  setShowConfirm(false);
                  onDelete();
                }}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
