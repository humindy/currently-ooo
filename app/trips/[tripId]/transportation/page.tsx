"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Plus, X } from "lucide-react";
import { getTrip, addTransportation, saveTrip } from "@/lib/storage";
import type { Transportation, TransportationType, Trip } from "@/lib/types";
import TransportationCard from "@/components/trip/TransportationCard";

const TABS = [
  { label: "Itinerary", slug: null },
  { label: "Lodging", slug: "lodging" },
  { label: "Transport", slug: "transportation" },
  { label: "Activities", slug: "activities" },
  { label: "Budget", slug: "budget" },
] as const;

const TRANSPORT_TYPES: { value: TransportationType; label: string }[] = [
  { value: "flight", label: "Flight" },
  { value: "train", label: "Train" },
  { value: "car-rental", label: "Car Rental" },
  { value: "ferry", label: "Ferry" },
  { value: "bus", label: "Bus" },
];

interface FormState {
  type: TransportationType;
  departureLocation: string;
  arrivalLocation: string;
  departureDate: string;
  departureTime: string;
  arrivalDate: string;
  arrivalTime: string;
  confirmationNumber: string;
  cost: string;
  notes: string;
}

interface FormErrors {
  departureLocation?: string;
  arrivalLocation?: string;
  departureDate?: string;
  arrivalDate?: string;
}

const EMPTY_FORM: FormState = {
  type: "flight",
  departureLocation: "",
  arrivalLocation: "",
  departureDate: "",
  departureTime: "",
  arrivalDate: "",
  arrivalTime: "",
  confirmationNumber: "",
  cost: "",
  notes: "",
};

