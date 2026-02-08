
import React from 'react';

/**
 * S.I.E NUCLEUS - GLOBAL TYPE DEFINITIONS
 * Version: 11.0.0 - SRE ULTIMATE SOVEREIGNTY
 */

export interface DesignTokens {
  borderRadius: number;
  containerPadding: number;
  viewportPadding: number;
  sidebarWidth: number;
  sidebarWidthCollapsed: number;
  footerHeight: number;
  shadowIntensity: number;
  fontSizeBase: number;
  fontScale: number;
  primaryColor: string;
  successColor: string;
  dangerColor: string;
  warningColor: string;
  surfaceColor: string;
  sidebarBg: string;
  sidebarActiveColor: string;
  sidebarTextColor: string;
  sidebarIconSize: number;
  sidebarBorderColor: string;
  sidebarHoverColor: string;
  formOverlapOffset: number;
  borderSpacing: number;
  centerTitle: boolean;
  cardShadowIntensity: number;
  inputHeight: number;
  fontWeightHeading: number;
  letterSpacingBase: number;
  buttonRadius: number;
  buttonWeight: number;
  inputBorderWidth: number;
  cardBorderWidth: number;
  glassOpacity: number;
  mobileMenuType: 'SIDEBAR' | 'DRAWER_TOP' | 'BOTTOM_NAV';
  mobileMenuSide: 'left' | 'right';
}

export interface DualDesignSystem {
  desktop: DesignTokens;
  mobile: DesignTokens;
}

export enum UserRole {
  ADMIN = 'ADMIN',
  PRESIDENT = 'PRESIDENT',
  VICE_PRESIDENT = 'VICE_PRESIDENT',
  TREASURER_1 = 'TREASURER_1',
  RESIDENT = 'RESIDENT',
  COUNCIL = 'COUNCIL'
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SUSPENDED = 'SUSPENDED',
  ARCHIVED = 'ARCHIVED'
}

// SRE FIX: Added complement property to SystemInfo
export interface SystemInfo {
  id?: number;
  name: string;
  shortName?: string;
  cnpj?: string;
  email?: string;
  phone?: string;
  website?: string;
  primaryColor?: string;
  logoUrl?: string;
  registrationMode?: 'OPEN' | 'APPROVAL' | 'INVITE_ONLY';
  resident_ui_settings?: any[];
  whatsapp_config?: WhatsAppConfig;
  coordinates?: { lat: number; lng: number };
  president_name?: string;
  president_cpf?: string;
  management_start?: string;
  management_end?: string;
  president_signature?: string;
  module_metadata?: Record<string, any>;
  dictionary?: Record<string, string>;
  license_status?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  city?: string;
  state?: string;
  address?: string;
  neighborhood?: string;
}

export interface WhatsAppConfig {
  api_key: string;
  sender: string;
  footer: string;
  gateway_url: string;
  webhook_url?: string;
  welcome_msg: boolean;
  chatbot_enabled: boolean;
  chatbot_rag_wiki: boolean;
  chatbot_rag_rbac: boolean;
  billing_reminder_1d?: boolean;
  billing_reminder_2d?: boolean;
  late_reminder?: boolean;
}

export interface User {
  id: string | number;
  name: string;
  username: string;
  cpf_cnpj: string;
  email?: string;
  role: UserRole | string;
  status: UserStatus | string;
  active: boolean | number;
  unit?: string;
  avatar_url?: string;
  socialData?: any;
  coordinates?: any;
  phone?: string;
  whatsapp?: string;
  birth_date?: string;
  age?: number;
  resident_type?: string;
  profession?: string;
  neighborhood?: string;
}

export interface MessageTemplate {
  id: string | number;
  name: string;
  content: string;
  event_trigger?: string;
  is_active?: boolean | number;
  media_url?: string;
  media_type?: string;
  buttons?: MessengerButton[];
}

export interface MessengerButton {
  type: 'url' | 'call' | 'copy' | 'reply';
  displayText: string;
  url?: string;
  phoneNumber?: string;
  copyText?: string;
}

