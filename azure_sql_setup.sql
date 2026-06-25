-- =========================================================================
-- SCRIPT DE CRIAÇÃO E CARGA INICIAL DO BANCO DE DADOS (AZURE SQL / MS SQL SERVER)
-- SISTEMA: QualiSAC ISO 9001 - Gestão Integrada de SAC & Não Conformidades
-- TENANT: Multi-tenant (SaaS) com isolamento
-- DATA DA ÚLTIMA ATUALIZAÇÃO: 2026-06-25
-- =========================================================================

-- Configurações de transação para segurança na execução do script
SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- ==========================================
-- 1. DROP DE TABELAS SE EXISTIREM (ORDEADOS DE ACORDO COM CHAVES ESTRANGEIRAS)
-- ==========================================

IF OBJECT_ID('dbo.SystemEmailLogs', 'U') IS NOT NULL DROP TABLE dbo.SystemEmailLogs;
IF OBJECT_ID('dbo.HistorySteps', 'U') IS NOT NULL DROP TABLE dbo.HistorySteps;
IF OBJECT_ID('dbo.TicketReminders', 'U') IS NOT NULL DROP TABLE dbo.TicketReminders;
IF OBJECT_ID('dbo.TicketDefects', 'U') IS NOT NULL DROP TABLE dbo.TicketDefects;
IF OBJECT_ID('dbo.QualityReports', 'U') IS NOT NULL DROP TABLE dbo.QualityReports;
IF OBJECT_ID('dbo.TicketComments', 'U') IS NOT NULL DROP TABLE dbo.TicketComments;
IF OBJECT_ID('dbo.TicketFiles', 'U') IS NOT NULL DROP TABLE dbo.TicketFiles;
IF OBJECT_ID('dbo.Tickets', 'U') IS NOT NULL DROP TABLE dbo.Tickets;
IF OBJECT_ID('dbo.IssueSubcategories', 'U') IS NOT NULL DROP TABLE dbo.IssueSubcategories;
IF OBJECT_ID('dbo.IssueCategories', 'U') IS NOT NULL DROP TABLE dbo.IssueCategories;
IF OBJECT_ID('dbo.Products', 'U') IS NOT NULL DROP TABLE dbo.Products;
IF OBJECT_ID('dbo.Users', 'U') IS NOT NULL DROP TABLE dbo.Users;
IF OBJECT_ID('dbo.Tenants', 'U') IS NOT NULL DROP TABLE dbo.Tenants;

-- ==========================================
-- 2. CRIAÇÃO DAS TABELAS
-- ==========================================

-- TABELA: Tenants (Empresas Clientes / SaaS)
CREATE TABLE dbo.Tenants (
    id VARCHAR(50) NOT NULL,
    name NVARCHAR(150) NOT NULL,
    plan VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    color VARCHAR(10) NULL,
    CONSTRAINT PK_Tenants PRIMARY KEY (id),
    CONSTRAINT CK_Tenants_Plan CHECK (plan IN ('Growth', 'Enterprise', 'Trial')),
    CONSTRAINT CK_Tenants_Status CHECK (status IN ('Ativo', 'Suspenso', 'A vencer'))
);

-- TABELA: Users (Usuários e Perfis de Acesso)
CREATE TABLE dbo.Users (
    id VARCHAR(50) NOT NULL,
    name NVARCHAR(150) NOT NULL,
    email NVARCHAR(150) NOT NULL,
    role VARCHAR(50) NOT NULL,
    passwordHash VARCHAR(255) NULL,
    tenantId VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Users PRIMARY KEY (id),
    CONSTRAINT UQ_Users_Email UNIQUE (email),
    CONSTRAINT FK_Users_Tenants FOREIGN KEY (tenantId) REFERENCES dbo.Tenants(id) ON DELETE CASCADE,
    CONSTRAINT CK_Users_Role CHECK (role IN ('ADMIN', 'SAC', 'QUALIDADE', 'COMUM'))
);

