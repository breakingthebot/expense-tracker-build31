// src/services/soundService.ts
// Programmatic chime synthesizer using the browser-native Web Audio API.
// Provides zero-dependency, instant audio warnings that fall back gracefully on non-web platforms.
// Created: 2026-07-18

let audioCtx: any = null;

/**
 * Programmatically synthesizes and plays a premium double-chime warning sound.
 */
export function playBudgetAlertSound() {
  if (typeof window === 'undefined') return;

  // Retrieve browser AudioContext class
  const AudioContextClass =
    (window as any).AudioContext || (window as any).webkitAudioContext;
  if (!AudioContextClass) return;

  try {
    if (!audioCtx) {
      audioCtx = new AudioContextClass();
    }

    // Auto-resume if browser autoplay policy suspended the context
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    // Double rising chime: C5 (523.25 Hz) followed by E5 (659.25 Hz)
    playTone(523.25, now, 0.12);
    playTone(659.25, now + 0.12, 0.25);
  } catch (err) {
    // Fail silently to prevent app crashes on restricted web security environments
  }
}

function playTone(frequency: number, startTime: number, duration: number) {
  if (!audioCtx) return;

  try {
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = 'triangle'; // Soft, warm triangle wave for a premium chime feel
    osc.frequency.setValueAtTime(frequency, startTime);

    // Apply smooth linear volume envelope to avoid speaker clicks
    gainNode.gain.setValueAtTime(0, startTime);
    gainNode.gain.linearRampToValueAtTime(0.12, startTime + 0.03); // Quick attack
    gainNode.gain.setValueAtTime(0.12, startTime + duration - 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // Smooth decay

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start(startTime);
    osc.stop(startTime + duration);
  } catch (err) {
    // Ignore audio node connection errors
  }
}
