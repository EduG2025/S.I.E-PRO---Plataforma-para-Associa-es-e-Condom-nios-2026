
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { SystemInfo, WhatsAppConfig, AIKey, DualDesignSystem, FinancialRecord } from '../types';
import { systemService, aiKeyService, aiService, api, planService } from '../services/api';
import { SYSTEM_PERMISSIONS, MENU_ITEMS } from '../constants';
import {
    Settings as SettingsIcon, Building, X, Plus, Trash2, Loader2, Save,
    MessageCircle, ShieldCheck, Image as ImageIcon, Layout, Shield,
    Upload, Globe, MapPin, Monitor, ShieldAlert, Variable, Edit3, CheckCircle2,
    Brain, Cpu, Key, Radio, Zap, ExternalLink, Smartphone, Lock, History, Layers,
    Wallet, Calendar, Bell, ToggleRight, ToggleLeft, Palette, Type, UserCheck, FileSignature,
    Gift, ReceiptText, Crosshair, Server, Database, MessageSquare, Workflow, Camera, Code, RotateCcw,
    Activity, Eye, EyeOff, ClipboardList, PenTool, Globe2, Sparkles, LayoutGrid, LocateFixed, BookOpen,
    Navigation, AlertTriangle, Info, MapPin as PinIcon, RefreshCw, Activity as PulseIcon,
    CreditCard, ArrowRight, Search, Satellite, Map as MapIcon2, PauseCircle, PlayCircle, FileCode,
    Wand2
} from 'lucide-react';
import StudioLab from './StudioLab';
import WikiHub from './WikiHub';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// --- COMPONENTE AUXILIARES (LEAFLET MAP) ---
const MapContainerAny = MapContainer as any;
const TileLayerAny = TileLayer as any;
const MarkerAny = Marker as any;

const MapEvents = ({ onLocationSelect, setPosition }: { onLocationSelect: (latlng: any) => void, setPosition: (pos: any) => void }) => {
    const map = useMapEvents({
        click(e: any) {
            onLocationSelect(e.latlng);
        }
    });
    useEffect(() => { }, [map]);
    return null;
};

const MapModal = ({ initialCoords, onClose, onSave }: any) => {
    const [position, setPosition] = useState(initialCoords || { lat: -23.5505, lng: -46.6333 });
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [mapStyle, setMapStyle] = useState<'STREET' | 'SATELLITE'>('STREET');

    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);

    const handleSearch = async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=5`);
            const data = await res.json();
            setSearchResults(data);
        } catch (e) {
            alert("Erro ao buscar endereço.");
        } finally {
            setIsSearching(false);
        }
    };

    const selectLocation = (lat: number, lon: number) => {
        const newPos = { lat, lng: lon };
        setPosition(newPos);
        setSearchResults([]);
        if (mapRef.current) {
            mapRef.current.flyTo([lat, lon], 18, { duration: 1.5 });
        }
    };

    const updatePosition = (latlng: { lat: number, lng: number }) => {
        setPosition(latlng);
    };

    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker) {
                    updatePosition(marker.getLatLng());
                }
            },
        }),
        [],
    );

    return (
        <div className="fixed inset-0 bg-slate-950/90 z-[9999] flex items-center justify-center p-6 backdrop-blur-xl animate-fade-in">
            <div className="bg-white rounded-[3rem] shadow-[0_0_100px_rgba(0,0,0,0.5)] w-full max-w-5xl h-[85vh] flex flex-col relative overflow-hidden animate-scale-in border border-white/10">
                <div className="h-24 px-10 border-b bg-slate-900 text-white flex justify-between items-center shrink-0 relative z-20">
                    <div className="flex items-center gap-6">
                        <div className="p-4 bg-rose-600 rounded-2xl shadow-xl animate-pulse"><PinIcon size={28} /></div>
                        <div>
                            <h4 className="text-2xl font-black uppercase tracking-tightest">Epicentro Tático HQ</h4>
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest mt-1">Defina a geolocalização exata da sede</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-rose-500 rounded-2xl transition-all text-slate-400 hover:text-white"><X size={32} /></button>
                </div>

                <div className="flex-1 relative z-0 overflow-hidden bg-slate-100">
                    {/* BARRA DE PESQUISA FLUTUANTE */}
                    <div className="absolute top-6 left-6 z-[1000] w-full max-w-md">
                        <div className="relative group">
                            <div className="absolute inset-0 bg-white/80 rounded-2xl blur-lg shadow-xl opacity-0 group-hover:opacity-100 transition-all"></div>
                            <div className="relative flex bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-200">
                                <input
                                    type="text"
                                    className="flex-1 pl-6 pr-4 py-4 text-xs font-black uppercase outline-none text-slate-700 placeholder:text-slate-300"
                                    placeholder="PESQUISAR ENDEREÇO OU COORDENADA..."
                                    value={searchQuery}
                                    onChange={e => setSearchQuery(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && handleSearch()}
                                />
                                <button
                                    onClick={handleSearch}
                                    disabled={isSearching}
                                    className="px-6 bg-slate-900 text-white hover:bg-indigo-600 transition-colors"
                                >
                                    {isSearching ? <Loader2 size={18} className="animate-spin" /> : <Search size={18} />}
                                </button>
                            </div>
                        </div>

                        {searchResults.length > 0 && (
                            <div className="mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-slide-down max-h-60 overflow-y-auto custom-scrollbar">
                                {searchResults.map((res: any, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => selectLocation(parseFloat(res.lat), parseFloat(res.lon))}
                                        className="w-full text-left p-4 hover:bg-indigo-50 border-b border-slate-100 last:border-0 transition-colors group"
                                    >
                                        <p className="text-[10px] font-black uppercase text-slate-700 group-hover:text-indigo-700 line-clamp-1">{res.display_name.split(',')[0]}</p>
                                        <p className="text-[9px] text-slate-400 mt-1 truncate">{res.display_name}</p>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* CONTROLE DE CAMADAS */}
                    <div className="absolute top-6 right-6 z-[1000] flex bg-white/90 backdrop-blur rounded-2xl p-1 shadow-2xl border border-slate-200">
                        <button
                            onClick={() => setMapStyle('STREET')}
                            className={`p-3 rounded-xl transition-all ${mapStyle === 'STREET' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}
                            title="Mapa de Rua"
                        >
                            <MapIcon2 size={18} />
                        </button>
                        <button
                            onClick={() => setMapStyle('SATELLITE')}
                            className={`p-3 rounded-xl transition-all ${mapStyle === 'SATELLITE' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-indigo-600'}`}
                            title="Satélite"
                        >
                            <Satellite size={18} />
                        </button>
                    </div>

                    <MapContainerAny
                        center={[position.lat, position.lng]}
                        zoom={16}
                        style={{ height: '100%', width: '100%' }}
                        zoomControl={false}
                        ref={mapRef}
                    >
                        <TileLayerAny
                            url={mapStyle === 'STREET'
                                ? "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                                : "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
                            }
                            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        />
                        <MarkerAny
                            position={[position.lat, position.lng]}
                            draggable={true}
                            eventHandlers={eventHandlers}
                            ref={markerRef}
                        />
                        <MapEvents onLocationSelect={(latlng: any) => updatePosition(latlng)} setPosition={setPosition} />
                    </MapContainerAny>

                    <div className="absolute bottom-6 right-6 z-[1000] bg-slate-900/90 backdrop-blur-md p-6 rounded-[2rem] border border-white/10 text-white shadow-2xl space-y-4">
                        <div className="flex items-center gap-3 border-b border-white/5 pb-3">
                            <Crosshair size={18} className="text-rose-500 animate-pulse" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Coordenadas Atuais</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Latitude</p>
                            <p className="text-sm font-mono font-black text-white">{position.lat.toFixed(6)}</p>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Longitude</p>
                            <p className="text-sm font-mono font-black text-white">{position.lng.toFixed(6)}</p>
                        </div>
                    </div>
                </div>

                <div className="h-24 px-10 border-t bg-slate-50 flex justify-between items-center shrink-0 relative z-20">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none italic">
                            Arraste o marcador ou use a busca para precisão cirúrgica.
                        </span>
                    </div>
                    <button onClick={() => onSave(position)} className="px-12 py-5 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-emerald-600 transition-all active:scale-95 flex items-center gap-2">
                        <Save size={16} /> Salvar Georreferenciamento
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- CONSTANTES & UTILS ---
const formatCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d{3})/, '$1-$2').substring(0, 9);

