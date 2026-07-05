import { GeneratorParams, MidiNote, ScaleType, SCALES, TICKS_PER_16TH } from '../types';

const CHAOS_SCALE_BREAK = 0.35;
const CHAOS_DENSITY_JITTER = 0.4;
const CHAOS_STEP_GAP = 0.2;
const COHERENT_INTERVALS = [-2, -1, 0, 1, 2];
const COHERENT_WEIGHTS = [1, 2, 4, 2, 1];

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

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const nearestInPool = (pool: number[], target: number): number => {
    let best = pool[0];
    let bestDist = Math.abs(pool[0] - target);
    for (let j = 1; j < pool.length; j++) {
        const dist = Math.abs(pool[j] - target);
        if (dist < bestDist) {
            bestDist = dist;
            best = pool[j];
        }
    }
    return best;
};

const weightedPick = (rng: () => number, items: number[], weights: number[]): number => {
    const total = weights.reduce((sum, w) => sum + w, 0);
    let roll = rng() * total;
    for (let j = 0; j < items.length; j++) {
        roll -= weights[j];
        if (roll <= 0) return items[j];
    }
    return items[items.length - 1];
};

const pickMelodyNote = (
    rng: () => number,
    pool: number[],
    chaos: number,
    rootNote: number,
    lastNote: number | null,
): number => {
    const branchRoll = rng();
    const pickRoll = rng();

    if (chaos >= 1 || branchRoll < chaos) {
        return pool[Math.floor(pickRoll * pool.length)];
    }

    const anchor = lastNote ?? rootNote;
    const interval = weightedPick(() => pickRoll, COHERENT_INTERVALS, COHERENT_WEIGHTS);
    return nearestInPool(pool, anchor + interval);
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

  let lastNoteNumber: number | null = null;
  const maxTick = totalSteps * TICKS_PER_16TH - 1;

  for (let i = 0; i < totalSteps; i++) {
    // Density jitter + gate
    const densityJitterRoll = rng();
    const effectiveDensity = clamp(
      params.density + (densityJitterRoll - 0.5) * 2 * params.chaos * CHAOS_DENSITY_JITTER,
      0,
      1,
    );
    const densityGateRoll = rng();
    if (densityGateRoll > effectiveDensity) continue;

    // Determine Note Length
    let lengthSteps = getRandomInt(rng, params.noteLengthMin, params.noteLengthMax);
    
    // Crop if it exceeds total duration
    if (i + lengthSteps > totalSteps) {
      lengthSteps = totalSteps - i;
    }

    // Pick Note
    let noteNumber = pickMelodyNote(
      rng,
      availableNotes,
      params.chaos,
      params.rootNote,
      lastNoteNumber,
    );

    // Scale break: occasional ±1 semitone nudge
    const scaleBreakRoll = rng();
    const nudgeRoll = rng();
    if (
      params.scale !== ScaleType.Chromatic &&
      scaleBreakRoll < params.chaos * CHAOS_SCALE_BREAK
    ) {
      const nudge = nudgeRoll < 0.5 ? -1 : 1;
      noteNumber = clamp(noteNumber + nudge, minNote, maxNote);
    }

    lastNoteNumber = noteNumber;

    // Velocity
    let velocity = getRandomInt(rng, params.velocityMin, params.velocityMax);
    
    // Humanize Velocity - Calculate jitter even if humanize is 0 to keep RNG synced
    const velocityJitterRaw = rng(); 
    if (params.humanize > 0) {
        const jitter = (velocityJitterRaw - 0.5) * 20 * params.humanize;
        velocity = Math.max(1, Math.min(127, Math.floor(velocity + jitter)));
    }

    // Macro timing: blend grid position toward a random tick in the bar
    const gridTick = i * TICKS_PER_16TH;
    let startTick = gridTick;
    const macroTimingRaw = rng();
    if (params.timing > 0) {
      const randomTick = macroTimingRaw * maxTick;
      startTick = gridTick + (randomTick - gridTick) * params.timing;
    }

    // Timing Offset - Calculate offset even if humanize is 0
    const timingOffsetRaw = rng();
    if (params.humanize > 0) {
       const offset = (timingOffsetRaw - 0.5) * (TICKS_PER_16TH / 2) * params.humanize;
       startTick += offset;
    }
    startTick = clamp(Math.floor(startTick), 0, maxTick);

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

    // Step gap: occasional skip of the next grid step
    const gapRoll = rng();
    if (gapRoll < params.chaos * CHAOS_STEP_GAP) {
      i += 1;
    }
  }

  return notes;
};
