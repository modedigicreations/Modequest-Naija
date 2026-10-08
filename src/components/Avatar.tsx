import { useId } from "react";
import type { Appearance } from "@/game/types";

export const SKIN_TONES = ["#5a3825", "#7b4a2e", "#9a6440", "#b9825a", "#d8a47f", "#3f2618"];
export const HAIR_STYLES = ["Low cut", "Afro", "Braids", "Bun", "Twists", "Headwrap", "Bald"];
export const HAIR_COLORS = ["#16110f", "#3a2418", "#6b3b1f", "#c9a227", "#7b4dff", "#e0457b"];
export const OUTFITS = ["#ffc629", "#0f9d58", "#2e86ff", "#ff5a4e", "#7b4dff", "#1d1530", "#f2f2f2"];
export const ACCESSORIES = ["None", "Glasses", "Cap", "Headphones", "Earrings"];

export default function Avatar({ a, size = 96, className }: { a: Appearance; size?: number; className?: string }) {
  const skin = SKIN_TONES[a.skin % SKIN_TONES.length];
  const hair = HAIR_COLORS[a.hairColor % HAIR_COLORS.length];
  const outfit = OUTFITS[a.outfit % OUTFITS.length];
  const style = a.hair % HAIR_STYLES.length;
  const acc = a.premiumAccessory ? -1 : a.accessory % ACCESSORIES.length;
  const uid = useId().replace(/:/g, "");
  const po = a.premiumOutfit;
  const bodyFill = po ? `url(#po-${uid})` : outfit;

  return (
    <svg viewBox="0 0 100 120" width={size} height={(size * 120) / 100} className={className} aria-hidden>
      {po && <PremiumOutfitPattern id={`po-${uid}`} outfit={po} />}
      {/* body */}
      {po === "outfit_agbada" ? (
        <path d="M6 120 C8 94 30 82 50 82 C70 82 92 94 94 120 Z" fill={bodyFill} stroke="#d4a017" strokeWidth="2" />
      ) : po === "outfit_gown" ? (
        <path d="M14 120 C14 90 30 82 50 82 C70 82 86 90 86 120 Z" fill={bodyFill} />
      ) : (
        <path d="M18 120 C18 92 32 82 50 82 C68 82 82 92 82 120 Z" fill={bodyFill} />
      )}
      {po === "outfit_jersey" && <rect x="44" y="84" width="12" height="36" fill="#ffffff" />}
      {po === "outfit_gown" && <path d="M36 84 L50 100 L64 84" fill="#ffffff" />}
      {po === "outfit_agbada" && <path d="M38 86 C44 96 56 96 62 86" fill="none" stroke="#d4a017" strokeWidth="2.5" />}
      <path d="M40 82 L50 96 L60 82" fill="none" stroke="rgba(0,0,0,0.18)" strokeWidth="3" strokeLinejoin="round" />
      {/* neck */}
      <rect x="43" y="68" width="14" height="16" rx="6" fill={skin} />
      {/* braids hang behind the head */}
      {style === 2 && (
        <g fill={hair}>
          <rect x="22" y="40" width="9" height="46" rx="4.5" />
          <rect x="69" y="40" width="9" height="46" rx="4.5" />
          <rect x="30" y="44" width="7" height="40" rx="3.5" />
          <rect x="63" y="44" width="7" height="40" rx="3.5" />
        </g>
      )}
      {/* head */}
      <ellipse cx="50" cy="46" rx="22" ry="25" fill={skin} />
      <ellipse cx="28" cy="48" rx="4" ry="6" fill={skin} />
      <ellipse cx="72" cy="48" rx="4" ry="6" fill={skin} />
      {/* hair */}
      {style === 0 && <path d="M28 40 C28 22 72 22 72 40 C66 32 34 32 28 40 Z" fill={hair} />}
      {style === 1 && <circle cx="50" cy="30" r="27" fill={hair} />}
      {style === 1 && <ellipse cx="50" cy="48" rx="21" ry="20" fill={skin} />}
      {style === 2 && <path d="M27 42 C26 18 74 18 73 42 C68 30 32 30 27 42 Z" fill={hair} />}
      {style === 3 && (
        <g fill={hair}>
          <circle cx="50" cy="14" r="10" />
          <path d="M28 42 C27 20 73 20 72 42 C66 30 34 30 28 42 Z" />
        </g>
      )}
      {style === 4 && (
        <g fill={hair}>
          <path d="M27 42 C26 18 74 18 73 42 C68 30 32 30 27 42 Z" />
          {[32, 40, 48, 56, 64].map((x) => (
            <rect key={x} x={x - 2} y="16" width="5" height="16" rx="2.5" />
          ))}
        </g>
      )}
      {style === 5 && (
        <g>
          <path d="M22 38 C20 10 80 10 78 38 C70 30 30 30 22 38 Z" fill={outfit} stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
          <path d="M60 14 C76 4 86 18 74 26" fill={outfit} stroke="rgba(0,0,0,0.15)" strokeWidth="2" />
        </g>
      )}
      {/* face */}
      <ellipse cx="41" cy="48" rx="2.6" ry="3.2" fill="#1a1110" />
      <ellipse cx="59" cy="48" rx="2.6" ry="3.2" fill="#1a1110" />
      <path d="M42 58 Q50 65 58 58" fill="none" stroke="#1a1110" strokeWidth="2.4" strokeLinecap="round" />
      <ellipse cx="36" cy="56" rx="3.5" ry="2" fill="rgba(255,120,120,0.25)" />
      <ellipse cx="64" cy="56" rx="3.5" ry="2" fill="rgba(255,120,120,0.25)" />
      {/* accessories */}
      {acc === 1 && (
        <g fill="none" stroke="#1d1530" strokeWidth="2.2">
          <circle cx="41" cy="48" r="7" />
          <circle cx="59" cy="48" r="7" />
          <path d="M48 48 L52 48" />
        </g>
      )}
      {acc === 2 && (
        <g>
          <path d="M26 34 C26 14 74 14 74 34 Z" fill="#ff5a4e" />
          <path d="M60 32 L86 34 L74 38 L60 36 Z" fill="#d8443a" />
        </g>
      )}
      {acc === 3 && (
        <g>
          <path d="M26 44 C24 14 76 14 74 44" fill="none" stroke="#1d1530" strokeWidth="4" />
          <rect x="21" y="40" width="9" height="16" rx="4" fill="#1d1530" />
          <rect x="70" y="40" width="9" height="16" rx="4" fill="#1d1530" />
        </g>
      )}
      {acc === 4 && (
        <g fill="#ffc629">
          <circle cx="28" cy="57" r="3" />
          <circle cx="72" cy="57" r="3" />
        </g>
      )}
      {a.premiumAccessory === "acc_crown" && (
        <g>
          <path d="M30 26 L34 8 L42 20 L50 4 L58 20 L66 8 L70 26 Z" fill="#f5c518" stroke="#b8860b" strokeWidth="1.5" strokeLinejoin="round" />
          <circle cx="50" cy="18" r="2.6" fill="#e0457b" />
          <circle cx="38" cy="22" r="2" fill="#2e86ff" />
          <circle cx="62" cy="22" r="2" fill="#0f9d58" />
        </g>
      )}
      {a.premiumAccessory === "acc_shades" && (
        <g>
          <rect x="32" y="42" width="16" height="11" rx="4" fill="#111" />
          <rect x="52" y="42" width="16" height="11" rx="4" fill="#111" />
          <path d="M48 46 L52 46" stroke="#111" strokeWidth="2.5" />
          <path d="M35 44 L40 44" stroke="rgba(255,255,255,0.5)" strokeWidth="1.5" />
        </g>
      )}
      {a.premiumAccessory === "acc_gradcap" && (
        <g>
          <path d="M20 22 L50 10 L80 22 L50 34 Z" fill="#1d1530" />
          <rect x="36" y="24" width="28" height="10" rx="2" fill="#1d1530" />
          <path d="M78 22 L80 38" stroke="#ffc629" strokeWidth="2" />
          <circle cx="80" cy="39" r="2.5" fill="#ffc629" />
        </g>
      )}
      {a.premiumAccessory === "acc_headset" && (
        <g>
          <path d="M26 44 C24 14 76 14 74 44" fill="none" stroke="#00d4ff" strokeWidth="4.5" />
          <rect x="20" y="38" width="10" height="18" rx="4" fill="#7b4dff" stroke="#00d4ff" strokeWidth="1.5" />
          <rect x="70" y="38" width="10" height="18" rx="4" fill="#7b4dff" stroke="#00d4ff" strokeWidth="1.5" />
          <path d="M24 54 C26 64 34 66 40 64" fill="none" stroke="#00d4ff" strokeWidth="2" />
          <circle cx="41" cy="64" r="2.5" fill="#00d4ff" />
        </g>
      )}
    </svg>
  );
}

