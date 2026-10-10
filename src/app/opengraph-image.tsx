import { ImageResponse } from "next/og";
import { CITIES } from "@/game/data/world";

// The picture shown when a ModeQuest link is shared on WhatsApp, X, Facebook…
export const alt = "ModeQuest: Naija — a free life game set in real Nigerian cities";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "52px 64px", background: "linear-gradient(135deg, #0b2d9e 0%, #1447e6 60%, #456aec 100%)", color: "#fff" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 18 }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: "#fff", color: "#1447e6", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 40, fontWeight: 800 }}>M</div>
          <div style={{ fontSize: 30, opacity: 0.9 }}>Mode Digital Creations</div>
          <div style={{ marginLeft: "auto", display: "flex", background: "#e7f6ee", color: "#0a7a43", borderRadius: 999, padding: "10px 24px", fontSize: 28, fontWeight: 700 }}>Free · Plays in your browser</div>
        </div>
        <div style={{ display: "flex", flexDirection: "column" }}>
          <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, letterSpacing: -3 }}>ModeQuest:</div>
          <div style={{ display: "flex", marginTop: 12 }}>
            <div style={{ fontSize: 96, fontWeight: 800, lineHeight: 1, background: "#fff", color: "#1447e6", borderRadius: 28, padding: "4px 28px 14px" }}>Naija</div>
          </div>
          <div style={{ fontSize: 32, marginTop: 20, opacity: 0.95, maxWidth: 980 }}>{`Hustle, learn, dodge scams, beat NEPA and grow your money in ${CITIES.length} real Nigerian cities.`}</div>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "center" }}>
          {CITIES.map((c) => (
            <div key={c.id} style={{ display: "flex", background: "rgba(255,255,255,0.16)", borderRadius: 999, padding: "6px 18px", fontSize: 24, fontWeight: 700 }}>{c.name}</div>
          ))}
          <div style={{ display: "flex", marginLeft: "auto", fontSize: 30, fontWeight: 700, color: "#f2a900" }}>modequest.stream</div>
        </div>
      </div>
    ),
    size,
  );
}
