import Link from "next/link";
import { Trip } from "@/lib/types";

function formatDateRange(startDate: string, endDate: string): string {
  // Parse as UTC so the date isn't shifted by the local timezone.
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

export default function TripCard({ trip }: { trip: Trip }) {
  const destinationCount = trip.destinations.length;

  return (
    <Link
      href={`/trips/${trip.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white transition-shadow hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div className="flex h-24 items-end bg-[repeating-linear-gradient(45deg,theme(colors.zinc.100),theme(colors.zinc.100)_6px,theme(colors.zinc.200)_6px,theme(colors.zinc.200)_12px)] p-2 dark:bg-[repeating-linear-gradient(45deg,theme(colors.zinc.800),theme(colors.zinc.800)_6px,theme(colors.zinc.700)_6px,theme(colors.zinc.700)_12px)]">
        {trip.coverImage && (
          <span className="font-mono text-[9px] uppercase tracking-wide text-zinc-500">
            {trip.coverImage}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="font-semibold text-sm text-zinc-900 dark:text-zinc-50">
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
  );
}
