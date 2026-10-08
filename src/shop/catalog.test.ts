import { describe, expect, it } from "vitest";
import { COSMETICS, PRODUCTS } from "./catalog";

describe("store catalog", () => {
  it("has unique ids and sane prices", () => {
    expect(new Set(PRODUCTS.map((p) => p.id)).size).toBe(PRODUCTS.length);
    for (const p of PRODUCTS) {
      expect(Number.isInteger(p.priceNaira) && p.priceNaira >= 100, p.id).toBe(true);
      expect(Object.keys(p.grants).length, p.id).toBeGreaterThan(0);
    }
  });
  it("only grants cosmetics that exist", () => {
    const ids = new Set(COSMETICS.map((c) => c.id));
    for (const p of PRODUCTS) for (const c of p.grants.cosmetics ?? []) expect(ids.has(c), `${p.id} -> ${c}`).toBe(true);
  });
  it("school plans are teacher-only", () => {
    for (const p of PRODUCTS.filter((x) => x.kind === "plan")) expect(p.teacherOnly).toBe(true);
  });
});
