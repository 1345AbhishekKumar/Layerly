'use server';

import { GoogleGenAI, Type as GenAIType } from '@google/genai';
import { env } from '@/data/env';

export async function generateIdeasAction(base64Data: string) {
  try {
    const ai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
    
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [
        { inlineData: { data: base64Data, mimeType: "image/jpeg" } },
        "Analyze this poster image and suggest typography, color palettes, some short catchy slogan text ideas, and text drop shadow effects that would work well with it."
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: GenAIType.OBJECT,
          properties: {
            slogans: {
              type: GenAIType.ARRAY,
              items: { type: GenAIType.STRING },
              description: "3 to 4 very short, catchy poster slogans or titles in varying moods."
            },
            palettes: {
              type: GenAIType.ARRAY,
              items: {
                type: GenAIType.ARRAY,
                items: { type: GenAIType.STRING },
              },
              description: "List of 3 color palettes. Each palette is an array of 4 hexadecimal colors."
            },
            typography: {
              type: GenAIType.ARRAY,
              items: {
                type: GenAIType.OBJECT,
                properties: {
                  font: { type: GenAIType.STRING, description: "A Google Font name like 'Space Grotesk' or 'Oswald'" },
                  style: { type: GenAIType.STRING, description: "A brief reason why it fits" }
                }
              },
              description: "3 Google Font suggestions that match the vibe."
            },
            shadows: {
              type: GenAIType.ARRAY,
              items: {
                 type: GenAIType.OBJECT,
                 properties: {
                   blur: { type: GenAIType.INTEGER },
                   offsetX: { type: GenAIType.INTEGER },
                   offsetY: { type: GenAIType.INTEGER },
                   color: { type: GenAIType.STRING, description: "Hex color or rgba" },
                   name: { type: GenAIType.STRING, description: "Name of the shadow effect like 'Deep Noir'" }
                 }
              },
              description: "3 text drop shadow configurations."
            }
          },
          required: ["slogans", "palettes", "typography", "shadows"]
        }
      }
    });
    
    let text = response.text || "{}";
    // Sometimes Gemini wraps JSON in markdown backticks even with responseMimeType
    text = text.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/i, '').trim();
    return JSON.parse(text);
  } catch (error: any) {
    console.error("Error generating ideas:", error);
    // Pass the actual error message to the client instead of masking it
    throw new Error(error?.message || "Failed to generate ideas");
  }
}
