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
import { SaasTenantSelector } from './components/SaaSTenantSelector';
import { SimonDicompelLogo } from './components/SimonDicompelLogo';
import { DashboardView } from './components/DashboardView';
import { TicketList } from './components/TicketList';
import { TicketDetails } from './components/TicketDetails';
import { NewTicketModal } from './components/NewTicketModal';
import { AdminConfigView } from './components/AdminConfigView';
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

  // Operation Mode: true = Production (Secure & isolated), false = Homologation (Demo aids visible)
  const [isProductionMode, setIsProductionMode] = useState<boolean>(() => {
    const saved = localStorage.getItem('q_is_production_mode');
    return saved !== null ? saved === 'true' : true; // Default is TRUE for secure production
  });

  useEffect(() => {
    localStorage.setItem('q_is_production_mode', String(isProductionMode));
  }, [isProductionMode]);

  // Run on mount to clear previous mock data of initialData and start from clean State
  React.useEffect(() => {
    const isWiped = localStorage.getItem('q_test_wiped_v12');
    if (!isWiped) {
      localStorage.clear();
      localStorage.setItem('q_tickets', JSON.stringify([]));
      localStorage.setItem('q_products', JSON.stringify(INITIAL_PRODUCTS));
      localStorage.setItem('q_tenants', JSON.stringify(INITIAL_TENANTS));
      localStorage.setItem('q_users', JSON.stringify(INITIAL_USERS));
      localStorage.setItem('q_activeTenant', JSON.stringify(INITIAL_TENANTS[0]));
      localStorage.removeItem('q_currentUser'); // User starts in login
      localStorage.setItem('q_systemEmailLogs', JSON.stringify([]));
      localStorage.setItem('q_is_production_mode', 'true'); // Production by default
      localStorage.setItem('q_test_wiped_v12', 'true');

      // Refresh state
      setTickets([]);
      setProducts(INITIAL_PRODUCTS);
      setTenants(INITIAL_TENANTS);
      setUsers(INITIAL_USERS);
      setActiveTenant(INITIAL_TENANTS[0]);
      setCurrentUser(null);
      setSystemEmailLogs([]);
      setSelectedTicketId(null);
      setActiveMenu('chamados');
    }

    // Dynamic clean state requested by the user to start simulation with 0 tickets and 0 products
    const isSimulationWiped = localStorage.getItem('q_test_wiped_simulation_v3');
    if (!isSimulationWiped) {
      localStorage.setItem('q_tickets', JSON.stringify([]));
      localStorage.setItem('q_products', JSON.stringify([]));
      localStorage.setItem('q_systemEmailLogs', JSON.stringify([]));
      localStorage.removeItem('q_currentUser'); // Ensure starts on login
      localStorage.setItem('q_test_wiped_simulation_v3', 'true');

      // Refresh state
      setTickets([]);
      setProducts([]);
      setSystemEmailLogs([]);
      setCurrentUser(null);
      setSelectedTicketId(null);
      setActiveMenu('chamados');
    }
  }, []);

  // --- 1. Persistent Database Engine (LocalStorage powered) ---
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
    return saved ? JSON.parse(saved) : [];
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
    return saved !== null ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

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
  const [activeMenu, setActiveMenu] = useState<'dashboard' | 'chamados' | 'saas' | 'normas' | 'admin-config'>('chamados');
  
  // Global search input state (filters tickets in real-time)
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');

  // Global ticket status filter state linked with Dashboard clicks
  const [dashboardStatusFilter, setDashboardStatusFilter] = useState<string>('all');
  
  // Selected single ticket state for detailed work area
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);

  // New ticket modal trigger
  const [isNewTicketModalOpen, setIsNewTicketModalOpen] = useState(false);
  const [isSpecialTicketMode, setIsSpecialTicketMode] = useState(false);

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

  // --- 2. SaaS Tenant Filter logic ---
  // In a multi-tenant SaaS, users only see tickets corresponding to their active tenant
  const activeTenantTickets = tickets.filter(
    (ticket) => ticket.tenantId === activeTenant.id
  );

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
      setLoginError(
        isProductionMode
          ? 'Email de acesso ou senha incorretos. Por favor, verifique suas credenciais de produção.'
          : 'Email de acesso ou senha incorretos. Selecione uma conta de teste abaixo para entrar de forma segura.'
      );
    }
  };

  // B. Close Session
  const handleLogout = () => {
    setCurrentUser(null);
    setSelectedTicketId(null);
  };

  // C. Open Return/Non-Conformity Ticket
  const handleCreateTicket = (data: {
    productCode: string;
    productName: string;
    batch?: string;
    clientName: string;
    issueType: IssueType;
    subCategory?: string;
    quantity: number;
    description: string;
    defects?: { id: string; description: string; quantity: number }[];
    firstContactDate?: string;
    invoiceNumber?: string;
    items?: { id: string; productCode: string; productName: string; quantity: number }[];
    // Novos campos específicos
    reseller?: string;
    consumer?: string;
    shippingValue?: number;
    requestedReversePac?: string;
    registeredUf?: string;
  }) => {
    if (!currentUser) return;

    // Generate unique ID with prefix based on whether it is a Special Ticket (SAC) or Normal Ticket (QLD)
    const isSpecial = isSpecialTicketMode || !!(data.reseller || data.consumer || data.shippingValue !== undefined || data.requestedReversePac || data.registeredUf);
    const prefix = isSpecial ? 'SAC' : 'QLD';
    
    // Find the next unique sequential number
    const samePrefixTickets = tickets.filter((t) => t.id.startsWith(prefix));
    let nextSeq = samePrefixTickets.length + 1;
    let newId = `${prefix}-${String(nextSeq).padStart(4, '0')}`;
    
    while (tickets.some((t) => t.id === newId)) {
      nextSeq++;
      newId = `${prefix}-${String(nextSeq).padStart(4, '0')}`;
    }

    const timestamp = new Date().toISOString();

    const specialDetails = [
      data.reseller ? `Revenda: ${data.reseller}` : null,
      data.consumer ? `Consumidor: ${data.consumer}` : null,
      data.shippingValue !== undefined ? `Frete: R$ ${data.shippingValue.toFixed(2)}` : null,
      data.requestedReversePac ? `PAC Reverso: ${data.requestedReversePac}` : null,
      data.registeredUf ? `UF: ${data.registeredUf}` : null,
    ].filter(Boolean).join(', ');

    const newHist: HistoryStep = {
      id: `h_${Date.now()}`,
      ticketId: newId,
      action: 'Abertura do Chamado',
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      details: `SAC registrou devolução de ${data.quantity} unidades (${data.items && data.items.length > 1 ? `${data.items.length} SKUs` : data.productName}) por motivo de ${data.issueType}${data.subCategory ? ` (${data.subCategory})` : ''}. Lote: ${data.batch || 'Não Informado'}${specialDetails ? ` | [Campos Especiais] ${specialDetails}` : ''}`,
      timestamp,
    };

    const newTicket: Ticket = {
      id: newId,
      tenantId: activeTenant.id,
      productCode: data.productCode,
      productName: data.productName,
      batch: data.batch,
      clientName: data.clientName,
      issueType: data.issueType,
      subCategory: data.subCategory,
      quantity: data.quantity,
      description: data.description,
      status: 'Aberto',
      createdAt: timestamp,
      updatedAt: timestamp,
      userId: currentUser.id,
      userName: currentUser.name,
      files: [],
      comments: [],
      defects: data.defects || [],
      history: [newHist],
      firstContactDate: data.firstContactDate,
      invoiceNumber: data.invoiceNumber,
      items: data.items,
      // Mapeamento dos novos campos específicos
      reseller: data.reseller,
      consumer: data.consumer,
      shippingValue: data.shippingValue,
      requestedReversePac: data.requestedReversePac,
      registeredUf: data.registeredUf,
    };

    setTickets((prev) => [newTicket, ...prev]);
    setIsNewTicketModalOpen(false);
    setSelectedTicketId(newId); // open it immediately
    setActiveMenu('chamados');
  };

  // D. Update Status & Log Action
  const handleUpdateStatus = (ticketId: string, newStatus: TicketStatus) => {
    if (!currentUser) return;

    // Find the current ticket before modifying it
    const currentTicket = tickets.find((t) => t.id === ticketId);
    if (!currentTicket) return;

    // Check if status transitioned to Resolvido or Finalizado to trigger simulated email log
    if (newStatus === 'Resolvido' || newStatus === 'Finalizado') {
      const timestamp = new Date().toISOString();
      const defectsStr = currentTicket.defects && currentTicket.defects.length > 0
        ? currentTicket.defects.map(d => `• ${d.quantity} peças - ${d.description}`).join('\n')
        : `• ${currentTicket.quantity} peças - ${currentTicket.description}`;

      const emailSubject = `[QualiSAC] Notificação de Encerramento/Resolução - Ocorrência ${currentTicket.id} [${newStatus}]`;
      const emailBody = `Prezado(a) gestor de qualidade de ${currentTicket.clientName || 'Cliente'},\n\n` +
        `Notificamos que o chamado de sac de código ${currentTicket.id} registrando desvios no lote "${currentTicket.batch}" mudou para o status ${newStatus.toUpperCase()}.\n\n` +
        `HISTÓRICO DA DEVOLUÇÃO:\n` +
        `- Produto Reclamado: ${currentTicket.productName} (${currentTicket.productCode})\n` +
        `- Tipo de Não Conformidade: ${currentTicket.issueType}\n\n` +
        `DETALHAMENTO DO LAUDO DE PEÇAS DANIFICADAS:\n` +
        `${defectsStr}\n\n` +
        `PLANO DE TRATATIVA (ISO 9001):\n` +
        `${currentTicket.qualityReport ? `- Causa Raiz: ${currentTicket.qualityReport.rootCause}\n- Ação de Bloqueio/Corretiva: ${currentTicket.qualityReport.correctiveAction}` : '- Aguardando publicação de relatório complementar técnico de Qualidade.'}\n\n` +
        `Este email é um log automatizado simulando a integração de faturamento reversora e pós-venda.\n` +
        `Enviado em conformidade com as diretivas de ouvidoria SAC.\n\n` +
        `Cordialmente,\n` +
        `Sistema Integrado de Notificações de Qualidade`;

      const recipientName = currentTicket.clientName || 'Cliente';
      const cleanEmailBase = recipientName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const recipientEmail = `${cleanEmailBase || 'contato'}@empresa-cliente.com.br`;

      const newEmailLog: SystemEmailLog = {
        id: `email_${Date.now()}`,
        timestamp,
        ticketId,
        sender: 'notificacoes@qualisac-gateway.com.br',
        recipientName,
        recipientEmail,
        status: newStatus,
        subject: emailSubject,
        body: emailBody,
        serviceType: 'Amazon SES SMTP Service (Simulado)',
      };

      setSystemEmailLogs((prev) => [newEmailLog, ...prev]);
    }

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
            details: `Status modificado para: '${newStatus}'.`,
            timestamp,
          };
          
          return {
            ...t,
            status: newStatus,
            updatedAt: timestamp,
            history: [...t.history, newHist],
          };
        }
        return t;
      })
    );
  };

  // E. Update Ticket Reminders / Subtasks
  const handleUpdateReminders = (ticketId: string, reminders: TicketReminder[]) => {
    if (!currentUser) return;

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const timestamp = new Date().toISOString();
          const newHist: HistoryStep = {
            id: `h_${Date.now()}_reminders`,
            ticketId,
            action: 'Lembretes Atualizados',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            details: `Remessas/Lembretes e tarefas atualizados. Total: ${reminders.length}`,
            timestamp,
          };

          return {
            ...t,
            reminders,
            updatedAt: timestamp,
            history: [...t.history, newHist],
          };
        }
        return t;
      })
    );
  };

  // F. Add Comment (Chat)
  const handleAddComment = (ticketId: string, text: string) => {
    if (!currentUser) return;

    const newComm: TicketComment = {
      id: `c_${Date.now()}`,
      ticketId,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      text,
      createdAt: new Date().toISOString(),
    };

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const timestamp = new Date().toISOString();
          const newHist: HistoryStep = {
            id: `h_${Date.now()}_comment`,
            ticketId,
            action: 'Comentário Adicionado',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            details: `Comentário: "${text.substring(0, 45)}..."`,
            timestamp,
          };

          return {
            ...t,
            comments: [...t.comments, newComm],
            updatedAt: timestamp,
            history: [...t.history, newHist],
          };
        }
        return t;
      })
    );
  };

  // F. Issue Root cause & corrective actions report
  const handleUpdateQualityReport = (ticketId: string, report: QualityReport) => {
    if (!currentUser) return;

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const timestamp = new Date().toISOString();
          const newHist: HistoryStep = {
            id: `h_${Date.now()}_report`,
            ticketId,
            action: 'Salvar Relatório de Qualidade',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            details: `Causa Raiz inserida: "${report.rootCause.substring(0, 45)}...". Responsável: ${report.responsible}`,
            timestamp,
          };

          // Also automatically advance state to 'Em tratativa' if it is still 'Em analise' or 'Aberto' 
          // to make the industrial workflow super intuitive!
          let nextStatus = t.status;
          if (t.status === 'Aberto' || t.status === 'Em analise') {
            nextStatus = 'Em tratativa';
          }

          return {
            ...t,
            qualityReport: report,
            status: nextStatus,
            updatedAt: timestamp,
            history: [...t.history, newHist],
          };
        }
        return t;
      })
    );
  };

  // G. Add file attachment
  const handleAddFile = (ticketId: string, name: string, size: string, type: string, url: string) => {
    if (!currentUser) return;

    const newFile: TicketFile = {
      id: `file_${Date.now()}`,
      name,
      size,
      type,
      url,
    };

    setTickets((prev) =>
      prev.map((t) => {
        if (t.id === ticketId) {
          const timestamp = new Date().toISOString();
          const newHist: HistoryStep = {
            id: `h_${Date.now()}_file`,
            ticketId,
            action: 'Anexo de Comprovação Vinculado',
            userId: currentUser.id,
            userName: currentUser.name,
            userRole: currentUser.role,
            details: `Arquivo anexado: ${name}`,
            timestamp,
          };

          return {
            ...t,
            files: [...t.files, newFile],
            updatedAt: timestamp,
            history: [...t.history, newHist],
          };
        }
        return t;
      })
    );
  };

  // E. Delete Return/Non-Conformity Ticket (Admin Only)
  const handleDeleteTicket = (ticketId: string) => {
    if (!currentUser) return;
    if (currentUser.role !== 'ADMIN') {
      alert('Permissão Negada: Apenas administradores podem apagar chamados (deletar do sistema).');
      return;
    }
    setTickets((prev) => prev.filter((t) => t.id !== ticketId));
    setSelectedTicketId(null);
  };

  // F. Product mutation handlers (Admin only)
  const handleAddProduct = (product: Product) => {
    setProducts((prev) => [...prev, product]);
  };

  const handleEditProduct = (code: string, updatedName: string, updatedProducedQty?: number, updatedLine?: string) => {
    setProducts((prev) =>
      prev.map((p) => (p.code === code ? { ...p, name: updatedName, producedQty: updatedProducedQty, line: updatedLine } : p))
    );
  };

  const handleDeleteProduct = (code: string) => {
    setProducts((prev) => prev.filter((p) => p.code !== code));
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
  };

  const handleDeleteUser = (userId: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== userId));
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
      status: 'Resolvido',
      subject: '[QualiSAC] Teste de Canal SMTP - Ocorrência TK-TEST-999 [Resolvido]',
      body: `Prezado(a) gestor de qualidade de Distribuidora Fenix S/A,\n\n` +
        `Este é um email de teste disparado de forma manual para fins de auditoria técnica do gateway SMTP.\n\n` +
        `DETALHES DO TESTE:\n` +
        `- Ambiente: Homologação SaaS Multi-Tenant\n` +
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

    const typedName = prompt('Digite o nome da sua empresa/locatário de testes (ou deixe em branco para "Minha Empresa de Teste"):');
    const tenantName = typedName ? typedName.trim() : 'Minha Empresa de Teste';

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
    const confirmation = confirm('Deseja limpar todos os chamados e todos os produtos do sistema para iniciar o simulado do zero?');
    if (!confirmation) return;

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

    alert('Sistema limpo com sucesso! Todos os chamados e produtos foram apagados. Agora você pode cadastrá-los um a um para simular o fluxo completo.');
  };

  // Retrieve single ticket for detailed view
  const activeTicket = tickets.find((t) => t.id === selectedTicketId);

  // --- 5. RENDER CHANNELS ---

  // LOGIN CONTAINER
  if (!currentUser) {
    return (
      <div className="min-h-screen flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 bg-slate-950 text-slate-100">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <div className="mx-auto h-16 w-16 bg-blue-600 rounded-2xl flex items-center justify-center font-black text-3xl text-white shadow-xl shadow-blue-500/10">
            Q
          </div>
          <h2 className="mt-6 text-3xl font-black text-white tracking-tight uppercase">QualiSAC</h2>
          <p className="mt-2 text-xs text-slate-400 font-medium max-w-xs mx-auto">
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

            {/* Operation Mode Selector Toggle */}
            <div className="flex items-center justify-between border-t border-slate-800/80 pt-5 mt-4">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${isProductionMode ? 'bg-emerald-500 animate-pulse' : 'bg-indigo-500 animate-pulse'}`}></span>
                Modo de Operação:
              </span>
              <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductionMode(true)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    isProductionMode
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Ocultar credenciais simuladas e usar login real isolado de produção"
                >
                  🔒 Produção
                </button>
                <button
                  type="button"
                  onClick={() => setIsProductionMode(false)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all cursor-pointer ${
                    !isProductionMode
                      ? 'bg-indigo-600 text-white shadow-xs'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Exibir atalhos de contas pré-configuradas para demonstração rápida"
                >
                  🧪 Homologação
                </button>
              </div>
            </div>

            {/* Quick Access Accounts (Only displayed in Homologation/Demo Mode) */}
            {!isProductionMode && (
              <div className="bg-slate-950/40 border border-slate-800/60 p-4.5 rounded-xl space-y-3 animate-fade-in">
                <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  <span>Selecione uma conta de teste para preenchimento rápido:</span>
                </p>
                
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {INITIAL_USERS.slice(0, 4).map((user) => (
                    <button
                      id={`login-quick-${user.id}`}
                      key={user.id}
                      onClick={() => {
                        setLoginEmail(user.email);
                        setLoginPassword(user.passwordHash || '');
                      }}
                      type="button"
                      className="p-2.5 bg-slate-800 hover:bg-slate-750 text-left rounded-lg text-slate-300 font-medium border border-slate-750 hover:border-slate-650 transition-all flex flex-col cursor-pointer"
                    >
                      <span className="font-bold text-white truncate text-xs">{user.name}</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 truncate uppercase tracking-wider font-semibold flex items-center justify-between w-full">
                        <span>{user.role}</span>
                        <span className="text-sky-400 text-[9px] lowercase tracking-normal font-normal">acesso rápido</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {isProductionMode && (
              <div className="text-center">
                <p className="text-[10px] text-slate-500 italic">
                  Ambiente seguro ativo. Use seu email e senha corporativos de locatário cadastrado para acessar o portal.
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    );
  }

  // CORE APPLICATION LAYOUT
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      
      {/* 1. SaaS Multi-tenant & Simulating Role Switching Header Banner (Only visible in Homologation/Demo mode) */}
      {!isProductionMode && (
        <div className="no-print animate-fade-in">
          <SaasTenantSelector
            tenants={tenants}
            activeTenant={activeTenant}
            onSelectTenant={handleSelectTenant}
            users={users}
            currentUser={currentUser}
            onSwitchUser={handleSwitchUser}
          />
        </div>
      )}

      {/* 2. Main Executive Header */}
      <header className="bg-white border-b border-slate-200 py-3 px-6 shadow-xs flex items-center justify-between no-print gap-4">
        <div className="flex items-center gap-4 shrink-0">
          <div className="bg-slate-50 px-2 py-1.5 rounded-lg border border-slate-150 flex items-center justify-center">
            <SimonDicompelLogo height={32} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-black tracking-wider text-blue-700 bg-blue-50 border border-blue-150 rounded-full px-2 py-0.5">
                SAC &amp; Qualidade
              </span>
            </div>
            <p className="text-[10px] text-slate-500 font-semibold">Inspirado na arquitetura de tickets GLPI</p>
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
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 mb-2">Painéis GLPI</p>
              
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

                {/* 3. SaaS tenants manager */}
                {currentUser.role === 'ADMIN' && (
                  <button
                    id="menu-saas-btn"
                    onClick={() => {
                      setActiveMenu('saas');
                      setSelectedTicketId(null);
                    }}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wide transition-all text-left cursor-pointer ${
                      activeMenu === 'saas'
                        ? 'bg-blue-600 text-white font-extrabold shadow-sm shadow-blue-500/20'
                        : 'hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <Building2 className="w-4 h-4" />
                    <span>Multi-Tenancy Clientes</span>
                  </button>
                )}

                {/* 4. Standards and Rules (ISO 9001) */}
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

                {/* 5. Cadastros & Configs (Admin Only) */}
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
                <span className="text-slate-500">Tenant Ativo:</span>
                <strong className="text-slate-350 truncate max-w-28 text-right">{activeTenant.name}</strong>
              </div>
            </div>
          </div>

          {/* System info footer */}
          <div className="space-y-2 pt-2 border-t border-slate-900">
            <div className="flex justify-center">
              <button
                onClick={() => setIsProductionMode(!isProductionMode)}
                className={`text-[9px] px-2 py-1 rounded border font-semibold tracking-wider uppercase transition-all cursor-pointer ${
                  isProductionMode
                    ? 'border-emerald-800/60 text-emerald-500 bg-emerald-950/20 hover:bg-emerald-950/50'
                    : 'border-indigo-800/60 text-indigo-400 bg-indigo-950/20 hover:bg-indigo-950/50'
                }`}
                title="Clique para alternar o modo de operação do sistema"
              >
                {isProductionMode ? '🔒 Modo Produção' : '🧪 Modo Homologação'}
              </button>
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
                      setIsNewTicketModalOpen(true);
                    }}
                    onOpenNewSpecialTicketModal={() => {
                      setIsSpecialTicketMode(true);
                      setIsNewTicketModalOpen(true);
                    }}
                    canCreateTicket={canCreateTicket}
                    globalSearchTerm={globalSearchTerm}
                    onClearGlobalSearch={() => setGlobalSearchTerm('')}
                    selectedStatusFilter={dashboardStatusFilter}
                    onStatusFilterChange={setDashboardStatusFilter}
                  />
                )}

                {activeMenu === 'saas' && currentUser.role === 'ADMIN' && (
                  <div className="space-y-6">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h2 className="text-base font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                        <Building2 className="w-5 h-5 text-blue-600" />
                        <span>Gestão de Locatários SaaS (Subscritores)</span>
                      </h2>
                      <p className="text-xs text-slate-500 mt-1">
                        Visualize e altere as configurações dos clientes em tempo real no servidor central de banco de dados
                      </p>

                      {/* Tenancy grid list */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {tenants.map((ten) => {
                          const tenantTicketCount = tickets.filter((t) => t.tenantId === ten.id).length;
                          const tenantUserCount = users.filter((u) => u.tenantId === ten.id).length;

                          return (
                            <div key={ten.id} className="p-5 rounded-xl border border-slate-200 hover:border-slate-350 transition-all bg-slate-50/70 p-3 flex flex-col justify-between space-y-4">
                              <div>
                                <div className="flex justify-between items-start">
                                  <span className="font-bold text-slate-800 text-sm">{ten.name}</span>
                                  <span className="px-2 py-0.5 text-[9px] font-black uppercase text-slate-650 bg-slate-100 border rounded">
                                    {ten.plan}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-0.5">Criado em: {new Date(ten.createdAt).toLocaleDateString()}</p>
                              </div>

                              <div className="grid grid-cols-2 gap-2 text-xs font-semibold pt-2 border-t border-slate-200">
                                <div className="bg-white p-2 rounded text-center border border-slate-150">
                                  <span className="text-[10px] text-slate-400 block uppercase">Chamados</span>
                                  <strong className="text-slate-800 mt-1 block">{tenantTicketCount}</strong>
                                </div>
                                <div className="bg-white p-2 rounded text-center border border-slate-150">
                                  <span className="text-[10px] text-slate-400 block uppercase">Equipe</span>
                                  <strong className="text-slate-800 mt-1 block">{tenantUserCount} un</strong>
                                </div>
                              </div>

                              <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-150 text-wrap text-xs">
                                <span className="text-slate-500">Status Ativo:</span>
                                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                  ten.status === 'Ativo' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {ten.status}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* Form to create new tenant */}
                      <div className="mt-8 pt-6 border-t border-slate-150">
                        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">Cadastrar Novo Locatário (Tenant / Empresa)</h3>
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          const fd = new FormData(e.currentTarget);
                          const n = fd.get('name') as string;
                          const p = fd.get('plan') as string;
                          if (!n.trim()) return;

                          // Check duplicate
                          if (tenants.some((t) => t.name.toLowerCase() === n.trim().toLowerCase())) {
                            alert(`O tenant "${n.trim()}" já está cadastrado.`);
                            return;
                          }

                          const newId = `tenant_${Date.now()}`;
                          const newTenant: Tenant = {
                            id: newId,
                            name: n.trim(),
                            plan: p as any || 'Enterprise',
                            status: 'Ativo',
                            createdAt: new Date().toISOString(),
                            color: '#' + Math.floor(Math.random()*16777215).toString(16).padStart(6, '0'), // Random color
                          };

                          // Create a default administrator user for this new tenant so they can log into it/use it
                          const newTenantUser: User = {
                            id: `user_${Date.now()}`,
                            name: `Admin ${n.trim()}`,
                            email: `admin@${n.trim().toLowerCase().replace(/[^a-z0-9]/g, '') || 'empresa'}.com.br`,
                            role: 'ADMIN',
                            passwordHash: 'Dicompel!@#2026',
                            tenantId: newId,
                          };

                          setTenants((prev) => [...prev, newTenant]);
                          setUsers((prev) => [...prev, newTenantUser]);
                          
                          // Auto switch to it
                          setActiveTenant(newTenant);
                          setCurrentUser(newTenantUser);

                          e.currentTarget.reset();
                          alert(`Empresa "${n.trim()}" cadastrada com sucesso e de forma ativa!\n\nUsuario administrador criado: \nEmail: ${newTenantUser.email}\nSenha padrão: Dicompel!@#2026`);
                        }} className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          <div className="md:col-span-2">
                            <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Nome da Empresa / Locatário *</label>
                            <input
                              name="name"
                              type="text"
                              required
                              placeholder="Ex: Cerâmica União S/A"
                              className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs hover:border-slate-350 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-800"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] text-slate-500 font-bold mb-1 uppercase">Plano de Contrato</label>
                            <select name="plan" className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none">
                              <option value="Enterprise">Enterprise</option>
                              <option value="Growth">Growth</option>
                              <option value="Trial">Trial</option>
                            </select>
                          </div>
                          <div className="md:col-span-3 flex justify-end">
                            <button
                              type="submit"
                              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center gap-1.5 cursor-pointer"
                            >
                              <Plus className="w-3.5 h-3.5" />
                              <span>Cadastrar &amp; Ativar Empresa</span>
                            </button>
                          </div>
                        </form>
                      </div>
                    </div>

                    {/* Industrial log tracking and security compliance */}
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                      <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight flex items-center gap-1.5">
                        <ShieldCheck className="w-5 h-5 text-slate-500" />
                        <span>Log de Auditoria e Conformidade Legal ISO</span>
                      </h3>
                      <p className="text-xs text-slate-500 mt-1">
                        Cada alteração de status, preenchimento de 5 Porquês com IA ou anexo é salvo com Hash para auditorias regulatórias.
                      </p>

                      <div className="mt-4 overflow-x-auto">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead>
                            <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-100">
                              <th className="py-2 px-3">Data/Hora</th>
                              <th className="py-2 px-3">Ticket Vinculado</th>
                              <th className="py-2 px-3">Ação Registrada</th>
                              <th className="py-2 px-3">Operador</th>
                              <th className="py-2 px-3">Nível</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-slate-600">
                            {tickets.flatMap(t => t.history.map(h => ({ ...h, ticketId: t.id }))).slice(0, 8).map((log, index) => (
                              <tr key={index} className="hover:bg-slate-50/50">
                                <td className="py-2.5 px-3 font-mono text-[10px] whitespace-nowrap">
                                  {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString()}
                                </td>
                                <td className="py-2.5 px-3 font-bold text-blue-650">{log.ticketId}</td>
                                <td className="py-2.5 px-3 font-medium text-slate-800">{log.action}</td>
                                <td className="py-2.5 px-3">{log.userName}</td>
                                <td className="py-2.5 px-3">
                                  <span className="bg-slate-150 text-slate-700 px-1.5 py-0.2 rounded font-mono text-[10px]">
                                    {log.userRole}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
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
        />
      )}

    </div>
  );
}
