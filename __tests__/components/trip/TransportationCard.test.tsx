import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import TransportationCard from "@/components/trip/TransportationCard";
import type { Transportation } from "@/lib/types";

const flight: Transportation = {
  id: "t-1",
  tripId: "trip-1",
  type: "flight",
  departureLocation: "Tokyo Narita",
  arrivalLocation: "Osaka Kansai",
  departureDateTime: "2026-04-07T10:00",
  arrivalDateTime: "2026-04-07T11:30",
  confirmationNumber: "JL123",
  cost: 280,
};

function renderCard(
  overrides?: Partial<Transportation>,
  callbacks?: Partial<{ onDelete: () => void; onEdit: () => void }>
) {
  return render(
    <TransportationCard
      transportation={{ ...flight, ...overrides }}
      onDelete={callbacks?.onDelete ?? vi.fn()}
      onEdit={callbacks?.onEdit ?? vi.fn()}
    />
  );
}

describe("TransportationCard — rendering", () => {
  it("renders departure and arrival locations", () => {
    renderCard();
    expect(screen.getByText("Tokyo Narita")).toBeInTheDocument();
    expect(screen.getByText("Osaka Kansai")).toBeInTheDocument();
  });

  it("renders departure and arrival datetimes", () => {
    renderCard();
    expect(screen.getByText(/Apr 7 · 10:00 AM/)).toBeInTheDocument();
    expect(screen.getByText(/Apr 7 · 11:30 AM/)).toBeInTheDocument();
  });

  it("renders the cost", () => {
    renderCard();
    expect(screen.getByText("$280")).toBeInTheDocument();
  });

  it("renders the confirmation number", () => {
    renderCard();
    expect(screen.getByText("#JL123")).toBeInTheDocument();
  });

  it("renders a car rental without arrival info (no arrow or arrival shown)", () => {
    render(
      <TransportationCard
        transportation={{
          id: "t-2",
          tripId: "trip-1",
          type: "car-rental",
          departureLocation: "Rome Fiumicino",
          departureDateTime: "2026-04-08T09:00",
        }}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getByText("Rome Fiumicino")).toBeInTheDocument();
    expect(screen.queryByText("→")).not.toBeInTheDocument();
  });

  it("omits cost when not provided", () => {
    const { cost: _cost, ...withoutCost } = flight;
    render(
      <TransportationCard
        transportation={withoutCost}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );
    expect(screen.queryByText(/^\$\d/)).not.toBeInTheDocument();
  });
});

describe("TransportationCard — type labels", () => {
  const cases: Array<[Transportation["type"], string]> = [
    ["flight", "Flight"],
    ["train", "Train"],
    ["car-rental", "Car Rental"],
    ["ferry", "Ferry"],
    ["bus", "Bus"],
  ];

  for (const [type, label] of cases) {
    it(`shows "${label}" badge for type "${type}"`, () => {
      renderCard({ type });
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  }
});

describe("TransportationCard — delete flow", () => {
  it("shows the confirmation dialog when the delete button is clicked", async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole("button", { name: /delete flight/i }));
    expect(screen.getByText("Remove transportation?")).toBeInTheDocument();
    expect(
      screen.getByText(/Tokyo Narita → Osaka Kansai/)
    ).toBeInTheDocument();
  });

  it("hides the dialog when Cancel is clicked", async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(screen.getByRole("button", { name: /delete flight/i }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(
      screen.queryByText("Remove transportation?")
    ).not.toBeInTheDocument();
  });

  it("calls onDelete when Remove is confirmed", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderCard(undefined, { onDelete });
    await user.click(screen.getByRole("button", { name: /delete flight/i }));
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});

describe("TransportationCard — edit", () => {
  it("calls onEdit when the edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    renderCard(undefined, { onEdit });
    await user.click(screen.getByRole("button", { name: /edit flight/i }));
    expect(onEdit).toHaveBeenCalledOnce();
  });
});
