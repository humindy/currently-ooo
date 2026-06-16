"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { getTrip, addActivity, saveTrip } from "@/lib/storage";
import type { Activity, ActivityType, Trip } from "@/lib/types";
import ActivityCard from "@/components/trip/ActivityCard";

const TABS = [
  { label: "Overview", slug: null },
  { label: "Day-by-Day", slug: "itinerary" },
  { label: "Lodging", slug: "lodging" },
  { label: "Transport", slug: "transportation" },
  { label: "Activities", slug: "activities" },
  { label: "Budget", slug: "budget" },
] as const;

const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: "restaurant", label: "Restaurant" },
  { value: "museum", label: "Museum" },
  { value: "tour", label: "Tour" },
  { value: "show", label: "Show" },
  { value: "outdoor", label: "Outdoor" },
  { value: "shopping", label: "Shopping" },
  { value: "free-time", label: "Free Time" },
  { value: "other", label: "Other" },
];

interface FormState {
  type: ActivityType;
  title: string;
  date: string;
  startTime: string;
  endTime: string;
  location: string;
  confirmationNumber: string;
  cost: string;
  notes: string;
}

interface FormErrors {
  title?: string;
  date?: string;
}

const EMPTY_FORM: FormState = {
  type: "restaurant",
  title: "",
  date: "",
  startTime: "",
  endTime: "",
  location: "",
  confirmationNumber: "",
  cost: "",
  notes: "",
};

