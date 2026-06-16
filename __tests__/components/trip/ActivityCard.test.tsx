import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ActivityCard from "@/components/trip/ActivityCard";
import type { Activity } from "@/lib/types";

const activity: Activity = {
  id: "a-1",
  tripId: "trip-1",
  type: "restaurant",
  title: "Sukiyabashi Jiro",
  date: "2026-04-07",
  startTime: "19:00",
  endTime: "21:00",
  location: "Ginza, Tokyo",
  confirmationNumber: "SJ-9901",
  cost: 450,
};

function renderCard(
  overrides?: Partial<{ onDelete: () => void; onEdit: () => void }>
) {
  return render(
    <ActivityCard
      activity={activity}
      onDelete={overrides?.onDelete ?? vi.fn()}
      onEdit={overrides?.onEdit ?? vi.fn()}
    />
  );
}

describe("ActivityCard — rendering", () => {
  it("renders the activity title", () => {
    renderCard();
    expect(screen.getByText("Sukiyabashi Jiro")).toBeInTheDocument();
  });

  it("renders the type label", () => {
    renderCard();
    expect(screen.getByText("Restaurant")).toBeInTheDocument();
  });

  it("renders the date", () => {
    renderCard();
    expect(screen.getByText("Apr 7")).toBeInTheDocument();
  });

  it("renders the time range when start and end times are provided", () => {
    renderCard();
    expect(screen.getByText("7:00 PM – 9:00 PM")).toBeInTheDocument();
  });

  it("renders only start time when no end time", () => {
    render(
      <ActivityCard
        activity={{ ...activity, endTime: undefined }}
        onDelete={vi.fn()}
        onEdit={vi.fn()}
      />
    );
    expect(screen.getByText("7:00 PM")).toBeInTheDocument();
  });

  it("renders the location", () => {
    renderCard();
    expect(screen.getByText("Ginza, Tokyo")).toBeInTheDocument();
  });

  it("renders the confirmation number", () => {
    renderCard();
    expect(screen.getByText("#SJ-9901")).toBeInTheDocument();
  });

  it("renders the cost", () => {
    renderCard();
    expect(screen.getByText("$450")).toBeInTheDocument();
  });

  it("omits cost when not provided", () => {
    const { cost: _cost, ...withoutCost } = activity;
    render(<ActivityCard activity={withoutCost} onDelete={vi.fn()} onEdit={vi.fn()} />);
    expect(screen.queryByText(/^\$\d/)).not.toBeInTheDocument();
  });
});

describe("ActivityCard — type labels", () => {
  const cases: Array<[Activity["type"], string]> = [
    ["restaurant", "Restaurant"],
    ["museum", "Museum"],
    ["tour", "Tour"],
    ["show", "Show"],
    ["outdoor", "Outdoor"],
    ["shopping", "Shopping"],
    ["free-time", "Free Time"],
    ["other", "Other"],
  ];

  for (const [type, label] of cases) {
    it(`shows "${label}" label for type "${type}"`, () => {
      render(
        <ActivityCard
          activity={{ ...activity, type }}
          onDelete={vi.fn()}
          onEdit={vi.fn()}
        />
      );
      expect(screen.getByText(label)).toBeInTheDocument();
    });
  }
});

describe("ActivityCard — edit and delete", () => {
  it("calls onEdit when the edit button is clicked", async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();
    renderCard({ onEdit });
    await user.click(
      screen.getByRole("button", { name: /edit sukiyabashi jiro/i })
    );
    expect(onEdit).toHaveBeenCalledOnce();
  });

  it("shows the confirmation dialog when the delete button is clicked", async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(
      screen.getByRole("button", { name: /delete sukiyabashi jiro/i })
    );
    expect(screen.getByText("Remove activity?")).toBeInTheDocument();
    expect(
      screen.getByText("Sukiyabashi Jiro", { selector: "span" })
    ).toBeInTheDocument();
  });

  it("hides the dialog when Cancel is clicked", async () => {
    const user = userEvent.setup();
    renderCard();
    await user.click(
      screen.getByRole("button", { name: /delete sukiyabashi jiro/i })
    );
    await user.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.queryByText("Remove activity?")).not.toBeInTheDocument();
  });

  it("calls onDelete when Remove is confirmed", async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();
    renderCard({ onDelete });
    await user.click(
      screen.getByRole("button", { name: /delete sukiyabashi jiro/i })
    );
    await user.click(screen.getByRole("button", { name: "Remove" }));
    expect(onDelete).toHaveBeenCalledOnce();
  });
});
