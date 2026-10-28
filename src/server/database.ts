import sql from 'mssql';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directory for persistent backup and offline-resilience
const DATA_DIR = path.resolve(__dirname, '../../data');
const DATA_FILE = path.resolve(DATA_DIR, 'database.json');

// Ensure directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface DatabaseStatus {
  connected: boolean;
  type: 'azure-sql' | 'local-persisted';
  host: string;
  database: string;
  user: string;
  port: number;
  message: string;
  lastChecked: string;
}

interface StoredData {
  tickets: any[];
  products: any[];
  users: any[];
  issueTypes: any[];
  updatedAt: string;
}

// Initial clean data
function getCleanData(): StoredData {
  return {
    tickets: [],
    products: [],
    users: [
      {
        id: 'user_dicompel_admin',
        name: 'Administrador Dicompel',
        email: 'admin@dicompel.com.br',
        role: 'ADMIN',
        passwordHash: 'Dicompel!@#2026',
        tenantId: 'tenant_1'
      }
    ],
    issueTypes: [],
    updatedAt: new Date().toISOString()
  };
}

// Load data from file
function loadFromFile(): StoredData {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      return {
        tickets: Array.isArray(parsed.tickets) ? parsed.tickets : [],
        products: Array.isArray(parsed.products) ? parsed.products : [],
        users: Array.isArray(parsed.users) ? parsed.users : [],
        issueTypes: Array.isArray(parsed.issueTypes) ? parsed.issueTypes : [],
        updatedAt: parsed.updatedAt || new Date().toISOString()
      };
    }
  } catch (err) {
    console.error('[DB] Erro ao ler database.json local:', err);
  }
  const clean = getCleanData();
  saveToFile(clean);
  return clean;
}

// Save data to file
function saveToFile(data: StoredData) {
  try {
    data.updatedAt = new Date().toISOString();
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('[DB] Erro ao gravar database.json local:', err);
  }
}

let pool: sql.ConnectionPool | null = null;
let isConnecting = false;
let currentStatus: DatabaseStatus = {
  connected: false,
  type: 'local-persisted',
  host: process.env.AZURE_DB_HOST || 'sql-qualisac-dicompel.database.windows.net',
  database: process.env.AZURE_DB_NAME || 'qualisac_db',
  user: process.env.AZURE_DB_USER || 'qualisacadmin',
  port: parseInt(process.env.AZURE_DB_PORT || '1433', 10),
  message: 'Inicializando conexão com o banco de dados...',
  lastChecked: new Date().toISOString()
};

// Azure SQL Configuration builder
function getSqlConfig(): sql.config | null {
  const host = process.env.AZURE_DB_HOST || 'sql-qualisac-dicompel.database.windows.net';
  const server = host.includes('.') ? host : `${host}.database.windows.net`;
  const database = process.env.AZURE_DB_NAME || 'qualisac_db';
  const user = process.env.AZURE_DB_USER || 'qualisacadmin';
  const password = process.env.AZURE_DB_PASSWORD || '';
  const port = parseInt(process.env.AZURE_DB_PORT || '1433', 10);

  if (!password || password.trim() === '') {
    return null;
  }

  return {
    server,
    database,
    user,
    password,
    port,
    options: {
      encrypt: process.env.AZURE_DB_SSL !== 'false', // Required for Azure SQL (true)
      trustServerCertificate: process.env.AZURE_DB_TRUST_SERVER_CERT === 'true' || false,
      connectTimeout: 10000,
      requestTimeout: 15000
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000
    }
  };
}

