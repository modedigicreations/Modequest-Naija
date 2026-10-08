import { describe, expect, it } from "vitest";
import { LESSONS, QUIZ_LENGTH, buildQuiz, buildSort, seededRandom } from "./data/lessons";
import { PUZZLES } from "./puzzles";

const mulberry32 = seededRandom;

const quizzes = LESSONS.filter((l) => l.kind === "quiz");

describe("Mode Academy content", () => {
  it("has unique lesson ids", () => {
    expect(new Set(LESSONS.map((l) => l.id)).size).toBe(LESSONS.length);
  });

  for (const l of quizzes) {
    it(`${l.title}: pool is bigger than one attempt and well-formed`, () => {
      const qs = l.questions ?? [];
      expect(qs.length).toBeGreaterThan(QUIZ_LENGTH);
      expect(new Set(qs.map((q) => q.q)).size, "duplicate question").toBe(qs.length);
      for (const q of qs) {
        expect(q.options.length, q.q).toBeGreaterThanOrEqual(2);
        expect(new Set(q.options).size, `duplicate option in: ${q.q}`).toBe(q.options.length);
        expect(q.answer, q.q).toBeGreaterThanOrEqual(0);
        expect(q.answer, q.q).toBeLessThan(q.options.length);
        expect(q.explain.length, q.q).toBeGreaterThan(0);
      }
    });
  }

  it("sort lessons have cards in both buckets", () => {
    for (const l of LESSONS.filter((x) => x.kind === "sort")) {
      const cards = l.sort!.cards;
      expect(new Set(cards.map((c) => c.label)).size).toBe(cards.length);
      expect(cards.some((c) => c.bucket === 0) && cards.some((c) => c.bucket === 1)).toBe(true);
    }
  });

  it("code lessons point at real puzzles", () => {
    for (const l of LESSONS.filter((x) => x.kind === "code")) expect(PUZZLES.some((p) => p.id === l.puzzle), l.id).toBe(true);
  });
});

describe("quiz attempts", () => {
  it("draw QUIZ_LENGTH distinct questions and keep the right answer after shuffling", () => {
    const rand = mulberry32(42);
    for (const l of quizzes) {
      for (let n = 0; n < 20; n++) {
        const attempt = buildQuiz(l, rand);
        expect(attempt).toHaveLength(QUIZ_LENGTH);
        expect(new Set(attempt.map((q) => q.q)).size).toBe(QUIZ_LENGTH);
        for (const q of attempt) {
          const orig = l.questions!.find((x) => x.q === q.q)!;
          expect(q.options[q.answer]).toBe(orig.options[orig.answer]);
          expect([...q.options].sort()).toEqual([...orig.options].sort());
        }
      }
    }
  });

  it("spreads the correct answer across positions", () => {
    const rand = mulberry32(7);
    const counts = [0, 0, 0, 0];
    for (let n = 0; n < 200; n++) for (const q of buildQuiz(quizzes[n % quizzes.length], rand)) counts[q.answer]++;
    for (const c of counts) expect(c).toBeGreaterThan(200);
  });

  it("shuffles sort cards without losing any", () => {
    const l = LESSONS.find((x) => x.kind === "sort")!;
    expect(buildSort(l, mulberry32(3)).map((c) => c.label).sort()).toEqual(l.sort!.cards.map((c) => c.label).sort());
  });
});
