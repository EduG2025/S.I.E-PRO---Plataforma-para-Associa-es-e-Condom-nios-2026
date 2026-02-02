import React, { useState, useRef, useEffect } from 'react';
import { Send, Brain, User, Loader2, Sparkles, ShieldCheck, Zap, Trash2, Link as LinkIcon, ExternalLink, RefreshCw, Search, X } from 'lucide-react';
import { aiService } from '../services/api';

interface Message {
  id: string;
  text: string;
  sender: 'AI' | 'USER';
  timestamp: Date;
  sources?: { title: string; uri: string }[];
}

const ChatAssistant = ({ systemInfo }: { systemInfo?: any }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'OLÁ! SOU O ADVISOR S.I.E PRO.\n\nPossuo acesso às leis brasileiras e regimentos associativos em tempo real.\n\nComo posso auxiliar na gestão do seu cluster hoje?',
      sender: 'AI',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useGrounding, setUseGrounding] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading) return;

    const query = input;
    const userMsg: Message = { id: Date.now().toString(), text: query, sender: 'USER', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    
    setInput('');
    setIsLoading(true);

    try {
      const res = await aiService.chat(query, { search: useGrounding }); 
      
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: res.data.text || 'O KERNEL MENTOR NÃO RETORNOU UMA RESPOSTA VÁLIDA.',
        sender: 'AI',
        timestamp: new Date(),
        sources: res.data.groundingChunks?.map((c: any) => {
            if (c.web) return { title: c.web.title || 'REF PÚBLICA', uri: c.web.uri || '#' };
            return null;
        }).filter(Boolean) || []
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      setMessages(prev => [...prev, {
        id: 'err',
        text: '⚠️ FALHA DE SINCRONIA NEURAL: VERIFIQUE AS CHAVES NO CONSOLE MASTER.',
        sender: 'AI',
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in overflow-hidden bg-slate-50/50 rounded-[2.5rem] border border-slate-200">
      {/* SRE: Header Compacto (64px em mobile) */}
      <div className="bg-slate-900 px-6 py-4 flex justify-between items-center shrink-0 border-b border-white/5 shadow-xl relative z-20">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full blur-3xl -mr-10 -mt-10"></div>
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-2xl animate-pulse shrink-0">
            <Brain size={20} />
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-black text-sm uppercase tracking-tight leading-none truncate">Advisor Mentor</h2>
            <p className="text-indigo-400 text-[8px] font-black uppercase tracking-widest mt-1 opacity-80">Inteligência Ativa</p>
          </div>
        </div>
        <div className="flex items-center gap-2 relative z-10">
            <button onClick={() => setUseGrounding(!useGrounding)} className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 border font-black text-[8px] uppercase tracking-widest ${useGrounding ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-white/5 text-slate-400 border-white/5'}`}>
                <Search size={12} /> <span className="hidden sm:inline">{useGrounding ? 'Grounding On' : 'Grounding Off'}</span>
            </button>
            <button onClick={() => setMessages([messages[0]])} className="p-2 bg-white/5 hover:bg-rose-500 text-slate-400 hover:text-white rounded-lg transition-all border border-white/5">
                <Trash2 size={14} />
            </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col relative">
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 md:p-10 space-y-8 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'} animate-scale-in`}>
              <div className={`max-w-[95%] md:max-w-[80%] flex gap-3 ${msg.sender === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 shadow-lg border ${msg.sender === 'USER' ? 'bg-indigo-600 text-white border-indigo-400' : 'bg-slate-900 text-indigo-400 border-white/10'}`}>
                  {msg.sender === 'USER' ? <User size={16}/> : <Sparkles size={16}/>}
                </div>
                <div className="space-y-4 flex-1">
                  {/* SRE: Normalização de Texto (text-sm/leading-relaxed) */}
                  <div className={`p-5 rounded-[1.75rem] text-sm font-medium leading-relaxed shadow-sm border ${msg.sender === 'USER' ? 'bg-indigo-600 text-white border-indigo-500 rounded-tr-none' : 'bg-white border-slate-200 text-slate-700 rounded-tl-none'}`}>
                    <p className="whitespace-pre-wrap uppercase tracking-tight">{msg.text}</p>
                  </div>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-1">
                       {msg.sources.map((s, idx) => (
                         <a key={idx} href={s.uri} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white border border-slate-200 text-[8px] font-black text-indigo-600 rounded-full hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1.5 uppercase shadow-sm">
                            <LinkIcon size={10}/> {s.title.slice(0, 20)}... <ExternalLink size={8}/>
                         </a>
                       ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-pulse ml-12">
                <div className="p-3 bg-white border border-slate-100 rounded-2xl flex items-center gap-3 shadow-md">
                  <Loader2 size={16} className="animate-spin text-indigo-600" />
                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Sincronia Neural...</span>
                </div>
            </div>
          )}
        </div>

        {/* SRE: Input Area Slim */}
        <div className="px-6 py-6 bg-white border-t border-slate-200 shrink-0">
          <form onSubmit={handleSend} className="relative flex items-center gap-3 max-w-4xl mx-auto">
            <input 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isLoading}
              className="w-full pl-6 pr-14 h-14 bg-slate-50 border border-slate-200 rounded-[1.5rem] text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase placeholder:text-slate-300 shadow-inner"
              placeholder="CONSULTAR MENTOR..."
            />
            <button 
              type="submit"
              disabled={isLoading || !input.trim()}
              className="absolute right-1.5 top-1.5 p-3 bg-slate-900 text-white rounded-xl hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-30 shadow-xl"
            >
              <Send size={18} />
            </button>
          </form>
          {/* Status Footer oculto em telas muito pequenas */}
          <div className="hidden sm:flex justify-center gap-6 mt-4 opacity-40">
             <div className="flex items-center gap-1.5"><ShieldCheck size={10} className="text-emerald-500"/><span className="text-[7px] font-black uppercase text-slate-500">SRE AUDIT</span></div>
             <div className="flex items-center gap-1.5"><RefreshCw size={10} className="text-indigo-500"/><span className="text-[7px] font-black uppercase text-slate-500">KERNEL SYNC</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;