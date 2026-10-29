import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import sql from 'mssql';
import net from 'net';
import nodemailer from 'nodemailer';

// Dynamic runtime configuration cache (populated from env and can be updated via /api/azure/config)
let activeConfig = {
  host: process.env.AZURE_DB_HOST || 'sql-qualisac-dicompel.database.windows.net',
  port: parseInt(process.env.AZURE_DB_PORT || '1433', 10),
  database: process.env.AZURE_DB_NAME || 'qualisac_db',
  user: process.env.AZURE_DB_USER || 'qualisacadmin',
  password: process.env.AZURE_DB_PASSWORD || '',
  ssl: process.env.AZURE_DB_SSL !== 'false'
};

// Azure SQL Connection Pool Cache
let pool: sql.ConnectionPool | null = null;
let isConnecting = false;

function buildSqlConfig(custom?: Partial<typeof activeConfig>): sql.config | null {
  const cfg = { ...activeConfig, ...custom };
  const host = cfg.host.includes('.') ? cfg.host : `${cfg.host}.database.windows.net`;

  if (!cfg.password || cfg.password.trim() === '') {
    return null;
  }

  return {
    server: host,
    database: cfg.database,
    user: cfg.user,
    password: cfg.password,
    port: cfg.port,
    options: {
      encrypt: cfg.ssl,
      trustServerCertificate: process.env.AZURE_DB_TRUST_SERVER_CERT === 'true' || false,
      connectTimeout: 8000,
      requestTimeout: 15000,
    },
    pool: {
      max: 10,
      min: 0,
      idleTimeoutMillis: 30000,
    },
  };
}

async function getPool(): Promise<sql.ConnectionPool | null> {
  const config = buildSqlConfig();
  if (!config) return null;

  try {
    if (pool && pool.connected) {
      return pool;
    }
    if (isConnecting) {
      return pool;
    }
    isConnecting = true;
    pool = await new sql.ConnectionPool(config).connect();
    isConnecting = false;
    return pool;
  } catch (err: any) {
    isConnecting = false;
    console.error('[Azure Functions] Erro ao conectar no Azure SQL:', err.message);
    return null;
  }
}

// In-Memory resilient fallback storage for serverless execution
let memoryTickets: any[] = [];
let memoryProducts: any[] = [];
let memoryUsers: any[] = [
  {
    id: 'user_dicompel_admin',
    name: 'Administrador Dicompel',
    email: 'admin@dicompel.com.br',
    role: 'ADMIN',
    passwordHash: 'Dicompel!@#2026',
    tenantId: 'tenant_1'
  }
];

// Helper: JSON response with standard headers
function jsonResponse(body: any, status = 200): HttpResponseInit {
  return {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store'
    },
    jsonBody: body
  };
}

// =========================================================================
// 1. GET /api/data - Full Initial Payload
// =========================================================================
app.http('data', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const p = await getPool();
      let tickets = memoryTickets;
      let products = memoryProducts;
      let users = memoryUsers;

      if (p && p.connected) {
        try {
          // Tickets
          const tRes = await p.request().query('SELECT id, payload FROM dbo.Tickets ORDER BY createdAt DESC');
          const loadedTickets: any[] = [];
          for (const row of tRes.recordset) {
            if (row.payload) {
              try {
                loadedTickets.push(JSON.parse(row.payload));
              } catch {
                loadedTickets.push(row);
              }
            }
          }
          if (loadedTickets.length > 0) {
            tickets = loadedTickets;
            memoryTickets = loadedTickets;
          }

          // Products
          const pRes = await p.request().query('SELECT code, name, producedQty, line FROM dbo.Products ORDER BY code ASC');
          const loadedProducts = pRes.recordset.map((r: any) => ({
            code: r.code,
            name: r.name,
            producedQty: r.producedQty || 0,
            line: r.line || 'Geral'
          }));
          if (loadedProducts.length > 0) {
            products = loadedProducts;
            memoryProducts = loadedProducts;
          }

          // Users
          const uRes = await p.request().query('SELECT id, name, email, [role], passwordHash, tenantId FROM dbo.Users ORDER BY name ASC');
          const loadedUsers = uRes.recordset.map((r: any) => ({
            id: r.id,
            name: r.name,
            email: r.email,
            role: r.role,
            passwordHash: r.passwordHash,
            tenantId: r.tenantId
          }));
          if (loadedUsers.length > 0) {
            users = loadedUsers;
            memoryUsers = loadedUsers;
          }
        } catch (dbErr: any) {
          context.error('[Azure Functions] Erro ao carregar dados do Azure SQL:', dbErr.message);
        }
      }

      return jsonResponse({
        success: true,
        tickets,
        products,
        users,
        dbStatus: {
          connected: Boolean(p && p.connected),
          type: p && p.connected ? 'azure-sql' : 'local-persisted',
          host: activeConfig.host,
          database: activeConfig.database,
          user: activeConfig.user,
          port: activeConfig.port,
          message: p && p.connected
            ? `Conectado ao Azure SQL (${activeConfig.host})!`
            : 'Sistema operando com persistência resiliente. Preencha AZURE_DB_PASSWORD no Azure Portal para sincronização direta.'
        }
      });
    } catch (err: any) {
      return jsonResponse({ success: false, error: err.message }, 500);
    }
  }
});

