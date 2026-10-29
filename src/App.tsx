import React, { useState, useEffect, useRef } from 'react';
import { 
  User, 
  Tenant, 
  Ticket, 
  TicketStatus, 
  IssueType, 
  TicketComment, 
  QualityReport, 
  HistoryStep,
  TicketFile,
  SystemEmailLog,
  Product,
  IssueTypeCategory,
  TicketReminder
} from './types';
import { INITIAL_USERS, INITIAL_TENANTS, INITIAL_TICKETS, INITIAL_ISSUE_TYPES, INITIAL_PRODUCTS } from './initialData';
import { SimonDicompelLogo } from './components/SimonDicompelLogo';
import { DashboardView } from './components/DashboardView';
import { TicketList } from './components/TicketList';
import { TicketDetails } from './components/TicketDetails';
import { NewTicketModal } from './components/NewTicketModal';
import { AdminConfigView } from './components/AdminConfigView';
import { SmtpConfigModal } from './components/SmtpConfigModal';
import { 
  LayoutDashboard, 
  FileText, 
  ShieldCheck, 
  Sliders, 
  LogOut, 
  Lock, 
  Building2, 
  Layers, 
  CheckCircle, 
  TrendingUp, 
  BookOpen,
  PlusCircle,
  Clock,
  Sparkles,
  RefreshCw,
  FolderSync,
  ChevronRight,
  Terminal,
  Mail,
  Trash2,
  Bell,
  Send,
  Settings,
  Search,
  Plus,
  X
} from 'lucide-react';