function PremiumOutfitPattern({ id, outfit }: { id: string; outfit: string }) {
  switch (outfit) {
    case "outfit_ankara_blue":
      return (
        <defs>
          <pattern id={id} width="12" height="12" patternUnits="userSpaceOnUse">
            <rect width="12" height="12" fill="#1e5bd8" />
            <circle cx="6" cy="6" r="3.2" fill="#ffc629" />
            <circle cx="6" cy="6" r="1.4" fill="#ffffff" />
            <path d="M0 0 L3 3 M12 0 L9 3 M0 12 L3 9 M12 12 L9 9" stroke="#ffffff" strokeWidth="1" />
          </pattern>
        </defs>
      );
    case "outfit_ankara_sunset":
      return (
        <defs>
          <pattern id={id} width="14" height="14" patternUnits="userSpaceOnUse">
            <rect width="14" height="14" fill="#ff7a1a" />
            <path d="M0 7 Q3.5 0 7 7 T14 7" fill="none" stroke="#7b2cbf" strokeWidth="2.2" />
            <circle cx="7" cy="11" r="1.6" fill="#ffd166" />
          </pattern>
        </defs>
      );
    case "outfit_supporter":
      return (
        <defs>
          <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#f5c518" />
            <path d="M5 1 L9 5 L5 9 L1 5 Z" fill="#1d1530" />
            <circle cx="5" cy="5" r="1.2" fill="#f5c518" />
          </pattern>
        </defs>
      );
    case "outfit_agbada":
      return (
        <defs>
          <pattern id={id} width="8" height="8" patternUnits="userSpaceOnUse">
            <rect width="8" height="8" fill="#fbfaf5" />
            <circle cx="4" cy="4" r="0.8" fill="#e8dcc0" />
          </pattern>
        </defs>
      );
    case "outfit_jersey":
      return (
        <defs>
          <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#0f9d58" />
            <path d="M0 10 L10 0" stroke="rgba(255,255,255,0.12)" strokeWidth="2" />
          </pattern>
        </defs>
      );
    case "outfit_gown":
      return (
        <defs>
          <pattern id={id} width="10" height="10" patternUnits="userSpaceOnUse">
            <rect width="10" height="10" fill="#1d1530" />
          </pattern>
        </defs>
      );
    default:
      return null;
  }
}