function fmtGroupDate(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export default function ActivitiesPage() {
  const { tripId } = useParams<{ tripId: string }>();
  const [trip, setTrip] = useState<Trip | null | undefined>(undefined);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function reload() {
    setTrip(getTrip(tripId) ?? null);
  }

  useEffect(() => {
    reload();
  }, [tripId]);

  function openModal() {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditingId(null);
    setShowModal(true);
  }

  function openEditModal(activityId: string) {
    const a = trip?.activities.find((x) => x.id === activityId);
    if (!a) return;
    setForm({
      type: a.type,
      title: a.title,
      date: a.date,
      startTime: a.startTime ?? "",
      endTime: a.endTime ?? "",
      location: a.location ?? "",
      confirmationNumber: a.confirmationNumber ?? "",
      cost: a.cost?.toString() ?? "",
      notes: a.notes ?? "",
    });
    setErrors({});
    setEditingId(activityId);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
  }

  function setField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function clearError(field: keyof FormErrors) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.title.trim()) errs.title = "Title is required.";
    if (!form.date) errs.date = "Date is required.";
    return errs;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSubmitting(true);
    const data: Omit<Activity, "id" | "tripId"> = {
      type: form.type,
      title: form.title.trim(),
      date: form.date,
      startTime: form.startTime || undefined,
      endTime: form.endTime || undefined,
      location: form.location.trim() || undefined,
      confirmationNumber: form.confirmationNumber.trim() || undefined,
      cost: form.cost ? parseFloat(form.cost) : undefined,
      notes: form.notes.trim() || undefined,
    };
    if (editingId && trip) {
      saveTrip({
        ...trip,
        activities: trip.activities.map((a) =>
          a.id === editingId ? { ...a, ...data } : a
        ),
      });
    } else {
      addActivity(tripId, data);
    }
    reload();
    setSubmitting(false);
    closeModal();
  }

  function handleDelete(activityId: string) {
    if (!trip) return;
    saveTrip({
      ...trip,
      activities: trip.activities.filter((a) => a.id !== activityId),
    });
    reload();
  }

  if (trip === undefined) return null;

  if (trip === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-zinc-50 px-4 dark:bg-black">
        <p className="text-base font-bold text-zinc-800 dark:text-zinc-100">
          Trip not found
        </p>
        <Link href="/" className="text-sm font-bold text-teal-700 hover:underline">
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const totalCost = trip.activities.reduce((s, a) => s + (a.cost ?? 0), 0);

  // Sort activities by date then startTime, then group by date.
  const sortedActivities = [...trip.activities].sort((a, b) => {
    if (a.date !== b.date) return a.date.localeCompare(b.date);
    return (a.startTime ?? "99:99").localeCompare(b.startTime ?? "99:99");
  });

  const grouped: { date: string; activities: Activity[] }[] = [];
  for (const activity of sortedActivities) {
    const last = grouped[grouped.length - 1];
    if (last && last.date === activity.date) {
      last.activities.push(activity);
    } else {
      grouped.push({ date: activity.date, activities: [activity] });
    }
  }

  const inputBase =
    "h-9 w-full rounded-lg border px-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-zinc-800 dark:text-zinc-100";
  const inputNormal = `${inputBase} border-zinc-300 dark:border-zinc-700`;
  const inputError = `${inputBase} border-red-400`;

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
              const isActive = slug === "activities";
              const href = slug ? `/trips/${tripId}/${slug}` : `/trips/${tripId}`;
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

      {/* Page body */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8">
        {/* Section header */}
        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
            Activities
          </h1>
          <span className="text-xs text-zinc-400">
            {trip.activities.length}{" "}
            {trip.activities.length === 1 ? "activity" : "activities"}
            {totalCost > 0 && ` · $${totalCost.toLocaleString()}`}
          </span>
          <div className="flex-1" />
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800"
          >
            <Plus size={13} />
            Add Activity
          </button>
        </div>

        {/* List — grouped by date */}
        {trip.activities.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 px-5 py-12 text-center text-sm text-zinc-400 dark:border-zinc-700">
            No activities added yet.
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {grouped.map(({ date, activities }) => (
              <div key={date}>
                <h2 className="mb-2 text-xs font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                  {fmtGroupDate(date)}
                </h2>
                <div className="flex flex-col gap-3">
                  {activities.map((a) => (
                    <ActivityCard
                      key={a.id}
                      activity={a}
                      onDelete={() => handleDelete(a.id)}
                      onEdit={() => openEditModal(a.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add / Edit modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/40 p-4 sm:items-center"
          onClick={closeModal}
        >
          <div
            className="my-4 w-full max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-2xl dark:border-zinc-800 dark:bg-zinc-900 sm:my-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
                {editingId ? "Edit activity" : "Add activity"}
              </h2>
              <button
                onClick={closeModal}
                aria-label="Close"
                className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* Type */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  Type
                </label>
                <select
                  value={form.type}
                  onChange={(e) => setField("type", e.target.value as ActivityType)}
                  className={`${inputNormal} cursor-pointer`}
                >
                  {ACTIVITY_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  Title
                </label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => {
                    setField("title", e.target.value);
                    clearError("title");
                  }}
                  placeholder="e.g. Dinner at Sukiyabashi Jiro"
                  className={errors.title ? inputError : inputNormal}
                />
                {errors.title && (
                  <p className="mt-1 text-xs text-red-500">{errors.title}</p>
                )}
              </div>

              {/* Date */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  Date
                </label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => {
                    setField("date", e.target.value);
                    clearError("date");
                  }}
                  className={errors.date ? inputError : inputNormal}
                />
                {errors.date && (
                  <p className="mt-1 text-xs text-red-500">{errors.date}</p>
                )}
              </div>

              {/* Start time / End time */}
              <div className="mb-4 flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    Start time{" "}
                    <span className="font-normal text-zinc-400">· optional</span>
                  </label>
                  <input
                    type="time"
                    value={form.startTime}
                    onChange={(e) => setField("startTime", e.target.value)}
                    className={inputNormal}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    End time{" "}
                    <span className="font-normal text-zinc-400">· optional</span>
                  </label>
                  <input
                    type="time"
                    value={form.endTime}
                    onChange={(e) => setField("endTime", e.target.value)}
                    className={inputNormal}
                  />
                </div>
              </div>

              {/* Location */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  Location{" "}
                  <span className="font-normal text-zinc-400">· optional</span>
                </label>
                <input
                  type="text"
                  value={form.location}
                  onChange={(e) => setField("location", e.target.value)}
                  placeholder="e.g. Ginza, Tokyo"
                  className={inputNormal}
                />
              </div>

              {/* Confirmation # / Cost */}
              <div className="mb-4 flex gap-3">
                <div className="flex-[1.4]">
                  <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    Confirmation #{" "}
                    <span className="font-normal text-zinc-400">· optional</span>
                  </label>
                  <input
                    type="text"
                    value={form.confirmationNumber}
                    onChange={(e) => setField("confirmationNumber", e.target.value)}
                    placeholder="e.g. SJ-9901"
                    className={`${inputNormal} font-mono`}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    Cost{" "}
                    <span className="font-normal text-zinc-400">· optional</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.cost}
                    onChange={(e) => setField("cost", e.target.value)}
                    placeholder="0"
                    className={inputNormal}
                  />
                </div>
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  Notes{" "}
                  <span className="font-normal text-zinc-400">· optional</span>
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setField("notes", e.target.value)}
                  placeholder="e.g. Omakase counter, bring cash"
                  rows={3}
                  className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60"
                >
                  {submitting
                    ? "Saving…"
                    : editingId
                      ? "Save changes"
                      : "Save activity"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
