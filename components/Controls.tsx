import React from "react";
import { GeneratorParams, ScaleType, NOTE_NAMES } from "../types";

interface ControlsProps {
  params: GeneratorParams;
  onChange: (newParams: GeneratorParams) => void;
  isGenerating: boolean;
}

type SectionVariant = "black" | "red" | "yellow" | "blue";

const sectionStyles: Record<SectionVariant, string> = {
  black: "border-l-4 border-bauhaus-black bg-bauhaus-black/10 text-bauhaus-black",
  red: "border-l-4 border-bauhaus-red bg-bauhaus-red/10 text-bauhaus-black",
  yellow: "border-l-4 border-bauhaus-yellow bg-bauhaus-yellow/10 text-bauhaus-black",
  blue: "border-l-4 border-bauhaus-blue bg-bauhaus-blue/10 text-bauhaus-black",
};

const valueStyles: Record<SectionVariant, string> = {
  black: "text-bauhaus-blue",
  red: "text-bauhaus-red",
  yellow: "text-bauhaus-charcoal",
  blue: "text-bauhaus-blue",
};

const inputClass =
  "bauhaus-input w-full border-2 border-bauhaus-black bg-bauhaus-white p-2 font-normal text-sm focus:outline-none rounded-none";

export const Controls: React.FC<ControlsProps> = ({ params, onChange }) => {
  const handleChange = <K extends keyof GeneratorParams>(
    key: K,
    value: GeneratorParams[K],
  ) => {
    onChange({ ...params, [key]: value });
  };

  const SectionTitle = ({
    title,
    variant,
  }: {
    title: string;
    variant: SectionVariant;
  }) => (
    <h2
      className={`block px-2 py-1 text-xs font-extrabold uppercase tracking-wide mb-3 ${sectionStyles[variant]}`}
    >
      {title}
    </h2>
  );

  const SliderLabel = ({
    label,
    value,
    variant,
  }: {
    label: string;
    value: string;
    variant: SectionVariant;
  }) => (
    <div className="flex justify-between items-baseline mb-1">
      <label className="text-xs font-semibold tracking-wide">
        {label}
      </label>
      <span className={`text-sm font-normal ${valueStyles[variant]}`}>
        {value}
      </span>
    </div>
  );

  return (
    <div className="flex flex-col md:h-full md:overflow-y-auto custom-scrollbar">
      {/* Structure */}
      <div className="border-b-2 border-bauhaus-black p-5">
        <SectionTitle title="Structure" variant="black" />

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold mb-1 tracking-wide">
              Scale
            </label>
            <select
              value={params.scale}
              onChange={(e) =>
                handleChange("scale", e.target.value as ScaleType)
              }
              className={inputClass}
            >
              {Object.values(ScaleType).map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 tracking-wide">
              Root
            </label>
            <select
              value={params.rootNote}
              onChange={(e) => handleChange("rootNote", Number(e.target.value))}
              className={inputClass}
            >
              {Array.from({ length: 24 }).map((_, i) => {
                const val = 48 + i;
                return (
                  <option key={val} value={val}>
                    {NOTE_NAMES[val % 12]}
                    {Math.floor(val / 12)}
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        <div>
          <SliderLabel
            label="Tempo"
            value={`${params.tempo} BPM`}
            variant="black"
          />
          <input
            type="range"
            min="60"
            max="200"
            value={params.tempo}
            onChange={(e) => handleChange("tempo", Number(e.target.value))}
            className="bauhaus-slider"
          />
        </div>
      </div>

      {/* Generation */}
      <div className="border-b-2 border-bauhaus-black p-5 bg-bauhaus-red/[0.04]">
        <SectionTitle title="Generation" variant="red" />

        <div className="mb-5">
          <SliderLabel
            label="Density"
            value={`${Math.round(params.density * 100)}%`}
            variant="red"
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={params.density}
            onChange={(e) => handleChange("density", Number(e.target.value))}
            className="bauhaus-slider thumb-red"
          />
        </div>

        <div className="mb-5">
          <SliderLabel
            label="Pitch Range"
            value={`${params.pitchRange} semi`}
            variant="red"
          />
          <input
            type="range"
            min="0"
            max="24"
            value={params.pitchRange}
            onChange={(e) => handleChange("pitchRange", Number(e.target.value))}
            className="bauhaus-slider thumb-red"
          />
        </div>

        <div>
          <SliderLabel
            label="Chaos"
            value={`${Math.round(params.chaos * 100)}%`}
            variant="red"
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={params.chaos}
            onChange={(e) => handleChange("chaos", Number(e.target.value))}
            className="bauhaus-slider thumb-red"
          />
        </div>
      </div>

      {/* Dynamics */}
      <div className="border-b-2 border-bauhaus-black p-5">
        <SectionTitle title="Dynamics" variant="yellow" />

        <div className="grid grid-cols-2 gap-4 mb-5">
          <div>
            <label className="block text-xs font-semibold mb-1 tracking-wide">
              Min vel
            </label>
            <input
              type="number"
              min="0"
              max="127"
              value={params.velocityMin}
              onChange={(e) =>
                handleChange("velocityMin", Number(e.target.value))
              }
              className={`${inputClass} text-center`}
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-1 tracking-wide">
              Max vel
            </label>
            <input
              type="number"
              min="0"
              max="127"
              value={params.velocityMax}
              onChange={(e) =>
                handleChange("velocityMax", Number(e.target.value))
              }
              className={`${inputClass} text-center`}
            />
          </div>
        </div>

        <div>
          <SliderLabel
            label="Humanize"
            value={`${Math.round(params.humanize * 100)}%`}
            variant="yellow"
          />
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={params.humanize}
            onChange={(e) => handleChange("humanize", Number(e.target.value))}
            className="bauhaus-slider thumb-yellow"
          />
        </div>
      </div>

      {/* Note Lengths */}
      <div className="p-5 pb-8">
        <SectionTitle title="Note Lengths" variant="blue" />

        <div className="flex gap-4">
          <div className="flex-1">
            <SliderLabel
              label="Min (16ths)"
              value={`${params.noteLengthMin}`}
              variant="blue"
            />
            <input
              type="range"
              min="1"
              max="16"
              value={params.noteLengthMin}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v > params.noteLengthMax) handleChange("noteLengthMax", v);
                handleChange("noteLengthMin", v);
              }}
              className="bauhaus-slider thumb-blue"
            />
          </div>
          <div className="flex-1">
            <SliderLabel
              label="Max (16ths)"
              value={`${params.noteLengthMax}`}
              variant="blue"
            />
            <input
              type="range"
              min="1"
              max="16"
              value={params.noteLengthMax}
              onChange={(e) => {
                const v = Number(e.target.value);
                if (v < params.noteLengthMin) handleChange("noteLengthMin", v);
                handleChange("noteLengthMax", v);
              }}
              className="bauhaus-slider thumb-blue"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
