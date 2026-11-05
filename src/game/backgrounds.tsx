import { useId } from "react";
import type { BackgroundDef } from "./types";

/**
 * Original layered SVG backgrounds. Each scene is built from simple shapes so
 * the whole library stays tiny (no downloaded images) while still giving every
 * game its own identity. A few layers drift gently via CSS for depth.
 */

type Kind =
  | "garden"
  | "forest"
  | "mountain"
  | "beach"
  | "ocean"
  | "desert"
  | "snow"
  | "candy"
  | "castle"
  | "cave"
  | "city"
  | "lab"
  | "space"
  | "station"
  | "island"
  | "temple"
  | "jungle"
  | "clouds"
  | "park"
  | "school"
  | "computer"
  | "night"
  | "river";

interface BgConfig {
  kind: Kind;
  sky: [string, string];
  ground: string;
  ground2: string;
  accent: string;
  night?: boolean;
}

const BACKGROUNDS: BackgroundDef[] = [
  { key: "garden-day", name: "Sunny garden", category: "Nature", tags: ["garden", "flowers", "day"] },
  { key: "garden-morning", name: "Misty morning garden", category: "Nature", tags: ["garden", "morning"] },
  { key: "forest-day", name: "Green forest", category: "Nature", tags: ["forest", "trees"] },
  { key: "flower-field", name: "Flower field", category: "Nature", tags: ["flowers", "meadow"] },
  { key: "mountains", name: "Mountain peaks", category: "Nature", tags: ["mountain", "hills"] },
  { key: "waterfall", name: "Waterfall", category: "Nature", tags: ["water", "rocks"] },
  { key: "beach", name: "Sunny beach", category: "Nature", tags: ["sea", "sand"] },
  { key: "ocean", name: "Coral reef", category: "Nature", tags: ["underwater", "fish"] },
  { key: "river", name: "River bend", category: "Nature", tags: ["water", "trees"] },
  { key: "desert", name: "Desert dunes", category: "Nature", tags: ["sand", "cactus"] },
  { key: "snow", name: "Snowy valley", category: "Seasonal", tags: ["winter", "snow"] },
  { key: "savanna", name: "Savanna", category: "Nature", tags: ["grass", "sunset"] },
  { key: "candy", name: "Candy kingdom", category: "Fantasy", tags: ["candy", "sweets"] },
  { key: "magical-kingdom", name: "Magical kingdom", category: "Fantasy", tags: ["castle", "magic"] },
  { key: "fairy-forest", name: "Fairy forest", category: "Fantasy", tags: ["magic", "forest"] },
  { key: "castle", name: "Enchanted castle", category: "Fantasy", tags: ["castle", "night"] },
  { key: "cave", name: "Crystal cave", category: "Fantasy", tags: ["cave", "crystals"] },
  { key: "fantasy-village", name: "Fantasy village", category: "Fantasy", tags: ["village", "houses"] },
  { key: "city-day", name: "City street", category: "City", tags: ["city", "buildings"] },
  { key: "city-night", name: "City at night", category: "City", tags: ["city", "night"] },
  { key: "street", name: "Quiet street", category: "City", tags: ["street", "houses"] },
  { key: "school", name: "School yard", category: "City", tags: ["school", "playground"] },
  { key: "park", name: "Town park", category: "City", tags: ["park", "trees"] },
  { key: "shops", name: "Shop row", category: "City", tags: ["shops", "street"] },
  { key: "lab", name: "Coding lab", category: "Technology", tags: ["lab", "coding"] },
  { key: "robot-factory", name: "Robot factory", category: "Technology", tags: ["factory", "robots"] },
  { key: "space-station", name: "Space station", category: "Technology", tags: ["space", "station"] },
  { key: "future-city", name: "Future city", category: "Technology", tags: ["future", "city"] },
  { key: "computer-world", name: "Computer world", category: "Technology", tags: ["computer", "circuits"] },
  { key: "space", name: "Deep space", category: "Space", tags: ["space", "stars"] },
  { key: "moon", name: "Moon base", category: "Space", tags: ["moon", "space"] },
  { key: "pirate-island", name: "Pirate island", category: "Adventure", tags: ["pirate", "island"] },
  { key: "treasure-cave", name: "Treasure cave", category: "Adventure", tags: ["treasure", "cave"] },
  { key: "temple", name: "Ancient temple", category: "Adventure", tags: ["temple", "jungle"] },
  { key: "jungle", name: "Jungle adventure", category: "Adventure", tags: ["jungle", "leaves"] },
  { key: "clouds", name: "Cloud kingdom", category: "Fantasy", tags: ["clouds", "sky"] },
  { key: "spring", name: "Spring day", category: "Seasonal", tags: ["spring", "flowers"] },
  { key: "summer", name: "Summer sky", category: "Seasonal", tags: ["summer", "sun"] },
  { key: "autumn", name: "Autumn woods", category: "Seasonal", tags: ["autumn", "leaves"] },
  { key: "winter", name: "Winter wonderland", category: "Seasonal", tags: ["winter", "snow"] },
  { key: "night", name: "Starry night", category: "Seasonal", tags: ["night", "stars"] },
];

