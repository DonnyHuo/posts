// Global AudioContext instance (reused for all sounds)
let audioContext: AudioContext | null = null;
let audioUnlocked = false;

/**
 * Get or create AudioContext
 */
function getAudioContext(): AudioContext | null {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;

    if (!AudioContextClass) {
      return null;
    }

    // Create new context if needed
    if (!audioContext || audioContext.state === "closed") {
      audioContext = new AudioContextClass();
    }

    return audioContext;
  } catch {
    return null;
  }
}

/**
 * Initialize audio on user interaction (required for mobile browsers)
 * MUST be called during a user interaction (click, touch, etc.)
 */
export function initializeAudioContext(): void {
  if (audioUnlocked) {
    return;
  }

  try {
    const ctx = getAudioContext();
    if (!ctx) {
      console.warn("[Sound] AudioContext not supported");
      return;
    }

    // Resume AudioContext if it's suspended (required on mobile)
    if (ctx.state === "suspended") {
      ctx.resume().then(() => {
        audioUnlocked = true;
        console.log("[Sound] AudioContext resumed and unlocked");
      });
    } else if (ctx.state === "running") {
      audioUnlocked = true;
      console.log("[Sound] AudioContext already running");
    }

    // Play a silent buffer to fully unlock audio on iOS
    // This is the most reliable way to unlock audio on mobile
    const buffer = ctx.createBuffer(1, 1, 22050);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start(0);

    audioUnlocked = true;
    console.log("[Sound] Audio unlocked for mobile");
  } catch (error) {
    console.warn("[Sound] Failed to initialize audio:", error);
  }
}

/**
 * Play notification sound when receiving new messages
 * Uses Web Audio API to generate a pleasant ascending tone
 */
export async function playNotificationSound(): Promise<void> {
  try {
    const ctx = getAudioContext();
    if (!ctx) {
      console.warn("[Sound] AudioContext not available");
      return;
    }

    // Resume if suspended (might happen after phone sleeps)
    if (ctx.state === "suspended") {
      try {
        await ctx.resume();
      } catch {
        console.warn("[Sound] Failed to resume AudioContext");
        return;
      }
    }

    const now = ctx.currentTime;
    const duration = 0.35;

    // Create a pleasant ascending two-tone sound (like a notification chime)
    // First tone: C5 (523.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.type = "sine";
    osc1.frequency.value = 523.25; // C5

    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.15, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + duration * 0.5);

    osc1.start(now);
    osc1.stop(now + duration * 0.5);

    // Second tone: E5 (659.25 Hz) - slightly delayed
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.type = "sine";
    osc2.frequency.value = 659.25; // E5

    const delay = 0.08;
    gain2.gain.setValueAtTime(0, now + delay);
    gain2.gain.linearRampToValueAtTime(0.15, now + delay + 0.02);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc2.start(now + delay);
    osc2.stop(now + duration);

    console.log("[Sound] Notification sound played");
  } catch (error) {
    console.warn("[Sound] Failed to play notification sound:", error);
  }
}
