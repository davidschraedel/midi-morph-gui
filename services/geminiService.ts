import { GoogleGenAI, Type } from "@google/genai";
import { GeneratorParams, ScaleType } from "../types";
import { DEFAULT_PARAMS } from "../constants";

export const generateParamsWithAI = async (prompt: string): Promise<Partial<GeneratorParams>> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey });

  // List valid scale values for the system instruction
  const scaleValues = Object.values(ScaleType).join(", ");

  const systemInstruction = `
    You are a music producer expert. 
    Convert the user's natural language description into a JSON configuration for a MIDI generator.
    
    The available scales are: ${scaleValues}.
    Root Note is a MIDI number (e.g., 60 is Middle C).
    Density is 0.0 to 1.0.
    Velocity is 0-127.
    Pitch range is semitones (+/-).
    
    Return a JSON object matching the requested schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            scale: { type: Type.STRING, enum: Object.values(ScaleType) },
            rootNote: { type: Type.INTEGER },
            tempo: { type: Type.INTEGER },
            density: { type: Type.NUMBER },
            velocityMin: { type: Type.INTEGER },
            velocityMax: { type: Type.INTEGER },
            pitchRange: { type: Type.INTEGER },
            chaos: { type: Type.NUMBER },
            humanize: { type: Type.NUMBER },
            noteLengthMin: { type: Type.INTEGER },
            noteLengthMax: { type: Type.INTEGER },
          },
          required: ["scale", "tempo", "rootNote"]
        }
      }
    });

    if (response.text) {
      const data = JSON.parse(response.text);
      // Merge with defaults to ensure safety
      return { ...DEFAULT_PARAMS, ...data };
    }
    return {};
  } catch (error) {
    console.error("Gemini AI generation failed:", error);
    throw error;
  }
};