const CONFIG: Record<string, BgConfig> = {
  "garden-day": { kind: "garden", sky: ["#BAE6FD", "#ECFDF5"], ground: "#4ADE80", ground2: "#22C55E", accent: "#FFC300" },
  "garden-morning": { kind: "garden", sky: ["#FBCFE8", "#FEF3C7"], ground: "#86EFAC", ground2: "#4ADE80", accent: "#FDE68A" },
  "forest-day": { kind: "forest", sky: ["#A7F3D0", "#ECFDF5"], ground: "#15803D", ground2: "#166534", accent: "#22C55E" },
  "flower-field": { kind: "garden", sky: ["#BFDBFE", "#FEF9C3"], ground: "#86EFAC", ground2: "#4ADE80", accent: "#F472B6" },
  mountains: { kind: "mountain", sky: ["#BAE6FD", "#E0F2FE"], ground: "#475569", ground2: "#334155", accent: "#F8FAFC" },
  waterfall: { kind: "mountain", sky: ["#CFFAFE", "#ECFEFF"], ground: "#0E7490", ground2: "#155E75", accent: "#67E8F9" },
  beach: { kind: "beach", sky: ["#7DD3FC", "#FEF3C7"], ground: "#FDE68A", ground2: "#F59E0B", accent: "#38BDF8" },
  ocean: { kind: "ocean", sky: ["#0369A1", "#0EA5E9"], ground: "#FDE68A", ground2: "#F59E0B", accent: "#67E8F9" },
  river: { kind: "river", sky: ["#BAE6FD", "#F0FDF4"], ground: "#22C55E", ground2: "#15803D", accent: "#38BDF8" },
  desert: { kind: "desert", sky: ["#FDBA74", "#FEF3C7"], ground: "#FCD34D", ground2: "#F59E0B", accent: "#EA580C" },
  snow: { kind: "snow", sky: ["#E0F2FE", "#F8FAFC"], ground: "#F1F5F9", ground2: "#CBD5E1", accent: "#BAE6FD", night: false },
  savanna: { kind: "desert", sky: ["#FB923C", "#FDE68A"], ground: "#D97706", ground2: "#B45309", accent: "#F59E0B" },
  candy: { kind: "candy", sky: ["#F9A8D4", "#FDE68A"], ground: "#FBCFE8", ground2: "#F472B6", accent: "#A855F7" },
  "magical-kingdom": { kind: "castle", sky: ["#A5B4FC", "#FBCFE8"], ground: "#4ADE80", ground2: "#22C55E", accent: "#FDE047" },
  "fairy-forest": { kind: "forest", sky: ["#C4B5FD", "#FDF2F8"], ground: "#15803D", ground2: "#065F46", accent: "#F0ABFC", night: true },
  castle: { kind: "castle", sky: ["#1E1B4B", "#4C1D95"], ground: "#312E81", ground2: "#1E1B4B", accent: "#FDE047", night: true },
  cave: { kind: "cave", sky: ["#1E1B4B", "#3B0764"], ground: "#312E81", ground2: "#1E1B4B", accent: "#67E8F9", night: true },
  "fantasy-village": { kind: "castle", sky: ["#FED7AA", "#FDE68A"], ground: "#4ADE80", ground2: "#16A34A", accent: "#F97316" },
  "city-day": { kind: "city", sky: ["#93C5FD", "#DBEAFE"], ground: "#64748B", ground2: "#475569", accent: "#FFC300" },
  "city-night": { kind: "city", sky: ["#0F172A", "#1E3A8A"], ground: "#1E293B", ground2: "#0F172A", accent: "#FDE047", night: true },
  street: { kind: "city", sky: ["#BAE6FD", "#F0F9FF"], ground: "#94A3B8", ground2: "#64748B", accent: "#F472B6" },
  school: { kind: "school", sky: ["#93C5FD", "#E0F2FE"], ground: "#4ADE80", ground2: "#22C55E", accent: "#F97316" },
  park: { kind: "park", sky: ["#BAE6FD", "#ECFDF5"], ground: "#4ADE80", ground2: "#16A34A", accent: "#FFC300" },
  shops: { kind: "city", sky: ["#FDE68A", "#FEF3C7"], ground: "#94A3B8", ground2: "#64748B", accent: "#EF4444" },
  lab: { kind: "lab", sky: ["#0F172A", "#134E4A"], ground: "#1E293B", ground2: "#0F172A", accent: "#22D3EE", night: true },
  "robot-factory": { kind: "lab", sky: ["#1E293B", "#7C2D12"], ground: "#334155", ground2: "#1E293B", accent: "#FB923C", night: true },
  "space-station": { kind: "station", sky: ["#020617", "#172554"], ground: "#1E293B", ground2: "#0F172A", accent: "#38BDF8", night: true },
  "future-city": { kind: "city", sky: ["#0F172A", "#4C1D95"], ground: "#1E293B", ground2: "#111827", accent: "#22D3EE", night: true },
  "computer-world": { kind: "computer", sky: ["#052E16", "#0F172A"], ground: "#16A34A", ground2: "#065F46", accent: "#4ADE80", night: true },
  space: { kind: "space", sky: ["#020617", "#1E1B4B"], ground: "#1E293B", ground2: "#0F172A", accent: "#FDE047", night: true },
  moon: { kind: "space", sky: ["#020617", "#111827"], ground: "#64748B", ground2: "#475569", accent: "#E2E8F0", night: true },
  "pirate-island": { kind: "island", sky: ["#38BDF8", "#FEF3C7"], ground: "#FDE68A", ground2: "#D97706", accent: "#0EA5E9" },
  "treasure-cave": { kind: "cave", sky: ["#1C1917", "#78350F"], ground: "#44403C", ground2: "#292524", accent: "#FACC15", night: true },
  temple: { kind: "temple", sky: ["#FCD34D", "#FEF3C7"], ground: "#65A30D", ground2: "#3F6212", accent: "#B45309" },
  jungle: { kind: "jungle", sky: ["#4ADE80", "#D9F99D"], ground: "#15803D", ground2: "#14532D", accent: "#FDE047" },
  clouds: { kind: "clouds", sky: ["#7DD3FC", "#E0F2FE"], ground: "#BAE6FD", ground2: "#93C5FD", accent: "#FDE047" },
  spring: { kind: "garden", sky: ["#BAE6FD", "#FCE7F3"], ground: "#86EFAC", ground2: "#4ADE80", accent: "#F9A8D4" },
  summer: { kind: "beach", sky: ["#38BDF8", "#FEF9C3"], ground: "#FDE68A", ground2: "#F59E0B", accent: "#F97316" },
  autumn: { kind: "forest", sky: ["#FDBA74", "#FEF3C7"], ground: "#B45309", ground2: "#92400E", accent: "#F59E0B" },
  winter: { kind: "snow", sky: ["#DBEAFE", "#F8FAFC"], ground: "#F8FAFC", ground2: "#E2E8F0", accent: "#7DD3FC" },
  night: { kind: "night", sky: ["#0F172A", "#1E1B4B"], ground: "#166534", ground2: "#14532D", accent: "#FDE047", night: true },
};

