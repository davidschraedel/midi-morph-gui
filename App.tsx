import React, { useState, useEffect, useRef } from 'react';
import { Download, Play, RefreshCw, Music4 } from 'lucide-react';
import { GeneratorParams, MidiNote } from './types';
import { DEFAULT_PARAMS } from './constants';
import { generateNotes } from './services/midiGenerator';
import { createMidiFile } from './services/midiWriter';
import { Controls } from './components/Controls';
import { Visualizer } from './components/Visualizer';

const App: React.FC = () => {
  const [params, setParams] = useState<GeneratorParams>(DEFAULT_PARAMS);
  const [notes, setNotes] = useState<MidiNote[]>([]);
  
  // Audio Context for Preview (Simple Oscillator)
  const audioCtxRef = useRef<AudioContext | null>(null);
  const notesRef = useRef<MidiNote[]>([]); // Ref to access current notes in audio loop

  // Keep notes ref updated
  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  // Real-time regeneration
  useEffect(() => {
    const newNotes = generateNotes(params);
    setNotes(newNotes);
  }, [params]);

  // Audio Preview Logic
  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume();
    }
  };

  const playSound = (note: MidiNote, time: number) => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();
    
    // Convert MIDI to Freq
    const freq = 440 * Math.pow(2, (note.noteNumber - 69) / 12);
    osc.frequency.value = freq;
    osc.type = 'triangle'; // Smoother than square
    
    // Velocity to Gain
    const vol = note.velocity / 127 * 0.3; // Limit master volume
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, time + (note.duration / 480 * 60 / params.tempo));
    
    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);
    
    osc.start(time);
    osc.stop(time + (note.duration / 480 * 60 / params.tempo) + 0.1);
  };

  const playPreview = async () => {
    initAudio();
    if (!audioCtxRef.current) return;

    // Very simple "play once" for preview
    const now = audioCtxRef.current.currentTime;
    notes.forEach(note => {
      // Calculate time in seconds based on tick
      // tick / PPQ = quarter notes
      // quarter notes * (60/BPM) = seconds
      const timeInSeconds = (note.startTime / 480) * (60 / params.tempo);
      playSound(note, now + timeInSeconds + 0.1);
    });
  };

  const handleDownload = () => {
    const blob = createMidiFile(notes, params.tempo);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `midi-morph-${Date.now()}.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-screen w-screen bg-slate-950 text-slate-100 font-sans overflow-hidden">
      
      {/* Sidebar */}
      <aside className="w-80 flex flex-col border-r border-slate-800 bg-slate-900 z-10 shadow-2xl">
        <div className="p-4 border-b border-slate-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-gradient-to-br from-sky-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-sky-900/50">
                <Music4 size={18} className="text-white" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-indigo-400">MIDI Morph</h1>
        </div>
        
        <div className="flex-1 overflow-hidden">
          <Controls params={params} onChange={setParams} isGenerating={false} />
        </div>
        
        <div className="p-4 border-t border-slate-800 bg-slate-900/50 text-xs text-slate-500 text-center">
            v1.0.0 &bull; Local Generation
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-slate-950 relative">
        
        {/* Top Bar */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-6 bg-slate-900/30 backdrop-blur-sm">
            <div className="flex items-center gap-4">
               <button 
                onClick={() => setParams({...params})} // Trigger regen
                className="flex items-center gap-2 px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium transition-colors"
               >
                 <RefreshCw size={14} />
                 Randomize Pattern
               </button>
            </div>
            
            <div className="flex items-center gap-3">
               <div className="px-4 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-xs text-slate-500">
                  {notes.length} Notes Generated
               </div>
               <button 
                 onClick={playPreview}
                 className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-lg shadow-indigo-900/20 active:scale-95 transition-all"
               >
                 <Play size={16} fill="currentColor" />
                 Preview
               </button>
               <button 
                 onClick={handleDownload}
                 className="flex items-center gap-2 px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-900 font-bold shadow-lg shadow-sky-900/20 active:scale-95 transition-all"
               >
                 <Download size={18} />
                 Export MIDI
               </button>
            </div>
        </header>

        {/* Visualization Area */}
        <div className="flex-1 p-6 overflow-hidden flex flex-col">
            <Visualizer notes={notes} params={params} />
            <div className="mt-4 text-center text-slate-500 text-xs font-mono">
                Dragging sliders updates the generative algorithm in real-time.
            </div>
        </div>

      </main>
    </div>
  );
};

export default App;