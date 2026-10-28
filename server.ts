import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import net from 'net';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';
import {
  connectAzureSql,
  getDatabaseStatus,
  getAllTickets,
  saveTicket,
  deleteTicket,
  getAllProducts,
  saveProduct,
  deleteProduct,
  wipeSampleData
} from './src/server/database.js';

dotenv.config({ override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Initialize Azure SQL Connection on startup
connectAzureSql().catch(err => {
  console.warn('[Server] Falha inicial ao conectar no Azure SQL (operando em modo local persistente):', err.message);
});

app.use(express.json({ limit: '10mb' }));

// 1. Health & SMTP Status Endpoint
app.get('/api/smtp/status', (req, res) => {
  const smtpHost = process.env.SMTP_HOST || '';
  const smtpPort = process.env.SMTP_PORT || '587';
  const smtpUser = process.env.SMTP_USER || 'sac@dicompel.com.br';
  const smtpPass = process.env.SMTP_PASS || '';
  const isConfigured = Boolean(smtpHost && smtpPass);

  res.json({
    configured: isConfigured,
    host: smtpHost || 'Não configurado',
    port: smtpPort,
    user: smtpUser,
    from: process.env.SMTP_FROM || `Simon Dicompel SAC <${smtpUser}>`,
    message: isConfigured
      ? `Servidor SMTP configurado para envio real via ${smtpHost}.`
      : 'Credenciais SMTP ainda não definidas nas variáveis de ambiente (.env).'
  });
});

// 2. Real Email Dispatch Endpoint via Nodemailer
app.post('/api/send-email', async (req, res) => {
  const { to, cc, subject, body, ticketId } = req.body;

  if (!to || !subject || !body) {
    return res.status(400).json({
      success: false,
      error: 'Campos obrigatórios ausentes: "to", "subject" e "body" são requeridos.'
    });
  }

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = parseInt(process.env.SMTP_PORT || '587', 10);
  const smtpUser = process.env.SMTP_USER || 'sac@dicompel.com.br';
  const smtpPass = process.env.SMTP_PASS;
  const smtpSecure = process.env.SMTP_SECURE === 'true' || smtpPort === 465;
  const smtpFrom = process.env.SMTP_FROM || `Simon Dicompel SAC <${smtpUser}>`;

  // Normaliza lista de cópias (CC)
  let ccList: string[] = [];
  if (Array.isArray(cc)) {
    ccList = cc.filter(c => typeof c === 'string' && c.trim().length > 0);
  } else if (typeof cc === 'string' && cc.trim().length > 0) {
    ccList = [cc.trim()];
  }

  // Se o servidor SMTP ainda não tiver sido configurado no .env, devolve aviso estruturado
  if (!smtpHost || !smtpPass) {
    return res.json({
      success: false,
      status: 'NEEDS_CONFIGURATION',
      message: 'O e-mail foi registrado no sistema, porém o servidor SMTP corporativo (host/senha) de sac@dicompel.com.br ainda não foi configurado nas variáveis de ambiente (.env).',
      details: {
        configured: false,
        recommendedSender: smtpUser,
        to,
        cc: ccList,
        subject
      }
    });
  }

  try {
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
      text: body,
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
${body}
              </div>
              <div style="margin-top: 24px; padding-top: 16px; border-top: 1px solid #e2e8f0; font-size: 11px; color: #64748b; line-height: 1.5;">
                <p style="margin: 0 0 4px 0;"><strong>Remetente Oficial:</strong> ${smtpFrom}</p>
                <p style="margin: 0 0 4px 0;"><strong>Destinatário Principal:</strong> ${to}</p>
                ${ccList.length > 0 ? `<p style="margin: 0 0 4px 0;"><strong>Observadores em Cópia:</strong> ${ccList.join(', ')}</p>` : ''}
                <p style="margin: 12px 0 0 0; font-style: italic; color: #94a3b8;">
                  Para interagir neste chamado, você pode responder diretamente a esta mensagem ou entrar em contato através do SAC Simon Dicompel.
                </p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    });

    console.log(`[SMTP] E-mail enviado com sucesso. MessageID: ${info.messageId}`);

    return res.json({
      success: true,
      messageId: info.messageId,
      message: `E-mail enviado com sucesso para ${to} via sac@dicompel.com.br!`,
      sender: smtpFrom
    });
  } catch (error: any) {
    console.error('[SMTP] Erro ao enviar e-mail via servidor SMTP:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Falha ao autenticar ou conectar no servidor SMTP.',
      details: error
    });
  }
});

