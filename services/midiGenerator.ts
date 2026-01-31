import { GeneratorParams, MidiNote, SCALES, TICKS_PER_16TH } from '../types';

// Park-Miller LCG (Lehmer random number generator)
// Returns a deterministic sequence based on seed
const createSeededRandom = (seed: number) => {
    let state = seed % 2147483647;
    if (state <= 0) state += 2147483646;
    return () => {
        state = (state * 16807) % 2147483647;
        return (state - 1) / 2147483646;
    };
};

const getRandomInt = (rng: () => number, min: number, max: number) => {
    return Math.floor(rng() * (max - min + 1)) + min;
};

export const generateNotes = (params: GeneratorParams): MidiNote[] => {
  const notes: MidiNote[] = [];
  const totalSteps = params.bars * 16; // 16th notes total
  const scaleIntervals = SCALES[params.scale];
  
  // Initialize RNG
  const rng = createSeededRandom(params.seed);

  // Calculate available note pool based on root and pitch range
  const availableNotes: number[] = [];
  const minNote = params.rootNote - params.pitchRange;
  const maxNote = params.rootNote + params.pitchRange;

  for (let n = 0; n <= 127; n++) {
    let degree = (n - params.rootNote) % 12;
    if (degree < 0) degree += 12;

    if (scaleIntervals.includes(degree) && n >= minNote && n <= maxNote) {
      availableNotes.push(n);
    }
  }

  if (availableNotes.length === 0) return []; // Fallback

  for (let i = 0; i < totalSteps; i++) {
    // Density Check
    if (rng() > params.density) continue;

    // Determine Note Length
    let lengthSteps = getRandomInt(rng, params.noteLengthMin, params.noteLengthMax);
    
    // Crop if it exceeds total duration
    if (i + lengthSteps > totalSteps) {
      lengthSteps = totalSteps - i;
    }

    // Pick Note
    const noteIndex = getRandomInt(rng, 0, availableNotes.length - 1);
    const noteNumber = availableNotes[noteIndex];

    // Velocity
    let velocity = getRandomInt(rng, params.velocityMin, params.velocityMax);
    
    // Humanize Velocity - Calculate jitter even if humanize is 0 to keep RNG synced
    const velocityJitterRaw = rng(); 
    if (params.humanize > 0) {
        const jitter = (velocityJitterRaw - 0.5) * 20 * params.humanize;
        velocity = Math.max(1, Math.min(127, Math.floor(velocity + jitter)));
    }

    // Timing Offset - Calculate offset even if humanize is 0
    let startTick = i * TICKS_PER_16TH;
    const timingOffsetRaw = rng();
    if (params.humanize > 0) {
       const offset = (timingOffsetRaw - 0.5) * (TICKS_PER_16TH / 2) * params.humanize;
       startTick += offset;
    }
    if (startTick < 0) startTick = 0;

    // Duration Humanization
    const durationRaw = rng();
    const durationHumanizeFactor = 0.9 + (durationRaw * 0.1 * params.humanize);
    const duration = Math.floor(lengthSteps * TICKS_PER_16TH * durationHumanizeFactor);

    notes.push({
      noteNumber,
      velocity,
      startTime: Math.floor(startTick),
      duration: duration,
      laneIndex: noteNumber
    });
  }

  return notes;
};