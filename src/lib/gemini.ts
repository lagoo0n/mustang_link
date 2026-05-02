/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function askAI(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction: "You are the MustangLink AI Assistant. You help students with ride sharing, finding lost items, social connections, and campus opportunities. Be concise, friendly, and helpful.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Sorry, I'm having trouble connecting right now.";
  }
}
