import { describe, it, expect, beforeEach } from "vitest";
import {
  createTrip,
  saveTrip,
  getTrip,
  getTrips,
  deleteTrip,
  addMapLink,
  updateMapLink,
  deleteMapLink,
} from "@/lib/storage";

beforeEach(() => {
  localStorage.clear();
});

describe("createTrip", () => {
  it("returns a trip with the given name and dates", () => {
    const trip = createTrip("Japan Spring 2026", "2026-04-04", "2026-04-15");
    expect(trip.name).toBe("Japan Spring 2026");
    expect(trip.startDate).toBe("2026-04-04");
    expect(trip.endDate).toBe("2026-04-15");
  });

  it("initialises all nested arrays as empty", () => {
    const trip = createTrip("Test", "2026-01-01", "2026-01-10");
    expect(trip.destinations).toEqual([]);
    expect(trip.lodging).toEqual([]);
    expect(trip.transportation).toEqual([]);
    expect(trip.activities).toEqual([]);
    expect(trip.mapLinks).toEqual([]);
  });

  it("generates a unique id on each call", () => {
    const a = createTrip("A", "2026-01-01", "2026-01-02");
    const b = createTrip("B", "2026-01-01", "2026-01-02");
    expect(a.id).not.toBe(b.id);
  });

  it("does not persist to storage", () => {
    createTrip("Unpersisted", "2026-01-01", "2026-01-02");
    expect(getTrips()).toHaveLength(0);
  });
});

describe("saveTrip", () => {
  it("persists a new trip so getTrips returns it", () => {
    const trip = createTrip("Japan", "2026-04-04", "2026-04-15");
    saveTrip(trip);
    expect(getTrips()).toHaveLength(1);
    expect(getTrips()[0].name).toBe("Japan");
  });

  it("upserts by id — does not create a duplicate", () => {
    const trip = createTrip("Japan", "2026-04-04", "2026-04-15");
    saveTrip(trip);
    saveTrip({ ...trip, name: "Japan Updated" });
    const trips = getTrips();
    expect(trips).toHaveLength(1);
    expect(trips[0].name).toBe("Japan Updated");
  });

  it("stamps updatedAt on each save", () => {
    const trip = createTrip("Japan", "2026-04-04", "2026-04-15");
    const originalUpdatedAt = new Date(trip.updatedAt).getTime();
    saveTrip(trip);
    const saved = getTrip(trip.id)!;
    expect(new Date(saved.updatedAt).getTime()).toBeGreaterThanOrEqual(
      originalUpdatedAt
    );
  });
});

describe("getTrip", () => {
  it("returns the trip matching the given id", () => {
    const trip = createTrip("Japan", "2026-04-04", "2026-04-15");
    saveTrip(trip);
    expect(getTrip(trip.id)?.name).toBe("Japan");
  });

  it("returns undefined for an unknown id", () => {
    expect(getTrip("does-not-exist")).toBeUndefined();
  });
});

describe("deleteTrip", () => {
  it("removes the trip with the given id", () => {
    const trip = createTrip("Japan", "2026-04-04", "2026-04-15");
    saveTrip(trip);
    deleteTrip(trip.id);
    expect(getTrip(trip.id)).toBeUndefined();
    expect(getTrips()).toHaveLength(0);
  });

  it("leaves other trips intact", () => {
    const a = createTrip("Japan", "2026-04-04", "2026-04-15");
    const b = createTrip("Portugal", "2026-06-12", "2026-06-20");
    saveTrip(a);
    saveTrip(b);
    deleteTrip(a.id);
    const remaining = getTrips();
    expect(remaining).toHaveLength(1);
    expect(remaining[0].id).toBe(b.id);
  });

  it("is a no-op for an unknown id", () => {
    const trip = createTrip("Japan", "2026-04-04", "2026-04-15");
    saveTrip(trip);
    deleteTrip("unknown-id");
    expect(getTrips()).toHaveLength(1);
  });
});