// Ensure tables exist in Azure SQL
async function ensureAzureTables(p: sql.ConnectionPool) {
  try {
    // 1. Tabela de Tenants
    await p.request().query(`
      IF OBJECT_ID('dbo.Tenants', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.Tenants (
          id VARCHAR(50) NOT NULL PRIMARY KEY,
          name NVARCHAR(150) NOT NULL,
          [plan] VARCHAR(50) NOT NULL,
          [status] VARCHAR(50) NOT NULL,
          createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          color VARCHAR(10) NULL
        );
        INSERT INTO dbo.Tenants (id, name, [plan], [status], color)
        VALUES ('tenant_1', N'Dicompel Indústria e Comércio', 'Enterprise', 'Ativo', '#003355');
      END
    `);

    // 2. Tabela de Users
    await p.request().query(`
      IF OBJECT_ID('dbo.Users', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.Users (
          id VARCHAR(50) NOT NULL PRIMARY KEY,
          name NVARCHAR(150) NOT NULL,
          email NVARCHAR(150) NOT NULL UNIQUE,
          [role] VARCHAR(50) NOT NULL,
          passwordHash VARCHAR(255) NULL,
          tenantId VARCHAR(50) NOT NULL
        );
        INSERT INTO dbo.Users (id, name, email, [role], passwordHash, tenantId)
        VALUES ('user_dicompel_admin', N'Administrador Dicompel', 'admin@dicompel.com.br', 'ADMIN', 'Dicompel!@#2026', 'tenant_1');
      END
    `);

    // 3. Tabela de Products
    await p.request().query(`
      IF OBJECT_ID('dbo.Products', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.Products (
          code VARCHAR(50) NOT NULL PRIMARY KEY,
          name NVARCHAR(200) NOT NULL,
          producedQty INT NOT NULL DEFAULT 0,
          line NVARCHAR(100) NOT NULL DEFAULT N'Geral',
          createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
        );
      END
    `);

    // 4. Tabela de Tickets (com payload JSON integrado para fidelidade total)
    await p.request().query(`
      IF OBJECT_ID('dbo.Tickets', 'U') IS NULL
      BEGIN
        CREATE TABLE dbo.Tickets (
          id VARCHAR(50) NOT NULL PRIMARY KEY,
          tenantId VARCHAR(50) NOT NULL,
          productCode VARCHAR(50) NULL,
          productName NVARCHAR(200) NULL,
          clientName NVARCHAR(150) NULL,
          issueType NVARCHAR(100) NULL,
          subCategory NVARCHAR(100) NULL,
          quantity INT NOT NULL DEFAULT 1,
          status VARCHAR(50) NOT NULL DEFAULT 'Aberto',
          createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          updatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
          payload NVARCHAR(MAX) NULL
        );
      END
    `);

    console.log('[DB] Tabelas verificadas/criadas no Azure SQL com sucesso.');
  } catch (err) {
    console.error('[DB] Erro ao verificar tabelas no Azure SQL:', err);
  }
}

// Connect to Azure SQL
export async function connectAzureSql(): Promise<boolean> {
  const config = getSqlConfig();
  const host = process.env.AZURE_DB_HOST || 'sql-qualisac-dicompel.database.windows.net';
  const server = host.includes('.') ? host : `${host}.database.windows.net`;
  const database = process.env.AZURE_DB_NAME || 'qualisac_db';
  const user = process.env.AZURE_DB_USER || 'qualisacadmin';
  const port = parseInt(process.env.AZURE_DB_PORT || '1433', 10);

  currentStatus = {
    connected: false,
    type: 'local-persisted',
    host: server,
    database,
    user,
    port,
    message: '',
    lastChecked: new Date().toISOString()
  };

  if (!config) {
    currentStatus.message = 'Senha do Azure SQL (AZURE_DB_PASSWORD) ainda não preenchida no .env. Utilizando persistência em disco local.';
    console.log(`[DB] ${currentStatus.message}`);
    return false;
  }

  if (isConnecting) return false;
  isConnecting = true;

  try {
    if (pool && pool.connected) {
      await pool.close();
    }

    console.log(`[DB] Conectando ao Azure SQL Server: ${server}:${port} (Database: ${database})...`);
    pool = await new sql.ConnectionPool(config).connect();
    
    currentStatus.connected = true;
    currentStatus.type = 'azure-sql';
    currentStatus.message = `Conectado com sucesso ao Azure SQL Server (${server})!`;
    console.log(`[DB] ✅ ${currentStatus.message}`);

    await ensureAzureTables(pool);
    return true;
  } catch (err: any) {
    currentStatus.connected = false;
    currentStatus.type = 'local-persisted';
    currentStatus.message = `Falha na conexão com o Azure SQL: ${err.message}. Sistema operando com persistência em disco segura (nenhum dado será perdido ao recarregar).`;
    console.warn(`[DB] ⚠️ ${currentStatus.message}`);
    return false;
  } finally {
    isConnecting = false;
  }
}

