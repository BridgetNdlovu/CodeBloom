import type { CSSProperties } from "react";
import type { CharacterPreference } from "../../types";

const BOY_IMAGE = "/boy_transparent.png";
const GIRL_IMAGE = "/girl_transparent.png";

interface CharacterIllustrationProps {
  character: CharacterPreference;
  className?: string;
  style?: CSSProperties;
}

export function CharacterIllustration({
  character,
  className = "",
  style,
}: CharacterIllustrationProps) {
  const isGirl = character === "girl";
  const src = isGirl ? GIRL_IMAGE : BOY_IMAGE;

  return (
    <img
      src={src}
      alt={
        isGirl
          ? "Bloom, the friendly girl coder wearing a yellow hoodie"
          : "Bumble, the friendly boy coder wearing a navy blue hoodie"
      }
      className={`cb-character-img ${className}`}
      style={style}
      draggable={false}
    />
  );
}

interface CharacterAvatarProps {
  character: CharacterPreference;
  name?: string;
  size?: number;
}

export function CharacterAvatar({
  character,
  name,
  size = 44,
}: CharacterAvatarProps) {
  const isGirl = character === "girl";
  const src = isGirl ? GIRL_IMAGE : BOY_IMAGE;
  const label = name
    ? `${name}, ${isGirl ? "the girl coder" : "the boy coder"}`
    : isGirl
      ? "Bloom, the girl coder"
      : "Bumble, the boy coder";

  return (
    <span
      className="cb-character-avatar"
      style={{ width: size, height: size }}
      title={label}
      aria-label={label}
    >
      <img
        src={src}
        alt={label}
        style={{ width: "100%", height: "100%", objectFit: "contain" }}
        draggable={false}
      />
    </span>
  );
}