export interface AutomationRule {
  id: string | number;
  title: string;
  conditions: AutomationCondition[];
  active?: boolean;
}

export interface AutomationCondition {
  field: string;
  operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS';
  value: string;
}

export interface OfficialDocument {
  id: string | number;
  title: string;
  content: string;
  type: string;
  status: string;
  metadata?: string;
  created_at: string;
  updated_at: string;
}

export interface DocumentVersion {
  id: number;
  content: string;
  created_at: string;
}

export interface AIKey {
  id: string | number;
  label: string;
  key_value: string;
  provider: string;
  model?: string;
  tier?: string;
  status: string;
  error_count: number;
  priority: number;
}

// SRE FIX: Added missing exported members
export interface Survey {
  id: string | number;
  title: string;
  description?: string;
  type: string;
  questions: SurveyQuestion[] | string;
  status: string;
  created_at: string;
  updated_at?: string;
  whatsapp_trigger_enabled?: boolean | number;
  whatsapp_template_id?: string | number;
  next_survey_id?: string | number;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'text' | 'select' | 'boolean' | 'number' | 'date' | 'multimedia';
  required?: boolean | number;
  options?: string[];
  mapping_tag?: string;
  logic_parent_id?: string;
  logic_trigger_value?: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio';
  content_html?: string;
  auto_play?: boolean;
  filterable?: boolean;
}

export interface Incident {
  id: string | number;
  user_id?: string | number;
  title: string;
  location: string;
  priority: string;
  status: string;
  description: string;
  coordinates?: any;
  radius?: number;
  created_at: string;
  reporter_name?: string;
  whatsapp_template_id?: string | number;
}

export interface Notice {
  id: string | number;
  title: string;
  content: string;
  created_at: string;
  updated_at?: string;
}

export interface Campaign {
  id: string | number;
  title: string;
  rule_id: number;
  template_id: number;
  status: string;
  total_targets: number;
  sent_count: number;
  created_at: string;
}

export interface FinancialRecord {
  id: string | number;
  user_id: string | number;
  description: string;
  amount: number | string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  status: 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';
  date: string;
  due_date?: string;
  created_at: string;
}

export interface AgendaEvent {
  id: string | number;
  title: string;
  description?: string;
  date: string;
  type: 'MEETING' | 'MAINTENANCE' | 'DEADLINE' | 'EVENT' | 'OTHER';
  status: 'UPCOMING' | 'FINISHED' | 'CANCELLED';
  location?: string;
  created_at: string;
}

export type ResidentType = 'TITULAR' | 'DEPENDENTE' | 'INQUILINO' | 'RESPONSAVEL' | 'OCUPANTE';
export type PreferredChannel = 'WHATSAPP' | 'EMAIL' | 'APP';

export interface CommunityProject {
  id: string | number;
  title: string;
  description: string;
  budget: number | string;
  spent: number | string;
  progress: number;
  startDate: string;
  category: string;
  status: string;
  created_at: string;
}

export interface MarketItem {
  id: string | number;
  title: string;
  description: string;
  category: 'GOODS' | 'FOOD' | 'SERVICE';
  price: number | string;
  whatsapp: string;
  merchant_id?: string | number;
  created_at?: string;
  updated_at?: string;
}

export interface CameraDevice {
  id: string | number;
  name: string;
  url: string;
  location?: string;
  status: string;
  created_at: string;
}

export interface Asset {
  id: string | number;
  name: string;
  category: string;
  value: number | string;
  status: string;
  date_acquired: string;
  responsible_id?: string | number;
  created_at: string;
}

export interface TerritorialUnit {
  id: string | number;
  label: string;
  street_name?: string;
}

export type DocStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'SIGNED' | 'SENT' | 'ARCHIVED';

export interface ScheduledBroadcast {
  id: string | number;
  user_id: string | number;
  target_type: string;
  target_value: string;
  message_body: string;
  template_id?: number;
  scheduled_at: string;
  status: string;
  error_log?: string;
  sent_at?: string;
  campaign_id?: number;
  created_at: string;
}