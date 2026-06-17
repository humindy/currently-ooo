import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import TripPage from "@/app/trips/[tripId]/page";
import { generateDates, buildDayItems } from "@/lib/itinerary";
import { saveTrip } from "@/lib/storage";
import type { Activity, Lodging, Transportation, Trip } from "@/lib/types";

vi.mock("next/link", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("next/navigation", () => ({
  useParams: () => ({ tripId: "test-trip-id" }),
}));

// 3-day trip: Apr 4, 5, 6
const TEST_TRIP: Trip = {
  id: "test-trip-id",
  name: "Japan Spring 2026",
  startDate: "2026-04-04",
  endDate: "2026-04-06",
  destinations: [],
  lodging: [],
  transportation: [],
  activities: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const LODGING: Lodging = {
  id: "l-1",
  tripId: "test-trip-id",
  name: "Park Hotel Tokyo",
  address: "Shiodome, Tokyo",
  checkIn: "2026-04-04",
  checkOut: "2026-04-06", // 2 nights
  cost: 200, // per night → $400 total
};

const TRANSPORT: Transportation = {
  id: "t-1",
  tripId: "test-trip-id",
  type: "flight",
  departureLocation: "Tokyo Narita",
  arrivalLocation: "Osaka Kansai",
  departureDateTime: "2026-04-05T10:00",
  confirmationNumber: "JL123",
  cost: 280,
};

const ACTIVITY: Activity = {
  id: "a-1",
  tripId: "test-trip-id",
  type: "restaurant",
  title: "Sukiyabashi Jiro",
  date: "2026-04-06",
  startTime: "19:00",
  location: "Ginza, Tokyo",
  cost: 450,
};

beforeEach(() => {
  localStorage.clear();
  saveTrip(TEST_TRIP);
});

// ── Pure function tests ───────────────────────────────────────────────────────

describe("generateDates", () => {
  it("returns the correct dates for a single-day trip", () => {
    expect(generateDates("2026-04-04", "2026-04-04")).toEqual(["2026-04-04"]);
  });

  it("returns all days inclusive for a 3-day trip", () => {
    expect(generateDates("2026-04-04", "2026-04-06")).toEqual([
      "2026-04-04",
      "2026-04-05",
      "2026-04-06",
    ]);
  });

  it("handles month boundaries correctly", () => {
    const dates = generateDates("2026-03-30", "2026-04-02");
    expect(dates).toEqual([
      "2026-03-30",
      "2026-03-31",
      "2026-04-01",
      "2026-04-02",
    ]);
  });
});

describe("buildDayItems — placement", () => {
  it("places lodging check-in on the check-in date", () => {
    const items = buildDayItems({ ...TEST_TRIP, lodging: [LODGING] }, "2026-04-04");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: "lodging", event: "checkin" });
  });

  it("places lodging check-out on the check-out date", () => {
    const items = buildDayItems({ ...TEST_TRIP, lodging: [LODGING] }, "2026-04-06");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: "lodging", event: "checkout" });
  });

  it("does not include lodging on a stay-through day", () => {
    const items = buildDayItems({ ...TEST_TRIP, lodging: [LODGING] }, "2026-04-05");
    expect(items).toHaveLength(0);
  });

  it("places transportation on its departure date", () => {
    const items = buildDayItems(
      { ...TEST_TRIP, transportation: [TRANSPORT] },
      "2026-04-05"
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: "transportation" });
    expect((items[0] as { data: Transportation }).data.departureLocation).toBe(
      "Tokyo Narita"
    );
  });

  it("does not include transportation on a non-departure date", () => {
    const items = buildDayItems(
      { ...TEST_TRIP, transportation: [TRANSPORT] },
      "2026-04-04"
    );
    expect(items).toHaveLength(0);
  });

  it("places an activity on its activity date", () => {
    const items = buildDayItems(
      { ...TEST_TRIP, activities: [ACTIVITY] },
      "2026-04-06"
    );
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: "activity" });
    expect((items[0] as { data: Activity }).data.title).toBe("Sukiyabashi Jiro");
  });

  it("returns an empty array for a day with no items", () => {
    expect(buildDayItems(TEST_TRIP, "2026-04-05")).toHaveLength(0);
  });
});