export function getDatabaseStatus(): DatabaseStatus {
  return currentStatus;
}

// --- TICKETS CRUD ---
export async function getAllTickets(): Promise<any[]> {
  if (pool && pool.connected) {
    try {
      const result = await pool.request().query('SELECT id, payload FROM dbo.Tickets ORDER BY createdAt DESC');
      const tickets: any[] = [];
      for (const row of result.recordset) {
        if (row.payload) {
          try {
            tickets.push(JSON.parse(row.payload));
          } catch {
            tickets.push({ id: row.id });
          }
        }
      }
      return tickets;
    } catch (err) {
      console.error('[DB] Erro ao buscar chamados no Azure SQL, lendo do arquivo local:', err);
    }
  }
  const fileData = loadFromFile();
  return fileData.tickets;
}

export async function saveTicket(ticket: any): Promise<any> {
  // Always persist locally to prevent any data loss on reload
  const fileData = loadFromFile();
  const existingIdx = fileData.tickets.findIndex((t: any) => t.id === ticket.id);
  if (existingIdx >= 0) {
    fileData.tickets[existingIdx] = ticket;
  } else {
    fileData.tickets.unshift(ticket);
  }
  saveToFile(fileData);

  // If Azure SQL is connected, save directly to Azure
  if (pool && pool.connected) {
    try {
      const payloadStr = JSON.stringify(ticket);
      const req = pool.request();
      req.input('id', sql.VarChar(50), ticket.id);
      req.input('tenantId', sql.VarChar(50), ticket.tenantId || 'tenant_1');
      req.input('productCode', sql.VarChar(50), ticket.productCode || '');
      req.input('productName', sql.NVarChar(200), ticket.productName || '');
      req.input('clientName', sql.NVarChar(150), ticket.clientName || ticket.customerName || '');
      req.input('issueType', sql.NVarChar(100), ticket.issueType || '');
      req.input('subCategory', sql.NVarChar(100), ticket.subCategory || '');
      req.input('quantity', sql.Int, ticket.quantity || 1);
      req.input('status', sql.VarChar(50), ticket.status || 'Aberto');
      req.input('payload', sql.NVarChar(sql.MAX), payloadStr);

      await req.query(`
        IF EXISTS (SELECT 1 FROM dbo.Tickets WHERE id = @id)
        BEGIN
          UPDATE dbo.Tickets
          SET productCode = @productCode,
              productName = @productName,
              clientName = @clientName,
              issueType = @issueType,
              subCategory = @subCategory,
              quantity = @quantity,
              status = @status,
              updatedAt = GETUTCDATE(),
              payload = @payload
          WHERE id = @id;
        END
        ELSE
        BEGIN
          INSERT INTO dbo.Tickets (id, tenantId, productCode, productName, clientName, issueType, subCategory, quantity, status, payload)
          VALUES (@id, @tenantId, @productCode, @productName, @clientName, @issueType, @subCategory, @quantity, @status, @payload);
        END
      `);
      console.log(`[DB] Chamado ${ticket.id} gravado no Azure SQL com sucesso.`);
    } catch (err) {
      console.error(`[DB] Erro ao gravar chamado ${ticket.id} no Azure SQL:`, err);
    }
  }

  return ticket;
}

