// lib/storage.ts

import {
    Trip,
    Destination,
    Lodging,
    Transportation,
    Activity,
    MapLink,
  } from "./types";
  
  const STORAGE_KEY = "currently-ooo:trips";
  
  /**
   * Internal helper: read the raw trips array from localStorage.
   * Returns an empty array if nothing has been saved yet,
   * or if running on the server (where localStorage doesn't exist).
   */
  function readTrips(): Trip[] {
    if (typeof window === "undefined") {
      // localStorage doesn't exist during server-side rendering
      return [];
    }
  
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return [];
    }
  
    try {
      return JSON.parse(raw) as Trip[];
    } catch {
      // If the saved data is somehow corrupted, fail safe
      console.error("Failed to parse trips from localStorage");
      return [];
    }
  }
  
  /**
   * Internal helper: write the full trips array back to localStorage.
   */
  function writeTrips(trips: Trip[]): void {
    if (typeof window === "undefined") {
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  }
  
  /**
   * Get all trips, sorted by start date (soonest first).
   */
  export function getTrips(): Trip[] {
    const trips = readTrips();
    return trips.sort((a, b) => a.startDate.localeCompare(b.startDate));
  }
  
  /**
   * Get a single trip by id. Returns undefined if not found.
   */
  export function getTrip(id: string): Trip | undefined {
    return readTrips().find((trip) => trip.id === id);
  }
  
  /**
   * Save a trip (create if new, update if it already exists).
   * Matches by `id`. Updates `updatedAt` automatically.
   */
  export function saveTrip(trip: Trip): void {
    const trips = readTrips();
    const index = trips.findIndex((t) => t.id === trip.id);
  
    const updatedTrip: Trip = {
      ...trip,
      updatedAt: new Date().toISOString(),
    };
  
    if (index === -1) {
      trips.push(updatedTrip);
    } else {
      trips[index] = updatedTrip;
    }
  
    writeTrips(trips);
  }
  
  /**
   * Delete a trip by id.
   */
  export function deleteTrip(id: string): void {
    const trips = readTrips().filter((trip) => trip.id !== id);
    writeTrips(trips);
  }
  
  /**
   * Create a new Trip object with sensible defaults.
   * Does NOT save it automatically — call saveTrip() afterwards.
   */
  export function createTrip(
    name: string,
    startDate: string,
    endDate: string
  ): Trip {
    const now = new Date().toISOString();
    return {
      id: crypto.randomUUID(),
      name,
      startDate,
      endDate,
      destinations: [],
      lodging: [],
      transportation: [],
      activities: [],
      mapLinks: [],
      createdAt: now,
      updatedAt: now,
    };
  }
  
  // ---------------------------------------------------------------------------
  // Helpers for adding/updating nested items (destinations, lodging, etc.)
  // These read the trip, modify the relevant array, and save it back.
  // ---------------------------------------------------------------------------
  
  export function addDestination(
    tripId: string,
    destination: Omit<Destination, "id" | "tripId">
  ): void {
    const trip = getTrip(tripId);
    if (!trip) return;
  
    const newDestination: Destination = {
      ...destination,
      id: crypto.randomUUID(),
      tripId,
    };
  
    trip.destinations.push(newDestination);
    saveTrip(trip);
  }
  
  export function addLodging(
    tripId: string,
    lodging: Omit<Lodging, "id" | "tripId">
  ): void {
    const trip = getTrip(tripId);
    if (!trip) return;
  
    const newLodging: Lodging = {
      ...lodging,
      id: crypto.randomUUID(),
      tripId,
    };
  
    trip.lodging.push(newLodging);
    saveTrip(trip);
  }
  
  export function addTransportation(
    tripId: string,
    transportation: Omit<Transportation, "id" | "tripId">
  ): void {
    const trip = getTrip(tripId);
    if (!trip) return;
  
    const newTransportation: Transportation = {
      ...transportation,
      id: crypto.randomUUID(),
      tripId,
    };
  
    trip.transportation.push(newTransportation);
    saveTrip(trip);
  }
  
  export function addActivity(
    tripId: string,
    activity: Omit<Activity, "id" | "tripId">
  ): void {
    const trip = getTrip(tripId);
    if (!trip) return;
  
    const newActivity: Activity = {
      ...activity,
      id: crypto.randomUUID(),
      tripId,
    };
  
    trip.activities.push(newActivity);
    saveTrip(trip);
  }

  export function addMapLink(
    tripId: string,
    mapLink: Omit<MapLink, "id">
  ): void {
    const trip = getTrip(tripId);
    if (!trip) return;

    const newMapLink: MapLink = {
      ...mapLink,
      id: crypto.randomUUID(),
    };

    trip.mapLinks = [...(trip.mapLinks ?? []), newMapLink];
    saveTrip(trip);
  }

  export function updateMapLink(tripId: string, mapLink: MapLink): void {
    const trip = getTrip(tripId);
    if (!trip) return;

    trip.mapLinks = (trip.mapLinks ?? []).map((m) =>
      m.id === mapLink.id ? mapLink : m
    );
    saveTrip(trip);
  }

  export function deleteMapLink(tripId: string, mapLinkId: string): void {
    const trip = getTrip(tripId);
    if (!trip) return;

    trip.mapLinks = (trip.mapLinks ?? []).filter((m) => m.id !== mapLinkId);
    saveTrip(trip);
  }