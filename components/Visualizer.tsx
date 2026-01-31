import React, { useMemo } from 'react';
import { MidiNote, NOTE_NAMES, PPQ, GeneratorParams } from '../types';

interface VisualizerProps {
  notes: MidiNote[];
  params: GeneratorParams;
}

export const Visualizer: React.FC<VisualizerProps> = ({ notes, params }) => {
  const height = 500;
  const width = 1000; // Virtual width
  
  // Calculate ranges for scaling
  const minNote = useMemo(() => Math.min(...notes.map(n => n.noteNumber), params.rootNote - 12), [notes, params.rootNote]);
  const maxNote = useMemo(() => Math.max(...notes.map(n => n.noteNumber), params.rootNote + 12), [notes, params.rootNote]);
  const totalTicks = params.bars * 16 * (PPQ / 4);

  const noteHeight = height / (maxNote - minNote + 6); // Add padding
  const tickWidth = width / totalTicks;

  const getNoteY = (noteNum: number) => {
    // Invert Y so high notes are at top
    return height - ((noteNum - minNote + 2) * noteHeight);
  };

  const getNoteColor = (velocity: number) => {
    if (velocity > 100) return '#34d399';
    if (velocity > 70) return '#38bdf8';
    return '#818cf8';
  };

  return (
    <div className="w-full h-full min-w-[800px] bg-slate-900 relative">
      {/* Grid Background */}
      <svg className="w-full h-full" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none">
        <rect width={width} height={height} fill="#0f172a" />
        
        {/* Horizontal Lines (Notes) */}
        {Array.from({ length: maxNote - minNote + 6 }).map((_, i) => {
          const noteNum = minNote - 2 + i;
          const isBlackKey = [1, 3, 6, 8, 10].includes(noteNum % 12);
          const y = height - ((i + 1) * noteHeight);
          
          return (
            <g key={`grid-h-${i}`}>
              <rect 
                x={0} 
                y={y} 
                width={width} 
                height={noteHeight} 
                fill={isBlackKey ? '#1e293b' : '#334155'} 
                opacity={0.3} 
              />
              <line 
                x1={0} y1={y} x2={width} y2={y} 
                stroke="#1e293b" 
                strokeWidth={1} 
              />
              {/* Note Labels on Left */}
              {i % 2 === 0 && (
                <text x={4} y={y + noteHeight - 4} fontSize={10} fill="#64748b">
                  {NOTE_NAMES[noteNum % 12]}{Math.floor(noteNum / 12)}
                </text>
              )}
            </g>
          );
        })}

        {/* Vertical Lines (Beats) */}
        {Array.from({ length: params.bars * 4 + 1 }).map((_, i) => {
          const x = i * (PPQ * tickWidth);
          return (
            <line 
              key={`grid-v-${i}`} 
              x1={x} y1={0} x2={x} y2={height} 
              stroke="#475569" 
              strokeWidth={i % 4 === 0 ? 2 : 0.5} 
              opacity={0.5}
            />
          );
        })}

        {/* Notes */}
        {notes.map((note, i) => (
          <rect
            key={i}
            x={note.startTime * tickWidth}
            y={getNoteY(note.noteNumber)}
            width={Math.max(2, note.duration * tickWidth)}
            height={noteHeight - 1}
            rx={2}
            fill={getNoteColor(note.velocity)}
            stroke="rgba(255,255,255,0.2)"
            strokeWidth={1}
            className="transition-all duration-75 ease-out hover:opacity-80"
          >
            <title>{`${NOTE_NAMES[note.noteNumber % 12]}${Math.floor(note.noteNumber / 12)} | Vel: ${note.velocity}`}</title>
          </rect>
        ))}
      </svg>
      
      {/* Empty State Overlay */}
      {notes.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <p className="text-slate-500 font-mono">No notes generated</p>
        </div>
      )}
    </div>
  );
};