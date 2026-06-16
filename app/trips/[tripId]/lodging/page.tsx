"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { getTrip, addLodging, saveTrip } from "@/lib/storage";
import type { Trip } from "@/lib/types";
import LodgingCard from "@/components/trip/LodgingCard";

const TABS = [
  { label: "Overview", slug: null },
  { label: "Day-by-Day", slug: "itinerary" },
  { label: "Lodging", slug: "lodging" },
  { label: "Transport", slug: "transportation" },
  { label: "Activities", slug: "activities" },
  { label: "Budget", slug: "budget" },
] as const;

interface FormState {
  name: string;
  address: string;
  checkIn: string;
  checkOut: string;
  confirmationNumber: string;
  cost: string;
  notes: string;
}

interface FormErrors {
  name?: string;
  checkIn?: string;
  checkOut?: string;
}

const EMPTY_FORM: FormState = {
  name: "",
  address: "",
  checkIn: "",
  checkOut: "",
  confirmationNumber: "",
  cost: "",
  notes: "",
};

export default function LodgingPage() {
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

  function openEditModal(lodgingId: string) {
    const l = trip?.lodging.find((x) => x.id === lodgingId);
    if (!l) return;
    setForm({
      name: l.name,
      address: l.address ?? "",
      checkIn: l.checkIn,
      checkOut: l.checkOut,
      confirmationNumber: l.confirmationNumber ?? "",
      cost: l.cost?.toString() ?? "",
      notes: l.notes ?? "",
    });
    setErrors({});
    setEditingId(lodgingId);
    setShowModal(true);
  }

  function closeModal() {
    setShowModal(false);
    setEditingId(null);
  }

  function setField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function clearError(field: keyof FormErrors) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.name.trim()) errs.name = "Name is required.";
    if (!form.checkIn) errs.checkIn = "Check-in date is required.";
    if (!form.checkOut) {
      errs.checkOut = "Check-out date is required.";
    } else if (form.checkIn && form.checkOut <= form.checkIn) {
      errs.checkOut = "Check-out must be after check-in.";
    }
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
    const data = {
      name: form.name.trim(),
      address: form.address.trim() || undefined,
      checkIn: form.checkIn,
      checkOut: form.checkOut,
      confirmationNumber: form.confirmationNumber.trim() || undefined,
      cost: form.cost ? parseFloat(form.cost) : undefined,
      notes: form.notes.trim() || undefined,
    };
    if (editingId && trip) {
      saveTrip({
        ...trip,
        lodging: trip.lodging.map((l) =>
          l.id === editingId ? { ...l, ...data } : l
        ),
      });
    } else {
      addLodging(tripId, data);
    }
    reload();
    setSubmitting(false);
    closeModal();
  }

  function handleDelete(lodgingId: string) {
    if (!trip) return;
    const updated = {
      ...trip,
      lodging: trip.lodging.filter((l) => l.id !== lodgingId),
    };
    saveTrip(updated);
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

  const totalNights = trip.lodging.reduce((sum, l) => {
    const a = new Date(l.checkIn + "T00:00:00").getTime();
    const b = new Date(l.checkOut + "T00:00:00").getTime();
    return sum + Math.max(0, Math.round((b - a) / 86_400_000));
  }, 0);

  const inputBase =
    "h-9 w-full rounded-lg border px-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-zinc-800 dark:text-zinc-100";
  const inputNormal = `${inputBase} border-zinc-300 dark:border-zinc-700`;
  const inputError = `${inputBase} border-red-400`;

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      {/* Tab nav — trip name doubles as back link to overview */}
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
              const isActive = slug === "lodging";
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

      {/* Page body */}
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-8">
        {/* Section header */}
        <div className="mb-4 flex items-center gap-3">
          <h1 className="text-base font-extrabold text-zinc-900 dark:text-zinc-50">
            Lodging
          </h1>
          <span className="text-xs text-zinc-400">
            {trip.lodging.length}{" "}
            {trip.lodging.length === 1 ? "stay" : "stays"} · {totalNights}{" "}
            {totalNights === 1 ? "night" : "nights"}
          </span>
          <div className="flex-1" />
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800"
          >
            <Plus size={13} />
            Add Lodging
          </button>
        </div>

        {/* List */}
        {trip.lodging.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 px-5 py-12 text-center text-sm text-zinc-400 dark:border-zinc-700">
            No lodging added yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {trip.lodging.map((l) => (
              <LodgingCard
                key={l.id}
                lodging={l}
                onDelete={() => handleDelete(l.id)}
                onEdit={() => openEditModal(l.id)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Add Lodging modal */}
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
                {editingId ? "Edit lodging" : "Add lodging"}
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
              {/* Name */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => {
                    setField("name", e.target.value);
                    clearError("name");
                  }}
                  placeholder="e.g. Park Hotel Tokyo"
                  className={errors.name ? inputError : inputNormal}
                />
                {errors.name && (
                  <p className="mt-1 text-xs text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Address */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  Address{" "}
                  <span className="font-normal text-zinc-400">· optional</span>
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setField("address", e.target.value)}
                  placeholder="e.g. Shiodome, Minato, Tokyo"
                  className={inputNormal}
                />
              </div>

              {/* Check-in / Check-out */}
              <div className="mb-4 flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    Check-in
                  </label>
                  <input
                    type="date"
                    value={form.checkIn}
                    onChange={(e) => {
                      setField("checkIn", e.target.value);
                      clearError("checkIn");
                      clearError("checkOut");
                    }}
                    className={errors.checkIn ? inputError : inputNormal}
                  />
                  {errors.checkIn && (
                    <p className="mt-1 text-xs text-red-500">{errors.checkIn}</p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    Check-out
                  </label>
                  <input
                    type="date"
                    value={form.checkOut}
                    min={form.checkIn || undefined}
                    onChange={(e) => {
                      setField("checkOut", e.target.value);
                      clearError("checkOut");
                    }}
                    className={errors.checkOut ? inputError : inputNormal}
                  />
                  {errors.checkOut && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.checkOut}
                    </p>
                  )}
                </div>
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
                    onChange={(e) =>
                      setField("confirmationNumber", e.target.value)
                    }
                    placeholder="e.g. PHT-4471"
                    className={`${inputNormal} font-mono`}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    Cost per night{" "}
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
                  placeholder="e.g. Early check-in requested…"
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
                  {submitting ? "Saving…" : editingId ? "Save changes" : "Save lodging"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
