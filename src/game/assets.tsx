/* eslint-disable react-refresh/only-export-components -- Asset catalogue and SVG renderer are one module. */
import type { ReactNode } from "react";
import type { AnimationName, AssetCategory, AssetDef } from "./types";

/**
 * Original, hand-built SVG artwork for the CodeBloom studio.
 * No third-party game art is used. Everything is simple vector art so it stays
 * lightweight, scales cleanly and can be recoloured by costumes.
 */

const SKIN = ["#F7C9A9", "#E8B18C", "#C68863", "#8D5A3B", "#F2D3B8", "#A96B4A"];
const HAIR = ["#3B2416", "#6B3F1D", "#1F2937", "#D97706", "#7C2D12", "#111827", "#F59E0B"];
const SHIRT = ["#22C55E", "#FFC300", "#3B82F6", "#EC4899", "#8B5CF6", "#F97316", "#14B8A6"];
const PANTS = ["#062D58", "#334155", "#7C3AED", "#0F766E", "#92400E"];

function pick<T>(list: T[], index: number): T {
  return list[((index % list.length) + list.length) % list.length];
}

interface PersonProps {
  costume: number;
  style?: "short" | "bob" | "curly" | "bun" | "long" | "cap";
  accessory?: "none" | "glasses" | "backpack" | "crown" | "headphones";
  skinIndex?: number;
}

function Person({ costume, style = "short", accessory = "none", skinIndex }: PersonProps) {
  const skin = pick(SKIN, skinIndex ?? costume + 1);
  const hair = pick(HAIR, costume);
  const shirt = pick(SHIRT, costume);
  const pants = pick(PANTS, costume + 1);

  return (
    <g>
      {/* legs */}
      <rect x="38" y="68" width="10" height="22" rx="5" fill={pants} />
      <rect x="53" y="68" width="10" height="22" rx="5" fill={pants} />
      <rect x="34" y="86" width="16" height="8" rx="4" fill="#062D58" />
      <rect x="51" y="86" width="16" height="8" rx="4" fill="#062D58" />
      {/* body */}
      <rect x="32" y="45" width="36" height="30" rx="14" fill={shirt} />
      <rect x="46" y="48" width="8" height="22" rx="4" fill="#ffffff" opacity="0.35" />
      {/* arms */}
      <rect x="22" y="48" width="10" height="24" rx="5" fill={skin} />
      <rect x="68" y="48" width="10" height="24" rx="5" fill={skin} />
      {/* neck + head */}
      <rect x="45" y="38" width="10" height="10" fill={skin} />
      <circle cx="50" cy="29" r="19" fill={skin} />
      {/* hair */}
      {style === "short" ? (
        <path d="M31 27a19 19 0 0 1 38 0c0-9-6-15-19-15s-19 6-19 15Z" fill={hair} />
      ) : null}
      {style === "bob" ? (
        <path d="M29 30c0-14 8-21 21-21s21 7 21 21v8h-7v-9c-4 4-9 5-14 5s-10-1-14-5v9h-7Z" fill={hair} />
      ) : null}
      {style === "curly" ? (
        <g fill={hair}>
          <circle cx="36" cy="17" r="7" />
          <circle cx="48" cy="12" r="8" />
          <circle cx="61" cy="16" r="7" />
          <circle cx="31" cy="26" r="6" />
          <circle cx="69" cy="26" r="6" />
        </g>
      ) : null}
      {style === "bun" ? (
        <g fill={hair}>
          <path d="M31 27a19 19 0 0 1 38 0c0-10-6-16-19-16s-19 6-19 16Z" />
          <circle cx="50" cy="7" r="7" />
        </g>
      ) : null}
      {style === "long" ? (
        <path d="M29 30c0-15 8-21 21-21s21 6 21 21v22h-8V34c-4 3-8 4-13 4s-9-1-13-4v18h-8Z" fill={hair} />
      ) : null}
      {style === "cap" ? (
        <g fill={hair}>
          <path d="M31 27a19 19 0 0 1 38 0c0-10-6-16-19-16s-19 6-19 16Z" />
          <path d="M28 25h44l-2-8H31Z" fill="#22C55E" />
          <path d="M66 17h15v5H66Z" fill="#16A34A" />
        </g>
      ) : null}
      {/* face */}
      <circle cx="43" cy="30" r="2.2" fill="#062D58" />
      <circle cx="57" cy="30" r="2.2" fill="#062D58" />
      <path d="M44 37c3 3 9 3 12 0" stroke="#062D58" strokeWidth="2" fill="none" strokeLinecap="round" />
      <circle cx="37" cy="35" r="3" fill="#F87171" opacity="0.35" />
      <circle cx="63" cy="35" r="3" fill="#F87171" opacity="0.35" />
      {accessory === "glasses" ? (
        <g stroke="#062D58" strokeWidth="2" fill="none">
          <circle cx="43" cy="30" r="6" />
          <circle cx="57" cy="30" r="6" />
          <path d="M49 30h2" />
        </g>
      ) : null}
      {accessory === "backpack" ? (
        <rect x="27" y="48" width="9" height="22" rx="4" fill="#F59E0B" />
      ) : null}
      {accessory === "crown" ? (
        <path d="M34 16l5 8 6-11 5 11 6-11 5 11 5-8v-7H34Z" fill="#FFC300" stroke="#D97706" strokeWidth="1.5" />
      ) : null}
      {accessory === "headphones" ? (
        <g stroke="#062D58" strokeWidth="4" fill="none">
          <path d="M33 26a17 17 0 0 1 34 0" />
          <rect x="27" y="27" width="7" height="13" rx="3" fill="#22C55E" />
          <rect x="66" y="27" width="7" height="13" rx="3" fill="#22C55E" />
        </g>
      ) : null}
    </g>
  );
}

type AnimalKind =
  | "cat" | "dog" | "rabbit" | "lion" | "bird" | "butterfly" | "fish"
  | "elephant" | "monkey" | "dino" | "penguin" | "fox" | "turtle" | "unicorn";

