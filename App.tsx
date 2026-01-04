
import React, { useState, useRef } from 'react';
import { InstagramAnalysis, AnalysisStatus } from './types';
import { performAnalysis } from './services/geminiService';
import ComparisonChart from './components/ComparisonChart';
// @ts-ignore
import html2pdf from 'html2pdf.js';

const App: React.FC = () => {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [isExporting, setIsExporting] = useState(false);
  const [analysis, setAnalysis] = useState<InstagramAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'competitors' | 'diagnosis' | 'proposal'>('info');
  
  const fullReportRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    
    const cleanUsername = username.replace('@', '').trim();
    setStatus('searching');
    
    try {
      setTimeout(() => setStatus('analyzing'), 2000);
      const result = await performAnalysis(cleanUsername);
      setAnalysis(result);
      setStatus('completed');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const handleDownloadPDF = async () => {
    if (!fullReportRef.current || !analysis) return;
    
    setIsExporting(true);
    
    // Solución al error "x is not a function": Asegurar que llamamos a la función correcta de la librería
    const exporter = (html2pdf as any).default || html2pdf;
    
    if (typeof exporter !== 'function') {
      console.error("La librería html2pdf no se cargó como una función.");
      setIsExporting(false);
      return;
    }

    const element = fullReportRef.current;
    
    const opt = {
      margin: [10, 10, 10, 10],
      filename: `Reporte_ANI_${analysis.basicInfo.businessName || analysis.basicInfo.handle}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2, 
        useCORS: true,
        logging: false,
        letterRendering: true,
        windowWidth: 1200 // Asegura un ancho consistente para el renderizado del PDF
      },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      // Forzamos un breve delay para asegurar que el DOM oculto esté listo
      await new Promise(resolve => setTimeout(resolve, 500));
      await exporter().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
    } finally {
      setIsExporting(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'Alta': return 'text-red-600 bg-red-50 border-red-200';
      case 'Media': return 'text-amber-600 bg-amber-50 border-amber-200';
      default: return 'text-emerald-600 bg-emerald-50 border-emerald-200';
    }
  };

  const renderValue = (value: any, fallback: string = "No se encontró información") => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return <span className="text-slate-400 italic">{fallback}</span>;
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value;
  };

  // Componente interno para evitar duplicar código en UI y PDF
  const ReportSections = ({ isPdf = false }: { isPdf?: boolean }) => {
    if (!analysis) return null;

    return (
      <div className={`space-y-12 ${isPdf ? 'p-4 bg-white' : ''}`}>
        {/* SECCIÓN 1: INFORMACIÓN BÁSICA (Siempre visible en PDF o si es su tab) */}
        {(isPdf || activeTab === 'info') && (
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm overflow-hidden relative break-inside-avoid">
            <div className="absolute top-0 right-0 p-4 opacity-5">
              <span className="text-6xl font-black">01</span>
            </div>
            <h3 className="text-2xl font-bold text-blue-900 mb-8 flex items-center gap-3">
              <span className="bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-xl shadow-lg">📄</span>
              Entregable: Diagnóstico de Perfil
            </h3>
            <div className="space-y-8">
              {[
                { n: 1, label: "Nombre del Negocio / Perfil", val: renderValue(analysis.basicInfo.businessName || analysis.basicInfo.handle) },
                { n: 2, label: "Tipo / Categoría de Negocio", val: renderValue(analysis.basicInfo.category) },
                { n: 3, label: "Descripción del Negocio (Biografía)", val: renderValue(analysis.basicInfo.bio), italic: true },
              ].map(item => (
                <div key={item.n} className="flex gap-6 border-b border-slate-50 pb-4">
                  <div className="text-blue-600 font-bold text-xl min-w-[30px]">{item.n}</div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</label>
                    <p className={`text-slate-800 ${item.n === 1 ? 'text-lg font-bold' : 'font-medium'} ${item.italic ? 'italic' : ''}`}>{item.val}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-6 border-b border-slate-50 pb-4">
                <div className="text-blue-600 font-bold text-xl min-w-[30px]">4</div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Servicios Principales (Contenido)</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {analysis.basicInfo.services.length > 0 ? (
                      analysis.basicInfo.services.map((s, i) => (
                        <span key={i} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm font-semibold border border-blue-100">{s}</span>
                      ))
                    ) : <p className="text-slate-400 italic">No se encontró información</p>}
                  </div>
                </div>
              </div>
              {[
                { n: 5, label: "Ubicación del Negocio", val: renderValue(analysis.basicInfo.location) },
                { n: 6, label: "Audiencia Objetivo (Perfil Demográfico)", val: renderValue(analysis.basicInfo.targetAudience) },
              ].map(item => (
                <div key={item.n} className="flex gap-6 border-b border-slate-50 pb-4">
                  <div className="text-blue-600 font-bold text-xl min-w-[30px]">{item.n}</div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{item.label}</label>
                    <p className="text-slate-700">{item.val}</p>
                  </div>
                </div>
              ))}
              <div className="flex gap-6 border-b border-slate-50 pb-4">
                <div className="text-blue-600 font-bold text-xl min-w-[30px]">7</div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Propuesta de Valor Única / Diferenciadores</label>
                  <p className="text-slate-700 font-medium p-4 bg-slate-50 rounded-xl border-l-4 border-blue-500">{renderValue(analysis.basicInfo.uniqueValueProp)}</p>
                </div>
              </div>
              <div className="flex gap-6 border-b border-slate-50 pb-4">
                <div className="text-blue-600 font-bold text-xl min-w-[30px]">8</div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Datos de Contacto</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-2">
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <span className="text-blue-500">📞</span>
                      <span className="text-sm font-medium">{renderValue(analysis.basicInfo.contact.phone)}</span>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                      <span className="text-blue-500">📧</span>
                      <span className="text-sm font-medium truncate">{renderValue(analysis.basicInfo.contact.email)}</span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex gap-6">
                <div className="text-blue-600 font-bold text-xl min-w-[30px]">9</div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Sitio Web Oficial</label>
                  <p className="text-blue-600 font-bold text-lg">{renderValue(analysis.basicInfo.contact.website)}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 2: ANÁLISIS DE CONTENIDO */}
        {(isPdf || activeTab === 'content') && (
          <div className="space-y-6 break-inside-avoid">
             <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 text-center">
                <p className="text-sm font-medium text-slate-400 uppercase mb-2">Engagement</p>
                <p className={`text-2xl font-bold ${analysis.contentMetrics.engagementLevel === 'Alto' ? 'text-emerald-600' : 'text-amber-600'}`}>{analysis.contentMetrics.engagementLevel}</p>
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
          </div>
        )}

        {/* SECCIÓN 3: COMPETENCIA */}
        {(isPdf || activeTab === 'competitors') && (
          <div className="space-y-6 break-inside-avoid">
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Benchmark vs Competencia (Analizado por ANI)</h3>
              {/* Nota: Los gráficos de Recharts a veces requieren dimensiones fijas en PDF */}
              <div style={isPdf ? { width: '700px', height: '400px', margin: '0 auto' } : {}}>
                <ComparisonChart competitors={analysis.competitors} businessName={analysis.basicInfo.businessName} />
              </div>
            </div>
          </div>
        )}

        {/* SECCIÓN 4: DIAGNÓSTICO */}
        {(isPdf || activeTab === 'diagnosis') && (
          <div className="space-y-6 break-inside-avoid">
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Oportunidades Prioritarias Identificadas</h3>
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
          </div>
        )}

        {/* SECCIÓN 5: PROPUESTA GROWTH */}
        {(isPdf || activeTab === 'proposal') && (
          <div className="space-y-8 break-inside-avoid">
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 transform translate-x-16 -translate-y-16 rotate-45 opacity-10"></div>
              <h3 className="text-2xl font-bold text-blue-900 mb-6">Propuesta Growth de ANI</h3>
              <p className="text-slate-600 mb-8 leading-relaxed italic border-l-4 border-blue-600 pl-4">
                {analysis.commercialProposal.introduction}
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
                {[
                  { icon: '🌐', title: 'Ecosistema Web', desc: analysis.commercialProposal.solution.webDesign },
                  { icon: '🤖', title: 'IA & Automatización', desc: analysis.commercialProposal.solution.chatbot },
                  { icon: '📅', title: 'Agendamiento', desc: analysis.commercialProposal.solution.bookingSystem },
                  { icon: '📱', title: 'Optimización Social', desc: analysis.commercialProposal.solution.socialOptimization },
                ].map((item, idx) => (
                  <div key={idx} className="p-6 bg-slate-50 rounded-2xl border border-slate-200">
                    <h4 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                      <span className="text-blue-600">{item.icon}</span> {item.title}
                    </h4>
                    <p className="text-sm text-slate-600">{item.desc}</p>
                  </div>
                ))}
              </div>
              <div className="bg-blue-50 p-8 rounded-3xl border border-blue-100">
                <h4 className="text-center font-bold text-blue-900 mb-6 uppercase tracking-widest text-sm">Resultados Proyectados con ANI</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {analysis.commercialProposal.projectedBenefits.map((benefit, i) => (
                    <div key={i} className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm">
                      <span className="font-medium text-slate-700">{benefit.metric}</span>
                      <span className="text-blue-600 font-bold text-lg">+{benefit.improvement}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      {/* Header & Hero */}
      <header className="text-center mb-12 no-print">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 text-white text-4xl font-black rounded-3xl shadow-xl mb-6 shadow-blue-200 rotate-3">ANI</div>
        <h1 className="text-4xl font-extrabold text-blue-900 mb-2">Asistente de Negocios Inteligentes</h1>
        <p className="text-xl font-medium text-blue-600 mb-4 italic">Expande tu alcance, Aumenta tus ventas con ANI</p>
      </header>

      {/* Input Section */}
      <section className="bg-white rounded-2xl shadow-xl p-8 mb-12 border border-slate-100 max-w-3xl mx-auto no-print">
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
            {status === 'searching' ? 'Buscando...' : status === 'analyzing' ? 'Analizando...' : 'Iniciar Análisis con ANI'}
          </button>
        </form>

        {(status === 'searching' || status === 'analyzing') && (
          <div className="mt-8">
            <div className="flex justify-between mb-2">
              <span className="text-sm font-medium text-blue-700">
                {status === 'searching' ? 'ANI está recopilando datos de @' + username : 'ANI procesando métricas e insights...'}
              </span>
              <span className="text-sm font-medium text-blue-700">{status === 'searching' ? '35%' : '75%'}</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
              <div className={`bg-blue-600 h-2 transition-all duration-1000 ${status === 'searching' ? 'w-1/3' : 'w-3/4'}`}></div>
            </div>
          </div>
        )}
      </section>

      {analysis && status === 'completed' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          
          {/* Dashboard Summary Score (Solo UI) */}
          <div className="bg-blue-900 text-white rounded-2xl p-8 mb-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl no-print">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">Puntuación de Salud Digital por ANI: {analysis.diagnosis.overallScore}/10</h2>
              <p className="text-blue-100 opacity-90 leading-relaxed italic">"{analysis.diagnosis.executiveSummary}"</p>
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

          {/* Navigation Tabs (Solo UI) */}
          <div className="flex overflow-x-auto pb-4 gap-2 mb-8 no-scrollbar no-print">
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
                  activeTab === tab.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-600 hover:border-blue-200'
                }`}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            ))}
          </div>

          {/* Main Content Area */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 no-print">
               <ReportSections />
            </div>

            {/* Sidebar (Solo UI) */}
            <div className="lg:col-span-4 space-y-6 no-print">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm sticky top-8">
                <h4 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-widest">Canales de Contacto</h4>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-blue-600">📞</span>
                    <span className="text-sm font-medium text-slate-700">{renderValue(analysis.basicInfo.contact.phone)}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-blue-600">📧</span>
                    <span className="text-sm font-medium text-slate-700 truncate">{renderValue(analysis.basicInfo.contact.email)}</span>
                  </div>
                </div>
                <div className="mt-8">
                  <button 
                    onClick={handleDownloadPDF} 
                    disabled={isExporting}
                    className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition shadow-lg shadow-blue-100 flex items-center justify-center gap-2"
                  >
                    {isExporting ? (
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : "Descargar Informe PDF Completo"}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Oculto: Contenedor para generación de PDF con TODO el contenido */}
          <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
            <div ref={fullReportRef} style={{ width: '800px', backgroundColor: '#fff', padding: '20px' }}>
               <div className="mb-12 flex items-center justify-between border-b pb-6">
                 <div className="flex items-center gap-6">
                    <div style={{ backgroundColor: '#2563eb', color: '#fff', width: '60px', height: '60px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>ANI</div>
                    <div>
                      <h1 style={{ color: '#1e3a8a', fontSize: '24px', fontWeight: 'bold', margin: 0 }}>Reporte Estratégico Digital</h1>
                      <p style={{ color: '#2563eb', fontSize: '14px', margin: 0 }}>Análisis Completo para {analysis.basicInfo.businessName || analysis.basicInfo.handle}</p>
                    </div>
                 </div>
                 <div style={{ textAlign: 'right', fontSize: '12px', color: '#94a3b8' }}>
                   Fecha de emisión: {new Date().toLocaleDateString()}<br/>
                   Asistente de Negocios Inteligentes
                 </div>
               </div>
               
               <div style={{ backgroundColor: '#1e3a8a', color: '#fff', padding: '30px', borderRadius: '20px', marginBottom: '40px' }}>
                 <h2 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '10px' }}>Salud Digital: {analysis.diagnosis.overallScore}/10</h2>
                 <p style={{ fontSize: '14px', fontStyle: 'italic', opacity: 0.9 }}>"{analysis.diagnosis.executiveSummary}"</p>
               </div>

               <ReportSections isPdf={true} />
               
               <div className="mt-12 pt-8 border-t border-slate-100 text-center">
                 <p style={{ fontSize: '12px', color: '#64748b' }}>© 2024 ANI Solutions. Expandiendo tu alcance, aumentando tus ventas.</p>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer (Solo UI) */}
      <footer className="mt-24 pb-12 border-t border-slate-200 pt-12 text-center no-print">
        <div className="max-w-xl mx-auto space-y-4">
          <h3 className="text-xl font-bold text-slate-800">¿Listo para escalar tu negocio con ANI?</h3>
          <p className="text-slate-400 text-xs">© 2024 ANI Solutions. Expandiendo tu alcance, aumentando tus ventas.</p>
        </div>
      </footer>

      {status === 'error' && (
        <div className="mt-8 p-6 bg-red-50 border border-red-200 rounded-2xl text-center no-print">
          <p className="text-red-700 font-bold">Error en el análisis de ANI</p>
          <button onClick={() => setStatus('idle')} className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg font-bold">Reintentar con ANI</button>
        </div>
      )}
    </div>
  );
};

export default App;
