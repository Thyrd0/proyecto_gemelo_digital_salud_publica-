import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Layers, 
  Wrench, 
  BookOpen, 
  Activity, 
  Download, 
  RotateCcw, 
  ChevronRight,
  Database,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { AcademicDisclaimer } from '../components/AcademicDisclaimer';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  steps?: Array<{ tool: string; args: any }>;
  source?: string;
  timestamp: string;
}

const PRESET_PROMPTS = [
  {
    icon: Activity,
    label: "Simular Políticas en Tracto 42101000100",
    query: "Simula un impuesto del 20% a bebidas azucaradas y un subsidio del 30% a frutas en el tracto 42101000100"
  },
  {
    icon: Database,
    label: "Consultar Indicadores Territoriales",
    query: "Muéstrame los indicadores socioeconómicos y de desierto alimentario del tracto 42101000100"
  },
  {
    icon: AlertTriangle,
    label: "Ranking de Tractos Vulnerables",
    query: "¿Cuáles son los 5 tractos de Philadelphia con mayor vulnerabilidad por prevalencia de diabetes y pobreza?"
  },
  {
    icon: BookOpen,
    label: "Evidencia Científica RAG (Powell / Afshin)",
    query: "¿Qué evidencia científica y elasticidades de demanda respaldan el impuesto del 20% según Powell y Afshin?"
  }
];