function Animal({ kind, costume }: { kind: AnimalKind; costume: number }) {
  const base = pick(["#F59E0B", "#94A3B8", "#F97316", "#EAB308", "#A78BFA", "#22C55E", "#38BDF8"], costume);
  const dark = "#334155";
  const cream = "#FFF7ED";

  if (kind === "bird") {
    return (
      <g>
        <ellipse cx="50" cy="58" rx="24" ry="20" fill={base} />
        <circle cx="64" cy="38" r="15" fill={base} />
        <path d="M76 37l13 5-13 5Z" fill="#F59E0B" />
        <circle cx="67" cy="35" r="2.4" fill={dark} />
        <path d="M32 56c-13-8-17 3-5 8 8 3 12 0 12 0Z" fill={pick(SHIRT, costume)} />
        <rect x="42" y="72" width="4" height="12" rx="2" fill="#F59E0B" />
        <rect x="54" y="72" width="4" height="12" rx="2" fill="#F59E0B" />
      </g>
    );
  }
  if (kind === "butterfly") {
    return (
      <g>
        <ellipse cx="50" cy="52" rx="4" ry="22" fill={dark} />
        <ellipse cx="32" cy="42" rx="18" ry="14" fill={pick(SHIRT, costume)} opacity="0.9" />
        <ellipse cx="68" cy="42" rx="18" ry="14" fill={pick(SHIRT, costume + 2)} opacity="0.9" />
        <ellipse cx="35" cy="63" rx="13" ry="10" fill={pick(SHIRT, costume + 1)} opacity="0.85" />
        <ellipse cx="65" cy="63" rx="13" ry="10" fill={pick(SHIRT, costume + 3)} opacity="0.85" />
        <circle cx="50" cy="29" r="7" fill={dark} />
        <path d="M46 24c-4-5-8-6-10-3M54 24c4-5 8-6 10-3" stroke={dark} strokeWidth="2" fill="none" />
      </g>
    );
  }
  if (kind === "fish") {
    return (
      <g>
        <ellipse cx="48" cy="52" rx="30" ry="18" fill={base} />
        <path d="M76 52l16-12v24Z" fill={pick(SHIRT, costume)} />
        <path d="M45 34l8-12 9 12Z" fill={pick(SHIRT, costume + 1)} />
        <circle cx="34" cy="49" r="3" fill={dark} />
        <path d="M40 60c4 3 8 3 12 0" stroke={dark} strokeWidth="2" fill="none" strokeLinecap="round" />
        <path d="M55 37c4 5 5 10 5 15" stroke="#ffffff" strokeWidth="4" opacity="0.4" fill="none" />
      </g>
    );
  }
  if (kind === "penguin") {
    return (
      <g>
        <ellipse cx="50" cy="56" rx="25" ry="30" fill="#0F172A" />
        <ellipse cx="50" cy="60" rx="16" ry="23" fill={cream} />
        <circle cx="50" cy="31" r="18" fill="#0F172A" />
        <circle cx="44" cy="30" r="2.6" fill="#ffffff" />
        <circle cx="56" cy="30" r="2.6" fill="#ffffff" />
        <circle cx="44" cy="30" r="1.3" fill={dark} />
        <circle cx="56" cy="30" r="1.3" fill={dark} />
        <path d="M45 37h10l-5 6Z" fill="#F59E0B" />
        <path d="M25 55l-10 8 12 4Z" fill="#0F172A" />
        <path d="M75 55l10 8-12 4Z" fill="#0F172A" />
        <path d="M38 84h10M52 84h10" stroke="#F59E0B" strokeWidth="6" strokeLinecap="round" />
      </g>
    );
  }
  if (kind === "turtle") {
    return (
      <g>
        <ellipse cx="52" cy="58" rx="33" ry="22" fill={pick(SHIRT, costume)} />
        <path d="M28 54c8-18 40-18 48 0" stroke="#16A34A" strokeWidth="5" fill="none" />
        <circle cx="18" cy="52" r="11" fill="#65A30D" />
        <circle cx="14" cy="49" r="2" fill={dark} />
        <ellipse cx="40" cy="78" rx="7" ry="5" fill="#65A30D" />
        <ellipse cx="64" cy="78" rx="7" ry="5" fill="#65A30D" />
        <path d="M8 58c4 2 8 2 12 0" stroke={dark} strokeWidth="2" fill="none" />
      </g>
    );
  }
  if (kind === "unicorn") {
    return (
      <g>
        <ellipse cx="52" cy="58" rx="30" ry="21" fill={cream} />
        <rect x="32" y="70" width="7" height="18" rx="3" fill={cream} />
        <rect x="64" y="70" width="7" height="18" rx="3" fill={cream} />
        <circle cx="72" cy="44" r="15" fill={cream} />
        <path d="M73 30l4-16 7 16Z" fill="#FFC300" />
        <path d="M62 36c-4 8-2 19 5 25" stroke={pick(SHIRT, costume)} strokeWidth="6" fill="none" strokeLinecap="round" />
        <circle cx="77" cy="42" r="2.4" fill={dark} />
        <path d="M26 58c-6-4-12-2-14 2 5 4 10 4 14 2Z" fill={pick(SHIRT, costume)} />
        <path d="M40 74l7 3M62 74l7 3" stroke="#F59E0B" strokeWidth="3" />
      </g>
    );
  }
  if (kind === "dino") {
    return (
      <g>
        <path d="M20 64c0-16 18-24 38-24 18 0 28 10 28 22 0 15-14 22-34 22-18 0-32-6-32-20Z" fill="#22C55E" />
        <circle cx="76" cy="42" r="18" fill="#22C55E" />
        <path d="M62 28l6-12 6 14M76 24l4-14 8 16" fill="#16A34A" />
        <circle cx="82" cy="41" r="2.6" fill={dark} />
        <path d="M82 51c4 2 7 1 9-1" stroke={dark} strokeWidth="2" fill="none" />
        <path d="M30 84l-2 10M48 86l0 10M64 84l3 10" stroke="#15803D" strokeWidth="7" strokeLinecap="round" />
        <path d="M18 60c-12 2-14 8-8 12 5 3 10 0 10 0Z" fill="#16A34A" />
        <circle cx="44" cy="58" r="4" fill="#A7F3D0" opacity="0.7" />
        <circle cx="58" cy="48" r="3" fill="#A7F3D0" opacity="0.7" />
      </g>
    );
  }

  // Generic four-legged animals: cat, dog, rabbit, lion, elephant, monkey, fox.
  const isRabbit = kind === "rabbit";
  const isElephant = kind === "elephant";
  const isMonkey = kind === "monkey";
  const isLion = kind === "lion";
  const isFox = kind === "fox";
  const body = isFox || isLion ? "#F59E0B" : base;
  return (
    <g>
      <ellipse cx="47" cy="61" rx="29" ry="18" fill={body} />
      <rect x="29" y="72" width="9" height="18" rx="4" fill={body} />
      <rect x="58" y="72" width="9" height="18" rx="4" fill={body} />
      <circle cx="72" cy="42" r={isLion ? 20 : 16} fill={body} />
      {isLion ? (
        <g fill="#B45309">
          {Array.from({ length: 10 }).map((_, i) => (
            <circle key={i} cx={72 + Math.cos((i / 10) * Math.PI * 2) * 18} cy={42 + Math.sin((i / 10) * Math.PI * 2) * 18} r="7" />
          ))}
        </g>
      ) : null}
      {isRabbit ? (
        <g fill={body}>
          <ellipse cx="65" cy="20" rx="6" ry="17" />
          <ellipse cx="79" cy="18" rx="6" ry="19" />
          <ellipse cx="65" cy="21" rx="3" ry="11" fill="#FBCFE8" />
          <ellipse cx="79" cy="19" rx="3" ry="12" fill="#FBCFE8" />
        </g>
      ) : isElephant ? (
        <g fill={body}>
          <ellipse cx="55" cy="40" rx="14" ry="18" />
          <ellipse cx="54" cy="58" rx="7" ry="17" transform="rotate(18 54 58)" />
          <path d="M81 46c9 3 10 11 3 14" stroke={body} strokeWidth="6" fill="none" strokeLinecap="round" />
        </g>
      ) : isMonkey ? (
        <g>
          <circle cx="60" cy="36" r="8" fill="#C2410C" />
          <circle cx="84" cy="36" r="8" fill="#C2410C" />
          <ellipse cx="72" cy="46" rx="11" ry="13" fill="#FDBA74" />
        </g>
      ) : (
        <g fill={body}>
          <path d={kind === "cat" ? "M60 30l-2-16 14 10Z" : "M58 31l-1-18 15 11Z"} />
          <path d={kind === "cat" ? "M84 30l3-16-13 10Z" : "M86 31l2-18-14 11Z"} />
        </g>
      )}
      {isFox ? <path d="M88 50c10-2 14 2 12 7-4 3-9 2-12-1Z" fill="#FDE68A" /> : null}
      <circle cx="78" cy="40" r="2.4" fill={dark} />
      <path d={isMonkey ? "M68 45c3 3 6 3 9 0" : "M62 40c3 2 6 2 9 0"} stroke={dark} strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M79 48l3 3 3-3" fill="#F472B6" />
      <path d={isRabbit ? "M23 52l-5-8 5-2" : "M21 54c-8-8-14 2-4 8 5 3 9 1 9 1Z"} fill={body} />
      {isMonkey ? <path d="M22 58c8-8 16 0 8 8" stroke={body} strokeWidth="6" fill="none" strokeLinecap="round" /> : null}
    </g>
  );
}