export default function TransportationPage() {
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

  function openEditModal(transportId: string) {
    const t = trip?.transportation.find((x) => x.id === transportId);
    if (!t) return;
    setForm({
      type: t.type,
      departureLocation: t.departureLocation,
      arrivalLocation: t.arrivalLocation,
      departureDate: t.departureDateTime.slice(0, 10),
      departureTime: t.departureDateTime.length >= 16 ? t.departureDateTime.slice(11, 16) : "",
      arrivalDate: t.arrivalDateTime.slice(0, 10),
      arrivalTime: t.arrivalDateTime.length >= 16 ? t.arrivalDateTime.slice(11, 16) : "",
      confirmationNumber: t.confirmationNumber ?? "",
      cost: t.cost?.toString() ?? "",
      notes: t.notes ?? "",
    });
    setErrors({});
    setEditingId(transportId);
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

  function toDateTime(date: string, time: string) {
    return date + "T" + (time || "00:00");
  }

  const isCarRental = form.type === "car-rental";

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!form.departureLocation.trim())
      errs.departureLocation = "Departure location is required.";
    if (!isCarRental && !form.arrivalLocation.trim())
      errs.arrivalLocation = "Arrival location is required.";
    if (!form.departureDate)
      errs.departureDate = "Departure date is required.";
    if (!isCarRental) {
      if (!form.arrivalDate) {
        errs.arrivalDate = "Arrival date is required.";
      } else if (
        form.departureDate &&
        toDateTime(form.arrivalDate, form.arrivalTime) <
          toDateTime(form.departureDate, form.departureTime)
      ) {
        errs.arrivalDate = "Arrival must be after departure.";
      }
    } else if (
      form.arrivalDate &&
      form.departureDate &&
      toDateTime(form.arrivalDate, form.arrivalTime) <=
        toDateTime(form.departureDate, form.departureTime)
    ) {
      errs.arrivalDate = "Drop-off must be after pick-up.";
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
    const data: Omit<Transportation, "id" | "tripId"> = {
      type: form.type,
      departureLocation: form.departureLocation.trim(),
      arrivalLocation: form.arrivalLocation.trim() || undefined,
      departureDateTime: toDateTime(form.departureDate, form.departureTime),
      arrivalDateTime: form.arrivalDate
        ? toDateTime(form.arrivalDate, form.arrivalTime)
        : undefined,
      confirmationNumber: form.confirmationNumber.trim() || undefined,
      cost: form.cost ? parseFloat(form.cost) : undefined,
      notes: form.notes.trim() || undefined,
    };
    if (editingId && trip) {
      saveTrip({
        ...trip,
        transportation: trip.transportation.map((t) =>
          t.id === editingId ? { ...t, ...data } : t
        ),
      });
    } else {
      addTransportation(tripId, data);
    }
    reload();
    setSubmitting(false);
    closeModal();
  }

  function handleDelete(transportId: string) {
    if (!trip) return;
    saveTrip({
      ...trip,
      transportation: trip.transportation.filter((t) => t.id !== transportId),
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
        <Link
          href="/"
          className="text-sm font-bold text-teal-700 hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>
    );
  }

  const totalCost = trip.transportation.reduce(
    (s, t) => s + (t.cost ?? 0),
    0
  );

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
              const isActive = slug === "transportation";
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
            Transport
          </h1>
          <span className="text-xs text-zinc-400">
            {trip.transportation.length}{" "}
            {trip.transportation.length === 1 ? "leg" : "legs"}
            {totalCost > 0 && ` · $${totalCost.toLocaleString()}`}
          </span>
          <div className="flex-1" />
          <button
            onClick={openModal}
            className="flex items-center gap-1.5 rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800"
          >
            <Plus size={13} />
            Add Transportation
          </button>
        </div>

        {/* List */}
        {trip.transportation.length === 0 ? (
          <div className="rounded-xl border border-dashed border-zinc-300 px-5 py-12 text-center text-sm text-zinc-400 dark:border-zinc-700">
            No transportation added yet.
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {trip.transportation.map((t) => (
              <TransportationCard
                key={t.id}
                transportation={t}
                onDelete={() => handleDelete(t.id)}
                onEdit={() => openEditModal(t.id)}
              />
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
                {editingId ? "Edit transportation" : "Add transportation"}
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
                  onChange={(e) => {
                    setField("type", e.target.value as TransportationType);
                    setErrors({});
                  }}
                  className={`${inputNormal} cursor-pointer`}
                >
                  {TRANSPORT_TYPES.map(({ value, label }) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Departure / Arrival locations */}
              <div className="mb-4 flex gap-3">
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    From
                  </label>
                  <input
                    type="text"
                    value={form.departureLocation}
                    onChange={(e) => {
                      setField("departureLocation", e.target.value);
                      clearError("departureLocation");
                    }}
                    placeholder="e.g. Tokyo Narita"
                    className={
                      errors.departureLocation ? inputError : inputNormal
                    }
                  />
                  {errors.departureLocation && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.departureLocation}
                    </p>
                  )}
                </div>
                <div className="flex-1">
                  <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    {isCarRental ? (
                      <>Drop-off <span className="font-normal text-zinc-400">· optional</span></>
                    ) : "To"}
                  </label>
                  <input
                    type="text"
                    value={form.arrivalLocation}
                    onChange={(e) => {
                      setField("arrivalLocation", e.target.value);
                      clearError("arrivalLocation");
                    }}
                    placeholder={isCarRental ? "e.g. Rome Airport" : "e.g. Osaka Kansai"}
                    className={errors.arrivalLocation ? inputError : inputNormal}
                  />
                  {errors.arrivalLocation && (
                    <p className="mt-1 text-xs text-red-500">
                      {errors.arrivalLocation}
                    </p>
                  )}
                </div>
              </div>

              {/* Departure date + time */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  Departure
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={form.departureDate}
                    onChange={(e) => {
                      setField("departureDate", e.target.value);
                      clearError("departureDate");
                      clearError("arrivalDate");
                    }}
                    className={`flex-1 ${errors.departureDate ? inputError : inputNormal}`}
                  />
                  <input
                    type="time"
                    value={form.departureTime}
                    onChange={(e) => {
                      setField("departureTime", e.target.value);
                      clearError("arrivalDate");
                    }}
                    className={`w-28 ${inputNormal}`}
                  />
                </div>
                {errors.departureDate && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.departureDate}
                  </p>
                )}
              </div>

              {/* Arrival date + time */}
              <div className="mb-4">
                <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                  {isCarRental ? (
                    <>Drop-off date <span className="font-normal text-zinc-400">· optional</span></>
                  ) : "Arrival"}
                </label>
                <div className="flex gap-2">
                  <input
                    type="date"
                    value={form.arrivalDate}
                    min={form.departureDate || undefined}
                    onChange={(e) => {
                      setField("arrivalDate", e.target.value);
                      clearError("arrivalDate");
                    }}
                    className={`flex-1 ${errors.arrivalDate ? inputError : inputNormal}`}
                  />
                  <input
                    type="time"
                    value={form.arrivalTime}
                    onChange={(e) => setField("arrivalTime", e.target.value)}
                    className={`w-28 ${inputNormal}`}
                  />
                </div>
                {errors.arrivalDate && (
                  <p className="mt-1 text-xs text-red-500">
                    {errors.arrivalDate}
                  </p>
                )}
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
                    placeholder="e.g. JL123"
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
                  placeholder="e.g. Seat 14A, window side"
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
                      : "Save transportation"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
