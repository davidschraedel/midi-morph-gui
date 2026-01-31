export enum ScaleType {
  Chromatic = 'Chromatic',
  Major = 'Major',
  Minor = 'Minor',
  Dorian = 'Dorian',
  Phrygian = 'Phrygian',
  Lydian = 'Lydian',
  Mixolydian = 'Mixolydian',
  Locrian = 'Locrian',
  MajorPentatonic = 'Major Pentatonic',
  MinorPentatonic = 'Minor Pentatonic',
  Blues = 'Blues',
}

export interface GeneratorParams {
  bars: number;
  tempo: number;
  rootNote: number; // MIDI note number (e.g., 60 is C4)
  scale: ScaleType;
  density: number; // 0-1 probability of note on beat
  velocityMin: number;
  velocityMax: number;
  pitchRange: number; // +/- semitones from root
  noteLengthMin: number; // in 16th notes
  noteLengthMax: number; // in 16th notes
  humanize: number; // 0-1 timing offset
  chaos: number; // 0-1 randomness factor
  seed: number; // Seed for deterministic generation
}

export interface MidiNote {
  noteNumber: number;
  velocity: number;
  startTime: number; // in ticks (PPQ)
  duration: number; // in ticks
  laneIndex: number; // For visualization y-axis
}

export const SCALES: Record<ScaleType, number[]> = {
  [ScaleType.Chromatic]: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  [ScaleType.Major]: [0, 2, 4, 5, 7, 9, 11],
  [ScaleType.Minor]: [0, 2, 3, 5, 7, 8, 10],
  [ScaleType.Dorian]: [0, 2, 3, 5, 7, 9, 10],
  [ScaleType.Phrygian]: [0, 1, 3, 5, 7, 8, 10],
  [ScaleType.Lydian]: [0, 2, 4, 6, 7, 9, 11],
  [ScaleType.Mixolydian]: [0, 2, 4, 5, 7, 9, 10],
  [ScaleType.Locrian]: [0, 1, 3, 5, 6, 8, 10],
  [ScaleType.MajorPentatonic]: [0, 2, 4, 7, 9],
  [ScaleType.MinorPentatonic]: [0, 3, 5, 7, 10],
  [ScaleType.Blues]: [0, 3, 5, 6, 7, 10],
};

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export const PPQ = 480; // Pulses Per Quarter Note (Standard for DAWs)
export const TICKS_PER_16TH = PPQ / 4;