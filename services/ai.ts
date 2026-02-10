import { GoogleGenAI, Type } from "@google/genai";
import { Question } from "../types";

export const AIService = {
  /**
   * Helper to get AI instance safely
   */
  getAI() {
    const apiKey = process.env.API_KEY;
    if (!apiKey) {
      console.error("Gemini API Key is missing from process.env.API_KEY");
      return null;
    }
    return new GoogleGenAI({ apiKey });
  },

  /**
   * Generates a set of aptitude questions based on criteria using Gemini 3 Flash
   */
  async generateQuestions(category: string, difficulty: string, count: number = 1): Promise<Question[]> {
    const ai = this.getAI();
    if (!ai) return [];

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate ${count} professional aptitude question for a platform called AptiMaster. 
        Category: ${category}
        Difficulty: ${difficulty}
        Return ONLY a JSON array of questions matching the schema.`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING },
                text: { type: Type.STRING },
                category: { type: Type.STRING },
                options: { 
                  type: Type.ARRAY, 
                  items: { type: Type.STRING }
                },
                correctAnswer: { type: Type.INTEGER },
                explanation: { type: Type.STRING },
                difficulty: { type: Type.STRING },
                timeLimitMinutes: { type: Type.NUMBER }
              },
              required: ["id", "text", "category", "options", "correctAnswer", "explanation", "difficulty", "timeLimitMinutes"]
            }
          }
        }
      });

      const text = response.text;
      if (!text) return [];
      return JSON.parse(text);
    } catch (e) {
      console.error("AI Generation Error:", e);
      return [];
    }
  },

  /**
   * Provides a Socratic hint for a student
   */
  async getSocraticHint(question: string, options: string[]): Promise<string> {
    const ai = this.getAI();
    if (!ai) return "Hint service unavailable (Check API Key).";

    try {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Question: "${question}". Options: ${options.join(", ")}. Provide a short socratic hint.`,
        config: { thinkingConfig: { thinkingBudget: 0 } }
      });
      return response.text || "Think about the relationship between the numbers.";
    } catch (e) {
      return "Focus on the core logic of the problem.";
    }
  }
};