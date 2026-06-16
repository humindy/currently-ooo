import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import Home from "@/app/page";

// Render next/link as a plain <a> — no router context needed in tests.
vi.mock("next/link", () => ({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  default: ({ href, children, ...rest }: any) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

// Stub TripCard to isolate the dashboard from card-level concerns.
vi.mock("@/components/trip/TripCard", () => ({
  default: ({ trip }: { trip: { name: string } }) => (
    <div data-testid="trip-card">{trip.name}</div>
  ),
}));

describe("Home (dashboard) — empty state", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows the empty-state heading and description", async () => {
    render(<Home />);
    await waitFor(() =>
      expect(screen.getByText("No trips yet")).toBeInTheDocument()
    );
    expect(
      screen.getByText("Start planning your next adventure.")
    ).toBeInTheDocument();
  });

  it("shows a Create New Trip link pointing to /trips/new", async () => {
    render(<Home />);
    const link = await screen.findByRole("link", { name: "Create New Trip" });
    expect(link).toHaveAttribute("href", "/trips/new");
  });

  it("does not render any trip cards", async () => {
    render(<Home />);
    await waitFor(() =>
      expect(screen.getByText("No trips yet")).toBeInTheDocument()
    );
    expect(screen.queryByTestId("trip-card")).not.toBeInTheDocument();
  });
});
