"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createTrip, saveTrip } from "@/lib/storage";

interface FormErrors {
  name?: string;
  startDate?: string;
  endDate?: string;
}

export default function NewTripPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  function validate(): FormErrors {
    const errs: FormErrors = {};
    if (!name.trim()) errs.name = "Trip name is required.";
    if (!startDate) errs.startDate = "Start date is required.";
    if (!endDate) errs.endDate = "End date is required.";
    else if (startDate && endDate <= startDate)
      errs.endDate = "End date must be after start date.";
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
    const trip = createTrip(name.trim(), startDate, endDate);
    saveTrip(trip);
    router.push(`/trips/${trip.id}`);
  }

  function clearError(field: keyof FormErrors) {
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-8">
        <Link
          href="/"
          className="flex items-center gap-1.5 text-sm font-extrabold tracking-tight text-zinc-900 hover:text-zinc-600 dark:text-zinc-50 dark:hover:text-zinc-400"
        >
          Currently Out Of Office
        </Link>
      </header>

      <main className="flex flex-1 items-start justify-center px-4 py-12 sm:items-center">
        <div className="w-full max-w-[440px] rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-900 sm:p-8">
          <div className="mb-6 flex items-center justify-between">
            <h1 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
              Create a new trip
            </h1>
            <Link
              href="/"
              aria-label="Cancel"
              className="text-lg text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
            >
              ✕
            </Link>
          </div>

          <form onSubmit={handleSubmit} noValidate>
            {/* Trip name */}
            <div className="mb-5">
              <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                Trip name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError("name");
                }}
                placeholder="e.g. Japan Spring 2026"
                className={`h-10 w-full rounded-lg border px-3 text-sm text-zinc-800 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-teal-600 dark:bg-zinc-800 dark:text-zinc-100 dark:placeholder:text-zinc-500 ${
                  errors.name
                    ? "border-red-400 bg-red-50 dark:bg-red-950/20"
                    : "border-zinc-300 dark:border-zinc-700"
                }`}
              />
              {errors.name && (
                <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>
              )}
            </div>

            {/* Date range */}
            <div className="mb-7">
              <label className="mb-1.5 block text-xs font-bold text-zinc-600 dark:text-zinc-400">
                Dates
              </label>
              <div
                className={`rounded-xl border p-3 dark:border-zinc-700 ${
                  errors.startDate || errors.endDate
                    ? "border-red-400 dark:border-red-700"
                    : "border-zinc-300"
                }`}
              >
                <div className="flex gap-3">
                  <div className="flex-1">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      Start
                    </div>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value);
                        clearError("startDate");
                        clearError("endDate");
                      }}
                      className="w-full border-0 bg-transparent p-0 text-sm text-zinc-800 focus:outline-none dark:text-zinc-100"
                    />
                  </div>
                  <div className="w-px bg-zinc-200 dark:bg-zinc-700" />
                  <div className="flex-1">
                    <div className="mb-1 text-[10px] font-bold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                      End
                    </div>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => {
                        setEndDate(e.target.value);
                        clearError("endDate");
                      }}
                      className="w-full border-0 bg-transparent p-0 text-sm text-zinc-800 focus:outline-none dark:text-zinc-100"
                    />
                  </div>
                </div>
              </div>
              {(errors.startDate || errors.endDate) && (
                <p className="mt-1.5 text-xs text-red-500">
                  {errors.startDate ?? errors.endDate}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3">
              <Link
                href="/"
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-bold text-zinc-600 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancel
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="rounded-lg bg-teal-700 px-5 py-2 text-sm font-bold text-white hover:bg-teal-800 disabled:opacity-60"
              >
                {submitting ? "Creating…" : "Create trip"}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
