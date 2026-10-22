import { User, Tenant, Ticket, IssueTypeCategory, Product } from './types';

export const INITIAL_ISSUE_TYPES: IssueTypeCategory[] = [
  {
    id: 'it_eletrico',
    name: 'Defeito Elétrico',
    subcategories: [
      'Mau contato elétrico',
      'Curto-circuito interno',
      'Superaquecimento sob carga',
      'Fuga de corrente',
      'Falta de continuidade nos bornes',
      'Falha na placa / Módulo USB eletrônico'
    ]
  },
  {
    id: 'it_mecanico',
    name: 'Defeito Mecânico',
    subcategories: [
      'Sem rosca / Rosca espanada',
      'Mola travada ou partida',
      'Encaixe frouxo / Folga de acoplamento',
      'Trava do módulo quebrada',
      'Empeno / Deformação de injeção',
      'Tecla dura / Emperrando ao pulsar'
    ]
  },
  {
    id: 'it_estetico',
    name: 'Avaria / Estético / Visual',
    subcategories: [
      'Riscado / Marcas superficiais',
      'Manchado / Descoloração amarelada',
      'Trincado / Fissura no espelho',
      'Falha de pintura / Injeção irregular',
      'Diferença de tonalidade entre peças',
      'Rebarbas excessivas no corte'
    ]
  },
  {
    id: 'it_embalagem',
    name: 'Embalagem / Identificação',
    subcategories: [
      'Embalagem violada ou rasgada',
      'Código de barras / SKU ilegível',
      'Gravação do lote ausente no verso',
      'Falta de parafusos de fixação no blister',
      'Manual / Instruções ausentes'
    ]
  },
  {
    id: 'it_comercial',
    name: 'Desistência / Troca Comercial',
    subcategories: [
      'Item divergente da Nota Fiscal',
      'Quantidade faturada diferente do pedido',
      'Devolução por arrependimento do consumidor',
      'Troca de especificação / Cor incorreta'
    ]
  },
  {
    id: 'it_logistica',
    name: 'Erro de Logística',
    subcategories: [
      'Atraso excessivo na entrega',
      'Mercadoria danificada no transporte',
      'Extravio parcial de caixas',
      'Volume entregue em endereço incorreto'
    ]
  },
  {
    id: 'it_outro',
    name: 'Outro',
    subcategories: [
      'Reclamação geral de ouvidoria',
      'Dúvida técnica de aplicação'
    ]
  }
];

