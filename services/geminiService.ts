
import { GoogleGenAI, Type } from "@google/genai";
import { InstagramAnalysis } from "../types";

const API_KEY = process.env.API_KEY || "";

export const performAnalysis = async (username: string): Promise<InstagramAnalysis> => {
  const ai = new GoogleGenAI({ apiKey: API_KEY });

  // Limpiamos el nombre de usuario eliminando el @ si existe
  const cleanHandle = username.replace('@', '').trim().toLowerCase();

  const prompt = `INSTRUCCIÓN DE BÚSQUEDA PROFESIONAL Y ESTRICTA:
  Actúa como un Analista de Datos de Redes Sociales de alto nivel. Tu objetivo es analizar el perfil de Instagram EXACTO: https://www.instagram.com/${cleanHandle}/
  
  PASOS OBLIGATORIOS PARA EVITAR ERRORES DE IDENTIDAD:
  1. Utiliza Google Search para localizar la URL específica 'instagram.com/${cleanHandle}'. 
  2. VERIFICACIÓN DE IDENTIDAD: Antes de extraer datos, confirma que el 'handle' en los resultados de búsqueda sea exactamente "${cleanHandle}". No aceptes perfiles similares, fans pages, o cuentas con guiones/puntos adicionales.
  3. Si encuentras un perfil con un nombre parecido pero el handle NO es "${cleanHandle}", ignóralo completamente.
  4. Si el perfil no devuelve información pública indexada o es privado, responde con un JSON indicando "No se encontró información" en los campos de datos, pero NO inventes información de otros negocios.
  
  ESTRUCTURA DE ANÁLISIS (Inspirado en Inflact/Herramientas Profesionales):
  - ANALIZA: Nombre oficial, Bio, Categoría, Servicios específicos mencionados en sus posts o bio.
  - MÉTRICAS: Estima el engagement basado en la interacción visible en fragmentos de búsqueda.
  - CONTENIDO: Identifica si usa más Reels, Carruseles o fotos fijas. Tono de marca.
  - COMPETENCIA: Encuentra 3 competidores reales que operen en el mismo sector y escala que @${cleanHandle}.
  - ESTRATEGIA: Genera un plan de mejora basado en las debilidades reales detectadas.

  REGLA DE ORO: Si no estás 100% seguro de que los datos pertenecen a @${cleanHandle}, marca el campo como "No se encontró información".`;

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
    const analysis = JSON.parse(response.text) as InstagramAnalysis;
    
    // Extraemos las fuentes para verificar la procedencia de los datos
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const sources = groundingChunks
      .filter((chunk: any) => chunk.web)
      .map((chunk: any) => ({
        title: chunk.web.title || "Fuente externa",
        uri: chunk.web.uri
      }));

    // Validación extra del handle devuelto por la IA
    if (analysis.basicInfo.handle.toLowerCase().replace('@', '') !== cleanHandle) {
        console.warn("Posible discrepancia de perfil detectada. Verificando integridad...");
    }

    return { ...analysis, sources };
  } catch (e) {
    console.error("Error al procesar la respuesta de la IA:", e);
    throw new Error("No se pudo procesar el análisis. Inténtalo de nuevo.");
  }
};
