import React, { useState } from 'react';
import { SystemEmailLog } from '../types';
import { Terminal, Mail, Trash2, ChevronRight, ChevronDown, Check, Send, AlertCircle, Sparkles } from 'lucide-react';

interface EmailConsoleProps {
  logs: SystemEmailLog[];
  onClearLogs: () => void;
  onSendTestLog: () => void;
  isOpen: boolean;
  onToggle: () => void;
}

export const EmailConsole: React.FC<EmailConsoleProps> = ({
  logs,
  onClearLogs,
  onSendTestLog,
  isOpen,
  onToggle,
}) => {
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div 
      className={`fixed bottom-0 right-0 left-0 md:left-64 bg-slate-950 border-t border-slate-800 transition-all duration-300 z-40 flex flex-col ${
        isOpen ? 'h-96' : 'h-11'
      } no-print`}
    >
      {/* Console Header Bar */}
      <div 
        onClick={onToggle}
        className="h-11 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between cursor-pointer select-none hover:bg-slate-850 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4.5 h-4.5 text-blue-400 animate-pulse" />
          <span className="font-mono text-xs font-bold text-slate-200 tracking-wider">
            CONSOLE DE INTEGRAÇÃO SMTP & NOTIFICAÇÕES (MESSAGING BROKER)
          </span>
          <span className="bg-blue-900/60 text-blue-300 font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-800">
            {logs.length} disparos
          </span>
        </div>
        
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-slate-500 font-semibold uppercase hidden sm:inline">
            {isOpen ? 'Clique para Minimizar' : 'Clique para Maximizar Console'}
          </span>
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400 rotate-180" />
          )}
        </div>
      </div>

      {/* Console Body Area */}
      {isOpen && (
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden text-slate-300 font-mono text-xs">
          {/* Left Column: Log item list */}
          <div className="w-full md:w-1/2 border-r border-slate-850 flex flex-col h-full overflow-hidden">
            {/* Action controls row */}
            <div className="p-2 border-b border-slate-850 bg-slate-900/50 flex items-center justify-between gap-2 shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-1">
                Fila de Envio Reversa (Logs de Eventos)
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onSendTestLog();
                  }}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-[10px] text-blue-300 hover:text-white rounded border border-slate-750 font-bold transition-all flex items-center gap-1 cursor-pointer"
                  title="Gera um disparo de email de demonstração para fins de teste técnico no console"
                >
                  <Sparkles className="w-3 h-3 text-yellow-400 shrink-0" />
                  <span>Simular Disparo Teste</span>
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearLogs();
                    setSelectedLogId(null);
                  }}
                  disabled={logs.length === 0}
                  className="px-2 py-1 bg-slate-900 hover:bg-red-950 text-[10px] text-slate-400 hover:text-red-400 rounded border border-slate-800 hover:border-red-900 font-bold transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <Trash2 className="w-3 h-3 shrink-0" />
                  <span>Limpar Fila</span>
                </button>
              </div>
            </div>

            {/* Logs loop */}
            <div className="flex-1 overflow-y-auto divide-y divide-slate-900">
              {logs.length > 0 ? (
                logs.map((log) => {
                  const isSelected = selectedLogId === log.id;
                  const dateStr = new Date(log.timestamp).toLocaleTimeString();
                  
                  return (
                    <div
                      key={log.id}
                      onClick={() => setSelectedLogId(log.id)}
                      className={`p-2.5 transition-colors cursor-pointer text-left flex flex-col gap-1.5 ${
                        isSelected 
                          ? 'bg-slate-900 border-l border-blue-500' 
                          : 'hover:bg-slate-900/40 bg-slate-950'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[9px] text-slate-600 bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800">
                            {dateStr}
                          </span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            log.status === 'Resolvido' 
                              ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-900' 
                              : 'bg-indigo-950/80 text-indigo-400 border border-indigo-900'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                        <span className="text-[9px] text-slate-500 font-bold">
                          SMTP 250 OK
                        </span>
                      </div>

                      <div className="text-slate-200 mt-0.5 font-medium truncate">
                        {log.subject}
                      </div>

                      <div className="flex justify-between items-center text-[10px] text-slate-400">
                        <span className="truncate max-w-xs block">
                          Para: <strong className="text-slate-300 font-semibold">{log.recipientEmail}</strong>
                        </span>
                        <span className="text-sky-500 flex items-center gap-0.5 font-bold text-[9px] shrink-0">
                          <Send className="w-2.5 h-2.5" /> Enviado ({log.serviceType})
                        </span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-slate-600 p-8 text-center space-y-2">
                  <Mail className="w-8 h-8 text-slate-800" />
                  <p className="text-[10px] max-w-xs leading-relaxed uppercase tracking-wider font-extrabold text-slate-500">
                    Nenhum log de notificação disparado nesta sessão.
                  </p>
                  <p className="text-[9px] max-w-xs leading-normal text-slate-600 font-medium">
                    Mude o status de um chamado para "Resolvido" ou "Finalizado" para testar a simulação de e-mails em tempo real.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Detailed individual log inspection payload */}
          <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
            {selectedLogId ? (
              (() => {
                const log = logs.find((l) => l.id === selectedLogId);
                if (!log) return null;

                return (
                  <div className="flex-1 flex flex-col overflow-hidden h-full">
                    {/* Header bar payload details */}
                    <div className="p-2 border-b border-slate-850 bg-slate-900/50 flex justify-between items-center sm:gap-2 shrink-0">
                      <span className="text-[10px] text-blue-400 font-bold uppercase tracking-wider flex items-center gap-1">
                        <Terminal className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                        <span>Log: {log.id}</span>
                      </span>
                      <button
                        onClick={() => copyToClipboard(log.body, log.id)}
                        className="px-2 py-0.5 bg-slate-905 hover:bg-slate-800 border border-slate-750 rounded text-[9px] text-slate-400 hover:text-white transition-all flex items-center gap-1 cursor-pointer"
                      >
                        {copiedId === log.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-500 shrink-0" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <span>Copiar Conteúdo</span>
                        )}
                      </button>
                    </div>

                    {/* Email layout view inside the logger to simulate real email client */}
                    <div className="flex-1 p-3.5 overflow-y-auto space-y-3.5 bg-slate-950 scrollbar-thin">
                      <div className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-[10px] space-y-1.5">
                        <div className="flex text-slate-400">
                          <span className="w-16 shrink-0 font-bold uppercase tracking-wider text-slate-500">De:</span>
                          <span className="text-slate-300 font-semibold">{log.sender}</span>
                        </div>
                        <div className="flex text-slate-400">
                          <span className="w-16 shrink-0 font-bold uppercase tracking-wider text-slate-500">Para:</span>
                          <span className="text-slate-300 font-semibold">{log.recipientName} ({log.recipientEmail})</span>
                        </div>
                        <div className="flex text-slate-400">
                          <span className="w-16 shrink-0 font-bold uppercase tracking-wider text-slate-500">Assunto:</span>
                          <span className="text-amber-400 font-bold">{log.subject}</span>
                        </div>
                        <div className="flex text-slate-400">
                          <span className="w-16 shrink-0 font-bold uppercase tracking-wider text-slate-500">Serviço:</span>
                          <span className="text-sky-400 font-semibold">{log.serviceType}</span>
                        </div>
                        <div className="flex text-slate-400">
                          <span className="w-16 shrink-0 font-bold uppercase tracking-wider text-slate-500">Timestamp:</span>
                          <span className="text-slate-400">{new Date(log.timestamp).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest block">
                          TEXTO DO EMAIL ENVIADO (SMTP RAW BODY)
                        </span>
                        <pre className="p-3 bg-slate-900 border border-slate-800 rounded-lg text-[10px] leading-relaxed text-emerald-400 select-text font-mono text-wrap whitespace-pre-wrap break-all shadow-inner">
                          {log.body}
                        </pre>
                      </div>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-600 p-8 text-center space-y-1.5">
                <AlertCircle className="w-7 h-7 text-slate-800" />
                <p className="text-[10px] uppercase font-bold text-slate-500">
                  Nenhum Log Selecionado
                </p>
                <p className="text-[9px] text-slate-600 max-w-xs leading-normal">
                  Clique em um dos logs de e-mail na lista lateral esquerda para verificar o cabeçalho completo, destinatário e o corpo formatado da mensagem.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
