import "@testing-library/jest-dom";

// Node.js 26 ships a non-functional localStorage stub (requires --localstorage-file).
// Its property descriptor is configurable, so we can replace it with a real
// in-memory implementation that the storage layer and tests can use.
class LocalStorageMock implements Storage {
  private store: Record<string, string> = Object.create(null);

  clear() {
    this.store = Object.create(null);
  }
  getItem(key: string) {
    return key in this.store ? this.store[key] : null;
  }
  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }
  removeItem(key: string) {
    delete this.store[key];
  }
  get length() {
    return Object.keys(this.store).length;
  }
  key(index: number) {
    return Object.keys(this.store)[index] ?? null;
  }
}

Object.defineProperty(globalThis, "localStorage", {
  value: new LocalStorageMock(),
  writable: true,
  configurable: true,
});
