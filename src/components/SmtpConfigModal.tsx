import React, { useState, useEffect } from 'react';
import { X, Mail, Server, ShieldCheck, AlertTriangle, Send, CheckCircle2, RefreshCw, Key, HelpCircle } from 'lucide-react';

interface SmtpConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SmtpConfigModal: React.FC<SmtpConfigModalProps> = ({ isOpen, onClose }) => {
  const [smtpStatus, setSmtpStatus] = useState<{
    configured: boolean;
    host: string;
    port: string;
    user: string;
    from: string;
    message: string;
  } | null>(null);

  const [isLoadingStatus, setIsLoadingStatus] = useState(false);
  const [testEmail, setTestEmail] = useState('dicompelinformatica@gmail.com');
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    messageId?: string;
  } | null>(null);

  const fetchStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const res = await fetch('/api/smtp/status');
      const data = await res.json();
      setSmtpStatus(data);
    } catch (err) {
      setSmtpStatus({
        configured: false,
        host: 'Erro ao consultar',
        port: '587',
        user: 'sac@dicompel.com.br',
        from: 'Simon Dicompel SAC <sac@dicompel.com.br>',
        message: 'Não foi possível conectar ao endpoint /api/smtp/status.'
      });
    } finally {
      setIsLoadingStatus(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchStatus();
      setTestResult(null);
    }
  }, [isOpen]);

  const handleSendTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmail.trim()) return;

    setIsSendingTest(true);
    setTestResult(null);

    try {
      const res = await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: testEmail.trim(),
          subject: '[Simon Dicompel SAC] E-mail de Teste do Servidor SMTP',
          body: `Prezado(a) operador,\n\nEste é um e-mail de teste disparado pelo Sistema Simon Dicompel QualiSAC para verificar a entrega de mensagens corporativas.\n\nRemetente: sac@dicompel.com.br\nData/Hora: ${new Date().toLocaleString('pt-BR')}\n\nSe você recebeu este e-mail, as credenciais SMTP corporativas estão funcionando com sucesso!`,
          ticketId: 'TESTE-SMTP',
        }),
      });

      const data = await res.json();

      if (data.success) {
        setTestResult({
          success: true,
          message: data.message || `E-mail de teste enviado com sucesso para ${testEmail}!`,
          messageId: data.messageId,
        });
      } else {
        setTestResult({
          success: false,
          message: data.message || data.error || 'Falha ao autenticar ou enviar via SMTP.',
        });
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Erro de rede ao disparar teste de e-mail.',
      });
    } finally {
      setIsSendingTest(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center">
              <Mail className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base tracking-wide uppercase">
                Configuração de Envio de E-mail
              </h3>
              <p className="text-[11px] text-blue-200">
                Remetente Corporativo: <strong>sac@dicompel.com.br</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto text-slate-700 text-xs">
          
          {/* Status Box */}
          <div className={`p-4 rounded-xl border ${
            smtpStatus?.configured 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
              : 'bg-amber-50/80 border-amber-200 text-amber-950'
          }`}>
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                {smtpStatus?.configured ? (
                  <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                )}
                <div>
                  <h4 className="font-bold text-sm">
                    {smtpStatus?.configured
                      ? 'Servidor SMTP Conectado & Operacional'
                      : 'Servidor SMTP Requer Configuração de Credenciais (.env)'}
                  </h4>
                  <p className="text-[11px] mt-1 leading-relaxed opacity-90">
                    {smtpStatus?.message}
                  </p>
                </div>
              </div>

              <button
                onClick={fetchStatus}
                disabled={isLoadingStatus}
                className="p-1.5 bg-white/80 hover:bg-white rounded-lg border border-slate-200 text-slate-700 transition-all shrink-0 cursor-pointer"
                title="Recarregar status da conexão"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingStatus ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 pt-3 border-t border-slate-200/60 font-mono text-[10px]">
              <div>
                <span className="text-slate-500 block uppercase text-[8.5px]">Remetente:</span>
                <strong className="text-slate-800">sac@dicompel.com.br</strong>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[8.5px]">Host SMTP:</span>
                <strong className="text-slate-800">{smtpStatus?.host || 'Não definido'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[8.5px]">Porta:</span>
                <strong className="text-slate-800">{smtpStatus?.port || '587'}</strong>
              </div>
              <div>
                <span className="text-slate-500 block uppercase text-[8.5px]">Status:</span>
                <strong className={smtpStatus?.configured ? 'text-emerald-700' : 'text-amber-700'}>
                  {smtpStatus?.configured ? 'Configurado' : 'Pendente .env'}
                </strong>
              </div>
            </div>
          </div>

          {/* O que é necessário para enviar com sac@dicompel.com.br */}
          <div className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-xs uppercase">
              <Server className="w-4 h-4 text-blue-600" />
              <span>O que precisa ser feito para enviar e-mails reais da Dicompel?</span>
            </div>
            
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Para que os e-mails cheguem de verdade nas caixas postais dos clientes e observadores, os navegadores não podem disparar e-mails sozinhos por segurança. É necessário que o servidor do sistema conheça os dados de conexão da caixa postal <strong>sac@dicompel.com.br</strong>.
            </p>

            <div className="space-y-2 pt-1">
              <span className="font-bold text-slate-700 block text-[11px]">
                Defina as seguintes variáveis no arquivo <code className="bg-slate-200 px-1 py-0.5 rounded text-blue-700 font-mono">.env</code> do servidor:
              </span>

              <div className="bg-slate-900 text-slate-100 p-3 rounded-lg font-mono text-[11px] space-y-1 overflow-x-auto shadow-inner">
                <p><span className="text-slate-400"># Servidor SMTP da Dicompel (ex: mail.dicompel.com.br ou smtp.office365.com)</span></p>
                <p><span className="text-sky-300">SMTP_HOST</span>=<span className="text-emerald-300">"mail.dicompel.com.br"</span></p>
                <p><span className="text-sky-300">SMTP_PORT</span>=<span className="text-emerald-300">587</span></p>
                <p><span className="text-sky-300">SMTP_SECURE</span>=<span className="text-emerald-300">false</span></p>
                <p><span className="text-sky-300">SMTP_USER</span>=<span className="text-emerald-300">"sac@dicompel.com.br"</span></p>
                <p><span className="text-sky-300">SMTP_PASS</span>=<span className="text-amber-300">"senha_do_email_ou_senha_de_app"</span></p>
                <p><span className="text-sky-300">SMTP_FROM</span>=<span className="text-emerald-300">"Simon Dicompel SAC &lt;sac@dicompel.com.br&gt;"</span></p>
              </div>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-blue-900 text-[11px] space-y-1">
              <p className="font-bold flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5" />
                <span>Tipos comuns de provedor de e-mail corporativo:</span>
              </p>
              <ul className="list-disc list-inside space-y-0.5 text-[10.5px] text-blue-800 pl-1">
                <li><strong>Microsoft 365 / Outlook:</strong> Host <code className="bg-white px-1 rounded">smtp.office365.com</code>, Porta <code className="bg-white px-1 rounded">587</code>, STARTTLS.</li>
                <li><strong>Google Workspace:</strong> Host <code className="bg-white px-1 rounded">smtp.gmail.com</code>, Porta <code className="bg-white px-1 rounded">587</code> (com Senha de App de 16 dígitos).</li>
                <li><strong>Servidor de E-mail Próprio (cPanel / Plesk / Zimbra):</strong> Host <code className="bg-white px-1 rounded">mail.dicompel.com.br</code>, Porta <code className="bg-white px-1 rounded">587</code> ou <code className="bg-white px-1 rounded">465</code>.</li>
              </ul>
            </div>
          </div>

          {/* Test Form */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase flex items-center gap-1.5">
                <Send className="w-4 h-4 text-emerald-600" />
                <span>Testar Disparo Agora</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono">
                Remetente: sac@dicompel.com.br
              </span>
            </div>

            <form onSubmit={handleSendTest} className="space-y-3">
              <div>
                <label className="text-[10.5px] font-bold text-slate-600 uppercase block mb-1">
                  E-mail de Destino para Teste:
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    required
                    placeholder="ex: seuemail@gmail.com ou ti@dicompel.com.br"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    className="flex-1 px-3 py-2 text-xs border border-slate-250 rounded-lg bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                  <button
                    type="submit"
                    disabled={isSendingTest}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Send className={`w-3.5 h-3.5 ${isSendingTest ? 'animate-pulse' : ''}`} />
                    <span>{isSendingTest ? 'Enviando...' : 'Enviar Teste'}</span>
                  </button>
                </div>
              </div>

              {testResult && (
                <div className={`p-3 rounded-lg border text-xs leading-relaxed ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-rose-50 border-rose-200 text-rose-900'
                }`}>
                  <div className="flex items-start gap-2">
                    {testResult.success ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    )}
                    <div>
                      <strong className="block">{testResult.success ? 'Sucesso!' : 'Aviso do Servidor:'}</strong>
                      <p className="mt-0.5">{testResult.message}</p>
                      {testResult.messageId && (
                        <p className="text-[10px] font-mono text-emerald-700 mt-1">
                          Message-ID: {testResult.messageId}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </form>
          </div>

        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>Remetente oficial cadastrado: <strong>sac@dicompel.com.br</strong></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-lg transition-colors cursor-pointer"
          >
            Fechar
          </button>
        </div>

      </div>
    </div>
  );
};
