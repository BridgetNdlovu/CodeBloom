/**
 * Tiny WebAudio sound board. No recorded assets are bundled: every effect is
 * synthesised, which keeps the game lightweight and avoids licensing issues.
 */

let sharedContext: AudioContext | null = null;
const active = new Set<OscillatorNode>();

function context(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!sharedContext) sharedContext = new Ctor();
  if (sharedContext.state === "suspended") void sharedContext.resume();
  return sharedContext;
}

/** Immediately silences every effect that is still playing. */
export function stopAllSounds() {
  active.forEach((osc) => {
    try {
      osc.stop();
    } catch {
      /* already stopped */
    }
  });
  active.clear();
}

function tone(
  frequency: number,
  duration: number,
  type: OscillatorType = "sine",
  volume = 0.12,
  delay = 0,
) {
  const ctx = context();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0.0001, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain);
  gain.connect(ctx.destination);
  active.add(osc);
  osc.onended = () => active.delete(osc);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export type SoundName =
  | "click"
  | "move"
  | "coin"
  | "jump"
  | "win"
  | "lose"
  | "beep"
  | "pop"
  | "power";

export function playSound(name: SoundName, enabled = true) {
  if (!enabled) return;
  switch (name) {
    case "click":
      tone(520, 0.06, "triangle", 0.06);
      break;
    case "move":
      tone(330, 0.05, "sine", 0.035);
      break;
    case "coin":
      tone(880, 0.09, "square", 0.06);
      tone(1320, 0.12, "square", 0.05, 0.07);
      break;
    case "jump":
      tone(300, 0.14, "sine", 0.08);
      tone(520, 0.1, "sine", 0.05, 0.06);
      break;
    case "win":
      [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.24, "triangle", 0.09, i * 0.12));
      break;
    case "lose":
      [392, 330, 262].forEach((f, i) => tone(f, 0.2, "sawtooth", 0.05, i * 0.13));
      break;
    case "beep":
      tone(660, 0.08, "square", 0.05);
      break;
    case "pop":
      tone(760, 0.05, "triangle", 0.05);
      tone(1080, 0.06, "triangle", 0.04, 0.04);
      break;
    case "power":
      tone(220, 0.2, "sawtooth", 0.05);
      tone(440, 0.2, "triangle", 0.05, 0.08);
      break;
  }
}
