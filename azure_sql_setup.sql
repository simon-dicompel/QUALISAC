-- =========================================================================
-- SCRIPT DE CRIAÇÃO E CARGA INICIAL DO BANCO DE DADOS (AZURE SQL / MS SQL SERVER)
-- SISTEMA: QualiSAC ISO 9001 - Gestão Integrada de SAC & Não Conformidades
-- TENANT: Multi-tenant (SaaS) com isolamento
-- DATA DA ÚLTIMA ATUALIZAÇÃO: 2026-06-25
-- =========================================================================

SET XACT_ABORT ON;
BEGIN TRANSACTION;

-- ==========================================
-- 1. DROP DE TABELAS SE EXISTIREM (ORDENADOS DE ACORDO COM CHAVES ESTRANGEIRAS)
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
-- 2. CRIAÇÃO DAS TABELAS (COM NOMES ENTRE COLCHETES PARA EVITAR PALAVRAS RESERVADAS)
-- ==========================================

-- TABELA: Tenants (Empresas Clientes / SaaS)
CREATE TABLE dbo.Tenants (
    id VARCHAR(50) NOT NULL,
    name NVARCHAR(150) NOT NULL,
    [plan] VARCHAR(50) NOT NULL,
    [status] VARCHAR(50) NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    color VARCHAR(10) NULL,
    CONSTRAINT PK_Tenants PRIMARY KEY (id),
    CONSTRAINT CK_Tenants_Plan CHECK ([plan] IN ('Growth', 'Enterprise', 'Trial')),
    CONSTRAINT CK_Tenants_Status CHECK ([status] IN ('Ativo', 'Suspenso', 'A vencer'))
);

-- TABELA: Users (Usuários e Perfis de Acesso)
CREATE TABLE dbo.Users (
    id VARCHAR(50) NOT NULL,
    name NVARCHAR(150) NOT NULL,
    email NVARCHAR(150) NOT NULL,
    [role] VARCHAR(50) NOT NULL,
    passwordHash VARCHAR(255) NULL,
    tenantId VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Users PRIMARY KEY (id),
    CONSTRAINT UQ_Users_Email UNIQUE (email),
    CONSTRAINT FK_Users_Tenants FOREIGN KEY (tenantId) REFERENCES dbo.Tenants(id) ON DELETE CASCADE,
    CONSTRAINT CK_Users_Role CHECK ([role] IN ('ADMIN', 'SAC', 'QUALIDADE', 'COMUM'))
);

-- TABELA: Products (Catálogo de Produtos)
CREATE TABLE dbo.Products (
    code VARCHAR(50) NOT NULL,
    name NVARCHAR(200) NOT NULL,
    producedQty INT NULL DEFAULT 0,
    line NVARCHAR(100) NULL DEFAULT 'Geral',
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
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
    productCode VARCHAR(50) NULL,
    productName NVARCHAR(200) NULL,
    batch VARCHAR(100) NULL,
    clientName NVARCHAR(150) NULL,
    issueType NVARCHAR(100) NULL,
    subCategory NVARCHAR(100) NULL,
    quantity INT NOT NULL DEFAULT 1,
    description NVARCHAR(MAX) NULL,
    [status] VARCHAR(50) NOT NULL DEFAULT 'Aberto',
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    userId VARCHAR(50) NULL,
    userName NVARCHAR(150) NULL,
    payload NVARCHAR(MAX) NULL,
    CONSTRAINT PK_Tickets PRIMARY KEY (id),
    CONSTRAINT FK_Tickets_Tenants FOREIGN KEY (tenantId) REFERENCES dbo.Tenants(id) ON DELETE CASCADE,
    CONSTRAINT CK_Tickets_Status CHECK ([status] IN ('Aberto', 'Em analise', 'Em tratativa', 'Resolvido', 'Finalizado'))
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
    [userRole] VARCHAR(50) NOT NULL,
    [text] NVARCHAR(MAX) NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_TicketComments PRIMARY KEY (id),
    CONSTRAINT FK_TicketComments_Tickets FOREIGN KEY (ticketId) REFERENCES dbo.Tickets(id) ON DELETE CASCADE,
    CONSTRAINT CK_TicketComments_UserRole CHECK ([userRole] IN ('ADMIN', 'SAC', 'QUALIDADE', 'COMUM'))
);

