import React, { useState, useEffect, useRef } from 'react';
import { 
  Bot, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Sparkles, 
  RotateCcw, 
  MessageSquare,
  User,
  ChevronDown,
  Play,
  Pause,
  AlertCircle
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { SimulationSummary } from '../../types';
import { generateChatbotResponse } from '../../services/chatbotService';
import { sendChatMessage } from '../../services/apiClient';

interface Message {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  isSpeaking?: boolean;
}

interface ChatbotWidgetProps {
  summary?: SimulationSummary;
}

export function ChatbotWidget({ summary }: ChatbotWidgetProps) {
  const { language } = useLanguage();
  const isEs = language === 'es';

  // Chat window state
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Audio Speech Synthesis state (Texto a Voz)
  const [ttsEnabled, setTtsEnabled] = useState<boolean>(true);
  const [currentlySpeakingId, setCurrentlySpeakingId] = useState<string | null>(null);

  // Audio Speech Recognition state (Voz a Texto)
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [voiceNotice, setVoiceNotice] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Initial greeting
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: isEs
        ? '¡Hola! Soy **NutriTwin AI**, tu asistente inteligente de voz y texto. Puedes escribirme o hablarme por voz usando el micrófono.\n\n¿En qué puedo ayudarte a analizar sobre la ciudad o las políticas de salud urbana hoy?'
        : 'Hello! I am **NutriTwin AI**, your voice and text assistant. You can type or speak to me using the microphone.\n\nHow can I help you analyze the city or public health policies today?',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);

  // Scroll to bottom on new message
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen, isLoading]);

  // Check Web Speech API (SpeechRecognition) support
  useEffect(() => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setSpeechSupported(false);
    }
  }, []);

  // Initialize Speech Recognition when starting voice input
  const startListening = () => {
    const SpeechRecognitionClass = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionClass) {
      setVoiceNotice(isEs ? 'El reconocimiento de voz no es soportado por este navegador.' : 'Voice recognition is not supported in this browser.');
      setTimeout(() => setVoiceNotice(null), 4000);
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      const recognition = new SpeechRecognitionClass();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = isEs ? 'es-ES' : 'en-US';

      recognition.onstart = () => {
        setIsListening(true);
        setVoiceNotice(isEs ? '🎙️ Escuchando... Habla ahora' : '🎙️ Listening... Speak now');
      };

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        setInputText(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
        setVoiceNotice(isEs ? 'No se pudo capturar el audio. Intenta de nuevo.' : 'Could not capture audio. Try again.');
        setTimeout(() => setVoiceNotice(null), 3500);
      };

      recognition.onend = () => {
        setIsListening(false);
        setVoiceNotice(null);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.error('Error starting speech recognition:', err);
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  // Text-to-Speech (TTS) synthesizer function
  const speakText = (text: string, msgId: string) => {
    if (!('speechSynthesis' in window)) return;

    // Stop ongoing speech
    window.speechSynthesis.cancel();

    if (currentlySpeakingId === msgId) {
      setCurrentlySpeakingId(null);
      return;
    }

    // Clean markdown symbols for cleaner voice utterance
    const cleanText = text.replace(/[*_#`\-]/g, '').trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = isEs ? 'es-ES' : 'en-US';
    utterance.rate = 1.0;
    utterance.pitch = 1.0;

    utterance.onend = () => {
      setCurrentlySpeakingId(null);
    };

    utterance.onerror = () => {
      setCurrentlySpeakingId(null);
    };

    setCurrentlySpeakingId(msgId);
    window.speechSynthesis.speak(utterance);
  };

  // Handle submitting user message
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || isLoading) return;

    // Stop listening if mic was active
    if (isListening) {
      stopListening();
    }

    const userMsgId = 'user-' + Date.now();
    const newMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, newMsg]);
    setInputText('');
    setIsLoading(true);

    try {
      // Generate AI / Domain response via FastAPI backend proxy
      let responseText = '';
      try {
        const res = await sendChatMessage(text, language);
        responseText = res.reply;
      } catch (e) {
        responseText = await generateChatbotResponse(text, messages, summary, language);
      }

      const assistantMsgId = 'assistant-' + Date.now();
      const assistantMsg: Message = {
        id: assistantMsgId,
        sender: 'assistant',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMsg]);

      // Speak automatically if TTS enabled
      if (ttsEnabled) {
        speakText(responseText, assistantMsgId);
      }
    } catch (err) {
      console.error('Error in chatbot generation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Clear Chat History
  const handleClearHistory = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
    setCurrentlySpeakingId(null);
    setMessages([
      {
        id: 'welcome-reset',
        sender: 'assistant',
        text: isEs
          ? 'Conversación reiniciada. ¿Qué otra duda tienes sobre el Gemelo Digital?'
          : 'Conversation reset. What other questions do you have about the Digital Twin?',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  // Suggested Quick Prompts
  const quickPrompts = isEs ? [
    '¿Qué política reduce más la diabetes?',
    'Resúmeme los datos del tracto 42101000100',
    '¿Cuál es la variable con mayor impacto en la diabetes en Philadelphia?',
    'Compara los escenarios de Impuesto y Subsidio'
  ] : [
    'Summarize data for tract 42101000100',
    'How does the 3D simulator work?',
    'What is the mRFEI index?'
  ];

  return (
    <div className="fixed bottom-5 right-5 z-50 font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Floating Trigger Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="group relative flex items-center gap-3 px-4 py-3 rounded-full bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer"
        >
          <div className="relative">
            <Bot className="w-6 h-6 animate-bounce" />
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          <div className="text-left hidden sm:block">
            <p className="text-xs font-bold leading-tight">NutriTwin AI</p>
            <p className="text-[10px] text-teal-100 opacity-90">{isEs ? 'Asistente Voz & Texto' : 'Voice & Text AI'}</p>
          </div>
          <Sparkles className="w-4 h-4 text-cyan-200 group-hover:rotate-12 transition-transform" />
        </button>
      )}

      {/* Main Chat Modal Drawer */}
      {isOpen && (
        <div className="w-[92vw] sm:w-[420px] h-[580px] max-h-[85vh] bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-teal-950 text-white p-4 flex items-center justify-between border-b border-slate-700/60">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-2xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-sm leading-tight font-['Space_Grotesk']">NutriTwin AI</h3>
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-teal-500/20 text-teal-300 font-bold border border-teal-500/30">
                    Voz & Texto
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 flex items-center gap-1.5 mt-0.5">
                  <span className={`w-2 h-2 rounded-full ${isListening ? 'bg-rose-500 animate-ping' : 'bg-emerald-400'}`}></span>
                  <span>{isListening ? (isEs ? 'Escuchando tu voz...' : 'Listening to voice...') : (isEs ? 'En línea' : 'Online')}</span>
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1">
              {/* Audio Text-to-Speech Toggle */}
              <button
                onClick={() => {
                  setTtsEnabled(!ttsEnabled);
                  if (ttsEnabled && window.speechSynthesis) {
                    window.speechSynthesis.cancel();
                    setCurrentlySpeakingId(null);
                  }
                }}
                title={ttsEnabled ? (isEs ? 'Desactivar voz de respuesta' : 'Disable voice response') : (isEs ? 'Activar voz de respuesta' : 'Enable voice response')}
                className={`p-2 rounded-xl transition cursor-pointer ${
                  ttsEnabled ? 'bg-teal-500/30 text-teal-300 hover:bg-teal-500/40' : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                {ttsEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              </button>

              {/* Clear History */}
              <button
                onClick={handleClearHistory}
                title={isEs ? 'Limpiar conversación' : 'Clear conversation'}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              {/* Close Window */}
              <button
                onClick={() => setIsOpen(false)}
                title={isEs ? 'Cerrar' : 'Close'}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Voice status notification banner */}
          {voiceNotice && (
            <div className="bg-cyan-500/10 border-b border-cyan-500/20 text-cyan-700 dark:text-cyan-300 px-3 py-2 text-xs flex items-center justify-between gap-2 animate-in fade-in duration-150">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span className="font-medium">{voiceNotice}</span>
              </div>
              <button onClick={() => setVoiceNotice(null)} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Chat Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50 dark:bg-slate-950/40">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'assistant' && (
                  <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <Bot className="w-4 h-4" />
                  </div>
                )}

                <div className={`max-w-[82%] space-y-1 ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
                  <div
                    className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-teal-600 text-white rounded-tr-xs'
                        : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200/80 dark:border-slate-700/80 rounded-tl-xs'
                    }`}
                  >
                    {/* Render message formatting */}
                    <div className="prose dark:prose-invert text-xs space-y-1 font-normal whitespace-pre-wrap">
                      {msg.text}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 dark:text-slate-500 px-1">
                    <span>{msg.timestamp}</span>
                    {msg.sender === 'assistant' && (
                      <button
                        onClick={() => speakText(msg.text, msg.id)}
                        className={`flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 transition cursor-pointer ${
                          currentlySpeakingId === msg.id ? 'text-teal-600 dark:text-teal-400 font-bold' : 'text-slate-400'
                        }`}
                      >
                        {currentlySpeakingId === msg.id ? (
                          <>
                            <Pause className="w-3 h-3 animate-pulse text-teal-500" />
                            <span>{isEs ? 'Detener voz' : 'Stop voice'}</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3" />
                            <span>{isEs ? 'Escuchar' : 'Listen'}</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-7 h-7 rounded-xl bg-slate-800 text-white flex items-center justify-center shrink-0 shadow-xs mt-1">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Thinking / Loading indicator */}
            {isLoading && (
              <div className="flex gap-3 items-center">
                <div className="w-7 h-7 rounded-xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4 animate-spin" />
                </div>
                <div className="bg-white dark:bg-slate-800 p-3 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs text-slate-500 flex items-center gap-2">
                  <span className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.2s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-teal-500 animate-bounce [animation-delay:0.4s]"></span>
                  </span>
                  <span>{isEs ? 'NutriTwin analizando...' : 'NutriTwin analyzing...'}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Prompts Carousel */}
          <div className="px-3 py-2 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800/80 overflow-x-auto whitespace-nowrap scrollbar-none flex items-center gap-1.5 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-teal-600 dark:text-teal-400 shrink-0" />
            {quickPrompts.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(prompt)}
                className="px-2.5 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-teal-50 dark:hover:bg-teal-950 hover:text-teal-700 dark:hover:text-teal-300 border border-slate-200 dark:border-slate-700 transition cursor-pointer shrink-0"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Audio & Text Input Bar */}
          <div className="p-3 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              {/* Microphone Button (Audio Input) */}
              <button
                type="button"
                onClick={isListening ? stopListening : startListening}
                title={isListening ? (isEs ? 'Detener micrófono' : 'Stop mic') : (isEs ? 'Hablar por micrófono' : 'Speak via microphone')}
                className={`p-2.5 rounded-xl transition cursor-pointer relative shrink-0 ${
                  isListening
                    ? 'bg-rose-600 text-white ring-4 ring-rose-500/30 animate-pulse'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
              </button>

              {/* Text Input Box */}
              <div className="relative flex-1">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    isListening
                      ? (isEs ? 'Escuchando tu voz...' : 'Listening to voice...')
                      : (isEs ? 'Escribe o háblame por voz...' : 'Type or speak to me...')
                  }
                  disabled={isLoading}
                  className="w-full pl-3 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500 outline-none transition"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={!inputText.trim() || isLoading}
                className="p-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white shadow-xs transition cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
