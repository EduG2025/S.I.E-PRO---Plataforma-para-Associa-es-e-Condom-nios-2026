import { 
  LayoutDashboard, Wallet, Users, Bell, ShieldAlert, CalendarClock, 
  Settings, ClipboardList, BarChart3, Shield, FileText, Gavel, 
  MessageSquareText, Calendar, Camera, Leaf, ShoppingBag, 
  Megaphone, HelpCircle, Box, Monitor, Brain, Fingerprint, Smartphone,
  UserCheck, ShieldCheck, Archive, GraduationCap, Heart, Stethoscope, Plane,
  Gamepad, Activity, Bus, Coins, Siren, HardHat, Users2, Car
} from 'lucide-react';
import { SystemInfo } from './types';

export const MENU_ITEMS = [
  // ESTRATÉGICO
  { id: 'dashboard', label: 'Comando Central', icon: LayoutDashboard, permissionId: 'view_dashboard', category: 'ESTRATÉGICO' },
  { id: 'messenger_bridge', label: 'Messenger Bridge', icon: Smartphone, permissionId: 'manage_communication', category: 'ESTRATÉGICO' },
  { id: 'neural_chat', label: 'Mentor Neural', icon: Brain, permissionId: 'use_ai_chat', category: 'ESTRATÉGICO' },
  { id: 'id_system', label: 'Emissor de ID', icon: Fingerprint, permissionId: 'manage_users', category: 'ESTRATÉGICO' },
  
  // GOVERNANÇA
  { id: 'demographics', label: 'Observatório Social', icon: BarChart3, permissionId: 'view_demographics', category: 'GOVERNANÇA' },
  { id: 'surveys', label: 'Censo & Pesquisas', icon: ClipboardList, permissionId: 'manage_surveys', category: 'GOVERNANÇA' },
  { id: 'documents', label: 'Hub de Documentos', icon: FileText, permissionId: 'view_documents', category: 'GOVERNANÇA' },
  { id: 'assemblies', label: 'Assembleia Digital', icon: Gavel, permissionId: 'manage_assemblies', category: 'GOVERNANÇA' },

  // OPERACIONAL
  { id: 'users', label: 'Base de Membros', icon: Users, permissionId: 'manage_users', category: 'OPERACIONAL' },
  { id: 'vehicles', label: 'Frota & Veículos', icon: Car, permissionId: 'view_operations', category: 'OPERACIONAL' },
  { id: 'watchdog', label: 'Vigilância Vision', icon: Camera, permissionId: 'view_operations', category: 'OPERACIONAL' },
  { id: 'concierge', label: 'Portaria & Acesso', icon: UserCheck, permissionId: 'view_operations', category: 'OPERACIONAL' },
  { id: 'finance', label: 'Ledger Financeiro', icon: Wallet, permissionId: 'view_finances', category: 'OPERACIONAL' },
  { id: 'operations', label: 'Gestão de Incidentes', icon: ShieldAlert, permissionId: 'view_operations', category: 'OPERACIONAL' },
  { id: 'assets', label: 'Inventário Ativos', icon: Box, permissionId: 'manage_assets', category: 'OPERACIONAL' },
  { id: 'projects', label: 'Obras & Infra', icon: Archive, permissionId: 'view_projects', category: 'OPERACIONAL' },
  { id: 'timeline', label: 'Agenda de Marcos', icon: CalendarClock, permissionId: 'view_timeline', category: 'OPERACIONAL' },
  { id: 'sustainability', label: 'S.I.E Green (ESG)', icon: Leaf, permissionId: 'view_dashboard', category: 'OPERACIONAL' },

  // COMUNIDADE
  { id: 'communication', label: 'Mural de Avisos', icon: Megaphone, permissionId: 'manage_communication', category: 'COMUNIDADE' },
  { id: 'marketplace', label: 'Marketplace Local', icon: ShoppingBag, permissionId: 'use_marketplace', category: 'COMUNIDADE' },
  { id: 'reservations', label: 'Reservas de Áreas', icon: Calendar, permissionId: 'use_reservations', category: 'COMUNIDADE' },
  { id: 'suggestions', label: 'Ouvidoria Digital', icon: HelpCircle, permissionId: 'send_suggestions', category: 'COMUNIDADE' },
  
  // SISTEMA
  { id: 'settings', label: 'Console Master', icon: Settings, permissionId: 'manage_settings', category: 'SISTEMA' },
];

export const DEFAULT_SYSTEM_INFO: SystemInfo = {
  name: 'S.I.E PRO — SISTEMA INTELIGENTE ATIVO',
  shortName: 'S.I.E PRO',
  cnpj: '00.000.000/0001-00',
  address: 'Sede Administrativa Central',
  primaryColor: '#4f46e5',
  registrationMode: 'APPROVAL'
};

export const SYSTEM_PERMISSIONS = [
  { id: 'view_dashboard', label: 'Visualizar Dashboard' },
  { id: 'manage_users', label: 'Gerenciar Identidades' },
  { id: 'view_finances', label: 'Auditar Financeiro' },
  { id: 'view_operations', label: 'Monitorar Operações' },
  { id: 'use_ai_chat', label: 'Consultar Mentor Neural' },
  { id: 'view_documents', label: 'Gerir Repositório Legal' },
  { id: 'manage_assemblies', label: 'Convocar Assembleias' },
  { id: 'manage_surveys', label: 'Arquiteto de Censo' },
  { id: 'manage_communication', label: 'Controlar Mensageria' },
  { id: 'view_demographics', label: 'Acessar BI Territorial' },
  { id: 'manage_settings', label: 'Administrar Kernel' },
  { id: 'manage_ai_keys', label: 'Gerenciar Chaves de IA' },
  { id: 'manage_assets', label: 'Gerenciar Patrimônio' },
  { id: 'view_timeline', label: 'Ver Agenda/Marcos' },
  { id: 'view_projects', label: 'Ver Projetos' },
  { id: 'use_marketplace', label: 'Participar Marketplace' },
  { id: 'use_reservations', label: 'Reservar Áreas' },
  { id: 'send_suggestions', label: 'Enviar Ouvidoria' },
];

export const FINANCIAL_CATEGORIES = ['CONDOMÍNIO', 'DOAÇÃO', 'MANUTENÇÃO', 'SEGURANÇA', 'ADMINISTRATIVO', 'EVENTOS', 'OUTROS'];