export async function deleteTicket(id: string): Promise<boolean> {
  const fileData = loadFromFile();
  fileData.tickets = fileData.tickets.filter((t: any) => t.id !== id);
  saveToFile(fileData);

  if (pool && pool.connected) {
    try {
      const req = pool.request();
      req.input('id', sql.VarChar(50), id);
      await req.query('DELETE FROM dbo.Tickets WHERE id = @id');
      console.log(`[DB] Chamado ${id} deletado no Azure SQL.`);
    } catch (err) {
      console.error(`[DB] Erro ao deletar chamado ${id} no Azure SQL:`, err);
    }
  }
  return true;
}

// --- PRODUCTS CRUD ---
export async function getAllProducts(): Promise<any[]> {
  if (pool && pool.connected) {
    try {
      const result = await pool.request().query('SELECT code, name, producedQty, line FROM dbo.Products ORDER BY code ASC');
      return result.recordset.map((row: any) => ({
        code: row.code,
        name: row.name,
        producedQty: row.producedQty || 0,
        line: row.line || 'Geral'
      }));
    } catch (err) {
      console.error('[DB] Erro ao buscar produtos no Azure SQL, lendo do arquivo local:', err);
    }
  }
  const fileData = loadFromFile();
  return fileData.products;
}

export async function saveProduct(product: any): Promise<any> {
  const fileData = loadFromFile();
  const existingIdx = fileData.products.findIndex((p: any) => p.code === product.code);
  if (existingIdx >= 0) {
    fileData.products[existingIdx] = product;
  } else {
    fileData.products.push(product);
  }
  saveToFile(fileData);

  if (pool && pool.connected) {
    try {
      const req = pool.request();
      req.input('code', sql.VarChar(50), product.code);
      req.input('name', sql.NVarChar(200), product.name);
      req.input('producedQty', sql.Int, product.producedQty || 0);
      req.input('line', sql.NVarChar(100), product.line || 'Geral');

      await req.query(`
        IF EXISTS (SELECT 1 FROM dbo.Products WHERE code = @code)
        BEGIN
          UPDATE dbo.Products
          SET name = @name, producedQty = @producedQty, line = @line
          WHERE code = @code;
        END
        ELSE
        BEGIN
          INSERT INTO dbo.Products (code, name, producedQty, line)
          VALUES (@code, @name, @producedQty, @line);
        END
      `);
      console.log(`[DB] Produto ${product.code} gravado no Azure SQL com sucesso.`);
    } catch (err) {
      console.error(`[DB] Erro ao gravar produto ${product.code} no Azure SQL:`, err);
    }
  }

  return product;
}

export async function deleteProduct(code: string): Promise<boolean> {
  const fileData = loadFromFile();
  fileData.products = fileData.products.filter((p: any) => p.code !== code);
  saveToFile(fileData);

  if (pool && pool.connected) {
    try {
      const req = pool.request();
      req.input('code', sql.VarChar(50), code);
      await req.query('DELETE FROM dbo.Products WHERE code = @code');
      console.log(`[DB] Produto ${code} deletado no Azure SQL.`);
    } catch (err) {
      console.error(`[DB] Erro ao deletar produto ${code} no Azure SQL:`, err);
    }
  }
  return true;
}

// Wipe sample tickets and products explicitly (Limpar Dados de Exemplo)
export async function wipeSampleData(): Promise<{ ticketsWiped: number; productsWiped: number }> {
  const fileData = loadFromFile();
  const countTickets = fileData.tickets.length;
  const countProducts = fileData.products.length;

  fileData.tickets = [];
  fileData.products = [];
  saveToFile(fileData);

  if (pool && pool.connected) {
    try {
      await pool.request().query('DELETE FROM dbo.Tickets; DELETE FROM dbo.Products;');
      console.log('[DB] Chamados e Produtos de exemplo apagados no Azure SQL.');
    } catch (err) {
      console.error('[DB] Erro ao limpar tabelas no Azure SQL:', err);
    }
  }

  return { ticketsWiped: countTickets, productsWiped: countProducts };
}
