import { User, Tenant, Ticket, IssueTypeCategory } from './types';

export const INITIAL_ISSUE_TYPES: IssueTypeCategory[] = [
  {
    id: 'it_defeito',
    name: 'Defeito',
    subcategories: ['Riscado', 'Amassado', 'Quebrado', 'Trincado', 'Sem Pintura', 'Mau funcionamento', 'Padrão fora de medida']
  },
  {
    id: 'it_avaria',
    name: 'Avaria',
    subcategories: ['Embalagem Danificada', 'Molhado', 'Oxidação / Ferrugem', 'Manchado']
  },
  {
    id: 'it_troca',
    name: 'Troca',
    subcategories: ['Desistência do cliente', 'Erro comercial de pedido', 'Garantia estendida']
  },
  {
    id: 'it_logistica',
    name: 'Erro de Logística',
    subcategories: ['Quantidade incorreta', 'Produto trocado', 'Atraso na entrega', 'Extravio de volume']
  },
  {
    id: 'it_outro',
    name: 'Outro',
    subcategories: ['Reclamação geral', 'Dúvida técnica']
  }
];

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant_1',
    name: 'Alimentos Estrela S/A',
    plan: 'Enterprise',
    status: 'Ativo',
    createdAt: '2025-01-15T10:00:00Z',
    color: '#0284c7', // sky-600
  },
  {
    id: 'tenant_2',
    name: 'Metalúrgica Progresso',
    plan: 'Growth',
    status: 'Ativo',
    createdAt: '2025-03-10T12:00:00Z',
    color: '#16a34a', // green-600
  },
  {
    id: 'tenant_3',
    name: 'Logística Expressa Ltda.',
    plan: 'Trial',
    status: 'A vencer',
    createdAt: '2026-05-20T08:00:00Z',
    color: '#ea580c', // orange-600
  },
];

