import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import sql from 'mssql';
import nodemailer from 'nodemailer';

// Azure SQL Connection Pool Cache
let pool: sql.ConnectionPool | null = null;

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
      encrypt: process.env.AZURE_DB_SSL !== 'false',
      trustServerCertificate: process.env.AZURE_DB_TRUST_SERVER_CERT === 'true' || false,
      connectTimeout: 10000,
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
  const config = getSqlConfig();
  if (!config) return null;

  try {
    if (pool && pool.connected) {
      return pool;
    }
    pool = await new sql.ConnectionPool(config).connect();
    return pool;
  } catch (err: any) {
    console.error('[Azure Functions] Erro ao conectar no Azure SQL:', err.message);
    return null;
  }
}

// In-Memory fallback storage for serverless execution
let memoryTickets: any[] = [];
let memoryProducts: any[] = [];

// 1. GET /api/data
app.http('data', {
  methods: ['GET'],
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    try {
      const p = await getPool();
      let tickets = memoryTickets;
      let products = memoryProducts;

      if (p && p.connected) {
        try {
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
          tickets = loadedTickets;

          const pRes = await p.request().query('SELECT code, name, producedQty, line FROM dbo.Products ORDER BY code ASC');
          products = pRes.recordset.map((r: any) => ({
            code: r.code,
            name: r.name,
            producedQty: r.producedQty || 0,
            line: r.line || 'Geral'
          }));
        } catch (dbErr: any) {
          context.warn('[Data] Erro ao ler tabelas no Azure SQL:', dbErr.message);
        }
      }

      const host = process.env.AZURE_DB_HOST || 'sql-qualisac-dicompel.database.windows.net';
      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        jsonBody: {
          success: true,
          tickets,
          products,
          dbStatus: {
            connected: Boolean(p && p.connected),
            type: p && p.connected ? 'azure-sql' : 'local-persisted',
            host,
            database: process.env.AZURE_DB_NAME || 'qualisac_db',
            user: process.env.AZURE_DB_USER || 'qualisacadmin',
            message: p && p.connected
              ? `Conectado ao Azure SQL (${host})`
              : 'Executando em modo Serverless resiliente.'
          }
        }
      };
    } catch (err: any) {
      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        jsonBody: { success: false, error: err.message }
      };
    }
  }
});

// 2. GET & POST /api/tickets
app.http('tickets', {
  methods: ['GET', 'POST'],
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    if (req.method === 'POST') {
      try {
        const ticket: any = await req.json();
        const p = await getPool();

        // Salva na memória
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
            context.error('[Tickets] Erro ao gravar ticket no Azure SQL:', err.message);
          }
        }

        return {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          jsonBody: { success: true, ticket }
        };
      } catch (err: any) {
        return {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
          jsonBody: { success: false, error: err.message }
        };
      }
    }

    // GET
    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      jsonBody: { success: true, tickets: memoryTickets }
    };
  }
});

// 3. PUT & DELETE /api/tickets/{id}
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
      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        jsonBody: { success: true }
      };
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

      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        jsonBody: { success: true, ticket }
      };
    } catch (err: any) {
      return {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
        jsonBody: { success: false, error: err.message }
      };
    }
  }
});

// 4. GET & POST /api/products
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

        return {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
          jsonBody: { success: true, product }
        };
      } catch (err: any) {
        return {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
          jsonBody: { success: false, error: err.message }
        };
      }
    }

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      jsonBody: { success: true, products: memoryProducts }
    };
  }
});

// 5. DELETE /api/products/{code}
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

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      jsonBody: { success: true }
    };
  }
});

// 6. GET /api/azure/status
app.http('azure-status', {
  methods: ['GET'],
  route: 'azure/status',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const host = process.env.AZURE_DB_HOST || 'sql-qualisac-dicompel.database.windows.net';
    const p = await getPool();

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      jsonBody: {
        configured: Boolean(p && p.connected),
        host,
        user: process.env.AZURE_DB_USER || 'qualisacadmin',
        database: process.env.AZURE_DB_NAME || 'qualisac_db',
        port: process.env.AZURE_DB_PORT || '1433',
        message: p && p.connected
          ? `Conectado ao Azure SQL Server (${host})!`
          : 'Aguardando credenciais no Azure Application Settings.'
      }
    };
  }
});

// 7. POST /api/azure/test-connection
app.http('azure-test-connection', {
  methods: ['POST'],
  route: 'azure/test-connection',
  authLevel: 'anonymous',
  handler: async (req: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> => {
    const p = await getPool();
    if (p && p.connected) {
      return {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        jsonBody: {
          success: true,
          message: 'Conexão bem sucedida com o banco de dados Azure SQL!',
          host: process.env.AZURE_DB_HOST || 'sql-qualisac-dicompel.database.windows.net'
        }
      };
    }

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      jsonBody: {
        success: false,
        message: 'A senha do Azure SQL (AZURE_DB_PASSWORD) precisa ser definida no Portal do Azure > Static Web App > Configuração.'
      }
    };
  }
});

// 8. POST /api/database/wipe-samples
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

    return {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
      jsonBody: {
        success: true,
        message: 'Base limpa com sucesso para início de produção.'
      }
    };
  }
});
