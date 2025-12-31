
import { GoogleGenAI, Type } from "@google/genai";
import { InstagramAnalysis } from "../types";

const API_KEY = process.env.API_KEY || "";

export const performAnalysis = async (username: string): Promise<InstagramAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const prompt = `Analiza profundamente el perfil de Instagram @${username}. 
  Usa Google Search para encontrar información sobre este negocio, su presencia en Instagram, su industria y competidores locales o globales relevantes.
  Proporciona un informe detallado y profesional que ayude a convencer al dueño del negocio de mejorar su presencia digital.
  
  El análisis debe ser realista basado en la información encontrada en la web.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      tools: [{ googleSearch: {} }],
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          basicInfo: {
            type: Type.OBJECT,
            properties: {
              handle: { type: Type.STRING },
              businessName: { type: Type.STRING },
              category: { type: Type.STRING },
              bio: { type: Type.STRING },
              services: { type: Type.ARRAY, items: { type: Type.STRING } },
              location: { type: Type.STRING },
              targetAudience: { type: Type.STRING },
              uniqueValueProp: { type: Type.STRING },
              contact: {
                type: Type.OBJECT,
                properties: {
                  phone: { type: Type.STRING },
                  email: { type: Type.STRING },
                  website: { type: Type.STRING },
                  mainLink: { type: Type.STRING }
                },
                required: ["website"]
              }
            },
            required: ["handle", "businessName", "category", "bio", "services", "location", "targetAudience", "uniqueValueProp", "contact"]
          },
          contentMetrics: {
            type: Type.OBJECT,
            properties: {
              postFrequency: { type: Type.STRING },
              contentTypes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    type: { type: Type.STRING },
                    percentage: { type: Type.NUMBER }
                  },
                  required: ["type", "percentage"]
                }
              },
              themes: { type: Type.ARRAY, items: { type: Type.STRING } },
              tone: { type: Type.STRING },
              visualStyle: { type: Type.STRING },
              engagementLevel: { type: Type.STRING },
              brandConsistency: { type: Type.NUMBER },
              qualityScore: {
                type: Type.OBJECT,
                properties: {
                  visual: { type: Type.NUMBER },
                  copywriting: { type: Type.NUMBER }
                },
                required: ["visual", "copywriting"]
              }
            },
            required: ["postFrequency", "contentTypes", "themes", "tone", "visualStyle", "engagementLevel", "brandConsistency", "qualityScore"]
          },
          competitors: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
                weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
                practices: { type: Type.ARRAY, items: { type: Type.STRING } },
                metrics: {
                  type: Type.OBJECT,
                  properties: {
                    presence: { type: Type.NUMBER },
                    consistency: { type: Type.NUMBER },
                    professionalism: { type: Type.NUMBER },
                    engagement: { type: Type.NUMBER }
                  },
                  required: ["presence", "consistency", "professionalism", "engagement"]
                }
              },
              required: ["name", "strengths", "weaknesses", "practices", "metrics"]
            }
          },
          diagnosis: {
            type: Type.OBJECT,
            properties: {
              overallScore: { type: Type.NUMBER },
              executiveSummary: { type: Type.STRING },
              opportunities: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    area: { type: Type.STRING },
                    priority: { type: Type.STRING },
                    advice: { type: Type.STRING }
                  },
                  required: ["area", "priority", "advice"]
                }
              },
              gapsVsCompetitors: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["overallScore", "executiveSummary", "opportunities", "gapsVsCompetitors"]
          },
          commercialProposal: {
            type: Type.OBJECT,
            properties: {
              introduction: { type: Type.STRING },
              painPoints: { type: Type.ARRAY, items: { type: Type.STRING } },
              solution: {
                type: Type.OBJECT,
                properties: {
                  webDesign: { type: Type.STRING },
                  chatbot: { type: Type.STRING },
                  bookingSystem: { type: Type.STRING },
                  socialOptimization: { type: Type.STRING }
                },
                required: ["webDesign", "chatbot", "bookingSystem", "socialOptimization"]
              },
              projectedBenefits: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    metric: { type: Type.STRING },
                    improvement: { type: Type.STRING }
                  },
                  required: ["metric", "improvement"]
                }
              }
            },
            required: ["introduction", "painPoints", "solution", "projectedBenefits"]
          }
        },
        required: ["basicInfo", "contentMetrics", "competitors", "diagnosis", "commercialProposal"]
      }
    }
  });

  const analysis = JSON.parse(response.text) as InstagramAnalysis;
  
  // Extract sources
  const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  const sources = groundingChunks
    .filter((chunk: any) => chunk.web)
    .map((chunk: any) => ({
      title: chunk.web.title || "Fuente externa",
      uri: chunk.web.uri
    }));

  return { ...analysis, sources };
};