-- TABELA: Products (Catálogo de Produtos)
CREATE TABLE dbo.Products (
    code VARCHAR(50) NOT NULL,
    name NVARCHAR(200) NOT NULL,
    producedQty INT NULL DEFAULT 0,
    line NVARCHAR(100) NULL DEFAULT 'Geral',
    CONSTRAINT PK_Products PRIMARY KEY (code)
);

-- TABELA: IssueCategories (Categorias de Não Conformidades)
CREATE TABLE dbo.IssueCategories (
    id VARCHAR(50) NOT NULL,
    name NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_IssueCategories PRIMARY KEY (id)
);

-- TABELA: IssueSubcategories (Subcategorias vinculadas à Categoria)
CREATE TABLE dbo.IssueSubcategories (
    categoryId VARCHAR(50) NOT NULL,
    name NVARCHAR(100) NOT NULL,
    CONSTRAINT PK_IssueSubcategories PRIMARY KEY (categoryId, name),
    CONSTRAINT FK_IssueSubcategories_Categories FOREIGN KEY (categoryId) REFERENCES dbo.IssueCategories(id) ON DELETE CASCADE
);

-- TABELA: Tickets (Chamados / Não Conformidades)
CREATE TABLE dbo.Tickets (
    id VARCHAR(50) NOT NULL,
    tenantId VARCHAR(50) NOT NULL,
    productCode VARCHAR(50) NOT NULL,
    productName NVARCHAR(200) NOT NULL,
    batch VARCHAR(100) NOT NULL,
    clientName NVARCHAR(150) NOT NULL,
    issueType NVARCHAR(100) NOT NULL,
    subCategory NVARCHAR(100) NULL,
    quantity INT NOT NULL DEFAULT 1,
    description NVARCHAR(MAX) NOT NULL,
    status VARCHAR(50) NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    userId VARCHAR(50) NOT NULL,
    userName NVARCHAR(150) NOT NULL,
    CONSTRAINT PK_Tickets PRIMARY KEY (id),
    CONSTRAINT FK_Tickets_Tenants FOREIGN KEY (tenantId) REFERENCES dbo.Tenants(id) ON DELETE CASCADE,
    CONSTRAINT CK_Tickets_Status CHECK (status IN ('Aberto', 'Em analise', 'Em tratativa', 'Resolvido', 'Finalizado'))
);

-- TABELA: TicketFiles (Anexos / Imagens e Relatórios de Evidências)
CREATE TABLE dbo.TicketFiles (
    id VARCHAR(50) NOT NULL,
    ticketId VARCHAR(50) NOT NULL,
    name NVARCHAR(255) NOT NULL,
    size VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL,
    url NVARCHAR(2083) NOT NULL,
    CONSTRAINT PK_TicketFiles PRIMARY KEY (id),
    CONSTRAINT FK_TicketFiles_Tickets FOREIGN KEY (ticketId) REFERENCES dbo.Tickets(id) ON DELETE CASCADE
);

-- TABELA: TicketComments (Linha do Tempo / Interações e Comentários)
CREATE TABLE dbo.TicketComments (
    id VARCHAR(50) NOT NULL,
    ticketId VARCHAR(50) NOT NULL,
    userId VARCHAR(50) NOT NULL,
    userName NVARCHAR(150) NOT NULL,
    userRole VARCHAR(50) NOT NULL,
    text NVARCHAR(MAX) NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_TicketComments PRIMARY KEY (id),
    CONSTRAINT FK_TicketComments_Tickets FOREIGN KEY (ticketId) REFERENCES dbo.Tickets(id) ON DELETE CASCADE,
    CONSTRAINT CK_TicketComments_UserRole CHECK (userRole IN ('ADMIN', 'SAC', 'QUALIDADE', 'COMUM'))
);

