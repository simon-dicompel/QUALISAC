import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import nodemailer from 'nodemailer';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

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

// 3. Vite development server or production static files
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
