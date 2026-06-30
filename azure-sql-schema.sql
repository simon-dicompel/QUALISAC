-- ==================================================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DOS PARA AZURE SQL DATABASE (SQL SERVER T-SQL)
-- Sistema de Gestão de SAC & Qualidade - Simon Dicompel
-- Gerado em: 2026-06-26
-- ==================================================================================

-- Ativa o tratamento automático de transações e rola de volta em caso de erro grave
SET XACT_ABORT ON;
GO

-- 1. TABELA DE TENANTS (SaaS - Multi-empresas/Sedes)
CREATE TABLE Tenants (
    id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    plan VARCHAR(50) NOT NULL, -- 'Growth' | 'Enterprise' | 'Trial'
    status VARCHAR(50) NOT NULL, -- 'Ativo' | 'Suspenso' | 'A vencer'
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    color VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Tenants PRIMARY KEY (id)
);
GO

-- 2. TABELA DE USUÁRIOS
CREATE TABLE Users (
    id VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL, -- 'ADMIN' | 'SAC' | 'QUALIDADE' | 'COMUM'
    passwordHash VARCHAR(255) NULL,
    tenantId VARCHAR(50) NOT NULL,
    CONSTRAINT PK_Users PRIMARY KEY (id),
    CONSTRAINT FK_Users_Tenants FOREIGN KEY (tenantId) REFERENCES Tenants(id),
    CONSTRAINT UQ_Users_Email UNIQUE (email)
);
GO

-- 3. TABELA DE PRODUTOS (Mapeamento de SKUs Cadastrados)
CREATE TABLE Products (
    code VARCHAR(50) NOT NULL, -- Código SKU
    name VARCHAR(255) NOT NULL, -- Nome do Produto
    producedQty INT NULL, -- Quantidade Produzida (para cálculo de PPM)
    line VARCHAR(100) NULL, -- Linha do produto (ex: Novara)
    CONSTRAINT PK_Products PRIMARY KEY (code)
);
GO

-- 4. TABELA DE CATEGORIAS DE OCORRÊNCIAS / RECLAMAÇÕES
CREATE TABLE IssueTypeCategories (
    id VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    CONSTRAINT PK_IssueTypeCategories PRIMARY KEY (id)
);
GO

-- 5. TABELA DE SUBCATEGORIAS DE OCORRÊNCIAS
CREATE TABLE IssueTypeSubcategories (
    id INT IDENTITY(1,1) NOT NULL,
    categoryId VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    CONSTRAINT PK_IssueTypeSubcategories PRIMARY KEY (id),
    CONSTRAINT FK_IssueTypeSubcategories_Categories FOREIGN KEY (categoryId) REFERENCES IssueTypeCategories(id) ON DELETE CASCADE
);
GO

-- 6. TABELA PRINCIPAL DE CHAMADOS (TICKETS)
CREATE TABLE Tickets (
    id VARCHAR(50) NOT NULL, -- Número do Chamado (ex: SAC-2026-001)
    tenantId VARCHAR(50) NOT NULL, -- Multi-tenant
    productCode VARCHAR(50) NOT NULL, -- Código SKU Principal ou 'MULTIPLE' se houver vários
    productName VARCHAR(255) NOT NULL, -- Nome do Produto ou descritivo consolidado
    batch VARCHAR(100) NOT NULL, -- Lote Rastreável (Batch)
    clientName VARCHAR(255) NOT NULL, -- Nome do Cliente / Reclamante
    issueType VARCHAR(100) NOT NULL, -- Tipo de Ocorrência (ex: Defeito, Logística, Comercial)
    subCategory VARCHAR(100) NULL, -- Subcategoria detalhada
    quantity INT NOT NULL, -- Quantidade Total Afetada/Devolvida
    description NVARCHAR(MAX) NOT NULL, -- Descrição Detalhada da Reclamação
    status VARCHAR(50) NOT NULL, -- 'Aberto' | 'Em analise' | 'Em tratativa' | 'Resolvido' | 'Finalizado'
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    userId VARCHAR(50) NOT NULL, -- Usuário do SAC que abriu o chamado
    userName VARCHAR(255) NOT NULL, -- Nome do criador
    firstContactDate DATE NULL, -- Data do primeiro contato do cliente
    invoiceNumber VARCHAR(100) NULL, -- Número da Nota Fiscal de devolução/origem
    CONSTRAINT PK_Tickets PRIMARY KEY (id),
    CONSTRAINT FK_Tickets_Tenants FOREIGN KEY (tenantId) REFERENCES Tenants(id),
    CONSTRAINT FK_Tickets_Users FOREIGN KEY (userId) REFERENCES Users(id)
);
GO