-- TABELA: QualityReports (Planos de Ação 8D / Tratativa ISO 9001 - Relatório 1:1)
CREATE TABLE dbo.QualityReports (
    ticketId VARCHAR(50) NOT NULL,
    rootCause NVARCHAR(MAX) NOT NULL,
    fiveWhys NVARCHAR(MAX) NOT NULL, -- Armazena a sequência dos 5 Porquês em formato JSON ou texto corrido
    correctiveAction NVARCHAR(MAX) NOT NULL,
    preventiveAction NVARCHAR(MAX) NOT NULL,
    responsible NVARCHAR(150) NOT NULL,
    targetDate VARCHAR(10) NOT NULL, -- Formato YYYY-MM-DD
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_QualityReports PRIMARY KEY (ticketId),
    CONSTRAINT FK_QualityReports_Tickets FOREIGN KEY (ticketId) REFERENCES dbo.Tickets(id) ON DELETE CASCADE
);

-- TABELA: TicketDefects (Itens de desvio individuais por Chamado)
CREATE TABLE dbo.TicketDefects (
    id VARCHAR(50) NOT NULL,
    ticketId VARCHAR(50) NOT NULL,
    description NVARCHAR(255) NOT NULL,
    quantity INT NOT NULL DEFAULT 1,
    CONSTRAINT PK_TicketDefects PRIMARY KEY (id),
    CONSTRAINT FK_TicketDefects_Tickets FOREIGN KEY (ticketId) REFERENCES dbo.Tickets(id) ON DELETE CASCADE
);

-- TABELA: TicketReminders (Lembretes e Prazos do Chamado)
CREATE TABLE dbo.TicketReminders (
    id VARCHAR(50) NOT NULL,
    ticketId VARCHAR(50) NOT NULL,
    text NVARCHAR(500) NOT NULL,
    dueDate VARCHAR(10) NOT NULL, -- Formato YYYY-MM-DD
    priority VARCHAR(50) NOT NULL,
    completed BIT NOT NULL DEFAULT 0,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_TicketReminders PRIMARY KEY (id),
    CONSTRAINT FK_TicketReminders_Tickets FOREIGN KEY (ticketId) REFERENCES dbo.Tickets(id) ON DELETE CASCADE,
    CONSTRAINT CK_TicketReminders_Priority CHECK (priority IN ('Baixa', 'Média', 'Alta'))
);

-- TABELA: HistorySteps (Histórico de Rastreabilidade e Auditoria ISO 9001)
CREATE TABLE dbo.HistorySteps (
    id VARCHAR(50) NOT NULL,
    ticketId VARCHAR(50) NOT NULL,
    action NVARCHAR(255) NOT NULL,
    userId VARCHAR(50) NOT NULL,
    userName NVARCHAR(150) NOT NULL,
    userRole VARCHAR(50) NOT NULL,
    details NVARCHAR(MAX) NULL,
    timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_HistorySteps PRIMARY KEY (id),
    CONSTRAINT FK_HistorySteps_Tickets FOREIGN KEY (ticketId) REFERENCES dbo.Tickets(id) ON DELETE CASCADE,
    CONSTRAINT CK_HistorySteps_UserRole CHECK (userRole IN ('ADMIN', 'SAC', 'QUALIDADE', 'COMUM'))
);

-- TABELA: SystemEmailLogs (Logs de envio de Notificações / SMS / E-mails)
CREATE TABLE dbo.SystemEmailLogs (
    id VARCHAR(50) NOT NULL,
    timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ticketId VARCHAR(50) NOT NULL,
    sender NVARCHAR(150) NOT NULL,
    recipientName NVARCHAR(150) NOT NULL,
    recipientEmail NVARCHAR(150) NOT NULL,
    status VARCHAR(50) NOT NULL,
    subject NVARCHAR(255) NOT NULL,
    body NVARCHAR(MAX) NOT NULL,
    serviceType NVARCHAR(150) NOT NULL DEFAULT 'SMTP Broker',
    CONSTRAINT PK_SystemEmailLogs PRIMARY KEY (id)
);

-- ==========================================
-- 3. CRIAÇÃO DE ÍNDICES PARA ALTA PERFORMANCE (IDEAL PARA FILTROS E SAAS)
-- ==========================================