function Robot({ costume }: { costume: number }) {
  const body = pick(["#94A3B8", "#CBD5E1", "#7DD3FC", "#C4B5FD"], costume);
  const accent = pick(SHIRT, costume);
  return (
    <g>
      <rect x="30" y="46" width="40" height="32" rx="9" fill={body} stroke="#475569" strokeWidth="2" />
      <rect x="38" y="54" width="24" height="12" rx="4" fill="#0F172A" />
      <circle cx="45" cy="60" r="3" fill="#22C55E" />
      <circle cx="55" cy="60" r="3" fill="#22C55E" />
      <rect x="24" y="50" width="7" height="22" rx="3" fill={accent} />
      <rect x="69" y="50" width="7" height="22" rx="3" fill={accent} />
      <rect x="38" y="77" width="10" height="14" rx="4" fill="#475569" />
      <rect x="53" y="77" width="10" height="14" rx="4" fill="#475569" />
      <rect x="35" y="20" width="30" height="25" rx="8" fill={body} stroke="#475569" strokeWidth="2" />
      <circle cx="45" cy="31" r="4" fill="#38BDF8" />
      <circle cx="56" cy="31" r="4" fill="#38BDF8" />
      <path d="M45 38h11" stroke="#475569" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M50 20v-8" stroke="#475569" strokeWidth="3" />
      <circle cx="50" cy="9" r="5" fill="#FFC300" />
      <rect x="58" y="17" width="5" height="9" rx="2" fill={accent} />
    </g>
  );
}

function Vehicle({ kind, costume }: { kind: "car" | "bus" | "plane" | "rocket" | "boat" | "train" | "drone"; costume: number }) {
  const accent = pick(SHIRT, costume);
  if (kind === "rocket") {
    return (
      <g>
        <path d="M50 8c14 12 20 30 20 48H30c0-18 6-36 20-48Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="2" />
        <circle cx="50" cy="36" r="9" fill="#38BDF8" stroke="#0284C7" strokeWidth="2" />
        <path d="M30 56l-14 16 16-2Z" fill={accent} />
        <path d="M70 56l14 16-16-2Z" fill={accent} />
        <path d="M42 74l8 18 8-18Z" fill="#F59E0B" />
        <path d="M45 78l5 13 5-13Z" fill="#FDE68A" />
      </g>
    );
  }
  if (kind === "plane") {
    return (
      <g>
        <path d="M10 54l72-16 12 10-38 16Z" fill={accent} />
        <path d="M38 52l12-24 9 20Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
        <path d="M42 60l6 20 9-18Z" fill="#F8FAFC" stroke="#94A3B8" strokeWidth="1.5" />
        <path d="M80 48l12 3-8 8Z" fill="#F8FAFC" />
        <circle cx="56" cy="54" r="3" fill="#0F172A" />
      </g>
    );
  }
  if (kind === "boat") {
    return (
      <g>
        <path d="M12 60h76l-12 20H26Z" fill="#B45309" />
        <rect x="47" y="14" width="5" height="46" fill="#78350F" />
        <path d="M52 18l28 34H52Z" fill={accent} />
        <path d="M47 22L24 52h23Z" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
        <path d="M8 84c8-6 14 6 22 0s14 6 22 0 14 6 22 0 10 4 18 0" stroke="#38BDF8" strokeWidth="4" fill="none" />
      </g>
    );
  }
  if (kind === "drone") {
    return (
      <g>
        <rect x="34" y="42" width="32" height="20" rx="8" fill="#475569" />
        <circle cx="50" cy="52" r="5" fill="#38BDF8" />
        <path d="M34 44L16 32M66 44l18-12M34 60L16 72M66 60l18 12" stroke="#94A3B8" strokeWidth="3" />
        <ellipse cx="14" cy="30" rx="12" ry="4" fill={accent} />
        <ellipse cx="86" cy="30" rx="12" ry="4" fill={accent} />
        <ellipse cx="14" cy="74" rx="12" ry="4" fill={accent} />
        <ellipse cx="86" cy="74" rx="12" ry="4" fill={accent} />
      </g>
    );
  }
  const isBus = kind === "bus";
  const isTrain = kind === "train";
  return (
    <g>
      <rect x="8" y={isBus ? 30 : 42} width="84" height={isBus ? 36 : 28} rx="10" fill={isTrain ? "#DC2626" : accent} />
      <rect x="18" y={isBus ? 36 : 48} width="22" height="13" rx="3" fill="#BAE6FD" />
      <rect x="45" y={isBus ? 36 : 48} width="22" height="13" rx="3" fill="#BAE6FD" />
      {isBus ? <rect x="72" y="36" width="14" height="22" rx="3" fill="#BAE6FD" /> : null}
      {isTrain ? (
        <g>
          <rect x="70" y="18" width="12" height="16" rx="2" fill="#7F1D1D" />
          <path d="M82 20c8 1 8 8 0 8" stroke="#CBD5E1" strokeWidth="4" fill="none" />
          <circle cx="24" cy="74" r="9" fill="#334155" />
          <circle cx="60" cy="74" r="9" fill="#334155" />
        </g>
      ) : (
        <g>
          <circle cx="27" cy={isBus ? 70 : 72} r="10" fill="#1E293B" />
          <circle cx="73" cy={isBus ? 70 : 72} r="10" fill="#1E293B" />
          <circle cx="27" cy={isBus ? 70 : 72} r="4" fill="#CBD5E1" />
          <circle cx="73" cy={isBus ? 70 : 72} r="4" fill="#CBD5E1" />
          <rect x="84" y="52" width="9" height="6" rx="2" fill="#FDE68A" />
        </g>
      )}
    </g>
  );
}

