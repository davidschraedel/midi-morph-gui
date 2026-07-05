import React, { useState, useEffect, useRef } from "react";
import { Download, Play, RefreshCw } from "lucide-react";
import { GeneratorParams, MidiNote } from "./types";
import { DEFAULT_PARAMS } from "./constants";
import { generateNotes } from "./services/midiGenerator";
import { createMidiFile } from "./services/midiWriter";
import { Controls } from "./components/Controls";
import { Visualizer } from "./components/Visualizer";

const App: React.FC = () => {
  const [params, setParams] = useState<GeneratorParams>(DEFAULT_PARAMS);
  const [notes, setNotes] = useState<MidiNote[]>([]);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const notesRef = useRef<MidiNote[]>([]);

  useEffect(() => {
    notesRef.current = notes;
  }, [notes]);

  useEffect(() => {
    const newNotes = generateNotes(params);
    setNotes(newNotes);
  }, [
    params.bars,
    params.rootNote,
    params.scale,
    params.density,
    params.velocityMin,
    params.velocityMax,
    params.pitchRange,
    params.noteLengthMin,
    params.noteLengthMax,
    params.humanize,
    params.chaos,
    params.seed,
  ]);

  const handleRandomize = () => {
    setParams((prev) => ({
      ...prev,
      seed: Math.floor(Math.random() * 1000000),
    }));
  };

  const initAudio = () => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }
    if (audioCtxRef.current.state === "suspended") {
      audioCtxRef.current.resume();
    }
  };

  const playSound = (note: MidiNote, time: number) => {
    if (!audioCtxRef.current) return;
    const osc = audioCtxRef.current.createOscillator();
    const gain = audioCtxRef.current.createGain();

    const freq = 440 * Math.pow(2, (note.noteNumber - 69) / 12);
    osc.frequency.value = freq;
    osc.type = "triangle";

    const vol = (note.velocity / 127) * 0.3;
    gain.gain.setValueAtTime(0, time);
    gain.gain.linearRampToValueAtTime(vol, time + 0.01);
    gain.gain.exponentialRampToValueAtTime(
      0.001,
      time + ((note.duration / 480) * 60) / params.tempo,
    );

    osc.connect(gain);
    gain.connect(audioCtxRef.current.destination);

    osc.start(time);
    osc.stop(time + ((note.duration / 480) * 60) / params.tempo + 0.1);
  };

  const playPreview = async () => {
    initAudio();
    if (!audioCtxRef.current) return;

    const now = audioCtxRef.current.currentTime;
    notes.forEach((note) => {
      const timeInSeconds = (note.startTime / 480) * (60 / params.tempo);
      playSound(note, now + timeInSeconds + 0.1);
    });
  };

  const handleDownload = () => {
    const blob = createMidiFile(notes, params.tempo);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `midi-random-${Date.now()}.mid`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col md:flex-row h-screen w-screen bg-bauhaus-white text-bauhaus-black font-sans overflow-auto md:overflow-hidden antialiased">
      {/* Sidebar */}
      <aside className="w-full md:w-80 flex-none flex flex-col border-b-4 md:border-b-0 md:border-r-4 border-bauhaus-black bg-bauhaus-white z-10 h-auto md:h-full">
        <div className="px-4 py-3 border-b-4 border-bauhaus-black flex items-center gap-2">
          <div className="w-6 h-6 bg-bauhaus-blue border-3 border-bauhaus-black flex items-center justify-center flex-none">
            <div className="w-2 h-2 bg-bauhaus-yellow rounded-full" />
          </div>
          <h1 className="text-2xl font-extrabold uppercase tracking-widest leading-none mt-1">
            MIDI Random
          </h1>
        </div>

        <div className="md:flex-1 md:overflow-hidden">
          <Controls params={params} onChange={setParams} isGenerating={false} />
        </div>

        <div className="p-2 border-t-4 border-bauhaus-black bg-bauhaus-black text-bauhaus-white text-[10px] font-bold uppercase tracking-wider text-center hidden md:block">
          v1.1.0 · Bauhaus Edition
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col bg-bauhaus-white relative min-w-0 min-h-[500px] md:min-h-0">
        {/* Action Toolbar */}
        <header className="border-b-4 border-bauhaus-black bg-bauhaus-white p-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="flex gap-2 text-sm font-bold flex-1">
              <button
                onClick={handleRandomize}
                className="bauhaus-btn flex-1 bg-bauhaus-white border-3 border-bauhaus-black py-2 px-1 shadow-solid-sm uppercase flex items-center justify-center gap-1"
              >
                <RefreshCw size={16} strokeWidth={2.5} />
                <span className="hidden sm:inline">Random</span>
              </button>
              <button
                onClick={playPreview}
                className="bauhaus-btn flex-1 bg-bauhaus-blue text-bauhaus-white border-3 border-bauhaus-black py-2 px-1 shadow-solid-sm uppercase flex items-center justify-center gap-1"
              >
                <Play size={16} fill="currentColor" />
                <span className="hidden sm:inline">Preview</span>
              </button>
              <button
                onClick={handleDownload}
                className="bauhaus-btn flex-1 bg-bauhaus-red text-bauhaus-white border-3 border-bauhaus-black py-2 px-1 shadow-solid-sm uppercase flex items-center justify-center gap-1"
              >
                <Download size={16} strokeWidth={2.5} />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
            <div className="px-1 text-xs font-bold uppercase tracking-wide text-bauhaus-black/60 text-center sm:text-left whitespace-nowrap">
              {notes.length} Notes
            </div>
          </div>
        </header>

        {/* Visualization Area */}
        <div className="flex-1 overflow-hidden flex flex-col border-b-4 md:border-b-0 border-bauhaus-black">
          <div className="flex-1 overflow-x-auto overflow-y-hidden piano-roll-container">
            <Visualizer notes={notes} params={params} />
          </div>
        </div>
      </main>
    </div>
  );
};

export default App;
