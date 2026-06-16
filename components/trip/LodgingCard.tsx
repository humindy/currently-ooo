"use client";

import { useState } from "react";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";
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
  const [showMenu, setShowMenu] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const nights = nightsBetween(lodging.checkIn, lodging.checkOut);
  const totalCost = lodging.cost !== undefined ? lodging.cost * nights : undefined;

  return (
    <>
      <div className="group flex items-center gap-3 rounded-xl border border-zinc-200 bg-white p-3 dark:border-zinc-800 dark:bg-zinc-900 sm:gap-4 sm:p-4">
        {/* Image placeholder */}
        <div className="hidden h-14 w-14 flex-none rounded-lg bg-zinc-200 dark:bg-zinc-700 sm:block" />

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

        {/* Three-dot menu — in-flow so it never overlays text on mobile */}
        <div className="relative flex-none">
          <button
            onClick={() => setShowMenu((v) => !v)}
            aria-label={`Options for ${lodging.name}`}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 opacity-100 transition-colors hover:bg-zinc-100 hover:text-zinc-700 lg:opacity-0 lg:group-hover:opacity-100 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
          >
            <MoreVertical size={15} />
          </button>

          {showMenu && (
            <>
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowMenu(false)}
              />
              <div className="absolute right-0 top-8 z-20 min-w-[140px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onEdit();
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 dark:text-zinc-300 dark:hover:bg-zinc-800"
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <div className="mx-3 h-px bg-zinc-100 dark:bg-zinc-800" />
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setShowConfirm(true);
                  }}
                  className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </>
          )}
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
