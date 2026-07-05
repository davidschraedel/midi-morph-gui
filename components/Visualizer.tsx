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
  charcoal: '#2A2A2A',
  white: '#F0EBE3',
  light: '#FAF7F2',
  shade: '#E3D9CC',
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

  const noteCluster = useMemo(() => {
    if (notes.length === 0) return null;

    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;

    notes.forEach((note) => {
      const x = 32 + note.startTime * tickWidth;
      const w = Math.max(2, note.duration * tickWidth);
      const y = getNoteY(note.noteNumber);
      const h = noteHeight - 2;

      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x + w);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y + h);
    });

    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const rx = Math.max((maxX - minX) / 2 + 80, 140);
    const ry = Math.max((maxY - minY) / 2 + 60, 110);

    return { cx, cy, rx, ry };
  }, [notes, tickWidth, noteHeight, minNote]);

  return (
    <div
      className="w-full h-full min-w-[800px] min-h-[400px] relative"
      style={{
        background: `linear-gradient(to bottom, ${BAUHAUS.light} 0%, ${BAUHAUS.shade} 100%)`,
      }}
    >
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <defs>
          <linearGradient id="vizAmbient" x1="0" y1="0" x2="0" y2={height} gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor={BAUHAUS.light} />
            <stop offset="100%" stopColor={BAUHAUS.shade} />
          </linearGradient>
          <radialGradient id="noteClusterGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={BAUHAUS.yellow} stopOpacity="0.22" />
            <stop offset="55%" stopColor={BAUHAUS.blue} stopOpacity="0.12" />
            <stop offset="100%" stopColor={BAUHAUS.shade} stopOpacity="0" />
          </radialGradient>
        </defs>

        <rect x={0} y={0} width={width} height={height} fill="url(#vizAmbient)" />

        {noteCluster && (
          <ellipse
            cx={noteCluster.cx}
            cy={noteCluster.cy}
            rx={noteCluster.rx}
            ry={noteCluster.ry}
            fill="url(#noteClusterGlow)"
          />
        )}

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
                stroke={BAUHAUS.charcoal}
                strokeWidth={1}
                opacity={0.1}
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
              stroke={BAUHAUS.charcoal}
              strokeWidth={i % 4 === 0 ? 1.5 : 1}
              opacity={i % 4 === 0 ? 0.18 : 0.06}
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
            strokeWidth={1}
          >
            <title>{`${NOTE_NAMES[note.noteNumber % 12]}${Math.floor(note.noteNumber / 12)} | Vel: ${note.velocity}`}</title>
          </rect>
        ))}
      </svg>

      {/* Y-axis labels */}
      <div
        className="absolute left-0 top-0 bottom-0 w-8 border-r-2 border-bauhaus-black flex flex-col text-[10px] font-semibold text-center pointer-events-none text-bauhaus-charcoal"
        style={{
          background: `linear-gradient(to bottom, ${BAUHAUS.light} 0%, ${BAUHAUS.shade} 100%)`,
        }}
      >
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
          <p className="text-bauhaus-charcoal/50 font-normal tracking-wide text-sm">
            No notes generated
          </p>
        </div>
      )}
    </div>
  );
};