// Helper to update variables in .env file
function updateEnvVars(newVars: Record<string, string>) {
  const envPath = path.resolve(__dirname, '.env');
  let currentEnv = '';
  if (fs.existsSync(envPath)) {
    currentEnv = fs.readFileSync(envPath, 'utf-8');
  }
  
  let lines = currentEnv ? currentEnv.split(/\r?\n/) : [];
  for (const [key, val] of Object.entries(newVars)) {
    process.env[key] = val;
    let found = false;
    lines = lines.map(line => {
      if (line.trim().startsWith(`${key}=`)) {
        found = true;
        return `${key}="${val}"`;
      }
      return line;
    });
    if (!found) {
      lines.push(`${key}="${val}"`);
    }
  }
  fs.writeFileSync(envPath, lines.join('\n'));
}

// 3. Azure Database Status & Configuration Info
app.get('/api/azure/status', (req, res) => {
  let host = process.env.AZURE_DB_HOST || '';
  if (host && !host.includes('.')) {
    host = `${host}.database.windows.net`;
  }
  const user = process.env.AZURE_DB_USER || '';
  const db = process.env.AZURE_DB_NAME || 'qualisac_db';
  const port = process.env.AZURE_DB_PORT || '1433';
  const dbStatus = getDatabaseStatus();

  res.json({
    configured: dbStatus.connected,
    host: host || 'Não configurado (.env)',
    user: user || 'Não configurado',
    database: db,
    port,
    workflowFile: '.github/workflows/deploy-azure-database.yml',
    sqlFile: 'azure_sql_setup.sql',
    scriptFile: 'scripts/montar_banco_azure.sh',
    dbStatus,
    message: dbStatus.message
  });
});

// Update Azure Database Configuration (AZURE_DB_HOST, etc.)
app.post('/api/azure/config', async (req, res) => {
  try {
    const { host, port, user, password, database } = req.body;
    
    if (!host || typeof host !== 'string' || !host.trim()) {
      return res.status(400).json({
        success: false,
        error: 'O parâmetro "host" (AZURE_DB_HOST) é obrigatório.'
      });
    }

    let cleanHost = host.trim();
    if (!cleanHost.includes('.')) {
      cleanHost = `${cleanHost}.database.windows.net`;
    }
    const cleanPort = String(port || '1433').trim();
    const cleanUser = String(user || 'qualisacadmin').trim();
    const cleanDb = String(database || 'qualisac_db').trim();

    const updates: Record<string, string> = {
      AZURE_DB_HOST: cleanHost,
      AZURE_DB_PORT: cleanPort,
      AZURE_DB_USER: cleanUser,
      AZURE_DB_NAME: cleanDb,
      AZURE_DB_SSL: 'true'
    };

    if (password !== undefined && password !== null) {
      updates.AZURE_DB_PASSWORD = String(password);
    }

    updateEnvVars(updates);

    console.log(`[Azure DB] AZURE_DB_HOST atualizado para: ${cleanHost}:${cleanPort}`);

    // Try connecting immediately with the new credentials
    await connectAzureSql();
    const dbStatus = getDatabaseStatus();

    return res.json({
      success: true,
      message: dbStatus.connected
        ? `AZURE_DB_HOST atualizado e CONECTADO ao Azure SQL Server (${cleanHost})!`
        : `AZURE_DB_HOST atualizado para "${cleanHost}". ${dbStatus.message}`,
      config: {
        host: cleanHost,
        port: cleanPort,
        user: cleanUser,
        database: cleanDb
      },
      dbStatus
    });
  } catch (err: any) {
    console.error('[Azure DB] Erro ao salvar configurações:', err);
    return res.status(500).json({
      success: false,
      error: err.message || 'Falha ao salvar as configurações no servidor.'
    });
  }
});

