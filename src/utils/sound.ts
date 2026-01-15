/**
 * Play a pleasant notification sound when receiving new messages
 * Uses Web Audio API to generate a smooth ascending tone
 */
export function playNotificationSound() {
  try {
    // Create audio context
    const AudioContextClass =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioContextClass) {
      throw new Error("AudioContext not supported");
    }
    const audioContext = new AudioContextClass();

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

    // Clean up
    oscillator.onended = () => {
      audioContext.close();
    };
  } catch (error) {
    // Fallback: try a simpler sound
    console.warn("Web Audio API not available, trying fallback:", error);
    try {
      // Create a simpler fallback sound
      const AudioContextClass =
        window.AudioContext ||
        (window as typeof window & { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioContextClass) {
        throw new Error("AudioContext not supported");
      }
      const audioContext = new AudioContextClass();
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

      oscillator.onended = () => {
        audioContext.close();
      };
    } catch (fallbackError) {
      console.warn("Could not play notification sound:", fallbackError);
    }
  }
}
