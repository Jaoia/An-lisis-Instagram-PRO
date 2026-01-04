
import { GoogleGenAI, Type } from "@google/genai";
import { InstagramAnalysis } from "../types";

const API_KEY = process.env.API_KEY || "";

export const performAnalysis = async (username: string): Promise<InstagramAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // Limpiar el input: extraer el nombre de usuario de una URL o un handle con @
  let cleanHandle = username.trim().toLowerCase();
  if (cleanHandle.includes("instagram.com/")) {
    cleanHandle = cleanHandle.split("instagram.com/")[1].split("/")[0].split("?")[0];
  }
  cleanHandle = cleanHandle.replace('@', '');

  const prompt = `TAREA DE INVESTIGACIÓN PROFESIONAL DE PERFIL:
  Analiza minuciosamente el perfil de Instagram: https://www.instagram.com/${cleanHandle}/
  
  PASOS DE VALIDACIÓN OBLIGATORIOS:
  1. Usa Google Search para encontrar la página de Instagram EXACTA de "${cleanHandle}".
  2. Si no hay datos suficientes en Instagram, busca en sitios de reseñas (Google Maps, Yelp), directorios de empresas o su sitio web oficial vinculado para confirmar la identidad del negocio.
  3. EXTRAE DE LOS SNIPPETS DE BÚSQUEDA:
     - Nombre real del negocio y categoría.
     - Biografía y enlaces en el perfil.
     - Ubicación física (si aplica).
     - Análisis visual basado en las descripciones de las miniaturas de sus posts.
     - Frecuencia de publicación (busca fechas en los resultados).
  
  DIAGNÓSTICO ESTRATÉGICO:
  - Compara con 3 competidores REALES en su misma ciudad o nicho.
  - Identifica "Gaps": ¿Tienen botón de WhatsApp?, ¿Usan Reels?, ¿Su estética es coherente?
  - Genera una propuesta comercial agresiva para venderles servicios de automatización e IA.

  IMPORTANTE: No inventes datos. Si el perfil es totalmente privado o inexistente, el campo 'businessName' debe decir "PERFIL NO ENCONTRADO O PRIVADO".`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
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

  try {
    const text = response.text;
    const analysis = JSON.parse(text) as InstagramAnalysis;
    
    // Extraemos las fuentes de Google Search para dar validez al reporte
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Instagram / Web Source",
        uri: chunk.web.uri
      }));

    // Si el modelo indica que no encontró nada en el nombre del negocio
    if (analysis.basicInfo.businessName.includes("NO ENCONTRADO")) {
      throw new Error("Perfil no encontrado o es privado");
    }

    return { ...analysis, sources: sources.length > 0 ? sources : [{ title: `Instagram @${cleanHandle}`, uri: `https://instagram.com/${cleanHandle}` }] };
  } catch (e) {
    console.error("Error parsing analysis:", e);
    throw new Error("No pudimos analizar este perfil. Asegúrate de que el nombre de usuario sea correcto y el perfil sea público.");
  }
};
