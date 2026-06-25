-- =========================================================================================
--  QUALISAC - CONFIGURAÇÃO DE BANCO DE DATAS (AZURE POSTGRESQL / POSTGRES COMPATIBLE)
--  Projetado para: Azure Database for PostgreSQL (Single Server ou Flexible Server) e PostgreSQL Local
--  Ano: 2026
--  Desenvolvido por: Coolit Soluções em TI
-- =========================================================================================

--  COMO INSTALAR NO AZURE:
--  -----------------------------------------------------------------------------------------
--  Opção A - Via Query Editor do Azure Portal:
--    1. Entre no Portal do Azure (portal.azure.com).
--    2. Navegue até o recurso "Azure Database for PostgreSQL flexible server".
--    3. No menu lateral esquerdo, sob a seção "Configurações", acesse "Query Editor" (ou use o pgAdmin / DBeaver).
--    4. Conecte-se com as credenciais de administrador configuradas na sua instância (.env.example).
--    5. Copie todo o conteúdo deste arquivo, cole na tela do editor e clique em "Executar" (Run).
--
--  Opção B - Via CLI (psql):
--    Execute o comando no seu terminal substituindo seus dados:
--    psql "host=seu-servidor.postgres.database.azure.com port=5432 dbname=qualisac_db user=seu_usuario password=sua_senha sslmode=require" -f azure_setup.sql
-- =========================================================================================

-- 1. LIMPEZA SEGURA (OPCIONAL)
-- Descomente as linhas abaixo caso deseje limpar tabelas existentes antes da reinstalação:
-- DROP TABLE IF EXISTS system_email_logs CASCADE;
-- DROP TABLE IF EXISTS quality_reports CASCADE;
-- DROP TABLE IF EXISTS ticket_history CASCADE;
-- DROP TABLE IF EXISTS ticket_defects CASCADE;
-- DROP TABLE IF EXISTS ticket_comments CASCADE;
-- DROP TABLE IF EXISTS ticket_files CASCADE;
-- DROP TABLE IF EXISTS tickets CASCADE;
-- DROP TABLE IF EXISTS issue_subcategories CASCADE;
-- DROP TABLE IF EXISTS issue_categories CASCADE;
-- DROP TABLE IF EXISTS products CASCADE;
-- DROP TABLE IF EXISTS users CASCADE;
-- DROP TABLE IF EXISTS tenants CASCADE;


-- =========================================================================================
--  2. CRIAÇÃO DE MODELO DE TABELAS (SCHEMA DDL)
-- =========================================================================================

