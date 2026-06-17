"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Pencil, Plus, Trash2, X } from "lucide-react";
import { addMapLink, deleteMapLink, getTrip, updateMapLink } from "@/lib/storage";
import type { MapLink, Trip } from "@/lib/types";
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

function isValidHttpsUrl(value: string): boolean {
  try {
    return new URL(value).protocol === "https:";
  } catch {
    return false;
  }
}

interface MapFormState {
  label: string;
  url: string;
}

interface MapFormErrors {
  label?: string;
  url?: string;
}

const EMPTY_MAP_FORM: MapFormState = { label: "", url: "" };

export default function TripPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const [showMapModal, setShowMapModal] = useState(false);
  const [editingMapLink, setEditingMapLink] = useState<MapLink | null>(null);
  const [mapForm, setMapForm] = useState<MapFormState>(EMPTY_MAP_FORM);
  const [mapErrors, setMapErrors] = useState<MapFormErrors>({});
  const [deletingMapLinkId, setDeletingMapLinkId] = useState<string | null>(null);

  function reload() {
    setTrip(getTrip(tripId) ?? null);
  }

  useEffect(() => {
    reload();
  }, [tripId]);

  function openAddMapModal() {
    setMapForm(EMPTY_MAP_FORM);
    setMapErrors({});
    setEditingMapLink(null);
    setShowMapModal(true);
  }

  function openEditMapModal(link: MapLink) {
    setMapForm({ label: link.label, url: link.url });
    setMapErrors({});
    setEditingMapLink(link);
    setShowMapModal(true);
  }

  function closeMapModal() {
    setShowMapModal(false);
    setEditingMapLink(null);
  }

  function validateMapForm(): MapFormErrors {
    const errs: MapFormErrors = {};
    if (!mapForm.label.trim()) errs.label = "Label is required.";
    if (!mapForm.url.trim()) errs.url = "URL is required.";
    else if (!isValidHttpsUrl(mapForm.url.trim()))
      errs.url = "Enter a valid https:// URL.";
    return errs;
  }

  function handleMapSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validateMapForm();
    if (Object.keys(errs).length > 0) {
      setMapErrors(errs);
      return;
    }
    const data = { label: mapForm.label.trim(), url: mapForm.url.trim() };
    if (editingMapLink) {
      updateMapLink(tripId, { ...editingMapLink, ...data });
    } else {
      addMapLink(tripId, data);
    }
    reload();
    closeMapModal();
  }

  function handleDeleteMapLink(mapLinkId: string) {
    deleteMapLink(tripId, mapLinkId);
    reload();
    setDeletingMapLinkId(null);
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
  const dates = generateDates(trip.startDate, trip.endDate);
  const mapLinks = trip.mapLinks ?? [];

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
        <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
          {/* Day-by-day itinerary */}
          <section className="min-w-0 flex-[1.3]">
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
          </section>

          {/* Saved map links */}
          <aside className="min-w-0 flex-1 lg:max-w-xs">
            <h2 className="mb-3 text-sm font-extrabold text-zinc-900 dark:text-zinc-50">
              Google Maps — Saved Places
            </h2>
            <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
              {mapLinks.length === 0 ? (
                <div className="px-4 py-6 text-center text-xs text-zinc-400">
                  No saved maps yet
                </div>
              ) : (
                <div className="divide-y divide-zinc-100 dark:divide-zinc-800">
                  {mapLinks.map((link) => (
                    <div
                      key={link.id}
                      className="group flex items-center gap-2 px-4 py-3"
                    >
                      <a
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="min-w-0 flex-1 truncate text-sm font-semibold text-teal-700 hover:underline dark:text-teal-400"
                      >
                        {link.label}
                      </a>
                      <div className="flex flex-none items-center gap-0.5 opacity-100 transition-opacity lg:opacity-0 lg:group-hover:opacity-100">
                        <button
                          onClick={() => openEditMapModal(link)}
                          aria-label={`Edit ${link.label}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-700 dark:hover:text-zinc-300"
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={() => setDeletingMapLinkId(link.id)}
                          aria-label={`Delete ${link.label}`}
                          className="flex h-7 w-7 items-center justify-center rounded-lg text-zinc-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-950/30 dark:hover:text-red-400"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
              <button
                onClick={openAddMapModal}
                className="flex w-full items-center justify-center gap-1.5 border-t border-zinc-100 px-4 py-2.5 text-xs font-bold text-teal-700 hover:bg-zinc-50 dark:border-zinc-800 dark:text-teal-400 dark:hover:bg-zinc-800/60"
              >
                <Plus size={13} />
                Add link
              </button>
            </div>
          </aside>
        </div>
      </main>

      {/* Add / edit map link modal */}
      {showMapModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={closeMapModal}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                {editingMapLink ? "Edit map link" : "Add map link"}
              </h2>
              <button
                onClick={closeMapModal}
                aria-label="Close"
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X size={18} />
              </button>
            </div>
            <form onSubmit={handleMapSubmit} noValidate>
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  Label
                </label>
                <input
                  type="text"
                  value={mapForm.label}
                  onChange={(e) => {
                    setMapForm((p) => ({ ...p, label: e.target.value }));
                    setMapErrors((p) => ({ ...p, label: undefined }));
                  }}
                  placeholder="e.g. Tokyo Restaurants"
                  className={`h-9 w-full rounded-lg border px-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-zinc-800 dark:text-zinc-100 ${mapErrors.label ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"}`}
                />
                {mapErrors.label && (
                  <p className="mt-1 text-xs text-red-500">{mapErrors.label}</p>
                )}
              </div>
              <div className="mb-6">
                <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  URL
                </label>
                <input
                  type="url"
                  value={mapForm.url}
                  onChange={(e) => {
                    setMapForm((p) => ({ ...p, url: e.target.value }));
                    setMapErrors((p) => ({ ...p, url: undefined }));
                  }}
                  placeholder="https://maps.google.com/..."
                  className={`h-9 w-full rounded-lg border px-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-zinc-800 dark:text-zinc-100 ${mapErrors.url ? "border-red-400" : "border-zinc-300 dark:border-zinc-700"}`}
                />
                {mapErrors.url && (
                  <p className="mt-1 text-xs text-red-500">{mapErrors.url}</p>
                )}
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeMapModal}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-bold text-white hover:bg-teal-800"
                >
                  {editingMapLink ? "Save changes" : "Save link"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete map link confirmation */}
      {deletingMapLinkId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
          onClick={() => setDeletingMapLinkId(null)}
        >
          <div
            className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
              Remove map link?
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Remove{" "}
              <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                {mapLinks.find((m) => m.id === deletingMapLinkId)?.label}
              </span>
              ? This cannot be undone.
            </p>
            <div className="mt-5 flex justify-end gap-3">
              <button
                onClick={() => setDeletingMapLinkId(null)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMapLink(deletingMapLinkId)}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