const SYSTEM_TEXTS = {
    LBL_CEP: "CEP",
    LBL_STREET: "Rua / Logradouro",
    LBL_NUMBER: "Número",
    LBL_COMPLEMENT: "Complemento",
    LBL_NEIGHBORHOOD: "Bairro",
    LBL_CITY_STATE: "Cidade / UF",
    LBL_CITY: "Cidade",
    LBL_STATE: "Estado (UF)",
    PLACEHOLDER_CEP: "00000-000",
    PLACEHOLDER_NUMBER: "S/N",
    PLACEHOLDER_COMPLEMENT: "APTO 101, FUNDOS...",
    ALERT_CEP_FAIL: "PROTOCOLO POSTAL: CEP não localizado.",
    ALERT_NETWORK_FAIL: "FALHA DE REDE: Serviço postal indisponível.",
    TITLE_HEADQUARTERS_ADDRESS: "Localização da Sede (Endereço Atômico)",
    GPS_BTN: "Obter Localização Satelital",
    GPS_SUCCESS: "Sinal GPS Sincronizado.",
    GPS_ERROR: "Falha ao obter sinal. Verifique as permissões de localização.",
};

interface SettingsProps {
    systemInfo: SystemInfo;
    onUpdateSystemInfo: (info: SystemInfo) => void;
    designSystem: DualDesignSystem;
    setDesignSystem: React.Dispatch<React.SetStateAction<DualDesignSystem | null>>;
    currentUser: any;
}