export const CopilotPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'langflow'>('chat');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "👋 **Bienvenido al Copiloto Inteligente de Salud Pública Urbana (LangChain Agent V2.1).**\n\nEstoy conectado en tiempo real a los 376 tractos censales de Philadelphia, al modelo predictivo `HistGradientBoostingRegressor` y al corpus científico indexado (RAG). Puedes pedirme que consulte indicadores, corra simulaciones de políticas o identifique áreas de alta vulnerabilidad.",
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [langflowSchema, setLangflowSchema] = useState<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const API_BASE = (window.location.port === '8000') ? '' : 'http://127.0.0.1:8000';

  useEffect(() => {
    // Fetch LangFlow schema from backend
    const fetchSchema = async () => {
      try {
        let res = await fetch(`${API_BASE}/api/v1/agent/flow`).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch('/api/v1/agent/flow').catch(() => null);
        }
        if (res && res.ok) {
          const data = await res.json();
          setLangflowSchema(data);
          return;
        }
      } catch (e) {
        // use fallback
      }
      
      setLangflowSchema({
        name: "Urban Food Twin Copilot",
        nodes: [
          { id: "1", label: "User Input (Chat UI)" },
          { id: "2", label: "CRISP-DM Persona Prompt" },
          { id: "3", label: "LLM Core (Gemini / OpenAI)" },
          { id: "4", label: "LangChain ReAct Agent" },
          { id: "5", label: "Tool: query_tract_indicators" },
          { id: "6", label: "Tool: simulate_policy_intervention" },
          { id: "7", label: "Tool: rank_top_vulnerable_tracts" },
          { id: "8", label: "Tool: search_scientific_evidence" }
        ]
      });
    };

    fetchSchema();
  }, []);

  const handleSendMessage = async (textToSend?: string) => {
    const messageText = textToSend || inputValue;
    if (!messageText.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toLocaleTimeString()
    };

    setMessages(prev => [...prev, userMsg]);
    if (!textToSend) setInputValue('');
    setIsLoading(true);

    try {
      const payload = {
        message: messageText,
        language: 'es',
        history: messages.map(m => ({ role: m.role, content: m.content }))
      };

      let response: Response | null = null;
      
      // Try direct API_BASE first, then fallback to relative proxy
      try {
        response = await fetch(`${API_BASE}/api/v1/agent/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } catch (err) {
        response = await fetch('/api/v1/agent/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (!response || !response.ok) {
        throw new Error(`Error HTTP ${response ? response.status : 'desconocido'} al conectar con FastAPI`);
      }

      const data = await response.json();
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || "No se recibió respuesta del agente.",
        steps: data.steps || [],
        source: data.source,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `⚠️ No se pudo contactar con el backend del agente (${err.message}). Por favor verifica que FastAPI esté corriendo en http://127.0.0.1:8000`,
        timestamp: new Date().toLocaleTimeString()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };


  const downloadLangflowJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(langflowSchema, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "langflow_digital_twin_copilot.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Banner & Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-turquoise-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-turquoise-500 to-indigo-600 flex items-center justify-center text-slate-950 shadow-lg shadow-turquoise-500/20">
              <Bot className="w-8 h-8" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-white tracking-tight">Copiloto LangChain & LangFlow</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-turquoise-500/20 text-turquoise-400 border border-turquoise-500/30">
                  Agentic AI V2.1
                </span>
              </div>
              <p className="text-slate-400 text-sm mt-1">
                Agente cognitivo con RAG científico, invocación de herramientas territoriales y simulación contrafactual del modelo ML.
              </p>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center bg-slate-950/70 p-1.5 rounded-xl border border-slate-800 self-start md:self-auto">
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'chat'
                  ? 'bg-turquoise-500 text-slate-950 shadow-md font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Sparkles className="w-4 h-4" />
              Chat Copiloto
            </button>
            <button
              onClick={() => setActiveTab('langflow')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'langflow'
                  ? 'bg-turquoise-500 text-slate-950 shadow-md font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="w-4 h-4" />
              Grafo LangFlow
            </button>
          </div>
        </div>
      </div>

      <AcademicDisclaimer />

      {activeTab === 'chat' ? (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Main Chat Box */}
          <div className="lg:col-span-3 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col h-[650px] shadow-xl overflow-hidden">
            {/* Chat Messages */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-xl bg-turquoise-500/20 text-turquoise-400 border border-turquoise-500/30 flex items-center justify-center shrink-0 mt-1">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed shadow-md ${
                      msg.role === 'user'
                        ? 'bg-turquoise-600 text-slate-950 font-medium ml-auto'
                        : 'bg-slate-950/80 border border-slate-800/80 text-slate-200'
                    }`}
                  >
                    {/* Tool Execution Badges */}
                    {msg.steps && msg.steps.length > 0 && (
                      <div className="mb-3 p-2.5 rounded-lg bg-slate-900 border border-slate-800 space-y-1.5 text-xs">
                        <div className="flex items-center gap-1.5 text-turquoise-400 font-semibold">
                          <Wrench className="w-3.5 h-3.5" />
                          <span>Herramientas de LangChain invocadas por el Agente:</span>
                        </div>
                        {msg.steps.map((st, i) => (
                          <div key={i} className="flex items-center gap-2 text-slate-400 font-mono text-[11px] bg-slate-950 px-2 py-1 rounded">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span className="text-slate-200 font-medium">{st.tool}</span>
                            <span className="text-slate-500">args: {JSON.stringify(st.args)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Markdown Message Content */}
                    <div className="whitespace-pre-wrap">
                      {msg.content}
                    </div>

                    <div className="mt-2 text-[10px] text-slate-400 flex justify-between items-center">
                      <span>{msg.timestamp}</span>
                      {msg.source && <span className="uppercase tracking-wider opacity-75">{msg.source}</span>}
                    </div>
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-1">
                      <span className="text-xs font-bold">TÚ</span>
                    </div>
                  )}
                </div>
              ))}

              {isLoading && (
                <div className="flex gap-3 items-center text-slate-400 text-xs py-2">
                  <div className="w-8 h-8 rounded-xl bg-turquoise-500/20 text-turquoise-400 border border-turquoise-500/30 flex items-center justify-center animate-pulse">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-turquoise-400 animate-ping" />
                    <span>El Agente LangChain está razonando y ejecutando herramientas...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <div className="p-4 bg-slate-950/60 border-t border-slate-800">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Haz una pregunta o simula una política (ej. 'Simula 20% impuesto en el tracto 42101000100')..."
                  className="flex-1 bg-slate-900 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-turquoise-500 focus:ring-1 focus:ring-turquoise-500 transition-all"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading || !inputValue.trim()}
                  className="px-5 py-3 rounded-xl bg-gradient-to-r from-turquoise-500 to-sky-600 hover:from-turquoise-400 hover:to-sky-500 disabled:opacity-50 text-slate-950 font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-turquoise-500/20"
                >
                  <Send className="w-4 h-4" />
                  <span className="hidden sm:inline">Enviar</span>
                </button>
              </form>
            </div>
          </div>

          {/* Quick Prompts & Tools Sidebar */}
          <div className="space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-turquoise-400" />
                Consultas Sugeridas
              </h3>
              <div className="space-y-2">
                {PRESET_PROMPTS.map((preset, idx) => {
                  const Icon = preset.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => handleSendMessage(preset.query)}
                      disabled={isLoading}
                      className="w-full text-left p-2.5 rounded-xl bg-slate-950 hover:bg-slate-800/80 border border-slate-800/80 hover:border-turquoise-500/40 text-xs text-slate-300 hover:text-turquoise-300 transition-all flex items-start gap-2.5 group"
                    >
                      <Icon className="w-4 h-4 text-turquoise-400 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                      <div>
                        <div className="font-semibold text-slate-200">{preset.label}</div>
                        <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{preset.query}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Registered Tools Card */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-lg">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Wrench className="w-4 h-4 text-turquoise-400" />
                Herramientas del Agente (LangChain)
              </h3>
              <ul className="space-y-2 text-xs text-slate-400">
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <code>query_tract_indicators</code>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <code>simulate_policy_intervention</code>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <code>rank_top_vulnerable_tracts</code>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <code>search_scientific_evidence</code>
                </li>
              </ul>
            </div>
          </div>
        </div>
      ) : (
        /* LangFlow Visual Architecture View */
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-turquoise-400" />
                  Arquitectura Cognitiva en LangFlow
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  Grafo visual de flujo de decisión que integra modelos LLM, agentes ReAct y herramientas analíticas del gemelo digital.
                </p>
              </div>

              <button
                onClick={downloadLangflowJson}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-sm font-medium text-slate-200 hover:text-white transition-all shadow-md"
              >
                <Download className="w-4 h-4 text-turquoise-400" />
                Exportar JSON para LangFlow
              </button>
            </div>

            {/* Visual Node Diagram */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-xl p-6 overflow-x-auto">
              <div className="min-w-[800px] flex items-center justify-between gap-4">
                {/* Node 1 */}
                <div className="w-48 bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
                  <div className="text-[10px] font-bold text-turquoise-400 uppercase">Input Layer</div>
                  <div className="font-semibold text-slate-200 text-sm mt-1">Chat Input UI</div>
                  <div className="text-slate-500 text-xs mt-1">Pregunta del usuario en React</div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />

                {/* Node 2 */}
                <div className="w-52 bg-slate-900 border border-indigo-500/40 rounded-xl p-3.5 shadow-md">
                  <div className="text-[10px] font-bold text-indigo-400 uppercase">Prompt Layer</div>
                  <div className="font-semibold text-slate-200 text-sm mt-1">CRISP-DM Persona</div>
                  <div className="text-slate-500 text-xs mt-1">Directrices éticas y epidemiológicas</div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />

                {/* Node 3 */}
                <div className="w-64 bg-slate-900 border border-turquoise-500/40 rounded-xl p-3.5 shadow-md">
                  <div className="text-[10px] font-bold text-turquoise-400 uppercase">Cognitive Core</div>
                  <div className="font-semibold text-slate-200 text-sm mt-1">LangChain ReAct Agent</div>
                  <div className="text-slate-500 text-xs mt-1">Tool Calling & Multi-step Reasoner</div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />

                {/* Node 4 (Tools Array) */}
                <div className="w-64 bg-slate-900 border border-emerald-500/40 rounded-xl p-3.5 shadow-md space-y-2">
                  <div className="text-[10px] font-bold text-emerald-400 uppercase">Agent Tools & RAG</div>
                  <div className="space-y-1 text-[11px] font-mono text-slate-300">
                    <div className="bg-slate-950 px-2 py-0.5 rounded">⚙️ query_tract_indicators</div>
                    <div className="bg-slate-950 px-2 py-0.5 rounded">⚙️ simulate_policy</div>
                    <div className="bg-slate-950 px-2 py-0.5 rounded">⚙️ rank_vulnerability</div>
                    <div className="bg-slate-950 px-2 py-0.5 rounded">📚 RAG Scientific Corpus</div>
                  </div>
                </div>

                <ChevronRight className="w-5 h-5 text-slate-600 shrink-0" />

                {/* Node 5 */}
                <div className="w-48 bg-slate-900 border border-slate-800 rounded-xl p-3.5 shadow-md">
                  <div className="text-[10px] font-bold text-sky-400 uppercase">Output Layer</div>
                  <div className="font-semibold text-slate-200 text-sm mt-1">Structured Reply</div>
                  <div className="text-slate-500 text-xs mt-1">Respuesta con trazas y disclaimers</div>
                </div>
              </div>
            </div>

            {/* Code / JSON Preview */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-slate-300 mb-2">Definición JSON del Grafo (LangFlow Format):</h3>
              <pre className="bg-slate-950 border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-72">
                {JSON.stringify(langflowSchema, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
