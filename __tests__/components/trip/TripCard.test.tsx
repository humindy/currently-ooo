import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TripCard from "@/components/trip/TripCard";
import * as storage from "@/lib/storage";
import type { Trip } from "@/lib/types";

// Render next/link as a plain <a> — no router context needed in tests.
vi.mock("next/link", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Mock deleteTrip so it doesn't touch localStorage and is observable.
vi.mock("@/lib/storage", () => ({
  deleteTrip: vi.fn(),
}));

const trip: Trip = {
  id: "trip-1",
  name: "Japan Spring 2026",
  startDate: "2026-04-04",
  endDate: "2026-04-15",
  destinations: [
    {
      id: "d-1",
      tripId: "trip-1",
      name: "Tokyo",
      startDate: "2026-04-04",
      endDate: "2026-04-07",
    },
    {
      id: "d-2",
      tripId: "trip-1",
      name: "Kyoto",
      startDate: "2026-04-08",
      endDate: "2026-04-15",
    },
  ],
  lodging: [],
  transportation: [],
  activities: [],
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
};

afterEach(() => {
  vi.mocked(storage.deleteTrip).mockClear();
});

describe("TripCard", () => {
  it("renders the trip name and date range", () => {
    render(<TripCard trip={trip} onDelete={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByText("Japan Spring 2026")).toBeInTheDocument();
    expect(screen.getByText(/Apr 4/)).toBeInTheDocument();
  });

  it("renders destination tags", () => {
    render(<TripCard trip={trip} onDelete={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByText("Tokyo")).toBeInTheDocument();
    expect(screen.getByText("Kyoto")).toBeInTheDocument();
  });

  it("links to /trips/[tripId]", () => {
    render(<TripCard trip={trip} onDelete={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.getByRole("link")).toHaveAttribute("href", "/trips/trip-1");
  });

  it("calls onEdit when the edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    render(<TripCard trip={trip} onDelete={vi.fn()} onEdit={onEdit} />);
    await user.click(
      screen.getByRole("button", { name: /edit japan spring 2026/i })
    );
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("shows the confirmation dialog when the delete button is clicked", async () => {
    const user = userEvent.setup();
    render(<TripCard trip={trip} onDelete={vi.fn()} onEdit={vi.fn()} />);
    await user.click(
      screen.getByRole("button", { name: /delete japan spring 2026/i })
    );
    expect(
      screen.getByText(/are you sure you want to delete/i)
    ).toBeInTheDocument();
    expect(
      screen.getByText("Japan Spring 2026", { selector: "span" })
    ).toBeInTheDocument();
  });

  it("hides the confirmation dialog when Cancel is clicked", async () => {
    const user = userEvent.setup();
    render(<TripCard trip={trip} onDelete={vi.fn()} onEdit={vi.fn()} />);
    await user.click(
      screen.getByRole("button", { name: /delete japan spring 2026/i })
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.queryByText(/are you sure you want to delete/i)
    ).not.toBeInTheDocument();
  });

  it("calls deleteTrip and onDelete when Delete is confirmed", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    render(<TripCard trip={trip} onDelete={onDelete} onEdit={vi.fn()} />);

    await user.click(
      screen.getByRole("button", { name: /delete japan spring 2026/i })
    );
    await user.click(screen.getByRole("button", { name: "Delete" }));

    expect(storage.deleteTrip).toHaveBeenCalledWith("trip-1");
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
