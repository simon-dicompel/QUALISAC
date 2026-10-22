export type UserRole = 'ADMIN' | 'SAC' | 'QUALIDADE' | 'COMUM';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  passwordHash?: string; // stored simple password
  tenantId: string;
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
  name: string; // Categoria Pai
  subcategories: string[]; // Subcategorias (Filho)
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
  category?: string; // Categoria Pai
  subcategory?: string; // Subcategoria
}

export interface TicketItem {
  id: string;
  productCode: string;
  productName: string;
  productLine?: string; // Linha do Produto que está sendo devolvida (ex: Simon 19, 20, 30, etc.)
  quantity: number;
  defectCategory?: string; // Defeito - Categoria PAI
  defectSubcategory?: string; // Defeito - SUB categoria
  notes?: string; // Observação específica do item
  invoiceNumber?: string; // Número da Nota Fiscal
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
  tenantId: string;
  
  // Informações do Cliente
  clientName: string; // Consumidor / Cliente (mantido para compatibilidade total)
  customerName: string; // Nome do Consumidor final (obrigatório)
  resellerName?: string; // Nome da Revenda (não obrigatória)
  firstContactDate: string; // Data do Primeiro contato

  // Descrição do Produto Devolvido Principal
  productCode: string; // Código do Produto
  productName: string; // Descrição do Produto
  productLine?: string; // Linha do Produto que está sendo devolvida
  quantity: number; // Quantidade Devolvida
  batch?: string; // Lote (opcional)
  invoiceNumber?: string; // Número da Nota Fiscal
  notes?: string; // Observação
  description: string; // Observação e relato detalhado

  // Defeito (Categoria PAI e SUB Categoria)
  issueType: IssueType; // Categoria PAI do defeito
  subCategory?: string; // SUB categoria do defeito
  defects?: TicketDefect[];

  // Multiplos SKUs / Produtos Devolvidos no mesmo chamado
  items?: TicketItem[];

  // Informações Logísticas / Devolução
  freightCost?: number; // Valor de Frete (opcional)
  shippingValue?: number; // compatibilidade
  pacReversoRequested: boolean | string; // Solicitado o PAC Reverso ('Sim' | 'Não')
  requestedReversePac?: string; // compatibilidade
  pacReversoCode?: string; // Código de autorização ou rastreio do PAC Reverso (se houver)
  returnUF: string; // UF da Devolução (ex: SP, SC, MG, RJ...)
  registeredUf?: string; // compatibilidade

  // Contatos e Notificações (E-mails e Observadores)
  clientEmail?: string; // E-mail do cliente ou consumidor solicitante
  observers?: string[]; // E-mails dos observadores em cópia que acompanham e interagem no chamado

  // Controle de Ciclo de Vida do Chamado
  status: TicketStatus;
  createdAt: string;
  updatedAt: string;
  userId: string; // Atendente SAC que abriu o chamado
  userName: string; // Nome do atendente SAC
  files: TicketFile[];
  comments: TicketComment[];
  qualityReport?: QualityReport;
  reminders?: TicketReminder[];
  history: HistoryStep[];

  // Campos legados para compatibilidade reversa
  reseller?: string;
  consumer?: string;
}

export interface SystemEmailLog {
  id: string;
  timestamp: string;
  ticketId: string;
  sender: string;
  recipientName: string;
  recipientEmail: string;
  ccEmails?: string[]; // Observadores em cópia
  actionType: 'abertura' | 'atualizacao_status' | 'laudo_qualidade' | 'interacao_comentario' | 'atualizacao_geral';
  status?: string; // Status associado (Aberto, Em analise, Em tratativa, Resolvido, Finalizado)
  subject: string;
  body: string;
  serviceType: string; // e.g., "SMTP Broker / Notificação Automatizada Simon Dicompel"
}

export interface Product {
  code: string; // SKU code
  name: string; // Descriptive name
  producedQty?: number; // Total quantity produced
  line?: string; // Product line (e.g., "Simon 19", "Simon 20", "Simon 30", "Simon 35", "Simon Connect", "Novara")
}
