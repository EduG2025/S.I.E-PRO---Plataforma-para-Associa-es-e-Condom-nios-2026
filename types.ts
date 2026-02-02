
import React from 'react';

/**
 * S.I.E NUCLEUS - GLOBAL TYPE DEFINITIONS
 * Version: 9.0.0 - STUDIO LAB MASTER SOVEREIGNTY
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
  // SRE V45 Geometria Ativa & Soberania Visual
  formOverlapOffset: number;
  borderSpacing: number;
  centerTitle: boolean;
  cardShadowIntensity: number;
  inputHeight: number;
  // SRE V80 Expansão de DNA
  fontWeightHeading: number;
  letterSpacingBase: number;
  buttonRadius: number;
  buttonWeight: number;
  inputBorderWidth: number;
  cardBorderWidth: number;
  glassOpacity: number;
  // SRE V90 Mobile Navigation Sovereignty
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

export type ResidentType = 'TITULAR' | 'DEPENDENTE' | 'INQUILINO' | 'PRESTADOR';
export type PreferredChannel = 'WHATSAPP' | 'EMAIL' | 'APP';
export type FinancialStatus = 'PAID' | 'PENDING' | 'OVERDUE' | 'CANCELLED';

export interface ResidentUISetting {
  id: string;
  label: string;
  enabled: boolean;
  icon?: string;
}

export interface TacticalAnalysis {
  risk_score: number | string;
  predictions: string[];
  recommended_actions: string[];
}

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
  resident_ui_settings?: ResidentUISetting[] | any[];
  whatsapp_config?: any;
  coordinates?: { lat: number; lng: number };
  president_name?: string;
  president_cpf?: string;
  management_start?: string;
  management_end?: string;
  president_signature?: string;
  module_metadata?: Record<string, any>;
  dictionary?: Record<string, string>;
  context_rules?: any;
  cep?: string;
  street?: string;
  number?: string;
  city?: string;
  state?: string;
  complement?: string;
  neighborhood?: string;
  address?: string;
}

export interface Incident {
  id: string | number;
  title: string;
  location: string;
  priority: string;
  status: string;
  description: string;
  coordinates?: any;
  radius?: number;
  created_at?: string;
}

export interface User {
  id: string | number;
  name: string;
  username: string;
  cpf_cnpj: string;
  email?: string;
  password_hash?: string;
  role: UserRole | string;
  status: UserStatus | string;
  active: boolean | number;
  unit?: string;
  age?: number;
  birth_date?: string;
  rg?: string;
  issuing_authority?: string;
  gender?: string;
  nationality?: string;
  phone?: string;
  whatsapp?: string;
  preferred_channel?: PreferredChannel | string;
  avatar_url?: string;
  document_front_url?: string;
  document_back_url?: string;
  ocr_payload?: any;
  socialData?: any;
  coordinates?: { lat: number; lng: number } | string;
  profession?: string;
  voting_rights?: number | boolean;
  resident_type?: ResidentType | string;
  created_by?: number;
  parent_id?: number | string;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
  cep?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
}

export interface FinancialRecord {
  id: string | number;
  user_id?: string | number;
  description: string;
  amount: number | string;
  type: 'INCOME' | 'EXPENSE';
  category: string;
  status: FinancialStatus | string;
  date: string;
  due_date?: string;
  is_recurring?: number | boolean;
}

export interface DocumentVersion {
  id: string | number;
  document_id: string | number;
  content: string;
  created_at: string;
}

export interface OfficialDocument {
  id: string | number;
  title: string;
  content: string;
  type: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface MessageTemplate {
  id: string | number;
  event_trigger: string;
  name: string;
  content: string;
  is_active: boolean | number;
  media_url?: string;
  media_type?: string;
  buttons?: any;
}

export interface ScheduledBroadcast {
  id: string | number;
  target_type: string;
  target_value: string;
  message_body: string;
  scheduled_at: string;
  status: string;
  campaign_id?: string | number;
}

// CRM ENGINE TYPES
export interface AutomationRule {
  id: string | number;
  title: string;
  conditions: {
    field: string;
    operator: 'EQUALS' | 'NOT_EQUALS' | 'CONTAINS';
    value: string;
  }[];
  created_at?: string;
}

export interface Campaign {
  id: string | number;
  title: string;
  status: 'DRAFT' | 'RUNNING' | 'PAUSED' | 'COMPLETED';
  total_targets: number;
  sent_count: number;
  created_at?: string;
}

export interface SurveyQuestion {
  id: string;
  text: string;
  type: 'text' | 'select' | 'boolean' | 'number' | 'multimedia' | 'repeater' | 'date';
  options?: string[];
  required?: number | boolean;
  mapping_tag?: string;
  pilar?: string;
  filterable?: boolean;
  slug?: string;
  logic_parent_id?: string;
  logic_trigger_value?: string;
  media_url?: string;
  media_type?: 'image' | 'video' | 'audio';
  auto_play?: boolean;
  content_html?: string;
}

export interface Survey {
  id: string | number;
  title: string;
  description: string;
  type: string;
  status: string;
  questions: SurveyQuestion[] | string;
  whatsapp_trigger_enabled?: boolean;
  whatsapp_template_id?: string | number;
  next_survey_id?: string | number;
}

export interface SurveyResponse {
  id: string | number;
  survey_id: string | number;
  user_id: string | number;
  cpf: string;
  user_name: string;
  answers: any;
  created_at: string;
}

export interface Notice {
  id: string | number;
  title: string;
  content: string;
  urgency: 'LOW' | 'MEDIUM' | 'HIGH';
  date: string;
  created_at?: string;
}

export interface AgendaEvent {
  id: string | number;
  title: string;
  description: string;
  date: string;
  type: 'MEETING' | 'MAINTENANCE' | 'DEADLINE' | 'EVENT';
  status: 'UPCOMING' | 'FINISHED' | 'SCHEDULED';
  location?: string;
}

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
}

export interface MarketItem {
  id: string | number;
  title: string;
  description: string;
  category: 'GOODS' | 'FOOD' | 'SERVICE';
  price: number | string;
  whatsapp?: string;
  merchant_id?: string | number;
}

export interface CameraDevice {
  id: string | number;
  name: string;
  url: string;
  location: string;
  status: 'ACTIVE' | 'INACTIVE';
}

export interface Asset {
  id: string | number;
  name: string;
  category: string;
  value: number | string;
  status: string;
  date_acquired: string;
  responsible_id?: string | number;
}

export interface TerritorialUnit {
  id: string | number;
  label: string;
  street_name: string;
}

export type DocStatus = 'DRAFT' | 'REVIEW' | 'APPROVED' | 'SIGNED' | 'SENT' | 'ARCHIVED';

export interface WhatsAppConfig {
  api_key: string;
  sender: string;
  footer: string;
  gateway_url: string;
  webhook_url: string;
  billing_reminder_2d: boolean;
  billing_reminder_1d: boolean;
  late_reminder: boolean;
  welcome_msg: boolean;
}

export interface AIKey {
  id: string | number;
  label: string;
  key_value: string;
  provider: string;
  model?: string;
  tier?: string;
  status: string;
  priority: number;
  error_count: number;
  last_checked?: string;
  created_at?: string;
}

export interface MessengerButton {
  type: 'url' | 'call' | 'copy';
  displayText: string;
  url?: string;
  phoneNumber?: string;
  copyText?: string;
}
