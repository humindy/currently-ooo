import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LodgingPage from "@/app/trips/[tripId]/lodging/page";
import { saveTrip } from "@/lib/storage";
import type { Trip } from "@/lib/types";

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

// Stub LodgingCard to keep page tests focused on the list and form, not card internals.
vi.mock("@/components/trip/LodgingCard", () => ({
  default: ({
    lodging,
  }: {
    lodging: { name: string };
    onDelete: () => void;
    onEdit: () => void;
  }) => <div data-testid="lodging-card">{lodging.name}</div>,
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

beforeEach(() => {
  localStorage.clear();
  saveTrip(TEST_TRIP);
});

async function openAddModal() {
  const user = userEvent.setup();
  render(<LodgingPage />);
  const btn = await screen.findByRole("button", { name: /add lodging/i });
  await user.click(btn);
  return user;
}

describe("Lodging page — Add Lodging form validation", () => {
  it("shows a name-required error when submitting an empty form", async () => {
    const user = await openAddModal();
    await user.click(screen.getByRole("button", { name: "Save lodging" }));
    expect(screen.getByText("Name is required.")).toBeInTheDocument();
  });

  it("shows a check-in-required error when name is filled but dates are missing", async () => {
    const user = await openAddModal();
    await user.type(
      screen.getByPlaceholderText(/park hotel tokyo/i),
      "My Hotel"
    );
    await user.click(screen.getByRole("button", { name: "Save lodging" }));
    expect(screen.getByText("Check-in date is required.")).toBeInTheDocument();
  });

  it("shows a check-out-required error when only check-in is filled", async () => {
    const user = await openAddModal();
    await user.type(
      screen.getByPlaceholderText(/park hotel tokyo/i),
      "My Hotel"
    );
    // date inputs don't respond to userEvent.type — use fireEvent.change
    const [checkIn] = document.querySelectorAll<HTMLInputElement>(
      'input[type="date"]'
    );
    fireEvent.change(checkIn, { target: { value: "2026-04-04" } });
    await user.click(screen.getByRole("button", { name: "Save lodging" }));
    expect(screen.getByText("Check-out date is required.")).toBeInTheDocument();
  });

  it("shows a check-out-after-check-in error when dates are invalid", async () => {
    const user = await openAddModal();
    await user.type(
      screen.getByPlaceholderText(/park hotel tokyo/i),
      "My Hotel"
    );
    const dateInputs = document.querySelectorAll<HTMLInputElement>(
      'input[type="date"]'
    );
    fireEvent.change(dateInputs[0], { target: { value: "2026-04-07" } });
    fireEvent.change(dateInputs[1], { target: { value: "2026-04-04" } });
    await user.click(screen.getByRole("button", { name: "Save lodging" }));
    expect(
      screen.getByText("Check-out must be after check-in.")
    ).toBeInTheDocument();
  });
});

describe("Lodging page — empty and loaded states", () => {
  it("shows empty state when the trip has no lodging", async () => {
    render(<LodgingPage />);
    await waitFor(() =>
      expect(
        screen.getByText("No lodging added yet.")
      ).toBeInTheDocument()
    );
  });

  it("shows lodging cards when the trip has lodging entries", async () => {
    saveTrip({
      ...TEST_TRIP,
      lodging: [
        {
          id: "l-1",
          tripId: "test-trip-id",
          name: "Park Hotel Tokyo",
          checkIn: "2026-04-04",
          checkOut: "2026-04-07",
        },
      ],
    });
    render(<LodgingPage />);
    await waitFor(() =>
      expect(screen.getByTestId("lodging-card")).toBeInTheDocument()
    );
    expect(screen.getByText("Park Hotel Tokyo")).toBeInTheDocument();
  });
});