function Stars({ count, accent }: { count: number; accent: string }) {
  return (
    <g fill={accent}>
      {Array.from({ length: count }).map((_, i) => {
        const x = ((i * 83) % 930) + 10;
        const y = ((i * 47) % 300) + 10;
        const r = i % 4 === 0 ? 2.2 : 1.2;
        return <circle key={i} cx={x} cy={y} r={r} opacity={0.7} />;
      })}
    </g>
  );
}

function Hills({ ground, ground2 }: { ground: string; ground2: string }) {
  return (
    <g>
      <path d="M0 400c120-90 230-90 340 0s230 90 350 0 180-50 270 10v140H0Z" fill={ground} opacity="0.85" />
      <path d="M0 450c160-70 290-70 440 0s300 60 520-10v100H0Z" fill={ground2} />
    </g>
  );
}

function Trees({ color, y = 330, count = 7 }: { color: string; y?: number; count?: number }) {
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const x = 40 + i * (880 / count);
        const scale = 0.7 + ((i * 13) % 5) / 10;
        return (
          <g key={i} transform={`translate(${x} ${y + (i % 3) * 12}) scale(${scale})`}>
            <rect x="-6" y="0" width="12" height="60" rx="5" fill="#92400E" />
            <circle cx="0" cy="-10" r="30" fill={color} />
            <circle cx="-22" cy="8" r="20" fill={color} opacity="0.9" />
            <circle cx="22" cy="6" r="22" fill={color} opacity="0.9" />
          </g>
        );
      })}
    </g>
  );
}