// Full Database Payload (Tickets & Products)
app.get('/api/data', async (req, res) => {
  try {
    const [tickets, products] = await Promise.all([
      getAllTickets(),
      getAllProducts()
    ]);
    const dbStatus = getDatabaseStatus();
    res.json({
      success: true,
      tickets,
      products,
      dbStatus
    });
  } catch (err: any) {
    console.error('[API] Erro ao carregar dados:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Tickets REST API
app.get('/api/tickets', async (req, res) => {
  try {
    const tickets = await getAllTickets();
    res.json({ success: true, tickets });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/tickets', async (req, res) => {
  try {
    const ticket = await saveTicket(req.body);
    res.json({ success: true, ticket });
  } catch (err: any) {
    console.error('[API] Erro ao salvar chamado:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.put('/api/tickets/:id', async (req, res) => {
  try {
    const ticket = await saveTicket({ ...req.body, id: req.params.id });
    res.json({ success: true, ticket });
  } catch (err: any) {
    console.error('[API] Erro ao atualizar chamado:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/tickets/:id', async (req, res) => {
  try {
    await deleteTicket(req.params.id);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[API] Erro ao excluir chamado:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Products REST API
app.get('/api/products', async (req, res) => {
  try {
    const products = await getAllProducts();
    res.json({ success: true, products });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const product = await saveProduct(req.body);
    res.json({ success: true, product });
  } catch (err: any) {
    console.error('[API] Erro ao salvar produto:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

app.delete('/api/products/:code', async (req, res) => {
  try {
    await deleteProduct(req.params.code);
    res.json({ success: true });
  } catch (err: any) {
    console.error('[API] Erro ao excluir produto:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Wipe Samples Endpoint
app.post('/api/database/wipe-samples', async (req, res) => {
  try {
    const result = await wipeSampleData();
    res.json({
      success: true,
      message: 'Base limpa com sucesso para início de produção.',
      result
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Test TCP connectivity to Azure DB Host
app.post('/api/azure/test-connection', (req, res) => {
  const targetHost = req.body?.host || process.env.AZURE_DB_HOST;
  const targetPort = parseInt(req.body?.port || process.env.AZURE_DB_PORT || '1433', 10);

  if (!targetHost || targetHost.includes('your-azure-db-host')) {
    return res.status(400).json({
      success: false,
      error: 'Host inválido ou não configurado. Defina o AZURE_DB_HOST primeiro.'
    });
  }

  const startTime = Date.now();
  const socket = new net.Socket();
  let finished = false;

  const timer = setTimeout(() => {
    if (!finished) {
      finished = true;
      socket.destroy();
      return res.json({
        success: false,
        error: 'TIMEOUT',
        message: `Tempo limite de conexão (5s) excedido para ${targetHost}:${targetPort}. Verifique se a regra de Firewall no Portal do Azure permite a conexão do IP da aplicação.`
      });
    }
  }, 5000);

  socket.connect(targetPort, targetHost, () => {
    if (!finished) {
      finished = true;
      clearTimeout(timer);
      const latencyMs = Date.now() - startTime;
      socket.end();
      return res.json({
        success: true,
        latencyMs,
        message: `Conexão bem-sucedida! O servidor Azure SQL em ${targetHost}:${targetPort} está ativo e respondendo (${latencyMs}ms).`
      });
    }
  });

  socket.on('error', (err: any) => {
    if (!finished) {
      finished = true;
      clearTimeout(timer);
      socket.destroy();
      let tip = '';
      if (err.code === 'ENOTFOUND') {
        tip = `O endereço DNS "${targetHost}" não foi localizado. Verifique a digitação do hostname.`;
      } else if (err.code === 'ECONNREFUSED') {
        tip = `A conexão na porta ${targetPort} foi recusada pelo servidor remoto. Verifique a porta do SQL (padrão: 1433).`;
      } else {
        tip = `Erro de rede: ${err.message}`;
      }
      return res.json({
        success: false,
        error: err.code || 'CONNECTION_ERROR',
        message: tip
      });
    }
  });
});

// Download SQL script
app.get('/api/azure/download-sql', (req, res) => {
  const filePath = path.resolve(__dirname, 'azure_sql_setup.sql');
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'azure_sql_setup.sql');
  } else {
    res.status(404).send('Arquivo SQL não encontrado.');
  }
});

// Download Bash deployment script
app.get('/api/azure/download-script', (req, res) => {
  const filePath = path.resolve(__dirname, 'scripts', 'montar_banco_azure.sh');
  if (fs.existsSync(filePath)) {
    res.download(filePath, 'montar_banco_azure.sh');
  } else {
    res.status(404).send('Arquivo de script não encontrado.');
  }
});

// Get SQL file text content for in-browser copy/view
app.get('/api/azure/sql-content', (req, res) => {
  const filePath = path.resolve(__dirname, 'azure_sql_setup.sql');
  if (fs.existsSync(filePath)) {
    const content = fs.readFileSync(filePath, 'utf-8');
    res.json({ success: true, filename: 'azure_sql_setup.sql', content });
  } else {
    res.status(404).json({ success: false, error: 'Arquivo SQL não encontrado.' });
  }
});

// 4. Vite development server or production static files
if (process.env.NODE_ENV !== 'production') {
  const { createServer } = await import('vite');
  const vite = await createServer({
    server: { 
      middlewareMode: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.resolve(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Simon Dicompel SAC server running on http://0.0.0.0:${PORT}`);
});