export const INITIAL_TENANTS: Tenant[] = [
  {
    id: 'tenant_1',
    name: 'Dicompel Indústria e Comércio',
    plan: 'Enterprise',
    status: 'Ativo',
    createdAt: '2025-01-15T10:00:00Z',
    color: '#003355', // Simon Dicompel Blue
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
];

export const INITIAL_PRODUCTS: Product[] = [
  { code: 'SIM-19011', name: 'Conjunto 1 Interruptor Simples 10A Simon 19 Branco', line: 'Simon 19', producedQty: 60000 },
  { code: 'SIM-19022', name: 'Conjunto 1 Tomada 2P+T 10A 250V Simon 19 Branco', line: 'Simon 19', producedQty: 75000 },
  { code: 'SIM-20101', name: 'Módulo Interruptor Paralelo 10A Simon 20 Branco', line: 'Simon 20', producedQty: 85000 },
  { code: 'SIM-20202', name: 'Módulo Tomada 2P+T 20A Simon 20 Branco', line: 'Simon 20', producedQty: 90000 },
  { code: 'SIM-30110', name: 'Conjunto 2 Interruptores Simples + 1 Tomada Simon 30', line: 'Simon 30', producedQty: 45000 },
  { code: 'SIM-35044', name: 'Placa 4x2 com 3 Postos Simon 35 Grafite Fosco', line: 'Simon 35', producedQty: 35000 },
  { code: 'SIM-CON01', name: 'Módulo Carregador USB 2.4A Bivolt Simon Connect', line: 'Simon Connect', producedQty: 25000 },
  { code: 'SIM-NOV01', name: 'Pulsador de Campainha Novara Titânio', line: 'Novara', producedQty: 20000 }
];

export const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'SAC-0001',
    tenantId: 'tenant_1',
    customerName: 'Carlos Eduardo Mendes',
    clientName: 'Carlos Eduardo Mendes',
    resellerName: 'Distribuidora Elétrica Sul Ltda',
    reseller: 'Distribuidora Elétrica Sul Ltda',
    consumer: 'Carlos Eduardo Mendes',
    firstContactDate: '2026-05-14',
    productCode: 'SIM-20101',
    productName: 'Módulo Interruptor Paralelo 10A Simon 20 Branco',
    productLine: 'Simon 20',
    batch: 'L-240822A',
    issueType: 'Defeito Elétrico',
    subCategory: 'Mau contato elétrico',
    quantity: 45,
    invoiceNumber: 'NF-084920',
    notes: 'Consumidor relata que ao acionar o interruptor ocorre centelhamento interno e desligamento involuntário da carga.',
    description: 'Consumidor final entrou em contato informando que comprou 45 módulos na revenda Distribuidora Elétrica Sul. Ao instalar, constatou que os módulos apresentam mau contato elétrico nos bornes parafusados.',
    freightCost: 48.50,
    shippingValue: 48.50,
    pacReversoRequested: 'Sim',
    requestedReversePac: 'Sim',
    pacReversoCode: 'PI849201948BR',
    returnUF: 'SP',
    registeredUf: 'SP',
    clientEmail: 'carlos.mendes@eletricasul.com.br',
    observers: ['qualidade@dicompel.com.br', 'engenharia.simon20@dicompel.com.br'],
    status: 'Finalizado',
    createdAt: '2026-05-15T09:30:00Z',
    updatedAt: '2026-05-18T16:00:00Z',
    userId: 'user_dicompel_admin',
    userName: 'Administrador Dicompel',
    files: [
      {
        id: 'file_1',
        name: 'foto_modulo_contato.png',
        size: '1.2 MB',
        type: 'image/png',
        url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&q=80&w=400',
      },
      {
        id: 'file_2',
        name: 'laudo_eletrico_continuidade.pdf',
        size: '350 KB',
        type: 'application/pdf',
        url: '#',
      },
    ],
    comments: [
      {
        id: 'c_1',
        ticketId: 'SAC-0001',
        userId: 'user_dicompel_admin',
        userName: 'Administrador Dicompel',
        userRole: 'ADMIN',
        text: 'Amostras de retenção do lote L-240822A foram recolhidas e auditadas pela Qualidade.',
        createdAt: '2026-05-16T11:00:00Z',
      },
      {
        id: 'c_2',
        ticketId: 'SAC-0001',
        userId: 'user_dicompel_admin',
        userName: 'Administrador Dicompel',
        userRole: 'ADMIN',
        text: 'Peças repostas via PAC Reverso expedido para o cliente no mesmo dia.',
        createdAt: '2026-05-16T14:15:00Z',
      },
    ],
    qualityReport: {
      rootCause: 'Torque insuficiente no rebite de contato da lâmina de prata do balancim na linha Simon 20.',
      fiveWhys: [
        'Por que o interruptor perdeu o contato? Porque a lâmina oscilou internamente sob temperatura.',
        'Por que a lâmina oscilou? Porque o rebite de fixação mecânica apresentou folga axial de 0.2mm.',
        'Por que houve folga no rebite? Porque a prensa de rebitagem automática perdeu a calibração de pressão pneumática.',
        'Por que perdeu a calibração? Porque a válvula de alívio do compressor da linha 2 acumulou resíduo de óleo.',
        'Por que acumulou óleo? Porque o filtro coalescente da entrada de ar comprimido estava vencido há 15 dias.'
      ],
      correctiveAction: 'Troca imediata dos filtros coalescentes da linha de ar e recalibração da célula pneumática de rebitagem.',
      preventiveAction: 'Inserção de sensor de pressão digital com intertravamento na linha Simon 20 para impedir montagem com torque abaixo de 3.5 bar.',
      responsible: 'Engenharia de Qualidade Simon Dicompel',
      targetDate: '2026-05-30',
      updatedAt: '2026-05-17T15:00:00Z',
    },
    defects: [
      { id: 'def_1_1', description: 'Mau contato na lâmina móvel', quantity: 35, category: 'Defeito Elétrico', subcategory: 'Mau contato elétrico' },
      { id: 'def_1_2', description: 'Borne com rosca espanada', quantity: 10, category: 'Defeito Mecânico', subcategory: 'Sem rosca / Rosca espanada' }
    ],
    items: [
      {
        id: 'item_1',
        productCode: 'SIM-20101',
        productName: 'Módulo Interruptor Paralelo 10A Simon 20 Branco',
        productLine: 'Simon 20',
        quantity: 45,
        defectCategory: 'Defeito Elétrico',
        defectSubcategory: 'Mau contato elétrico',
        notes: '35 com mau contato e 10 com rosca espanada',
        invoiceNumber: 'NF-084920'
      }
    ],
    history: [
      {
        id: 'h_1',
        ticketId: 'SAC-0001',
        action: 'Abertura do Chamado',
        userId: 'user_dicompel_admin',
        userName: 'Administrador Dicompel',
        userRole: 'ADMIN',
        details: 'Abertura de atendimento de devolução SAC. Revenda: Distribuidora Elétrica Sul Ltda. Consumidor: Carlos Eduardo Mendes. PAC Reverso Solicitado: Sim.',
        timestamp: '2026-05-15T09:30:00Z',
      },
      {
        id: 'h_2',
        ticketId: 'SAC-0001',
        action: 'Mudar Status para: Finalizado',
        userId: 'user_dicompel_admin',
        userName: 'Administrador Dicompel',
        userRole: 'ADMIN',
        details: 'Tratativa concluída e parecer emitido com envio de reposição.',
        timestamp: '2026-05-18T16:00:00Z',
      },
    ],
  },
  {
    id: 'SAC-0002',
    tenantId: 'tenant_1',
    customerName: 'Construtora Horizonte Verde',
    clientName: 'Construtora Horizonte Verde',
    resellerName: '', // Não informada (opcional)
    firstContactDate: '2026-05-18',
    productCode: 'SIM-30110',
    productName: 'Conjunto 2 Interruptores Simples + 1 Tomada Simon 30',
    productLine: 'Simon 30',
    batch: 'L-110426C',
    issueType: 'Avaria / Estético / Visual',
    subCategory: 'Riscado / Marcas superficiais',
    quantity: 120,
    invoiceNumber: 'NF-102941',
    notes: 'Placas com riscos finos aparentes no espelho frontal.',
    description: 'Cliente comprou 120 conjuntos da Linha Simon 30 diretamente para obra residencial. Ao abrir os blisters, constatou que os espelhos apresentam arranhões superficiais visíveis contra a luz.',
    freightCost: 0,
    shippingValue: 0,
    pacReversoRequested: 'Não',
    requestedReversePac: 'Não',
    returnUF: 'SC',
    registeredUf: 'SC',
    status: 'Em tratativa',
    createdAt: '2026-05-19T14:00:00Z',
    updatedAt: '2026-05-20T10:30:00Z',
    userId: 'user_dicompel_admin',
    userName: 'Administrador Dicompel',
    files: [],
    comments: [],
    qualityReport: {
      rootCause: 'Atrito entre o plástico filme de proteção e o espelho injetado por estática na embaladora.',
      fiveWhys: [
        'Por que riscou o espelho? Porque o filme de proteção continha partículas de poeira de polimento.',
        'Por que havia poeira? Porque a bobina de filme foi armazenada próxima à fresadora de moldes.',
        'Por que foi armazenada lá? Porque o depósito de insumos de embalagem estava em reforma temporária.'
      ],
      correctiveAction: 'Isolamento completo da área de armazenamento de filmes térmicos e higienização das bobinas.',
      preventiveAction: 'Checklist diário de inspeção estática no setor de embalagens.',
      responsible: 'Qualidade Fábrica SC',
      targetDate: '2026-06-10',
      updatedAt: '2026-05-20T10:30:00Z'
    },
    defects: [
      { id: 'def_2_1', description: 'Espelho com micro-arranhões', quantity: 120, category: 'Avaria / Estético / Visual', subcategory: 'Riscado / Marcas superficiais' }
    ],
    items: [
      {
        id: 'item_2',
        productCode: 'SIM-30110',
        productName: 'Conjunto 2 Interruptores Simples + 1 Tomada Simon 30',
        productLine: 'Simon 30',
        quantity: 120,
        defectCategory: 'Avaria / Estético / Visual',
        defectSubcategory: 'Riscado / Marcas superficiais',
        notes: 'Arranhões no espelho',
        invoiceNumber: 'NF-102941'
      }
    ],
    history: [
      {
        id: 'h_3',
        ticketId: 'SAC-0002',
        action: 'Abertura do Chamado',
        userId: 'user_dicompel_admin',
        userName: 'Administrador Dicompel',
        userRole: 'ADMIN',
        details: 'SAC registra devolução de 120 unidades da Linha Simon 30.',
        timestamp: '2026-05-19T14:00:00Z',
      }
    ]
  },
  {
    id: 'SAC-0003',
    tenantId: 'tenant_1',
    customerName: 'Eletro Forte Instalações Comerciais',
    clientName: 'Eletro Forte Instalações Comerciais',
    resellerName: 'Materiais Elétricos Triângulo',
    reseller: 'Materiais Elétricos Triângulo',
    consumer: 'Eletro Forte Instalações Comerciais',
    firstContactDate: '2026-05-21',
    productCode: 'SIM-35044',
    productName: 'Placa 4x2 com 3 Postos Simon 35 Grafite Fosco',
    productLine: 'Simon 35',
    batch: 'L-040226B',
    issueType: 'Defeito Mecânico',
    subCategory: 'Trava do módulo quebrada',
    quantity: 60,
    invoiceNumber: 'NF-099412',
    notes: 'Travas quebram com facilidade durante encaixe do módulo.',
    description: 'Instalador relata que as travas laterais plásticas da placa Simon 35 estão quebradiças e partem ao pressionar o módulo para travar.',
    freightCost: 32.00,
    shippingValue: 32.00,
    pacReversoRequested: 'Sim',
    requestedReversePac: 'Sim',
    pacReversoCode: 'PI901249581BR',
    returnUF: 'MG',
    registeredUf: 'MG',
    status: 'Em analise',
    createdAt: '2026-05-22T10:00:00Z',
    updatedAt: '2026-05-22T10:00:00Z',
    userId: 'user_dicompel_admin',
    userName: 'Administrador Dicompel',
    files: [],
    comments: [],
    defects: [
      { id: 'def_3_1', description: 'Trava plástica ressecada/quebradiça', quantity: 60, category: 'Defeito Mecânico', subcategory: 'Trava do módulo quebrada' }
    ],
    items: [
      {
        id: 'item_3',
        productCode: 'SIM-35044',
        productName: 'Placa 4x2 com 3 Postos Simon 35 Grafite Fosco',
        productLine: 'Simon 35',
        quantity: 60,
        defectCategory: 'Defeito Mecânico',
        defectSubcategory: 'Trava do módulo quebrada',
        notes: 'Travas plásticas quebradiças',
        invoiceNumber: 'NF-099412'
      }
    ],
    history: [
      {
        id: 'h_4',
        ticketId: 'SAC-0003',
        action: 'Abertura do Chamado',
        userId: 'user_dicompel_admin',
        userName: 'Administrador Dicompel',
        userRole: 'ADMIN',
        details: 'Abertura do chamado SAC para triagem de polímero da linha Simon 35.',
        timestamp: '2026-05-22T10:00:00Z',
      }
    ]
  }
];