function ObjectArt({ asset, costume }: { asset: string; costume: number }) {
  const accent = pick(SHIRT, costume);
  switch (asset) {
    case "coin":
      return (
        <g>
          <circle cx="50" cy="50" r="31" fill="#F59E0B" stroke="#B45309" strokeWidth="4" />
          <circle cx="50" cy="50" r="22" fill="#FDE047" />
          <path d="M50 35v30M43 42h12a6 6 0 0 1 0 12H45" stroke="#B45309" strokeWidth="4" fill="none" strokeLinecap="round" />
        </g>
      );
    case "gem":
      return (
        <g>
          <path d="M50 12l30 24-30 52L20 36Z" fill={accent} stroke="#0E7490" strokeWidth="2" />
          <path d="M20 36h60L50 88Z" fill="#67E8F9" opacity="0.55" />
          <path d="M50 12l10 24H40Z" fill="#ECFEFF" opacity="0.8" />
        </g>
      );
    case "key":
      return (
        <g>
          <circle cx="32" cy="34" r="18" fill="none" stroke="#FFC300" strokeWidth="9" />
          <path d="M44 46l38 38M64 66l10-10M74 76l10-10" stroke="#F59E0B" strokeWidth="9" strokeLinecap="round" />
        </g>
      );
    case "chest":
      return (
        <g>
          <rect x="14" y="44" width="72" height="38" rx="7" fill="#B45309" />
          <path d="M14 44c0-16 14-22 36-22s36 6 36 22Z" fill="#92400E" />
          <rect x="14" y="46" width="72" height="7" fill="#F59E0B" />
          <rect x="44" y="52" width="12" height="16" rx="3" fill="#FFC300" />
          <circle cx="50" cy="58" r="2.5" fill="#78350F" />
        </g>
      );
    case "gear":
      return (
        <g fill="#94A3B8" stroke="#475569" strokeWidth="2">
          {Array.from({ length: 8 }).map((_, i) => (
            <rect key={i} x="44" y="8" width="12" height="18" rx="3" transform={`rotate(${i * 45} 50 50)`} />
          ))}
          <circle cx="50" cy="50" r="27" fill="#CBD5E1" />
          <circle cx="50" cy="50" r="11" fill="#475569" />
        </g>
      );
    case "console":
      return (
        <g>
          <rect x="14" y="34" width="72" height="48" rx="7" fill="#1E293B" />
          <rect x="20" y="40" width="60" height="26" rx="3" fill="#38BDF8" />
          <path d="M26 52l8-6v12M34 52h10M56 48v10M52 53h8" stroke="#0F172A" strokeWidth="2" />
          <rect x="28" y="70" width="44" height="6" rx="3" fill="#22C55E" />
        </g>
      );
    case "crate":
      return (
        <g>
          <rect x="16" y="20" width="68" height="64" rx="5" fill="#B45309" stroke="#78350F" strokeWidth="3" />
          <path d="M16 36h68M16 68h68M33 20v64M67 20v64" stroke="#92400E" strokeWidth="4" />
        </g>
      );
    case "door":
      return (
        <g>
          <rect x="22" y="12" width="56" height="78" rx="8" fill="#92400E" />
          <rect x="30" y="20" width="40" height="62" rx="4" fill="#B45309" />
          <circle cx="63" cy="52" r="4" fill="#FFC300" />
          <rect x="46" y="34" width="8" height="24" rx="3" fill="#78350F" />
        </g>
      );
    case "flag":
      return (
        <g>
          <path d="M24 10v80" stroke="#475569" strokeWidth="6" strokeLinecap="round" />
          <path d="M28 14h50l-12 16 12 16H28Z" fill={accent} />
        </g>
      );
    case "sign":
      return (
        <g>
          <rect x="45" y="42" width="10" height="46" rx="4" fill="#92400E" />
          <rect x="14" y="16" width="72" height="34" rx="7" fill="#FDE68A" stroke="#B45309" strokeWidth="3" />
          <path d="M26 28h38M26 38h24" stroke="#92400E" strokeWidth="4" strokeLinecap="round" />
        </g>
      );
    case "cone":
      return (
        <g>
          <path d="M38 16h24l24 64H14Z" fill="#F97316" stroke="#C2410C" strokeWidth="3" />
          <rect x="10" y="78" width="80" height="12" rx="5" fill="#EA580C" />
          <rect x="36" y="40" width="28" height="10" rx="3" fill="#FFF7ED" />
          <rect x="31" y="58" width="38" height="10" rx="3" fill="#FFF7ED" />
        </g>
      );
    case "apple":
      return (
        <g>
          <circle cx="42" cy="56" r="25" fill="#EF4444" />
          <circle cx="60" cy="56" r="22" fill="#DC2626" />
          <path d="M50 32c0-8 4-12 10-14" stroke="#78350F" strokeWidth="5" fill="none" strokeLinecap="round" />
          <path d="M50 30c8-10 20-8 18 0-6 4-14 4-18 0Z" fill="#22C55E" />
        </g>
      );
    case "potion":
      return (
        <g>
          <rect x="42" y="12" width="16" height="18" rx="3" fill="#94A3B8" />
          <path d="M38 30h24l10 22a22 22 0 1 1-44 0Z" fill="#A855F7" />
          <path d="M30 64a22 22 0 0 1 40 0Z" fill="#D8B4FE" />
          <circle cx="44" cy="70" r="3" fill="#F5D0FE" />
        </g>
      );
    case "battery":
      return (
        <g>
          <rect x="18" y="30" width="62" height="40" rx="7" fill="#22C55E" stroke="#15803D" strokeWidth="3" />
          <rect x="80" y="42" width="8" height="16" rx="2" fill="#15803D" />
          <path d="M48 36l-10 16h9l-3 14 14-20h-9Z" fill="#FDE047" />
        </g>
      );
    case "hamburger":
      return (
        <g>
          <path d="M16 38c0-16 16-22 34-22s34 6 34 22Z" fill="#F59E0B" />
          <rect x="14" y="38" width="72" height="10" rx="5" fill="#22C55E" />
          <rect x="14" y="48" width="72" height="10" rx="5" fill="#92400E" />
          <path d="M14 58h72c0 14-16 22-36 22s-36-8-36-22Z" fill="#F59E0B" />
          <circle cx="38" cy="28" r="2" fill="#FEF3C7" />
          <circle cx="58" cy="26" r="2" fill="#FEF3C7" />
          <circle cx="48" cy="33" r="2" fill="#FEF3C7" />
        </g>
      );
    default:
      return (
        <g>
          <rect x="20" y="20" width="60" height="60" rx="12" fill={accent} />
          <circle cx="50" cy="50" r="16" fill="#ffffff" opacity="0.6" />
        </g>
      );
  }
}

