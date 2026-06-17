import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActivitiesPage from "@/app/trips/[tripId]/activities/page";
import { saveTrip } from "@/lib/storage";
import type { Activity, Trip } from "@/lib/types";

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

vi.mock("@/components/trip/ActivityCard", () => ({
  default: ({
    activity,
    onEdit,
    onDelete,
  }: {
    activity: Activity;
    onEdit: () => void;
    onDelete: () => void;
  }) => (
    <div data-testid="activity-card">
      {activity.title}
      <button onClick={onEdit}>Edit card</button>
      <button onClick={onDelete}>Delete card</button>
    </div>
  ),
}));

const TEST_TRIP: Trip = {
  id: "test-trip-id",
  name: "Japan Spring 2026",
  startDate: "2026-04-04",
  endDate: "2026-04-15",
  destinations: [],
  lodging: [],
  transportation: [],
  activities: [],
  mapLinks: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const ACTIVITY_APR7: Activity = {
  id: "a-1",
  tripId: "test-trip-id",
  type: "restaurant",
  title: "Sukiyabashi Jiro",
  date: "2026-04-07",
  startTime: "19:00",
  endTime: "21:00",
  location: "Ginza, Tokyo",
  confirmationNumber: "SJ-9901",
  cost: 450,
};

const ACTIVITY_APR8: Activity = {
  id: "a-2",
  tripId: "test-trip-id",
  type: "museum",
  title: "Tokyo National Museum",
  date: "2026-04-08",
  startTime: "10:00",
};

beforeEach(() => {
  localStorage.clear();
  saveTrip(TEST_TRIP);
});

async function openAddModal() {
  const user = userEvent.setup();
  render(<ActivitiesPage />);
  const btn = await screen.findByRole("button", { name: /add activity/i });
  await user.click(btn);
  return user;
}

describe("Activities page — empty and loaded states", () => {
  it("shows empty state when the trip has no activities", async () => {
    render(<ActivitiesPage />);
    await waitFor(() =>
      expect(
        screen.getByText("No activities added yet.")
      ).toBeInTheDocument()
    );
  });

  it("shows activity cards when the trip has activity entries", async () => {
    saveTrip({ ...TEST_TRIP, activities: [ACTIVITY_APR7] });
    render(<ActivitiesPage />);
    await waitFor(() =>
      expect(screen.getByTestId("activity-card")).toBeInTheDocument()
    );
    expect(screen.getByText("Sukiyabashi Jiro")).toBeInTheDocument();
  });
});

describe("Activities page — date grouping", () => {
  it("groups activities under date headers", async () => {
    saveTrip({
      ...TEST_TRIP,
      activities: [ACTIVITY_APR7, ACTIVITY_APR8],
    });
    render(<ActivitiesPage />);
    await waitFor(() =>
      expect(screen.getAllByTestId("activity-card")).toHaveLength(2)
    );
    // Date headers should contain "Apr 7" and "Apr 8"
    expect(screen.getByText(/Apr 7/)).toBeInTheDocument();
    expect(screen.getByText(/Apr 8/)).toBeInTheDocument();
    expect(screen.getByText("Sukiyabashi Jiro")).toBeInTheDocument();
    expect(screen.getByText("Tokyo National Museum")).toBeInTheDocument();
  });

  it("sorts activities by date chronologically", async () => {
    // Apr 8 activity added first but Apr 7 should appear first in DOM
    saveTrip({
      ...TEST_TRIP,
      activities: [ACTIVITY_APR8, ACTIVITY_APR7],
    });
    render(<ActivitiesPage />);
    await waitFor(() =>
      expect(screen.getAllByTestId("activity-card")).toHaveLength(2)
    );
    const cards = screen.getAllByTestId("activity-card");
    expect(cards[0]).toHaveTextContent("Sukiyabashi Jiro");
    expect(cards[1]).toHaveTextContent("Tokyo National Museum");
  });
});

describe("Activities page — Add form validation", () => {
  it("shows a title-required error when submitting an empty form", async () => {
    const user = await openAddModal();
    await user.click(screen.getByRole("button", { name: "Save activity" }));
    expect(screen.getByText("Title is required.")).toBeInTheDocument();
  });

  it("shows a date-required error when title is filled but date is missing", async () => {
    const user = await openAddModal();
    await user.type(
      screen.getByPlaceholderText(/dinner at sukiyabashi/i),
      "My Activity"
    );
    await user.click(screen.getByRole("button", { name: "Save activity" }));
    expect(screen.getByText("Date is required.")).toBeInTheDocument();
  });

  it("submits successfully with title and date", async () => {
    const user = await openAddModal();
    await user.type(
      screen.getByPlaceholderText(/dinner at sukiyabashi/i),
      "Ramen Dinner"
    );
    const dateInput = document.querySelector<HTMLInputElement>('input[type="date"]');
    fireEvent.change(dateInput!, { target: { value: "2026-04-09" } });
    await user.click(screen.getByRole("button", { name: "Save activity" }));
    // Modal closes, card appears
    await waitFor(() =>
      expect(screen.queryByText("Add activity")).not.toBeInTheDocument()
    );
    expect(screen.getByTestId("activity-card")).toBeInTheDocument();
  });
});

describe("Activities page — Edit modal", () => {
  it("opens the edit modal pre-filled with existing data", async () => {
    saveTrip({ ...TEST_TRIP, activities: [ACTIVITY_APR7] });
    const user = userEvent.setup();
    render(<ActivitiesPage />);
    await waitFor(() =>
      expect(screen.getByTestId("activity-card")).toBeInTheDocument()
    );
    await user.click(screen.getByRole("button", { name: "Edit card" }));
    expect(screen.getByText("Edit activity")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Sukiyabashi Jiro")).toBeInTheDocument();
    expect(screen.getByDisplayValue("2026-04-07")).toBeInTheDocument();
    expect(screen.getByDisplayValue("19:00")).toBeInTheDocument();
    expect(screen.getByDisplayValue("21:00")).toBeInTheDocument();
    expect(
      (screen.getByDisplayValue("Restaurant") as HTMLSelectElement).value
    ).toBe("restaurant");
  });
});

describe("Activities page — Delete", () => {
  it("removes an activity when the card's delete callback fires", async () => {
    saveTrip({ ...TEST_TRIP, activities: [ACTIVITY_APR7] });
    const user = userEvent.setup();
    render(<ActivitiesPage />);
    await waitFor(() =>
      expect(screen.getByTestId("activity-card")).toBeInTheDocument()
    );
    await user.click(screen.getByRole("button", { name: "Delete card" }));
    await waitFor(() =>
      expect(screen.queryByTestId("activity-card")).not.toBeInTheDocument()
    );
    expect(screen.getByText("No activities added yet.")).toBeInTheDocument();
  });
});