CREATE INDEX IX_Users_TenantId ON dbo.Users(tenantId);
CREATE INDEX IX_Tickets_TenantId_Status ON dbo.Tickets(tenantId, status);
CREATE INDEX IX_Tickets_ProductCode ON dbo.Tickets(productCode);
CREATE INDEX IX_TicketComments_TicketId ON dbo.TicketComments(ticketId);
CREATE INDEX IX_HistorySteps_TicketId ON dbo.HistorySteps(ticketId);
CREATE INDEX IX_TicketFiles_TicketId ON dbo.TicketFiles(ticketId);

-- ==========================================
-- 4. CARGA DE DADOS INICIAIS (SEED DATA)
-- ==========================================

-- Seed: Tenants
INSERT INTO dbo.Tenants (id, name, plan, status, createdAt, color) VALUES
('tenant_1', N'Alimentos Estrela S/A', 'Enterprise', 'Ativo', '2025-01-15T10:00:00Z', '#0284c7'),
('tenant_2', N'Metalúrgica Progresso', 'Growth', 'Ativo', '2025-03-10T12:00:00Z', '#16a34a'),
('tenant_3', N'Logística Expressa Ltda.', 'Trial', 'A vencer', '2026-05-20T08:00:00Z', '#ea580c');

-- Seed: Users
INSERT INTO dbo.Users (id, name, email, role, passwordHash, tenantId) VALUES
('user_dicompel_admin', N'Administrador Dicompel', 'admin@dicompel.com.br', 'ADMIN', 'Dicompel!@#2026', 'tenant_1'),
('user_admin', N'Carlos Silva', 'admin@quali.com', 'ADMIN', 'admin', 'tenant_1'),
('user_sac', N'Juliana Souza', 'sac@quali.com', 'SAC', 'sac', 'tenant_1'),
('user_qualidade', N'Marcos Oliveira', 'qualidade@quali.com', 'QUALIDADE', 'quali', 'tenant_1'),
('user_comum', N'Rodrigo Costa', 'comum@quali.com', 'COMUM', 'comum', 'tenant_1'),
('user_metal_admin', N'Roberto Ferro', 'roberto@progresso.com', 'ADMIN', 'roberto', 'tenant_2'),
('user_metal_qual', N'Aline Metal', 'aline@progresso.com', 'QUALIDADE', 'aline', 'tenant_2');

-- Seed: Products
INSERT INTO dbo.Products (code, name, producedQty, line) VALUES
('PROD-A310', N'Leite Condensado Estrela 395g', 50000, N'Lácteos'),
('PROD-B550', N'Biscoito Amanteigado Ninho 150g', 30000, N'Biscoitos'),
('PROD-A102', N'Molho de Tomate Premium Sachê 340g', 100000, N'Molhos'),
('PROD-C991', N'Suco de Uva Integral Orgânico 1L', 15000, N'Bebidas'),
('PROD-M88', N'Chapa Metálica Galvanizada 2mm', 2500, N'Chapas');

-- Seed: IssueCategories
INSERT INTO dbo.IssueCategories (id, name) VALUES
('it_defeito', N'Defeito'),
('it_avaria', N'Avaria'),
('it_troca', N'Troca'),
('it_logistica', N'Erro de Logística'),
('it_outro', N'Outro');

-- Seed: IssueSubcategories
INSERT INTO dbo.IssueSubcategories (categoryId, name) VALUES
('it_defeito', N'Riscado'),
('it_defeito', N'Amassado'),
('it_defeito', N'Quebrado'),
('it_defeito', N'Trincado'),
('it_defeito', N'Sem Pintura'),
('it_defeito', N'Mau funcionamento'),
('it_defeito', N'Padrão fora de medida'),
('it_avaria', N'Embalagem Danificada'),
('it_avaria', N'Molhado'),
('it_avaria', N'Oxidação / Ferrugem'),
('it_avaria', N'Manchado'),
('it_troca', N'Desistência do cliente'),
('it_troca', N'Erro comercial de pedido'),
('it_troca', N'Garantia estendida'),
('it_logistica', N'Quantidade incorreta'),
('it_logistica', N'Produto trocado'),
('it_logistica', N'Atraso na entrega'),
('it_logistica', N'Extravio de volume'),
('it_outro', N'Reclamação geral'),
('it_outro', N'Dúvida técnica');

