
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Incident, SystemInfo } from '../types';
import { operationsService, authService, communicationService } from '../services/api';
import { 
    Plus, Loader2, ShieldAlert, X, Save, Edit2, Shield, Activity, MapPin, AlertCircle,
    Maximize2, Navigation, Trash2, ShieldCheck, Zap, Crosshair, User, AlertTriangle, MessageSquare, Search
} from 'lucide-react';
import * as L from 'leaflet';

interface OperationsProps {
    systemInfo: SystemInfo;
}

const Operations = ({ systemInfo }: OperationsProps) => {
    const [isLoading, setIsLoading] = useState(true);
    const [incidents, setIncidents] = useState([] as Incident[]);
    const [templates, setTemplates] = useState<any[]>([]); 
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingIncident, setEditingIncident] = useState<any>(null);
    const [currentUser, setCurrentUser] = useState<any>(null);

    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const circleRef = useRef<any>(null);
    const mapContainerRef = useRef<HTMLDivElement>(null);

    const [addressQuery, setAddressQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    useEffect(() => { loadData(); }, []);

    const loadData = async () => {
        try {
            setIsLoading(true);
            const [res, userRes, tplRes] = await Promise.all([
                operationsService.getIncidents(),
                authService.me(),
                communicationService.getTemplates()
            ]);
            setIncidents(res.data?.data || []);
            setCurrentUser(userRes.data);
            setTemplates(tplRes.data?.data || []);
        } catch (e) { setIncidents([]); }
        finally { setIsLoading(false); }
    };

    const initMap = useCallback(() => {
        if (!mapContainerRef.current || mapRef.current) return;
        
        const center = editingIncident?.coordinates || systemInfo.coordinates || { lat: -23.5505, lng: -46.6333 };
        
        mapRef.current = L.map(mapContainerRef.current, {
            center: [center.lat, center.lng],
            zoom: 15,
            maxZoom: 20,
            zoomControl: false,
            attributionControl: false
        });

        L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
            maxZoom: 20
        }).addTo(mapRef.current);

        markerRef.current = L.marker([center.lat, center.lng], {
            draggable: true,
            icon: L.divIcon({
                className: 'tactical-marker',
                html: `<div style="background-color: #f43f5e; width: 32px; height: 32px; border-radius: 50%; border: 4px solid white; box-shadow: 0 10px 25px rgba(0,0,0,0.5); display: flex; align-items: center; justify-content: center; color: white;"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg></div>`
            })
        }).addTo(mapRef.current);

        markerRef.current.on('drag', (e: any) => {
            const { lat, lng } = e.latlng;
            setEditingIncident((prev: any) => ({ ...prev, coordinates: { lat, lng } }));
            if (circleRef.current) circleRef.current.setLatLng(e.latlng);
        });

        mapRef.current.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
            markerRef.current.setLatLng(e.latlng);
            setEditingIncident((prev: any) => ({ ...prev, coordinates: { lat, lng } }));
            if (circleRef.current) circleRef.current.setLatLng(e.latlng);
        });

        updateRadius(editingIncident?.radius || 0);
    }, [systemInfo.coordinates, editingIncident]);

    useEffect(() => {
        if (isModalOpen) {
            setTimeout(initMap, 100);
        } else {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            setAddressQuery('');
        }
    }, [isModalOpen, initMap]);

    const updateRadius = (val: number) => {
        if (!mapRef.current || !markerRef.current) return;
        if (circleRef.current) mapRef.current.removeLayer(circleRef.current);
        
        if (val > 0) {
            circleRef.current = L.circle(markerRef.current.getLatLng(), {
                radius: val * 1000,
                color: '#f43f5e',
                fillColor: '#f43f5e',
                fillOpacity: 0.15,
                weight: 2
            }).addTo(mapRef.current);
            
            const bounds = circleRef.current.getBounds();
            mapRef.current.fitBounds(bounds, { padding: [50, 50] });
        }
    };

    const handleAddressSearch = async () => {
        if (!addressQuery) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(addressQuery)}&limit=1`, {
                headers: { 'User-Agent': 'SIE-PRO-System/1.0' }
            });
            const data = await res.json();
            if (data && data.length > 0) {
                const { lat, lon } = data[0];
                const newCoords = { lat: parseFloat(lat), lng: parseFloat(lon) };
                
                if (mapRef.current) {
                    mapRef.current.setView([newCoords.lat, newCoords.lng], 16);
                    if (markerRef.current) markerRef.current.setLatLng([newCoords.lat, newCoords.lng]);
                    setEditingIncident((prev: any) => ({ ...prev, coordinates: newCoords }));
                    if (editingIncident.radius) updateRadius(editingIncident.radius);
                }
            } else {
                alert("Endereço não localizado.");
            }
        } catch (e) {
            console.error("Search error", e);
            alert("Erro ao buscar endereço.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleSave = async (e: any) => {
        if (e) e.preventDefault();
        
        const isCritical = editingIncident.priority.includes('NÍVEL 3') || editingIncident.priority.includes('NÍVEL 4');
        if (isCritical && editingIncident.radius > 0) {
            if (!confirm("⚠️ ATENÇÃO SRE:\n\nEsta ocorrência está marcada como CRÍTICA e possui um RAIO DE AÇÃO definido.\n\nSalvar este registro disparará alertas automáticos para todos os moradores na zona de risco via WhatsApp.\n\nConfirmar disparo do protocolo Watchdog?")) {
                return;
            }
        }

        setIsSaving(true);
        try {
            const payload = { 
                ...editingIncident, 
                reporter_name: currentUser?.name || 'ADMIN-SYSTEM' 
            };
            let res;
            if (editingIncident.id) res = await operationsService.updateIncident(editingIncident.id, payload);
            else res = await operationsService.createIncident(payload);
            
            setIsModalOpen(false);
            loadData();

            if (res.data?.alert_triggered) {
                alert(`📡 WATCHDOG CONFIRMADO:\n\nO alerta foi enviado para ${res.data.affected_users} moradores na zona de risco.`);
            }

        } finally { setIsSaving(false); }
    };

    const priorities = [
        'INFORMATIVO (NÍVEL 1)',
        'ATENÇÃO (NÍVEL 2)',
        'ALTA (NÍVEL 3 - ALERTA LOCAL)',
        'CRÍTICA (NÍVEL 4 - PÂNICO EM RAIO)'
    ];

    const isAlertActive = editingIncident?.radius > 0 && (editingIncident?.priority?.includes('NÍVEL 3') || editingIncident?.priority?.includes('NÍVEL 4'));

    const primaryColor = systemInfo.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in bg-slate-50 gap-6 p-[var(--sie-viewport-padding)]">
            
            <div className="flex flex-row justify-between items-center bg-slate-900 p-8 rounded-[var(--sie-radius)] text-white shadow-xl shrink-0 overflow-hidden relative border border-white/5">
                <div className="absolute top-0 right-0 w-64 h-64 bg-rose-600/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                <div className="flex items-center gap-5 relative z-10">
                    <div className="p-4 bg-rose-600 rounded-2xl shadow-xl"><ShieldAlert size={24}/></div>
                    <div>
                        <h2 className="text-2xl font-black uppercase leading-none tracking-tighter">Ocorrências Watchdog</h2>
                        <p className="text-rose-400 text-[10px] font-black uppercase tracking-[0.3em] mt-2 opacity-80">Protocolo de Resiliência Operacional</p>
                    </div>
                </div>
                <button onClick={() => { setEditingIncident({ title: '', location: '', priority: priorities[0], status: 'OPEN', radius: 0, description: '', coordinates: systemInfo.coordinates }); setIsModalOpen(true); }} className="px-10 py-4 bg-rose-600 hover:bg-rose-50 text-white rounded-xl font-black text-[11px] uppercase tracking-widest shadow-2xl transition-all active:scale-95 flex items-center gap-3 sie-button">
                    <Plus size={18}/> Abrir Chamado SRE
                </button>
            </div>

            <div className="bg-white rounded-[3rem] shadow-sm border border-slate-200 flex-1 overflow-hidden flex flex-col relative">
                {isLoading ? <div className="p-20 text-center"><Loader2 className="animate-spin text-rose-600 mx-auto" size={40}/></div> : (
                    <div className="flex-1 overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left border-separate border-spacing-0">
                            <thead className="bg-white/90 backdrop-blur-md text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100 sticky top-0 z-10 shadow-sm">
                                <tr><th className="p-8 border-b">Assunto / Protocolo</th><th className="p-8 text-center border-b">Severidade Tática</th><th className="p-8 text-center border-b">Estado</th><th className="p-8 text-right border-b">Ações</th></tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {incidents.map(i => (
                                    <tr key={i.id} className="hover:bg-slate-50 transition-colors group">
                                        <td className="p-8">
                                            <div className="flex items-center gap-6">
                                                <div className={`p-4 rounded-2xl shadow-inner transition-colors ${i.priority.includes('NÍVEL 4') ? 'bg-rose-100 text-rose-600' : 'bg-slate-50 text-slate-300'}`}>
                                                    <ShieldAlert size={20}/>
                                                </div>
                                                <div>
                                                    <p className="text-base font-black text-slate-800 uppercase tracking-tight">{i.title}</p>
                                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1 flex items-center gap-2"><MapPin size={12}/> {i.location}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8 text-center">
                                            <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase border shadow-sm ${i.priority.includes('NÍVEL 4') || i.priority.includes('NÍVEL 3') ? 'bg-rose-50 text-rose-700 border-rose-100' : 'bg-amber-50 text-amber-700 border-amber-100'}`}>
                                                {i.priority}
                                            </span>
                                        </td>
                                        <td className="p-8 text-center"><span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-4 py-1.5 rounded-xl border border-indigo-100 uppercase tracking-widest" style={{ color: primaryColor, borderColor: primaryColor + '40' }}>{i.status}</span></td>
                                        <td className="p-8 text-right"><button onClick={() => { setEditingIncident(i); setIsModalOpen(true); }} className="p-4 text-slate-300 hover:text-indigo-600 hover:bg-white hover:shadow-xl rounded-2xl transition-all border border-transparent hover:border-indigo-100"><Edit2 size={18}/></button></td>
                                    </tr>
                                ))}
                                {incidents.length === 0 && (
                                    <tr><td colSpan={4} className="p-40 text-center text-slate-300 font-black uppercase text-xs tracking-widest italic">Nenhuma ocorrência em aberto.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {isModalOpen && editingIncident && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-[90vh] !max-w-[1200px] self-center">
                        <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 shadow-2xl relative z-20 border-b border-white/5 rounded-t-[var(--sie-radius)]">
                            <div className="flex items-center gap-5">
                                <div className="p-3.5 bg-rose-600 rounded-xl shadow-xl"><Shield size={22}/></div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Protocolo de Ocorrência</h3>
                                    <p className="text-rose-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">SRE Watchdog Module V5.0</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <button onClick={() => setIsModalOpen(false)} className="px-8 py-3.5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-white transition-colors">Cancelar</button>
                                <button onClick={handleSave} disabled={isSaving} className="px-10 py-3.5 bg-rose-600 hover:bg-rose-50 text-white rounded-xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl active:scale-95 shadow-rose-900/40 sie-button">
                                    {isSaving ? <Loader2 className="animate-spin" size={16}/> : <ShieldCheck size={16}/>} Commitar Chamado
                                </button>
                                <button onClick={() => setIsModalOpen(false)} className="p-3.5 hover:bg-rose-500 hover:text-white text-slate-400 rounded-xl transition-all border border-white/5 ml-4"><X size={24}/></button>
                            </div>
                        </div>

                        <div className="flex-1 flex overflow-hidden bg-[#f8fafc] rounded-b-[var(--sie-radius)]">
                            <div className="w-1/2 overflow-y-auto p-12 custom-scrollbar space-y-10 border-r border-slate-200">
                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">O que está ocorrendo?</label>
                                    <input required className="w-full font-black h-16 bg-white border border-slate-200 rounded-2xl px-8 text-xl focus:border-rose-500 transition-all shadow-sm outline-none placeholder:text-slate-300 sie-input" placeholder="EX: VAZAMENTO REDE MESTRE" value={editingIncident.title} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditingIncident({...editingIncident, title: e.target.value.toUpperCase()})} />
                                </div>

                                <div className="grid grid-cols-1 gap-8">
                                    <div className="space-y-4">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Severidade</label>
                                        <select className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 text-xs uppercase appearance-none outline-none focus:border-rose-500 shadow-sm sie-input" value={editingIncident.priority} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingIncident({...editingIncident, priority: e.target.value as any})}>
                                            {priorities.map(p => <option key={p} value={p}>{p}</option>)}
                                        </select>
                                    </div>
                                    
                                    {isAlertActive && (
                                        <div className="bg-rose-50 border-l-4 border-rose-500 p-6 rounded-r-xl animate-fade-in shadow-sm space-y-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <AlertTriangle size={18} className="text-rose-600 animate-pulse"/>
                                                <h4 className="text-xs font-black text-rose-700 uppercase tracking-widest">Protocolo de Pânico Ativo</h4>
                                            </div>
                                            <p className="text-[10px] font-medium text-rose-800 uppercase leading-relaxed">
                                                Ao salvar, um alerta será disparado para moradores no raio de {editingIncident.radius}km.
                                            </p>
                                            
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-rose-600 uppercase tracking-widest flex items-center gap-2">
                                                    <MessageSquare size={12}/> Selecione o Template de Envio
                                                </label>
                                                <select 
                                                    className="w-full h-12 bg-white border border-rose-200 rounded-xl px-4 text-[10px] font-black uppercase text-rose-700 outline-none focus:border-rose-500 shadow-sm"
                                                    value={editingIncident.whatsapp_template_id || ''}
                                                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setEditingIncident({...editingIncident, whatsapp_template_id: e.target.value})}
                                                >
                                                    <option value="">USAR MENSAGEM PADRÃO DO SISTEMA</option>
                                                    {templates.map(t => (
                                                        <option key={t.id} value={t.id}>{t.name} (Disparo Automático)</option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center px-1">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">Raio de Notificação (KM)</label>
                                            <span className="text-xl font-black text-rose-600">{editingIncident.radius} KM</span>
                                        </div>
                                        <input type="range" min="0" max="10" step="0.5" className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-rose-600" value={editingIncident.radius || 0} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            const val = parseFloat(e.target.value);
                                            setEditingIncident({...editingIncident, radius: val});
                                            updateRadius(val);
                                        }} />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">Descrição Detalhada</label>
                                    <textarea rows={4} className="w-full font-medium bg-white border border-slate-200 rounded-[2rem] p-8 text-sm focus:border-rose-500 transition-all shadow-sm outline-none uppercase leading-relaxed placeholder:text-slate-300" placeholder="DESCREVA OS DETALHES PARA A CENTRAL OPERACIONAL..." value={editingIncident.description} onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingIncident({...editingIncident, description: e.target.value.toUpperCase()})} />
                                </div>

                                <div className="p-8 bg-slate-50 border border-slate-200 rounded-[2.5rem] flex items-center justify-between">
                                     <div className="flex items-center gap-4">
                                         <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center text-slate-300 shadow-sm border border-slate-100"><User size={20}/></div>
                                         <div>
                                             <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Relator Protocolado</p>
                                             <p className="text-sm font-black text-indigo-600 uppercase tracking-tight">{currentUser?.name || 'GERMINAL - ADMIN'} •</p>
                                         </div>
                                     </div>
                                </div>
                            </div>

                            <div className="w-1/2 relative bg-slate-200">
                                <div ref={mapContainerRef} className="absolute inset-0 z-10 grayscale-[0.5] hover:grayscale-0 transition-all duration-700" />
                                <div className="absolute top-6 left-6 right-6 z-20 flex gap-2">
                                    <div className="relative flex-1">
                                         <input 
                                            className="w-full h-12 pl-12 pr-4 bg-white/90 backdrop-blur-md rounded-2xl text-xs font-bold shadow-xl border border-white/20 outline-none uppercase text-slate-700 focus:bg-white transition-all sie-input" 
                                            placeholder="BUSCAR ENDEREÇO..." 
                                            value={addressQuery}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setAddressQuery(e.target.value)}
                                            onKeyDown={e => e.key === 'Enter' && handleAddressSearch()}
                                        />
                                        <Search size={16} className="absolute left-4 top-4 text-slate-400"/>
                                    </div>
                                    <button onClick={handleAddressSearch} disabled={isSearching} className="h-12 w-12 bg-indigo-600 text-white rounded-2xl shadow-xl flex items-center justify-center hover:bg-indigo-50 transition-all active:scale-95 sie-button">
                                        {isSearching ? <Loader2 size={18} className="animate-spin"/> : <Search size={18}/>}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Operations;