-- Tabelas Locatárias (Multi-SaaS Tenant support)
CREATE TABLE tenants (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    plan VARCHAR(30) NOT NULL CHECK (plan IN ('Growth', 'Enterprise', 'Trial')),
    status VARCHAR(30) NOT NULL CHECK (status IN ('Ativo', 'Suspenso', 'A vencer')),
    color VARCHAR(15) DEFAULT '#0284c7',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabelas de Usuários (Acesso dos Colaboradores)
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    role VARCHAR(30) NOT NULL CHECK (role IN ('ADMIN', 'SAC', 'QUALIDADE', 'COMUM')),
    password_hash VARCHAR(255) NOT NULL,
    tenant_id VARCHAR(50) REFERENCES tenants(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de Produtos Cadastrados (SKUs)
CREATE TABLE products (
    code VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Categorias Principais de Não-Conformidade / Desvios (Pai)
CREATE TABLE issue_categories (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Subcategorias Vinculadas a Categoria de Desvio (Filhos)
CREATE TABLE issue_subcategories (
    id SERIAL PRIMARY KEY,
    category_id VARCHAR(50) REFERENCES issue_categories(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_category_subcategory UNIQUE (category_id, name)
);

-- Chamados Registrados (Tickets de Ocorrência)
CREATE TABLE tickets (
    id VARCHAR(50) PRIMARY KEY,
    tenant_id VARCHAR(50) NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    product_code VARCHAR(50) REFERENCES products(code) ON DELETE SET NULL,
    product_name VARCHAR(255) NOT NULL,
    batch VARCHAR(100) NOT NULL, -- Lote rastreavel
    client_name VARCHAR(150) NOT NULL,
    issue_type VARCHAR(100) NOT NULL, -- Categoria Pai
    sub_category VARCHAR(100),       -- Subcategoria Filho
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0),
    description TEXT NOT NULL,
    status VARCHAR(50) NOT NULL CHECK (status IN ('Aberto', 'Em analise', 'Em tratativa', 'Resolvido', 'Finalizado')),
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(120) NOT NULL, -- Backup do nome de analista
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Arquivos e Imagens de Evidência Anexos ao Chamado
CREATE TABLE ticket_files (
    id VARCHAR(50) PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    size VARCHAR(30),
    type VARCHAR(100),
    url TEXT NOT NULL, -- URL do arquivo (ex: Azure Blob Storage ou Base64)
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Comentários e Logs de Comunicação Interna
CREATE TABLE ticket_comments (
    id VARCHAR(50) PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(120) NOT NULL,
    user_role VARCHAR(30) NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE CURRENT_TIMESTAMP
);

-- Itens de defeitos e quantitativos físicos detalhados adicionais
CREATE TABLE ticket_defects (
    id VARCHAR(50) PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    description VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity >= 0)
);

-- Passos de Histórico de Auditoria do Chamado (Timeline SLA Tracker)
CREATE TABLE ticket_history (
    id VARCHAR(50) PRIMARY KEY,
    ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    action VARCHAR(120) NOT NULL,
    user_id VARCHAR(50) REFERENCES users(id) ON DELETE SET NULL,
    user_name VARCHAR(120) NOT NULL,
    user_role VARCHAR(30) NOT NULL,
    details TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Relatório de Qualidade Integrado (Contramedidas / Plano de Qualidade - Causa Raiz)
CREATE TABLE quality_reports (
    ticket_id VARCHAR(50) PRIMARY KEY REFERENCES tickets(id) ON DELETE CASCADE,
    root_cause TEXT NOT NULL,
    five_whys TEXT[] NOT NULL DEFAULT '{}', -- Matriz de 5 Porquês do PostgreSQL (Array nativo)
    corrective_action TEXT NOT NULL,
    preventive_action TEXT NOT NULL,
    responsible VARCHAR(150),
    target_date DATE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Logs de Envio de E-mails e Notificações (SLA Audit Trail)
CREATE TABLE system_email_logs (
    id VARCHAR(50) PRIMARY KEY,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ticket_id VARCHAR(50) NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
    sender VARCHAR(120) NOT NULL,
    recipient_name VARCHAR(120) NOT NULL,
    recipient_email VARCHAR(120) NOT NULL,
    status VARCHAR(30) NOT NULL CHECK (status IN ('Resolvido', 'Finalizado')),
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    service_type VARCHAR(100) DEFAULT 'SMTP Azure Mailer'
);


-- =========================================================================================
--  3. CRIAÇÃO DE ÍNDICES OTIMIZADOS (PERFORMANCE ACCELERATOR)
-- =========================================================================================
CREATE INDEX idx_tickets_tenant ON tickets(tenant_id);
CREATE INDEX idx_tickets_status ON tickets(status);
CREATE INDEX idx_tickets_product ON tickets(product_code);
CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_issue_subcategories_cat ON issue_subcategories(category_id);
CREATE INDEX idx_history_ticket ON ticket_history(ticket_id);
CREATE INDEX idx_comments_ticket ON ticket_comments(ticket_id);


-- =========================================================================================
--  4. CARGA INICIAL DE SEEDING (POPULANDO DADOS ORIGINAIS)
-- =========================================================================================

-- Inserindo Tenants Iniciais
INSERT INTO tenants (id, name, plan, status, color, created_at) VALUES 
('tenant_1', 'Alimentos Estrela S/A', 'Enterprise', 'Ativo', '#0284c7', '2025-01-15 10:00:00+00'),
('tenant_2', 'Metalúrgica Progresso', 'Growth', 'Ativo', '#16a34a', '2025-03-10 12:00:00+00'),
('tenant_3', 'Logística Expressa Ltda.', 'Trial', 'A vencer', '#ea580c', '2026-05-20 08:00:00+00');

-- Inserindo Usuários Iniciais (Com o Admin Dicompel configurado)
INSERT INTO users (id, name, email, role, password_hash, tenant_id) VALUES 
('user_dicompel_admin', 'Administrador Dicompel', 'admin@dicompel.com.br', 'ADMIN', 'Dicompel!@#2026', 'tenant_1'),
('user_admin', 'Carlos Silva', 'admin@quali.com', 'ADMIN', 'admin', 'tenant_1'),
('user_sac', 'Juliana Souza', 'sac@quali.com', 'SAC', 'sac', 'tenant_1'),
('user_qualidade', 'Marcos Oliveira', 'qualidade@quali.com', 'QUALIDADE', 'quali', 'tenant_1'),
('user_comum', 'Rodrigo Costa', 'comum@quali.com', 'COMUM', 'comum', 'tenant_1'),
('user_metal_admin', 'Roberto Ferro', 'roberto@progresso.com', 'ADMIN', 'roberto', 'tenant_2'),
('user_metal_qual', 'Aline Metal', 'aline@progresso.com', 'QUALIDADE', 'aline', 'tenant_2');

-- Inserindo Produtos Iniciais (SKUs)
INSERT INTO products (code, name) VALUES 
('PROD-A310', 'Leite Condensado Estrela 395g'),
('PROD-B550', 'Biscoito Amanteigado Ninho 150g'),
('PROD-A102', 'Molho de Tomate Premium Sachê 340g'),
('PROD-C991', 'Suco de Uva Integral Orgânico 1L'),
('PROD-M88', 'Chapa Metálica Galvanizada 2mm');

-- Inserindo Categorias Principais de Desvios (Pai)
INSERT INTO issue_categories (id, name) VALUES 
('it_defeito', 'Defeito'),
('it_avaria', 'Avaria'),
('it_troca', 'Troca'),
('it_logistica', 'Erro de Logística'),
('it_outro', 'Outro');

-- Inserindo Subcategorias correspondentes (Filhos)
INSERT INTO issue_subcategories (category_id, name) VALUES 
('it_defeito', 'Riscado'),
('it_defeito', 'Amassado'),
('it_defeito', 'Quebrado'),
('it_defeito', 'Trincado'),
('it_defeito', 'Sem Pintura'),
('it_defeito', 'Mau funcionamento'),
('it_defeito', 'Padrão fora de medida'),

('it_avaria', 'Embalagem Danificada'),
('it_avaria', 'Molhado'),
('it_avaria', 'Oxidação / Ferrugem'),
('it_avaria', 'Manchado'),

('it_troca', 'Desistência do cliente'),
('it_troca', 'Erro comercial de pedido'),
('it_troca', 'Garantia estendida'),

('it_logistica', 'Quantidade incorreta'),
('it_logistica', 'Produto trocado'),
('it_logistica', 'Atraso na entrega'),
('it_logistica', 'Extravio de volume'),

('it_outro', 'Reclamação geral'),
('it_outro', 'Dúvida técnica');

-- Inserindo Chamados Históricos de Amostra
INSERT INTO tickets (id, tenant_id, product_code, product_name, batch, client_name, issue_type, sub_category, quantity, description, status, user_id, user_name, created_at, updated_at) VALUES 
(
  'TK-1001', 
  'tenant_1', 
  'PROD-A310', 
  'Leite Condensado Estrela 395g', 
  'L-240822A', 
  'Supermercados Pão e Trigo Ltda', 
  'Defeito', 
  'Mau funcionamento', 
  120, 
  'Cliente reclama que 120 latas de leite condensado vieram com a solda lateral danificada, ocasionando vazamentos em cerca de 40 unidades e estufamento nas demais.', 
  'Finalizado', 
  'user_sac', 
  'Juliana Souza', 
  '2026-05-15 09:30:00+00', 
  '2026-05-18 16:00:00+00'
),
(
  'TK-2001', 
  'tenant_2', 
  'PROD-M88', 
  'Chapa Metálica Galvanizada 2mm', 
  'LT-MET-001', 
  'Indústria Metalúrgica Sul', 
  'Defeito', 
  'Padrão fora de medida', 
  15, 
  'Chapas chegaram com empenamento longitudinal excessivo de até 8mm, impossibilitando a alimentação automática na máquina de corte laser.', 
  'Aberto', 
  'user_metal_qual', 
  'Aline Metal', 
  '2026-06-08 11:00:00+00', 
  '2026-06-08 11:00:00+00'
);

-- Evidências dos Chamados (Files)
INSERT INTO ticket_files (id, ticket_id, name, size, type, url) VALUES 
('file_1', 'TK-1001', 'foto_lote_vazado.png', '1.2 MB', 'image/png', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400'),
('file_2', 'TK-1001', 'laudo_temperatura.pdf', '350 KB', 'application/pdf', '#');

-- Comentários dos Chamados
INSERT INTO ticket_comments (id, ticket_id, user_id, user_name, user_role, text, created_at) VALUES 
('c_1', 'TK-1001', 'user_qualidade', 'Marcos Oliveira', 'QUALIDADE', 'Amostras de retenção do lote L-240822A foram recolhidas para análise físico-química preventiva na fábrica.', '2026-05-16 11:00:00+00'),
('c_2', 'TK-1001', 'user_sac', 'Juliana Souza', 'SAC', 'Ótimo, o cliente aguarda o posicionamento para realizar o descarte adequado do material.', '2026-05-16 14:15:00+00');

-- Defeitos Detalhados
INSERT INTO ticket_defects (id, ticket_id, description, quantity) VALUES 
('def_1_1', 'TK-1001', 'solda lateral danificada / vazamento', 40),
('def_1_2', 'TK-1001', 'estufamento microbiano residual', 50),
('def_1_3', 'TK-1001', 'amassado por transporte', 30),
('def_5_1', 'TK-2001', 'empenamento longitudinal excessivo', 10),
('def_5_2', 'TK-2001', 'risco profundo na galvanização protetora', 5);

-- Histórico de SLA / Linha do tempo dos chamados
INSERT INTO ticket_history (id, ticket_id, action, user_id, user_name, user_role, details, timestamp) VALUES 
('h_1', 'TK-1001', 'Abertura do Chamado', 'user_sac', 'Juliana Souza', 'SAC', 'Chamado cadastrado inicialmente com 120 latas afetadas.', '2026-05-15 09:30:00+00'),
('h_m1', 'TK-2001', 'Abertura do Chamado', 'user_metal_qual', 'Aline Metal', 'QUALIDADE', 'Abertura de teste do cliente Metalurgica.', '2026-06-08 11:00:00+00');

-- Relatório de Qualidade Técnico (Causa Raiz & 5 Whys)
INSERT INTO quality_reports (ticket_id, root_cause, five_whys, corrective_action, preventive_action, responsible, target_date, updated_at) VALUES 
(
  'TK-1001', 
  'Falha de calibração do eletrodo de soldagem da lata na Linha 3 de envase.', 
  ARRAY[
    'Por que as latas vazaram? Porque a solda lateral abriu.',
    'Por que a solda lateral abriu? Porque houve falta de aquecimento localizado durante o fechamento.',
    'Por que houve falta de aquecimento? Porque o eletrodo de solda operou abaixo da temperatura requerida.',
    'Por que a temperatura estava abaixo? Porque o sensor não corrigiu a resistência após flutuação térmica.',
    'Por que o sensor falhou? Porque o plano de calibração preventiva venceu há 15 dias sem execução.'
  ],
  'Calibração imediata do equipamento de soldagem. Replanejamento das manutenções preventivas semanais com tolerância zero para atrasos.', 
  'Configurar alerta automatizado no supervisório industrial para parar a esteira caso a calibração de solda decline >5% do limiar de segurança.', 
  'Marcos Oliveira / Eng. de Produção', 
  '2026-05-25', 
  '2026-05-17 15:30:00+00'
);

-- =========================================================================================
--  FIM DO ARQUIVO DE BANCO DE DADOS AZURE (SQL SCHEMA AND SEED COMPLETE)
-- =========================================================================================