-- TABELA: QualityReports (Planos de Ação 8D / Tratativa ISO 9001 - Relatório 1:1)
CREATE TABLE dbo.QualityReports (
    ticketId VARCHAR(50) NOT NULL,
    rootCause NVARCHAR(MAX) NOT NULL,
    fiveWhys NVARCHAR(MAX) NOT NULL,
    correctiveAction NVARCHAR(MAX) NOT NULL,
    preventiveAction NVARCHAR(MAX) NOT NULL,
    responsible NVARCHAR(150) NOT NULL,
    targetDate VARCHAR(10) NOT NULL,
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
    [text] NVARCHAR(500) NOT NULL,
    dueDate VARCHAR(10) NOT NULL,
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
    [userRole] VARCHAR(50) NOT NULL,
    details NVARCHAR(MAX) NULL,
    timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_HistorySteps PRIMARY KEY (id),
    CONSTRAINT FK_HistorySteps_Tickets FOREIGN KEY (ticketId) REFERENCES dbo.Tickets(id) ON DELETE CASCADE,
    CONSTRAINT CK_HistorySteps_UserRole CHECK ([userRole] IN ('ADMIN', 'SAC', 'QUALIDADE', 'COMUM'))
);

-- TABELA: SystemEmailLogs (Logs de envio de Notificações / SMS / E-mails)
CREATE TABLE dbo.SystemEmailLogs (
    id VARCHAR(50) NOT NULL,
    timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ticketId VARCHAR(50) NOT NULL,
    sender NVARCHAR(150) NOT NULL,
    recipientName NVARCHAR(150) NOT NULL,
    recipientEmail NVARCHAR(150) NOT NULL,
    [status] VARCHAR(50) NOT NULL,
    subject NVARCHAR(255) NOT NULL,
    body NVARCHAR(MAX) NOT NULL,
    serviceType NVARCHAR(150) NOT NULL DEFAULT 'SMTP sac@dicompel.com.br',
    CONSTRAINT PK_SystemEmailLogs PRIMARY KEY (id)
);

-- ==========================================
-- 3. CRIAÇÃO DE ÍNDICES PARA ALTA PERFORMANCE
-- ==========================================

CREATE INDEX IX_Users_TenantId ON dbo.Users(tenantId);
CREATE INDEX IX_Tickets_TenantId_Status ON dbo.Tickets(tenantId, [status]);
CREATE INDEX IX_Tickets_ProductCode ON dbo.Tickets(productCode);
CREATE INDEX IX_TicketComments_TicketId ON dbo.TicketComments(ticketId);
CREATE INDEX IX_HistorySteps_TicketId ON dbo.HistorySteps(ticketId);
CREATE INDEX IX_TicketFiles_TicketId ON dbo.TicketFiles(ticketId);

-- ==========================================
-- 4. CARGA DE DADOS INICIAIS (SEED DATA)
-- ==========================================

-- Seed: Tenants (Dicompel Matriz)
INSERT INTO dbo.Tenants (id, name, [plan], [status], createdAt, color) VALUES
('tenant_1', N'Dicompel Indústria e Comércio', 'Enterprise', 'Ativo', GETUTCDATE(), '#003355');

-- Seed: Usuário Administrador Principal
INSERT INTO dbo.Users (id, name, email, [role], passwordHash, tenantId) VALUES
('user_dicompel_admin', N'Administrador Dicompel', 'admin@dicompel.com.br', 'ADMIN', 'Dicompel!@#2026', 'tenant_1');

-- Seed: Categorias ISO 9001
INSERT INTO dbo.IssueCategories (id, name) VALUES
('it_eletrico', N'Defeito Elétrico'),
('it_mecanico', N'Defeito Mecânico'),
('it_estetico', N'Avaria / Estético / Visual'),
('it_embalagem', N'Embalagem / Identificação'),
('it_comercial', N'Desistência / Troca Comercial'),
('it_logistica', N'Erro de Logística'),
('it_outro', N'Outro');

-- Seed: Subcategorias ISO 9001
INSERT INTO dbo.IssueSubcategories (categoryId, name) VALUES
('it_eletrico', N'Mau contato elétrico'),
('it_eletrico', N'Curto-circuito interno'),
('it_eletrico', N'Superaquecimento sob carga'),
('it_mecanico', N'Sem rosca / Rosca espanada'),
('it_mecanico', N'Mola travada ou partida'),
('it_mecanico', N'Tecla dura / Emperrando ao pulsar'),
('it_estetico', N'Riscado / Marcas superficiais'),
('it_estetico', N'Manchado / Descoloração amarelada'),
('it_estetico', N'Trincado / Fissura no espelho'),
('it_embalagem', N'Embalagem violada ou rasgada'),
('it_embalagem', N'Código de barras / SKU ilegível'),
('it_comercial', N'Item divergente da Nota Fiscal'),
('it_comercial', N'Devolução por arrependimento'),
('it_logistica', N'Atraso excessivo na entrega'),
('it_logistica', N'Mercadoria danificada no transporte'),
('it_outro', N'Reclamação geral de ouvidoria'),
('it_outro', N'Dúvida técnica de aplicação');

-- Confirmação e commit da transação
COMMIT TRANSACTION;
PRINT 'Tabelas do QualiSAC criadas com sucesso no Azure SQL!';