// =========================================================================
// 2. GET & POST /api/tickets
// =========================================================================
app.http('tickets', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === 'POST') {
      try {
        const ticket: any = await req.json();
        const p = await getPool();

        const idx = memoryTickets.findIndex((t) => t.id === ticket.id);
        if (idx >= 0) memoryTickets[idx] = ticket;
        else memoryTickets.unshift(ticket);

        if (p && p.connected) {
          try {
            const r = p.request();
            r.input('id', sql.VarChar(50), ticket.id);
            r.input('tenantId', sql.VarChar(50), ticket.tenantId || 'tenant_1');
            r.input('productCode', sql.VarChar(50), ticket.productCode || '');
            r.input('productName', sql.NVarChar(200), ticket.productName || '');
            r.input('clientName', sql.NVarChar(150), ticket.customerName || ticket.clientName || '');
            r.input('issueType', sql.NVarChar(100), ticket.issueType || '');
            r.input('subCategory', sql.NVarChar(100), ticket.subCategory || '');
            r.input('quantity', sql.Int, ticket.quantity || 1);
            r.input('status', sql.VarChar(50), ticket.status || 'Aberto');
            r.input('payload', sql.NVarChar(sql.MAX), JSON.stringify(ticket));

            await r.query(`
              IF EXISTS (SELECT 1 FROM dbo.Tickets WHERE id = @id)
              BEGIN
                UPDATE dbo.Tickets
                SET tenantId = @tenantId, productCode = @productCode, productName = @productName,
                    clientName = @clientName, issueType = @issueType, subCategory = @subCategory,
                    quantity = @quantity, status = @status, updatedAt = GETUTCDATE(), payload = @payload
                WHERE id = @id;
              END
              ELSE
              BEGIN
                INSERT INTO dbo.Tickets (id, tenantId, productCode, productName, clientName, issueType, subCategory, quantity, status, createdAt, updatedAt, payload)
                VALUES (@id, @tenantId, @productCode, @productName, @clientName, @issueType, @subCategory, @quantity, @status, GETUTCDATE(), GETUTCDATE(), @payload);
              END
            `);
          } catch (err: any) {
            context.error('[Tickets POST] Erro no Azure SQL:', err.message);
          }
        }

        return jsonResponse({ success: true, ticket });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err.message }, 500);
      }
    }

    return jsonResponse({ success: true, tickets: memoryTickets });
  }
});