// --- COMPONENTE PRINCIPAL ---
const Settings = ({ systemInfo, onUpdateSystemInfo, designSystem, setDesignSystem, currentUser }: SettingsProps) => {
    // -- TABS & NAVIGATION --
    const [activeTab, setActiveTab] = useState<'INFO' | 'AI_PROVIDERS' | 'AI_PROMPTS' | 'SUBSCRIPTIONS' | 'PERMISSIONS' | 'WIKI'>('INFO');

    // -- STATES (CORE) --
    const [isSaving, setIsSaving] = useState(false);
    const [localInfo, setLocalInfo] = useState<SystemInfo>(systemInfo || {} as SystemInfo);
    const [isLoadingData, setIsLoadingData] = useState(false);
    const [isSearchingCEP, setIsSearchingCEP] = useState(false);
    const [isLocatingGPS, setIsLocatingGPS] = useState(false);

    // -- STATES (BATCH TOOLS) --
    const [isBatchRunning, setIsBatchRunning] = useState(false);

    // -- STATES (MODALS & FEATURES) --
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    // -- STATES (AI POOL) --
    const [aiKeys, setAiKeys] = useState<AIKey[]>([]);
    const [isAiKeyModalOpen, setIsAiKeyModalOpen] = useState(false);
    const [editingAiKey, setEditingAiKey] = useState<Partial<AIKey> | null>(null);
    const [showKeyContent, setShowKeyContent] = useState<Record<string | number, boolean>>({});

    // -- STATES (PROMPTS LIBRARY) --
    const [prompts, setPrompts] = useState<any[]>([]);
    const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
    const [editingPrompt, setEditingPrompt] = useState<any>(null);

    // -- STATES (PLANS) --
    const [plans, setPlans] = useState<any[]>([]);
    const [editingPlan, setEditingPlan] = useState<any>(null);
    const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);

    // -- STATES (RBAC) --
    const [roles, setRoles] = useState<any[]>([]);
    const [permissions, setPermissions] = useState<any[]>([]);
    const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
    const [editingRole, setEditingRole] = useState<any>(null);

    const [waConfig, setWaConfig] = useState<WhatsAppConfig>(systemInfo?.whatsapp_config || {
        api_key: '',
        sender: '',
        footer: 'S.I.E PRO',
        gateway_url: 'https://jennyai.space/send-message',
        webhook_url: '',
        billing_reminder_2d: true,
        billing_reminder_1d: true,
        late_reminder: true,
        welcome_msg: true,
        chatbot_enabled: true,
        chatbot_rag_wiki: true,
        chatbot_rag_rbac: true
    });

    const [metadata, setMetadata] = useState<any>((systemInfo as any)?.module_metadata || {});

    // -- EFFECTS --

    // SRE CORE: Hydrate Settings with FULL DATA (Authenticated Fetch)
    useEffect(() => {
        const loadFullSettings = async () => {
            try {
                const res = await systemService.getInfo();
                if (res.data) {
                    setLocalInfo(prev => ({ ...prev, ...res.data }));
                    if (res.data.whatsapp_config) setWaConfig(res.data.whatsapp_config);
                    if (res.data.module_metadata) setMetadata(res.data.module_metadata);
                }
            } catch (e) {
                console.error("[SRE] Full settings hydration failed:", e);
                setLocalInfo(systemInfo);
            }
        };
        loadFullSettings();
    }, []);

    // Handlers de Carregamento
    const loadAiKeys = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const res = await aiKeyService.getAll();
            setAiKeys(res.data.data || []);
        } catch (e) { console.error("Neural Pool Offline"); }
        finally { setIsLoadingData(false); }
    }, []);

    const loadPrompts = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const res = await aiService.listPrompts();
            setPrompts(res.data.data || []);
        } catch (e) { console.error("Prompts Library Offline"); }
        finally { setIsLoadingData(false); }
    }, []);

    const loadPlans = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const res = await planService.getAll();
            setPlans(res.data.data || []);
        } finally { setIsLoadingData(false); }
    }, []);

    const loadRBAC = useCallback(async () => {
        setIsLoadingData(true);
        try {
            const [rolesRes, permsRes] = await Promise.all([
                systemService.getRoles(),
                systemService.getPermissions()
            ]);
            setRoles(rolesRes.data.data || []);
            setPermissions(permsRes.data.data || []);
        } finally { setIsLoadingData(false); }
    }, []);

    useEffect(() => {
        if (activeTab === 'PERMISSIONS') loadRBAC();
        if (activeTab === 'AI_PROVIDERS') loadAiKeys();
        if (activeTab === 'AI_PROMPTS') loadPrompts();
        if (activeTab === 'SUBSCRIPTIONS') loadPlans();
    }, [activeTab, loadRBAC, loadAiKeys, loadPrompts, loadPlans]);

    // -- LOGIC HANDLERS --

    const handleBatchGeocode = async () => {
        if (!confirm("Esta ação irá processar em segundo plano as coordenadas para todos os membros com endereço cadastrado, mas sem geolocalização. Isso pode levar alguns minutos. Continuar?")) return;
        setIsBatchRunning(true);
        try {
            const res = await api.post('/users/batch-geocode');
            alert(`✅ ${res.data.message}`);
        } catch (e) {
            alert("Erro ao iniciar processo de geolocalização em massa.");
        } finally {
            setIsBatchRunning(false);
        }
    };

    const handleToggleLicense = async (status: 'ACTIVE' | 'SUSPENDED') => {
        if (!confirm(`TEM CERTEZA? Isso irá ${status === 'SUSPENDED' ? 'BLOQUEAR' : 'DESBLOQUEAR'} o acesso de todos os usuários.`)) return;
        try {
            await api.post('/settings/toggle-license', { status });
            alert(`Licença atualizada para: ${status}. O sistema será recarregado.`);
            window.location.reload();
        } catch (e) {
            alert("Falha ao atualizar licença.");
        }
    };

    const handleGetGPSLocation = () => {
        if (!navigator.geolocation) {
            alert("SRE_ALERT: Navegador sem suporte a Geolocalização.");
            return;
        }
        setIsLocatingGPS(true);
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                setLocalInfo(prev => ({
                    ...prev,
                    coordinates: { lat: latitude, lng: longitude }
                }));
                setIsLocatingGPS(false);
                alert(`${SYSTEM_TEXTS.GPS_SUCCESS}\nLAT: ${latitude.toFixed(6)}\nLNG: ${longitude.toFixed(6)}`);
            },
            (error) => {
                console.error("GPS_FAULT:", error);
                setIsLocatingGPS(false);
                alert(SYSTEM_TEXTS.GPS_ERROR);
            },
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
    };

    const handleCEPBlur = async () => {
        const cep = localInfo.cep?.replace(/\D/g, '') || '';
        if (cep.length !== 8) return;
        setIsSearchingCEP(true);
        try {
            const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
            const data = await res.json();
            if (!data.erro) {
                setLocalInfo(p => ({
                    ...p,
                    street: data.logradouro,
                    neighborhood: data.bairro,
                    city: data.localidade,
                    state: data.uf
                }));
            } else {
                alert(SYSTEM_TEXTS.ALERT_CEP_FAIL);
            }
        } catch (e) {
            alert(SYSTEM_TEXTS.ALERT_NETWORK_FAIL);
        }
        finally {
            setIsSearchingCEP(false);
        }
    };

    const handleSaveInfo = async () => {
        setIsSaving(true);
        try {
            const payload = {
                ...localInfo,
                whatsapp_config: waConfig,
                module_metadata: metadata
            };
            await systemService.updateInfo(payload);
            onUpdateSystemInfo(payload);
            alert("✅ SRE: Kernel Master Sincronizado com Sucesso.");
        } catch (e) { alert("Erro crítico de sincronia no cluster."); }
        finally { setIsSaving(false); }
    };

    const handleSavePlan = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        setIsSaving(true);
        try {
            if (editingPlan.id) await planService.update(editingPlan.id, editingPlan);
            else await planService.create(editingPlan);
            setIsPlanModalOpen(false);
            loadPlans();
        } finally { setIsSaving(false); }
    };

    const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLocalInfo({ ...localInfo, logoUrl: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

    const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setLocalInfo({ ...localInfo, president_signature: reader.result as string });
            reader.readAsDataURL(file);
        }
    };

    const handleSaveRole = async () => {
        if (!editingRole.id || !editingRole.label) return;
        setIsSaving(true);
        try {
            const exists = roles.find(r => r.id === editingRole.id);
            if (exists) await systemService.updateRole(editingRole.id, editingRole);
            else await systemService.saveRole(editingRole);
            setIsRoleModalOpen(false);
            loadRBAC();
        } finally { setIsSaving(false); }
    };

    const handleSaveAiKey = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!editingAiKey || !editingAiKey.label || !editingAiKey.key_value) return;
        setIsSaving(true);
        try {
            if (editingAiKey.id) {
                await aiKeyService.update(editingAiKey.id, editingAiKey);
            } else {
                await aiKeyService.create(editingAiKey);
            }
            setIsAiKeyModalOpen(false);
            setEditingAiKey(null);
            loadAiKeys();
        } catch (e) {
            alert("Erro ao salvar chave de IA no pool.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSavePrompt = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (editingPrompt.id) {
                await aiService.updatePrompt(editingPrompt.id, editingPrompt);
            } else {
                await aiService.createPrompt(editingPrompt);
            }
            setIsPromptModalOpen(false);
            setEditingPrompt(null);
            loadPrompts();
        } catch (e) {
            alert("Erro ao salvar prompt na biblioteca.");
        } finally {
            setIsSaving(false);
        }
    };

    const togglePermission = async (role: string, permission_id: string, active: boolean) => {
        try {
            await systemService.togglePermission({ role, permission_id, active });
            loadRBAC();
        } catch (e) { alert("Falha na Matriz RBAC."); }
    };

    const primaryColor = localInfo?.primaryColor || '#4f46e5';

    return (
        <div className="flex-1 flex flex-col h-full animate-fade-in overflow-hidden bg-white">
            {/* COMPONENTE: MAP MODAL */}
            {isMapModalOpen && (
                <MapModal
                    initialCoords={localInfo.coordinates}
                    onClose={() => setIsMapModalOpen(false)}
                    onSave={(c: any) => { setLocalInfo({ ...localInfo, coordinates: c }); setIsMapModalOpen(false); }}
                />
            )}

            {/* HEADER MASTER */}
            <div className="bg-slate-900 text-white shadow-2xl flex flex-col lg:flex-row gap-6 shrink-0 p-6 lg:px-12 border-b border-white/10 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-600/5 rounded-full blur-[100px] -mr-40 -mt-40"></div>
                <div className="flex items-center gap-6 relative z-10">
                    <div className="p-4 bg-indigo-600 rounded-[1.5rem] text-white shadow-2xl" style={{ backgroundColor: primaryColor }}><SettingsIcon size={26} /></div>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tightest leading-none">Console Master</h1>
                        <p className="text-[9px] font-black uppercase text-indigo-400 mt-2 tracking-[0.4em] opacity-80 italic">Protocolo SRE v40.0</p>
                    </div>
                </div>

                <div className="flex-1 flex overflow-x-auto gap-2 py-1 no-scrollbar lg:justify-end items-center relative z-10">
                    {[
                        { id: 'INFO', label: 'Identidade', icon: Building },
                        { id: 'SUBSCRIPTIONS', label: 'Assinaturas', icon: CreditCard },
                        { id: 'WIKI', label: 'Wiki Hub', icon: BookOpen },
                        { id: 'AI_PROVIDERS', label: 'Pool Neural', icon: Brain },
                        { id: 'AI_PROMPTS', label: 'Biblioteca IA', icon: Wand2 },
                        { id: 'PERMISSIONS', label: 'Acessos RBAC', icon: ShieldAlert }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id as any)}
                            className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase whitespace-nowrap transition-all flex items-center gap-3 border ${activeTab === tab.id ? 'bg-white text-indigo-600 shadow-xl border-white scale-105' : 'text-slate-400 border-white/5 hover:border-white/10 hover:bg-white/5'}`}
                            style={activeTab === tab.id ? { color: primaryColor } : {}}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar bg-[#fcfcfd] p-6 lg:p-14">

                {activeTab === 'WIKI' && <WikiHub systemInfo={localInfo} />}

                {/* ABA: IDENTIDADE */}
                {activeTab === 'INFO' && (
                    <div className="space-y-12 animate-fade-in max-w-6xl mx-auto pb-20">
                        {/* PAINEL DE CONTROLE REMOTO SRE (APENAS MASTER) */}
                        {currentUser?.role === 'ADMIN' && (
                            <div className="bg-slate-900 rounded-[3.5rem] p-8 border border-white/10 shadow-xl flex items-center justify-between">
                                <div className="flex items-center gap-4 text-white">
                                    <ShieldAlert size={28} className="text-rose-500" />
                                    <div>
                                        <h3 className="text-sm font-black uppercase tracking-widest">Controle de Soberania (Kill Switch)</h3>
                                        <p className="text-[10px] text-slate-400 uppercase tracking-widest">Gerenciamento remoto de licença de uso.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => handleToggleLicense('SUSPENDED')} className="px-6 py-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2">
                                        <PauseCircle size={16} /> Suspender
                                    </button>
                                    <button onClick={() => handleToggleLicense('ACTIVE')} className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center gap-2">
                                        <PlayCircle size={16} /> Ativar
                                    </button>
                                </div>
                            </div>
                        )}

                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-12">
                            <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-4 border-b pb-8">
                                <Building size={24} style={{ color: primaryColor }} /> Identidade do Cluster
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Razão Social / Nome da Entidade</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 text-lg uppercase outline-none focus:bg-white focus:border-indigo-500 shadow-inner" value={localInfo?.name || ''} onChange={e => setLocalInfo({ ...localInfo, name: e.target.value })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sigla Comercial</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 uppercase shadow-sm" value={localInfo?.shortName || ''} onChange={e => setLocalInfo({ ...localInfo, shortName: e.target.value })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">CNPJ Oficial</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 uppercase shadow-sm" value={localInfo?.cnpj || ''} onChange={e => setLocalInfo({ ...localInfo, cnpj: e.target.value })} />
                                </div>

                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Website Oficial</label>
                                    <div className="relative group">
                                        <Globe2 className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                                        <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl pl-16 pr-8 text-indigo-600 outline-none focus:border-indigo-500 shadow-sm" value={localInfo?.website || ''} onChange={e => setLocalInfo({ ...localInfo, website: e.target.value })} placeholder="www.seusite.com.br" />
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">E-mail Administrativo</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 uppercase shadow-sm" value={localInfo?.email || ''} onChange={e => setLocalInfo({ ...localInfo, email: e.target.value })} />
                                </div>
                            </div>
                        </div>

                        {/* LOCALIZAÇÃO */}
                        <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-sm space-y-12">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b pb-8">
                                <h3 className="text-lg font-black text-slate-800 uppercase tracking-widest flex items-center gap-4">
                                    <MapPin size={24} style={{ color: primaryColor }} /> Localização da Sede
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleGetGPSLocation}
                                        disabled={isLocatingGPS}
                                        className="px-6 py-3 bg-slate-100 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-sm hover:bg-slate-200 transition-all"
                                    >
                                        {isLocatingGPS ? <Loader2 size={14} className="animate-spin" /> : <LocateFixed size={14} />}
                                        GPS Browser
                                    </button>
                                    <button onClick={() => setIsMapModalOpen(true)} className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-3 shadow-lg active:scale-95 transition-all">
                                        <LocateFixed size={16} /> Map Satellite
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_CEP}</label>
                                    <div className="relative">
                                        <input className="w-full font-black h-16 bg-white border border-slate-200 rounded-2xl px-6 text-lg focus:border-indigo-500 outline-none transition-all" value={localInfo?.cep || ''} onChange={e => setLocalInfo({ ...localInfo, cep: formatCEP(e.target.value) })} onBlur={handleCEPBlur} placeholder="00000-000" />
                                        {isSearchingCEP && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-indigo-500" size={24} />}
                                    </div>
                                </div>
                                <div className="space-y-3 md:col-span-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_STREET}</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 uppercase shadow-sm" value={localInfo?.street || ''} onChange={e => setLocalInfo({ ...localInfo, street: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_NUMBER}</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 uppercase shadow-sm" value={localInfo?.number || ''} onChange={e => setLocalInfo({ ...localInfo, number: e.target.value.toUpperCase() })} placeholder="S/N" />
                                </div>
                                <div className="space-y-3 md:col-span-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_COMPLEMENT}</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 uppercase shadow-sm" value={localInfo?.complement || ''} onChange={e => setLocalInfo({ ...localInfo, complement: e.target.value.toUpperCase() })} placeholder="APTO 101, FUNDOS..." />
                                </div>
                                <div className="space-y-3 md:col-span-2">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_NEIGHBORHOOD}</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 uppercase shadow-sm" value={localInfo?.neighborhood || ''} onChange={e => setLocalInfo({ ...localInfo, neighborhood: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_CITY}</label>
                                    <input className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 uppercase shadow-sm" value={localInfo?.city || ''} onChange={e => setLocalInfo({ ...localInfo, city: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">{SYSTEM_TEXTS.LBL_STATE}</label>
                                    <input maxLength={2} className="w-full font-black h-16 bg-slate-50 border border-slate-200 rounded-3xl px-8 uppercase shadow-sm" value={localInfo?.state || ''} onChange={e => setLocalInfo({ ...localInfo, state: e.target.value.toUpperCase() })} />
                                </div>
                            </div>

                            <div className="p-8 bg-indigo-50 border border-indigo-100 rounded-[3rem] flex items-center justify-between shadow-inner">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-white rounded-2xl text-indigo-600 shadow-sm"><RefreshCw size={28} /></div>
                                    <div>
                                        <p className="text-sm font-black text-indigo-950 uppercase tracking-tight">Sanitização de Dados</p>
                                        <p className="text-[10px] font-bold text-indigo-400 uppercase mt-1 tracking-widest">
                                            Geolocalizar automaticamente todos os endereços sem coordenadas.
                                        </p>
                                    </div>
                                </div>
                                <button onClick={handleBatchGeocode} disabled={isBatchRunning} className="px-8 py-3 bg-white text-indigo-600 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2">
                                    {isBatchRunning ? <Loader2 size={14} className="animate-spin" /> : <Crosshair size={14} />} Sincronizar Coordenadas
                                </button>
                            </div>
                        </div>

                        {/* UPLOADS & REPRESENTAÇÃO */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                            <div className="md:col-span-2 p-10 bg-indigo-50/50 border border-indigo-100 rounded-[3rem] space-y-10 shadow-inner">
                                <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-3"><UserCheck size={20} className="text-indigo-600" /> Representação Legal (Dossiê Presidência)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Presidente / Síndico</label>
                                        <input className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 uppercase shadow-sm" value={localInfo?.president_name || ''} onChange={e => setLocalInfo({ ...localInfo, president_name: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF do Presidente</label>
                                        <input className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 shadow-sm" value={localInfo?.president_cpf || ''} onChange={e => setLocalInfo({ ...localInfo, president_cpf: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Início do Mandato</label>
                                        <input type="date" className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 shadow-sm" value={localInfo?.management_start || ''} onChange={e => setLocalInfo({ ...localInfo, management_start: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Término do Mandato</label>
                                        <input type="date" className="w-full font-black h-14 bg-white border border-slate-200 rounded-xl px-6 shadow-sm" value={localInfo?.management_end || ''} onChange={e => setLocalInfo({ ...localInfo, management_end: e.target.value })} />
                                    </div>
                                    <div className="md:col-span-2 space-y-3">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Assinatura Digitalizada (PNG/Transparent)</label>
                                        <div className="flex items-center gap-6 p-6 bg-white border border-dashed border-indigo-200 rounded-[2rem] shadow-sm">
                                            <div className="w-48 h-20 bg-slate-50 rounded-xl flex items-center justify-center overflow-hidden border border-slate-200 shadow-sm p-2">
                                                {localInfo?.president_signature ? <img src={localInfo.president_signature} className="w-full h-full object-contain" alt="Assinatura" /> : <PenTool size={24} className="text-slate-300" />}
                                            </div>
                                            <label className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-indigo-700 transition-all shadow-md">
                                                Carregar Assinatura <input type="file" className="hidden" accept="image/*" onChange={handleSignatureUpload} />
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Identidade Visual (Logotipo)</label>
                                <div className="flex items-center gap-6 p-6 bg-slate-50 border border-dashed border-slate-300 rounded-[2rem] shadow-inner">
                                    <div className="w-24 h-24 bg-white rounded-2xl flex items-center justify-center overflow-hidden border border-slate-200 shadow-md">
                                        {localInfo?.logoUrl ? <img src={localInfo.logoUrl} className="w-full h-full object-contain p-2" alt="Logo" /> : <ImageIcon size={40} className="text-slate-300" />}
                                    </div>
                                    <label className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase cursor-pointer hover:bg-indigo-700 transition-all shadow-md">
                                        Carregar Imagem <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
                                    </label>
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Cor Principal (Theming Engine)</label>
                                <div className="flex items-center gap-6">
                                    <input type="color" className="w-20 h-20 rounded-2xl cursor-pointer border-4 border-white shadow-xl" value={primaryColor} onChange={e => setLocalInfo({ ...localInfo, primaryColor: e.target.value })} />
                                    <input className="font-mono font-black text-xl uppercase bg-slate-100 px-6 py-4 rounded-2xl border" value={primaryColor} readOnly />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* ABA: SUBSCRIPTIONS (CADASTRO DE PLANOS) */}
                {activeTab === 'SUBSCRIPTIONS' && (
                    <div className="space-y-12 animate-fade-in max-w-7xl mx-auto pb-20">
                        <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><CreditCard size={300} /></div>
                            <div className="relative z-10">
                                <h3 className="text-4xl font-black uppercase tracking-tightest leading-none">Modelos de <br /> Assinatura</h3>
                                <p className="text-indigo-400 text-[9px] font-black uppercase mt-4 tracking-widest flex items-center gap-2"><ReceiptText size={16} /> Ledger Recurring Protocol V5.0</p>
                            </div>
                            <button onClick={() => { setEditingPlan({ name: '', price: 0, billing_cycle: 'monthly', description: '', active: 1 }); setIsPlanModalOpen(true); }} className="relative z-10 px-12 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-4 active:scale-95">
                                <Plus size={20} /> Novo Plano de Recorrência
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {plans.map(plan => (
                                <div key={plan.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col group hover:shadow-xl transition-all h-full">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform"><LayoutGrid size={24} /></div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingPlan(plan); setIsPlanModalOpen(true); }} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit3 size={18} /></button>
                                            <button onClick={async () => { if (confirm("Remover plano?")) { await planService.delete(plan.id); loadPlans(); } }} className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">{plan.name}</h3>
                                    <p className="text-xs text-slate-500 font-medium mb-8 flex-1 leading-relaxed">{plan.description || 'Sem descrição detalhada.'}</p>
                                    <div className="pt-6 border-t border-slate-100 flex justify-between items-end">
                                        <div>
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Faturamento</p>
                                            <p className="text-2xl font-black text-indigo-600">R$ {Number(plan.price).toLocaleString('pt-BR')}<span className="text-[10px] ml-1 text-slate-400">/ {plan.billing_cycle === 'monthly' ? 'mês' : 'ano'}</span></p>
                                        </div>
                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase border ${plan.active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-400'}`}>Ativo</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ABA: AI PROVIDERS */}
                {activeTab === 'AI_PROVIDERS' && (
                    <div className="space-y-12 animate-fade-in max-w-7xl mx-auto pb-20">
                        <div className="bg-slate-950 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><Brain size={300} /></div>
                            <div className="relative z-10">
                                <h3 className="text-4xl font-black uppercase tracking-tightest leading-none">Pool Neural <br />SoBerano</h3>
                                <p className="text-indigo-400 text-[9px] font-black uppercase mt-4 tracking-widest flex items-center gap-2"><Cpu size={16} /> Cluster Intelligence Protocol V30.0</p>
                            </div>
                            <button onClick={() => { setEditingAiKey({ label: '', key_value: '', provider: 'GOOGLE', status: 'active', priority: 1, model: 'gemini-3-flash-preview', tier: 'FREE', error_count: 0 }); setIsAiKeyModalOpen(true); }} className="relative z-10 px-12 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-4 active:scale-95">
                                <Plus size={20} /> Injetar Token Neural
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {aiKeys.map(key => (
                                <div key={key.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm group hover:border-indigo-400 transition-all flex flex-col h-full relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-8">
                                        <div className="p-5 bg-indigo-50 text-indigo-600 rounded-2xl shadow-inner group-hover:scale-110 transition-transform"><Activity size={24} /></div>
                                        <div className="flex flex-col items-end gap-2">
                                            <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${key.status === 'active' || key.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-600 border-rose-100'}`}>{key.status}</span>
                                            <span className="text-[8px] font-black text-slate-400 uppercase">Prioridade {key.priority}</span>
                                        </div>
                                    </div>
                                    <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2 truncate">{key.label}</h4>
                                    <div className="space-y-1 mb-8 flex-1">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase">{key.model || 'GEMINI-3-FLASH'}</p>
                                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Provider: {key.provider} • Tier: {key.tier}</p>
                                        <div className="flex items-center gap-2 mt-2">
                                            <code className="text-[9px] font-mono text-slate-300 select-all truncate max-w-[100px] bg-slate-50 px-2 py-1 rounded-lg">
                                                {showKeyContent[key.id] ? key.key_value : '••••••••••••'}
                                            </code>
                                            <button onClick={() => setShowKeyContent(p => ({ ...p, [key.id]: !p[key.id] }))} className="text-slate-400 hover:text-indigo-600">
                                                {showKeyContent[key.id] ? <EyeOff size={12} /> : <Eye size={12} />}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 space-y-4 mb-8">
                                        <div className="flex justify-between items-center text-[8px] font-black uppercase text-slate-500">
                                            <span>Erros Acumulados</span>
                                            <span className={key.error_count > 0 ? 'text-rose-500' : 'text-emerald-500'}>{key.error_count} / 10</span>
                                        </div>
                                        <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                                            <div className={`h-full transition-all duration-1000 ${key.error_count > 5 ? 'bg-rose-500' : 'bg-emerald-500'}`} style={{ width: `${(key.error_count / 10) * 100}%` }}></div>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center pt-6 border-t border-slate-50">
                                        <button onClick={() => { setEditingAiKey(key); setIsAiKeyModalOpen(true); }} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit3 size={20} /></button>
                                        <button onClick={async () => { if (confirm("Remover token permanentemente?")) { await aiKeyService.delete(key.id); loadAiKeys(); } }} className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={20} /></button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* ABA: AI PROMPTS */}
                {activeTab === 'AI_PROMPTS' && (
                    <div className="space-y-12 animate-fade-in max-w-7xl mx-auto pb-20">
                        <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><MessageSquare size={300} /></div>
                            <div className="relative z-10">
                                <h3 className="text-4xl font-black uppercase tracking-tightest leading-none">Biblioteca <br /> Neural</h3>
                                <p className="text-indigo-400 text-[9px] font-black uppercase mt-4 tracking-widest flex items-center gap-2"><Sparkles size={16} /> Neural Assets Protocol V1.0</p>
                            </div>
                            <button onClick={() => { setEditingPrompt({ title: '', content: '', category: 'GERAL', is_favorite: 0, role_restriction: 'ALL' }); setIsPromptModalOpen(true); }} className="relative z-10 px-12 py-5 bg-white text-slate-900 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-indigo-50 transition-all flex items-center gap-4 active:scale-95">
                                <Plus size={20} /> Injetar Prompt
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {prompts.map(prompt => (
                                <div key={prompt.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col group hover:shadow-xl transition-all h-full relative">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className={`p-4 rounded-2xl shadow-inner group-hover:scale-110 transition-transform ${prompt.is_favorite ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'}`}>
                                            {prompt.is_favorite ? <Zap size={24} /> : <FileCode size={24} />}
                                        </div>
                                        <div className="flex gap-2">
                                            <button onClick={() => { setEditingPrompt(prompt); setIsPromptModalOpen(true); }} className="p-3 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"><Edit3 size={18} /></button>
                                            <button onClick={async () => { if (confirm("Remover prompt?")) { await aiService.deletePrompt(prompt.id); loadPrompts(); } }} className="p-3 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                                        </div>
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">{prompt.title}</h3>
                                    <div className="flex items-center gap-2 mb-4">
                                        <span className="text-[10px] font-black text-indigo-600 uppercase bg-indigo-50 px-2 py-0.5 rounded">{prompt.category}</span>
                                        <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded ${prompt.role_restriction === 'ALL' ? 'bg-slate-100 text-slate-600' : 'bg-rose-50 text-rose-600'}`}>
                                            Cargo: {prompt.role_restriction}
                                        </span>
                                    </div>
                                    <p className="text-xs text-slate-500 font-medium mb-8 flex-1 leading-relaxed line-clamp-4">{prompt.content}</p>
                                    <div className="pt-6 border-t border-slate-100 flex justify-between items-center text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                        <span>Snapshot {new Date(prompt.updated_at || prompt.created_at).toLocaleDateString()}</span>
                                        {prompt.is_favorite ? <span className="text-amber-500">Favorito</span> : null}
                                    </div>
                                </div>
                            ))}
                            {prompts.length === 0 && (
                                <div className="col-span-full py-20 text-center opacity-30">
                                    <MessageSquare size={48} className="mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase">Biblioteca de Prompts Vazia</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* ABA: PERMISSIONS */}
                {activeTab === 'PERMISSIONS' && (
                    <div className="space-y-12 animate-fade-in max-w-7xl mx-auto pb-20">
                        <div className="bg-slate-900 p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden flex flex-col md:flex-row justify-between items-center gap-12">
                            <div className="absolute top-0 right-0 p-8 opacity-10"><ShieldAlert size={300} /></div>
                            <div className="relative z-10">
                                <h3 className="text-4xl font-black uppercase tracking-tightest leading-none">Matriz de <br /> Governança</h3>
                                <p className="text-indigo-400 text-[9px] font-black uppercase mt-4 tracking-widest flex items-center gap-2"><Lock size={16} /> RBAC v2.0 • Controle de Escopo</p>
                            </div>
                            <div className="bg-white/5 p-6 rounded-3xl border border-white/10 max-w-sm flex flex-col gap-4">
                                <p className="text-[10px] font-medium leading-relaxed opacity-60 italic">
                                    "Defina quem pode visualizar dados globais ou apenas os próprios registros. O Tesoureiro deve ter acesso GLOBAL, enquanto o Morador tem acesso OWN (Próprio)."
                                </p>
                                <button onClick={() => { setEditingRole({ id: '', label: '' }); setIsRoleModalOpen(true); }} className="px-6 py-3 bg-white text-slate-900 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center gap-2 shadow-lg hover:bg-indigo-50 transition-all self-end">
                                    <Plus size={16} /> Novo Cargo
                                </button>
                            </div>
                        </div>

                        <div className="bg-white border border-slate-200 rounded-[3rem] shadow-sm overflow-hidden overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left border-separate border-spacing-0">
                                <thead className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    <tr>
                                        <th className="p-8 border-b bg-white sticky left-0 z-20 w-80">Permissão / Recurso</th>
                                        {roles.map(role => (
                                            <th key={role.id} className="p-8 border-b text-center min-w-[150px] group">
                                                <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm relative">
                                                    <p className="text-[10px] text-slate-800">{role.label}</p>
                                                    <p className="text-[8px] mt-1">{role.id}</p>
                                                    <button onClick={() => { setEditingRole(role); setIsRoleModalOpen(true); }} className="absolute -top-2 -right-2 p-1.5 bg-slate-900 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"><Edit3 size={10} /></button>
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {SYSTEM_PERMISSIONS.map(perm => (
                                        <tr key={perm.id} className="hover:bg-slate-50 transition-colors">
                                            <td className="p-8 bg-white sticky left-0 z-10 border-r border-slate-100 shadow-[10px_0_15px_-5px_rgba(0,0,0,0.02)]">
                                                <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{perm.label}</p>
                                                <p className="text-[9px] text-slate-400 mt-1 font-medium">{perm.id}</p>
                                            </td>
                                            {roles.map(role => {
                                                const isActive = permissions.some(p => p.role === role.id && p.permission_id === perm.id);
                                                const isMasterAdmin = role.id === 'ADMIN';
                                                return (
                                                    <td key={`${role.id}-${perm.id}`} className="p-8 text-center">
                                                        <button
                                                            disabled={isMasterAdmin}
                                                            onClick={() => togglePermission(role.id, perm.id, !isActive)}
                                                            className={`w-12 h-6 rounded-full transition-all relative ${isActive ? 'bg-indigo-600' : 'bg-slate-200'} ${isMasterAdmin ? 'opacity-30 cursor-not-allowed' : 'hover:scale-110'}`}
                                                            style={isActive ? { backgroundColor: primaryColor } : {}}
                                                        >
                                                            <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-md ${isActive ? 'left-7' : 'left-1'}`} />
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {/* MODALS */}

            {/* MODAL PLANO (SUBSCRIPTIONS) */}
            {isPlanModalOpen && editingPlan && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                        <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 rounded-t-[3rem]">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl"><CreditCard size={28} /></div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Molde de Assinatura</h3>
                                    <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">Recurring Asset Configuration</p>
                                </div>
                            </div>
                            <button onClick={() => setIsPlanModalOpen(false)} className="p-4 hover:bg-rose-500 rounded-2xl transition-all border border-white/5"><X size={32} /></button>
                        </div>
                        <div className="p-12 space-y-8 bg-white rounded-b-[3rem]">
                            <form onSubmit={handleSavePlan} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Plano / Título Financeiro</label>
                                    <input required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm font-black uppercase outline-none focus:border-indigo-500 shadow-inner" placeholder="EX: TAXA ASSOCIATIVA MENSAL" value={editingPlan.name} onChange={e => setEditingPlan({ ...editingPlan, name: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Valor Unitário (R$)</label>
                                        <input type="number" step="0.01" className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-xl font-black outline-none focus:border-indigo-500" value={editingPlan.price} onChange={e => setEditingPlan({ ...editingPlan, price: e.target.value })} />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ciclo de Cobrança</label>
                                        <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-6 text-[10px] font-black uppercase outline-none" value={editingPlan.billing_cycle} onChange={e => setEditingPlan({ ...editingPlan, billing_cycle: e.target.value })}>
                                            <option value="monthly">Protocolo Mensal</option>
                                            <option value="quarterly">Protocolo Trimestral</option>
                                            <option value="yearly">Protocolo Anual</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Descrição & Cobertura</label>
                                    <textarea rows={4} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm outline-none focus:bg-white transition-all shadow-inner" value={editingPlan.description} onChange={e => setEditingPlan({ ...editingPlan, description: e.target.value })} placeholder="Descreva o que este plano abrange..." />
                                </div>
                                <div className="pt-6 border-t border-slate-100 flex gap-4">
                                    <button type="button" onClick={() => setIsPlanModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Abortar</button>
                                    <button type="submit" disabled={isSaving} className="flex-[2] py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3">
                                        {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Sincronizar Plano
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL INJETAR TOKEN NEURAL */}
            {isAiKeyModalOpen && editingAiKey && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                        <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 rounded-t-[3rem]">
                            <div className="flex items-center gap-6">
                                <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl"><Zap size={28} /></div>
                                <div>
                                    <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Token Neural Protocol</h3>
                                    <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">Failover Pool Integration</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => setIsAiKeyModalOpen(false)} className="p-4 hover:bg-rose-500 rounded-2xl transition-all border border-white/5"><X size={32} /></button>
                        </div>
                        <div className="p-12 space-y-8 bg-white rounded-b-[3rem]">
                            <form onSubmit={handleSaveAiKey} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rótulo do Token</label>
                                    <input required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm font-black outline-none focus:border-indigo-500 shadow-inner" placeholder="EX: GEMINI-PRO-MASTER" value={editingAiKey.label} onChange={e => setEditingAiKey({ ...editingAiKey, label: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">API KEY SECRETA (GOOGLE GEN AI)</label>
                                    <input type="password" required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm font-mono outline-none focus:border-indigo-500 shadow-inner" value={editingAiKey.key_value} onChange={e => setEditingAiKey({ ...editingAiKey, key_value: e.target.value })} />
                                </div>
                                <div className="grid grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo Primário</label>
                                        <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase outline-none shadow-inner" value={editingAiKey.model} onChange={e => setEditingAiKey({ ...editingAiKey, model: e.target.value })}>
                                            <option value="gemini-3-flash-preview">Gemini 3 Flash (Fast)</option>
                                            <option value="gemini-3-pro-preview">Gemini 3 Pro (Smart)</option>
                                            <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tier de Faturamento</label>
                                        <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase outline-none shadow-inner" value={editingAiKey.tier} onChange={e => setEditingAiKey({ ...editingAiKey, tier: e.target.value })}>
                                            <option value="FREE">Free Tier (Pessoal)</option>
                                            <option value="PAID">Pay-as-you-go (GCP)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Provedor</label>
                                        <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase outline-none shadow-inner" value={editingAiKey.provider} onChange={e => setEditingAiKey({ ...editingAiKey, provider: e.target.value })}>
                                            <option value="GOOGLE">Google Cloud (Gemini)</option>
                                            <option value="OPENAI">OpenAI (GPT)</option>
                                        </select>
                                    </div>
                                </div>
                                <div className="pt-6 border-t border-slate-100 flex gap-4">
                                    <button type="button" onClick={() => setIsAiKeyModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600">Abortar</button>
                                    <button type="submit" className="flex-[2] py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-600 transition-all">Sincronizar Cluster</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL EDITOR DE PROMPT */}
            {isPromptModalOpen && editingPrompt && (
                <div className="sie-editor-overlay">
                    <div className="sie-modal-container !h-auto !max-w-2xl self-center">
                        <form onSubmit={handleSavePrompt}>
                            <div className="h-24 px-10 bg-slate-900 text-white flex justify-between items-center shrink-0 border-b border-white/5 rounded-t-[3rem]">
                                <div className="flex items-center gap-6">
                                    <div className="p-4 bg-indigo-600 rounded-2xl shadow-xl"><MessageSquare size={28} /></div>
                                    <div>
                                        <h3 className="font-black text-xl uppercase tracking-tighter leading-none">Editor de Prompt</h3>
                                        <p className="text-indigo-400 text-[9px] font-black uppercase mt-1.5 tracking-widest opacity-80">Neural Asset Configuration</p>
                                    </div>
                                </div>
                                <button type="button" onClick={() => setIsPromptModalOpen(false)} className="p-4 hover:bg-rose-500 rounded-2xl transition-all border border-white/5"><X size={32} /></button>
                            </div>
                            <div className="p-12 space-y-8 bg-white rounded-b-[3rem]">
                                <form onSubmit={handleSavePrompt} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Título do Prompt</label>
                                        <input required className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm font-black uppercase outline-none focus:border-indigo-500 shadow-inner" placeholder="EX: RESUMO DE ATA JURÍDICA" value={editingPrompt.title} onChange={e => setEditingPrompt({ ...editingPrompt, title: e.target.value.toUpperCase() })} />
                                    </div>
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                                            <input className="w-full h-14 bg-slate-50 border border-slate-200 rounded-2xl px-6 text-sm font-black uppercase outline-none focus:border-indigo-500" value={editingPrompt.category} onChange={e => setEditingPrompt({ ...editingPrompt, category: e.target.value.toUpperCase() })} />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Restringir ao Cargo</label>
                                            <select className="w-full h-14 bg-slate-50 border border-slate-200 rounded-xl px-4 text-[10px] font-black uppercase outline-none" value={editingPrompt.role_restriction} onChange={e => setEditingPrompt({ ...editingPrompt, role_restriction: e.target.value })}>
                                                <option value="ALL">TODOS (IRRESTRITO)</option>
                                                {roles.map(r => <option key={r.id} value={r.id}>{r.label}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="flex items-end pb-2">
                                        <label className="flex items-center gap-3 cursor-pointer group">
                                            <div onClick={() => setEditingPrompt({ ...editingPrompt, is_favorite: editingPrompt.is_favorite ? 0 : 1 })} className={`p-1 rounded-full transition-all ${editingPrompt.is_favorite ? 'bg-amber-500' : 'bg-slate-300'}`}>
                                                {editingPrompt.is_favorite ? <ToggleRight size={24} className="text-white" /> : <ToggleLeft size={24} className="text-slate-400" />}
                                            </div>
                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Favorito (Topo da Lista)</span>
                                        </label>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Corpo de Instrução (System Prompt)</label>
                                        <textarea rows={8} className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-6 text-sm outline-none focus:bg-white transition-all shadow-inner" value={editingPrompt.content} onChange={e => setEditingPrompt({ ...editingPrompt, content: e.target.value })} placeholder="Instruções detalhadas para a IA..." />
                                    </div>
                                    <div className="pt-6 border-t border-slate-100 flex gap-4">
                                        <button type="button" onClick={() => setIsPromptModalOpen(false)} className="flex-1 py-5 text-slate-400 font-black text-[10px] uppercase tracking-widest">Abortar</button>
                                        <button type="submit" disabled={isSaving} className="flex-[2] py-5 bg-slate-950 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl hover:bg-emerald-600 transition-all flex items-center justify-center gap-3">
                                            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />} Sincronizar Prompt
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            <div className="fixed bottom-10 right-10 z-[1000]">
                <button onClick={handleSaveInfo} disabled={isSaving} className="px-12 py-6 bg-slate-950 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 transition-all flex items-center gap-4 active:scale-95 group border border-white/5">
                    {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} className="group-hover:scale-110" />}
                    COMMITAR MUDANÇAS MASTER
                </button>
            </div>
        </div>
    );
};

export default Settings;
