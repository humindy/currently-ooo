"use client";

import { useState } from "react";
import {
  Clock,
  Landmark,
  Map,
  MoreHorizontal,
  Mountain,
  Pencil,
  ShoppingBag,
  Ticket,
  Trash2,
  Utensils,
} from "lucide-react";
import type { Activity, ActivityType } from "@/lib/types";

const TYPE_LABELS: Record<ActivityType, string> = {
  restaurant: "Restaurant",
  museum: "Museum",
  tour: "Tour",
  show: "Show",
  outdoor: "Outdoor",
  shopping: "Shopping",
  "free-time": "Free Time",
  other: "Other",
};

const TYPE_ICONS: Record<
  ActivityType,
  React.ComponentType<{ size?: number; className?: string }>
> = {
  restaurant: Utensils,
  museum: Landmark,
  tour: Map,
  show: Ticket,
  outdoor: Mountain,
  shopping: ShoppingBag,
  "free-time": Clock,
  other: MoreHorizontal,
};

function fmtTime(time: string): string {
  const [h, m] = time.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

function fmtDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export default function ActivityCard({
  activity: a,
  onDelete,
  onEdit,
}: {
  activity: Activity;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const TypeIcon = TYPE_ICONS[a.type];
  const typeLabel = TYPE_LABELS[a.type];

  const timeRange = a.startTime
    ? a.endTime
      ? `${fmtTime(a.startTime)} – ${fmtTime(a.endTime)}`
      : fmtTime(a.startTime)
    : null;

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

        {/* Title + location + time */}
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {a.title}
          </div>
          {a.location && (
            <div className="mt-0.5 truncate text-[10px] text-zinc-400">
              {a.location}
            </div>
          )}
          {timeRange && (
            <div className="mt-0.5 text-[10px] text-zinc-400">{timeRange}</div>
          )}
        </div>

        {/* Date */}
        <div className="hidden flex-none text-xs text-zinc-400 sm:block">
          {fmtDate(a.date)}
        </div>

        {/* Confirmation # */}
        {a.confirmationNumber && (
          <div className="hidden font-mono text-[10px] text-zinc-400 sm:block">
            #{a.confirmationNumber}
          </div>
        )}

        {/* Cost */}
        {a.cost !== undefined && (
          <div className="flex-none text-right text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
            ${a.cost.toLocaleString()}
          </div>
        )}

        {/* Edit + Delete */}
        <div className="flex flex-none items-center gap-0.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
          <button
            onClick={onEdit}
            aria-label={`Edit ${a.title}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            aria-label={`Delete ${a.title}`}
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
              Remove activity?
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Remove{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {a.title}
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