-- 7. TABELA DE ITENS / MULTI-SKUS DEVOLVIDOS NO MESMO CHAMADO
-- Atende ao requisito de múltiplos SKUs associados a um único chamado
CREATE TABLE TicketItems (
    id VARCHAR(50) NOT NULL,
    ticketId VARCHAR(50) NOT NULL,
    productCode VARCHAR(50) NOT NULL,
    productName VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    CONSTRAINT PK_TicketItems PRIMARY KEY (id),
    CONSTRAINT FK_TicketItems_Tickets FOREIGN KEY (ticketId) REFERENCES Tickets(id) ON DELETE CASCADE
);
GO

-- Criando índice para melhorar as consultas de itens por chamado
CREATE NONCLUSTERED INDEX IX_TicketItems_TicketId ON TicketItems(ticketId);
GO

-- 8. TABELA DE DEFEITOS DO CHAMADO (Se houver classificação específica ou fracionada de defeitos)
CREATE TABLE TicketDefects (
    id VARCHAR(50) NOT NULL,
    ticketId VARCHAR(50) NOT NULL,
    description VARCHAR(255) NOT NULL,
    quantity INT NOT NULL,
    CONSTRAINT PK_TicketDefects PRIMARY KEY (id),
    CONSTRAINT FK_TicketDefects_Tickets FOREIGN KEY (ticketId) REFERENCES Tickets(id) ON DELETE CASCADE
);
GO

CREATE NONCLUSTERED INDEX IX_TicketDefects_TicketId ON TicketDefects(ticketId);
GO

-- 9. TABELA DE ARQUIVOS ANEXOS (Fotos do lote defeituoso, notas fiscais físicas, laudos etc.)
CREATE TABLE TicketFiles (
    id VARCHAR(50) NOT NULL,
    ticketId VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    size VARCHAR(50) NOT NULL,
    type VARCHAR(100) NOT NULL,
    url VARCHAR(2083) NOT NULL, -- Tamanho padrão máximo recomendado para URLs
    CONSTRAINT PK_TicketFiles PRIMARY KEY (id),
    CONSTRAINT FK_TicketFiles_Tickets FOREIGN KEY (ticketId) REFERENCES Tickets(id) ON DELETE CASCADE
);
GO

CREATE NONCLUSTERED INDEX IX_TicketFiles_TicketId ON TicketFiles(ticketId);
GO

-- 10. TABELA DE COMENTÁRIOS E DIÁLOGOS NO CHAMADO
CREATE TABLE TicketComments (
    id VARCHAR(50) NOT NULL,
    ticketId VARCHAR(50) NOT NULL,
    userId VARCHAR(50) NOT NULL,
    userName VARCHAR(255) NOT NULL,
    userRole VARCHAR(50) NOT NULL,
    text NVARCHAR(MAX) NOT NULL,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_TicketComments PRIMARY KEY (id),
    CONSTRAINT FK_TicketComments_Tickets FOREIGN KEY (ticketId) REFERENCES Tickets(id) ON DELETE CASCADE,
    CONSTRAINT FK_TicketComments_Users FOREIGN KEY (userId) REFERENCES Users(id)
);
GO

CREATE NONCLUSTERED INDEX IX_TicketComments_TicketId ON TicketComments(ticketId);
GO

-- 11. TABELA DE RELATÓRIO / LAUDO DE QUALIDADE (Relação 1-para-1 com o Chamado)
CREATE TABLE QualityReports (
    ticketId VARCHAR(50) NOT NULL,
    rootCause NVARCHAR(MAX) NOT NULL, -- Causa Raiz analisada
    correctiveAction NVARCHAR(MAX) NOT NULL, -- Ação Corretiva tomada
    preventiveAction NVARCHAR(MAX) NOT NULL, -- Ação Preventiva (Bloqueio)
    responsible VARCHAR(255) NOT NULL, -- Responsável pela tratativa
    targetDate DATE NOT NULL, -- Prazo limite
    updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_QualityReports PRIMARY KEY (ticketId),
    CONSTRAINT FK_QualityReports_Tickets FOREIGN KEY (ticketId) REFERENCES Tickets(id) ON DELETE CASCADE
);
GO

