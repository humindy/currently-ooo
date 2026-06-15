// lib/types.ts

/**
 * A Trip is the top-level container for a vacation/journey.
 * Everything else (destinations, lodging, transport, activities)
 * belongs to a trip.
 */
export interface Trip {
    id: string;
    name: string;
    startDate: string; // ISO date string, e.g. "2026-08-01"
    endDate: string;   // ISO date string
    coverImage?: string; // optional URL or emoji/placeholder
    destinations: Destination[];
    lodging: Lodging[];
    transportation: Transportation[];
    activities: Activity[];
    createdAt: string; // ISO timestamp
    updatedAt: string; // ISO timestamp
  }
  
  /**
   * A Destination represents a city/place the user visits during the trip,
   * with its own date sub-range within the trip's overall dates.
   * e.g. Tokyo (Aug 1-4), Kyoto (Aug 5-7)
   */
  export interface Destination {
    id: string;
    tripId: string;
    name: string;        // e.g. "Tokyo, Japan"
    startDate: string;   // ISO date string
    endDate: string;     // ISO date string
    notes?: string;
  }
  
  /**
   * Lodging represents a place the user stays during the trip.
   */
  export interface Lodging {
    id: string;
    tripId: string;
    destinationId?: string; // optional link to a Destination
    name: string;            // e.g. "Park Hyatt Tokyo"
    address?: string;
    checkIn: string;   // ISO date string
    checkOut: string;  // ISO date string
    confirmationNumber?: string;
    cost?: number;
    notes?: string;
  }
  
  /**
   * Transportation covers any segment that moves the user between places:
   * flights, trains, car rentals, ferries, buses, transfers, etc.
   */
  export type TransportationType =
    | "flight"
    | "train"
    | "car-rental"
    | "ferry"
    | "bus"
    | "transfer"
    | "other";
  
  export interface Transportation {
    id: string;
    tripId: string;
    type: TransportationType;
    // For most types: departure -> arrival
    // For car rentals: pickup -> dropoff
    departureLocation: string;
    arrivalLocation: string;
    departureDateTime: string; // ISO datetime string
    arrivalDateTime: string;   // ISO datetime string
    confirmationNumber?: string;
    cost?: number;
    notes?: string; // e.g. "Seat 14A", "Rental car: Toyota Corolla"
  }
  
  /**
   * Activity covers anything the user plans to do at a specific time:
   * restaurant reservations, museum visits, tours, shows, outdoor activities,
   * shopping, free time/notes, etc.
   */
  export type ActivityType =
    | "restaurant"
    | "museum"
    | "tour"
    | "show"
    | "outdoor"
    | "shopping"
    | "free-time"
    | "other";
  
  export interface Activity {
    id: string;
    tripId: string;
    destinationId?: string; // optional link to a Destination
    type: ActivityType;
    title: string;          // e.g. "Dinner at Sukiyabashi Jiro"
    date: string;           // ISO date string (which day this falls on)
    startTime?: string;     // e.g. "19:00" (24hr format), optional for flexible items
    endTime?: string;
    location?: string;
    confirmationNumber?: string;
    cost?: number;
    notes?: string;
  }
  
  /**
   * Union type representing any item that can appear on the
   * day-by-day itinerary timeline. Useful for rendering a unified,
   * chronologically-sorted list combining lodging, transport, and activities.
   */
  export type ItineraryItem =
    | { kind: "lodging"; data: Lodging }
    | { kind: "transportation"; data: Transportation }
    | { kind: "activity"; data: Activity };