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
  }
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

// Base de Produtos Limpa para Produção
export const INITIAL_PRODUCTS: Product[] = [];

// Base de Chamados e Pedidos Limpa para Produção
export const INITIAL_TICKETS: Ticket[] = [];
