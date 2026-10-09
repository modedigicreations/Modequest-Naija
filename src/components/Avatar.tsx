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
  // Flowing robes are wider than shirts.
  const wide = po === "outfit_agbada" || po === "outfit_carnival" || po === "outfit_kaftan" || po === "outfit_gown";
  const body = wide ? "M6 120 C8 96 28 83 50 83 C72 83 92 96 94 120 Z" : "M18 120 C18 93 32 83 50 83 C68 83 82 93 82 120 Z";
  const trim = po === "outfit_agbada" ? "#d4a017" : po === "outfit_carnival" ? "#14c8c0" : po === "outfit_supporter" ? "#b8860b" : "none";

  return (
    <svg viewBox="0 0 100 120" width={size} height={(size * 120) / 100} className={className} aria-hidden>
      <defs>
        {/* Soft side shading gives every outfit some depth. */}
        <linearGradient id={`shade-${uid}`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity="0.22" />
          <stop offset="0.28" stopColor="#000" stopOpacity="0" />
          <stop offset="0.72" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity="0.22" />
        </linearGradient>
        <linearGradient id={`sheen-${uid}`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.18" />
          <stop offset="0.5" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
      </defs>
      {po && <PremiumOutfitPattern id={`po-${uid}`} outfit={po} />}
      {/* body */}
      <path d={body} fill={bodyFill} stroke={trim} strokeWidth={trim === "none" ? 0 : 1.6} />
      <path d={body} fill={`url(#shade-${uid})`} />
      <path d={body} fill={`url(#sheen-${uid})`} />
      {/* arms */}
      <path d={wide ? "M22 100 C20 108 19 114 19 120 M78 100 C80 108 81 114 81 120" : "M29 98 C28 106 28 113 28 120 M71 98 C72 106 72 113 72 120"} fill="none" stroke="rgba(0,0,0,0.16)" strokeWidth="1.6" strokeLinecap="round" />
      {po && <OutfitDetails outfit={po} />}
      {!po && <path d="M41 83 L50 93 L59 83" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="2" strokeLinejoin="round" />}
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
          <path d="M30 27 L33 8 L42 19 L50 3 L58 19 L67 8 L70 27 Z" fill="#f5c518" stroke="#b8860b" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M30 27 H70 V31 H30 Z" fill="#d9a90f" stroke="#b8860b" strokeWidth="1.2" />
          <path d="M36 12 L40 22" stroke="#fff6c2" strokeWidth="1.4" strokeLinecap="round" opacity="0.8" />
          <circle cx="50" cy="18" r="2.8" fill="#e0457b" stroke="#fff" strokeWidth="0.6" />
          <circle cx="38" cy="23" r="1.9" fill="#2e86ff" />
          <circle cx="62" cy="23" r="1.9" fill="#0f9d58" />
          {[36, 43, 50, 57, 64].map((x) => (
            <circle key={x} cx={x} cy="29" r="0.9" fill="#fff6c2" />
          ))}
        </g>
      )}
      {a.premiumAccessory === "acc_gele" && (
        <g transform="translate(0 6)">
          {/* tall folded gele with pleats and a fan at the side */}
          <path d="M20 36 C14 10 40 -2 52 6 C66 -4 92 8 82 32 C74 22 30 22 20 36 Z" fill="#e0a526" stroke="#a0731a" strokeWidth="1.4" strokeLinejoin="round" />
          <path d="M24 32 C24 16 44 8 52 12 C62 6 80 14 78 28" fill="none" stroke="#f6cf6a" strokeWidth="2.4" opacity="0.8" />
          <path d="M30 22 C40 13 60 13 72 21 M26 29 C40 21 62 21 78 29 M36 15 C44 9 56 9 64 14" fill="none" stroke="#a0731a" strokeWidth="1.1" />
          <path d="M70 8 C80 -2 96 6 88 20 C86 14 80 10 70 8 Z" fill="#f2c14e" stroke="#a0731a" strokeWidth="1.1" />
          <path d="M74 7 L86 15 M78 5 L89 11" stroke="#a0731a" strokeWidth="0.8" />
        </g>
      )}
      {a.premiumAccessory === "acc_red_cap" && (
        <g>
          {/* okpu ododo with a black band and an eagle feather */}
          <path d="M30 31 C29 12 71 12 70 31 Z" fill="#c8102e" />
          <path d="M33 22 C40 15 60 15 67 22" fill="none" stroke="#e8394f" strokeWidth="2" opacity="0.7" />
          <path d="M30 31 H70" stroke="#1d1530" strokeWidth="3" />
          <path d="M64 24 C70 10 80 4 84 6 C80 12 74 20 66 26 Z" fill="#f4ecd8" stroke="#8a7a5a" strokeWidth="0.8" />
          <path d="M66 25 L82 7" stroke="#8a7a5a" strokeWidth="0.7" />
        </g>
      )}
      {a.premiumAccessory === "acc_zanna" && (
        <g>
          {/* embroidered zanna bukar cap */}
          <path d="M31 31 L33 7 C40 1 60 1 67 7 L69 31 Z" fill="#f4ecd8" stroke="#b9a27a" strokeWidth="1.2" />
          <path d="M33 7 C40 12 60 12 67 7" fill="none" stroke="#b9a27a" strokeWidth="1" />
          <path d="M34 15 H66 M34 21 H67 M34 27 H68" stroke="#2f7d4a" strokeWidth="1.2" strokeDasharray="2 1.4" />
          <path d="M50 9 L54 15 L50 21 L46 15 Z" fill="#c8102e" stroke="#7a0a1c" strokeWidth="0.6" />
          <path d="M40 18 l2 -3 l2 3 l-2 3 Z M56 18 l2 -3 l2 3 l-2 3 Z" fill="#2f7d4a" />
        </g>
      )}
      {a.premiumAccessory === "acc_coral" && (
        <g stroke="#a83a19" strokeWidth="0.5">
          {/* two strands of coral beads with a gold clasp */}
          {[[36, 81], [40, 85], [44.5, 87.5], [50, 88.5], [55.5, 87.5], [60, 85], [64, 81]].map(([x, y]) => (
            <circle key={`a${x}`} cx={x} cy={y} r="2" fill="#e2572b" />
          ))}
          {[[38, 89], [43, 93], [50, 95], [57, 93], [62, 89]].map(([x, y]) => (
            <circle key={`b${x}`} cx={x} cy={y} r="2.3" fill="#d4471f" />
          ))}
          {[[44.5, 86.8], [55.5, 86.8], [50, 94.2]].map(([x, y]) => (
            <circle key={`s${x}${y}`} cx={x} cy={y} r="0.6" fill="#ffd2b8" stroke="none" />
          ))}
          <circle cx="50" cy="99" r="2" fill="#d4a017" stroke="#9c7410" />
        </g>
      )}
      {a.premiumAccessory === "acc_chef_hat" && (
        <g transform="translate(0 5)">
          {/* tall pleated toque */}
          <path d="M33 30 L35 18 C26 16 26 2 38 4 C40 -4 60 -4 62 4 C74 2 74 16 65 18 L67 30 Z" fill="#ffffff" stroke="#c8ccd6" strokeWidth="1.4" />
          <path d="M40 18 L40 29 M46 17 L46 29 M52 17 L52 29 M58 17 L58 29 M63 18 L63 29" stroke="#e3e6ee" strokeWidth="1.2" />
          <path d="M33 25 H67 V30 H33 Z" fill="#f1f3f8" stroke="#c8ccd6" strokeWidth="1.2" />
        </g>
      )}
      {a.premiumAccessory === "acc_shades" && (
        <g>
          <path d="M30 44 H70" stroke="#111" strokeWidth="1.6" />
          <rect x="32" y="42" width="16" height="11" rx="4" fill="#111" />
          <rect x="52" y="42" width="16" height="11" rx="4" fill="#111" />
          <path d="M48 46 L52 46" stroke="#111" strokeWidth="2.5" />
          <path d="M35 44.5 L40 44.5 M55 44.5 L60 44.5" stroke="rgba(255,255,255,0.55)" strokeWidth="1.5" strokeLinecap="round" />
          <path d="M43 50 L46 47 M63 50 L66 47" stroke="rgba(120,180,255,0.45)" strokeWidth="1.2" strokeLinecap="round" />
        </g>
      )}
      {a.premiumAccessory === "acc_gradcap" && (
        <g>
          <rect x="35" y="23" width="30" height="10" rx="2" fill="#1d1530" />
          <path d="M18 22 L50 9 L82 22 L50 35 Z" fill="#2a1f45" stroke="#110b20" strokeWidth="1" />
          <circle cx="50" cy="22" r="1.6" fill="#ffc629" />
          <path d="M50 22 L78 24 L80 38" fill="none" stroke="#ffc629" strokeWidth="1.6" />
          <path d="M78 38 L82 38 L81 44 L79 44 Z" fill="#ffc629" />
        </g>
      )}
      {a.premiumAccessory === "acc_headset" && (
        <g>
          <path d="M26 44 C24 14 76 14 74 44" fill="none" stroke="#1d1530" strokeWidth="5.5" />
          <path d="M26 44 C24 14 76 14 74 44" fill="none" stroke="#00d4ff" strokeWidth="2" />
          <rect x="19" y="37" width="11" height="19" rx="4.5" fill="#7b4dff" stroke="#00d4ff" strokeWidth="1.5" />
          <rect x="70" y="37" width="11" height="19" rx="4.5" fill="#7b4dff" stroke="#00d4ff" strokeWidth="1.5" />
          <path d="M22 41 V52 M78 41 V52" stroke="#c6f6ff" strokeWidth="1" opacity="0.7" />
          <path d="M24 54 C26 64 34 66 40 64" fill="none" stroke="#00d4ff" strokeWidth="2" />
          <circle cx="41" cy="64" r="2.6" fill="#00d4ff" />
        </g>
      )}
    </svg>
  );
}