export default function App() {
  // Prerecorded clean defaults for testing
  const DEFAULT_TEST_TENANT: Tenant = INITIAL_TENANTS[0];

  const DEFAULT_TEST_USER: User = INITIAL_USERS[0];

  // Limpeza e migração para produção: Mantém exclusivamente o Administrador Dicompel
  React.useEffect(() => {
    const isProdWiped = localStorage.getItem('q_prod_dicompel_release_v1');
    if (!isProdWiped) {
      const prodAdmin: User = {
        id: 'user_dicompel_admin',
        name: 'Administrador Dicompel',
        email: 'admin@dicompel.com.br',
        role: 'ADMIN',
        passwordHash: 'Dicompel!@#2026',
        tenantId: 'tenant_1',
      };

      localStorage.setItem('q_users', JSON.stringify([prodAdmin]));
      localStorage.removeItem('q_currentUser'); // Usuário inicia na tela de login
      localStorage.setItem('q_is_production_mode', 'true');
      localStorage.setItem('q_prod_dicompel_release_v1', 'true');

      // Atualiza o estado da aplicação
      setUsers([prodAdmin]);
      setCurrentUser(null);
    }
  }, []);

  // --- 1. Persistent Database Engine (Dual-layer: Server/Azure SQL + LocalStorage) ---
  const [tenants, setTenants] = useState<Tenant[]>(() => {
    const saved = localStorage.getItem('q_tenants');
    return saved ? JSON.parse(saved) : INITIAL_TENANTS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('q_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [tickets, setTickets] = useState<Ticket[]>(() => {
    const saved = localStorage.getItem('q_tickets');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Rejeita chamados de amostra residuais para manter a base limpa
          const clean = parsed.filter((t: any) => 
            !t.id?.startsWith('SAC-0001') && 
            !t.id?.startsWith('DEV-0001') &&
            t.customerName !== 'Construtora Horizonte Ltda' &&
            t.productCode !== 'SIM-19011'
          );
          return clean;
        }
      } catch (e) {}
    }
    return [];
  });

  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('q_currentUser');
    if (saved && saved !== 'null') {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null; // Production default: start in login screen
  });

  const [activeTenant, setActiveTenant] = useState<Tenant>(() => {
    const savedT = localStorage.getItem('q_activeTenant');
    if (savedT) return JSON.parse(savedT);
    return INITIAL_TENANTS[0];
  });

  const [systemEmailLogs, setSystemEmailLogs] = useState<SystemEmailLog[]>(() => {
    const saved = localStorage.getItem('q_systemEmailLogs');
    return saved ? JSON.parse(saved) : [];
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem('q_products');
    if (saved !== null) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Rejeita produtos de amostra residuais para manter a base limpa
          const clean = parsed.filter((p: any) => 
            p.code !== 'SIM-19011' && 
            p.code !== 'SIM-19022' && 
            p.code !== 'SIM-20033' &&
            p.code !== 'DIC-1001'
          );
          return clean;
        }
      } catch (e) {}
    }
    return [];
  });

  const [dbStatus, setDbStatus] = useState<{
    connected: boolean;
    type: 'azure-sql' | 'local-persisted';
    host: string;
    database: string;
    message: string;
  }>({
    connected: false,
    type: 'local-persisted',
    host: 'sql-qualisac-dicompel.database.windows.net',
    database: 'qualisac_db',
    message: 'Carregando status do banco...'
  });

  // Efeito de sincronização com o banco de dados no carregamento da aplicação
  useEffect(() => {
    // 1. Limpeza garantida de dados de exemplo em navegadores que tinham cache antigo
    const isWipedV4 = localStorage.getItem('q_prod_dicompel_clean_v4');
    if (!isWipedV4) {
      localStorage.removeItem('q_tickets');
      localStorage.removeItem('q_products');
      localStorage.setItem('q_prod_dicompel_clean_v4', 'true');
      fetch('/api/database/wipe-samples', { method: 'POST' }).catch(() => {});
    }

    // 2. Carrega todos os dados gravados no servidor / Azure SQL
    fetch('/api/data')
      .then(async (res) => {
        if (!res.ok) return null;
        const ct = res.headers.get('content-type') || '';
        if (!ct.includes('application/json')) return null;
        return res.json().catch(() => null);
      })
      .then((data) => {
        if (data && data.success) {
          if (Array.isArray(data.tickets)) {
            const cleanTickets = data.tickets.filter((t: any) => 
              !t.id?.startsWith('SAC-0001') && 
              !t.id?.startsWith('DEV-0001') &&
              t.customerName !== 'Construtora Horizonte Ltda' &&
              t.productCode !== 'SIM-19011'
            );
            setTickets(cleanTickets);
            localStorage.setItem('q_tickets', JSON.stringify(cleanTickets));
          }
          if (Array.isArray(data.products)) {
            const cleanProducts = data.products.filter((p: any) => 
              p.code !== 'SIM-19011' && 
              p.code !== 'SIM-19022' && 
              p.code !== 'SIM-20033' &&
              p.code !== 'DIC-1001'
            );
            setProducts(cleanProducts);
            localStorage.setItem('q_products', JSON.stringify(cleanProducts));
          }
          if (Array.isArray(data.users) && data.users.length > 0) {
            setUsers(data.users);
            localStorage.setItem('q_users', JSON.stringify(data.users));
          }
          if (data.dbStatus) {
            setDbStatus(data.dbStatus);
          }
        }
      })
      .catch((err) => {
        console.warn('[Sync] Falha ao sincronizar dados do servidor:', err);
      });
  }, []);

  const [issueTypes, setIssueTypes] = useState<IssueTypeCategory[]>(() => {
    const saved = localStorage.getItem('q_issueTypes');
    if (!saved) return INITIAL_ISSUE_TYPES;
    try {
      const parsed = JSON.parse(saved);
      if (parsed.length > 0 && typeof parsed[0] === 'string') {
        return INITIAL_ISSUE_TYPES;
      }
      return parsed;
    } catch {
      return INITIAL_ISSUE_TYPES;
    }
  });

  // Sidebar navigation router State
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'chamados' | 'normas' | 'admin-config'>('chamados');
  
  // Global search input state (filters tickets in real-time)
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // Global ticket status filter state linked with Dashboard clicks
  const [dashboardStatusFilter, setDashboardStatusFilter] = useState<string>('all');
  
  // Selected single ticket state for detailed work area
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // New ticket modal trigger
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isSpecialTicketMode, setIsSpecialTicketMode] = useState(false);
  const [modalTicketType, setModalTicketType] = useState<'SAC' | 'DEVOLUÇÃO' | 'NÃO CONFORMIDADE'>('SAC');
  const [isSmtpModalOpen, setIsSmtpModalOpen] = useState(false);

  // Login credentials state
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');

  // Save changes to localStorage on any updates
  useEffect(() => {
    localStorage.setItem('q_tenants', JSON.stringify(tenants));
  }, [tenants]);

  useEffect(() => {
    localStorage.setItem('q_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('q_products', JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem('q_issueTypes', JSON.stringify(issueTypes));
  }, [issueTypes]);

  useEffect(() => {
    localStorage.setItem('q_tickets', JSON.stringify(tickets));
  }, [tickets]);

  useEffect(() => {
    localStorage.setItem('q_systemEmailLogs', JSON.stringify(systemEmailLogs));
  }, [systemEmailLogs]);

  // Ref para rastrear as IDs de chamados que já foram "vistas" nesta sessão para não disparar notificações retroativas no primeiro carregamento
  const seenTicketIdsRef = useRef<Set<string>>(new Set<string>());

  // Solicita permissão para notificações do navegador na inicialização
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // Monitoramento de novos chamados via API de notificações do navegador
  useEffect(() => {
    if (!currentUser) return;

    // Se o conjunto de vistos estiver vazio, preenche com as IDs dos chamados existentes e sai
    if (seenTicketIdsRef.current.size === 0) {
      tickets.forEach((ticket) => seenTicketIdsRef.current.add(ticket.id));
      return;
    }

    // Filtra apenas chamados que NUNCA foram processados nesta sessão
    const newTickets = tickets.filter((ticket) => !seenTicketIdsRef.current.has(ticket.id));

    newTickets.forEach((ticket) => {
      // Registrar no conjunto para não disparar novamente
      seenTicketIdsRef.current.add(ticket.id);

      // Dispara a notificação de navegador apenas se pertencer ao Tenant específico do usuário logado
      if (ticket.tenantId === currentUser.tenantId) {
        if ('Notification' in window) {
          if (Notification.permission === 'granted') {
            try {
              new Notification(`Novo Chamado - ${ticket.id}`, {
                body: `Produto: ${ticket.productName}\nMotivo: ${ticket.issueType}${ticket.subCategory ? ` (${ticket.subCategory})` : ''}\nQuantidade: ${ticket.quantity} un.`,
                icon: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=128',
              });
            } catch (e) {
              console.warn('Erro ao disparar notificação: ', e);
            }
          } else if (Notification.permission !== 'denied') {
            Notification.requestPermission().then((permission) => {
              if (permission === 'granted') {
                try {
                  new Notification(`Novo Chamado - ${ticket.id}`, {
                    body: `Produto: ${ticket.productName}\nMotivo: ${ticket.issueType}${ticket.subCategory ? ` (${ticket.subCategory})` : ''}`,
                  });
                } catch (e) {
                  console.warn('Erro ao disparar notificação pós-permissão: ', e);
                }
              }
            });
          }
        }
      }
    });
  }, [tickets, currentUser]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('q_currentUser', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('q_currentUser');
    }
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('q_activeTenant', JSON.stringify(activeTenant));
  }, [activeTenant]);

  useEffect(() => {
    localStorage.setItem('q_systemEmailLogs', JSON.stringify(systemEmailLogs));
  }, [systemEmailLogs]);

  // Em operação exclusiva Simon Dicompel, exibe todos os chamados da empresa
  const activeTenantTickets = tickets;

  // Multi-tenant selection helper
  const handleSelectTenant = (tenantId: string) => {
    const foundTenant = tenants.find((t) => t.id === tenantId);
    if (foundTenant) {
      setActiveTenant(foundTenant);
      
      // Select the first user of the new tenant automatically to ease simulation
      const tenantUsers = users.filter((u) => u.tenantId === tenantId);
      if (tenantUsers.length > 0) {
        setCurrentUser(tenantUsers[0]);
      }
      
      // Close open ticket view when switching clients
      setSelectedTicketId(null);
    }
  };

  // Switch active logged-in user in simulation banner
  const handleSwitchUser = (userId: string) => {
    const foundUser = users.find((u) => u.id === userId);
    if (foundUser) {
      setCurrentUser(foundUser);
    }
  };

  // --- 3. Authorization controls ---
  const canCreateTicket = currentUser?.role === 'SAC' || currentUser?.role === 'ADMIN';

  // --- 4. Authentic workflows ---
  
  // A. Log in
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');

    const found = users.find(
      (u) => 
        u.email.toLowerCase().trim() === loginEmail.toLowerCase().trim() && 
        u.passwordHash === loginPassword
    );

    if (found) {
      setCurrentUser(found);
      const userTenant = tenants.find((t) => t.id === found.tenantId);
      if (userTenant) {
        setActiveTenant(userTenant);
      }
      setLoginEmail('');
      setLoginPassword('');
    } else {
      setLoginError('Email de acesso ou senha incorretos. Por favor, verifique suas credenciais corporativas.');
    }
  };

  // B. Close Session
  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedTicketId(null);
  };

  // Centralized automated email dispatcher for client and observers
  const sendAutomatedTicketEmail = (
    ticket: Ticket,
    actionType: 'abertura' | 'atualizacao_status' | 'laudo_qualidade' | 'interacao_comentario' | 'atualizacao_geral',
    subject: string,
    introMessage: string,
    extraDetails?: string,
    forcedStatus?: string
  ) => {
    const timestamp = new Date().toISOString();
    const recipientName = ticket.customerName || ticket.clientName || 'Cliente';
    const cleanEmailBase = recipientName.toLowerCase().replace(/[^a-z0-9]/g, '');
    const recipientEmail = ticket.clientEmail?.trim() || `${cleanEmailBase || 'contato'}@cliente-simon.com.br`;

    // Reúne todos os observadores e o e-mail adicional
    const ccList = new Set<string>();
    if (ticket.observerEmail?.trim()) ccList.add(ticket.observerEmail.trim().toLowerCase());
    if (ticket.observers && Array.isArray(ticket.observers)) {
      ticket.observers.forEach((o) => {
        if (o && o.trim()) ccList.add(o.trim().toLowerCase());
      });
    }
    const ccEmails = Array.from(ccList);

    const itemsSummary = ticket.items && ticket.items.length > 0
      ? ticket.items.map(i => `• ${i.productCode} - ${i.productName} (Qtd: ${i.quantity} un) [Linha: ${i.productLine || 'Simon'}] | Defeito: ${i.defectCategory || ticket.issueType}`).join('\n')
      : `• ${ticket.productCode} - ${ticket.productName} (Qtd: ${ticket.quantity} un) [Linha: ${ticket.productLine || 'Simon 20'}]`;

    const body = `Prezado(a) ${recipientName},\n\n` +
      `${introMessage}\n\n` +
      `------------------------------------------------------------\n` +
      `DADOS DO CHAMADO - SIMON DICOMPEL\n` +
      `Código do Chamado: ${ticket.id}\n` +
      `Tipo: ${ticket.ticketType || (ticket.id.startsWith('DEV') ? 'DEVOLUÇÃO' : ticket.id.startsWith('NCO') ? 'NÃO CONFORMIDADE' : 'SAC')}\n` +
      `Status Atual: ${(forcedStatus || ticket.status).toUpperCase()}\n` +
      `Data de Entrada: ${new Date(ticket.createdAt).toLocaleDateString('pt-BR')}\n` +
      `Consumidor Final: ${ticket.customerName || ticket.clientName}\n` +
      (ticket.resellerName ? `Revenda: ${ticket.resellerName}\n` : '') +
      (ticket.invoiceNumber ? `Nota Fiscal: ${ticket.invoiceNumber}\n` : '') +
      (ticket.batch ? `Lote Fabril: ${ticket.batch}\n` : '') +
      (ticket.pacReversoRequested ? `PAC Reverso: ${ticket.pacReversoRequested} ${ticket.pacReversoCode ? `(Cód: ${ticket.pacReversoCode})` : ''}\n` : '') +
      `------------------------------------------------------------\n` +
      `PRODUTOS / ITENS DO CHAMADO:\n` +
      `${itemsSummary}\n\n` +
      (extraDetails ? `INFORMAÇÕES ADICIONAIS & TRATATIVA:\n${extraDetails}\n\n` : '') +
      `OBSERVADORES EM CÓPIA:\n` +
      (ccEmails.length > 0 ? ccEmails.map(c => `• ${c}`).join('\n') : '• qualidade@dicompel.com.br') + `\n\n` +
      `Este e-mail foi gerado automaticamente pelo Sistema Simon Dicompel QualiSAC em conformidade com as diretivas ISO 9001.\n` +
      `Para interagir neste chamado, responda a este e-mail ou acesse o portal do SAC.`;

    const emailLog: SystemEmailLog = {
      id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      timestamp,
      ticketId: ticket.id,
      sender: 'sac@dicompel.com.br',
      recipientName,
      recipientEmail,
      ccEmails,
      actionType,
      status: forcedStatus || ticket.status,
      subject,
      body,
      serviceType: 'SMTP Broker sac@dicompel.com.br',
      deliveryStatus: 'pending_smtp',
    };

    setSystemEmailLogs((prev) => [emailLog, ...prev]);

    // Dispara requisição HTTP ao endpoint Express com Nodemailer
    fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: recipientEmail,
        cc: ccEmails,
        subject,
        body,
        ticketId: ticket.id,
      }),
    })
      .then(async (res) => {
        const data = await res.json().catch(() => null);
        if (!data) return;
        setSystemEmailLogs((prev) =>
          prev.map((l) => {
            if (l.id === emailLog.id) {
              if (data.success) {
                return {
                  ...l,
                  deliveryStatus: 'sent',
                  serviceType: `SMTP sac@dicompel.com.br (Entregue)`,
                  messageId: data.messageId,
                };
              } else if (data.status === 'NEEDS_CONFIGURATION') {
                return {
                  ...l,
                  deliveryStatus: 'pending_smtp',
                  serviceType: 'Pendente Configuração SMTP (.env)',
                  errorMessage: data.message,
                };
              } else {
                return {
                  ...l,
                  deliveryStatus: 'failed',
                  serviceType: 'Falha no Servidor SMTP',
                  errorMessage: data.error || 'Erro ao conectar ao servidor de e-mail',
                };
              }
            }
            return l;
          })
        );
      })
      .catch((err) => {
        console.warn('[Email Client] Falha ao chamar /api/send-email:', err);
      });
  };

  // C. Open Return/Non-Conformity Ticket
  const handleCreateTicket = (data: {
    ticketType?: 'SAC' | 'DEVOLUÇÃO' | 'NÃO CONFORMIDADE';
    customerName: string;
    resellerName?: string;
    firstContactDate: string;
    clientName: string;
    clientEmail?: string;
    observerEmail?: string;
    observers?: string[];
    productCode: string;
    productName: string;
    productLine: string;
    quantity: number;
    batch?: string;
    invoiceNumber?: string;
    notes?: string;
    description: string;
    issueType: string;
    subCategory: string;
    defects?: any[];
    items?: any[];
    freightCost?: number;
    shippingValue?: number;
    pacReversoRequested: string;
    requestedReversePac?: string;
    pacReversoCode?: string;
    returnUF: string;
    registeredUf?: string;
    reseller?: string;
    consumer?: string;
  }) => {
    if (!currentUser) return;

    // ID prefix generation based on selected type:
    // SAC -> SAC-0001
    // DEVOLUÇÃO -> DEV-0001
    // NÃO CONFORMIDADE -> NCO-0001
    const tType = data.ticketType || 'SAC';
    const prefix = tType === 'DEVOLUÇÃO' ? 'DEV' : tType === 'NÃO CONFORMIDADE' ? 'NCO' : 'SAC';
    const samePrefixTickets = tickets.filter((t) => t.id.startsWith(`${prefix}-`));
    let nextSeq = samePrefixTickets.length + 1;
    let newId = `${prefix}-${String(nextSeq).padStart(4, '0')}`;
    while (tickets.some((t) => t.id === newId)) {
      nextSeq++;
      newId = `${prefix}-${String(nextSeq).padStart(4, '0')}`;
    }

    const timestamp = new Date().toISOString();
    const sacDetails = [
      `Tipo: ${tType}`,
      data.resellerName ? `Revenda: ${data.resellerName}` : null,
      data.customerName ? `Consumidor: ${data.customerName}` : null,
      data.productLine ? `Linha: ${data.productLine}` : null,
      data.invoiceNumber ? `NF: ${data.invoiceNumber}` : null,
      data.freightCost !== undefined ? `Frete: R$ ${data.freightCost.toFixed(2)}` : null,
      data.pacReversoRequested ? `PAC Reverso: ${data.pacReversoRequested}` : null,
      data.pacReversoCode ? `Rastreio: ${data.pacReversoCode}` : null,
      data.returnUF ? `UF: ${data.returnUF}` : null,
    ].filter(Boolean).join(', ');

    const newHist: HistoryStep = {
      id: `h_${Date.now()}`,
      ticketId: newId,
      action: `Abertura de Chamado [${tType}]`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      details: `${currentUser.name} registrou ocorrência [${tType}] de ${data.quantity} unidades (${data.items && data.items.length > 1 ? `${data.items.length} SKUs` : data.productName}) por motivo de ${data.issueType}${data.subCategory ? ` (${data.subCategory})` : ''}. Lote: ${data.batch || 'Não Informado'}${sacDetails ? ` | [Dados SAC] ${sacDetails}` : ''}`,
      timestamp,
    };

    const newTicket: Ticket = {
      id: newId,
      tenantId: activeTenant.id,
      ticketType: tType,
      customerName: data.customerName,
      resellerName: data.resellerName,
      clientName: data.customerName,
      firstContactDate: data.firstContactDate,
      clientEmail: data.clientEmail,
      observerEmail: data.observerEmail,
      observers: data.observers,
      productCode: data.productCode,
      productName: data.productName,
      productLine: data.productLine,
      quantity: data.quantity,
      batch: data.batch,
      invoiceNumber: data.invoiceNumber,
      notes: data.notes,
      description: data.description,
      issueType: data.issueType,
      subCategory: data.subCategory,
      defects: data.defects || [],
      items: data.items,
      freightCost: data.freightCost,
      shippingValue: data.freightCost,
      pacReversoRequested: data.pacReversoRequested,
      requestedReversePac: data.pacReversoRequested,
      pacReversoCode: data.pacReversoCode,
      returnUF: data.returnUF,
      registeredUf: data.returnUF,
      status: 'Aberto',
      createdAt: timestamp,
      updatedAt: timestamp,
      userId: currentUser.id,
      userName: currentUser.name,
      files: [],
      comments: [],
      history: [newHist],
      reseller: data.resellerName,
      consumer: data.customerName,
    };

    setTickets((prev) => [newTicket, ...prev]);

    // Persiste imediatamente no banco de dados (Azure SQL + Backup em Disco)
    fetch('/api/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newTicket),
    }).catch((err) => console.error('[API] Erro ao sincronizar abertura de chamado no banco:', err));

    // Dispara e-mail automático para o cliente e observadores sobre a abertura do chamado
    sendAutomatedTicketEmail(
      newTicket,
      'abertura',
      `[Simon Dicompel] Abertura de Chamado ${newTicket.id} - ${newTicket.customerName} [Status: Aberto]`,
      `Confirmamos a abertura do chamado ${newTicket.id} (${tType}) em nosso sistema Simon Dicompel. Todas as pessoas envolvidas receberão atualizações automáticas do andamento.`,
      `Relato da ocorrência:\n"${newTicket.description}"`
    );

    setIsNewTicketModalOpen(false);
    setSelectedTicketId(newId); // open it immediately
    setActiveMenu('chamados');
  };

  // Helper centralizado para persistência de atualizações de chamados na API/Banco
  const persistTicketUpdate = (updatedTicket: Ticket) => {
    fetch(`/api/tickets/${updatedTicket.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedTicket),
    }).catch((err) => console.error(`[API] Erro ao sincronizar chamado ${updatedTicket.id} no banco:`, err));
  };

  // D. Update Status & Log Action + Dispara E-mails Automáticos
  const handleUpdateStatus = (ticketId: string, newStatus: TicketStatus) => {
    if (!currentUser) return;

    const currentTicket = tickets.find((t) => t.id === ticketId);
    if (!currentTicket) return;

    // Dispara e-mail automático para cliente e observadores sobre a transição de status
    sendAutomatedTicketEmail(
      currentTicket,
      'atualizacao_status',
      `[Simon Dicompel] Atualização de Status: Chamado ${ticketId} -> ${newStatus.toUpperCase()}`,
      `O chamado ${ticketId} teve seu status alterado para "${newStatus.toUpperCase()}" por ${currentUser.name} (${currentUser.role}).`,
      currentTicket.qualityReport
        ? `Diagnóstico de Qualidade:\n- Causa Raiz: ${currentTicket.qualityReport.rootCause}\n- Ação Corretiva: ${currentTicket.qualityReport.correctiveAction}\n- Responsável: ${currentTicket.qualityReport.responsible}`
        : undefined,
      newStatus
    );

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const timestamp = new Date().toISOString();
          const newHist: HistoryStep = {
            id: `h_${Date.now()}`,
            ticketId,
            action: `Alterou Status para ${newStatus}`,
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            details: `Status modificado para: '${newStatus}'. Notificação por e-mail despachada para os envolvidos.`,
            timestamp,
          };
          
          const updated = {
            ...t,
            status: newStatus,
            updatedAt: timestamp,
            history: [...t.history, newHist],
          };
          persistTicketUpdate(updated);
          return updated;
        }
        return t;
      })
    );
  };

  // E. Update Ticket Reminders / Subtasks (com avanço automático de status para Resolvido quando todas concluídas)
  const handleUpdateReminders = (ticketId: string, reminders: TicketReminder[]) => {
    if (!currentUser) return;

    const currentTicket = tickets.find((t) => t.id === ticketId);
    if (!currentTicket) return;

    const allDone = reminders.length > 0 && reminders.every(r => r.completed);
    let nextStatus = currentTicket.status;
    if (allDone && (currentTicket.status === 'Em tratativa' || currentTicket.status === 'Em analise' || currentTicket.status === 'Aberto')) {
      nextStatus = 'Resolvido';
    }

    if (allDone && nextStatus === 'Resolvido' && currentTicket.status !== 'Resolvido') {
      sendAutomatedTicketEmail(
        { ...currentTicket, reminders, status: 'Resolvido' },
        'atualizacao_status',
        `[Simon Dicompel] Tarefas Concluídas - Chamado ${ticketId} [Status: RESOLVIDO]`,
        `Todas as tarefas e ações operacionais do chamado ${ticketId} foram concluídas com sucesso. O status foi atualizado automaticamente para RESOLVIDO.`,
        `Checklist finalizado:\n${reminders.map(r => `✓ ${r.text}`).join('\n')}`,
        'Resolvido'
      );
    }

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const timestamp = new Date().toISOString();
          const newHist: HistoryStep = {
            id: `h_${Date.now()}_reminders`,
            ticketId,
            action: nextStatus !== t.status ? `Tarefas Concluídas (Status: ${nextStatus})` : 'Lembretes Atualizados',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            details: `Tarefas e lembretes atualizados. Concluídas: ${reminders.filter(r => r.completed).length}/${reminders.length}.${nextStatus !== t.status ? ` Status avançado automaticamente para ${nextStatus}.` : ''}`,
            timestamp,
          };

          const updated = {
            ...t,
            reminders,
            status: nextStatus,
            updatedAt: timestamp,
            history: [...t.history, newHist],
          };
          persistTicketUpdate(updated);
          return updated;
        }
        return t;
      })
    );
  };

  // F. Add Comment (Chat) (avança status de 'Aberto' para 'Em analise' automaticamente e notifica envolvidos)
  const handleAddComment = (ticketId: string, text: string) => {
    if (!currentUser) return;

    const currentTicket = tickets.find((t) => t.id === ticketId);
    if (!currentTicket) return;

    let nextStatus = currentTicket.status;
    if (currentTicket.status === 'Aberto') {
      nextStatus = 'Em analise';
    }

    const newComm: TicketComment = {
      id: `c_${Date.now()}`,
      ticketId,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      text,
      createdAt: new Date().toISOString(),
    };

    // Dispara e-mail automático notificando a nova mensagem
    sendAutomatedTicketEmail(
      { ...currentTicket, status: nextStatus },
      'interacao_comentario',
      `[Simon Dicompel] Nova Mensagem no Chamado ${ticketId} por ${currentUser.name}`,
      `${currentUser.name} (${currentUser.role}) enviou uma nova interação no chamado ${ticketId}.`,
      `Mensagem:\n"${text}"`,
      nextStatus
    );

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const timestamp = new Date().toISOString();
          const newHist: HistoryStep = {
            id: `h_${Date.now()}_comment`,
            ticketId,
            action: nextStatus !== t.status ? `Comentário Adicionado (Status: ${nextStatus})` : 'Comentário Adicionado',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            details: `Comentário: "${text.substring(0, 45)}..."${nextStatus !== t.status ? ` | Status alterado automaticamente para ${nextStatus}.` : ''}`,
            timestamp,
          };

          const updated = {
            ...t,
            status: nextStatus,
            comments: [...t.comments, newComm],
            updatedAt: timestamp,
            history: [...t.history, newHist],
          };
          persistTicketUpdate(updated);
          return updated;
        }
        return t;
      })
    );
  };

  // G. Issue Root cause & corrective actions report (avança automaticamente para 'Em tratativa' e dispara e-mail)
  const handleUpdateQualityReport = (ticketId: string, report: QualityReport) => {
    if (!currentUser) return;

    const currentTicket = tickets.find((t) => t.id === ticketId);
    if (!currentTicket) return;

    let nextStatus = currentTicket.status;
    if (currentTicket.status === 'Aberto' || currentTicket.status === 'Em analise') {
      nextStatus = 'Em tratativa';
    }

    // Dispara e-mail automático com o laudo técnico
    sendAutomatedTicketEmail(
      { ...currentTicket, qualityReport: report, status: nextStatus },
      'laudo_qualidade',
      `[Simon Dicompel] Parecer Técnico Emitido - Chamado ${ticketId} [Status: ${nextStatus.toUpperCase()}]`,
      `O setor de Garantia da Qualidade emitiu o Parecer Técnico e Laudo de Não Conformidade para o chamado ${ticketId}. O chamado avançou automaticamente para o status "${nextStatus.toUpperCase()}".`,
      `PARECER TÉCNICO (ISO 9001):\n` +
      `- Causa Raiz: ${report.rootCause}\n` +
      (report.fiveWhys && report.fiveWhys.some(w => w.trim()) ? `- Metodologia 5 Porquês:\n  ${report.fiveWhys.filter(w => w.trim()).map((w, idx) => `P${idx+1}: ${w}`).join('\n  ')}\n` : '') +
      `- Ação Corretiva Imediata: ${report.correctiveAction}\n` +
      `- Ação Preventiva de Longo Prazo: ${report.preventiveAction || 'Em monitoramento'}\n` +
      `- Responsável Designado: ${report.responsible}\n` +
      `- Prazo Alvo: ${report.targetDate ? new Date(report.targetDate).toLocaleDateString('pt-BR') : 'A definir'}`,
      nextStatus
    );

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const timestamp = new Date().toISOString();
          const newHist: HistoryStep = {
            id: `h_${Date.now()}_report`,
            ticketId,
            action: `Parecer Técnico Salvo (Status: ${nextStatus})`,
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            details: `Causa Raiz inserida: "${report.rootCause.substring(0, 45)}...". Responsável: ${report.responsible}. Status atualizado para: ${nextStatus}. E-mail automático enviado aos envolvidos.`,
            timestamp,
          };

          const updated = {
            ...t,
            qualityReport: report,
            status: nextStatus,
            updatedAt: timestamp,
            history: [...t.history, newHist],
          };
          persistTicketUpdate(updated);
          return updated;
        }
        return t;
      })
    );
  };

  // H. Add file attachment (avança automaticamente para 'Em analise' se ainda em 'Aberto' e notifica)
  const handleAddFile = (ticketId: string, name: string, size: string, type: string, url: string) => {
    if (!currentUser) return;

    const currentTicket = tickets.find((t) => t.id === ticketId);
    if (!currentTicket) return;

    let nextStatus = currentTicket.status;
    if (currentTicket.status === 'Aberto') {
      nextStatus = 'Em analise';
    }

    const newFile: TicketFile = {
      id: `file_${Date.now()}`,
      name,
      size,
      type,
      url,
    };

    sendAutomatedTicketEmail(
      { ...currentTicket, status: nextStatus },
      'atualizacao_geral',
      `[Simon Dicompel] Nova Evidência Fotográfica Anexada no Chamado ${ticketId}`,
      `${currentUser.name} (${currentUser.role}) vinculou um novo anexo/evidência (${name}, ${size}) ao chamado ${ticketId}.`,
      `Arquivo: ${name} (${size})`,
      nextStatus
    );

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const timestamp = new Date().toISOString();
          const newHist: HistoryStep = {
            id: `h_${Date.now()}_file`,
            ticketId,
            action: nextStatus !== t.status ? `Arquivo Anexado (Status: ${nextStatus})` : 'Anexo de Comprovação Vinculado',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            details: `Arquivo anexado: ${name}${nextStatus !== t.status ? ` | Status alterado automaticamente para ${nextStatus}.` : ''}`,
            timestamp,
          };

          const updated = {
            ...t,
            status: nextStatus,
            files: [...t.files, newFile],
            updatedAt: timestamp,
            history: [...t.history, newHist],
          };
          persistTicketUpdate(updated);
          return updated;
        }
        return t;
      })
    );
  };

  // I. Update Observers
  const handleUpdateObservers = (ticketId: string, updatedObservers: string[], observerEmail?: string) => {
    if (!currentUser) return;

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const timestamp = new Date().toISOString();
          const newHist: HistoryStep = {
            id: `h_${Date.now()}_obs`,
            ticketId,
            action: 'Observadores Atualizados',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            details: `Observadores atualizados. Total: ${updatedObservers.length} e-mails em cópia.`,
            timestamp,
          };

          const updated = {
            ...t,
            observers: updatedObservers,
            observerEmail: observerEmail || (updatedObservers.length > 0 ? updatedObservers[0] : undefined),
            updatedAt: timestamp,
            history: [...t.history, newHist],
          };
          persistTicketUpdate(updated);
          return updated;
        }
        return t;
      })
    );
  };

  // E. Delete Return/Non-Conformity Ticket (Admin Only)
  const handleDeleteTicket = (ticketId: string) => {
    if (!currentUser) return;
    if (currentUser.role !== 'ADMIN') {
      return;
    }
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    setSelectedTicketId(null);
    fetch(`/api/tickets/${ticketId}`, { method: 'DELETE' }).catch((err) =>
      console.error(`[API] Erro ao excluir chamado ${ticketId} no banco:`, err)
    );
  };

  // F. Product mutation handlers (Admin only)
  const handleAddProduct = (product: Product) => {
    setProducts((prev) => [...prev, product]);
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product),
    }).catch((err) => console.error('[API] Erro ao cadastrar produto no banco:', err));
  };

  const handleEditProduct = (code: string, updatedName: string, updatedProducedQty?: number, updatedLine?: string) => {
    const updatedProd: Product = {
      code,
      name: updatedName,
      producedQty: updatedProducedQty,
      line: updatedLine || 'Geral',
    };
    setProducts((prev) =>
      prev.map((p) => (p.code === code ? { ...p, ...updatedProd } : p))
    );
    fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedProd),
    }).catch((err) => console.error('[API] Erro ao atualizar produto no banco:', err));
  };

  const handleDeleteProduct = (code: string) => {
    setProducts((prev) => prev.filter((p) => p.code !== code));
    fetch(`/api/products/${code}`, { method: 'DELETE' }).catch((err) =>
      console.error(`[API] Erro ao excluir produto ${code} no banco:`, err)
    );
  };

  // G. Issue Type mutation handlers (Admin only)
  const handleAddIssueType = (categoryName: string) => {
    setIssueTypes((prev) => [
      ...prev,
      {
        id: `it_${Date.now()}`,
        name: categoryName,
        subcategories: []
      }
    ]);
  };

  const handleDeleteIssueType = (categoryId: string) => {
    setIssueTypes((prev) => prev.filter((it) => it.id !== categoryId));
  };

  const handleAddSubcategory = (categoryId: string, subCategoryName: string) => {
    setIssueTypes((prev) =>
      prev.map((it) =>
        it.id === categoryId
          ? { ...it, subcategories: [...new Set([...it.subcategories, subCategoryName])] }
          : it
      )
    );
  };

  const handleDeleteSubcategory = (categoryId: string, subCategoryName: string) => {
    setIssueTypes((prev) =>
      prev.map((it) =>
        it.id === categoryId
          ? { ...it, subcategories: it.subcategories.filter((s) => s !== subCategoryName) }
          : it
      )
    );
  };

  // H. User mutation handlers (Admin only)
  const handleAddUser = (user: User) => {
    setUsers((prev) => [...prev, user]);
    fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(user),
    }).catch((err) => console.error('[API] Erro ao cadastrar usuário no banco:', err));
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
    fetch(`/api/users/${userId}`, { method: 'DELETE' }).catch((err) =>
      console.error(`[API] Erro ao excluir usuário ${userId} no banco:`, err)
    );
  };

  // H. Clear all cached data to start fresh simulation
  const handleClearEmailLogs = () => {
    setSystemEmailLogs([]);
    localStorage.removeItem('q_systemEmailLogs');
  };

  const handleSendTestEmailLog = () => {
    const timestamp = new Date().toISOString();
    const testEmailLog: SystemEmailLog = {
      id: `email_test_${Date.now()}`,
      timestamp,
      ticketId: 'TK-TEST-999',
      sender: 'notificacoes@qualisac-gateway.com.br',
      recipientName: 'Distribuidora Fenix S/A',
      recipientEmail: 'sac@distribuidorafenix.com.br',
      actionType: 'atualizacao_geral',
      status: 'Resolvido',
      subject: '[QualiSAC] Teste de Canal SMTP - Ocorrência TK-TEST-999 [Resolvido]',
      body: `Prezado(a) gestor de qualidade de Distribuidora Fenix S/A,\n\n` +
        `Este é um email de teste disparado de forma manual para fins de auditoria técnica do gateway SMTP.\n\n` +
        `DETALHES DO TESTE:\n` +
        `- Ambiente: Produção Dicompel\n` +
        `- Canal de Notificações: Ativo\n` +
        `- Data do Teste: ${new Date().toLocaleString()}\n\n` +
        `Nenhuma ação por parte do operador é necessária para este registro.\n\n` +
        `Cordialmente,\n` +
        `Equipe de Desenvolvimento e Integrações SAP / QualiSAC`,
      serviceType: 'Amazon SES SMTP Service (Simulado de Teste)',
    };
    setSystemEmailLogs((prev) => [testEmailLog, ...prev]);
  };

  const handleResetAppDatabase = () => {
    if (confirm('Deseja redefinir todo o banco de dados para os valores padrão de fábrica?')) {
      localStorage.removeItem('q_tenants');
      localStorage.removeItem('q_users');
      localStorage.removeItem('q_tickets');
      localStorage.removeItem('q_currentUser');
      localStorage.removeItem('q_activeTenant');
      localStorage.removeItem('q_systemEmailLogs');
      window.location.reload();
    }
  };

  const handleWipeDatabaseForTesting = () => {
    const confirmation = confirm('Deseja limpar todos os chamados, produtos e empresas cadastrados no sistema para iniciar um teste do zero?');
    if (!confirmation) return;

    const typedName = prompt('Digite o nome da sua empresa de testes (ou deixe em branco para "Simon Dicompel"):');
    const tenantName = typedName ? typedName.trim() : 'Simon Dicompel';

    const testTenant: Tenant = {
      id: 'tenant_test_1',
      name: tenantName,
      plan: 'Enterprise',
      status: 'Ativo',
      createdAt: new Date().toISOString(),
      color: '#6366f1' // Indigo
    };

    const testUser: User = {
      id: 'user_admin_test',
      name: 'Administrador de Teste',
      email: 'admin@dicompel.com.br',
      role: 'ADMIN',
      passwordHash: 'Dicompel!@#2026',
      tenantId: 'tenant_test_1'
    };

    // Update states
    setTickets([]);
    setProducts([]);
    setTenants([testTenant]);
    setUsers([testUser]);
    setActiveTenant(testTenant);
    setCurrentUser(testUser);
    setSystemEmailLogs([]);
    setSelectedTicketId(null);
    setActiveMenu('chamados');

    // Update localStorage
    localStorage.setItem('q_tickets', JSON.stringify([]));
    localStorage.setItem('q_products', JSON.stringify([]));
    localStorage.setItem('q_tenants', JSON.stringify([testTenant]));
    localStorage.setItem('q_users', JSON.stringify([testUser]));
    localStorage.setItem('q_activeTenant', JSON.stringify(testTenant));
    localStorage.setItem('q_currentUser', JSON.stringify(testUser));
    localStorage.setItem('q_systemEmailLogs', JSON.stringify([]));

    alert(`Sistema limpo com sucesso!\n\nVocê já está autenticado como administrador no tenant '${tenantName}'.\n\nPode começar cadastrando seus produtos em "Cadastros & Configs" ou abrindo chamados do zero.`);
  };

  const handleWipeDatabaseForSimulation = () => {
    // Update states
    setTickets([]);
    setProducts([]);
    setSystemEmailLogs([]);
    setSelectedTicketId(null);
    setActiveMenu('chamados');

    // Update localStorage
    localStorage.setItem('q_tickets', JSON.stringify([]));
    localStorage.setItem('q_products', JSON.stringify([]));
    localStorage.setItem('q_systemEmailLogs', JSON.stringify([]));

    // Limpa a base no servidor e no Azure SQL
    fetch('/api/database/wipe-samples', { method: 'POST' }).catch((err) =>
      console.error('[API] Erro ao limpar base no servidor:', err)
    );
  };

  // Retrieve single ticket for detailed view
  const activeTicket = tickets.find((t) => t.id === selectedTicketId);

  // --- 5. RENDER CHANNELS ---

  // LOGIN CONTAINER
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-950 text-slate-100">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto mb-4 bg-white p-3.5 rounded-2xl shadow-xl shadow-slate-950/60 border border-slate-800 inline-flex items-center justify-center">
            <SimonDicompelLogo height={42} />
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">QualiSAC</h2>
          <p className="mt-1 text-xs text-slate-400 font-medium max-w-xs mx-auto">
            Portal Integrado de Devoluções e Gestão de Não Conformidades Industriais
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-slate-900 py-8 px-6 shadow-2xl rounded-2xl border border-slate-800 space-y-6">
            
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Email Corporativo</label>
                <input
                  id="login-email-input"
                  type="email"
                  required
                  placeholder="ex: admin@quali.com"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="mt-1.5 block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs placeholder-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-700 transition-all"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Senha de Acesso</label>
                <input
                  id="login-password-input"
                  type="password"
                  required
                  placeholder="Sua senha secreta"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="mt-1.5 block w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs placeholder-slate-600 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 hover:border-slate-700 transition-all"
                />
              </div>

              {loginError && (
                <div className="p-3 bg-red-950/40 border border-red-900/60 rounded-xl text-xs leading-relaxed text-red-400">
                  ⚠️ {loginError}
                </div>
              )}

              <button
                id="login-submit-btn"
                type="submit"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl text-xs font-bold uppercase tracking-wider text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all cursor-pointer shadow-lg shadow-blue-600/10"
              >
                Autenticar no Sistema
              </button>
            </form>

            {/* Production Environment Notice */}
            <div className="pt-5 border-t border-slate-800/80 text-center space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Ambiente de Produção
              </div>
              <p className="text-[10px] text-slate-500">
                Acesso restrito e autenticado. Utilize suas credenciais corporativas cadastradas para acessar o portal.
              </p>
            </div>

          </div>
        </div>
      </div>
    );
  }

  // CORE APPLICATION LAYOUT
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">

      {/* 2. Main Executive Header */}
      <header className="bg-white border-b border-slate-200 py-3 px-6 shadow-xs flex items-center justify-between no-print gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <div className="bg-white px-2.5 py-1 rounded-lg border border-slate-200 shadow-3xs flex items-center justify-center">
            <SimonDicompelLogo height={34} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-wider text-blue-700 bg-blue-50 border border-blue-150 rounded-full px-2 py-0.5">
                SAC &amp; Qualidade
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold">Sistema Integrado de Chamados e Ocorrências</p>
          </div>
        </div>

        {/* Real-time Global Search bar */}
        <div className="flex-1 max-w-sm lg:max-w-md">
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Pesquisa global real-time (ID, cliente, produto)..."
              value={globalSearchTerm}
              onChange={(e) => {
                const val = e.target.value;
                setGlobalSearchTerm(val);
                // Switch focus to chamados tab to make the filter visible immediately
                if (val && activeMenu !== 'chamados') {
                  setActiveMenu('chamados');
                }
              }}
              className="w-full pl-9 pr-8 py-1.5 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-500 hover:border-slate-350 focus:ring-1 focus:ring-blue-500 rounded-lg text-xs leading-5 text-slate-800 placeholder-slate-400 transition-all font-sans outline-none focus:outline-none"
            />
            {globalSearchTerm && (
              <button
                onClick={() => setGlobalSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Limpar pesquisa"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* Indicador de Status do Banco de Dados */}
        <div className="hidden lg:flex items-center">
          {dbStatus.connected && dbStatus.type === 'azure-sql' ? (
            <div 
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold shadow-2xs"
              title={`Conexão direta ativa no Azure SQL Server: ${dbStatus.host} (${dbStatus.database})`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>Azure SQL Conectado</span>
            </div>
          ) : (
            <button
              onClick={() => setActiveMenu('admin-config')}
              className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-[11px] font-bold transition-all cursor-pointer shadow-2xs"
              title={`Armazenamento Seguro em Disco Ativo. Clique para configurar a senha do Azure SQL (${dbStatus.host})`}
            >
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              <span>Banco Seguro Local (Configurar Azure)</span>
            </button>
          )}
        </div>

        {/* Profile info & out */}
        <div className="flex items-center gap-4 text-xs font-semibold shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-slate-800 font-bold">{currentUser.name}</p>
            <p className="text-[10px] text-slate-500 font-semibold">{currentUser.email}</p>
          </div>

          <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold text-white ${
            currentUser.role === 'ADMIN' ? 'bg-red-650' : 
            currentUser.role === 'SAC' ? 'bg-blue-650' : 
            currentUser.role === 'QUALIDADE' ? 'bg-emerald-650' : 'bg-slate-650'
          }`}>
            Modulo: {currentUser.role}
          </span>

          <button
            id="logout-btn"
            onClick={handleLogout}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-100 transition-all cursor-pointer"
            title="Encerrar sessão"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* 3. Lateral Sidebar Frame Column & Workspace Grid */}
      <div className="flex-1 flex flex-col md:flex-row">
        
        {/* Sidebar Left Navigation column */}
        <aside className="w-full md:w-64 bg-slate-900 text-slate-300 flex flex-col justify-between border-r border-slate-800 p-4.5 space-y-6 no-print shrink-0">
          
          <div className="space-y-6">
            <div>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">Painéis do Sistema</p>
              
              <nav className="space-y-1.5">
                {/* 1. Dashboard */}
                <button
                  id="menu-dashboard-btn"
                  onClick={() => {
                    setActiveMenu('dashboard');
                    setSelectedTicketId(null);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all text-left cursor-pointer ${
                    activeMenu === 'dashboard'
                      ? 'bg-blue-600 text-white font-extrabold shadow-sm shadow-blue-500/20'
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4" />
                  <span>Indicadores & Dashboard</span>
                </button>

                {/* 2. Tickets listing */}
                <button
                  id="menu-chamados-btn"
                  onClick={() => {
                    setActiveMenu('chamados');
                    setSelectedTicketId(null);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all text-left cursor-pointer ${
                    activeMenu === 'chamados'
                      ? 'bg-blue-600 text-white font-extrabold shadow-sm shadow-blue-500/20'
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-4 h-4" />
                    <span>Gestão de Chamados</span>
                  </div>
                  <span className="font-mono bg-slate-800 text-slate-300 font-extrabold rounded-full px-2 py-0.5 text-[10px]">
                    {activeTenantTickets.length}
                  </span>
                </button>

                {/* 3. Standards and Rules (ISO 9001) */}
                <button
                  id="menu-normas-btn"
                  onClick={() => {
                    setActiveMenu('normas');
                    setSelectedTicketId(null);
                  }}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all text-left cursor-pointer ${
                    activeMenu === 'normas'
                      ? 'bg-blue-600 text-white font-extrabold shadow-sm shadow-blue-500/20'
                      : 'hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Manual ISO 9001 SAC</span>
                </button>

                {/* 4. Cadastros & Configs (Admin Only) */}
                {currentUser?.role === 'ADMIN' && (
                  <button
                    id="menu-admin-config-btn"
                    onClick={() => {
                      setActiveMenu('admin-config');
                      setSelectedTicketId(null);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all text-left cursor-pointer ${
                      activeMenu === 'admin-config'
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm shadow-blue-500/20'
                        : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Cadastros & Configs</span>
                  </button>
                )}

                {/* 5. Servidor de E-mail (sac@dicompel.com.br) */}
                <button
                  id="menu-smtp-config-btn"
                  onClick={() => setIsSmtpModalOpen(true)}
                  className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide hover:bg-slate-800 hover:text-white transition-all text-left cursor-pointer text-slate-300"
                  title="Configurar credenciais e testar envio real de e-mails para sac@dicompel.com.br"
                >
                  <div className="flex items-center gap-3">
                    <Mail className="w-4 h-4 text-blue-400" />
                    <span>E-mail (SMTP)</span>
                  </div>
                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 font-mono">
                    SAC
                  </span>
                </button>
              </nav>
            </div>

            {/* Quick stats on bottom sidebar */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-2 text-xs">
              <p className="font-bold text-slate-400 text-[10px] uppercase">Rastreamento Local</p>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Geral:</span>
                <strong className="text-slate-350">{tickets.length} tickets</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Empresa:</span>
                <strong className="text-slate-350 truncate max-w-28 text-right">Simon Dicompel</strong>
              </div>
            </div>
          </div>

          {/* System info footer */}
          <div className="space-y-2 pt-2 border-t border-slate-900">
            <div className="flex justify-center">
              <span className="text-[9px] px-2.5 py-1 rounded-full border border-emerald-800/60 text-emerald-400 bg-emerald-950/40 font-semibold tracking-wider uppercase flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Ambiente de Produção
              </span>
            </div>
            <p className="text-[9px] text-slate-600 text-center">Version 1.4.0 &bull; 2026</p>
            <p className="text-[9px] text-slate-500 font-medium text-center mt-1">Desenvolvido Coolit Soluções em TI.</p>
          </div>
        </aside>

        {/* 4. Main Panel Body */}
        <main className="flex-1 p-6 md:p-8 overflow-y-auto max-w-full">
          <div className="max-w-7xl mx-auto">
            
            {/* If a ticket is currently selected, priority overlay showing details work-area */}
            {selectedTicketId && activeTicket ? (
              <TicketDetails
                ticket={activeTicket}
                users={users}
                currentUser={currentUser}
                onBack={() => setSelectedTicketId(null)}
                onUpdateStatus={handleUpdateStatus}
                onAddComment={handleAddComment}
                onUpdateQualityReport={handleUpdateQualityReport}
                onAddFile={handleAddFile}
                onDeleteTicket={handleDeleteTicket}
                onUpdateReminders={handleUpdateReminders}
                systemEmailLogs={systemEmailLogs.filter((l) => l.ticketId === activeTicket.id)}
                onUpdateObservers={handleUpdateObservers}
                onSendManualNotification={(ticketObj, subject, message) =>
                  sendAutomatedTicketEmail(ticketObj, 'atualizacao_geral', subject, message)
                }
                onOpenSmtpConfig={() => setIsSmtpModalOpen(true)}
              />
            ) : (
              /* Toggle components resting in normal tabs router state */
              <>
                {activeMenu === 'dashboard' && (
                  <DashboardView 
                    tickets={activeTenantTickets} 
                    products={products}
                    activeTenant={activeTenant}
                    onNavigateToTickets={(status) => {
                      setDashboardStatusFilter(status || 'all');
                      setActiveMenu('chamados');
                    }}
                  />
                )}

                {activeMenu === 'chamados' && (
                  <TicketList
                    tickets={activeTenantTickets}
                    onSelectTicket={(id) => setSelectedTicketId(id)}
                    onOpenNewTicketModal={() => {
                      setIsSpecialTicketMode(false);
                      setModalTicketType('SAC');
                      setIsNewTicketModalOpen(true);
                    }}
                    onOpenNewTicketModalWithType={(type) => {
                      setIsSpecialTicketMode(false);
                      setModalTicketType(type);
                      setIsNewTicketModalOpen(true);
                    }}
                    onOpenNewSpecialTicketModal={() => {
                      setIsSpecialTicketMode(true);
                      setModalTicketType('DEVOLUÇÃO');
                      setIsNewTicketModalOpen(true);
                    }}
                    canCreateTicket={canCreateTicket}
                    globalSearchTerm={globalSearchTerm}
                    onClearGlobalSearch={() => setGlobalSearchTerm('')}
                    selectedStatusFilter={dashboardStatusFilter}
                    onStatusFilterChange={setDashboardStatusFilter}
                  />
                )}


                {activeMenu === 'normas' && (
                  <div className="bg-white p-6 md:p-8 rounded-xl border border-slate-200 shadow-sm space-y-6">
                    <div className="border-b border-slate-200 pb-4">
                      <h2 className="text-lg font-bold text-slate-850 uppercase tracking-tight flex items-center gap-1.5">
                        <BookOpen className="w-5.5 h-5.5 text-blue-600" />
                        <span>Manual Técnico do Setor: ISO 9001 e Rastreabilidade</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Políticas regulatórias para recebimento de devoluções físicas e investigação interna de não conformidades industriais.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-600 leading-relaxed">
                      <div className="p-4.5 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                        <h4 className="font-extrabold text-slate-800 uppercase tracking-wide text-xs">1. Identificação do Lote</h4>
                        <p>
                          Nenhuma mercadoria devolvida deve entrar nas dependências industriais sem a etiqueta descritiva do <strong>Lote de Envasamento</strong> visível e intacta. O SAC tem obrigação de registrar a foto comprovando o problema.
                        </p>
                      </div>

                      <div className="p-4.5 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                        <h4 className="font-extrabold text-slate-800 uppercase tracking-wide text-xs">2. Metodologia 5 Porquês</h4>
                        <p>
                          A equipe de <strong>Qualidade</strong> deve se reunir logo que o status mude para "Em análise" para conduzir a identificação das causas. Cada uma das 5 perguntas deve buscar ir além da falha humana, buscando brechas no plano de manutenção das máquinas.
                        </p>
                      </div>

                      <div className="p-4.5 bg-slate-50 rounded-xl border border-slate-150 space-y-2">
                        <h4 className="font-extrabold text-slate-800 uppercase tracking-wide text-xs">3. Fechamento & Créditos</h4>
                        <p>
                          O ticket só poderá avançar para a fase de <strong>Resolvido</strong> caso haja um plano de ação preventivo cadastrado no sistema e um responsável nomeado. Apenas o <strong>Administrador</strong> tem permissão para formalizar o reembolso no ERP e mudar para <strong>Finalizado</strong>.
                        </p>
                      </div>
                    </div>

                    {/* Interactive workflow visual aids */}
                    <div className="pt-6 border-t border-slate-150">
                      <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Diagrama de Fluxo Operacional:</h4>
                      <div className="flex flex-col md:flex-row items-center justify-between text-xs font-bold p-4 bg-blue-50/50 rounded-xl border border-blue-100 gap-4">
                        <div className="bg-white p-3 rounded-lg border text-center shadow-2xs flex-1 w-full">
                          <p className="text-[10px] text-amber-600">PASSO 1</p>
                          <p className="text-slate-800 mt-0.5">Abertura no SAC</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 hidden md:block" />
                        <div className="bg-white p-3 rounded-lg border text-center shadow-2xs flex-1 w-full">
                          <p className="text-[10px] text-rose-600">PASSO 2</p>
                          <p className="text-slate-800 mt-0.5">Triagem de Laudo</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 hidden md:block" />
                        <div className="bg-white p-3 rounded-lg border text-center shadow-2xs flex-1 w-full">
                          <p className="text-[10px] text-indigo-600">PASSO 3</p>
                          <p className="text-slate-800 mt-0.5">Ações Corretivas</p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-slate-300 hidden md:block" />
                        <div className="bg-white p-3 rounded-lg border text-center shadow-2xs flex-1 w-full">
                          <p className="text-[10px] text-emerald-600">PASSO 4</p>
                          <p className="text-slate-800 mt-0.5">Faturamento / Fechamento</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeMenu === 'admin-config' && currentUser?.role === 'ADMIN' && (
                  <AdminConfigView
                    products={products}
                    onAddProduct={handleAddProduct}
                    onEditProduct={handleEditProduct}
                    onDeleteProduct={handleDeleteProduct}
                    issueTypes={issueTypes}
                    onAddIssueType={handleAddIssueType}
                    onDeleteIssueType={handleDeleteIssueType}
                    onAddSubcategory={handleAddSubcategory}
                    onDeleteSubcategory={handleDeleteSubcategory}
                    users={users}
                    onAddUser={handleAddUser}
                    onDeleteUser={handleDeleteUser}
                    tenants={tenants}
                  />
                )}
              </>
            )}

            {/* Application footer */}
            <footer className="mt-12 pt-6 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-3 no-print">
              <span>&copy; 2026 QualiSAC. Todos os direitos reservados.</span>
              <span className="font-semibold text-slate-650 flex items-center gap-1">
                <span>Desenvolvido Coolit Soluções em TI.</span>
              </span>
            </footer>

          </div>
        </main>
      </div>

      {/* 5. Portal New Ticket Modal Panel */}
      {isNewTicketModalOpen && (
        <NewTicketModal
          isOpen={isNewTicketModalOpen}
          onClose={() => setIsNewTicketModalOpen(false)}
          onSubmit={handleCreateTicket}
          products={products}
          issueTypes={issueTypes}
          isSpecial={isSpecialTicketMode}
          existingTickets={tickets}
          initialTicketType={modalTicketType}
        />
      )}

      {/* 6. SMTP Configuration & Test Modal */}
      {isSmtpModalOpen && (
        <SmtpConfigModal
          isOpen={isSmtpModalOpen}
          onClose={() => setIsSmtpModalOpen(false)}
        />
      )}

    </div>
  );
}