-- 12. TABELA DE ANÁLISE DE 5 PORQUÊS (Cinco Whys para a Causa Raiz)
CREATE TABLE QualityReportFiveWhys (
    id INT IDENTITY(1,1) NOT NULL,
    ticketId VARCHAR(50) NOT NULL,
    stepNumber INT NOT NULL, -- De 1 a 5
    questionOrAnswer NVARCHAR(MAX) NOT NULL,
    CONSTRAINT PK_QualityReportFiveWhys PRIMARY KEY (id),
    CONSTRAINT FK_QualityReportFiveWhys_Reports FOREIGN KEY (ticketId) REFERENCES QualityReports(ticketId) ON DELETE CASCADE,
    CONSTRAINT CK_FiveWhys_StepNumber CHECK (stepNumber BETWEEN 1 AND 5)
);
GO

CREATE NONCLUSTERED INDEX IX_FiveWhys_TicketId ON QualityReportFiveWhys(ticketId);
GO

-- 13. TABELA DE LEMBRETES E ALERTAS (Gestão de prazos e Pendências)
CREATE TABLE TicketReminders (
    id VARCHAR(50) NOT NULL,
    ticketId VARCHAR(50) NOT NULL,
    text NVARCHAR(1000) NOT NULL,
    dueDate DATETIME2 NOT NULL,
    priority VARCHAR(50) NOT NULL, -- 'Baixa' | 'Média' | 'Alta'
    completed BIT NOT NULL DEFAULT 0,
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_TicketReminders PRIMARY KEY (id),
    CONSTRAINT FK_TicketReminders_Tickets FOREIGN KEY (ticketId) REFERENCES Tickets(id) ON DELETE CASCADE
);
GO

CREATE NONCLUSTERED INDEX IX_TicketReminders_TicketId ON TicketReminders(ticketId);
GO

-- 14. TABELA DE HISTÓRICO DE AUDITORIA DO CHAMADO (Trilha de Auditoria / History Steps)
CREATE TABLE HistorySteps (
    id VARCHAR(50) NOT NULL,
    ticketId VARCHAR(50) NOT NULL,
    action VARCHAR(255) NOT NULL, -- Ação realizada (ex: 'Chamado Aberto', 'Laudo Emitido')
    userId VARCHAR(50) NOT NULL,
    userName VARCHAR(255) NOT NULL,
    userRole VARCHAR(50) NOT NULL,
    details NVARCHAR(MAX) NULL,
    timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    CONSTRAINT PK_HistorySteps PRIMARY KEY (id),
    CONSTRAINT FK_HistorySteps_Tickets FOREIGN KEY (ticketId) REFERENCES Tickets(id) ON DELETE CASCADE,
    CONSTRAINT FK_HistorySteps_Users FOREIGN KEY (userId) REFERENCES Users(id)
);
GO

CREATE NONCLUSTERED INDEX IX_HistorySteps_TicketId ON HistorySteps(ticketId);
GO

-- 15. TABELA DE LOGS DE NOTIFICAÇÕES POR E-MAIL / SMS DO SISTEMA
CREATE TABLE SystemEmailLogs (
    id VARCHAR(50) NOT NULL,
    timestamp DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    ticketId VARCHAR(50) NOT NULL,
    sender VARCHAR(255) NOT NULL,
    recipientName VARCHAR(255) NOT NULL,
    recipientEmail VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL, -- 'Resolvido' | 'Finalizado' (para envio de follow-up)
    subject VARCHAR(255) NOT NULL,
    body NVARCHAR(MAX) NOT NULL,
    serviceType VARCHAR(100) NOT NULL, -- Ex: "SMTP / AWS SES / Azure Communication Service"
    CONSTRAINT PK_SystemEmailLogs PRIMARY KEY (id)
);
GO


-- ==================================================================================
-- CARGA DE DADOS INICIAIS (SEEDING) - DADOS DE DEMONSTRAÇÃO COMPATÍVEIS
-- ==================================================================================

-- Inserindo Tenants
INSERT INTO Tenants (id, name, plan, status, createdAt, color) VALUES
('tenant_matriz', 'Simon Dicompel Matriz', 'Enterprise', 'Ativo', '2026-01-01T00:00:00Z', '#1e293b'),
('tenant_sul', 'Simon Dicompel - Filial Sul', 'Growth', 'Ativo', '2026-03-15T00:00:00Z', '#0284c7');

-- Inserindo Usuários
INSERT INTO Users (id, name, email, role, passwordHash, tenantId) VALUES
('user_admin', 'Admin Geral', 'admin@simondicompel.com.br', 'ADMIN', '123456', 'tenant_matriz'),
('user_sac', 'Juliana Souza', 'juliana.sac@simondicompel.com.br', 'SAC', '123456', 'tenant_matriz'),
('user_qualidade', 'Ricardo Ramos', 'ricardo.qualidade@simondicompel.com.br', 'QUALIDADE', '123456', 'tenant_matriz');

