
import React, { useState, useEffect } from 'react';
import { InstagramAnalysis, AnalysisStatus } from './types';
import { performAnalysis } from './services/geminiService';
import ComparisonChart from './components/ComparisonChart';

const App: React.FC = () => {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [analysis, setAnalysis] = useState<InstagramAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'competitors' | 'diagnosis' | 'proposal'>('info');

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    
    const cleanUsername = username.replace('@', '').trim();
    setStatus('searching');
    
    try {
      // Simulate steps for better UX
      setTimeout(() => setStatus('analyzing'), 2000);
      const result = await performAnalysis(cleanUsername);
      setAnalysis(result);
      setStatus('completed');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'text-red-600 bg-red-50 border-red-200';
      case 'Media': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header & Hero */}
      <header className="text-center mb-12">
        <h1 className="text-4xl font-extrabold text-blue-900 mb-2">InstaBiz Analyst Pro</h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Transforma tu presencia en Instagram en una máquina de ventas. Obtén un análisis profesional profundo y un plan de acción estratégico.
        </p>
      </header>

      {/* Input Section */}
      <section className="bg-white rounded-2xl shadow-xl p-8 mb-12 border border-slate-100 max-w-3xl mx-auto">
        <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="usuario_negocio"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              disabled={status === 'searching' || status === 'analyzing'}
            />
          </div>
          <button
            type="submit"
            disabled={status === 'searching' || status === 'analyzing' || !username}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition shadow-lg shadow-blue-200"
          >
            {status === 'searching' ? 'Buscando...' : status === 'analyzing' ? 'Analizando...' : 'Iniciar Análisis'}
          </button>
        </form>

        {/* Progress indicator */}
        {(status === 'searching' || status === 'analyzing') && (
          <div className="mt-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">
                {status === 'searching' ? 'Recopilando datos de @' + username : 'Procesando métricas e insights...'}
              </span>
              <span className="text-sm font-medium text-blue-700">{status === 'searching' ? '35%' : '75%'}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div 
                className={`bg-blue-600 h-2 transition-all duration-1000 ${status === 'searching' ? 'w-1/3' : 'w-3/4'}`}
              ></div>
            </div>
          </div>
        )}
      </section>

      {/* Analysis Results */}
      {analysis && status === 'completed' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Summary Score Card */}
          <div className="bg-blue-900 text-white rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Puntuación de Salud Digital: {analysis.diagnosis.overallScore}/10</h2>
              <p className="text-blue-100 opacity-90 leading-relaxed italic">
                "{analysis.diagnosis.executiveSummary}"
              </p>
            </div>
            <div className="flex flex-col items-center">
              <div className="relative w-32 h-32 flex items-center justify-center">
                <svg className="w-full h-full transform -rotate-90">
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-blue-800" />
                  <circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * analysis.diagnosis.overallScore / 10)} className="text-emerald-400 transition-all duration-1000" />
                </svg>
                <span className="absolute text-4xl font-bold">{analysis.diagnosis.overallScore}</span>
              </div>
              <span className="mt-2 font-medium tracking-wide uppercase text-sm text-blue-200">Rendimiento General</span>
            </div>
          </div>

          {/* Navigation Tabs */}
          <div className="flex overflow-x-auto pb-4 gap-2 mb-8 no-scrollbar">
            {[
              { id: 'info', label: 'Información Básica', icon: '👤' },
              { id: 'content', label: 'Análisis de Contenido', icon: '📊' },
              { id: 'competitors', label: 'Competencia', icon: '⚔️' },
              { id: 'diagnosis', label: 'Plan de Mejora', icon: '🚀' },
              { id: 'proposal', label: 'Propuesta Growth', icon: '💼' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`whitespace-nowrap px-6 py-3 rounded-full font-semibold transition flex items-center gap-2 border-2 ${
                  activeTab === tab.id 
                    ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                    : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
                }`}
              >
                <span>{tab.icon}</span>
                {tab.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Main Tab Content */}
            <div className="lg:col-span-8 space-y-8">
              
              {activeTab === 'info' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <span className="bg-blue-100 p-2 rounded-lg text-blue-600">📍</span> Perfil del Negocio
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Nombre del Negocio</label>
                        <p className="text-lg font-semibold text-slate-800">{analysis.basicInfo.businessName}</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Categoría</label>
                        <p className="text-lg font-semibold text-slate-800">{analysis.basicInfo.category}</p>
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Biografía Analizada</label>
                        <p className="text-slate-600 mt-1">{analysis.basicInfo.bio}</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Ubicación</label>
                        <p className="text-slate-700 font-medium">{analysis.basicInfo.location}</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Sitio Web</label>
                        <a href={analysis.basicInfo.contact.website} target="_blank" rel="noreferrer" className="block text-blue-600 hover:underline font-medium truncate">
                          {analysis.basicInfo.contact.website}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                      <span className="bg-blue-100 p-2 rounded-lg text-blue-600">🎯</span> Estrategia Actual
                    </h3>
                    <div className="space-y-6">
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Audiencia Objetivo</label>
                        <p className="text-slate-700 mt-1">{analysis.basicInfo.targetAudience}</p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Propuesta de Valor</label>
                        <p className="text-slate-700 mt-1 p-4 bg-slate-50 rounded-xl border border-slate-100 italic">
                          "{analysis.basicInfo.uniqueValueProp}"
                        </p>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Servicios Identificados</label>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {analysis.basicInfo.services.map((s, i) => (
                            <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium border border-blue-100">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'content' && (
                <div className="space-y-6">
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
                      <p className="text-sm font-medium text-slate-400 uppercase mb-2">Engagement</p>
                      <p className={`text-2xl font-bold ${analysis.contentMetrics.engagementLevel === 'Alto' ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {analysis.contentMetrics.engagementLevel}
                      </p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
                      <p className="text-sm font-medium text-slate-400 uppercase mb-2">Frecuencia</p>
                      <p className="text-2xl font-bold text-slate-800">{analysis.contentMetrics.postFrequency}</p>
                    </div>
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
                      <p className="text-sm font-medium text-slate-400 uppercase mb-2">Consistencia</p>
                      <p className="text-2xl font-bold text-blue-600">{analysis.contentMetrics.brandConsistency}/10</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-800 mb-6">Mix de Contenido</h3>
                    <div className="space-y-4">
                      {analysis.contentMetrics.contentTypes.map((ct, i) => (
                        <div key={i}>
                          <div className="flex justify-between mb-1">
                            <span className="text-sm font-medium text-slate-700">{ct.type}</span>
                            <span className="text-sm font-bold text-blue-600">{ct.percentage}%</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-2">
                            <div className="bg-blue-600 h-2 rounded-full" style={{ width: `${ct.percentage}%` }}></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Temas Recurrentes</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-3">
                        {analysis.contentMetrics.themes.map((theme, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <span className="text-blue-500 text-lg">#</span>
                            <span className="text-slate-700 font-medium">{theme}</span>
                          </div>
                        ))}
                      </div>
                      <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-sm font-bold text-slate-400 uppercase mb-2">Estilo & Tono</p>
                        <p className="text-slate-800 font-medium mb-1"><span className="text-blue-600">Visual:</span> {analysis.contentMetrics.visualStyle}</p>
                        <p className="text-slate-800 font-medium"><span className="text-blue-600">Voz:</span> {analysis.contentMetrics.tone}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'competitors' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-800 mb-6">Benchmark vs Competencia</h3>
                    <ComparisonChart competitors={analysis.competitors} businessName={analysis.basicInfo.businessName} />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {analysis.competitors.map((comp, i) => (
                      <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
                        <h4 className="font-bold text-blue-900 mb-4 border-b pb-2">{comp.name}</h4>
                        <div className="space-y-4">
                          <div>
                            <p className="text-xs font-bold text-emerald-600 uppercase mb-1">Fortalezas</p>
                            <ul className="text-xs space-y-1 text-slate-600 list-disc pl-4">
                              {comp.strengths.slice(0, 2).map((s, j) => <li key={j}>{s}</li>)}
                            </ul>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-slate-400 uppercase mb-1">Mejores Prácticas</p>
                            <ul className="text-xs space-y-1 text-slate-600 list-disc pl-4">
                              {comp.practices.slice(0, 2).map((p, j) => <li key={j}>{p}</li>)}
                            </ul>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'diagnosis' && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-800 mb-6">Oportunidades Prioritarias</h3>
                    <div className="space-y-4">
                      {analysis.diagnosis.opportunities.map((opp, i) => (
                        <div key={i} className={`p-5 rounded-2xl border ${getPriorityColor(opp.priority)}`}>
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="font-bold text-lg">{opp.area}</h4>
                            <span className="text-xs font-bold px-2 py-1 rounded-full uppercase tracking-tighter">Prioridad {opp.priority}</span>
                          </div>
                          <p className="text-sm opacity-90">{opp.advice}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-bold text-slate-800 mb-4">Brechas Detectadas</h3>
                    <ul className="space-y-3">
                      {analysis.diagnosis.gapsVsCompetitors.map((gap, i) => (
                        <li key={i} className="flex gap-3 text-slate-700">
                          <span className="text-red-500 font-bold">✕</span>
                          {gap}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {activeTab === 'proposal' && (
                <div className="space-y-8">
                  <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 transform translate-x-16 -translate-y-16 rotate-45 opacity-10"></div>
                    <h3 className="text-2xl font-bold text-blue-900 mb-6">Nuestra Estrategia Growth</h3>
                    <p className="text-slate-600 mb-8 leading-relaxed">
                      {analysis.commercialProposal.introduction}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <span className="text-blue-600">🌐</span> Ecosistema Web
                        </h4>
                        <p className="text-sm text-slate-600">{analysis.commercialProposal.solution.webDesign}</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <span className="text-blue-600">🤖</span> IA & Automatización
                        </h4>
                        <p className="text-sm text-slate-600">{analysis.commercialProposal.solution.chatbot}</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <span className="text-blue-600">📅</span> Agendamiento
                        </h4>
                        <p className="text-sm text-slate-600">{analysis.commercialProposal.solution.bookingSystem}</p>
                      </div>
                      <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                        <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                          <span className="text-blue-600">📱</span> Optimización Social
                        </h4>
                        <p className="text-sm text-slate-600">{analysis.commercialProposal.solution.socialOptimization}</p>
                      </div>
                    </div>

                    <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100 mb-8">
                      <h4 className="text-center font-bold text-blue-900 mb-6 uppercase tracking-widest text-sm">Resultados Proyectados (Próximos 6 Meses)</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {analysis.commercialProposal.projectedBenefits.map((benefit, i) => (
                          <div key={i} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                            <span className="font-medium text-slate-700">{benefit.metric}</span>
                            <span className="text-blue-600 font-bold text-lg">+{benefit.improvement}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition transform hover:scale-[1.01] active:scale-[0.99] shadow-xl shadow-blue-200">
                      Agendar Consulta de Estrategia Gratuita
                    </button>
                  </div>
                </div>
              )}

            </div>

            {/* Sidebar / Quick Contacts */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm sticky top-8">
                <h4 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-widest">Canales de Contacto</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-blue-600">📞</span>
                    <span className="text-sm font-medium text-slate-700">{analysis.basicInfo.contact.phone || 'No detectado'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-blue-600">📧</span>
                    <span className="text-sm font-medium text-slate-700 truncate">{analysis.basicInfo.contact.email || 'No detectado'}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-blue-600">🔗</span>
                    <span className="text-sm font-medium text-slate-700 truncate">{analysis.basicInfo.contact.mainLink || 'Instagram Linktree'}</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-slate-100">
                  <h4 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-widest">Fuentes del Análisis</h4>
                  <div className="space-y-3">
                    {analysis.sources.map((source, i) => (
                      <a key={i} href={source.uri} target="_blank" rel="noreferrer" className="block text-xs text-blue-500 hover:underline truncate">
                        • {source.title}
                      </a>
                    ))}
                  </div>
                </div>

                <div className="mt-8">
                  <button onClick={() => window.print()} className="w-full py-2 border-2 border-blue-600 text-blue-600 font-bold rounded-xl hover:bg-blue-50 transition text-sm">
                    Descargar Informe PDF
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-24 pb-12 border-t border-slate-200 pt-12 text-center">
        <div className="max-w-xl mx-auto space-y-4">
          <h3 className="text-xl font-bold text-slate-800">¿Listo para escalar tu negocio?</h3>
          <p className="text-slate-500 text-sm">
            Este reporte fue generado por InstaBiz Analyst Pro. Nuestra misión es ayudar a negocios locales a dominar el ecosistema digital mediante tecnología de vanguardia e inteligencia artificial.
          </p>
          <div className="pt-4 flex justify-center gap-4">
             <button className="text-blue-600 font-bold hover:underline">Saber más sobre nosotros</button>
             <span className="text-slate-300">|</span>
             <button className="text-blue-600 font-bold hover:underline">Política de Privacidad</button>
          </div>
          <p className="text-slate-400 text-xs mt-8">© 2024 InstaBiz Solutions. Todos los derechos reservados.</p>
        </div>
      </footer>

      {/* Error state */}
      {status === 'error' && (
        <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-center">
          <p className="text-red-700 font-bold">Error en el análisis</p>
          <p className="text-red-600 text-sm mt-1">No pudimos encontrar suficiente información pública para @{username}. Asegúrate de que el perfil sea de un negocio y tenga presencia en la web.</p>
          <button onClick={() => setStatus('idle')} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-bold">Reintentar</button>
        </div>
      )}
    </div>
  );
};

export default App;