function City({ ground, accent, night }: { ground: string; accent: string; night?: boolean }) {
  return (
    <g>
      {Array.from({ length: 11 }).map((_, i) => {
        const w = 70 + ((i * 29) % 50);
        const h = 110 + ((i * 61) % 170);
        const x = i * 88 - 12;
        return (
          <g key={i}>
            <rect x={x} y={400 - h} width={w} height={h + 40} rx="4" fill={i % 2 === 0 ? ground : "#334155"} />
            {Array.from({ length: Math.max(2, Math.floor(h / 45)) }).map((__, row) =>
              Array.from({ length: Math.max(2, Math.floor(w / 30)) }).map((___, col) => (
                <rect
                  key={`${row}-${col}`}
                  x={x + 12 + col * 26}
                  y={400 - h + 16 + row * 34}
                  width="12"
                  height="16"
                  rx="2"
                  fill={night ? accent : "#BAE6FD"}
                  opacity={night ? 0.45 + ((i + row + col) % 3) * 0.2 : 0.85}
                />
              )),
            )}
          </g>
        );
      })}
    </g>
  );
}

function Crystals({ accent }: { accent: string }) {
  return (
    <g>
      {Array.from({ length: 9 }).map((_, i) => {
        const x = 60 + i * 105;
        const h = 70 + ((i * 43) % 90);
        return (
          <g key={i}>
            <path d={`M${x} 500 l${18} -${h} l18 ${h}Z`} fill={accent} opacity="0.7" />
            <path d={`M${x + 18} 500 l4 -${h - 20} l8 ${h - 20}Z`} fill="#ffffff" opacity="0.35" />
          </g>
        );
      })}
    </g>
  );
}

function CandyDecor({ accent }: { accent: string }) {
  return (
    <g>
      {Array.from({ length: 5 }).map((_, i) => {
        const x = 100 + i * 190;
        return (
          <g key={i}>
            <rect x={x} y="300" width="10" height="180" rx="5" fill="#F8FAFC" />
            <path d={`M${x + 5} 300c-40-30-40-70 0-70s40 40 0 70Z`} fill={i % 2 === 0 ? accent : "#F472B6"} />
            <circle cx={x + 5} cy="270" r="8" fill="#FDE047" />
          </g>
        );
      })}
    </g>
  );
}

function Castle({ accent, ground }: { accent: string; ground: string }) {
  return (
    <g>
      <rect x="330" y="220" width="300" height="230" fill={ground} />
      <rect x="290" y="260" width="80" height="190" fill={ground} />
      <rect x="590" y="260" width="80" height="190" fill={ground} />
      <path d="M280 260l45-80 45 80Z" fill={accent} />
      <path d="M580 260l45-80 45 80Z" fill={accent} />
      <path d="M310 220l65-100 65 100Z" fill="#4C1D95" />
      <path d="M520 220l65-100 65 100Z" fill="#4C1D95" />
      <rect x="440" y="330" width="80" height="120" rx="38" fill="#312E81" />
      <circle cx="390" cy="320" r="12" fill={accent} />
      <circle cx="570" cy="320" r="12" fill={accent} />
      <path d="M450 180h20v-40h-20Z" fill={accent} />
    </g>
  );
}

export const BACKGROUND_CATEGORIES = [
  "Nature",
  "Fantasy",
  "City",
  "Technology",
  "Adventure",
  "Space",
  "Seasonal",
] as const;

export function backgroundList(): BackgroundDef[] {
  return BACKGROUNDS;
}

export function getBackground(key: string): BackgroundDef {
  return BACKGROUNDS.find((b) => b.key === key) ?? BACKGROUNDS[0];
}

