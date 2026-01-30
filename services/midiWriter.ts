import { MidiNote, PPQ } from '../types';

function stringToBytes(str: string): number[] {
  return str.split('').map(char => char.charCodeAt(0));
}

function writeVarInt(value: number): number[] {
  if (value === 0) return [0];
  const bytes = [];
  let v = value;
  while (v > 0) {
    bytes.unshift(v & 0x7F);
    v >>= 7;
  }
  for (let i = 0; i < bytes.length - 1; i++) {
    bytes[i] |= 0x80;
  }
  return bytes;
}

function numberToBytes(number: number, bytes: number): number[] {
  const result = [];
  for (let i = bytes - 1; i >= 0; i--) {
    result.push((number >> (8 * i)) & 0xFF);
  }
  return result;
}

export const createMidiFile = (notes: MidiNote[], tempo: number): Blob => {
  // 1. Header Chunk
  // MThd + length(6) + format(1) + tracks(1) + division(PPQ)
  const header = [
    ...stringToBytes('MThd'),
    ...numberToBytes(6, 4),
    ...numberToBytes(0, 2), // Format 0 (single track)
    ...numberToBytes(1, 2), // 1 Track
    ...numberToBytes(PPQ, 2)
  ];

  // 2. Track Events
  const events: { deltaTime: number, type: number, data: number[] }[] = [];

  // Tempo Meta Event (Set Tempo)
  // Microseconds per quarter note = 60,000,000 / BPM
  const mpqn = Math.floor(60000000 / tempo);
  events.push({
    deltaTime: 0,
    type: 0xFF, // Meta
    data: [0x51, 0x03, ...numberToBytes(mpqn, 3)]
  });

  // Convert Notes to On/Off events
  const noteEvents: { tick: number, type: 'on' | 'off', note: number, velocity: number }[] = [];

  notes.forEach(n => {
    noteEvents.push({ tick: n.startTime, type: 'on', note: n.noteNumber, velocity: n.velocity });
    noteEvents.push({ tick: n.startTime + n.duration, type: 'off', note: n.noteNumber, velocity: 0 });
  });

  // Sort events by time
  noteEvents.sort((a, b) => a.tick - b.tick);

  let currentTime = 0;
  noteEvents.forEach(e => {
    const delta = e.tick - currentTime;
    currentTime = e.tick;

    const statusByte = e.type === 'on' ? 0x90 : 0x80;
    
    events.push({
      deltaTime: delta,
      type: statusByte,
      data: [e.note, e.velocity]
    });
  });

  // End of Track Meta Event
  events.push({
    deltaTime: 0,
    type: 0xFF,
    data: [0x2F, 0x00]
  });

  // 3. Serialize Track
  let trackData: number[] = [];
  events.forEach(e => {
    trackData.push(...writeVarInt(e.deltaTime));
    if (e.type >= 0xF0) {
      // Meta event or Sysex
      trackData.push(e.type);
      trackData.push(...e.data);
    } else {
      // Channel event
      trackData.push(e.type);
      trackData.push(...e.data);
    }
  });

  const trackHeader = [
    ...stringToBytes('MTrk'),
    ...numberToBytes(trackData.length, 4)
  ];

  const fileData = new Uint8Array([...header, ...trackHeader, ...trackData]);
  return new Blob([fileData], { type: 'audio/midi' });
};