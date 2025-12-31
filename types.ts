
export interface InstagramAnalysis {
  basicInfo: {
    handle: string;
    businessName: string;
    category: string;
    bio: string;
    services: string[];
    location: string;
    targetAudience: string;
    uniqueValueProp: string;
    contact: {
      phone?: string;
      email?: string;
      website?: string;
      mainLink?: string;
    };
  };
  contentMetrics: {
    postFrequency: string;
    contentTypes: { type: string; percentage: number }[];
    themes: string[];
    tone: string;
    visualStyle: string;
    engagementLevel: string; // "Bajo", "Medio", "Alto"
    brandConsistency: number; // 1-10
    qualityScore: {
      visual: number;
      copywriting: number;
    };
  };
  competitors: {
    name: string;
    strengths: string[];
    weaknesses: string[];
    practices: string[];
    metrics: {
      presence: number;
      consistency: number;
      professionalism: number;
      engagement: number;
    };
  }[];
  diagnosis: {
    overallScore: number;
    executiveSummary: string;
    opportunities: { area: string; priority: 'Alta' | 'Media' | 'Baja'; advice: string }[];
    gapsVsCompetitors: string[];
  };
  commercialProposal: {
    introduction: string;
    painPoints: string[];
    solution: {
      webDesign: string;
      chatbot: string;
      bookingSystem: string;
      socialOptimization: string;
    };
    projectedBenefits: { metric: string; improvement: string }[];
  };
  sources: { title: string; uri: string }[];
}

export type AnalysisStatus = 'idle' | 'searching' | 'analyzing' | 'completed' | 'error';
