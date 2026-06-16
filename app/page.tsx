"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getTrips } from "@/lib/storage";
import { Trip } from "@/lib/types";
import TripCard from "@/components/trip/TripCard";

export default function Home() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Initial load from localStorage — must happen client-side, after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTrips(getTrips());
    setLoaded(true);
  }, []);

  if (!loaded) {
    return null;
  }

  return (
    <div className="flex flex-1 flex-col bg-zinc-50 dark:bg-black">
      <header className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800 sm:px-8">
        <span className="text-sm font-extrabold tracking-tight">Currently Out Of Office</span>
        <div className="flex-1" />
        <Link
          href="/trips/new"
          className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-bold text-white hover:bg-teal-800"
        >
          + New Trip
        </Link>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8">
        {trips.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 py-24 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-teal-700 text-3xl font-light text-teal-700">
              +
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                No trips yet
              </h1>
              <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                Start planning your next adventure.
              </p>
            </div>
            <Link
              href="/trips/new"
              className="rounded-lg bg-teal-700 px-4 py-2 text-sm font-bold text-white hover:bg-teal-800"
            >
              Create New Trip
            </Link>
          </div>
        ) : (
          <>
            <div className="mb-4 flex items-center gap-3">
              <h1 className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
                Your Trips
              </h1>
              <span className="text-xs text-zinc-400">
                {trips.length} {trips.length === 1 ? "trip" : "trips"}
              </span>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <Link
                href="/trips/new"
                className="flex min-h-[208px] flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-zinc-300 text-teal-700 hover:border-teal-700 hover:bg-teal-50 dark:border-zinc-700 dark:hover:bg-teal-950/20"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full border-2 border-teal-700 text-2xl font-light">
                  +
                </div>
                <span className="text-sm font-bold">Create New Trip</span>
              </Link>

              {trips.map((trip) => (
                <TripCard
                  key={trip.id}
                  trip={trip}
                  onDelete={() => setTrips(getTrips())}
                />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
