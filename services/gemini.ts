import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import { MODELS, PROMPTS } from "../constants";
import { TranslationSpeed, ImageSize } from "../types";

// Helper to get API client
const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    console.error("API Key not found in environment");
    throw new Error("API Key missing");
  }
  return new GoogleGenAI({ apiKey });
};

// --- Text/Document Translation ---
export const translateContent = async (
  text: string,
  attachment: { mimeType: string; data: string } | null,
  speed: TranslationSpeed
): Promise<{ translation: string; groundingUrls?: string[] }> => {
  const ai = getAiClient();
  
  const isDeep = speed === TranslationSpeed.DEEP;
  const model = isDeep ? MODELS.TRANSLATION_DEEP : MODELS.TRANSLATION_FAST;

  const config: any = {
    systemInstruction: PROMPTS.SYSTEM_TRANSLATOR,
  };

  if (isDeep) {
    // Thinking mode for deep philosophical reasoning
    config.thinkingConfig = { thinkingBudget: 32768 };
  }

  try {
    let contents;
    if (attachment) {
        contents = {
            parts: [
                {
                    inlineData: {
                        mimeType: attachment.mimeType,
                        data: attachment.data
                    }
                },
                {
                    text: `Translate the attached document from English to Turkish (or vice versa based on detection). Preserve philosophical nuance.\n\nContext/Instructions from user: ${text}`
                }
            ]
        };
    } else {
        contents = {
            parts: [{
                text: `Translate the following text from English to Turkish (or vice versa based on detection). Preserve philosophical nuance.\n\n${text}`
            }]
        };
    }

    const response = await ai.models.generateContent({
      model,
      contents,
      config,
    });

    return {
      translation: response.text || "Translation failed.",
      groundingUrls: [],
    };
  } catch (error) {
    console.error("Translation Error:", error);
    throw error;
  }
};

// Backwards compatibility wrapper if needed, or just export this.
export const translateText = (text: string, speed: TranslationSpeed) => translateContent(text, null, speed);

// --- Term Definition (Grounding) ---
export const defineTerm = async (term: string) => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // Use Flash with Search for up-to-date info/accurate definitions
      contents: `Define the philosophical term "${term}" in the context of literary theory.`,
      config: {
        tools: [{ googleSearch: {} }],
      },
    });
    
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const urls = groundingChunks
      .map((c: any) => c.web?.uri)
      .filter((u: any) => !!u) as string[];

    return {
      definition: response.text,
      urls: urls,
    };
  } catch (e) {
    console.error(e);
    return { definition: "Could not fetch definition.", urls: [] };
  }
};

// --- Image Analysis ---
export const analyzeImage = async (
  file: File,
  prompt?: string
): Promise<{ text: string; groundingUrls?: string[] }> => {
  const ai = getAiClient();
  
  // Convert file to base64
  const base64Data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const mimeType = file.type;

  try {
    const response = await ai.models.generateContent({
      model: MODELS.ANALYSIS, // Gemini 3 Pro Preview
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          },
          {
            text: prompt || "Analyze this image. If it contains text, translate it preserving philosophical meaning. If it is an image without text, interpret its philosophical symbolism."
          }
        ]
      },
      config: {
        systemInstruction: PROMPTS.SYSTEM_ANALYSIS,
      }
    });

    return {
      text: response.text || "Analysis failed.",
    };
  } catch (error) {
    console.error("Image Analysis Error:", error);
    throw error;
  }
};

// --- Image Generation ---
export const generatePhilosophicalImage = async (
  prompt: string,
  size: ImageSize
): Promise<string> => {
  // Ensure we use the most up-to-date key if available via AI Studio flow
  // Note: We create a new client here to capture potential key changes if the UI forced a re-select
  const ai = getAiClient(); 

  // Map size to API values if needed (1K, 2K, 4K are standard strings in config)
  try {
    // Note: The prompt says "generate images using model gemini-3-pro-image-preview"
    // It supports 'imageSize'.
    
    // Since this is 'generateContent' for gemini-3-pro-image-preview (Nano Banana Pro logic)
    const response = await ai.models.generateContent({
        model: MODELS.IMAGE_GEN,
        contents: {
            parts: [{ text: prompt }]
        },
        config: {
            imageConfig: {
                imageSize: size,
                aspectRatio: "1:1" 
            }
        }
    });

    // Extract image
    for (const part of response.candidates?.[0]?.content?.parts || []) {
        if (part.inlineData) {
            return `data:${part.inlineData.mimeType || 'image/png'};base64,${part.inlineData.data}`;
        }
    }
    throw new Error("No image generated.");

  } catch (error) {
    console.error("Image Gen Error:", error);
    throw error;
  }
};

// --- Key Selection for Veo/High-End Models ---
export const ensureApiKeySelected = async (): Promise<boolean> => {
    // Use any cast to avoid type conflict with existing global AIStudio definition
    const win = window as any;
    if (win.aistudio) {
        const hasKey = await win.aistudio.hasSelectedApiKey();
        if (!hasKey) {
            await win.aistudio.openSelectKey();
            return await win.aistudio.hasSelectedApiKey();
        }
        return true;
    }
    // Fallback if not running in that specific environment, we assume process.env.API_KEY works
    return true;
};