-- Seed: Tickets
INSERT INTO dbo.Tickets (id, tenantId, productCode, productName, batch, clientName, issueType, subCategory, quantity, description, status, createdAt, updatedAt, userId, userName) VALUES
('TK-1001', 'tenant_1', 'PROD-A310', N'Leite Condensado Estrela 395g', 'L-240822A', N'Supermercados Pão e Trigo Ltda', N'Defeito', N'Mau funcionamento', 120, N'Cliente reclama que 120 latas de leite condensado vieram com a solda lateral danificada, ocasionando vazamentos em cerca de 40 unidades e estufamento nas demais.', 'Finalizado', '2026-05-15T09:30:00Z', '2026-05-18T16:00:00Z', 'user_sac', N'Juliana Souza'),
('TK-1002', 'tenant_1', 'PROD-B550', N'Biscoito Amanteigado Ninho 150g', 'L-120925C', N'Atacadão Alvorada Distribuição', N'Avaria', N'Embalagem Danificada', 450, N'Caixas master de papelão amassadas e rasgadas durante o descarregamento na doca 4. Suspeita-se que houve empilhamento excessivo no transporte.', 'Em analise', '2026-06-02T14:20:00Z', '2026-06-03T09:10:00Z', 'user_sac', N'Juliana Souza'),
('TK-1003', 'tenant_1', 'PROD-A102', N'Molho de Tomate Premium Sachê 340g', 'L-291125X', N'Carrefour Comércio do Brasil', N'Troca', N'Erro comercial de pedido', 80, N'Molhos de tomate faturados incorretamente. O cliente comprou Molho com Manjericão, mas recebeu Molho Tradicional nas caixas externas etiquetadas erradas.', 'Aberto', '2026-06-09T17:45:00Z', '2026-06-09T17:45:00Z', 'user_sac', N'Juliana Souza'),
('TK-1004', 'tenant_1', 'PROD-C991', N'Suco de Uva Integral Orgânico 1L', 'L-040226B', N'Grupo Zaffari S/A', N'Defeito', N'Trincado', 250, N'Presença acentuada de sedimentos (borras/tartaratos) no fundo das garrafas, muito superior ao aceitável. O cliente se recusa a expor o lote nas gôndolas e solicita devolução imediata por não conformidade visual.', 'Em tratativa', '2026-05-20T10:00:00Z', '2026-05-24T11:20:00Z', 'user_sac', N'Juliana Souza'),
('TK-2001', 'tenant_2', 'PROD-M88', N'Chapa Metálica Galvanizada 2mm', 'LT-MET-001', N'Indústria Metalúrgica Sul', N'Defeito', N'Padrão fora de medida', 15, N'Chapas chegaram com empenamento longitudinal excessivo de até 8mm, impossibilitando a alimentação automática na máquina de corte laser.', 'Aberto', '2026-06-08T11:00:00Z', '2026-06-08T11:00:00Z', 'user_metal_qual', N'Aline Metal');

