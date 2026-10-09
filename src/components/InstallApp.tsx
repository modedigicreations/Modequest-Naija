"use client";

import { useEffect, useState } from "react";
import { Modal } from "./ui";

// Android/Chrome offer an install prompt we can trigger; iPhone/iPad never do —
// there, "Add to Home Screen" from Safari's Share menu is the only way.

interface InstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

let deferred: InstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferred = e as InstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    listeners.forEach((l) => l());
  });
}

const isIOS = () =>
  typeof navigator !== "undefined" && (/iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1));
const isInstalled = () =>
  typeof window !== "undefined" &&
  (window.matchMedia?.("(display-mode: standalone)").matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
/** Links opened inside WhatsApp/Instagram/Facebook can't be installed from there. */
const inAppBrowser = () => typeof navigator !== "undefined" && /FBAN|FBAV|Instagram|Line\/|Snapchat|WhatsApp/i.test(navigator.userAgent);

/** "📲 Install app" button: real prompt on Android, step-by-step guide on iPhone/iPad. */
export default function InstallButton({ className = "" }: { className?: string }) {
  // Only rendered after the game has loaded in the browser, so reading navigator here is safe.
  const [installed] = useState(isInstalled);
  const [ios] = useState(isIOS);
  const [, setCanPrompt] = useState(() => !!deferred);
  const [guide, setGuide] = useState(false);

  useEffect(() => {
    const fn = () => setCanPrompt(!!deferred);
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  }, []);

  if (installed) return null;

  const install = async () => {
    if (deferred && !ios) {
      await deferred.prompt();
      await deferred.userChoice.catch(() => null);
      deferred = null;
      setCanPrompt(false);
      return;
    }
    setGuide(true);
  };

  return (
    <>
      <button className={className || "text-sm font-bold text-[var(--brand)]"} onClick={() => void install()}>
        📲 Install app
      </button>
      <Modal open={guide} onClose={() => setGuide(false)} label="Install ModeQuest">
        <h2 className="font-display text-xl font-extrabold">📲 Install ModeQuest</h2>
        <p className="text-sm text-[var(--ink-2)] mt-1">Put ModeQuest on your home screen. It opens full-screen like an app, uses less data and works offline once loaded.</p>
        {ios ? (
          <>
            {inAppBrowser() && (
              <p className="text-sm rounded-xl bg-[var(--coral-soft)] px-3 py-2 mt-3 font-semibold">
                You opened this inside another app. Tap <b>•••</b> or <b>⋯</b> and choose <b>Open in Safari</b> first.
              </p>
            )}
            <ol className="mt-3 space-y-2.5 text-sm">
              <Step n={1}>
                In <b>Safari</b>, tap the <b>Share</b> button <ShareIcon /> (bottom of the screen on iPhone, top on iPad).
              </Step>
              <Step n={2}>
                Scroll down and tap <b>Add to Home Screen</b> <span className="chip">⊞</span>
              </Step>
              <Step n={3}>
                Tap <b>Add</b>. Open ModeQuest from its new icon on your home screen.
              </Step>
            </ol>
            <p className="text-[11px] text-[var(--muted)] mt-3">Using Chrome on iPhone? Tap the Share button <ShareIcon /> in the address bar, then Add to Home Screen.</p>
          </>
        ) : (
          <ol className="mt-3 space-y-2.5 text-sm">
            <Step n={1}>
              Open your browser menu <b>⋮</b> (top right in Chrome).
            </Step>
            <Step n={2}>
              Tap <b>Install app</b> or <b>Add to Home screen</b>.
            </Step>
            <Step n={3}>Confirm, then open ModeQuest from your home screen.</Step>
          </ol>
        )}
        <button className="btn btn-primary w-full mt-4" onClick={() => setGuide(false)}>
          Got it
        </button>
      </Modal>
    </>
  );
}

function Step({ n, children }: { n: number; children: React.ReactNode }) {
  return (
    <li className="flex gap-3 items-start">
      <span className="w-6 h-6 rounded-full bg-[var(--brand)] text-white text-xs font-bold grid place-items-center shrink-0">{n}</span>
      <span>{children}</span>
    </li>
  );
}

/** Safari's share icon (square with an arrow up). */
function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" className="inline -mt-1 text-[var(--brand)]" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label="Share">
      <path d="M12 3v12M8 7l4-4 4 4" />
      <path d="M6 11v8a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2v-8" />
    </svg>
  );
}