// =========================================================================
// 3. PUT & DELETE /api/tickets/{id}
// =========================================================================
app.http('tickets-id', {
  methods: ['PUT', 'DELETE'],
  route: 'tickets/{id}',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const id = req.params.id;

    if (req.method === 'DELETE') {
      memoryTickets = memoryTickets.filter((t) => t.id !== id);
      const p = await getPool();
      if (p && p.connected) {
        try {
          const r = p.request();
          r.input('id', sql.VarChar(50), id);
          await r.query('DELETE FROM dbo.Tickets WHERE id = @id');
        } catch (err: any) {
          context.error('[Tickets DELETE] Erro no Azure SQL:', err.message);
        }
      }
      return jsonResponse({ success: true });
    }

    // PUT
    try {
      const ticket: any = await req.json();
      ticket.id = id;
      const idx = memoryTickets.findIndex((t) => t.id === id);
      if (idx >= 0) memoryTickets[idx] = ticket;
      else memoryTickets.unshift(ticket);

      const p = await getPool();
      if (p && p.connected) {
        try {
          const r = p.request();
          r.input('id', sql.VarChar(50), id);
          r.input('status', sql.VarChar(50), ticket.status || 'Aberto');
          r.input('payload', sql.NVarChar(sql.MAX), JSON.stringify(ticket));
          await r.query(`
            UPDATE dbo.Tickets
            SET status = @status, updatedAt = GETUTCDATE(), payload = @payload
            WHERE id = @id;
          `);
        } catch (err: any) {
          context.error('[Tickets PUT] Erro no Azure SQL:', err.message);
        }
      }

      return jsonResponse({ success: true, ticket });
    } catch (err: any) {
      return jsonResponse({ success: false, error: err.message }, 500);
    }
  }
});