-- Inserindo Produtos (SKUs)
INSERT INTO Products (code, name, producedQty, line) VALUES
('PROD-A310', 'Placa de Controle Novara 220V', 15000, 'Novara'),
('PROD-B550', 'Módulo Conector Simon X', 32000, 'Simon X'),
('PROD-A102', 'Borracha de Vedação Selada 1/2', 80000, 'Acessórios'),
('PROD-C991', 'Chave Rotativa Multifunção Novara', 12000, 'Novara'),
('PROD-M88', 'Disjuntor Inteligente Dicompel 32A', 45000, 'Disjuntores');

-- Inserindo Categorias de Ocorrência
INSERT INTO IssueTypeCategories (id, name) VALUES
('def_eletrico', 'Defeito Elétrico / Placa'),
('def_mecanico', 'Defeito Mecânico / Montagem'),
('comercial', 'Incompatibilidade Comercial'),
('transporte', 'Avaria no Transporte / Logística');

-- Inserindo Subcategorias
INSERT INTO IssueTypeSubcategories (categoryId, name) VALUES
('def_eletrico', 'Placa queimada'),
('def_eletrico', 'Curto-circuito no borne'),
('def_mecanico', 'Componente solto'),
('def_mecanico', 'Fissura na carcaça plástica'),
('comercial', 'Modelo diferente do pedido'),
('transporte', 'Caixa amassada / Quebrado');

-- Inserindo Chamado de Exemplo 1 (Chamado com 1 SKU)
INSERT INTO Tickets (id, tenantId, productCode, productName, batch, clientName, issueType, subCategory, quantity, description, status, createdAt, updatedAt, userId, userName, firstContactDate, invoiceNumber) VALUES
('SAC-2026-001', 'tenant_matriz', 'PROD-A310', 'Placa de Controle Novara 220V', 'L-141225B', 'Eletro Sul Distribuidora', 'Defeito Elétrico / Placa', 'Placa queimada', 15, 'Cliente reclama que 15 placas do lote L-141225B não ligaram na bancada de testes.', 'Aberto', '2026-05-18T15:30:00Z', '2026-05-18T16:00:00Z', 'user_sac', 'Juliana Souza', '2026-05-14', 'NF-89241');

-- Inserindo os itens vinculados ao Chamado 1
INSERT INTO TicketItems (id, ticketId, productCode, productName, quantity) VALUES
('item_sample_1_1', 'SAC-2026-001', 'PROD-A310', 'Placa de Controle Novara 220V', 15);

-- Inserindo Chamado de Exemplo 2 (Chamado Consolidador - Vários SKUs / Multi-SKU)
INSERT INTO Tickets (id, tenantId, productCode, productName, batch, clientName, issueType, subCategory, quantity, description, status, createdAt, updatedAt, userId, userName, firstContactDate, invoiceNumber) VALUES
('SAC-2026-002', 'tenant_matriz', 'MULTIPLE', '2 SKUs no mesmo chamado', 'L-280226X', 'Lojas Becker', 'Defeito Mecânico / Montagem', 'Componente solto', 80, 'Devolução em lote contendo mais de uma referência de SKU devido a componente interno solto que fica chacoalhando dentro das peças.', 'Em analise', '2026-06-03T08:45:00Z', '2026-06-03T09:10:00Z', 'user_sac', 'Juliana Souza', '2026-06-01', 'NF-76541');

-- Inserindo os múltiplos itens / SKUs vinculados ao Chamado 2 (Conforme novo recurso solicitado)
INSERT INTO TicketItems (id, ticketId, productCode, productName, quantity) VALUES
('item_sample_2_1', 'SAC-2026-002', 'PROD-B550', 'Módulo Conector Simon X', 50),
('item_sample_2_2', 'SAC-2026-002', 'PROD-C991', 'Chave Rotativa Multifunção Novara', 30);

-- Inserindo Histórico para os chamados
INSERT INTO HistorySteps (id, ticketId, action, userId, userName, userRole, details, timestamp) VALUES
('hist_1_1', 'SAC-2026-001', 'Abertura do Chamado', 'user_sac', 'Juliana Souza', 'SAC', 'Chamado iniciado pelo SAC referente a devolução de lote.', '2026-05-18T15:30:00Z'),
('hist_2_1', 'SAC-2026-002', 'Abertura do Chamado', 'user_sac', 'Juliana Souza', 'SAC', 'SAC registrou devolução de 80 unidades divididas em 2 SKUs por motivo de Componente solto.', '2026-06-03T08:45:00Z');

PRINT 'Banco de dados criado e populado com sucesso para Azure SQL Database!';
GO