/** Garment details drawn on top of the fabric: collars, embroidery, trims. */
function OutfitDetails({ outfit }: { outfit: string }) {
  switch (outfit) {
    case "outfit_ankara_blue":
    case "outfit_ankara_sunset":
      return <path d="M40 83 C44 90 56 90 60 83" fill="none" stroke={outfit === "outfit_ankara_blue" ? "#ffc629" : "#7b2cbf"} strokeWidth="2.4" strokeLinecap="round" />;
    case "outfit_supporter":
      return (
        <g>
          <path d="M40 83 C44 90 56 90 60 83" fill="none" stroke="#1d1530" strokeWidth="2.4" strokeLinecap="round" />
          <path d="M50 100 l1.6 3.4 3.7.4 -2.8 2.5 .8 3.7 -3.3-1.9 -3.3 1.9 .8-3.7 -2.8-2.5 3.7-.4z" fill="#1d1530" />
        </g>
      );
    case "outfit_agbada":
      return (
        <g>
          {/* inner kaftan and the embroidered chest panel */}
          <path d="M42 84 L50 98 L58 84" fill="#f4efe2" />
          <path d="M34 88 C40 104 60 104 66 88" fill="none" stroke="#d4a017" strokeWidth="2.2" />
          <path d="M38 92 C43 104 57 104 62 92" fill="none" stroke="#d4a017" strokeWidth="1" strokeDasharray="1.6 1.4" />
          <circle cx="50" cy="104" r="2.6" fill="none" stroke="#d4a017" strokeWidth="1.4" />
          <path d="M14 112 C24 104 30 104 34 112 M66 112 C70 104 76 104 86 112" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="1.4" />
        </g>
      );
    case "outfit_jersey":
      return (
        <g>
          <rect x="43" y="84" width="14" height="36" fill="#ffffff" />
          <path d="M41 83 L50 92 L59 83" fill="none" stroke="#ffffff" strokeWidth="3" strokeLinejoin="round" />
          <path d="M41 83 L50 92 L59 83" fill="none" stroke="#0b7a43" strokeWidth="1.2" strokeLinejoin="round" />
          <path d="M22 98 l8 -2 M78 98 l-8 -2" stroke="#ffffff" strokeWidth="2.4" strokeLinecap="round" />
          <text x="50" y="112" fontSize="9" fontWeight="800" textAnchor="middle" fill="#0b7a43">10</text>
        </g>
      );
    case "outfit_gown":
      return (
        <g>
          <path d="M40 84 L50 100 L60 84" fill="#ffffff" />
          {/* hood stole */}
          <path d="M36 84 C38 100 40 110 41 120 L46 120 C44 108 42 98 42 85 Z M64 84 C62 100 60 110 59 120 L54 120 C56 108 58 98 58 85 Z" fill="#f2a900" />
          <path d="M28 104 L28 120 M72 104 L72 120" stroke="rgba(255,255,255,0.08)" strokeWidth="5" />
        </g>
      );
    case "outfit_aso_oke":
      return (
        <g>
          {/* the ipele sash over the shoulder */}
          <path d="M60 83 C66 86 70 90 72 96 L38 120 L28 120 Z" fill="#d4a017" opacity="0.92" />
          <path d="M62 86 L32 120 M68 92 L36 120" stroke="#5b2a86" strokeWidth="1" opacity="0.7" />
          <path d="M40 83 C44 89 56 89 60 83" fill="none" stroke="#d4a017" strokeWidth="2" />
        </g>
      );
    case "outfit_senator":
      return (
        <g>
          {/* band collar and embroidery down the placket */}
          <path d="M41 83 C44 87 56 87 59 83" fill="none" stroke="#e2b93b" strokeWidth="2.2" />
          <path d="M50 86 L50 120" stroke="#e2b93b" strokeWidth="1.4" />
          <path d="M50 92 c-4 0 -6 3 -4 5 c2 2 4 0 4 -2 M50 92 c4 0 6 3 4 5 c-2 2 -4 0 -4 -2" fill="none" stroke="#e2b93b" strokeWidth="1.2" />
          {[100, 107, 114].map((y) => (
            <circle key={y} cx="52.5" cy={y} r="1.2" fill="#e2b93b" />
          ))}
          <path d="M30 108 h8 M62 108 h8" stroke="#e2b93b" strokeWidth="1.2" />
        </g>
      );
    case "outfit_kaftan":
      return (
        <g>
          {/* embroidered bib */}
          <path d="M40 83 L50 106 L60 83" fill="#f7f1e1" opacity="0.55" />
          <path d="M40 83 L50 106 L60 83" fill="none" stroke="#c48a12" strokeWidth="1.8" />
          <path d="M43 84 L50 100 L57 84" fill="none" stroke="#c48a12" strokeWidth="1" strokeDasharray="1.6 1.4" />
          {[[45, 90], [55, 90], [50, 96]].map(([x, y]) => (
            <circle key={`${x}${y}`} cx={x} cy={y} r="1.1" fill="#c48a12" />
          ))}
          <path d="M16 118 h10 M74 118 h10" stroke="#c48a12" strokeWidth="1.6" />
        </g>
      );
    case "outfit_isiagu":
      return (
        <g>
          {/* stand collar with gold edge */}
          <path d="M40 83 C44 87 56 87 60 83" fill="none" stroke="#d4a017" strokeWidth="2.6" />
          <path d="M50 86 L50 98" stroke="#d4a017" strokeWidth="1.2" />
          <circle cx="50" cy="100" r="1.4" fill="#c8102e" />
        </g>
      );
    case "outfit_carnival":
      return (
        <g>
          {/* shoulder plumes and a sequinned neckline */}
          <path d="M14 100 C2 92 0 80 6 74 C10 84 14 90 20 94 Z" fill="#ffd166" />
          <path d="M18 98 C8 86 10 76 16 72 C18 82 20 88 24 92 Z" fill="#14c8c0" />
          <path d="M86 100 C98 92 100 80 94 74 C90 84 86 90 80 94 Z" fill="#ffd166" />
          <path d="M82 98 C92 86 90 76 84 72 C82 82 80 88 76 92 Z" fill="#14c8c0" />
          <path d="M38 84 C44 93 56 93 62 84" fill="none" stroke="#ffd166" strokeWidth="2.6" />
          {[40, 45, 50, 55, 60].map((x) => (
            <circle key={x} cx={x} cy={x === 50 ? 91 : x === 45 || x === 55 ? 89.6 : 87} r="1.2" fill="#ffffff" />
          ))}
        </g>
      );
    case "outfit_chef":
      return (
        <g>
          {/* neckerchief and double-breasted buttons */}
          <path d="M42 83 L50 91 L58 83 Z" fill="#c8102e" />
          <path d="M48 89 L46 96 L50 93 L54 96 L52 89 Z" fill="#a30d26" />
          <path d="M40 92 C46 96 54 96 60 92" fill="none" stroke="#d9dce4" strokeWidth="1.4" />
          {[98, 105, 112].map((y) => (
            <g key={y} fill="#c8ccd6">
              <circle cx="44" cy={y} r="1.5" />
              <circle cx="56" cy={y} r="1.5" />
            </g>
          ))}
        </g>
      );
    default:
      return null;
  }
}

