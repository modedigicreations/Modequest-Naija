import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { COSMETICS, PLAYER_MONTHLY_CAP_NAIRA, PRODUCTS } from "./catalog";

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

describe("store artwork and fair pricing", () => {
  it("every cosmetic is actually drawn on the avatar", () => {
    const avatar = readFileSync(new URL("../components/Avatar.tsx", import.meta.url), "utf8");
    for (const c of COSMETICS) expect(avatar.includes(`"${c.id}"`), `${c.id} has no artwork`).toBe(true);
  });

  it("bundles cost less than buying their items one by one", () => {
    const single = (cosmetic: string) => PRODUCTS.find((p) => p.kind === "cosmetic" && p.grants.cosmetics?.length === 1 && p.grants.cosmetics[0] === cosmetic)?.priceNaira;
    for (const b of PRODUCTS.filter((p) => p.kind === "bundle")) {
      const sum = b.grants.cosmetics!.reduce((a, c) => a + (single(c) ?? 0), 0);
      expect(b.priceNaira, b.id).toBeLessThan(sum);
    }
  });

  it("longer supporter passes cost less per day", () => {
    const perDay = PRODUCTS.filter((p) => p.kind === "supporter").map((p) => [p.grants.supporterDays!, p.priceNaira / p.grants.supporterDays!] as const).sort((a, b) => a[0] - b[0]);
    for (let i = 1; i < perDay.length; i++) expect(perDay[i][1]).toBeLessThan(perDay[i - 1][1]);
  });

  it("no single player purchase can exceed the monthly spending cap", () => {
    for (const p of PRODUCTS.filter((x) => !x.teacherOnly)) expect(p.priceNaira).toBeLessThanOrEqual(PLAYER_MONTHLY_CAP_NAIRA);
  });
});

describe("city collections", () => {
  it("only use real game cities", async () => {
    const { CITIES } = await import("../game/data/world");
    for (const p of PRODUCTS.filter((x) => x.city)) expect(CITIES.some((c) => c.id === p.city), p.id).toBe(true);
  });
});
