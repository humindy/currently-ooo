import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransportationPage from "@/app/trips/[tripId]/transportation/page";
import { saveTrip } from "@/lib/storage";
import type { Transportation, Trip } from "@/lib/types";

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

// Stub TransportationCard so page tests focus on list/form behaviour.
vi.mock("@/components/trip/TransportationCard", () => ({
  default: ({
    transportation,
    onEdit,
    onDelete,
  }: {
    transportation: Transportation;
    onEdit: () => void;
    onDelete: () => void;
  }) => (
    <div data-testid="transportation-card">
      {transportation.type} — {transportation.departureLocation}
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
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

const SAMPLE_TRANSPORT: Transportation = {
  id: "t-1",
  tripId: "test-trip-id",
  type: "flight",
  departureLocation: "Tokyo Narita",
  arrivalLocation: "Osaka Kansai",
  departureDateTime: "2026-04-07T10:00",
  arrivalDateTime: "2026-04-07T11:30",
  confirmationNumber: "JL123",
  cost: 280,
};

beforeEach(() => {
  localStorage.clear();
  saveTrip(TEST_TRIP);
});

async function openAddModal() {
  const user = userEvent.setup();
  render(<TransportationPage />);
  const btn = await screen.findByRole("button", { name: /add transportation/i });
  await user.click(btn);
  return user;
}

describe("Transportation page — empty and loaded states", () => {
  it("shows empty state when the trip has no transportation", async () => {
    render(<TransportationPage />);
    await waitFor(() =>
      expect(
        screen.getByText("No transportation added yet.")
      ).toBeInTheDocument()
    );
  });

  it("shows transportation cards when the trip has entries", async () => {
    saveTrip({ ...TEST_TRIP, transportation: [SAMPLE_TRANSPORT] });
    render(<TransportationPage />);
    await waitFor(() =>
      expect(
        screen.getByTestId("transportation-card")
      ).toBeInTheDocument()
    );
    expect(screen.getByText(/Tokyo Narita/)).toBeInTheDocument();
  });
});

describe("Transportation page — Add form validation", () => {
  it("shows a departure-location error when submitting an empty form", async () => {
    const user = await openAddModal();
    await user.click(
      screen.getByRole("button", { name: "Save transportation" })
    );
    expect(
      screen.getByText("Departure location is required.")
    ).toBeInTheDocument();
  });

  it("shows an arrival-location error when only departure is filled", async () => {
    const user = await openAddModal();
    await user.type(
      screen.getByPlaceholderText(/tokyo narita/i),
      "Tokyo Narita"
    );
    await user.click(
      screen.getByRole("button", { name: "Save transportation" })
    );
    expect(
      screen.getByText("Arrival location is required.")
    ).toBeInTheDocument();
  });

  it("shows departure date error when locations are filled but dates are missing", async () => {
    const user = await openAddModal();
    await user.type(
      screen.getByPlaceholderText(/tokyo narita/i),
      "Tokyo Narita"
    );
    await user.type(
      screen.getByPlaceholderText(/osaka kansai/i),
      "Osaka Kansai"
    );
    await user.click(
      screen.getByRole("button", { name: "Save transportation" })
    );
    expect(
      screen.getByText("Departure date is required.")
    ).toBeInTheDocument();
  });

  it("shows arrival-after-departure error when arrival date is before departure date", async () => {
    const user = await openAddModal();
    await user.type(
      screen.getByPlaceholderText(/tokyo narita/i),
      "Tokyo Narita"
    );
    await user.type(
      screen.getByPlaceholderText(/osaka kansai/i),
      "Osaka Kansai"
    );
    const dateInputs =
      document.querySelectorAll<HTMLInputElement>('input[type="date"]');
    fireEvent.change(dateInputs[0], { target: { value: "2026-04-07" } });
    fireEvent.change(dateInputs[1], { target: { value: "2026-04-06" } });
    await user.click(
      screen.getByRole("button", { name: "Save transportation" })
    );
    expect(
      screen.getByText("Arrival must be after departure.")
    ).toBeInTheDocument();
  });
});

describe("Transportation page — Edit modal", () => {
  it("opens the edit modal pre-filled with existing data", async () => {
    saveTrip({ ...TEST_TRIP, transportation: [SAMPLE_TRANSPORT] });
    const user = userEvent.setup();
    render(<TransportationPage />);
    await waitFor(() =>
      expect(screen.getByTestId("transportation-card")).toBeInTheDocument()
    );
    await user.click(screen.getByRole("button", { name: "Edit card" }));
    expect(screen.getByText("Edit transportation")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Tokyo Narita")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Osaka Kansai")).toBeInTheDocument();
    // dates and times pre-filled (both dates are 2026-04-07, times are unique)
    expect(screen.getAllByDisplayValue("2026-04-07")).toHaveLength(2);
    expect(screen.getByDisplayValue("10:00")).toBeInTheDocument();
    expect(screen.getByDisplayValue("11:30")).toBeInTheDocument();
    expect(
      (screen.getByDisplayValue("Flight") as HTMLSelectElement).value
    ).toBe("flight");
  });
});