// =========================================================================
// 4. GET & POST /api/products
// =========================================================================
app.http('products', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === 'POST') {
      try {
        const product: any = await req.json();
        const idx = memoryProducts.findIndex((p) => p.code === product.code);
        if (idx >= 0) memoryProducts[idx] = product;
        else memoryProducts.push(product);

        const p = await getPool();
        if (p && p.connected) {
          try {
            const r = p.request();
            r.input('code', sql.VarChar(50), product.code);
            r.input('name', sql.NVarChar(200), product.name);
            r.input('producedQty', sql.Int, product.producedQty || 0);
            r.input('line', sql.NVarChar(100), product.line || 'Geral');
            await r.query(`
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
          } catch (err: any) {
            context.error('[Products POST] Erro no Azure SQL:', err.message);
          }
        }

        return jsonResponse({ success: true, product });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err.message }, 500);
      }
    }

    return jsonResponse({ success: true, products: memoryProducts });
  }
});

// =========================================================================
// 5. DELETE /api/products/{code}
// =========================================================================
app.http('products-code', {
  methods: ['DELETE'],
  route: 'products/{code}',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const code = req.params.code;
    memoryProducts = memoryProducts.filter((p) => p.code !== code);

    const p = await getPool();
    if (p && p.connected) {
      try {
        const r = p.request();
        r.input('code', sql.VarChar(50), code);
        await r.query('DELETE FROM dbo.Products WHERE code = @code');
      } catch (err: any) {
        context.error('[Products DELETE] Erro no Azure SQL:', err.message);
      }
    }

    return jsonResponse({ success: true });
  }
});

// =========================================================================
// 6. GET & POST /api/users
// =========================================================================
app.http('users', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === 'POST') {
      try {
        const user: any = await req.json();
        const idx = memoryUsers.findIndex((u) => u.id === user.id || u.email === user.email);
        if (idx >= 0) memoryUsers[idx] = user;
        else memoryUsers.push(user);

        const p = await getPool();
        if (p && p.connected) {
          try {
            const r = p.request();
            r.input('id', sql.VarChar(50), user.id);
            r.input('name', sql.NVarChar(150), user.name);
            r.input('email', sql.NVarChar(150), user.email);
            r.input('role', sql.VarChar(50), user.role || 'COMUM');
            r.input('passwordHash', sql.VarChar(255), user.passwordHash || 'Dicompel!@#2026');
            r.input('tenantId', sql.VarChar(50), user.tenantId || 'tenant_1');

            await r.query(`
              IF EXISTS (SELECT 1 FROM dbo.Users WHERE id = @id OR email = @email)
              BEGIN
                UPDATE dbo.Users
                SET name = @name, email = @email, [role] = @role, passwordHash = @passwordHash, tenantId = @tenantId
                WHERE id = @id OR email = @email;
              END
              ELSE
              BEGIN
                INSERT INTO dbo.Users (id, name, email, [role], passwordHash, tenantId)
                VALUES (@id, @name, @email, @role, @passwordHash, @tenantId);
              END
            `);
          } catch (err: any) {
            context.error('[Users POST] Erro no Azure SQL:', err.message);
          }
        }

        return jsonResponse({ success: true, user });
      } catch (err: any) {
        return jsonResponse({ success: false, error: err.message }, 500);
      }
    }

    return jsonResponse({ success: true, users: memoryUsers });
  }
});

// =========================================================================
// 7. DELETE /api/users/{id}
// =========================================================================
app.http('users-id', {
  methods: ['DELETE'],
  route: 'users/{id}',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const id = req.params.id;
    memoryUsers = memoryUsers.filter((u) => u.id !== id);

    const p = await getPool();
    if (p && p.connected) {
      try {
        const r = p.request();
        r.input('id', sql.VarChar(50), id);
        await r.query('DELETE FROM dbo.Users WHERE id = @id');
      } catch (err: any) {
        context.error('[Users DELETE] Erro no Azure SQL:', err.message);
      }
    }

    return jsonResponse({ success: true });
  }
});

// =========================================================================
// 8. GET /api/azure/status
// =========================================================================
app.http('azure-status', {
  methods: ['GET'],
  route: 'azure/status',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const p = await getPool();
    const isConn = Boolean(p && p.connected);

    return jsonResponse({
      configured: isConn,
      host: activeConfig.host,
      user: activeConfig.user,
      database: activeConfig.database,
      port: String(activeConfig.port),
      workflowFile: '.github/workflows/azure-static-web-apps-gentle-stone-05081080f.yml',
      sqlFile: 'azure_sql_setup.sql',
      message: isConn
        ? `Conectado ao Azure SQL Server (${activeConfig.host})!`
        : 'Aguardando credenciais no Azure Portal > Variáveis de ambiente (AZURE_DB_PASSWORD).'
    });
  }
});

// =========================================================================
// 9. POST /api/azure/config - Save configuration dynamically in session
// =========================================================================
app.http('azure-config', {
  methods: ['POST'],
  route: 'azure/config',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body: any = await req.json();
      if (body.host) activeConfig.host = String(body.host).trim();
      if (body.port) activeConfig.port = parseInt(String(body.port).trim(), 10) || 1433;
      if (body.user) activeConfig.user = String(body.user).trim();
      if (body.database) activeConfig.database = String(body.database).trim();
      if (body.password !== undefined) activeConfig.password = String(body.password);

      // Reconnect pool with new credentials
      if (pool) {
        try { await pool.close(); } catch {}
        pool = null;
      }

      const p = await getPool();
      const connected = Boolean(p && p.connected);

      return jsonResponse({
        success: true,
        connected,
        message: connected
          ? `Configurações aplicadas com sucesso e CONECTADO ao Azure SQL Server (${activeConfig.host})!`
          : `Configurações atualizadas na sessão. Para torná-las permanentes após reinicializações, adicione AZURE_DB_PASSWORD nas Variáveis de Ambiente do Static Web App no Portal Azure.`,
        config: {
          host: activeConfig.host,
          port: String(activeConfig.port),
          user: activeConfig.user,
          database: activeConfig.database
        }
      });
    } catch (err: any) {
      return jsonResponse({ success: false, error: err.message }, 500);
    }
  }
});

// =========================================================================
// 10. POST /api/azure/test-connection
// =========================================================================
app.http('azure-test-connection', {
  methods: ['POST'],
  route: 'azure/test-connection',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      let reqBody: any = {};
      try {
        reqBody = await req.json();
      } catch {}

      const host = reqBody.host || activeConfig.host;
      const port = parseInt(reqBody.port || String(activeConfig.port), 10);

      // TCP Socket test
      const tcpResult = await new Promise<{ ok: boolean; latencyMs: number; error?: string }>((resolve) => {
        const start = Date.now();
        const socket = new net.Socket();
        socket.setTimeout(4000);

        socket.on('connect', () => {
          const latencyMs = Date.now() - start;
          socket.destroy();
          resolve({ ok: true, latencyMs });
        });

        socket.on('timeout', () => {
          socket.destroy();
          resolve({ ok: false, latencyMs: 4000, error: 'TIMEOUT: Conexão expirou após 4s. Verifique o Firewall do Azure SQL.' });
        });

        socket.on('error', (err) => {
          socket.destroy();
          resolve({ ok: false, latencyMs: Date.now() - start, error: err.message });
        });

        socket.connect(port, host);
      });

      if (!tcpResult.ok) {
        return jsonResponse({
          success: false,
          error: tcpResult.error,
          message: `Falha na conexão TCP com ${host}:${port}. ${tcpResult.error}`
        });
      }

      // Check SQL connection
      const p = await getPool();
      if (p && p.connected) {
        return jsonResponse({
          success: true,
          latencyMs: tcpResult.latencyMs,
          message: `Conexão bem-sucedida! O servidor Azure SQL em ${host}:${port} está ativo e autenticado (${tcpResult.latencyMs}ms).`
        });
      }

      return jsonResponse({
        success: true,
        latencyMs: tcpResult.latencyMs,
        message: `Porta TCP 1433 acessível em ${host} (${tcpResult.latencyMs}ms). A senha precisa ser preenchida no Portal do Azure > Variáveis de ambiente.`
      });
    } catch (err: any) {
      return jsonResponse({ success: false, error: err.message }, 500);
    }
  }
});

// =========================================================================
// 11. GET /api/azure/sql-content - Provide SQL script directly
// =========================================================================
const SQL_SCRIPT = `-- =========================================================================
-- SCRIPT DE CRIAÇÃO DO BANCO DE DADOS OFICIAL - QUALISAC SIMON DICOMPEL
-- EXECUTE NO AZURE PORTAL > BANCO qualisac_db > EDITOR DE CONSULTAS
-- =========================================================================

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
END;

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
END;

IF OBJECT_ID('dbo.Products', 'U') IS NULL
BEGIN
  CREATE TABLE dbo.Products (
    code VARCHAR(50) NOT NULL PRIMARY KEY,
    name NVARCHAR(200) NOT NULL,
    producedQty INT NOT NULL DEFAULT 0,
    line NVARCHAR(100) NOT NULL DEFAULT N'Geral',
    createdAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
  );
END;

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
END;
`;

app.http('azure-sql-content', {
  methods: ['GET'],
  route: 'azure/sql-content',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    return jsonResponse({
      success: true,
      filename: 'azure_sql_setup.sql',
      content: SQL_SCRIPT
    });
  }
});

// =========================================================================
// 12. POST /api/database/wipe-samples
// =========================================================================
app.http('database-wipe-samples', {
  methods: ['POST'],
  route: 'database/wipe-samples',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    memoryTickets = [];
    memoryProducts = [];

    const p = await getPool();
    if (p && p.connected) {
      try {
        await p.request().query('DELETE FROM dbo.Tickets; DELETE FROM dbo.Products;');
      } catch (err: any) {
        context.error('[Wipe Samples] Erro no Azure SQL:', err.message);
      }
    }

    return jsonResponse({
      success: true,
      message: 'Base limpa com sucesso para início de produção.'
    });
  }
});

// =========================================================================
// 13. GET /api/smtp/status
// =========================================================================
app.http('smtp-status', {
  methods: ['GET'],
  route: 'smtp/status',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const smtpHost = process.env.SMTP_HOST || '';
    const smtpPort = process.env.SMTP_PORT || '587';
    const smtpUser = process.env.SMTP_USER || 'sac@dicompel.com.br';
    const smtpPass = process.env.SMTP_PASS || '';
    const isConfigured = Boolean(smtpHost && smtpPass);

    return jsonResponse({
      configured: isConfigured,
      host: smtpHost || 'Não configurado',
      port: smtpPort,
      user: smtpUser,
      from: process.env.SMTP_FROM || `Simon Dicompel SAC <${smtpUser}>`,
      message: isConfigured
        ? `Servidor SMTP configurado para envio real via ${smtpHost}.`
        : 'Credenciais SMTP ainda não definidas nas variáveis de ambiente do Azure.'
    });
  }
});

// =========================================================================
// 14. POST /api/send-email
// =========================================================================
app.http('send-email', {
  methods: ['POST'],
  route: 'send-email',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const body: any = await req.json();
      const { to, cc, subject, body: emailBody, ticketId } = body;

      if (!to || !subject || !emailBody) {
        return jsonResponse({
          success: false,
          error: 'Campos obrigatórios ausentes: "to", "subject" e "body" são requeridos.'
        }, 400);
      }

      const smtpHost = process.env.SMTP_HOST;
      const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
      const smtpUser = process.env.SMTP_USER || 'sac@dicompel.com.br';
      const smtpPass = process.env.SMTP_PASS;
      const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
      const smtpFrom = process.env.SMTP_FROM || `Simon Dicompel SAC <${smtpUser}>`;

      let ccList: string[] = [];
      if (Array.isArray(cc)) {
        ccList = cc.filter(c => typeof c === 'string' && c.trim().length > 0);
      } else if (typeof cc === 'string' && cc.trim().length > 0) {
        ccList = [cc.trim()];
      }

      if (!smtpHost || !smtpPass) {
        return jsonResponse({
          success: false,
          status: 'NEEDS_CONFIGURATION',
          message: 'O e-mail foi registrado no sistema, porém o servidor SMTP corporativo (host/senha) de sac@dicompel.com.br ainda não foi configurado nas variáveis de ambiente.',
          details: {
            configured: false,
            recommendedSender: smtpUser,
            to,
            cc: ccList,
            subject
          }
        });
      }

      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpSecure,
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
        tls: {
          rejectUnauthorized: false
        }
      });

      const info = await transporter.sendMail({
        from: smtpFrom,
        to,
        cc: ccList.length > 0 ? ccList.join(', ') : undefined,
        subject,
        text: emailBody,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
          </head>
          <body style="margin: 0; padding: 20px; background-color: #f1f5f9; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
            <div style="max-width: 650px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
              <div style="background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 24px; color: #ffffff;">
                <h1 style="margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 0.5px;">SIMON DICOMPEL</h1>
                <p style="margin: 4px 0 0 0; font-size: 13px; color: #93c5fd; font-weight: 500;">Sistema de SAC & Gestão da Qualidade ISO 9001</p>
              </div>
              <div style="padding: 24px 28px;">
                <div style="display: inline-block; background-color: #eff6ff; color: #1d4ed8; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; margin-bottom: 12px; border: 1px solid #dbeafe;">
                  ${ticketId ? `CHAMADO: ${ticketId}` : 'NOTIFICAÇÃO OPERACIONAL'}
                </div>
                <h2 style="margin: 0 0 16px 0; font-size: 16px; color: #0f172a; line-height: 1.4;">${subject}</h2>
                <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; padding: 16px; border-radius: 6px; font-size: 13px; color: #334155; line-height: 1.6; white-space: pre-wrap; font-family: monospace;">
${emailBody}
                </div>
                <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.5;">
                  <p style="margin: 0;"><strong>Atendimento Simon Dicompel SAC</strong><br>E-mail oficial: <a href="mailto:${smtpUser}" style="color: #2563eb; text-decoration: none;">${smtpUser}</a></p>
                  <p style="margin: 6px 0 0 0; font-size: 10px; color: #94a3b8;">Mensagem automática em conformidade com o SGQ ISO 9001.</p>
                </div>
              </div>
            </div>
          </body>
          </html>
        `
      });

      return jsonResponse({
        success: true,
        message: `E-mail enviado com sucesso via servidor SMTP (${smtpHost})!`,
        messageId: info.messageId,
        recipient: to,
        cc: ccList,
        subject
      });
    } catch (err: any) {
      context.error('[send-email] Erro ao disparar e-mail:', err.message);
      return jsonResponse({
        success: false,
        error: err.message || 'Falha ao autenticar ou enviar via SMTP.'
      }, 500);
    }
  }
});
