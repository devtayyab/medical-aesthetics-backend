/**
 * Short two-tone chime for a new bell notification, generated with Web Audio (no audio
 * file to load). Browsers only allow sound after the user has interacted with the page,
 * so the audio context is unlocked on the first click / key press / touch.
 */
let ctx: AudioContext | null = null;
let lastPlayedAt = 0;

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor: typeof AudioContext | undefined = window.AudioContext || (window as any).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
}

if (typeof window !== 'undefined') {
  const unlock = () => {
    const c = getContext();
    if (c && c.state === 'suspended') c.resume().catch(() => undefined);
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((evt) =>
    window.addEventListener(evt, unlock, { passive: true }),
  );
}

export function playNotificationSound(): void {
  try {
    const c = getContext();
    if (!c) return;
    // Several notifications arriving together make one sound, not a burst.
    const nowMs = Date.now();
    if (nowMs - lastPlayedAt < 1500) return;
    lastPlayedAt = nowMs;
    if (c.state === 'suspended') c.resume().catch(() => undefined);

    const start = c.currentTime;
    [
      { freq: 880, at: 0 },
      { freq: 1174.66, at: 0.16 },
    ].forEach(({ freq, at }) => {
      const osc = c.createOscillator();
      const gain = c.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, start + at);
      gain.gain.exponentialRampToValueAtTime(0.25, start + at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + at + 0.35);
      osc.connect(gain);
      gain.connect(c.destination);
      osc.start(start + at);
      osc.stop(start + at + 0.4);
    });
  } catch {
    // Sound is a nicety: never let it break the page
  }
}
