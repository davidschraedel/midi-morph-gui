import React from 'react';
import { GeneratorParams, ScaleType, NOTE_NAMES } from '../types';
import { Sliders, Activity, Music, Zap, Clock, Disc } from 'lucide-react';

interface ControlsProps {
  params: GeneratorParams;
  onChange: (newParams: GeneratorParams) => void;
  isGenerating: boolean;
}

export const Controls: React.FC<ControlsProps> = ({ params, onChange, isGenerating }) => {
  const handleChange = <K extends keyof GeneratorParams>(key: K, value: GeneratorParams[K]) => {
    onChange({ ...params, [key]: value });
  };

  const SectionTitle = ({ icon: Icon, title }: { icon: any, title: string }) => (
    <div className="flex items-center gap-2 mb-3 text-slate-300 font-medium border-b border-slate-700 pb-2 mt-6 first:mt-0">
      <Icon size={16} className="text-sky-400" />
      <span className="text-sm uppercase tracking-wider">{title}</span>
    </div>
  );

  return (
    <div className="flex flex-col gap-1 p-4 h-full overflow-y-auto custom-scrollbar">
      
      {/* Structure */}
      <SectionTitle icon={Disc} title="Structure" />
      
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">Scale</label>
          <select 
            value={params.scale}
            onChange={(e) => handleChange('scale', e.target.value as ScaleType)}
            className="w-full bg-slate-800 text-slate-200 text-sm rounded border border-slate-700 p-2 focus:border-sky-500 focus:outline-none"
          >
            {Object.values(ScaleType).map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>
        <div>
           <label className="text-xs text-slate-400 mb-1 block">Root Note</label>
           <select 
            value={params.rootNote}
            onChange={(e) => handleChange('rootNote', Number(e.target.value))}
            className="w-full bg-slate-800 text-slate-200 text-sm rounded border border-slate-700 p-2 focus:border-sky-500 focus:outline-none"
          >
            {Array.from({length: 24}).map((_, i) => { // C3 to B4
                const val = 48 + i;
                return <option key={val} value={val}>{NOTE_NAMES[val % 12]}{Math.floor(val/12)}</option>
            })}
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label className="text-xs text-slate-400 flex justify-between">
          <span>Tempo (BPM)</span>
          <span className="text-sky-400">{params.tempo}</span>
        </label>
        <input 
          type="range" min="60" max="200" value={params.tempo} 
          onChange={(e) => handleChange('tempo', Number(e.target.value))}
          className="w-full mt-2"
        />
      </div>

      {/* Generation */}
      <SectionTitle icon={Activity} title="Generation" />

      <div>
        <label className="text-xs text-slate-400 flex justify-between">
          <span>Density</span>
          <span className="text-sky-400">{Math.round(params.density * 100)}%</span>
        </label>
        <input 
          type="range" min="0" max="1" step="0.05" value={params.density} 
          onChange={(e) => handleChange('density', Number(e.target.value))}
          className="w-full mt-2"
        />
      </div>

      <div className="mt-4">
        <label className="text-xs text-slate-400 flex justify-between">
          <span>Pitch Range (+/-)</span>
          <span className="text-sky-400">{params.pitchRange} semi</span>
        </label>
        <input 
          type="range" min="0" max="24" value={params.pitchRange} 
          onChange={(e) => handleChange('pitchRange', Number(e.target.value))}
          className="w-full mt-2"
        />
      </div>

      <div className="mt-4">
        <label className="text-xs text-slate-400 flex justify-between">
          <span>Chaos / Randomness</span>
          <span className="text-sky-400">{Math.round(params.chaos * 100)}%</span>
        </label>
        <input 
          type="range" min="0" max="1" step="0.05" value={params.chaos} 
          onChange={(e) => handleChange('chaos', Number(e.target.value))}
          className="w-full mt-2"
        />
      </div>

      {/* Dynamics */}
      <SectionTitle icon={Zap} title="Dynamics" />

      <div className="grid grid-cols-2 gap-2">
         <div>
            <label className="text-xs text-slate-400">Min Vel</label>
            <input 
              type="number" min="0" max="127" value={params.velocityMin}
              onChange={(e) => handleChange('velocityMin', Number(e.target.value))}
              className="w-full bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 p-1 mt-1"
            />
         </div>
         <div>
            <label className="text-xs text-slate-400">Max Vel</label>
            <input 
              type="number" min="0" max="127" value={params.velocityMax}
              onChange={(e) => handleChange('velocityMax', Number(e.target.value))}
              className="w-full bg-slate-800 text-slate-200 text-xs rounded border border-slate-700 p-1 mt-1"
            />
         </div>
      </div>

      <div className="mt-4">
        <label className="text-xs text-slate-400 flex justify-between">
          <span>Humanize (Timing/Vel)</span>
          <span className="text-sky-400">{Math.round(params.humanize * 100)}%</span>
        </label>
        <input 
          type="range" min="0" max="1" step="0.05" value={params.humanize} 
          onChange={(e) => handleChange('humanize', Number(e.target.value))}
          className="w-full mt-2"
        />
      </div>

       {/* Note Lengths */}
       <SectionTitle icon={Clock} title="Note Lengths" />
       
       <div className="flex gap-4">
        <div className="flex-1">
             <label className="text-xs text-slate-400">Min (16ths)</label>
             <input 
                type="range" min="1" max="16" value={params.noteLengthMin}
                onChange={(e) => {
                    const v = Number(e.target.value);
                    if(v > params.noteLengthMax) handleChange('noteLengthMax', v);
                    handleChange('noteLengthMin', v);
                }}
                className="w-full mt-2"
            />
        </div>
        <div className="flex-1">
            <label className="text-xs text-slate-400">Max (16ths)</label>
            <input 
                type="range" min="1" max="16" value={params.noteLengthMax}
                onChange={(e) => {
                    const v = Number(e.target.value);
                    if(v < params.noteLengthMin) handleChange('noteLengthMin', v);
                    handleChange('noteLengthMax', v);
                }}
                className="w-full mt-2"
            />
        </div>
       </div>

    </div>
  );
};