function DecorationArt({ asset, costume }: { asset: string; costume: number }) {
  const accent = pick(SHIRT, costume);
  switch (asset) {
    case "crystal":
      return (
        <g>
          <path d="M50 6l26 30-10 52H34L24 36Z" fill="#67E8F9" stroke="#0E7490" strokeWidth="3" />
          <path d="M50 6l10 30-10 52-10-52Z" fill="#A5F3FC" opacity="0.85" />
          <path d="M24 36h52" stroke="#0E7490" strokeWidth="3" />
          <path d="M34 88l16-52 16 52Z" fill="#CFFAFE" opacity="0.35" />
          <circle cx="34" cy="26" r="3" fill="#ECFEFF" />
          <circle cx="70" cy="52" r="2.5" fill="#ECFEFF" />
        </g>
      );
    case "tree":
      return (
        <g>
          <rect x="44" y="52" width="12" height="42" rx="5" fill="#92400E" />
          <circle cx="50" cy="38" r="27" fill="#16A34A" />
          <circle cx="31" cy="48" r="18" fill="#22C55E" />
          <circle cx="69" cy="48" r="18" fill="#15803D" />
          <circle cx="50" cy="24" r="16" fill="#4ADE80" />
        </g>
      );
    case "pine":
      return (
        <g>
          <rect x="45" y="68" width="10" height="28" rx="3" fill="#78350F" />
          <path d="M50 6L24 44h16L18 70h64L60 44h16Z" fill="#15803D" />
          <path d="M50 18L30 48h40Z" fill="#22C55E" />
        </g>
      );
    case "flower":
      return (
        <g>
          <path d="M50 54v38" stroke="#15803D" strokeWidth="5" strokeLinecap="round" />
          <path d="M50 72c-14 0-18-10-18-10s14-4 18 10ZM50 64c14 0 18-10 18-10s-14-4-18 10Z" fill="#22C55E" />
          {Array.from({ length: 6 }).map((_, i) => (
            <ellipse key={i} cx="50" cy="28" rx="10" ry="15" fill={accent} transform={`rotate(${i * 60} 50 36)`} />
          ))}
          <circle cx="50" cy="36" r="9" fill="#FFC300" />
        </g>
      );
    case "sunflower":
      return (
        <g>
          <path d="M50 50v44" stroke="#15803D" strokeWidth="7" strokeLinecap="round" />
          <path d="M50 74c-16 0-20-12-20-12s16-4 20 12ZM50 64c16 0 20-12 20-12s-16-4-20 12Z" fill="#22C55E" />
          {Array.from({ length: 12 }).map((_, i) => (
            <ellipse key={i} cx="50" cy="22" rx="8" ry="16" fill="#FACC15" transform={`rotate(${i * 30} 50 36)`} />
          ))}
          <circle cx="50" cy="36" r="14" fill="#92400E" />
          <circle cx="46" cy="33" r="2" fill="#FDE68A" />
          <circle cx="55" cy="40" r="2" fill="#FDE68A" />
        </g>
      );
    case "mushroom":
      return (
        <g>
          <path d="M38 50h24v34a12 12 0 0 1-24 0Z" fill="#FEF3C7" />
          <path d="M12 48c0-20 17-34 38-34s38 14 38 34Z" fill="#DC2626" />
          <circle cx="32" cy="32" r="6" fill="#FEF3C7" />
          <circle cx="58" cy="24" r="7" fill="#FEF3C7" />
          <circle cx="70" cy="40" r="5" fill="#FEF3C7" />
        </g>
      );
    case "rock":
      return (
        <g>
          <path d="M12 82l8-32 24-18 26 12 16 38Z" fill="#94A3B8" stroke="#64748B" strokeWidth="3" />
          <path d="M30 50l14-10 10 10-8 12Z" fill="#CBD5E1" />
          <path d="M20 82l10-22 12 8-2 14Z" fill="#64748B" opacity="0.6" />
        </g>
      );
    case "cloud":
      return (
        <g>
          <ellipse cx="34" cy="58" rx="26" ry="20" fill="#FFFFFF" />
          <ellipse cx="56" cy="50" rx="24" ry="24" fill="#F8FAFC" />
          <ellipse cx="72" cy="60" rx="20" ry="17" fill="#FFFFFF" />
          <ellipse cx="48" cy="66" rx="34" ry="15" fill="#F1F5F9" />
        </g>
      );
    case "star":
      return (
        <g>
          <path d="M50 8l12 26 29 3-22 20 6 29-25-14-25 14 6-29L9 37l29-3Z" fill="#FFC300" stroke="#D97706" strokeWidth="2" />
          <circle cx="43" cy="42" r="2.5" fill="#78350F" />
          <circle cx="57" cy="42" r="2.5" fill="#78350F" />
          <path d="M45 50c3 3 7 3 10 0" stroke="#78350F" strokeWidth="2" fill="none" strokeLinecap="round" />
        </g>
      );
    case "building":
      return (
        <g>
          <rect x="16" y="12" width="68" height="80" rx="4" fill={accent} />
          {Array.from({ length: 3 }).map((_, row) =>
            Array.from({ length: 4 }).map((__, col) => (
              <rect key={`${row}-${col}`} x={24 + col * 15} y={22 + row * 18} width="9" height="10" rx="1" fill="#BAE6FD" />
            )),
          )}
          <rect x="42" y="78" width="16" height="14" fill="#0F172A" opacity="0.5" />
        </g>
      );
    case "house":
      return (
        <g>
          <rect x="20" y="44" width="60" height="48" rx="4" fill="#FEF3C7" stroke="#B45309" strokeWidth="2" />
          <path d="M10 46L50 12l40 34Z" fill="#DC2626" />
          <rect x="42" y="62" width="16" height="30" rx="2" fill="#92400E" />
          <rect x="28" y="54" width="12" height="12" rx="2" fill="#BAE6FD" />
          <rect x="60" y="54" width="12" height="12" rx="2" fill="#BAE6FD" />
          <rect x="62" y="18" width="10" height="18" rx="2" fill="#B45309" />
        </g>
      );
    case "hedge":
      return (
        <g>
          <ellipse cx="50" cy="62" rx="44" ry="32" fill="#15803D" />
          <ellipse cx="28" cy="48" rx="18" ry="16" fill="#22C55E" />
          <ellipse cx="54" cy="40" rx="20" ry="18" fill="#16A34A" />
          <ellipse cx="76" cy="52" rx="16" ry="14" fill="#22C55E" />
          <circle cx="38" cy="58" r="3" fill="#FDE047" />
          <circle cx="66" cy="46" r="3" fill="#FDE047" />
        </g>
      );
    case "coral":
      return (
        <g>
          <path d="M46 88V44M46 58L26 38M46 66l22-24M46 74L20 68M46 80l26-10" stroke="#FB7185" strokeWidth="8" strokeLinecap="round" fill="none" />
          <circle cx="26" cy="38" r="7" fill="#FDA4AF" />
          <circle cx="68" cy="42" r="7" fill="#FDA4AF" />
          <circle cx="20" cy="68" r="6" fill="#FDA4AF" />
        </g>
      );
    case "snowman":
      return (
        <g>
          <circle cx="50" cy="72" r="22" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
          <circle cx="50" cy="44" r="17" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
          <circle cx="50" cy="20" r="13" fill="#F8FAFC" stroke="#CBD5E1" strokeWidth="2" />
          <path d="M38 12h24l-3-8H41Z" fill="#1E293B" />
          <circle cx="45" cy="18" r="2" fill="#0F172A" />
          <circle cx="55" cy="18" r="2" fill="#0F172A" />
          <path d="M50 21l9 3-9 3Z" fill="#F59E0B" />
          <path d="M32 44h36" stroke="#EF4444" strokeWidth="6" strokeLinecap="round" />
          <circle cx="50" cy="44" r="3" fill="#EF4444" />
          <circle cx="50" cy="58" r="2.5" fill="#0F172A" />
          <circle cx="50" cy="68" r="2.5" fill="#0F172A" />
        </g>
      );
    case "cactus":
      return (
        <g>
          <rect x="42" y="18" width="16" height="70" rx="8" fill="#16A34A" />
          <path d="M42 44H30a10 10 0 0 0 0 20h12M58 56h12a10 10 0 0 1 0 20H58" stroke="#22C55E" strokeWidth="12" fill="none" strokeLinecap="round" />
          <circle cx="50" cy="24" r="3" fill="#FDE047" />
          <rect x="24" y="86" width="52" height="8" rx="4" fill="#D97706" />
        </g>
      );
    case "fountain":
      return (
        <g>
          <ellipse cx="50" cy="84" rx="38" ry="10" fill="#94A3B8" />
          <path d="M18 78h64l-8 10H26Z" fill="#64748B" />
          <rect x="44" y="46" width="12" height="32" fill="#CBD5E1" />
          <path d="M50 16c-12 12-16 22-12 30 4 6 20 6 24 0 4-8 0-18-12-30Z" fill="#38BDF8" opacity="0.75" />
          <circle cx="50" cy="14" r="5" fill="#7DD3FC" />
        </g>
      );
    case "bench":
      return (
        <g>
          <rect x="12" y="50" width="76" height="10" rx="4" fill="#B45309" />
          <rect x="12" y="36" width="76" height="10" rx="4" fill="#D97706" />
          <rect x="20" y="60" width="7" height="26" rx="2" fill="#475569" />
          <rect x="73" y="60" width="7" height="26" rx="2" fill="#475569" />
        </g>
      );
    case "lantern":
      return (
        <g>
          <path d="M50 8v12" stroke="#475569" strokeWidth="4" />
          <path d="M30 20h40l8 44H22Z" fill="#FDE68A" stroke="#B45309" strokeWidth="3" />
          <rect x="38" y="28" width="24" height="28" rx="4" fill="#FFF7ED" />
          <circle cx="50" cy="42" r="8" fill="#F59E0B" />
          <path d="M22 64h56" stroke="#B45309" strokeWidth="5" strokeLinecap="round" />
        </g>
      );
    case "planet":
      return (
        <g>
          <circle cx="50" cy="50" r="28" fill={accent} />
          <ellipse cx="50" cy="50" rx="44" ry="12" fill="none" stroke="#FDE68A" strokeWidth="6" transform="rotate(-18 50 50)" />
          <circle cx="40" cy="44" r="6" fill="#ffffff" opacity="0.35" />
          <circle cx="60" cy="58" r="4" fill="#ffffff" opacity="0.25" />
        </g>
      );
    case "asteroid":
      return (
        <g>
          <path d="M22 28l18-14 24 2 20 18-2 28-20 18-30-4-14-22Z" fill="#78716C" stroke="#57534E" strokeWidth="3" />
          <circle cx="38" cy="42" r="6" fill="#57534E" />
          <circle cx="63" cy="34" r="4" fill="#57534E" />
          <circle cx="56" cy="62" r="7" fill="#57534E" />
          <circle cx="30" cy="60" r="3" fill="#A8A29E" />
        </g>
      );
    default:
      return (
        <g>
          <rect x="22" y="22" width="56" height="56" rx="10" fill={accent} opacity="0.8" />
        </g>
      );
  }
}

