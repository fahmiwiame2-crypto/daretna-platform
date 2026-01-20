import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Trash2,
  Download,
  ArrowLeft,
  Sparkles,
  Bot,
  User as UserIcon,
  ChevronRight,
  RefreshCw,
  Mic,
  MicOff,
  Volume2,
  VolumeX
} from 'lucide-react';
import { User } from '../types';
import { aiService, advancedAI } from '../services/geminiService';

interface ChatIAProps {
  user: User;
  navigate: (page: string) => void;
}

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: Date;
  isTyping?: boolean;
}

const QUICK_QUESTIONS = [
  { emoji: "💰", text: "Comment économiser efficacement ?" },
  { emoji: "📊", text: "Quel montant pour ma première Daret ?" },
  { emoji: "🤝", text: "Comment choisir mes co-membres ?" },
  { emoji: "⚠️", text: "Quels sont les risques ?" },
  { emoji: "📈", text: "Conseils pour mon score de confiance" },
  { emoji: "🎯", text: "Stratégies d'épargne au Maroc" }
];

export const ChatIA: React.FC<ChatIAProps> = ({ user, navigate }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      sender: 'ai',
      text: `Bonjour ${user.name} ! 👋\n\nJe suis DaretBot, votre Coach Financier IA. Je suis ici pour vous accompagner dans votre parcours d'épargne.\n\nComment puis-je vous aider aujourd'hui ?`,
      timestamp: new Date()
    }
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [chatSession, setChatSession] = useState<any>(null);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [isListening, setIsListening] = useState(false);
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    const session = aiService.createCoachChat(user);
    setChatSession(session);
  }, [user]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'fr-FR';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0])
          .map((result: any) => result.transcript)
          .join('');
        setInputText(transcript);
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    }
  }, []);

  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      recognitionRef.current.start();
    } else {
      alert("Votre navigateur ne supporte pas la reconnaissance vocale.");
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const speak = (text: string) => {
    if (!speechEnabled) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const cleanText = advancedAI.cleanMarkdownForSpeech(text);
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'fr-FR';
    utterance.rate = 1.1;
    window.speechSynthesis.speak(utterance);
  };

  const simulateTyping = async (text: string): Promise<void> => {
    return new Promise((resolve) => {
      const delay = Math.min(text.length * 5, 1200);
      setTimeout(resolve, delay);
    });
  };

  const handleSend = async (text?: string) => {
    const messageText = text || inputText;
    if (!messageText.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      sender: 'user',
      text: messageText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputText('');
    setLoading(true);
    setShowQuickQuestions(false);

    const typingMsg: Message = {
      id: 'typing',
      sender: 'ai',
      text: '',
      timestamp: new Date(),
      isTyping: true
    };
    setMessages(prev => [...prev, typingMsg]);

    try {
      let responseText = "Désolé, je ne suis pas disponible pour le moment. Vérifiez votre clé API Gemini.";

      if (chatSession) {
        responseText = await aiService.sendMessage(chatSession, messageText);
      }

      await simulateTyping(responseText);

      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'typing');
        return [
          ...filtered,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: responseText,
            timestamp: new Date()
          }
        ];
      });

      // Trigger speech
      speak(responseText);
    } catch (error) {
      console.error("Chat Error:", error);
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'typing');
        return [
          ...filtered,
          {
            id: (Date.now() + 1).toString(),
            sender: 'ai',
            text: "Oups, j'ai eu un petit problème. Réessayez plus tard. 😅",
            timestamp: new Date()
          }
        ];
      });
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleExport = () => {
    const chatText = messages
      .map(m => `[${m.timestamp.toLocaleString()}] ${m.sender === 'user' ? user.name : 'DaretBot'}: ${m.text}`)
      .join('\n\n');

    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `daretbot-chat-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleClear = () => {
    if (confirm('Effacer toute la conversation ?')) {
      setMessages([
        {
          id: 'welcome',
          sender: 'ai',
          text: `C'est reparti ! En quoi puis-je vous aider, ${user.name} ?`,
          timestamp: new Date()
        }
      ]);
      setShowQuickQuestions(true);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] md:h-[calc(100vh-64px)] bg-slate-50 dark:bg-slate-900 overflow-hidden">

      {/* HEADER */}
      <header className="bg-white dark:bg-slate-800 px-6 py-4 shadow-sm border-b border-slate-200 dark:border-slate-700 z-20 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('dashboard')}
            className="p-2 -ml-2 text-slate-400 hover:text-navy-900 dark:hover:text-white transition-colors"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>

          <div className="relative">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-600 to-daretPink flex items-center justify-center text-white shadow-lg shadow-daretPink/20">
              <Bot className="w-7 h-7" />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-4 border-white dark:border-slate-800"></div>
          </div>

          <div>
            <h1 className="font-black text-navy-900 dark:text-white leading-none mb-1">DaretBot</h1>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              <span className="text-[10px] font-black uppercase tracking-widest text-green-600 dark:text-green-400">En Ligne</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className={`p-2.5 rounded-xl transition-all ${speechEnabled
                ? 'text-daretPink bg-daretPink/10 hover:bg-daretPink/20'
                : 'text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700'
              }`}
            title={speechEnabled ? "Désactiver la voix" : "Activer la voix"}
          >
            {speechEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            onClick={handleExport}
            className="p-2.5 text-slate-400 hover:text-navy-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all"
          >
            <Download className="w-5 h-5" />
          </button>
          <button
            onClick={handleClear}
            className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* CHAT AREA */}
      <div className="flex-grow overflow-y-auto px-4 py-8 md:px-8 space-y-6 scroll-smooth custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className={`flex w-full ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`flex gap-3 max-w-[85%] md:max-w-[70%] ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>

                {/* Avatar Shadow Icon */}
                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-auto ${msg.sender === 'user' ? 'bg-navy-900 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'
                  }`}>
                  {msg.sender === 'user' ? <UserIcon className="w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                </div>

                <div className={`relative px-5 py-4 rounded-3xl shadow-sm ${msg.sender === 'user'
                  ? 'bg-navy-900 text-white rounded-br-none'
                  : 'bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-200 dark:border-slate-700 rounded-bl-none'
                  }`}>
                  {msg.isTyping ? (
                    <div className="flex gap-1.5 py-1 items-center">
                      <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                      <motion.div animate={{ scale: [1, 1.5, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-slate-400 rounded-full" />
                    </div>
                  ) : (
                    <>
                      <div className="text-sm md:text-base leading-relaxed whitespace-pre-wrap font-medium">
                        {msg.text}
                      </div>
                      <div className={`text-[9px] font-bold mt-2 opacity-40 uppercase tracking-tighter ${msg.sender === 'user' ? 'text-right text-indigo-200' : 'text-slate-400'
                        }`}>
                        {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* QUICK SUGGESTIONS */}
        {showQuickQuestions && messages.length === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col items-center gap-4 py-8"
          >
            <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Sparkles className="w-3 h-3 text-yellow-500" />
              Suggestions Rapides
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full max-w-2xl px-4">
              {QUICK_QUESTIONS.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(q.text)}
                  className="group flex items-center justify-between px-5 py-4 bg-white dark:bg-slate-800 hover:bg-navy-900 hover:text-white dark:hover:bg-indigo-900 rounded-2xl text-sm font-bold border border-slate-200 dark:border-slate-700 transition-all shadow-sm hover:shadow-xl hover:-translate-y-0.5"
                >
                  <span className="flex items-center gap-3">
                    <span className="text-xl group-hover:scale-125 transition-transform">{q.emoji}</span>
                    <span className="text-left leading-tight">{q.text}</span>
                  </span>
                  <ChevronRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity lg:block hidden" />
                </button>
              ))}
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* INPUT AREA */}
      <div className="bg-white dark:bg-slate-800 p-4 md:p-6 border-t border-slate-200 dark:border-slate-700">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="relative flex-grow">
            <input
              ref={inputRef}
              type="text"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Posez votre question à DaretBot..."
              className="w-full px-6 py-4 bg-slate-50 dark:bg-slate-700 border-2 border-transparent focus:border-daretPink/30 focus:bg-white dark:focus:bg-slate-600 rounded-2xl outline-none text-navy-900 dark:text-white font-bold transition-all placeholder-slate-400"
              disabled={loading}
            />
            {loading && (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <RefreshCw className="w-5 h-5 text-daretPink animate-spin" />
              </div>
            )}
          </div>

          <button
            onClick={isListening ? stopListening : startListening}
            disabled={loading}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${isListening
                ? 'bg-red-500 text-white animate-pulse shadow-lg shadow-red-500/30'
                : 'bg-white dark:bg-slate-700 text-slate-400 hover:text-navy-900 dark:hover:text-white border-2 border-slate-100 dark:border-slate-600'
              }`}
          >
            {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <button
            onClick={() => handleSend()}
            disabled={loading || !inputText.trim()}
            className="w-14 h-14 rounded-2xl bg-navy-900 dark:bg-daretPink text-white flex items-center justify-center hover:scale-105 active:scale-95 transition shadow-lg shadow-navy-900/10 disabled:opacity-30 disabled:hover:scale-100"
          >
            <Send className="w-6 h-6 ml-0.5" />
          </button>
        </div>
        <p className="text-center text-[10px] font-bold text-slate-400 mt-4 uppercase tracking-widest">
          L'IA peut faire des erreurs • Powered by Gemini 1.5
        </p>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
        .dark .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #334155;
        }
      `}</style>
    </div>
  );
};