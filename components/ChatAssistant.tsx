
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
    Send, Brain, User, Loader2, Sparkles, ShieldCheck, Zap, 
    Trash2, Link as LinkIcon, ExternalLink, RefreshCw, Search, 
    X, Mic, MicOff, Volume2, Activity
} from 'lucide-react';
import { aiService } from '../services/api';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

interface Message {
  id: string;
  text: string;
  sender: 'AI' | 'USER';
  timestamp: Date;
  sources?: { title: string; uri: string }[];
}

// SRE AUDIO ENGINE UTILS
function decode(base64: string) {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
}

async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

    for (let channel = 0; channel < numChannels; channel++) {
        const channelData = buffer.getChannelData(channel);
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
        }
    }
    return buffer;
}

function encode(bytes: Uint8Array) {
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

function createBlob(data: Float32Array) {
    const l = data.length;
    const int16 = new Int16Array(l);
    for (let i = 0; i < l; i++) {
        int16[i] = data[i] * 32768;
    }
    return {
        data: encode(new Uint8Array(int16.buffer)),
        mimeType: 'audio/pcm;rate=16000',
    };
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
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [audioAmplitude, setAudioAmplitude] = useState<number[]>(new Array(8).fill(20));
  const scrollRef = useRef<HTMLDivElement>(null);

  // Live API Session Refs
  const liveSessionRef = useRef<any>(null);
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const liveSourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  const nextStartTimeRef = useRef(0);

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

  const stopLiveSession = useCallback(() => {
    if (liveSessionRef.current) {
        liveSessionRef.current.close();
        liveSessionRef.current = null;
    }
    if (audioContextRef.current) {
        audioContextRef.current.input.close();
        audioContextRef.current.output.close();
        audioContextRef.current = null;
    }
    liveSourcesRef.current.forEach(s => {
        try { s.stop(); } catch(e) {}
    });
    liveSourcesRef.current.clear();
    setIsLiveActive(false);
    setAudioAmplitude(new Array(8).fill(20));
  }, []);

  const startLiveSession = async () => {
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        
        const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
        const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
        audioContextRef.current = { input: inputCtx, output: outputCtx };

        const sessionPromise = ai.live.connect({
            model: 'gemini-2.5-flash-native-audio-preview-12-2025',
            callbacks: {
                onopen: () => {
                    const source = inputCtx.createMediaStreamSource(stream);
                    const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
                    scriptProcessor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcmBlob = createBlob(inputData);
                        
                        // Dinamiza visualização com amplitude real do microfone
                        const maxVal = Math.max(...inputData.map(Math.abs));
                        setAudioAmplitude(prev => prev.map(() => 15 + (maxVal * 40)));

                        sessionPromise.then(session => {
                            session.sendRealtimeInput({ media: pcmBlob });
                        });
                    };
                    source.connect(scriptProcessor);
                    scriptProcessor.connect(inputCtx.destination);
                    setIsLiveActive(true);
                },
                onmessage: async (message: LiveServerMessage) => {
                    const audioData = message.serverContent?.modelTurn?.parts[0]?.inlineData.data;
                    if (audioData) {
                        nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outputCtx.currentTime);
                        const audioBuffer = await decodeAudioData(decode(audioData), outputCtx, 24000, 1);
                        const source = outputCtx.createBufferSource();
                        source.buffer = audioBuffer;
                        source.connect(outputCtx.destination);
                        source.onended = () => liveSourcesRef.current.delete(source);
                        source.start(nextStartTimeRef.current);
                        nextStartTimeRef.current += audioBuffer.duration;
                        liveSourcesRef.current.add(source);
                    }
                    
                    if (message.serverContent?.interrupted) {
                        liveSourcesRef.current.forEach(s => { try { s.stop(); } catch(e) {} });
                        liveSourcesRef.current.clear();
                        nextStartTimeRef.current = 0;
                    }
                },
                onerror: (e) => {
                    console.error("[SRE VOICE ERROR]", e);
                    stopLiveSession();
                },
                onclose: () => stopLiveSession()
            },
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } }
                },
                systemInstruction: "Você é o Mentor Neural do S.I.E PRO. Auxilie o administrador em tarefas de gestão via voz. Seja conciso, técnico e direto."
            }
        });

        liveSessionRef.current = await sessionPromise;
    } catch (e) {
        console.error("Live session failed:", e);
        alert("Acesso ao microfone negado ou erro crítico na API de Voz.");
    }
  };

  const primaryColor = systemInfo?.primaryColor || '#4f46e5';

  return (
    <div className="flex-1 flex flex-col h-full animate-fade-in gap-6 p-[var(--sie-viewport-padding)]">
      
      {/* HEADER MASTER FLUTUANTE */}
      <div className="bg-slate-900 px-8 py-6 rounded-[var(--sie-radius)] flex flex-col sm:flex-row justify-between items-center shrink-0 shadow-xl relative overflow-hidden border border-white/5 gap-6">
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
        <div className="flex items-center gap-5 relative z-10 w-full sm:w-auto">
          <div className="p-3.5 bg-indigo-600 text-white rounded-xl shadow-2xl animate-pulse shrink-0" style={{ backgroundColor: primaryColor }}>
            <Brain size={24} />
          </div>
          <div>
            <h2 className="text-white font-black text-xl uppercase tracking-tight leading-none">Advisor Mentor</h2>
            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mt-1.5 opacity-80">SRE Active Support Bridge</p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative z-10 w-full sm:w-auto justify-end">
            <button 
                onClick={() => isLiveActive ? stopLiveSession() : startLiveSession()} 
                className={`px-6 py-2.5 rounded-xl transition-all flex items-center gap-3 font-black text-[9px] uppercase tracking-widest ${isLiveActive ? 'bg-rose-600 text-white shadow-rose-500/20' : 'bg-emerald-600 text-white shadow-emerald-500/20'} shadow-lg active:scale-95`}
            >
                {isLiveActive ? <MicOff size={16}/> : <Mic size={16}/>}
                <span>{isLiveActive ? 'Encerrar Voz' : 'Conectar Via Voz'}</span>
            </button>
            <div className="w-px h-6 bg-white/10 hidden sm:block"></div>
            <button onClick={() => setUseGrounding(!useGrounding)} className={`px-4 py-2.5 rounded-xl transition-all flex items-center gap-2 font-black text-[9px] uppercase tracking-widest ${useGrounding ? 'bg-indigo-600 text-white border border-indigo-500 shadow-lg' : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'}`}>
                <Search size={14} /> <span className="hidden sm:inline">{useGrounding ? 'Grounding On' : 'Grounding Off'}</span>
            </button>
            <button onClick={() => setMessages([messages[0]])} className="p-3 bg-white/5 hover:bg-rose-50 text-slate-400 hover:text-white rounded-xl transition-all border border-white/5">
                <Trash2 size={16} />
            </button>
        </div>
      </div>

      {/* CONTENT ISLAND */}
      <div className="flex-1 bg-white rounded-[3rem] border border-slate-200 shadow-sm overflow-hidden flex flex-col relative">
        <div className="absolute inset-0 opacity-[0.02] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#4f46e5 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
        
        {isLiveActive && (
            <div className="bg-slate-900 p-8 flex flex-col items-center justify-center gap-4 animate-slide-down relative overflow-hidden shrink-0">
                <div className="absolute inset-0 opacity-10 flex items-center justify-center">
                    <Activity size={300} className="text-emerald-500 animate-pulse"/>
                </div>
                <div className="relative z-10 flex flex-col items-center gap-2">
                    <div className="flex items-center gap-1.5 h-12">
                        {audioAmplitude.map((amp, i) => (
                            <div key={i} className="w-1 bg-emerald-500 rounded-full transition-all duration-75" style={{ height: `${amp}px` }}></div>
                        ))}
                    </div>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">Canal Vocal Ativo</span>
                </div>
            </div>
        )}

        <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 md:p-12 space-y-10 custom-scrollbar relative z-10">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === 'USER' ? 'justify-end' : 'justify-start'} animate-scale-in`}>
              <div className={`max-w-[90%] md:max-w-[75%] flex gap-4 ${msg.sender === 'USER' ? 'flex-row-reverse' : 'flex-row'}`}>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-md border ${msg.sender === 'USER' ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-slate-900 text-indigo-400 border-white/10'}`} style={msg.sender === 'USER' ? { backgroundColor: primaryColor, borderColor: primaryColor } : {}}>
                  {msg.sender === 'USER' ? <User size={18}/> : <Sparkles size={18}/>}
                </div>
                <div className="space-y-4 flex-1">
                  <div className={`p-6 md:p-8 rounded-[2rem] text-sm font-medium leading-relaxed shadow-sm border ${msg.sender === 'USER' ? 'bg-indigo-50 text-indigo-900 border-indigo-100 rounded-tr-none' : 'bg-slate-50 border-slate-100 text-slate-700 rounded-tl-none'}`}>
                    <p className="whitespace-pre-wrap uppercase tracking-tight">{msg.text}</p>
                  </div>
                  
                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 px-2">
                       {msg.sources.map((s, idx) => (
                         <a key={idx} href={s.uri} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-white border border-slate-200 text-[8px] font-black text-indigo-600 rounded-lg hover:bg-indigo-50 hover:border-indigo-200 transition-all flex items-center gap-2 uppercase shadow-sm">
                            <LinkIcon size={10}/> {s.title.slice(0, 25)}... <ExternalLink size={8}/>
                         </a>
                       ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex justify-start animate-pulse ml-14">
                <div className="px-6 py-4 bg-slate-50 border border-slate-100 rounded-[2rem] rounded-tl-none flex items-center gap-3 shadow-sm">
                  <Loader2 size={18} className="animate-spin text-indigo-600" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Processando Neuralmente...</span>
                </div>
            </div>
          )}
        </div>

        {/* INPUT AREA */}
        <div className="p-8 bg-white border-t border-slate-100 shrink-0 relative z-20">
          <form onSubmit={handleSend} className="relative flex items-center gap-4 max-w-4xl mx-auto">
            <div className="relative flex-1">
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300">
                    <Sparkles size={20}/>
                </div>
                <input 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  disabled={isLoading || isLiveActive}
                  className="w-full pl-14 pr-6 h-16 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm font-bold outline-none focus:bg-white focus:border-indigo-500 transition-all uppercase placeholder:text-slate-300 shadow-inner disabled:opacity-50"
                  placeholder={isLiveActive ? "A ESCUTA VOCAL ESTÁ ATIVA..." : "DIGITE SUA CONSULTA OU USE A VOZ..."}
                />
            </div>
            <button 
              type="submit"
              disabled={isLoading || !input.trim() || isLiveActive}
              className="h-16 w-16 bg-slate-900 text-white rounded-[2rem] hover:bg-indigo-600 active:scale-95 transition-all disabled:opacity-30 shadow-xl flex items-center justify-center"
              style={{ backgroundColor: input.trim() && !isLiveActive ? primaryColor : undefined }}
            >
              <Send size={24} className={input.trim() ? 'translate-x-0.5' : ''} />
            </button>
          </form>
          <div className="flex justify-center gap-8 mt-6 opacity-40">
             <div className="flex items-center gap-2"><ShieldCheck size={12} className="text-emerald-500"/><span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">SRE AUDIT ACTIVE</span></div>
             <div className="flex items-center gap-2"><RefreshCw size={12} className="text-indigo-500"/><span className="text-[8px] font-black uppercase text-slate-400 tracking-widest">KERNEL SYNC OK</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatAssistant;
