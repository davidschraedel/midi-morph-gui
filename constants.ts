import { GeneratorParams, ScaleType } from './types';

export const DEFAULT_PARAMS: GeneratorParams = {
  bars: 4,
  tempo: 120,
  rootNote: 60, // C4
  scale: ScaleType.MinorPentatonic,
  density: 0.5,
  velocityMin: 60,
  velocityMax: 100,
  pitchRange: 12, // 1 octave +/-
  noteLengthMin: 1,
  noteLengthMax: 4,
  humanize: 0.1,
  chaos: 0.2
};

export const NOTE_COLORS = {
  highVelocity: '#34d399', // emerald-400
  medVelocity: '#38bdf8', // sky-400
  lowVelocity: '#818cf8', // indigo-400
};