describe("addMapLink", () => {
  it("adds a map link with a generated id and persists it", () => {
    const trip = createTrip("Japan", "2026-04-04", "2026-04-15");
    saveTrip(trip);
    addMapLink(trip.id, { label: "Tokyo Restaurants", url: "https://maps.google.com/foo" });

    const saved = getTrip(trip.id)!;
    expect(saved.mapLinks).toHaveLength(1);
    expect(saved.mapLinks[0]).toMatchObject({
      label: "Tokyo Restaurants",
      url: "https://maps.google.com/foo",
    });
    expect(saved.mapLinks[0].id).toBeTruthy();
  });

  it("appends to existing map links without overwriting them", () => {
    const trip = createTrip("Japan", "2026-04-04", "2026-04-15");
    saveTrip(trip);
    addMapLink(trip.id, { label: "First", url: "https://maps.google.com/a" });
    addMapLink(trip.id, { label: "Second", url: "https://maps.google.com/b" });

    const saved = getTrip(trip.id)!;
    expect(saved.mapLinks).toHaveLength(2);
    expect(saved.mapLinks.map((m) => m.label)).toEqual(["First", "Second"]);
  });

  it("is a no-op for an unknown trip id", () => {
    addMapLink("unknown-id", { label: "X", url: "https://maps.google.com/x" });
    expect(getTrips()).toHaveLength(0);
  });
});

describe("updateMapLink", () => {
  it("updates the matching map link in place", () => {
    const trip = createTrip("Japan", "2026-04-04", "2026-04-15");
    saveTrip(trip);
    addMapLink(trip.id, { label: "Original", url: "https://maps.google.com/a" });
    const mapLink = getTrip(trip.id)!.mapLinks[0];

    updateMapLink(trip.id, { ...mapLink, label: "Updated", url: "https://maps.google.com/b" });

    const saved = getTrip(trip.id)!;
    expect(saved.mapLinks).toHaveLength(1);
    expect(saved.mapLinks[0]).toMatchObject({
      id: mapLink.id,
      label: "Updated",
      url: "https://maps.google.com/b",
    });
  });

  it("leaves other map links untouched", () => {
    const trip = createTrip("Japan", "2026-04-04", "2026-04-15");
    saveTrip(trip);
    addMapLink(trip.id, { label: "First", url: "https://maps.google.com/a" });
    addMapLink(trip.id, { label: "Second", url: "https://maps.google.com/b" });
    const [first, second] = getTrip(trip.id)!.mapLinks;

    updateMapLink(trip.id, { ...first, label: "First Updated" });

    const saved = getTrip(trip.id)!;
    expect(saved.mapLinks.find((m) => m.id === first.id)?.label).toBe("First Updated");
    expect(saved.mapLinks.find((m) => m.id === second.id)?.label).toBe("Second");
  });
});

describe("deleteMapLink", () => {
  it("removes the matching map link", () => {
    const trip = createTrip("Japan", "2026-04-04", "2026-04-15");
    saveTrip(trip);
    addMapLink(trip.id, { label: "Tokyo", url: "https://maps.google.com/a" });
    const mapLink = getTrip(trip.id)!.mapLinks[0];

    deleteMapLink(trip.id, mapLink.id);

    expect(getTrip(trip.id)!.mapLinks).toHaveLength(0);
  });

  it("leaves other map links intact", () => {
    const trip = createTrip("Japan", "2026-04-04", "2026-04-15");
    saveTrip(trip);
    addMapLink(trip.id, { label: "First", url: "https://maps.google.com/a" });
    addMapLink(trip.id, { label: "Second", url: "https://maps.google.com/b" });
    const [first, second] = getTrip(trip.id)!.mapLinks;

    deleteMapLink(trip.id, first.id);

    const saved = getTrip(trip.id)!;
    expect(saved.mapLinks).toHaveLength(1);
    expect(saved.mapLinks[0].id).toBe(second.id);
  });
});
