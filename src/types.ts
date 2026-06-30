export type UserRole = 'ADMIN' | 'SAC' | 'QUALIDADE' | 'COMUM';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash?: string; // stored simple password
  tenantId: string; // for SaaS multi-client support
}

export interface Tenant {
  id: string;
  name: string;
  plan: 'Growth' | 'Enterprise' | 'Trial';
  status: 'Ativo' | 'Suspenso' | 'A vencer';
  createdAt: string;
  color: string;
}

export type IssueType = string;

export interface IssueTypeCategory {
  id: string;
  name: string;
  subcategories: string[];
}

export type TicketStatus = 'Aberto' | 'Em analise' | 'Em tratativa' | 'Resolvido' | 'Finalizado';

export interface TicketFile {
  id: string;
  name: string;
  size: string;
  type: string;
  url: string; // simulated url (data-url or placeholder icon)
}

export interface QualityReport {
  rootCause: string; // Causa Raiz
  fiveWhys: string[]; // 5 Porquês
  correctiveAction: string; // Ação Corretiva
  preventiveAction: string; // Ação Preventiva
  responsible: string;
  targetDate: string;
  updatedAt: string;
}

export interface TicketComment {
  id: string;
  ticketId: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  text: string;
  createdAt: string;
}

export interface HistoryStep {
  id: string;
  ticketId: string;
  action: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  details?: string;
  timestamp: string;
}

export interface TicketDefect {
  id: string;
  description: string; // e.g. "Mau contato", "Sem parafuso", "Peca riscada"
  quantity: number;
}

export interface TicketItem {
  id: string;
  productCode: string;
  productName: string;
  quantity: number;
}

export interface TicketReminder {
  id: string;
  text: string;
  dueDate: string;
  priority: 'Baixa' | 'Média' | 'Alta';
  completed: boolean;
  createdAt: string;
}

export interface Ticket {
  id: string;
  tenantId: string; // SaaS support
  productCode: string;
  productName: string;
  batch?: string; // Lote (opcional)
  clientName: string;
  issueType: IssueType;
  subCategory?: string;
  quantity: number;
  description: string;
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  userId: string; // SAC who opened it
  userName: string; // SAC name
  files: TicketFile[];
  comments: TicketComment[];
  qualityReport?: QualityReport;
  defects?: TicketDefect[];
  reminders?: TicketReminder[];
  history: HistoryStep[];
  firstContactDate?: string; // Data do primeiro contato do cliente
  invoiceNumber?: string; // Número da nota fiscal
  items?: TicketItem[];
  // Novos campos específicos
  reseller?: string; // Revenda
  consumer?: string; // Consumidor
  shippingValue?: number; // Valor Frete
  requestedReversePac?: string; // Solicitado PAC Reverso (Ex: 'Sim' | 'Não')
  registeredUf?: string; // UF cadastrado
}

export interface SystemEmailLog {
  id: string;
  timestamp: string;
  ticketId: string;
  sender: string;
  recipientName: string;
  recipientEmail: string;
  status: 'Resolvido' | 'Finalizado';
  subject: string;
  body: string;
  serviceType: string; // e.g., "SMS / Email SMTP Broker (Simulado)"
}

export interface Product {
  code: string; // SKU code
  name: string; // Descriptive name
  producedQty?: number; // Total quantity produced
  line?: string; // Product line (e.g., "Novara")
}

