import { GoogleGenAI, GenerateContentResponse, Part, ToolSource as GenAIToolSource } from "@google/genai";
import { ToolSource } from "../types";

// Helper function to decode base64 for debugging or further processing if needed
// function decode(base64: string) {
//   const binaryString = atob(base64);
//   const len = binaryString.length;
//   const bytes = new Uint8Array(len);
//   for (let i = 0; i < len; i++) {
//     bytes[i] = binaryString.charCodeAt(i);
//   }
//   return bytes;
// }

// Function to safely extract text from a GenerateContentResponse
const getResponseText = (response: GenerateContentResponse): string => {
  return response.text ?? 'No text response received.';
};

// Function to extract grounding sources
const extractGroundingSources = (response: GenerateContentResponse): ToolSource[] => {
  const sources: ToolSource[] = [];
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks;
  if (groundingChunks) {
    for (const chunk of groundingChunks) {
      if (chunk.web) {
        sources.push({ uri: chunk.web.uri, title: chunk.web.title });
      } else if (chunk.maps) {
        sources.push({ uri: chunk.maps.uri, title: chunk.maps.title });
        if (chunk.maps.placeAnswerSources) {
          for (const placeSource of chunk.maps.placeAnswerSources) {
            if (placeSource.reviewSnippets) {
              for (const snippet of placeSource.reviewSnippets) {
                sources.push({ uri: snippet.uri, title: snippet.text });
              }
            }
          }
        }
      }
    }
  }
  return sources;
};


// Main service object
export const geminiService = {
  // Common function to initialize GoogleGenAI client (called before each API call to ensure fresh API key if updated)
  getGenAIClient: () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
  },

  // Handles text-only and multi-modal content with Gemini 3 Pro
  async generateContentStandard(prompt: string, fileData?: { data: string; mimeType: string }): Promise<{ text: string; sources?: ToolSource[] }> {
    const ai = this.getGenAIClient();
    const model = 'gemini-3-pro-preview';

    const parts: Part[] = [{ text: prompt }];

    if (fileData) {
      parts.push({
        inlineData: {
          mimeType: fileData.mimeType,
          data: fileData.data,
        },
      });
    }

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: { parts: parts },
      });
      return { text: getResponseText(response), sources: extractGroundingSources(response) };
    } catch (error) {
      console.error(`Error in generateContentStandard with model ${model}:`, error);
      throw new Error(`Failed to get response from ${model}. Check console for details.`);
    }
  },

  // Handles text-only content with Search Grounding using Gemini 3 Flash
  async generateContentSearchGrounded(prompt: string): Promise<{ text: string; sources?: ToolSource[] }> {
    const ai = this.getGenAIClient();
    const model = 'gemini-3-flash-preview';

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
        },
      });

      const sources = extractGroundingSources(response);
      return { text: getResponseText(response), sources: sources };
    } catch (error) {
      console.error(`Error in generateContentSearchGrounded with model ${model}:`, error);
      throw new Error(`Failed to get search-grounded response from ${model}. Check console for details.`);
    }
  },

  // Handles text-only content with Fast Response using Gemini Flash Lite
  async generateContentFast(prompt: string): Promise<{ text: string; sources?: ToolSource[] }> {
    const ai = this.getGenAIClient();
    const model = 'gemini-flash-lite-latest'; // As per user request for 'gemini-2.5-flash-lite'

    try {
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: model,
        contents: prompt,
        config: {
          // You might set a lower thinkingBudget for even faster responses if applicable for the model.
          thinkingConfig: { thinkingBudget: 0 } // Disable thinking for fastest possible response
        }
      });
      return { text: getResponseText(response), sources: extractGroundingSources(response) };
    } catch (error) {
      console.error(`Error in generateContentFast with model ${model}:`, error);
      throw new Error(`Failed to get fast response from ${model}. Check console for details.`);
    }
  },
};