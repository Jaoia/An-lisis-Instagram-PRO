
import React, { useState, useRef } from 'react';
import { InstagramAnalysis, AnalysisStatus } from './types';
import { performAnalysis } from './services/geminiService';
import ComparisonChart from './components/ComparisonChart';

const App: React.FC = () => {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<AnalysisStatus>('idle');
  const [isExporting, setIsExporting] = useState(false);
  const [analysis, setAnalysis] = useState<InstagramAnalysis | null>(null);
  const [activeTab, setActiveTab] = useState<'info' | 'content' | 'competitors' | 'diagnosis' | 'proposal'>('info');
  const [errorMessage, setErrorMessage] = useState('');
  
  const fullReportRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username) return;
    
    setErrorMessage('');
    setStatus('searching');
    
    try {
      const result = await performAnalysis(username);
      setAnalysis(result);
      setStatus('completed');
    } catch (error: any) {
      console.error(error);
      setErrorMessage(error.message || 'Ocurrió un error inesperado al buscar el perfil.');
      setStatus('error');
    }
  };

  const handleDownloadPDF = async () => {
    if (!fullReportRef.current || !analysis) return;
    
    setIsExporting(true);
    
    try {
      // Importación dinámica robusta para html2pdf
      const html2pdfModule = await import('https://esm.sh/html2pdf.js@0.10.1');
      const html2pdf = html2pdfModule.default;
      
      const element = fullReportRef.current;
      const opt = {
        margin: [10, 10, 10, 10],
        filename: `Reporte_ANI_${analysis.basicInfo.businessName.replace(/\s+/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();
    } catch (error) {
      console.error("Error generating PDF:", error);
      alert("No se pudo generar el PDF. Por favor, inténtalo de nuevo.");
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

  const renderValue = (value: any, fallback: string = "No disponible") => {
    if (!value || (Array.isArray(value) && value.length === 0)) {
      return <span className="text-slate-400 italic">{fallback}</span>;
    }
    if (Array.isArray(value)) return value.join(', ');
    return value;
  };

  const ReportSections = ({ isPdf = false }: { isPdf?: boolean }) => {
    if (!analysis) return null;

    return (
      <div className={`space-y-12 ${isPdf ? 'p-4 bg-white' : ''}`}>
        {(isPdf || activeTab === 'info') && (
          <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm relative break-inside-avoid">
            <h3 className="text-2xl font-bold text-blue-900 mb-8 flex items-center gap-3">
              <span className="bg-blue-600 text-white w-10 h-10 flex items-center justify-center rounded-xl">📄</span>
              Diagnóstico del Perfil
            </h3>
            <div className="space-y-6">
              {[
                { label: "Nombre del Negocio", val: analysis.basicInfo.businessName },
                { label: "Categoría", val: analysis.basicInfo.category },
                { label: "Biografía", val: analysis.basicInfo.bio, italic: true },
                { label: "Ubicación", val: analysis.basicInfo.location },
                { label: "Propuesta de Valor", val: analysis.basicInfo.uniqueValueProp },
              ].map((item, idx) => (
                <div key={idx} className="border-b border-slate-50 pb-4">
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">{item.label}</label>
                  <p className={`text-slate-800 font-medium ${item.italic ? 'italic' : ''}`}>{renderValue(item.val)}</p>
                </div>
              ))}
              <div className="grid grid-cols-2 gap-4">
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Sitio Web</label>
                    <p className="text-blue-600 font-bold truncate">{renderValue(analysis.basicInfo.contact.website)}</p>
                 </div>
                 <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Teléfono</label>
                    <p className="text-slate-800 font-bold">{renderValue(analysis.basicInfo.contact.phone)}</p>
                 </div>
              </div>
            </div>
          </div>
        )}

        {(isPdf || activeTab === 'content') && (
          <div className="space-y-6 break-inside-avoid">
             <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-4 rounded-xl border border-slate-100 text-center">
                   <p className="text-xs text-slate-400 uppercase font-bold">Engagement</p>
                   <p className="text-xl font-bold text-blue-600">{analysis.contentMetrics.engagementLevel}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 text-center">
                   <p className="text-xs text-slate-400 uppercase font-bold">Frecuencia</p>
                   <p className="text-xl font-bold text-slate-800">{analysis.contentMetrics.postFrequency}</p>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-100 text-center">
                   <p className="text-xs text-slate-400 uppercase font-bold">Consistencia</p>
                   <p className="text-xl font-bold text-blue-600">{analysis.contentMetrics.brandConsistency}/10</p>
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

        {(isPdf || activeTab === 'competitors') && (
          <div className="space-y-6 break-inside-avoid">
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Benchmark de Competencia</h3>
              <div style={isPdf ? { width: '700px', height: '400px', margin: '0 auto' } : {}}>
                <ComparisonChart competitors={analysis.competitors} businessName={analysis.basicInfo.businessName} />
              </div>
            </div>
          </div>
        )}

        {(isPdf || activeTab === 'diagnosis') && (
          <div className="space-y-6 break-inside-avoid">
            <div className="bg-white rounded-2xl p-8 border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold text-slate-800 mb-6">Oportunidades de Mejora</h3>
              <div className="space-y-4">
                {analysis.diagnosis.opportunities.map((opp, i) => (
                  <div key={i} className={`p-5 rounded-2xl border ${getPriorityColor(opp.priority)}`}>
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg">{opp.area}</h4>
                      <span className="text-xs font-bold px-2 py-1 rounded-full uppercase">Prioridad {opp.priority}</span>
                    </div>
                    <p className="text-sm opacity-90">{opp.advice}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {(isPdf || activeTab === 'proposal') && (
          <div className="space-y-8 break-inside-avoid">
            <div className="bg-blue-900 text-white rounded-2xl p-8 relative overflow-hidden">
              <h3 className="text-2xl font-bold mb-6">Propuesta Growth de ANI</h3>
              <p className="mb-8 leading-relaxed italic opacity-90 border-l-4 border-blue-400 pl-4">
                {analysis.commercialProposal.introduction}
              </p>
              <div className="grid grid-cols-2 gap-6">
                {[
                  { title: 'Ecosistema Web', desc: analysis.commercialProposal.solution.webDesign },
                  { title: 'Automatización', desc: analysis.commercialProposal.solution.chatbot },
                  { title: 'Agendamiento', desc: analysis.commercialProposal.solution.bookingSystem },
                  { title: 'Optimización', desc: analysis.commercialProposal.solution.socialOptimization },
                ].map((item, idx) => (
                  <div key={idx} className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
                    <h4 className="font-bold mb-2 text-blue-300">{item.title}</h4>
                    <p className="text-xs opacity-80">{item.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
      <header className="text-center mb-12 no-print">
        <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-600 text-white text-4xl font-black rounded-3xl shadow-xl mb-6 rotate-3">ANI</div>
        <h1 className="text-4xl font-extrabold text-blue-900 mb-2">Asistente de Negocios Inteligentes</h1>
        <p className="text-xl font-medium text-blue-600 italic">Análisis profesional de perfiles para escalar tus ventas</p>
      </header>

      <section className="bg-white rounded-2xl shadow-xl p-8 mb-12 border border-slate-100 max-w-3xl mx-auto no-print">
        <form onSubmit={handleAnalyze} className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-grow">
            <span className="absolute inset-y-0 left-0 pl-4 flex items-center text-slate-400 font-bold">@</span>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Ej: apple o https://instagram.com/apple"
              className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
              disabled={status === 'searching' || status === 'analyzing'}
            />
          </div>
          <button
            type="submit"
            disabled={status === 'searching' || status === 'analyzing' || !username}
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-semibold rounded-xl transition shadow-lg"
          >
            {status === 'searching' || status === 'analyzing' ? 'Buscando perfil...' : 'Analizar Perfil'}
          </button>
        </form>
        {status === 'searching' && (
           <div className="mt-4 flex items-center justify-center gap-3 text-blue-600 font-medium animate-pulse">
              <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
              ANI está escaneando la web para encontrar el perfil...
           </div>
        )}
      </section>

      {analysis && status === 'completed' && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="bg-blue-900 text-white rounded-2xl p-8 mb-8 flex items-center justify-between no-print">
            <div>
              <h2 className="text-2xl font-bold mb-2">Salud Digital: {analysis.diagnosis.overallScore}/10</h2>
              <p className="text-blue-100 italic opacity-90 max-w-2xl">"{analysis.diagnosis.executiveSummary}"</p>
            </div>
            <div className="hidden md:block">
               <div className="w-24 h-24 border-8 border-blue-400 border-t-emerald-400 rounded-full flex items-center justify-center text-3xl font-bold">
                  {analysis.diagnosis.overallScore}
               </div>
            </div>
          </div>

          <div className="flex overflow-x-auto pb-4 gap-2 mb-8 no-scrollbar no-print">
            {[
              { id: 'info', label: 'Info Perfil', icon: '👤' },
              { id: 'content', label: 'Contenido', icon: '📊' },
              { id: 'competitors', label: 'Benchmark', icon: '⚔️' },
              { id: 'diagnosis', label: 'Mejoras', icon: '🚀' },
              { id: 'proposal', label: 'Estrategia', icon: '💼' }
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

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 no-print">
               <ReportSections />
            </div>

            <div className="lg:col-span-4 space-y-6 no-print">
              <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-sm sticky top-8">
                <h4 className="font-bold text-slate-800 mb-4 uppercase text-xs tracking-widest">Fuentes de Datos</h4>
                <div className="space-y-3 mb-8">
                  {analysis.sources.map((source, i) => (
                    <a key={i} href={source.uri} target="_blank" rel="noreferrer" className="block text-xs text-blue-500 hover:underline truncate">
                      • {source.title}
                    </a>
                  ))}
                </div>
                <button 
                  onClick={handleDownloadPDF} 
                  disabled={isExporting}
                  className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition flex items-center justify-center gap-2"
                >
                  {isExporting ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : "Descargar Reporte PDF"}
                </button>
              </div>
            </div>
          </div>

          {/* PDF EXPORT CONTENT */}
          <div style={{ position: 'absolute', top: '-10000px', left: '-10000px' }}>
            <div ref={fullReportRef} style={{ width: '800px', backgroundColor: '#fff', padding: '40px' }}>
               <div className="mb-12 flex items-center justify-between border-b pb-8">
                  <div className="flex items-center gap-6">
                     <div style={{ backgroundColor: '#2563eb', color: '#fff', width: '60px', height: '60px', borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', fontWeight: 'bold' }}>ANI</div>
                     <div>
                        <h1 style={{ fontSize: '28px', color: '#1e3a8a', fontWeight: 'bold', margin: 0 }}>Auditoría Digital de Perfil</h1>
                        <p style={{ color: '#2563eb', margin: 0 }}>Análisis estratégico para {analysis.basicInfo.businessName}</p>
                     </div>
                  </div>
                  <div className="text-right text-xs text-slate-400">
                     ID: {Math.random().toString(36).substr(2, 9).toUpperCase()}<br/>
                     Fecha: {new Date().toLocaleDateString()}
                  </div>
               </div>
               <ReportSections isPdf={true} />
               <div className="mt-12 pt-8 border-t text-center text-xs text-slate-400">
                  Reporte generado por ANI (Asistente de Negocios Inteligentes) - Todos los derechos reservados 2024.
               </div>
            </div>
          </div>
        </div>
      )}

      {status === 'error' && (
        <div className="mt-8 p-8 bg-red-50 border border-red-200 rounded-2xl text-center max-w-xl mx-auto no-print">
          <p className="text-red-700 font-bold mb-2">No pudimos completar el análisis</p>
          <p className="text-red-600 text-sm mb-6">{errorMessage}</p>
          <button onClick={() => setStatus('idle')} className="px-6 py-2 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition">Reintentar con otro perfil</button>
        </div>
      )}
    </div>
  );
};

export default App;
