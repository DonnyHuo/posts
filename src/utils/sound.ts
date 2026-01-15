// Cache AudioContext instance to avoid creating new ones
let audioContextCache: AudioContext | null = null;
let audioContextInitialized = false;

/**
 * Initialize AudioContext on user interaction (required for mobile browsers)
 * Call this once when user first interacts with the page
 */
export async function initializeAudioContext(): Promise<void> {
  if (audioContextInitialized) {
    return;
  }

  try {
    const audioContext = getAudioContext();
    if (audioContext) {
      await ensureAudioContextRunning(audioContext);
      audioContextInitialized = true;
      console.log("[Sound] AudioContext initialized and running");
    }
  } catch (error) {
    console.warn("[Sound] Failed to initialize AudioContext:", error);
  }
}

/**
 * Get or create AudioContext, ensuring it's running (required for mobile)
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

    // Reuse existing context if available and not closed
    if (audioContextCache && audioContextCache.state !== "closed") {
      return audioContextCache;
    }

    // Create new context
    audioContextCache = new AudioContextClass();
    return audioContextCache;
  } catch (error) {
    console.warn("Failed to create AudioContext:", error);
    return null;
  }
}

/**
 * Ensure AudioContext is running (required for mobile browsers)
 */
async function ensureAudioContextRunning(
  audioContext: AudioContext
): Promise<boolean> {
  try {
    // On mobile, AudioContext starts in 'suspended' state
    // We need to resume it to play sounds
    if (audioContext.state === "suspended") {
      await audioContext.resume();
    }
    return audioContext.state === "running";
  } catch (error) {
    console.warn("Failed to resume AudioContext:", error);
    return false;
  }
}

/**
 * Play a pleasant notification sound when receiving new messages
 * Uses Web Audio API to generate a smooth ascending tone
 */
export async function playNotificationSound() {
  try {
    // Get or create audio context
    const audioContext = getAudioContext();
    if (!audioContext) {
      throw new Error("AudioContext not supported");
    }

    // Ensure context is running (critical for mobile)
    const isRunning = await ensureAudioContextRunning(audioContext);
    if (!isRunning) {
      console.warn("AudioContext is not running, cannot play sound");
      return;
    }

    const now = audioContext.currentTime;
    const duration = 0.4; // 400ms duration

    // Create a smooth ascending tone (like iOS notification)
    // Start from a pleasant mid-range frequency and rise slightly
    const startFreq = 523.25; // C5 note - pleasant and clear
    const endFreq = 659.25; // E5 note - slightly higher, creates a pleasant rise

    // Create oscillator
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Configure oscillator - use sine wave for smooth, pleasant sound
    oscillator.type = "sine";

    // Create a smooth frequency rise (ascending tone)
    oscillator.frequency.setValueAtTime(startFreq, now);
    oscillator.frequency.linearRampToValueAtTime(endFreq, now + duration * 0.6);
    oscillator.frequency.setValueAtTime(endFreq, now + duration);

    // Configure volume envelope with smooth fade in/out
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.25, now + 0.05); // Quick fade in
    gainNode.gain.setValueAtTime(0.25, now + duration * 0.7); // Hold
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration); // Smooth fade out

    // Play the sound
    oscillator.start(now);
    oscillator.stop(now + duration);

    // Don't close the context - we'll reuse it for future sounds
    // This is important for mobile devices
  } catch (error) {
    // Fallback: try a simpler sound
    console.warn("Web Audio API not available, trying fallback:", error);
    try {
      const audioContext = getAudioContext();
      if (!audioContext) {
        throw new Error("AudioContext not supported");
      }

      const isRunning = await ensureAudioContextRunning(audioContext);
      if (!isRunning) {
        return;
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.type = "sine";
      oscillator.frequency.value = 600;

      const now = audioContext.currentTime;
      gainNode.gain.setValueAtTime(0, now);
      gainNode.gain.linearRampToValueAtTime(0.2, now + 0.01);
      gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

      oscillator.start(now);
      oscillator.stop(now + 0.2);
    } catch (fallbackError) {
      console.warn("Could not play notification sound:", fallbackError);
    }
  }
}
