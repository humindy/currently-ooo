import type { Trip } from "@/lib/types";
import type { ItineraryDayItem } from "@/components/itinerary/ItineraryDayColumn";

/** Returns an ISO date string for each day between startDate and endDate inclusive. */
export function generateDates(startDate: string, endDate: string): string[] {
  const dates: string[] = [];
  const d = new Date(startDate + "T00:00:00");
  const end = new Date(endDate + "T00:00:00");
  while (d <= end) {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    dates.push(`${y}-${mo}-${day}`);
    d.setDate(d.getDate() + 1);
  }
  return dates;
}

/** Collects and sorts all ItineraryDayItems that fall on a given date. */
export function buildDayItems(trip: Trip, date: string): ItineraryDayItem[] {
  const items: ItineraryDayItem[] = [];

  for (const l of trip.lodging) {
    if (l.checkIn === date && l.checkOut === date) {
      // 0-night stay: treat as check-in only
      items.push({ kind: "lodging", event: "checkin", data: l, sortKey: "15:00" });
    } else if (l.checkOut === date) {
      items.push({ kind: "lodging", event: "checkout", data: l, sortKey: "11:00" });
    } else if (l.checkIn === date) {
      items.push({ kind: "lodging", event: "checkin", data: l, sortKey: "15:00" });
    }
  }

  for (const t of trip.transportation) {
    if (t.departureDateTime.slice(0, 10) === date) {
      const timePart = t.departureDateTime.length >= 16
        ? t.departureDateTime.slice(11, 16)
        : "00:00";
      items.push({ kind: "transportation", data: t, sortKey: timePart });
    }
  }

  for (const a of trip.activities) {
    if (a.date === date) {
      items.push({ kind: "activity", data: a, sortKey: a.startTime ?? "12:00" });
    }
  }

  return items.sort((a, b) => a.sortKey.localeCompare(b.sortKey));
}
