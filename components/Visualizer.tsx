import React, { useMemo } from 'react';
import { MidiNote, NOTE_NAMES, PPQ, GeneratorParams } from '../types';

interface VisualizerProps {
  notes: MidiNote[];
  params: GeneratorParams;
}

const BAUHAUS = {
  red: '#D92121',
  blue: '#0F4C81',
  yellow: '#F0C808',
  black: '#1A1A1A',
  white: '#F7F7F7',
};

export const Visualizer: React.FC<VisualizerProps> = ({ notes, params }) => {
  const height = 500;
  const width = 1000;

  const minNote = useMemo(
    () => Math.min(...notes.map((n) => n.noteNumber), params.rootNote - 12),
    [notes, params.rootNote],
  );
  const maxNote = useMemo(
    () => Math.max(...notes.map((n) => n.noteNumber), params.rootNote + 12),
    [notes, params.rootNote],
  );
  const totalTicks = params.bars * 16 * (PPQ / 4);

  const noteHeight = height / (maxNote - minNote + 6);
  const tickWidth = width / totalTicks;

  const getNoteY = (noteNum: number) => {
    return height - ((noteNum - minNote + 2) * noteHeight);
  };

  const getNoteColor = (velocity: number) => {
    if (velocity > 100) return BAUHAUS.red;
    if (velocity > 70) return BAUHAUS.blue;
    return BAUHAUS.yellow;
  };

  return (
    <div className="w-full h-full min-w-[800px] min-h-[400px] bg-bauhaus-white grid-bg relative">
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        {/* Horizontal grid rows */}
        {Array.from({ length: maxNote - minNote + 6 }).map((_, i) => {
          const noteNum = minNote - 2 + i;
          const isBlackKey = [1, 3, 6, 8, 10].includes(noteNum % 12);
          const y = height - ((i + 1) * noteHeight);

          return (
            <g key={`grid-h-${i}`}>
              {isBlackKey && (
                <rect
                  x={32}
                  y={y}
                  width={width - 32}
                  height={noteHeight}
                  fill={BAUHAUS.yellow}
                  opacity={0.15}
                />
              )}
              <line
                x1={32}
                y1={y}
                x2={width}
                y2={y}
                stroke={BAUHAUS.black}
                strokeWidth={1}
                opacity={0.15}
              />
            </g>
          );
        })}

        {/* Vertical beat lines */}
        {Array.from({ length: params.bars * 4 + 1 }).map((_, i) => {
          const x = 32 + i * (PPQ * tickWidth);
          return (
            <line
              key={`grid-v-${i}`}
              x1={x}
              y1={0}
              x2={x}
              y2={height}
              stroke={BAUHAUS.black}
              strokeWidth={i % 4 === 0 ? 2 : 1}
              opacity={i % 4 === 0 ? 0.25 : 0.1}
            />
          );
        })}

        {/* Notes */}
        {notes.map((note, i) => (
          <rect
            key={i}
            x={32 + note.startTime * tickWidth}
            y={getNoteY(note.noteNumber)}
            width={Math.max(2, note.duration * tickWidth)}
            height={noteHeight - 2}
            fill={getNoteColor(note.velocity)}
            stroke={BAUHAUS.black}
            strokeWidth={3}
          >
            <title>{`${NOTE_NAMES[note.noteNumber % 12]}${Math.floor(note.noteNumber / 12)} | Vel: ${note.velocity}`}</title>
          </rect>
        ))}
      </svg>

      {/* Y-axis labels */}
      <div className="absolute left-0 top-0 bottom-0 w-8 bg-bauhaus-white border-r-3 border-bauhaus-black flex flex-col text-[10px] font-bold text-center pointer-events-none">
        {Array.from({ length: maxNote - minNote + 6 }).map((_, i) => {
          const noteNum = minNote - 2 + i;
          const isBlackKey = [1, 3, 6, 8, 10].includes(noteNum % 12);
          const rowHeight = `${100 / (maxNote - minNote + 6)}%`;

          return (
            <div
              key={`label-${i}`}
              className={`flex items-center justify-center border-b border-bauhaus-black/20 ${
                isBlackKey ? 'bg-bauhaus-yellow/20' : ''
              }`}
              style={{ height: rowHeight }}
            >
              {i % 2 === 0 && (
                <span>
                  {NOTE_NAMES[noteNum % 12]}
                  {Math.floor(noteNum / 12)}
                </span>
              )}
            </div>
          );
        })}
      </div>

      {notes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none ml-8">
          <p className="text-bauhaus-black/50 font-bold uppercase tracking-widest text-sm">
            No notes generated
          </p>
        </div>
      )}
    </div>
  );
};