-- Seed: TicketFiles
INSERT INTO dbo.TicketFiles (id, ticketId, name, size, type, url) VALUES
('file_1', 'TK-1001', N'foto_lote_vazado.png', '1.2 MB', 'image/png', 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400'),
('file_2', 'TK-1001', N'laudo_temperatura.pdf', '350 KB', 'application/pdf', '#'),
('file_3', 'TK-1002', N'paletes_esmagados.jpg', '2.1 MB', 'image/jpeg', 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&q=80&w=400'),
('file_4', 'TK-1004', N'garrafas_sedimento_fundo.png', '1.8 MB', 'image/png', 'https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?auto=format&fit=crop&q=80&w=400');

-- Seed: TicketComments
INSERT INTO dbo.TicketComments (id, ticketId, userId, userName, userRole, text, createdAt) VALUES
('c_1', 'TK-1001', 'user_qualidade', N'Marcos Oliveira', 'QUALIDADE', N'Amostras de retenção do lote L-240822A foram recolhidas para análise físico-química preventiva na fábrica.', '2026-05-16T11:00:00Z'),
('c_2', 'TK-1001', 'user_sac', N'Juliana Souza', 'SAC', N'Ótimo, o cliente aguarda o posicionamento para realizar o descarte adequado do material.', '2026-05-16T14:15:00Z'),
('c_3', 'TK-1002', 'user_sac', N'Juliana Souza', 'SAC', N'Motorista assinou ressalva na nota fiscal de entrada apontando tombamento parcial na curva.', '2026-06-02T14:30:00Z'),
('c_4', 'TK-1004', 'user_qualidade', N'Marcos Oliveira', 'QUALIDADE', N'Análise laboratorial conformou precipitação natural de bitartarato de potássio decorrente de choque térmico acelerado no resfriamento pós-pasteurização.', '2026-05-22T14:00:00Z');

-- Seed: QualityReports (Análise de Causa Raiz e 5 Porquês)
INSERT INTO dbo.QualityReports (ticketId, rootCause, fiveWhys, correctiveAction, preventiveAction, responsible, targetDate, updatedAt) VALUES
('TK-1001', 
 N'Falha de calibração do eletrodo de soldagem da lata na Linha 3 de envase.', 
 N'["Por que as latas vazaram? Porque a solda lateral abriu.","Por que a solda lateral abriu? Porque houve falta de aquecimento localizado durante o fechamento.","Por que houve falta de aquecimento? Porque o eletrodo de solda operou abaixo da temperatura requerida.","Por que a temperatura estava abaixo? Porque o sensor não corrigiu a resistência após flutuação térmica.","Por que o sensor falhou? Porque o plano de calibração preventiva venceu há 15 dias sem execução."]', 
 N'Calibração imediata do equipamento de soldagem. Replanejamento das manutenções preventivas semanais com tolerância zero para atrasos.', 
 N'Configurar alerta automatizado no supervisório industrial para parar a esteira caso a calibração de solda decline >5% do limiar de segurança.', 
 N'Marcos Oliveira / Eng. de Produção', 
 '2026-05-25', 
 '2026-05-17T15:30:00Z'),
('TK-1004', 
 N'Resfriamento brusco do mosto de uva estabilizado sob temperatura -4°C por falha operacional na autoclave de choque térmico.', 
 N'["Por que as garrafas criaram sedimentos visuais excessivos? Porque ocorreu precipitação ácida acelerada de tartaratos.","Por que precipitou açúcar e sal de tartrato? Porque o produto sofreu resfriamento demasiadamente brusco.","Por que o resfriamento foi brusco? Porque a válvula de refrigeração permaneceu 100% aberta por tempo excessivo.","Por que a válvula ficou aberta? Porque o sensor automático travou aberto com indicação emperrada.","Por que travou aberto? Porque houve ausência de manutenção preventiva nas eletroválvulas de água gelada."]', 
 N'Trocar o kit de solenoides da válvula reguladora de refrigeração e ajustar o padrão de lavagem térmica periódica.', 
 N'Auditoria de lote de estabilização a frio em cada tanque de maturação de uva antes do envase comercial.', 
 N'Marcos Oliveira / Química do Envase', 
 '2026-06-15', 
 '2026-05-23T16:00:00Z');

-- Seed: TicketDefects
INSERT INTO dbo.TicketDefects (id, ticketId, description, quantity) VALUES
('def_1_1', 'TK-1001', N'solda lateral danificada / vazamento', 40),
('def_1_2', 'TK-1001', N'estufamento microbiano residual', 50),
('def_1_3', 'TK-1001', N'amassado por transporte', 30),
('def_2_1', 'TK-1002', N'papelão master amassado', 300),
('def_2_2', 'TK-1002', N'pacote de biscoito rasgado/vazado', 150),
('def_3_1', 'TK-1003', N'erro de etiquetagem de sabor (manjericão por tradicional)', 80),
('def_4_1', 'TK-1004', N'sedimentos (borras de tartaratos) visíveis', 200),
('def_4_2', 'TK-1004', N'garrafa de vidro trincada/esmigalhada', 50),
('def_5_1', 'TK-2001', N'empenamento longitudinal excessivo', 10),
('def_5_2', 'TK-2001', N'risco profundo na galvanização protetora', 5);

-- Seed: HistorySteps
INSERT INTO dbo.HistorySteps (id, ticketId, action, userId, userName, userRole, details, timestamp) VALUES
('h_1', 'TK-1001', N'Abertura do Chamado', 'user_sac', N'Juliana Souza', 'SAC', N'Chamado cadastrado inicialmente com 120 latas afetadas.', '2026-05-15T09:30:00Z'),
('h_2', 'TK-1001', N'Mudar Status para: Em analise', 'user_qualidade', N'Marcos Oliveira', 'QUALIDADE', N'Análise de laboratório iniciada.', '2026-05-16T10:00:00Z'),
('h_3', 'TK-1001', N'Adicionar Comentário', 'user_qualidade', N'Marcos Oliveira', 'QUALIDADE', NULL, '2026-05-16T11:00:00Z'),
('h_4', 'TK-1001', N'Salvar Relatório de Qualidade', 'user_qualidade', N'Marcos Oliveira', 'QUALIDADE', N'Identificada causa raiz e definidos os 5 porquês.', '2026-05-17T15:30:00Z'),
('h_5', 'TK-1001', N'Mudar Status para: Resolvido', 'user_qualidade', N'Marcos Oliveira', 'QUALIDADE', N'Plano de ação corretiva inserido e validado com a gerência industrial.', '2026-05-17T15:45:00Z'),
('h_6', 'TK-1001', N'Finalização do Chamado', 'user_admin', N'Carlos Silva', 'ADMIN', N'Crédito de devolução emitido ao financeiro do cliente. Chamado encerrado.', '2026-05-18T16:00:00Z'),
('h_7', 'TK-1002', N'Abertura do Chamado', 'user_sac', N'Juliana Souza', 'SAC', N'Abertura com comprovação de avaria por transporte.', '2026-06-02T14:20:00Z'),
('h_8', 'TK-1002', N'Mudar Status para: Em analise', 'user_qualidade', N'Marcos Oliveira', 'QUALIDADE', N'Análise de responsabilidade logística em andamento.', '2026-06-03T09:10:00Z'),
('h_9', 'TK-1003', N'Abertura do Chamado', 'user_sac', N'Juliana Souza', 'SAC', N'Registro inicial de troca física por erro de expedição/etiqueta.', '2026-06-09T17:45:00Z'),
('h_10', 'TK-1004', N'Abertura do Chamado', 'user_sac', N'Juliana Souza', 'SAC', N'SAC cadastra solicitação de análise sobre acúmulo de borra.', '2026-05-20T10:00:00Z'),
('h_11', 'TK-1004', N'Mudar Status para: Em analise', 'user_qualidade', N'Marcos Oliveira', 'QUALIDADE', N'Amostras de teste de sedimentação enviadas à microquímica.', '2026-05-21T09:00:00Z'),
('h_12', 'TK-1004', N'Salvar Relatório de Qualidade', 'user_qualidade', N'Marcos Oliveira', 'QUALIDADE', N'Causa raiz descrita como falha de solenoide na refrigeração.', '2026-05-23T16:00:00Z'),
('h_13', 'TK-1004', N'Mudar Status para: Em tratativa', 'user_qualidade', N'Marcos Oliveira', 'QUALIDADE', N'Contatada transportadora e equipe logística para agendamento da coleta de devolução física.', '2026-05-24T11:20:00Z'),
('h_m1', 'TK-2001', N'Abertura do Chamado', 'user_metal_qual', N'Aline Metal', 'QUALIDADE', N'Abertura de teste do cliente Metalurgica.', '2026-06-08T11:00:00Z');

-- Confirmação e commit da transação
COMMIT TRANSACTION;
PRINT 'Script executado com sucesso! Banco de dados QualiSAC inicializado no Azure SQL.';
GO