function PremiumOutfitPattern({ id, outfit }: { id: string; outfit: string }) {
  const p = (w: number, h: number, children: React.ReactNode) => (
    <defs>
      <pattern id={id} width={w} height={h} patternUnits="userSpaceOnUse">
        {children}
      </pattern>
    </defs>
  );
  switch (outfit) {
    case "outfit_ankara_blue":
      // Wax-print: concentric "record" circles and little leaves.
      return p(14, 14, <>
        <rect width="14" height="14" fill="#1e5bd8" />
        <circle cx="7" cy="7" r="4.6" fill="#ffc629" />
        <circle cx="7" cy="7" r="3.2" fill="#1e5bd8" />
        <circle cx="7" cy="7" r="1.8" fill="#ffffff" />
        <path d="M0 0 q2 2 0 4 q-2-2 0-4 M14 14 q-2-2 0-4 q2 2 0 4" fill="#ff5a4e" />
      </>);
    case "outfit_ankara_sunset":
      return p(14, 14, <>
        <rect width="14" height="14" fill="#ff7a1a" />
        <path d="M0 7 Q3.5 1 7 7 T14 7" fill="none" stroke="#7b2cbf" strokeWidth="2.4" />
        <path d="M0 11 Q3.5 5 7 11 T14 11" fill="none" stroke="#ffd166" strokeWidth="1" />
        <circle cx="7" cy="2.6" r="1.4" fill="#ffd166" />
      </>);
    case "outfit_supporter":
      return p(12, 12, <>
        <rect width="12" height="12" fill="#f5c518" />
        <path d="M6 1.5 L10.5 6 L6 10.5 L1.5 6 Z" fill="none" stroke="#1d1530" strokeWidth="1.4" />
        <circle cx="6" cy="6" r="1.4" fill="#1d1530" />
      </>);
    case "outfit_agbada":
      return p(8, 8, <>
        <rect width="8" height="8" fill="#fbfaf5" />
        <path d="M0 8 L8 0" stroke="#efe6cf" strokeWidth="0.8" />
      </>);
    case "outfit_jersey":
      return p(10, 10, <>
        <rect width="10" height="10" fill="#0f9d58" />
        <path d="M0 10 L10 0" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
      </>);
    case "outfit_gown":
      return p(10, 10, <rect width="10" height="10" fill="#1d1530" />);
    case "outfit_aso_oke":
      // Hand-woven strips: purple ground, gold bands, a fine metallic thread.
      return p(10, 10, <>
        <rect width="10" height="10" fill="#5b2a86" />
        <rect y="3.2" width="10" height="2.6" fill="#d4a017" />
        <rect y="4.2" width="10" height="0.6" fill="#fff1b8" />
        <rect y="7.8" width="10" height="0.7" fill="#c9a6ff" />
        <path d="M2 0 V3 M6 6 V10" stroke="rgba(255,255,255,0.12)" strokeWidth="0.6" />
      </>);
    case "outfit_senator":
      return p(10, 10, <>
        <rect width="10" height="10" fill="#1f5f3a" />
        <path d="M0 0 L10 10" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      </>);
    case "outfit_kaftan":
      return p(10, 10, <>
        <rect width="10" height="10" fill="#8fc9ec" />
        <path d="M0 10 L10 0" stroke="rgba(255,255,255,0.22)" strokeWidth="0.8" />
      </>);
    case "outfit_isiagu":
      // Velvet black with gold lion-head medallions and red studs.
      return p(16, 16, <>
        <rect width="16" height="16" fill="#151515" />
        <circle cx="8" cy="8" r="4" fill="#d4a017" />
        <circle cx="8" cy="8" r="2.7" fill="#151515" />
        <circle cx="6.9" cy="7.4" r="0.55" fill="#d4a017" />
        <circle cx="9.1" cy="7.4" r="0.55" fill="#d4a017" />
        <path d="M7 9.3 Q8 10.2 9 9.3" fill="none" stroke="#d4a017" strokeWidth="0.6" />
        <path d="M8 2.2 V3.6 M8 12.4 V13.8 M2.2 8 H3.6 M12.4 8 H13.8 M3.9 3.9 l1 1 M12.1 3.9 l-1 1 M3.9 12.1 l1 -1 M12.1 12.1 l-1 -1" stroke="#d4a017" strokeWidth="0.9" />
        <circle cx="0.8" cy="0.8" r="0.9" fill="#c8102e" />
      </>);
    case "outfit_carnival":
      return p(10, 10, <>
        <rect width="10" height="10" fill="#ff3d9a" />
        <circle cx="2.5" cy="2.5" r="1.4" fill="#14c8c0" />
        <circle cx="7.5" cy="7.5" r="1.4" fill="#14c8c0" />
        <circle cx="2.1" cy="2.1" r="0.45" fill="#fff" />
        <path d="M7.5 0.8 L9 2.8 L7.5 4.8 L6 2.8 Z" fill="#ffd166" />
      </>);
    case "outfit_chef":
      return p(10, 10, <rect width="10" height="10" fill="#fdfdfd" />);
    default:
      return null;
  }
}
