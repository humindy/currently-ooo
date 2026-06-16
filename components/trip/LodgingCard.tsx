"use client";

import { useState } from "react";
import { Hotel, Pencil, Trash2 } from "lucide-react";
import type { Lodging } from "@/lib/types";

function shortDate(iso: string) {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function nightsBetween(checkIn: string, checkOut: string) {
  const a = new Date(checkIn + "T00:00:00").getTime();
  const b = new Date(checkOut + "T00:00:00").getTime();
  return Math.max(0, Math.round((b - a) / 86_400_000));
}

export default function LodgingCard({
  lodging,
  onDelete,
  onEdit,
}: {
  lodging: Lodging;
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [showConfirm, setShowConfirm] = useState(false);
  const nights = nightsBetween(lodging.checkIn, lodging.checkOut);
  const totalCost = lodging.cost !== undefined ? lodging.cost * nights : undefined;

  return (
    <>
      <div className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:gap-4 sm:p-4">
        {/* Hotel icon */}
        <div className="hidden h-14 w-14 flex-none items-center justify-center rounded-lg bg-zinc-100 dark:bg-zinc-800 sm:flex">
          <Hotel size={24} className="text-zinc-400 dark:text-zinc-500" />
        </div>

        {/* Name + address */}
        <div className="min-w-0 flex-[1.6]">
          <div className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
            {lodging.name}
          </div>
          {lodging.address && (
            <div className="mt-0.5 truncate text-xs text-zinc-500">
              {lodging.address}
            </div>
          )}
        </div>

        {/* Dates + nights */}
        <div className="min-w-0 flex-1">
          <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">
            {shortDate(lodging.checkIn)} → {shortDate(lodging.checkOut)}
          </div>
          <div className="mt-0.5 text-[10px] text-zinc-400">
            {nights} {nights === 1 ? "night" : "nights"}
          </div>
        </div>

        {/* Confirmation # — desktop only */}
        {lodging.confirmationNumber && (
          <div className="hidden flex-1 font-mono text-[10px] leading-relaxed text-zinc-400 sm:block">
            #{lodging.confirmationNumber}
          </div>
        )}

        {/* Cost — total = cost/night × nights */}
        {totalCost !== undefined && (
          <div className="min-w-[4rem] text-right">
            <div className="text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
              ${totalCost.toLocaleString()}
            </div>
            <div className="text-[10px] text-zinc-400">
              ${lodging.cost!.toLocaleString()}/night
            </div>
          </div>
        )}

        {/* Edit + Delete — in-flow, never overlays text on mobile */}
        <div className="flex flex-none items-center gap-0.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
          <button
            onClick={onEdit}
            aria-label={`Edit ${lodging.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
          >
            <Pencil size={14} />
          </button>
          <button
            onClick={() => setShowConfirm(true)}
            aria-label={`Delete ${lodging.name}`}
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
              Remove lodging?
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Are you sure you want to remove{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {lodging.name}
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
