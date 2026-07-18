// tests/services/soundService.test.ts
// Unit tests for the soundService.
// Mirrors: src/services/soundService.ts
// Created: 2026-07-18

import { playBudgetAlertSound } from '../../src/services/soundService';

describe('soundService', () => {
  it('executes safely without throwing exceptions on non-browser Node environments', () => {
    expect(() => playBudgetAlertSound()).not.toThrow();
  });

  it('runs safely when browser globals are mocked', () => {
    const mockOscillator = {
      connect: jest.fn(),
      frequency: {
        setValueAtTime: jest.fn(),
      },
      start: jest.fn(),
      stop: jest.fn(),
    };

    const mockGain = {
      connect: jest.fn(),
      gain: {
        setValueAtTime: jest.fn(),
        linearRampToValueAtTime: jest.fn(),
        exponentialRampToValueAtTime: jest.fn(),
      },
    };

    const mockAudioContext = {
      currentTime: 10,
      state: 'suspended',
      resume: jest.fn().mockResolvedValue(undefined),
      createOscillator: jest.fn().mockReturnValue(mockOscillator),
      createGain: jest.fn().mockReturnValue(mockGain),
      destination: {},
    };

    // Set mock window globals
    (globalThis as any).window = {
      AudioContext: jest.fn().mockReturnValue(mockAudioContext),
    } as any;

    expect(() => playBudgetAlertSound()).not.toThrow();

    // Verify mock constructors and nodes were connected
    expect((globalThis as any).window.AudioContext).toHaveBeenCalled();
    expect(mockAudioContext.resume).toHaveBeenCalled();
    expect(mockAudioContext.createOscillator).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
    expect(mockOscillator.connect).toHaveBeenCalledWith(mockGain);
    expect(mockGain.connect).toHaveBeenCalledWith(mockAudioContext.destination);

    // Clean up mock globals
    delete (globalThis as any).window;
  });
});
