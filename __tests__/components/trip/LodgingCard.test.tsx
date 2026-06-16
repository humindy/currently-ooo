import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import LodgingCard from "@/components/trip/LodgingCard";
import type { Lodging } from "@/lib/types";

const lodging: Lodging = {
  id: "l-1",
  tripId: "trip-1",
  name: "Park Hotel Tokyo",
  address: "1-7-1 Higashi-Shimbashi, Tokyo",
  checkIn: "2026-04-04",
  checkOut: "2026-04-07",
  confirmationNumber: "PHT-4471",
  cost: 480, // per night; 3 nights → $1,440 total
};

function renderCard(overrides?: Partial<{ onDelete: () => void; onEdit: () => void }>) {
  return render(
    <LodgingCard
      lodging={lodging}
      onDelete={overrides?.onDelete ?? vi.fn()}
      onEdit={overrides?.onEdit ?? vi.fn()}
    />
  );
}

async function openMenu(user: ReturnType<typeof userEvent.setup>) {
  await user.click(
    screen.getByRole("button", { name: /options for park hotel tokyo/i })
  );
}

describe("LodgingCard", () => {
  it("renders the lodging name", () => {
    renderCard();
    expect(screen.getByText("Park Hotel Tokyo")).toBeInTheDocument();
  });

  it("renders check-in and check-out dates", () => {
    renderCard();
    expect(screen.getByText(/Apr 4/)).toBeInTheDocument();
    expect(screen.getByText(/Apr 7/)).toBeInTheDocument();
  });

  it("renders the night count", () => {
    renderCard();
    expect(screen.getByText("3 nights")).toBeInTheDocument();
  });

  it("renders the total cost (cost/night × nights)", () => {
    renderCard();
    // 480/night × 3 nights = $1,440
    expect(screen.getByText("$1,440")).toBeInTheDocument();
  });

  it("renders the per-night rate", () => {
    renderCard();
    expect(screen.getByText("$480/night")).toBeInTheDocument();
  });

  it("renders the confirmation number", () => {
    renderCard();
    expect(screen.getByText("#PHT-4471")).toBeInTheDocument();
  });

  it("omits the cost element when cost is not provided", () => {
    const { cost: _cost, ...withoutCost } = lodging;
    render(
      <LodgingCard lodging={withoutCost} onDelete={vi.fn()} onEdit={vi.fn()} />
    );
    expect(screen.queryByText(/^\$\d/)).not.toBeInTheDocument();
  });

  it("shows Edit and Delete options when the three-dot button is clicked", async () => {
    const user = userEvent.setup();
    renderCard();
    await openMenu(user);
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Delete" })).toBeInTheDocument();
  });

  it("calls onEdit when Edit is clicked in the menu", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    renderCard({ onEdit });
    await openMenu(user);
    await user.click(screen.getByRole("button", { name: "Edit" }));
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("shows the confirmation dialog when Delete is clicked in the menu", async () => {
    const user = userEvent.setup();
    renderCard();
    await openMenu(user);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    expect(screen.getByText("Remove lodging?")).toBeInTheDocument();
    expect(
      screen.getByText("Park Hotel Tokyo", { selector: "span" })
    ).toBeInTheDocument();
  });

  it("hides the dialog when Cancel is clicked", async () => {
    const user = userEvent.setup();
    renderCard();
    await openMenu(user);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Remove lodging?")).not.toBeInTheDocument();
  });

  it("calls onDelete when Remove is confirmed", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderCard({ onDelete });
    await openMenu(user);
    await user.click(screen.getByRole("button", { name: "Delete" }));
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