export function BackgroundArt({ background }: { background: string }) {
  const config = CONFIG[background] ?? CONFIG["garden-day"];
  const uid = useId().replace(/:/g, "");
  const skyId = `sky-${uid}`;
  const { sky, ground, ground2, accent, kind, night } = config;

  return (
    <svg
      className="cb-bg-svg"
      viewBox="0 0 960 540"
      preserveAspectRatio="xMidYMid slice"
      role="presentation"
      aria-hidden
    >
      <defs>
        <linearGradient id={skyId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={sky[0]} />
          <stop offset="100%" stopColor={sky[1]} />
        </linearGradient>
      </defs>
      <rect width="960" height="540" fill={`url(#${skyId})`} />

      {night ? <Stars count={40} accent={accent} /> : null}

      {/* sun or moon */}
      <circle cx={kind === "city" ? 820 : 790} cy={kind === "ocean" ? 80 : 90} r={kind === "desert" ? 58 : 46} fill={night ? "#E2E8F0" : accent} opacity={night ? 0.85 : 0.95} />
      {night ? <circle cx="810" cy="80" r="42" fill={sky[0]} opacity="0.55" /> : null}

      {/* soft clouds */}
      <g fill="#FFFFFF" opacity={night ? 0.18 : 0.75} className="cb-bg-drift">
        <ellipse cx="170" cy="110" rx="66" ry="24" />
        <ellipse cx="210" cy="96" rx="40" ry="22" />
        <ellipse cx="130" cy="100" rx="34" ry="18" />
        <ellipse cx="610" cy="150" rx="54" ry="20" />
        <ellipse cx="650" cy="138" rx="35" ry="18" />
      </g>

      {(kind === "garden" || kind === "park" || kind === "school") && (
        <g>
          <Hills ground={ground} ground2={ground2} />
          {kind === "park" ? <Trees color={accent} y={330} count={6} /> : null}
          {kind === "school" ? (
            <g>
              <rect x="300" y="210" width="360" height="210" rx="8" fill="#FEF3C7" />
              <path d="M280 210l200-100 200 100Z" fill="#EF4444" />
              <rect x="455" y="320" width="50" height="100" fill="#92400E" />
              {Array.from({ length: 4 }).map((_, i) => (
                <rect key={i} x={330 + i * 80} y="250" width="40" height="40" rx="4" fill="#BAE6FD" />
              ))}
            </g>
          ) : null}
          {Array.from({ length: 12 }).map((_, i) => (
            <g key={i} transform={`translate(${50 + i * 78} ${470 + (i % 3) * 14}) scale(${0.6 + (i % 4) * 0.12})`}>
              <path d="M0 12v22" stroke="#15803D" strokeWidth="4" />
              <circle cx="0" cy="8" r="7" fill={i % 2 === 0 ? accent : "#F472B6"} />
              <circle cx="0" cy="8" r="3" fill="#FFC300" />
            </g>
          ))}
        </g>
      )}

      {kind === "forest" && (
        <g>
          <Hills ground={ground} ground2={ground2} />
          <Trees color={accent} y={300} count={8} />
          <Trees color={ground2} y={380} count={5} />
        </g>
      )}

      {kind === "mountain" && (
        <g>
          <path d="M0 430L190 150l170 280Z" fill="#475569" />
          <path d="M140 430L360 100l230 330Z" fill="#334155" />
          <path d="M500 430L710 170l250 260Z" fill="#475569" />
          <path d="M280 175l80-75 80 75-40-20-40 30-40-30Z" fill="#F8FAFC" />
          <path d="M600 215l110-45 110 45-60-15-50 25-50-25Z" fill="#F8FAFC" opacity="0.85" />
          {background === "waterfall" ? (
            <g>
              <rect x="430" y="220" width="70" height="220" rx="30" fill="#67E8F9" opacity="0.9" />
              <ellipse cx="465" cy="445" rx="90" ry="20" fill="#38BDF8" opacity="0.7" />
            </g>
          ) : null}
          <Hills ground={ground} ground2={ground2} />
        </g>
      )}

      {kind === "beach" && (
        <g>
          <rect y="330" width="960" height="90" fill="#38BDF8" />
          <path d="M0 350c120 20 240-20 360 0s240 20 360 0 180-10 240 10v50c-80-20-160-30-240-10s-240 20-360 0-240 20-360 0Z" fill="#7DD3FC" opacity="0.8" />
          <path d="M0 420c160-30 300 30 480 0s320-30 480 0v120H0Z" fill={ground} />
          <path d="M0 470c180-20 320 20 480 0s320-20 480 0v70H0Z" fill={ground2} opacity="0.6" />
          <g transform="translate(140 350)">
            <path d="M0 0v110" stroke="#92400E" strokeWidth="9" />
            <path d="M0 0c-50 10-54 46 0 50s54-40 0-50Z" fill="#22C55E" />
            <path d="M0 10c-34 8-38 32 0 36" stroke="#15803D" strokeWidth="4" fill="none" />
          </g>
        </g>
      )}

      {kind === "ocean" && (
        <g>
          <rect width="960" height="540" fill="#0EA5E9" opacity="0.25" />
          <g stroke="#E0F2FE" strokeWidth="26" opacity="0.12">
            <path d="M120 0l90 540M360 0l60 540M700 0l-50 540" />
          </g>
          <path d="M0 450c80-60 160 30 240-10s160-60 240-10 160 50 240 10 160-30 240 20v80H0Z" fill={ground} opacity="0.65" />
          {Array.from({ length: 7 }).map((_, i) => (
            <g key={i} transform={`translate(${80 + i * 130} ${430 + (i % 3) * 20})`}>
              <path d="M0 40V0M0 20L-25 0M0 28L25 6" stroke="#FB7185" strokeWidth="8" strokeLinecap="round" />
              <circle cx="-25" cy="0" r="7" fill="#FDA4AF" />
              <circle cx="25" cy="6" r="7" fill="#FDA4AF" />
            </g>
          ))}
          <g fill="#FFFFFF" opacity="0.35" className="cb-bg-float">
            {Array.from({ length: 12 }).map((_, i) => (
              <circle key={i} cx={80 + ((i * 137) % 800)} cy={100 + ((i * 79) % 330)} r={4 + (i % 4) * 3} />
            ))}
          </g>
        </g>
      )}

      {kind === "river" && (
        <g>
          <Hills ground={ground} ground2={ground2} />
          <path d="M420 540c40-90-20-130 40-190s-10-120 40-180" stroke={accent} strokeWidth="120" fill="none" opacity="0.85" strokeLinecap="round" />
          <path d="M420 540c40-90-20-130 40-190s-10-120 40-180" stroke="#E0F2FE" strokeWidth="60" fill="none" opacity="0.45" strokeLinecap="round" />
          <Trees color={accent} y={300} count={6} />
        </g>
      )}

      {kind === "desert" && (
        <g>
          <path d="M0 420c140-80 260-60 380 0s260 60 400 0 180-30 180 0v120H0Z" fill={ground} />
          <path d="M0 470c180-70 320-40 470 0s300 40 490-10v80H0Z" fill={ground2} opacity="0.75" />
          {Array.from({ length: 5 }).map((_, i) => (
            <g key={i} transform={`translate(${100 + i * 190} ${360 + (i % 2) * 30})`}>
              <rect x="-8" y="0" width="16" height="90" rx="8" fill="#16A34A" />
              <path d="M-8 30h-18a10 10 0 0 0 0 20h18M8 46h18a10 10 0 0 1 0 20H8" stroke="#22C55E" strokeWidth="12" fill="none" strokeLinecap="round" />
            </g>
          ))}
        </g>
      )}

      {kind === "snow" && (
        <g>
          <Hills ground={ground} ground2={ground2} />
          <path d="M0 430c180-70 320 20 480-10s300-40 480 10v110H0Z" fill={ground2} opacity="0.6" />
          {Array.from({ length: 6 }).map((_, i) => (
            <g key={i} transform={`translate(${60 + i * 170} 330) scale(${0.8 + (i % 3) * 0.2})`}>
              <path d="M0 30L-32 100H32Z" fill="#15803D" />
              <path d="M0 0L-24 60H24Z" fill="#16A34A" />
              <rect x="-5" y="100" width="10" height="24" fill="#78350F" />
            </g>
          ))}
          <g fill="#F8FAFC" className="cb-bg-snow">
            {Array.from({ length: 16 }).map((_, i) => (
              <circle key={i} cx={40 + ((i * 107) % 900)} cy={40 + ((i * 67) % 400)} r={3 + (i % 3)} opacity="0.9" />
            ))}
          </g>
        </g>
      )}

      {kind === "candy" && (
        <g>
          <Hills ground={ground} ground2={ground2} />
          <CandyDecor accent={accent} />
          <g transform="translate(760 360)">
            <rect x="0" y="0" width="120" height="130" rx="14" fill="#F9A8D4" />
            <path d="M-12 0h144l-20-50H8Z" fill="#A855F7" />
            <rect x="44" y="60" width="32" height="70" rx="12" fill="#FDE047" />
          </g>
        </g>
      )}

      {(kind === "castle" || kind === "island" || kind === "temple") && (
        <g>
          <Hills ground={ground} ground2={ground2} />
          {kind === "castle" ? <Castle accent={accent} ground="#6D28D9" /> : null}
          {kind === "island" ? (
            <g>
              <ellipse cx="480" cy="440" rx="250" ry="80" fill="#FDE68A" />
              <path d="M430 430c0-80 10-110 10-110h20s10 30 10 110Z" fill="#92400E" />
              <path d="M460 300c-50-10-70 10-70 20s40 10 70 10 70 0 70-10-20-30-70-20Z" fill="#22C55E" />
              <path d="M600 420l80-100 80 100Z" fill="#78350F" />
              <path d="M650 420l30-50 30 50Z" fill="#FDE68A" />
            </g>
          ) : null}
          {kind === "temple" ? (
            <g>
              <rect x="300" y="270" width="360" height="180" fill="#D6D3D1" />
              <path d="M270 270h420l-40-60H310Z" fill="#A8A29E" />
              <path d="M330 210h300l-30-50H360Z" fill="#78716C" />
              {Array.from({ length: 5 }).map((_, i) => (
                <rect key={i} x={330 + i * 66} y="300" width="28" height="150" fill="#A8A29E" />
              ))}
              <rect x="455" y="340" width="50" height="110" fill="#57534E" />
            </g>
          ) : null}
        </g>
      )}

      {kind === "cave" && (
        <g>
          <rect width="960" height="540" fill="#1E1B4B" opacity="0.45" />
          <Hills ground={ground2} ground2={ground} />
          <Crystals accent={accent} />
          <g fill="#312E81" opacity="0.85">
            <path d="M0 0h960v90c-120 50-180-20-300 10S380 140 260 100 90 130 0 70Z" />
            <path d="M640 0h320v230c-90-30-140-120-220-110S690 40 640 0Z" />
          </g>
        </g>
      )}

      {kind === "city" && (
        <g>
          <City ground={ground} accent={accent} night={night} />
          <rect y="430" width="960" height="110" fill={ground2} />
          <path d="M0 485h960" stroke="#FDE047" strokeWidth="6" strokeDasharray="38 30" />
        </g>
      )}

      {kind === "lab" && (
        <g>
          <rect width="960" height="540" fill="#0F172A" opacity="0.35" />
          <g stroke={accent} strokeWidth="3" opacity="0.35" fill="none">
            <path d="M0 120h250v90h180v120h260v-80h270" />
            <path d="M120 540V360h160V240h220v-90h230" />
            <circle cx="250" cy="120" r="7" fill={accent} />
            <circle cx="690" cy="250" r="7" fill={accent} />
            <circle cx="500" cy="240" r="7" fill={accent} />
          </g>
          <g>
            <rect x="80" y="90" width="220" height="130" rx="10" fill="#1E293B" stroke={accent} strokeWidth="3" />
            <rect x="96" y="106" width="188" height="98" rx="5" fill="#042F2E" />
            <path d="M110 150h30l14-24 18 48 14-24h68" stroke="#4ADE80" strokeWidth="4" fill="none" />
            <rect x="640" y="110" width="240" height="150" rx="10" fill="#1E293B" stroke={accent} strokeWidth="3" />
            <circle cx="760" cy="185" r="46" fill="none" stroke="#22D3EE" strokeWidth="14" />
            <circle cx="760" cy="185" r="18" fill="#22D3EE" />
          </g>
          <rect y="450" width="960" height="90" fill="#1E293B" />
          <path d="M0 450h960" stroke="#334155" strokeWidth="6" />
        </g>
      )}

      {kind === "space" && (
        <g>
          <Stars count={60} accent="#FDE047" />
          {Array.from({ length: 4 }).map((_, i) => (
            <g key={i} transform={`translate(${140 + i * 220} ${140 + (i % 2) * 160})`}>
              <circle r={18 + (i % 3) * 10} fill={["#F97316", "#38BDF8", "#A78BFA", "#22C55E"][i]} opacity="0.85" />
              <ellipse rx={36 + i * 8} ry="8" fill="none" stroke="#FDE68A" strokeWidth="4" transform="rotate(-18)" opacity="0.7" />
            </g>
          ))}
          <Hills ground={ground} ground2={ground2} />
        </g>
      )}

      {kind === "station" && (
        <g>
          <Stars count={30} accent="#BAE6FD" />
          <rect width="960" height="540" fill="#020617" opacity="0.25" />
          <g>
            <rect x="0" y="0" width="960" height="60" fill="#334155" />
            <rect x="0" y="480" width="960" height="60" fill="#334155" />
            {Array.from({ length: 4 }).map((_, i) => (
              <g key={i}>
                <rect x={60 + i * 230} y="120" width="150" height="220" rx="18" fill="#0F172A" stroke="#475569" strokeWidth="6" />
                <rect x={76 + i * 230} y="138" width="118" height="184" rx="10" fill="#0C4A6E" />
                <circle cx={105 + i * 230} cy="180" r="6" fill="#FDE047" />
                <circle cx={135 + i * 230} cy="230" r="5" fill="#FDE047" />
              </g>
            ))}
            <path d="M0 400h960" stroke="#475569" strokeWidth="18" />
            <path d="M0 400h960" stroke="#FDE047" strokeWidth="4" strokeDasharray="26 26" />
          </g>
        </g>
      )}

      {kind === "computer" && (
        <g>
          <rect width="960" height="540" fill="#052E16" />
          <g stroke="#22C55E" strokeWidth="2" opacity="0.3">
            {Array.from({ length: 9 }).map((_, i) => (
              <path key={i} d={`M0 ${i * 60 + 30}h960`} />
            ))}
            {Array.from({ length: 17 }).map((_, i) => (
              <path key={i} d={`M${i * 60} 0v540`} />
            ))}
          </g>
          <g fill="#4ADE80" opacity="0.8" className="cb-bg-pulse">
            <rect x="180" y="150" width="180" height="120" rx="10" />
            <rect x="520" y="280" width="240" height="150" rx="10" />
          </g>
          <g fill="#0F172A" fontFamily="monospace" fontSize="22">
            <text x="200" y="200">01001</text>
            <text x="200" y="234">10110</text>
            <text x="550" y="340">{"{ code }"}</text>
            <text x="550" y="374">01011</text>
          </g>
        </g>
      )}

      {kind === "jungle" && (
        <g>
          <Hills ground={ground} ground2={ground2} />
          <Trees color={ground2} y={280} count={10} />
          <g fill={accent} opacity="0.85">
            {Array.from({ length: 8 }).map((_, i) => (
              <path key={i} d={`M${i * 130 - 20} 0c40 50 10 90 50 120 30 24-10 60 20 90`} stroke={accent} strokeWidth="16" fill="none" strokeLinecap="round" />
            ))}
          </g>
        </g>
      )}

      {kind === "clouds" && (
        <g>
          <g fill="#FFFFFF" opacity="0.95">
            {Array.from({ length: 7 }).map((_, i) => (
              <g key={i} transform={`translate(${40 + i * 150} ${340 + (i % 3) * 50}) scale(${0.8 + (i % 3) * 0.25})`}>
                <ellipse rx="80" ry="30" />
                <ellipse cx="-45" cy="6" rx="36" ry="24" />
                <ellipse cx="45" cy="4" rx="40" ry="26" />
              </g>
            ))}
          </g>
          <path d="M0 470c160-40 300 20 480 0s320-30 480 0v70H0Z" fill={ground2} opacity="0.5" />
          <g stroke={accent} strokeWidth="12" fill="none" opacity="0.75">
            <path d="M660 330a90 90 0 0 1 180 0" />
            <path d="M680 330a70 70 0 0 1 140 0" />
            <path d="M700 330a50 50 0 0 1 100 0" />
            <path d="M720 330a30 30 0 0 1 60 0" />
          </g>
        </g>
      )}

      {kind === "night" && (
        <g>
          <Hills ground={ground} ground2={ground2} />
          <Trees color={ground2} y={320} count={7} />
          <g fill="#FDE047" className="cb-bg-twinkle">
            {Array.from({ length: 18 }).map((_, i) => (
              <circle key={i} cx={30 + ((i * 113) % 900)} cy={60 + ((i * 71) % 240)} r={i % 3 === 0 ? 2.6 : 1.4} />
            ))}
          </g>
        </g>
      )}

      {/* gentle darkening for foreground readability */}
      <rect y="470" width="960" height="70" fill="#062D58" opacity="0.08" />
    </svg>
  );
}
