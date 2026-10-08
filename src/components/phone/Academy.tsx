"use client";

import { useEffect, useMemo, useState } from "react";
import { LESSONS, type Lesson } from "@/game/data/lessons";
import { type Cmd, type Frame, type Step, getPuzzle, parsePuzzle, runProgram } from "@/game/puzzles";
import { useGame } from "@/game/store";
import { useSession } from "@/online/session";
import { formatNaira } from "@/game/util";
import { SectionTitle } from "../ui";

const TOPICS = ["Money", "Safety", "Business", "Coding"] as const;

export default function Academy() {
  const game = useGame((s) => s.game)!;
  const assigned = useSession((s) => new Set(s.assignments.map((a) => a.lesson_id)));
  const [open, setOpen] = useState<Lesson | null>(null);

  if (open) return <LessonPlayer lesson={open} onExit={() => setOpen(null)} />;

  const passed = LESSONS.filter((l) => (game.lessons[l.id] ?? 0) >= 60).length;
  return (
    <div className="space-y-3">
      <div className="rounded-3xl p-5 text-white" style={{ background: "linear-gradient(135deg,#ff5a4e,#ff9f1c)" }}>
        <div className="font-display text-2xl font-extrabold">Mode Academy</div>
        <div className="text-sm opacity-90">Pass lessons to earn grants & skills. Time pauses while you learn.</div>
        <div className="h-2.5 rounded-full bg-white/25 mt-3 overflow-hidden">
          <div className="h-full bg-white rounded-full" style={{ width: `${(passed / LESSONS.length) * 100}%` }} />
        </div>
        <div className="text-xs mt-1.5 font-bold">
          {passed}/{LESSONS.length} passed
        </div>
      </div>
      {TOPICS.map((topic) => (
        <div key={topic}>
          <SectionTitle>{topic}</SectionTitle>
          <div className="grid gap-2">
            {LESSONS.filter((l) => l.topic === topic).map((l) => {
              const score = game.lessons[l.id];
              const ok = (score ?? 0) >= 60;
              return (
                <button key={l.id} className="card p-3 flex items-center gap-3 text-left" onClick={() => setOpen(l)}>
                  <span className="text-2xl w-10 h-10 rounded-xl bg-[var(--card-2)] grid place-items-center">{l.emoji}</span>
                  <span className="min-w-0 flex-1">
                    <span className="block font-bold text-sm">
                      {l.title} {assigned.has(l.id) && <span className="chip chip-info">📋 Assigned</span>}
                    </span>
                    <span className="block text-[11px] text-[var(--ink-2)]">{ok ? `Best ${score}% · replay for XP` : `Grant ${formatNaira(l.grant)} · +${l.xp} XP`}</span>
                  </span>
                  {ok ? <span className="chip chip-good">✓</span> : score !== undefined ? <span className="chip chip-bad">{score}%</span> : <span className="chip">New</span>}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}

function LessonPlayer({ lesson, onExit }: { lesson: Lesson; onExit: () => void }) {
  const dispatch = useGame((s) => s.dispatch);
  const hold = useGame((s) => s.hold);
  const [stage, setStage] = useState<"intro" | "play" | "done">("intro");
  const [score, setScore] = useState(0);

  useEffect(() => {
    hold("lesson", true);
    return () => hold("lesson", false);
  }, [hold]);

  const finish = (s: number) => {
    setScore(s);
    dispatch({ type: "completeLesson", lessonId: lesson.id, score: s });
    setStage("done");
  };

  return (
    <div className="anim-up">
      <button className="btn btn-ghost btn-sm mb-3" onClick={onExit}>
        ← Academy
      </button>
      <div className="font-display text-xl font-extrabold">
        {lesson.emoji} {lesson.title}
      </div>

      {stage === "intro" && (
        <div className="mt-3 space-y-2">
          {lesson.intro.map((p) => (
            <p key={p} className="card p-3 text-sm leading-relaxed">
              {p}
            </p>
          ))}
          <button className="btn btn-primary w-full mt-2" onClick={() => setStage("play")}>
            {lesson.kind === "code" ? "Open Code Lab" : "Start"} →
          </button>
        </div>
      )}

      {stage === "play" && lesson.kind === "quiz" && <Quiz lesson={lesson} onDone={finish} />}
      {stage === "play" && lesson.kind === "sort" && <Sorter lesson={lesson} onDone={finish} />}
      {stage === "play" && lesson.kind === "code" && <CodeLab puzzleId={lesson.puzzle!} onDone={finish} />}

      {stage === "done" && (
        <div className="card p-5 mt-4 text-center anim-pop">
          <div className="text-5xl">{score >= 60 ? "🎉" : "📚"}</div>
          <div className="font-display text-2xl font-extrabold mt-2">{score}%</div>
          <p className="text-sm text-[var(--ink-2)] mt-1">{score >= 60 ? "Passed! Check your feed for rewards." : "Score 60% to pass. Review and try again."}</p>
          <div className="flex gap-2 mt-4">
            <button className="btn btn-ghost flex-1" onClick={() => setStage("intro")}>
              Retry
            </button>
            <button className="btn btn-primary flex-1" onClick={onExit}>
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Quiz({ lesson, onDone }: { lesson: Lesson; onDone: (score: number) => void }) {
  const qs = lesson.questions!;
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [correct, setCorrect] = useState(0);
  const q = qs[i];

  return (
    <div className="mt-3">
      <div className="text-xs font-bold text-[var(--muted)]">
        Question {i + 1} of {qs.length}
      </div>
      <p className="font-bold mt-1">{q.q}</p>
      <div className="grid gap-2 mt-3">
        {q.options.map((o, idx) => {
          const show = picked !== null;
          const cls = show ? (idx === q.answer ? "border-[var(--green)] bg-[var(--green-soft)]" : idx === picked ? "border-[var(--coral)] bg-[var(--coral-soft)]" : "border-[var(--line)] bg-[var(--card)]") : "border-[var(--line)] bg-[var(--card)] hover:border-[var(--danfo)]";
          return (
            <button
              key={o}
              disabled={show}
              className={`text-left rounded-2xl border-2 px-3 py-2.5 text-sm font-semibold ${cls}`}
              onClick={() => {
                setPicked(idx);
                if (idx === q.answer) setCorrect((c) => c + 1);
              }}
            >
              {o}
            </button>
          );
        })}
      </div>
      {picked !== null && (
        <div className="mt-3 anim-up">
          <p className="text-sm rounded-2xl bg-[var(--card-2)] p-3">
            {picked === q.answer ? "✅ " : "❌ "}
            {q.explain}
          </p>
          <button
            className="btn btn-primary w-full mt-3"
            onClick={() => {
              if (i + 1 < qs.length) {
                setI(i + 1);
                setPicked(null);
              } else onDone(Math.round((correct / qs.length) * 100));
            }}
          >
            {i + 1 < qs.length ? "Next" : "Finish"}
          </button>
        </div>
      )}
    </div>
  );
}

function Sorter({ lesson, onDone }: { lesson: Lesson; onDone: (score: number) => void }) {
  const { buckets, cards } = lesson.sort!;
  const [i, setI] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [correct, setCorrect] = useState(0);
  const card = cards[i];

  const choose = (b: 0 | 1) => {
    if (feedback) return;
    const ok = b === card.bucket;
    if (ok) setCorrect((c) => c + 1);
    setFeedback(`${ok ? "✅ Correct" : `❌ It's a ${buckets[card.bucket]}`} — ${card.why}`);
  };

  return (
    <div className="mt-3 text-center">
      <div className="text-xs font-bold text-[var(--muted)]">
        {i + 1} / {cards.length}
      </div>
      <div className="card p-6 mt-2 anim-pop" key={i}>
        <div className="text-6xl">{card.emoji}</div>
        <div className="font-display text-xl font-extrabold mt-2">{card.label}</div>
      </div>
      <div className="grid grid-cols-2 gap-2 mt-3">
        <button className="btn btn-green py-3" disabled={!!feedback} onClick={() => choose(0)}>
          {buckets[0]}
        </button>
        <button className="btn btn-coral py-3" disabled={!!feedback} onClick={() => choose(1)}>
          {buckets[1]}
        </button>
      </div>
      {feedback && (
        <div className="anim-up">
          <p className="text-sm mt-3 rounded-2xl bg-[var(--card-2)] p-3">{feedback}</p>
          <button
            className="btn btn-primary w-full mt-3"
            onClick={() => {
              setFeedback(null);
              if (i + 1 < cards.length) setI(i + 1);
              else onDone(Math.round((correct / cards.length) * 100));
            }}
          >
            {i + 1 < cards.length ? "Next" : "Finish"}
          </button>
        </div>
      )}
    </div>
  );
}

const CMD_LABEL: Record<Cmd, string> = { F: "⬆ MOVE", L: "↺ LEFT", R: "↻ RIGHT" };
const DIR_ROT = [0, 90, 180, 270];

function CodeLab({ puzzleId, onDone }: { puzzleId: string; onDone: (score: number) => void }) {
  const puzzle = getPuzzle(puzzleId);
  const meta = useMemo(() => parsePuzzle(puzzle), [puzzle]);
  const [program, setProgram] = useState<Step[]>([]);
  const [frame, setFrame] = useState<Frame>({ x: meta.start.x, y: meta.start.y, dir: puzzle.startDir, coins: [] });
  const [running, setRunning] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [attempts, setAttempts] = useState(0);

  const reset = () => {
    setFrame({ x: meta.start.x, y: meta.start.y, dir: puzzle.startDir, coins: [] });
    setMessage(null);
  };

  const run = () => {
    const result = runProgram(puzzle, program);
    setAttempts((a) => a + 1);
    if (!result.frames.length) {
      setMessage(result.message);
      return;
    }
    setRunning(true);
    let k = 0;
    const id = window.setInterval(() => {
      setFrame(result.frames[k]);
      k += 1;
      if (k >= result.frames.length) {
        window.clearInterval(id);
        setRunning(false);
        setMessage(result.message);
        if (result.outcome === "win") {
          const score = Math.max(60, 100 - attempts * 10);
          window.setTimeout(() => onDone(score), 900);
        }
      }
    }, 280);
  };

  const cell = Math.min(52, Math.floor(320 / Math.max(meta.width, meta.height)));

  return (
    <div className="mt-3">
      <div className="mx-auto rounded-2xl p-2 bg-[var(--card-2)] w-fit">
        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${meta.width}, ${cell}px)` }}>
          {puzzle.grid.flatMap((row, y) =>
            [...row].map((ch, x) => {
              const bot = frame.x === x && frame.y === y;
              const coinKey = `${x},${y}`;
              const coin = ch === "c" && !frame.coins.includes(coinKey);
              return (
                <div
                  key={coinKey}
                  className="rounded-lg grid place-items-center text-xl relative"
                  style={{ width: cell, height: cell, background: ch === "#" ? "var(--ink-2)" : "var(--card)" }}
                >
                  {ch === "#" && "🧱"}
                  {ch === "G" && !bot && "⭐"}
                  {coin && !bot && "🪙"}
                  {bot && (
                    <span className="transition-transform duration-200" style={{ transform: `rotate(${DIR_ROT[frame.dir]}deg)`, display: "inline-block" }}>
                      🔼
                    </span>
                  )}
                </div>
              );
            }),
          )}
        </div>
      </div>
      <p className="text-center text-[11px] text-[var(--muted)] mt-1">🔼 = ByteBot (points the way it faces)</p>

      <div className="flex justify-between items-center mt-3">
        <span className="text-xs font-bold">
          Program ({program.length}/{puzzle.maxSteps} blocks)
        </span>
        <button className="text-xs underline text-[var(--muted)]" disabled={running} onClick={() => { setProgram([]); reset(); }}>
          Clear
        </button>
      </div>
      <div className="min-h-14 rounded-2xl border-2 border-dashed border-[var(--line)] p-2 flex flex-wrap gap-1.5 mt-1">
        {program.length === 0 && <span className="text-xs text-[var(--muted)] p-1">Tap blocks below to build your program. Tap a placed block to repeat it (×2, ×3…). Tap ✕ to remove.</span>}
        {program.map((st, idx) => (
          <span key={idx} className="inline-flex items-center rounded-xl bg-[var(--sky)] text-white text-xs font-bold overflow-hidden">
            <button
              className="px-2 py-1.5"
              disabled={running}
              onClick={() => setProgram((p) => p.map((s, j) => (j === idx ? { ...s, times: s.times >= 5 ? 1 : s.times + 1 } : s)))}
            >
              {CMD_LABEL[st.cmd]} {st.times > 1 ? `×${st.times}` : ""}
            </button>
            <button className="px-1.5 py-1.5 bg-black/20" disabled={running} aria-label="Remove block" onClick={() => setProgram((p) => p.filter((_, j) => j !== idx))}>
              ✕
            </button>
          </span>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 mt-3">
        {(["F", "L", "R"] as Cmd[]).map((c) => (
          <button key={c} className="btn btn-ghost btn-sm" disabled={running || program.length >= puzzle.maxSteps} onClick={() => setProgram((p) => [...p, { cmd: c, times: 1 }])}>
            {CMD_LABEL[c]}
          </button>
        ))}
      </div>
      <button className="btn btn-green w-full mt-3" disabled={running || program.length === 0} onClick={() => { reset(); window.setTimeout(run, 50); }}>
        ▶ Run program
      </button>
      {message && <p className="text-sm text-center mt-3 rounded-2xl bg-[var(--card-2)] p-3 anim-pop">{message}</p>}
    </div>
  );
}
