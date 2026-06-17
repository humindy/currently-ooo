import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, within } from "@testing-library/react";
import BudgetPage, {
  computeCategoryTotals,
  nightsBetween,
} from "@/app/trips/[tripId]/budget/page";
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

const TEST_TRIP: Trip = {
  id: "test-trip-id",
  name: "Japan Spring 2026",
  startDate: "2026-04-04",
  endDate: "2026-04-08",
  destinations: [],
  lodging: [],
  transportation: [],
  activities: [],
  mapLinks: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const LODGING_WITH_COST: Lodging = {
  id: "l-1",
  tripId: "test-trip-id",
  name: "Park Hotel Tokyo",
  checkIn: "2026-04-04",
  checkOut: "2026-04-07", // 3 nights
  cost: 200, // per night → $600 total
};

const LODGING_NO_COST: Lodging = {
  id: "l-2",
  tripId: "test-trip-id",
  name: "Free Stay",
  checkIn: "2026-04-07",
  checkOut: "2026-04-08",
};

const TRANSPORT_WITH_COST: Transportation = {
  id: "t-1",
  tripId: "test-trip-id",
  type: "flight",
  departureLocation: "Tokyo Narita",
  arrivalLocation: "Osaka Kansai",
  departureDateTime: "2026-04-05T10:00",
  cost: 280,
};

const TRANSPORT_NO_COST: Transportation = {
  id: "t-2",
  tripId: "test-trip-id",
  type: "train",
  departureLocation: "Osaka",
  arrivalLocation: "Kyoto",
  departureDateTime: "2026-04-06T09:00",
};

const ACTIVITY_WITH_COST: Activity = {
  id: "a-1",
  tripId: "test-trip-id",
  type: "restaurant",
  title: "Sukiyabashi Jiro",
  date: "2026-04-06",
  cost: 450,
};

const ACTIVITY_NO_COST: Activity = {
  id: "a-2",
  tripId: "test-trip-id",
  type: "free-time",
  title: "Wander Shibuya",
  date: "2026-04-06",
};

beforeEach(() => {
  localStorage.clear();
  saveTrip(TEST_TRIP);
});

// ── Pure function tests ───────────────────────────────────────────────────────

describe("nightsBetween", () => {
  it("computes nights between two dates", () => {
    expect(nightsBetween("2026-04-04", "2026-04-07")).toBe(3);
  });

  it("returns 0 for same-day check-in/check-out", () => {
    expect(nightsBetween("2026-04-04", "2026-04-04")).toBe(0);
  });
});

describe("computeCategoryTotals", () => {
  it("treats missing costs as 0", () => {
    const totals = computeCategoryTotals({
      ...TEST_TRIP,
      lodging: [LODGING_NO_COST],
      transportation: [TRANSPORT_NO_COST],
      activities: [ACTIVITY_NO_COST],
    });
    expect(totals.find((c) => c.label === "Lodging")!.total).toBe(0);
    expect(totals.find((c) => c.label === "Transportation")!.total).toBe(0);
    expect(totals.find((c) => c.label === "Activities")!.total).toBe(0);
  });

  it("sums lodging cost-per-night × nights stayed", () => {
    const totals = computeCategoryTotals({
      ...TEST_TRIP,
      lodging: [LODGING_WITH_COST],
    });
    expect(totals.find((c) => c.label === "Lodging")!.total).toBe(600);
  });

  it("sums transportation costs directly", () => {
    const totals = computeCategoryTotals({
      ...TEST_TRIP,
      transportation: [TRANSPORT_WITH_COST, TRANSPORT_NO_COST],
    });
    expect(totals.find((c) => c.label === "Transportation")!.total).toBe(280);
  });

  it("sums activity costs directly", () => {
    const totals = computeCategoryTotals({
      ...TEST_TRIP,
      activities: [ACTIVITY_WITH_COST, ACTIVITY_NO_COST],
    });
    expect(totals.find((c) => c.label === "Activities")!.total).toBe(450);
  });

  it("includes the correct item count per category regardless of cost", () => {
    const totals = computeCategoryTotals({
      ...TEST_TRIP,
      lodging: [LODGING_WITH_COST, LODGING_NO_COST],
      transportation: [TRANSPORT_WITH_COST, TRANSPORT_NO_COST],
      activities: [ACTIVITY_WITH_COST, ACTIVITY_NO_COST],
    });
    expect(totals.find((c) => c.label === "Lodging")!.count).toBe(2);
    expect(totals.find((c) => c.label === "Transportation")!.count).toBe(2);
    expect(totals.find((c) => c.label === "Activities")!.count).toBe(2);
  });

  it("the overall total equals the sum of all category subtotals", () => {
    const totals = computeCategoryTotals({
      ...TEST_TRIP,
      lodging: [LODGING_WITH_COST, LODGING_NO_COST],
      transportation: [TRANSPORT_WITH_COST, TRANSPORT_NO_COST],
      activities: [ACTIVITY_WITH_COST, ACTIVITY_NO_COST],
    });
    const overallTotal = totals.reduce((s, c) => s + c.total, 0);
    expect(overallTotal).toBe(600 + 280 + 450);
  });
});

// ── Page rendering tests ──────────────────────────────────────────────────────

describe("BudgetPage — empty state", () => {
  it("shows 'No costs added yet' when the trip has no costs", async () => {
    render(<BudgetPage />);
    await waitFor(() =>
      expect(screen.getByText("No costs added yet.")).toBeInTheDocument()
    );
  });

  it("shows the empty state even when items exist but none have a cost", async () => {
    saveTrip({
      ...TEST_TRIP,
      lodging: [LODGING_NO_COST],
      transportation: [TRANSPORT_NO_COST],
      activities: [ACTIVITY_NO_COST],
    });
    render(<BudgetPage />);
    await waitFor(() =>
      expect(screen.getByText("No costs added yet.")).toBeInTheDocument()
    );
  });
});

describe("BudgetPage — category breakdown", () => {
  it("renders a heading for each category with its subtotal and count", async () => {
    saveTrip({
      ...TEST_TRIP,
      lodging: [LODGING_WITH_COST],
      transportation: [TRANSPORT_WITH_COST],
      activities: [ACTIVITY_WITH_COST],
    });
    render(<BudgetPage />);
    await waitFor(() => expect(screen.getByText("$600")).toBeInTheDocument());

    // Scope to <main> since "Lodging"/"Transportation"/"Activities" also
    // appear as tab nav labels outside the budget breakdown list.
    const main = document.querySelector("main")!;
    expect(within(main).getByText("Lodging")).toBeInTheDocument();
    expect(within(main).getByText("Transportation")).toBeInTheDocument();
    expect(within(main).getByText("Activities")).toBeInTheDocument();

    expect(screen.getByText("$600")).toBeInTheDocument();
    expect(screen.getByText("$280")).toBeInTheDocument();
    expect(screen.getByText("$450")).toBeInTheDocument();

    expect(screen.getAllByText("1 item")).toHaveLength(3);
  });

  it("shows the overall total in the section header", async () => {
    saveTrip({
      ...TEST_TRIP,
      lodging: [LODGING_WITH_COST],
      transportation: [TRANSPORT_WITH_COST],
      activities: [ACTIVITY_WITH_COST],
    });
    render(<BudgetPage />);
    await waitFor(() =>
      expect(screen.getByText("$1,330 total")).toBeInTheDocument()
    );
  });
});
