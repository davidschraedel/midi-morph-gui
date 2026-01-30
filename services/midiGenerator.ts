import { GeneratorParams, MidiNote, SCALES, TICKS_PER_16TH } from '../types';

// Pseudo-random number generator for seeded randomness if needed in future
// For now using Math.random() for true exploration
const random = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export const generateNotes = (params: GeneratorParams): MidiNote[] => {
  const notes: MidiNote[] = [];
  const totalSteps = params.bars * 16; // 16th notes total
  const scaleIntervals = SCALES[params.scale];
  
  // Calculate available note pool based on root and pitch range
  const availableNotes: number[] = [];
  // Expand scale across octaves relevant to range
  const minNote = params.rootNote - params.pitchRange;
  const maxNote = params.rootNote + params.pitchRange;

  for (let n = 0; n <= 127; n++) {
    const semitone = n % 12;
    const octaveBase = n - semitone;
    const rootSemitone = params.rootNote % 12;
    
    // Normalize to root C=0 for scale lookup if scale starts at 0
    // Actually simpler: check if (n - rootNote) % 12 is in scale
    let degree = (n - params.rootNote) % 12;
    if (degree < 0) degree += 12;

    if (scaleIntervals.includes(degree) && n >= minNote && n <= maxNote) {
      availableNotes.push(n);
    }
  }

  if (availableNotes.length === 0) return []; // Fallback

  for (let i = 0; i < totalSteps; i++) {
    // Density Check
    if (Math.random() > params.density) continue;

    // Determine Note Length
    // Bias towards shorter notes generally, unless chaos is high
    let lengthSteps = random(params.noteLengthMin, params.noteLengthMax);
    
    // Prevent overlapping into next bar too much if desired, or let it flow
    // Crop if it exceeds total duration
    if (i + lengthSteps > totalSteps) {
      lengthSteps = totalSteps - i;
    }

    // Pick Note
    // Use chaos to determine how "jumpy" the melody is
    // For simple random:
    const noteIndex = random(0, availableNotes.length - 1);
    const noteNumber = availableNotes[noteIndex];

    // Velocity
    // Add humanize jitter
    let velocity = random(params.velocityMin, params.velocityMax);
    if (params.humanize > 0) {
        const jitter = (Math.random() - 0.5) * 20 * params.humanize;
        velocity = Math.max(1, Math.min(127, Math.floor(velocity + jitter)));
    }

    // Timing Offset (Humanize)
    // Shift start time slightly
    let startTick = i * TICKS_PER_16TH;
    if (params.humanize > 0) {
       const offset = (Math.random() - 0.5) * (TICKS_PER_16TH / 2) * params.humanize;
       startTick += offset;
    }
    if (startTick < 0) startTick = 0;

    notes.push({
      noteNumber,
      velocity,
      startTime: Math.floor(startTick),
      duration: Math.floor(lengthSteps * TICKS_PER_16TH * (0.9 + (Math.random() * 0.1 * params.humanize))), // Slightly detached
      laneIndex: noteNumber
    });

    // Skip steps if we want monophonic behavior roughly, 
    // but for polyphonic random clouds, we don't skip `i`.
    // Let's assume a monophonic/arpeggiator style generator for "melody"
    // If we want chords, we'd stack. 
    // Let's do a simple "step sequencer" style where density decides if a note starts here.
  }

  return notes;
};