function EffectArt({ asset, costume }: { asset: string; costume: number }) {
  const accent = pick(SHIRT, costume);
  switch (asset) {
    case "sparkle":
      return (
        <g fill={accent}>
          <path d="M50 8l6 28 28 6-28 6-6 28-6-28-28-6 28-6Z" />
          <path d="M22 18l3 12 12 3-12 3-3 12-3-12-12-3 12-3Z" fill="#FFC300" />
          <path d="M78 62l2 9 9 2-9 2-2 9-2-9-9-2 9-2Z" fill="#FDE68A" />
        </g>
      );
    case "bubble":
      return (
        <g>
          <circle cx="50" cy="50" r="31" fill="#7DD3FC" opacity="0.35" stroke="#38BDF8" strokeWidth="2" />
          <circle cx="38" cy="38" r="8" fill="#FFFFFF" opacity="0.75" />
          <circle cx="65" cy="66" r="4" fill="#FFFFFF" opacity="0.55" />
        </g>
      );
    case "snowflake":
      return (
        <g stroke="#38BDF8" strokeWidth="6" strokeLinecap="round">
          <path d="M50 12v76M18 31l64 38M82 31L18 69" />
          <path d="M50 24l-9-8M50 24l9-8M50 76l-9 8M50 76l9 8M28 40l-12-2M28 40l-2-12M72 60l12 2M72 60l2 12M72 40l12-2M72 40l2-12M28 60l-12 2M28 60l-2 12" />
        </g>
      );
    case "hazard":
      return (
        <g>
          <path d="M50 8l38 70H12Z" fill="#FACC15" stroke="#B45309" strokeWidth="4" strokeLinejoin="round" />
          <rect x="45" y="32" width="10" height="24" rx="4" fill="#78350F" />
          <circle cx="50" cy="64" r="5" fill="#78350F" />
        </g>
      );
    case "lightning":
      return <path d="M58 6L18 56h24l-6 38 40-52H52Z" fill="#FACC15" stroke="#B45309" strokeWidth="3" />;
    case "heart":
      return (
        <path
          d="M50 84C20 64 10 46 18 32c8-14 24-10 32 2 8-12 24-16 32-2 8 14-2 32-32 52Z"
          fill="#F43F5E"
        />
      );
    case "rainbow":
      return (
        <g fill="none" strokeWidth="8" strokeLinecap="round">
          <path d="M14 78a36 36 0 0 1 72 0" stroke="#EF4444" />
          <path d="M24 78a26 26 0 0 1 52 0" stroke="#F59E0B" />
          <path d="M34 78a16 16 0 0 1 32 0" stroke="#22C55E" />
          <path d="M44 78a6 6 0 0 1 12 0" stroke="#3B82F6" />
        </g>
      );
    default:
      return (
        <g fill={accent}>
          <circle cx="50" cy="50" r="26" opacity="0.5" />
        </g>
      );
  }
}

const PEOPLE: Array<{
  key: string;
  name: string;
  style: PersonProps["style"];
  accessory: PersonProps["accessory"];
  skin?: number;
}> = [
  { key: "kid-a", name: "Ari", style: "short", accessory: "none" },
  { key: "kid-b", name: "Bea", style: "bob", accessory: "glasses" },
  { key: "kid-c", name: "Cody", style: "curly", accessory: "backpack", skin: 2 },
  { key: "kid-d", name: "Dara", style: "long", accessory: "headphones", skin: 3 },
  { key: "kid-e", name: "Eli", style: "cap", accessory: "backpack", skin: 4 },
  { key: "kid-f", name: "Faye", style: "bun", accessory: "glasses", skin: 5 },
  { key: "explorer", name: "Explorer", style: "cap", accessory: "backpack", skin: 1 },
  { key: "astronaut", name: "Astronaut", style: "short", accessory: "headphones", skin: 2 },
  { key: "queen", name: "Queen", style: "long", accessory: "crown", skin: 1 },
  { key: "boy", name: "Bloom Boy", style: "short", accessory: "none" },
  { key: "girl", name: "Bloom Girl", style: "bob", accessory: "none" },
];

const ANIMALS: Array<{ key: string; name: string; kind: AnimalKind }> = [
  { key: "cat", name: "Cat", kind: "cat" },
  { key: "dog", name: "Dog", kind: "dog" },
  { key: "rabbit", name: "Rabbit", kind: "rabbit" },
  { key: "lion", name: "Lion", kind: "lion" },
  { key: "bird", name: "Bird", kind: "bird" },
  { key: "butterfly", name: "Butterfly", kind: "butterfly" },
  { key: "fish", name: "Fish", kind: "fish" },
  { key: "elephant", name: "Elephant", kind: "elephant" },
  { key: "monkey", name: "Monkey", kind: "monkey" },
  { key: "dino", name: "Dinosaur", kind: "dino" },
  { key: "penguin", name: "Penguin", kind: "penguin" },
  { key: "fox", name: "Fox", kind: "fox" },
  { key: "turtle", name: "Turtle", kind: "turtle" },
  { key: "unicorn", name: "Unicorn", kind: "unicorn" },
];