describe("buildDayItems — chronological sorting", () => {
  it("sorts items by time within a day", () => {
    const earlyFlight: Transportation = {
      ...TRANSPORT,
      departureDateTime: "2026-04-04T08:00",
    };
    const eveningDinner: Activity = {
      id: "a-2", tripId: "test-trip-id", type: "restaurant",
      title: "Dinner", date: "2026-04-04", startTime: "19:00",
    };
    const items = buildDayItems(
      { ...TEST_TRIP, transportation: [earlyFlight], activities: [eveningDinner] },
      "2026-04-04"
    );
    expect(items[0].kind).toBe("transportation");
    expect(items[1].kind).toBe("activity");
  });

  it("places lodging check-out (11:00) before check-in (15:00) on the same day", () => {
    const sameDay: Lodging = { ...LODGING, checkIn: "2026-04-05", checkOut: "2026-04-05" };
    // A 0-night stay results in only a checkin event per implementation.
    const items = buildDayItems({ ...TEST_TRIP, lodging: [sameDay] }, "2026-04-05");
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({ kind: "lodging", event: "checkin" });
  });

  it("sorts activity with no startTime after one that has a time", () => {
    const withTime: Activity = {
      id: "a-1", tripId: "test-trip-id", type: "museum",
      title: "Museum Visit", date: "2026-04-04", startTime: "09:00",
    };
    const withoutTime: Activity = {
      id: "a-2", tripId: "test-trip-id", type: "restaurant",
      title: "Late Lunch", date: "2026-04-04",
    };
    const items = buildDayItems(
      { ...TEST_TRIP, activities: [withoutTime, withTime] },
      "2026-04-04"
    );
    // withTime sorts to "09:00", withoutTime defaults to "12:00"
    expect((items[0] as { data: Activity }).data.title).toBe("Museum Visit");
    expect((items[1] as { data: Activity }).data.title).toBe("Late Lunch");
  });
});

// ── Page rendering tests ──────────────────────────────────────────────────────

describe("TripPage — day headers", () => {
  it("renders one day section per trip day", async () => {
    render(<TripPage />);
    await waitFor(() =>
      expect(screen.getByText("Day 1")).toBeInTheDocument()
    );
    expect(screen.getByText("Day 2")).toBeInTheDocument();
    expect(screen.getByText("Day 3")).toBeInTheDocument();
  });
});

describe("TripPage — item rendering", () => {
  it("shows lodging check-in on the check-in day", async () => {
    saveTrip({ ...TEST_TRIP, lodging: [LODGING] });
    render(<TripPage />);
    await waitFor(() =>
      expect(screen.getByText(/Check in — Park Hotel Tokyo/)).toBeInTheDocument()
    );
  });

  it("shows lodging check-out on the check-out day", async () => {
    saveTrip({ ...TEST_TRIP, lodging: [LODGING] });
    render(<TripPage />);
    await waitFor(() =>
      expect(screen.getByText(/Check out — Park Hotel Tokyo/)).toBeInTheDocument()
    );
  });

  it("shows transportation on its departure date", async () => {
    saveTrip({ ...TEST_TRIP, transportation: [TRANSPORT] });
    render(<TripPage />);
    await waitFor(() =>
      expect(
        screen.getByText(/Tokyo Narita → Osaka Kansai/)
      ).toBeInTheDocument()
    );
  });

  it("shows activity on its activity date", async () => {
    saveTrip({ ...TEST_TRIP, activities: [ACTIVITY] });
    render(<TripPage />);
    await waitFor(() =>
      expect(screen.getByText("Sukiyabashi Jiro")).toBeInTheDocument()
    );
  });

  it("shows 'Nothing planned yet' for days with no items", async () => {
    render(<TripPage />);
    await waitFor(() => {
      const placeholders = screen.getAllByText("Nothing planned yet");
      // TEST_TRIP has no items → all 3 days show the placeholder
      expect(placeholders).toHaveLength(3);
    });
  });
});

describe("TripPage — chronological ordering in DOM", () => {
  it("renders earlier items before later ones within a day", async () => {
    const earlyFlight: Transportation = {
      ...TRANSPORT,
      departureDateTime: "2026-04-04T08:00",
    };
    const eveningActivity: Activity = {
      id: "a-2", tripId: "test-trip-id", type: "restaurant",
      title: "Dinner Time", date: "2026-04-04", startTime: "19:00",
    };
    saveTrip({
      ...TEST_TRIP,
      transportation: [earlyFlight],
      activities: [eveningActivity],
    });
    render(<TripPage />);
    await waitFor(() =>
      expect(screen.getByText("Dinner Time")).toBeInTheDocument()
    );
    const main = document.querySelector("main")!.textContent!;
    expect(main.indexOf("Tokyo Narita")).toBeLessThan(
      main.indexOf("Dinner Time")
    );
  });
});
