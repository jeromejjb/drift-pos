const STORAGE_KEY = 'drift-order-sound-enabled';

export function isOrderSoundEnabled(): boolean {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === null) return true; // default: on
  return stored === 'true';
}

export function setOrderSoundEnabled(enabled: boolean): void {
  localStorage.setItem(STORAGE_KEY, String(enabled));
}

/**
 * Play a pleasant notification sound when a new order arrives.
 * Uses Web Audio API - no external files needed.
 * Respects user preference from Settings > Notifications.
 */
export function playOrderNotificationSound() {
  if (!isOrderSoundEnabled()) return;
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioContext.currentTime;

    // Create a pleasant two-tone chime
    const playTone = (freq: number, start: number, duration: number, gain: number) => {
      const osc = audioContext.createOscillator();
      const g = audioContext.createGain();
      osc.connect(g);
      g.connect(audioContext.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      g.gain.setValueAtTime(0, start);
      g.gain.linearRampToValueAtTime(gain, start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.start(start);
      osc.stop(start + duration);
    };

    playTone(880, now, 0.15, 0.15);       // A5
    playTone(1108.73, now + 0.12, 0.2, 0.12); // C#6
    playTone(1318.51, now + 0.24, 0.25, 0.1); // E6
  } catch {
    // Fallback: some browsers restrict AudioContext
  }
}