const ASSETS: AssetDef[] = [
  { key: "bloom", name: "Bloom", category: "People", tags: ["mascot", "character", "sprout"], costumes: 4, animations: ["idle", "walk", "jump", "celebrate", "talk"], locomotion: "walk", defaultSize: 1 },
  ...PEOPLE.map((p) => ({
    key: p.key,
    name: p.name,
    category: "People" as AssetCategory,
    tags: ["character", "person", p.style ?? "short"],
    costumes: 4,
    animations: ["idle", "walk", "run", "jump", "celebrate", "talk"] as AnimationName[],
    locomotion: "walk" as AnimationName,
    defaultSize: 1,
  })),
  ...ANIMALS.map((a) => ({
    key: a.key,
    name: a.name,
    category: "Animals" as AssetCategory,
    tags: ["animal", a.kind],
    costumes: 3,
    animations:
      a.kind === "bird" || a.kind === "butterfly"
        ? (["idle", "fly", "celebrate"] as AnimationName[])
        : a.kind === "fish"
          ? (["idle", "swim", "celebrate"] as AnimationName[])
          : (["idle", "walk", "run", "jump", "celebrate", "talk"] as AnimationName[]),
    locomotion:
      a.kind === "bird" || a.kind === "butterfly"
        ? ("fly" as AnimationName)
        : a.kind === "fish"
          ? ("swim" as AnimationName)
          : ("walk" as AnimationName),
    defaultSize: 1,
  })),
  { key: "fairy", name: "Fairy", category: "Fantasy", tags: ["fantasy", "magic"], costumes: 4, animations: ["idle", "fly", "celebrate", "talk"], locomotion: "fly", defaultSize: 0.95 },
  { key: "wizard", name: "Wizard", category: "Fantasy", tags: ["fantasy", "magic"], costumes: 3, animations: ["idle", "walk", "celebrate", "talk"], locomotion: "walk", defaultSize: 1 },
  { key: "monster", name: "Friendly monster", category: "Fantasy", tags: ["fantasy", "monster"], costumes: 4, animations: ["idle", "walk", "jump", "celebrate", "talk"], locomotion: "walk", defaultSize: 1.05 },
  { key: "dragon", name: "Dragon", category: "Fantasy", tags: ["fantasy", "dragon"], costumes: 3, animations: ["idle", "fly", "run", "celebrate", "talk"], locomotion: "fly", defaultSize: 1.1 },
  { key: "phoenix", name: "Phoenix", category: "Fantasy", tags: ["fantasy", "fire", "bird"], costumes: 3, animations: ["idle", "fly", "celebrate"], locomotion: "fly", defaultSize: 1.05 },
  { key: "robot", name: "Helper robot", category: "Robots", tags: ["robot", "technology"], costumes: 4, animations: ["idle", "walk", "jump", "celebrate", "talk"], locomotion: "walk", defaultSize: 1 },
  { key: "coding-bot", name: "Coding bot", category: "Robots", tags: ["robot", "coding"], costumes: 3, animations: ["idle", "walk", "celebrate", "talk"], locomotion: "walk", defaultSize: 0.95 },
  { key: "drone", name: "Drone", category: "Robots", tags: ["robot", "flying"], costumes: 3, animations: ["idle", "fly", "celebrate"], locomotion: "fly", defaultSize: 0.9 },
  { key: "astro-bot", name: "Astro bot", category: "Robots", tags: ["robot", "space"], costumes: 3, animations: ["idle", "fly", "celebrate", "talk"], locomotion: "fly", defaultSize: 0.95 },
  { key: "car", name: "Car", category: "Vehicles", tags: ["vehicle", "road"], costumes: 4, animations: ["idle", "run"], locomotion: "run", defaultSize: 1.1 },
  { key: "bus", name: "Bus", category: "Vehicles", tags: ["vehicle", "road"], costumes: 3, animations: ["idle", "run"], locomotion: "run", defaultSize: 1.2 },
  { key: "plane", name: "Plane", category: "Vehicles", tags: ["vehicle", "flying"], costumes: 3, animations: ["idle", "fly"], locomotion: "fly", defaultSize: 1.15 },
  { key: "rocket", name: "Rocket", category: "Vehicles", tags: ["vehicle", "space"], costumes: 3, animations: ["idle", "fly"], locomotion: "fly", defaultSize: 1.05 },
  { key: "boat", name: "Boat", category: "Vehicles", tags: ["vehicle", "water"], costumes: 3, animations: ["idle", "swim"], locomotion: "swim", defaultSize: 1.1 },
  { key: "train", name: "Train", category: "Vehicles", tags: ["vehicle", "rail"], costumes: 3, animations: ["idle", "run"], locomotion: "run", defaultSize: 1.15 },
  { key: "coin", name: "Coin", category: "Objects", tags: ["collectible", "treasure"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 0.55 },
  { key: "gem", name: "Gem", category: "Objects", tags: ["collectible", "treasure"], costumes: 4, animations: ["idle"], locomotion: "idle", defaultSize: 0.55 },
  { key: "key", name: "Golden key", category: "Objects", tags: ["collectible", "key"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 0.75 },
  { key: "chest", name: "Treasure chest", category: "Objects", tags: ["treasure", "goal"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 0.9 },
  { key: "gear", name: "Gear", category: "Objects", tags: ["collectible", "robot"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 0.6 },
  { key: "console", name: "Console", category: "Objects", tags: ["technology", "goal"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 0.9 },
  { key: "crate", name: "Crate", category: "Objects", tags: ["box", "obstacle"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 0.8 },
  { key: "cone", name: "Traffic cone", category: "Objects", tags: ["roadworks", "obstacle"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 0.7 },
  { key: "door", name: "Door", category: "Objects", tags: ["goal", "building"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 1 },
  { key: "flag", name: "Flag", category: "Objects", tags: ["goal", "marker"], costumes: 4, animations: ["idle"], locomotion: "idle", defaultSize: 0.8 },
  { key: "sign", name: "Sign", category: "Objects", tags: ["marker"], costumes: 3, animations: ["idle"], locomotion: "idle", defaultSize: 0.75 },
  { key: "apple", name: "Apple", category: "Objects", tags: ["food", "collectible"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 0.5 },
  { key: "potion", name: "Potion", category: "Objects", tags: ["power-up"], costumes: 3, animations: ["idle"], locomotion: "idle", defaultSize: 0.55 },
  { key: "battery", name: "Battery", category: "Objects", tags: ["power-up"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 0.55 },
  { key: "hamburger", name: "Snack", category: "Objects", tags: ["food", "collectible"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 0.55 },
  { key: "tree", name: "Oak tree", category: "Decorations", tags: ["nature", "tree"], costumes: 3, animations: ["idle"], locomotion: "idle", defaultSize: 1.2 },
  { key: "pine", name: "Pine tree", category: "Decorations", tags: ["nature", "tree"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 1.2 },
  { key: "flower", name: "Flower", category: "Decorations", tags: ["nature", "flower"], costumes: 4, animations: ["idle"], locomotion: "idle", defaultSize: 0.55 },
  { key: "sunflower", name: "Sunflower", category: "Decorations", tags: ["nature", "flower", "goal"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 1 },
  { key: "mushroom", name: "Mushroom", category: "Decorations", tags: ["nature"], costumes: 3, animations: ["idle"], locomotion: "idle", defaultSize: 0.6 },
  { key: "rock", name: "Rock", category: "Decorations", tags: ["nature", "obstacle"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 0.7 },
  { key: "crystal", name: "Crystal", category: "Decorations", tags: ["cave", "obstacle", "magic"], costumes: 3, animations: ["idle"], locomotion: "idle", defaultSize: 0.9 },
  { key: "cloud", name: "Cloud", category: "Decorations", tags: ["sky", "nature"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 1.1 },
  { key: "star", name: "Star", category: "Decorations", tags: ["sky", "collectible"], costumes: 3, animations: ["idle"], locomotion: "idle", defaultSize: 0.55 },
  { key: "building", name: "Building", category: "Decorations", tags: ["city"], costumes: 3, animations: ["idle"], locomotion: "idle", defaultSize: 1.2 },
  { key: "house", name: "House", category: "Decorations", tags: ["city", "home"], costumes: 3, animations: ["idle"], locomotion: "idle", defaultSize: 1.05 },
  { key: "hedge", name: "Hedge", category: "Decorations", tags: ["garden", "obstacle"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 1.1 },
  { key: "coral", name: "Coral", category: "Decorations", tags: ["ocean"], costumes: 3, animations: ["idle"], locomotion: "idle", defaultSize: 0.8 },
  { key: "snowman", name: "Snowman", category: "Decorations", tags: ["winter"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 1 },
  { key: "cactus", name: "Cactus", category: "Decorations", tags: ["desert"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 0.9 },
  { key: "fountain", name: "Fountain", category: "Decorations", tags: ["garden"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 1.1 },
  { key: "bench", name: "Bench", category: "Decorations", tags: ["park"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 0.8 },
  { key: "lantern", name: "Lantern", category: "Decorations", tags: ["light", "fantasy"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 0.6 },
  { key: "planet", name: "Planet", category: "Decorations", tags: ["space", "goal"], costumes: 3, animations: ["idle"], locomotion: "idle", defaultSize: 1.1 },
  { key: "asteroid", name: "Asteroid", category: "Decorations", tags: ["space", "obstacle"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 0.9 },
  { key: "sparkle", name: "Sparkle", category: "Effects", tags: ["effect", "celebration"], costumes: 4, animations: ["idle", "celebrate"], locomotion: "idle", defaultSize: 0.7 },
  { key: "bubble", name: "Bubble", category: "Effects", tags: ["effect", "water", "collectible"], costumes: 2, animations: ["idle", "swim"], locomotion: "swim", defaultSize: 0.5 },
  { key: "snowflake", name: "Snowflake", category: "Effects", tags: ["effect", "winter", "collectible"], costumes: 2, animations: ["idle", "fall"], locomotion: "idle", defaultSize: 0.55 },
  { key: "hazard", name: "Hazard", category: "Effects", tags: ["effect", "obstacle"], costumes: 1, animations: ["idle"], locomotion: "idle", defaultSize: 0.8 },
  { key: "lightning", name: "Lightning", category: "Effects", tags: ["effect", "power"], costumes: 1, animations: ["idle"], locomotion: "idle", defaultSize: 0.7 },
  { key: "heart", name: "Heart", category: "Effects", tags: ["effect", "health"], costumes: 1, animations: ["idle"], locomotion: "idle", defaultSize: 0.55 },
  { key: "rainbow", name: "Rainbow", category: "Effects", tags: ["effect", "goal"], costumes: 1, animations: ["idle", "celebrate"], locomotion: "idle", defaultSize: 1.1 },
  { key: "candy", name: "Sweet", category: "Objects", tags: ["collectible", "candy"], costumes: 4, animations: ["idle"], locomotion: "idle", defaultSize: 0.55 },
  { key: "acorn", name: "Acorn", category: "Objects", tags: ["collectible", "nature"], costumes: 2, animations: ["idle"], locomotion: "idle", defaultSize: 0.5 },
];

const ASSET_MAP = new Map(ASSETS.map((a) => [a.key, a]));

export const ASSET_CATEGORIES: AssetCategory[] = [
  "People",
  "Animals",
  "Fantasy",
  "Robots",
  "Vehicles",
  "Objects",
  "Decorations",
  "Effects",
];

export function getAsset(key: string): AssetDef | undefined {
  return ASSET_MAP.get(key);
}

export function allAssets(): AssetDef[] {
  return ASSETS;
}

export function assetLabel(key: string): string {
  return ASSET_MAP.get(key)?.name ?? key;
}

export function assetLocomotion(key: string): AnimationName {
  return ASSET_MAP.get(key)?.locomotion ?? "walk";
}

/** Draws one asset. Size, position, flip and CSS animation live in SceneView. */
export function AssetArt({
  assetKey,
  costume = 0,
  tint,
}: {
  assetKey: string;
  costume?: number;
  tint?: string;
}) {
  let content: ReactNode;
  const person = PEOPLE.find((p) => p.key === assetKey);
  const animal = ANIMALS.find((a) => a.key === assetKey);
  const def = ASSET_MAP.get(assetKey);

  if (assetKey === "bloom") {
    // Bloom is the studio mascot: a friendly sprout rather than a person.
    const petal = pick(["#FFC300", "#FDE047", "#F59E0B", "#FCD34D"], costume);
    content = (
      <g>
        <path d="M50 94c0-26 0-38 0-44" stroke="#15803D" strokeWidth="9" strokeLinecap="round" />
        <path d="M50 62c-16-2-22-14-22-14s18-6 22 14ZM50 72c16-2 22-14 22-14s-18-6-22 14Z" fill="#22C55E" />
        {Array.from({ length: 8 }).map((_, i) => (
          <ellipse
            key={i}
            cx="50"
            cy="20"
            rx="9"
            ry="15"
            fill={petal}
            transform={`rotate(${i * 45} 50 34)`}
            opacity={0.95}
          />
        ))}
        <circle cx="50" cy="34" r="15" fill="#FEF3C7" />
        <circle cx="44" cy="32" r="2.6" fill="#14532D" />
        <circle cx="56" cy="32" r="2.6" fill="#14532D" />
        <path d="M45 40c3 3 7 3 10 0" stroke="#14532D" strokeWidth="2.2" fill="none" strokeLinecap="round" />
        <circle cx="38" cy="38" r="3" fill="#F87171" opacity="0.4" />
        <circle cx="62" cy="38" r="3" fill="#F87171" opacity="0.4" />
      </g>
    );
  } else if (person) {
    content = (
      <Person
        costume={person.key === "boy" ? 0 : person.key === "girl" ? 2 : costume}
        style={person.style}
        accessory={person.accessory}
        skinIndex={person.skin}
      />
    );
  } else if (animal) {
    content = <Animal kind={animal.kind} costume={costume} />;
  } else if (["fairy", "wizard"].includes(assetKey)) {
    content = (
      <g>
        {assetKey === "fairy" ? (
          <g fill="#BAE6FD" opacity="0.75">
            <path d="M36 42C14 22 8 46 26 58Z" />
            <path d="M64 42c22-20 28 4 10 16Z" />
          </g>
        ) : null}
        <Person costume={costume + 2} style={assetKey === "wizard" ? "long" : "bob"} accessory={assetKey === "wizard" ? "crown" : "none"} />
        {assetKey === "wizard" ? (
          <g>
            <path d="M30 18L50 0l20 18Z" fill="#4C1D95" />
            <path d="M74 34v54" stroke="#78350F" strokeWidth="5" strokeLinecap="round" />
            <circle cx="74" cy="32" r="8" fill="#FFC300" />
          </g>
        ) : null}
      </g>
    );
  } else if (assetKey === "monster") {
    content = (
      <g>
        <ellipse cx="50" cy="58" rx="34" ry="32" fill={pick(["#8B5CF6", "#22C55E", "#F97316"], costume)} />
        <circle cx="50" cy="28" r="18" fill={pick(["#A78BFA", "#4ADE80", "#FB923C"], costume)} />
        <circle cx="43" cy="26" r="5" fill="#ffffff" />
        <circle cx="58" cy="26" r="5" fill="#ffffff" />
        <circle cx="43" cy="27" r="2.5" fill="#062D58" />
        <circle cx="58" cy="27" r="2.5" fill="#062D58" />
        <path d="M38 72c6 8 18 8 24 0" stroke="#062D58" strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M30 54l-10-8M70 54l10-8" stroke="#062D58" strokeWidth="4" strokeLinecap="round" />
      </g>
    );
  } else if (assetKey === "dragon" || assetKey === "phoenix") {
    const color = assetKey === "dragon" ? pick(["#16A34A", "#059669", "#7C3AED"], costume) : pick(["#F97316", "#EF4444", "#F59E0B"], costume);
    content = (
      <g>
        <path d="M32 48C8 26 4 56 24 66Z" fill={color} opacity="0.7" />
        <path d="M68 48c24-22 28 8 8 18Z" fill={color} opacity="0.7" />
        <ellipse cx="50" cy="60" rx="26" ry="20" fill={color} />
        <circle cx="70" cy="38" r="15" fill={color} />
        <path d="M64 24l4-12 7 14M76 24l6-10 4 14" fill="#FFC300" />
        <circle cx="75" cy="37" r="2.5" fill="#062D58" />
        <path d="M68 48c5 2 8 1 11-2" stroke="#062D58" strokeWidth="2" fill="none" />
        <path d="M38 78l-4 12M56 78l4 12" stroke={color} strokeWidth="7" strokeLinecap="round" />
        {assetKey === "phoenix" ? <path d="M24 56l-14-8 10 16" fill="#FDE047" /> : <path d="M22 58l-12 4 12 6Z" fill="#FFC300" />}
      </g>
    );
  } else if (["robot", "coding-bot", "astro-bot"].includes(assetKey)) {
    content = <Robot costume={costume + (assetKey === "astro-bot" ? 2 : 0)} />;
  } else if (assetKey === "drone") {
    content = <Vehicle kind="drone" costume={costume} />;
  } else if (["car", "bus", "plane", "rocket", "boat", "train"].includes(assetKey)) {
    content = <Vehicle kind={assetKey as "car"} costume={costume} />;
  } else if (def?.category === "Objects" || ["planet", "asteroid"].includes(assetKey)) {
    content = <ObjectArt asset={assetKey} costume={costume} />;
  } else if (def?.category === "Decorations") {
    content = <DecorationArt asset={assetKey} costume={costume} />;
  } else if (def?.category === "Effects") {
    content = <EffectArt asset={assetKey} costume={costume} />;
  } else {
    content = (
      <g>
        <circle cx="50" cy="50" r="30" fill={tint ?? "#22C55E"} />
        <circle cx="50" cy="50" r="14" fill="#ffffff" opacity="0.7" />
      </g>
    );
  }

  return (
    <svg viewBox="0 0 100 100" className="cb-asset-svg" role="presentation" aria-hidden>
      {content}
    </svg>
  );
}