export const INITIAL_USERS: User[] = [
  {
    id: 'user_dicompel_admin',
    name: 'Administrador Dicompel',
    email: 'admin@dicompel.com.br',
    role: 'ADMIN',
    passwordHash: 'Dicompel!@#2026',
    tenantId: 'tenant_1',
  },
  {
    id: 'user_admin',
    name: 'Carlos Silva',
    email: 'admin@quali.com',
    role: 'ADMIN',
    passwordHash: 'admin', // Simple for demonstration/login
    tenantId: 'tenant_1',
  },
  {
    id: 'user_sac',
    name: 'Juliana Souza',
    email: 'sac@quali.com',
    role: 'SAC',
    passwordHash: 'sac',
    tenantId: 'tenant_1',
  },
  {
    id: 'user_qualidade',
    name: 'Marcos Oliveira',
    email: 'qualidade@quali.com',
    role: 'QUALIDADE',
    passwordHash: 'quali',
    tenantId: 'tenant_1',
  },
  {
    id: 'user_comum',
    name: 'Rodrigo Costa',
    email: 'comum@quali.com',
    role: 'COMUM',
    passwordHash: 'comum',
    tenantId: 'tenant_1',
  },
  // Users for other tenants to show multi-client isolation
  {
    id: 'user_metal_admin',
    name: 'Roberto Ferro',
    email: 'roberto@progresso.com',
    role: 'ADMIN',
    passwordHash: 'roberto',
    tenantId: 'tenant_2',
  },
  {
    id: 'user_metal_qual',
    name: 'Aline Metal',
    email: 'aline@progresso.com',
    role: 'QUALIDADE',
    passwordHash: 'aline',
    tenantId: 'tenant_2',
  },
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'TK-1001',
    tenantId: 'tenant_1',
    productCode: 'PROD-A310',
    productName: 'Leite Condensado Estrela 395g',
    batch: 'L-240822A',
    clientName: 'Supermercados Pão e Trigo Ltda',
    issueType: 'Defeito',
    quantity: 120,
    description: 'Cliente reclama que 120 latas de leite condensado vieram com a solda lateral danificada, ocasionando vazamentos em cerca de 40 unidades e estufamento nas demais.',
    status: 'Finalizado',
    createdAt: '2026-05-15T09:30:00Z',
    updatedAt: '2026-05-18T16:00:00Z',
    userId: 'user_sac',
    userName: 'Juliana Souza',
    files: [
      {
        id: 'file_1',
        name: 'foto_lote_vazado.png',
        size: '1.2 MB',
        type: 'image/png',
        url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400',
      },
      {
        id: 'file_2',
        name: 'laudo_temperatura.pdf',
        size: '350 KB',
        type: 'application/pdf',
        url: '#',
      },
    ],
    comments: [
      {
        id: 'c_1',
        ticketId: 'TK-1001',
        userId: 'user_qualidade',
        userName: 'Marcos Oliveira',
        userRole: 'QUALIDADE',
        text: 'Amostras de retenção do lote L-240822A foram recolhidas para análise físico-química preventiva na fábrica.',
        createdAt: '2026-05-16T11:00:00Z',
      },
      {
        id: 'c_2',
        ticketId: 'TK-1001',
        userId: 'user_sac',
        userName: 'Juliana Souza',
        userRole: 'SAC',
        text: 'Ótimo, o cliente aguarda o posicionamento para realizar o descarte adequado do material.',
        createdAt: '2026-05-16T14:15:00Z',
      },
    ],
    qualityReport: {
      rootCause: 'Falha de calibração do eletrodo de soldagem da lata na Linha 3 de envase.',
      fiveWhys: [
        'Por que as latas vazaram? Porque a solda lateral abriu.',
        'Por que a solda lateral abriu? Porque houve falta de aquecimento localizado durante o fechamento.',
        'Por que houve falta de aquecimento? Porque o eletrodo de solda operou abaixo da temperatura requerida.',
        'Por que a temperatura estava abaixo? Porque o sensor não corrigiu a resistência após flutuação térmica.',
        'Por que o sensor falhou? Porque o plano de calibração preventiva venceu há 15 dias sem execução.'
      ],
      correctiveAction: 'Calibração imediata do equipamento de soldagem. Replanejamento das manutenções preventivas semanais com tolerância zero para atrasos.',
      preventiveAction: 'Configurar alerta automatizado no supervisório industrial para parar a esteira caso a calibração de solda decline >5% do limiar de segurança.',
      responsible: 'Marcos Oliveira / Eng. de Produção',
      targetDate: '2026-05-25',
      updatedAt: '2026-05-17T15:30:00Z',
    },
    defects: [
      { id: 'def_1_1', description: 'solda lateral danificada / vazamento', quantity: 40 },
      { id: 'def_1_2', description: 'estufamento microbiano residual', quantity: 50 },
      { id: 'def_1_3', description: 'amassado por transporte', quantity: 30 }
    ],
    history: [
      {
        id: 'h_1',
        ticketId: 'TK-1001',
        action: 'Abertura do Chamado',
        userId: 'user_sac',
        userName: 'Juliana Souza',
        userRole: 'SAC',
        details: 'Chamado cadastrado inicialmente com 120 latas afetadas.',
        timestamp: '2026-05-15T09:30:00Z',
      },
      {
        id: 'h_2',
        ticketId: 'TK-1001',
        action: 'Mudar Status para: Em analise',
        userId: 'user_qualidade',
        userName: 'Marcos Oliveira',
        userRole: 'QUALIDADE',
        details: 'Análise de laboratório iniciada.',
        timestamp: '2026-05-16T10:00:00Z',
      },
      {
        id: 'h_3',
        ticketId: 'TK-1001',
        action: 'Adicionar Comentário',
        userId: 'user_qualidade',
        userName: 'Marcos Oliveira',
        userRole: 'QUALIDADE',
        timestamp: '2026-05-16T11:00:00Z',
      },
      {
        id: 'h_4',
        ticketId: 'TK-1001',
        action: 'Salvar Relatório de Qualidade',
        userId: 'user_qualidade',
        userName: 'Marcos Oliveira',
        userRole: 'QUALIDADE',
        details: 'Identificada causa raiz e definidos os 5 porquês.',
        timestamp: '2026-05-17T15:30:00Z',
      },
      {
        id: 'h_5',
        ticketId: 'TK-1001',
        action: 'Mudar Status para: Resolvido',
        userId: 'user_qualidade',
        userName: 'Marcos Oliveira',
        userRole: 'QUALIDADE',
        details: 'Plano de ação corretiva inserido e validado com a gerência industrial.',
        timestamp: '2026-05-17T15:45:00Z',
      },
      {
        id: 'h_6',
        ticketId: 'TK-1001',
        action: 'Finalização do Chamado',
        userId: 'user_admin',
        userName: 'Carlos Silva',
        userRole: 'ADMIN',
        details: 'Crédito de devolução emitido ao financeiro do cliente. Chamado encerrado.',
        timestamp: '2026-05-18T16:00:00Z',
      },
    ],
  },
  {
    id: 'TK-1002',
    tenantId: 'tenant_1',
    productCode: 'PROD-B550',
    productName: 'Biscoito Amanteigado Ninho 150g',
    batch: 'L-120925C',
    clientName: 'Atacadão Alvorada Distribuição',
    issueType: 'Avaria',
    quantity: 450,
    description: 'Caixas master de papelão amassadas e rasgadas durante o descarregamento na doca 4. Suspeita-se que houve empilhamento excessivo no transporte.',
    status: 'Em analise',
    createdAt: '2026-06-02T14:20:00Z',
    updatedAt: '2026-06-03T09:10:00Z',
    userId: 'user_sac',
    userName: 'Juliana Souza',
    files: [
      {
        id: 'file_3',
        name: 'paletes_esmagados.jpg',
        size: '2.1 MB',
        type: 'image/jpeg',
        url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400',
      }
    ],
    defects: [
      { id: 'def_2_1', description: 'papelão master amassado', quantity: 300 },
      { id: 'def_2_2', description: 'pacote de biscoito rasgado/vazado', quantity: 150 }
    ],
    comments: [
      {
        id: 'c_3',
        ticketId: 'TK-1002',
        userId: 'user_sac',
        userName: 'Juliana Souza',
        userRole: 'SAC',
        text: 'Motorista assinou ressalva na nota fiscal de entrada apontando tombamento parcial na curva.',
        createdAt: '2026-06-02T14:30:00Z',
      }
    ],
    history: [
      {
        id: 'h_7',
        ticketId: 'TK-1002',
        action: 'Abertura do Chamado',
        userId: 'user_sac',
        userName: 'Juliana Souza',
        userRole: 'SAC',
        details: 'Abertura com comprovação de avaria por transporte.',
        timestamp: '2026-06-02T14:20:00Z',
      },
      {
        id: 'h_8',
        ticketId: 'TK-1002',
        action: 'Mudar Status para: Em analise',
        userId: 'user_qualidade',
        userName: 'Marcos Oliveira',
        userRole: 'QUALIDADE',
        details: 'Análise de responsabilidade logística em andamento.',
        timestamp: '2026-06-03T09:10:00Z',
      }
    ]
  },
  {
    id: 'TK-1003',
    tenantId: 'tenant_1',
    productCode: 'PROD-A102',
    productName: 'Molho de Tomate Premium Sachê 340g',
    batch: 'L-291125X',
    clientName: 'Carrefour Comércio do Brasil',
    issueType: 'Troca',
    quantity: 80,
    description: 'Molhos de tomate faturados incorretamente. O cliente comprou Molho com Manjericão, mas recebeu Molho Tradicional nas caixas externas etiquetadas erradas.',
    status: 'Aberto',
    createdAt: '2026-06-09T17:45:00Z',
    updatedAt: '2026-06-09T17:45:00Z',
    userId: 'user_sac',
    userName: 'Juliana Souza',
    files: [],
    defects: [
      { id: 'def_3_1', description: 'erro de etiquetagem de sabor (manjericão por tradicional)', quantity: 80 }
    ],
    comments: [],
    history: [
      {
        id: 'h_9',
        ticketId: 'TK-1003',
        action: 'Abertura do Chamado',
        userId: 'user_sac',
        userName: 'Juliana Souza',
        userRole: 'SAC',
        details: 'Registro inicial de troca física por erro de expedição/etiqueta.',
        timestamp: '2026-06-09T17:45:00Z',
      }
    ]
  },
  {
    id: 'TK-1004',
    tenantId: 'tenant_1',
    productCode: 'PROD-C991',
    productName: 'Suco de Uva Integral Orgânico 1L',
    batch: 'L-040226B',
    clientName: 'Grupo Zaffari S/A',
    issueType: 'Defeito',
    quantity: 250,
    description: 'Presença acentuada de sedimentos (borras/tartaratos) no fundo das garrafas, muito superior ao aceitável. O cliente se recusa a expor o lote nas gôndolas e solicita devolução imediata por não conformidade visual.',
    status: 'Em tratativa',
    createdAt: '2026-05-20T10:00:00Z',
    updatedAt: '2026-05-24T11:20:00Z',
    userId: 'user_sac',
    userName: 'Juliana Souza',
    files: [
      {
        id: 'file_4',
        name: 'garrafas_sedimento_fundo.png',
        size: '1.8 MB',
        type: 'image/png',
        url: 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=400',
      }
    ],
    comments: [
      {
        id: 'c_4',
        ticketId: 'TK-1004',
        userId: 'user_qualidade',
        userName: 'Marcos Oliveira',
        userRole: 'QUALIDADE',
        text: 'Análise laboratorial conformou precipitação natural de bitartarato de potássio decorrente de choque térmico acelerado no resfriamento pós-pasteurização.',
        createdAt: '2026-05-22T14:00:00Z',
      }
    ],
    qualityReport: {
      rootCause: 'Resfriamento brusco do mosto de uva estabilizado sob temperatura -4°C por falha operacional na autoclave de choque térmico.',
      fiveWhys: [
        'Por que as garrafas criaram sedimentos visuais excessivos? Porque ocorreu precipitação ácida acelerada de tartaratos.',
        'Por que precipitou açúcar e sal de tartrato? Porque o produto sofreu resfriamento demasiadamente brusco.',
        'Por que o resfriamento foi brusco? Porque a válvula de refrigeração permaneceu 100% aberta por tempo excessivo.',
        'Por que a válvula ficou aberta? Porque o sensor automático travou aberto com indicação emperrada.',
        'Por que travou aberto? Porque houve ausência de manutenção preventiva nas eletroválvulas de água gelada.'
      ],
      correctiveAction: 'Trocar o kit de solenoides da válvula reguladora de refrigeração e ajustar o padrão de lavagem térmica periódica.',
      preventiveAction: 'Auditoria de lote de estabilização a frio em cada tanque de maturação de uva antes do envase comercial.',
      responsible: 'Marcos Oliveira / Química do Envase',
      targetDate: '2026-06-15',
      updatedAt: '2026-05-23T16:00:00Z',
    },
    defects: [
      { id: 'def_4_1', description: 'sedimentos (borras de tartaratos) visíveis', quantity: 200 },
      { id: 'def_4_2', description: 'garrafa de vidro trincada/esmigalhada', quantity: 50 }
    ],
    history: [
      {
        id: 'h_10',
        ticketId: 'TK-1004',
        action: 'Abertura do Chamado',
        userId: 'user_sac',
        userName: 'Juliana Souza',
        userRole: 'SAC',
        details: 'SAC cadastra solicitação de análise sobre acúmulo de borra.',
        timestamp: '2026-05-20T10:00:00Z',
      },
      {
        id: 'h_11',
        ticketId: 'TK-1004',
        action: 'Mudar Status para: Em analise',
        userId: 'user_qualidade',
        userName: 'Marcos Oliveira',
        userRole: 'QUALIDADE',
        details: 'Amostras de teste de sedimentação enviadas à microquímica.',
        timestamp: '2026-05-21T09:00:00Z',
      },
      {
        id: 'h_12',
        ticketId: 'TK-1004',
        action: 'Salvar Relatório de Qualidade',
        userId: 'user_qualidade',
        userName: 'Marcos Oliveira',
        userRole: 'QUALIDADE',
        details: 'Causa raiz descrita como falha de solenoide na refrigeração.',
        timestamp: '2026-05-23T16:00:00Z',
      },
      {
        id: 'h_13',
        ticketId: 'TK-1004',
        action: 'Mudar Status para: Em tratativa',
        userId: 'user_qualidade',
        userName: 'Marcos Oliveira',
        userRole: 'QUALIDADE',
        details: 'Contatada transportadora e equipe logística para agendamento da coleta de devolução física.',
        timestamp: '2026-05-24T11:20:00Z',
      },
    ]
  },
  // Ticket on Metalurgica Progresso to show isolation
  {
    id: 'TK-2001',
    tenantId: 'tenant_2',
    productCode: 'PROD-M88',
    productName: 'Chapa Metálica Galvanizada 2mm',
    batch: 'LT-MET-001',
    clientName: 'Indústria Metalúrgica Sul',
    issueType: 'Defeito',
    quantity: 15,
    description: 'Chapas chegaram com empenamento longitudinal excessivo de até 8mm, impossibilitando a alimentação automática na máquina de corte laser.',
    status: 'Aberto',
    createdAt: '2026-06-08T11:00:00Z',
    updatedAt: '2026-06-08T11:00:00Z',
    userId: 'user_metal_qual',
    userName: 'Aline Metal',
    files: [],
    defects: [
      { id: 'def_5_1', description: 'empenamento longitudinal excessivo', quantity: 10 },
      { id: 'def_5_2', description: 'risco profundo na galvanização protetora', quantity: 5 }
    ],
    comments: [],
    history: [
      {
        id: 'h_m1',
        ticketId: 'TK-2001',
        action: 'Abertura do Chamado',
        userId: 'user_metal_qual',
        userName: 'Aline Metal',
        userRole: 'QUALIDADE',
        details: 'Abertura de teste do cliente Metalurgica.',
        timestamp: '2026-06-08T11:00:00Z',
      }
    ]
  }
];
