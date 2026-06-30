import React, { useState } from 'react';
import { Ticket, TicketStatus, User, TicketComment, QualityReport, IssueType, TicketReminder } from '../types';
import { generateAIQualityReport } from '../utils/gemini';
import { 
  ArrowLeft, 
  User as UserIcon, 
  Calendar, 
  FileText, 
  Plus, 
  Trash2, 
  Upload, 
  CheckCircle, 
  MessageSquare, 
  History, 
  BrainCircuit, 
  AlertOctagon,
  Printer,
  ChevronRight,
  Sparkles,
  Download,
  ListTodo,
  Check,
  X
} from 'lucide-react';

interface TicketDetailsProps {
  ticket: Ticket;
  users: User[];
  currentUser: User;
  onBack: () => void;
  onUpdateStatus: (ticketId: string, newStatus: TicketStatus) => void;
  onAddComment: (ticketId: string, text: string) => void;
  onUpdateQualityReport: (ticketId: string, report: QualityReport) => void;
  onAddFile: (ticketId: string, name: string, size: string, type: string, url: string) => void;
  onDeleteTicket: (ticketId: string) => void;
  onUpdateReminders: (ticketId: string, reminders: TicketReminder[]) => void;
}

export const TicketDetails: React.FC<TicketDetailsProps> = ({
  ticket,
  users,
  currentUser,
  onBack,
  onUpdateStatus,
  onAddComment,
  onUpdateQualityReport,
  onAddFile,
  onDeleteTicket,
  onUpdateReminders,
}) => {
  // Tabs for the right panel: "Analise de Qualidade" vs "Comentarios e Auditoria"
  const [activeTab, setActiveTab] = useState<'qualidade' | 'interacoes'>('qualidade');
  
  // Comments input text
  const [newComment, setNewComment] = useState('');

  // Reminder (secondary task) form state variables
  const [reminderText, setReminderText] = useState('');
  const [reminderDueDate, setReminderDueDate] = useState('');
  const [reminderPriority, setReminderPriority] = useState<'Baixa' | 'Média' | 'Alta'>('Média');
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);

  // Auto-save & load comment to/from localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem(`autosave_comment_${ticket.id}`);
    if (saved !== null) {
      setNewComment(saved);
    } else {
      setNewComment('');
    }
  }, [ticket.id]);

  React.useEffect(() => {
    if (newComment) {
      localStorage.setItem(`autosave_comment_${ticket.id}`, newComment);
    } else {
      localStorage.removeItem(`autosave_comment_${ticket.id}`);
    }
  }, [newComment, ticket.id]);

  // Reminders Management Operations
  const handleAddReminder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reminderText.trim()) return;

    const newReminder: TicketReminder = {
      id: `rem_${Date.now()}`,
      text: reminderText.trim(),
      dueDate: reminderDueDate || new Date().toISOString().split('T')[0],
      priority: reminderPriority,
      completed: false,
      createdAt: new Date().toISOString(),
    };

    const currentReminders = ticket.reminders || [];
    onUpdateReminders(ticket.id, [...currentReminders, newReminder]);

    // Clear form inputs
    setReminderText('');
    setReminderDueDate('');
    setReminderPriority('Média');
  };

  const handleToggleReminder = (reminderId: string) => {
    const currentReminders = ticket.reminders || [];
    const updated = currentReminders.map((r) => 
      r.id === reminderId ? { ...r, completed: !r.completed } : r
    );
    onUpdateReminders(ticket.id, updated);
  };

  const handleRemoveReminder = (reminderId: string) => {
    const currentReminders = ticket.reminders || [];
    const updated = currentReminders.filter((r) => r.id !== reminderId);
    onUpdateReminders(ticket.id, updated);
  };

  // 5 Whys state
  const [rootCause, setRootCause] = useState(ticket.qualityReport?.rootCause || '');
  const [whys, setWhys] = useState<string[]>(
    ticket.qualityReport?.fiveWhys || [
      'Por que o problema ocorreu? ',
      'Por que... ',
      'Por que... ',
      'Por que... ',
      'Por que... '
    ]
  );
  const [correctiveAction, setCorrectiveAction] = useState(ticket.qualityReport?.correctiveAction || '');
  const [preventiveAction, setPreventiveAction] = useState(ticket.qualityReport?.preventiveAction || '');
  const [responsible, setResponsible] = useState(ticket.qualityReport?.responsible || '');
  const [targetDate, setTargetDate] = useState(ticket.qualityReport?.targetDate || '');

  // Flag indicating if there are unsaved localized changes in the browser (Autosave indicator)
  const [isDraftAutosaved, setIsDraftAutosaved] = useState(false);

  // AI Loading state
  const [isAiLoading, setIsAiLoading] = useState(false);

  // File Upload State
  const [dragActive, setDragActive] = useState(false);

  // Sync state if ticket changes, checking for autosaved draft first
  React.useEffect(() => {
    const savedDraft = localStorage.getItem(`autosave_quality_draft_${ticket.id}`);
    if (savedDraft) {
      try {
        const draft = JSON.parse(savedDraft);
        setRootCause(draft.rootCause ?? '');
        setWhys(draft.fiveWhys ?? [
          'Por que o problema ocorreu? ',
          'Por que... ',
          'Por que... ',
          'Por que... ',
          'Por que... '
        ]);
        setCorrectiveAction(draft.correctiveAction ?? '');
        setPreventiveAction(draft.preventiveAction ?? '');
        setResponsible(draft.responsible ?? '');
        setTargetDate(draft.targetDate ?? '');
        setIsDraftAutosaved(true);
        return;
      } catch (e) {
        console.error('Error parsing quality report draft:', e);
      }
    }

    setRootCause(ticket.qualityReport?.rootCause || '');
    setWhys(
      ticket.qualityReport?.fiveWhys || [
        'Por que o problema ocorreu? ',
        'Por que... ',
        'Por que... ',
        'Por que... ',
        'Por que... '
      ]
    );
    setCorrectiveAction(ticket.qualityReport?.correctiveAction || '');
    setPreventiveAction(ticket.qualityReport?.preventiveAction || '');
    setResponsible(ticket.qualityReport?.responsible || '');
    setTargetDate(ticket.qualityReport?.targetDate || '');
    setIsDraftAutosaved(false);
    setIsConfirmingDelete(false);
  }, [ticket]);

  // Auto-save quality draft changes to localStorage
  React.useEffect(() => {
    const savedReport = ticket.qualityReport;
    const isDifferent =
      rootCause !== (savedReport?.rootCause || '') ||
      JSON.stringify(whys) !== JSON.stringify(savedReport?.fiveWhys || [
        'Por que o problema ocorreu? ',
        'Por que... ',
        'Por que... ',
        'Por que... ',
        'Por que... '
      ]) ||
      correctiveAction !== (savedReport?.correctiveAction || '') ||
      preventiveAction !== (savedReport?.preventiveAction || '') ||
      responsible !== (savedReport?.responsible || '') ||
      targetDate !== (savedReport?.targetDate || '');

    if (isDifferent) {
      const draft = {
        rootCause,
        fiveWhys: whys,
        correctiveAction,
        preventiveAction,
        responsible,
        targetDate,
      };
      localStorage.setItem(`autosave_quality_draft_${ticket.id}`, JSON.stringify(draft));
      setIsDraftAutosaved(true);
    } else {
      localStorage.removeItem(`autosave_quality_draft_${ticket.id}`);
      setIsDraftAutosaved(false);
    }
  }, [rootCause, whys, correctiveAction, preventiveAction, responsible, targetDate, ticket.id, ticket.qualityReport]);

  // Handle active permissions
  const isQualidadeOrAdmin = currentUser.role === 'QUALIDADE' || currentUser.role === 'ADMIN';
  const canModifyQuality = isQualidadeOrAdmin && ticket.status !== 'Finalizado';

  // AI-assist trigger using the gemini helper
  const handleAIAssist = async () => {
    setIsAiLoading(true);
    try {
      // Use standard Gemini call (falls back automatically to intelligent rule-based agent if no key is configured)
      const mockKey = 'MY_GEMINI_API_KEY'; // Uses the fallback system inside gemini.ts
      const suggestion = await generateAIQualityReport(
        ticket.productName,
        ticket.productCode,
        ticket.issueType,
        ticket.description,
        mockKey
      );

      setRootCause(suggestion.rootCause);
      if (suggestion.fiveWhys && suggestion.fiveWhys.length >= 5) {
        setWhys(suggestion.fiveWhys);
      }
      setCorrectiveAction(suggestion.correctiveAction);
      setPreventiveAction(suggestion.preventiveAction);
      setResponsible(suggestion.responsible);

      // Default target date to 10 days out
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 10);
      setTargetDate(futureDate.toISOString().split('T')[0]);

      // Success feedback
      alert('⚡ Análise Sugerida pelo Assistente de Qualidade IA gerada e pré-preenchida com sucesso! Revise e clique em "Salvar Relatório de Não Conformidade".');
    } catch (e) {
      alert('Erro ao formular causa raiz pelo assistente de IA.');
    } finally {
      setIsAiLoading(false);
    }
  };

  // Submit Comments
  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    onAddComment(ticket.id, newComment);
    setNewComment('');
    localStorage.removeItem(`autosave_comment_${ticket.id}`);
  };

  // Submit Technical quality report
  const handleSaveReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rootCause.trim() || !correctiveAction.trim() || !responsible.trim()) {
      alert('Por favor, preencha a Causa Raiz, a Ação Corretiva e o Responsável.');
      return;
    }

    const report: QualityReport = {
      rootCause,
      fiveWhys: whys,
      correctiveAction,
      preventiveAction,
      responsible,
      targetDate,
      updatedAt: new Date().toISOString(),
    };

    onUpdateQualityReport(ticket.id, report);
    localStorage.removeItem(`autosave_quality_draft_${ticket.id}`);
    alert('✅ Relatório técnico de análise de causa e ações corretivas atualizado no chamado!');
  };

  // Handle real file attachments
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const file = fileList[0];
    const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
    const objectUrl = URL.createObjectURL(file);
    
    onAddFile(ticket.id, file.name, sizeStr, file.type, objectUrl);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      const sizeStr = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      const objectUrl = URL.createObjectURL(file);
      onAddFile(ticket.id, file.name, sizeStr, file.type, objectUrl);
    }
  };

  const handleWhyChange = (index: number, val: string) => {
    const newWhys = [...whys];
    newWhys[index] = val;
    setWhys(newWhys);
  };

  // State for differentiating which printed layout is active during print trigger
  const [printType, setPrintType] = useState<'report' | 'label'>('report');

  const handlePrintLabel = () => {
    setPrintType('label');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const handlePrintTicketReport = () => {
    setPrintType('report');
    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <>
      {/* -------------------- PRINT VIEWPORT: TECHNICAL COMPLIANCE REPORT (ISO 9001) -------------------- */}
      {printType === 'report' && (
        <div className="hidden print:block text-slate-950 bg-white font-sans text-[11px] p-6 leading-relaxed space-y-6">
          
          {/* Header Institutional Block */}
          <div className="border-2 border-slate-800 p-4">
            <div className="flex justify-between items-center pb-3 border-b-2 border-slate-800">
              <div>
                <h1 className="text-lg font-black tracking-tight text-slate-900 font-sans uppercase">QualiSAC Co.</h1>
                <p className="text-[9px] text-slate-600 font-mono">SISTEMA DE GESTÃO DA QUALIDADE - SGQ & SAC</p>
                <p className="text-[9px] text-slate-500 font-mono">CONFORMIDADE REQUISITO ISO 9001:2015 - TRATATIVA DE DESVIOS</p>
              </div>
              <div className="text-right border-l border-slate-300 pl-4">
                <span className="font-mono text-xs font-bold text-slate-900 block">
                  REGISTRO DE NÃO-CONFORMIDADE (RNC)
                </span>
                <span className="font-mono text-lg font-black text-blue-800 block mt-1">
                  ID: {ticket.id}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-4 gap-2 pt-3 text-[10px] font-mono">
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[8px]">Status Atual</span>
                <strong className="text-blue-900 font-bold uppercase">{ticket.status}</strong>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[8px]">Início SAC</span>
                <strong className="text-slate-800 font-bold">{new Date(ticket.createdAt).toLocaleDateString()}</strong>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[8px]">Última Transação</span>
                <strong className="text-slate-800 font-bold">{new Date(ticket.updatedAt).toLocaleDateString()}</strong>
              </div>
              <div>
                <span className="text-slate-500 block uppercase font-bold text-[8px]">Locatário (Tenant)</span>
                <strong className="text-slate-800 font-bold">Tenant ID: {ticket.tenantId}</strong>
              </div>
            </div>
          </div>

          {/* Section 1: Origem e Registro do SAC */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold bg-slate-100 px-2 py-1 uppercase text-slate-800 border-l-4 border-slate-800 font-mono">
              1. Identificação do Desvio e Dados de Entrada
            </h2>
            <div className="border border-slate-300 p-3 rounded space-y-3">
              <div className="grid grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <p className="text-slate-600"><span className="font-bold">Cliente / Reclamante:</span> {ticket.clientName}</p>
                  <p className="text-slate-600"><span className="font-bold">Produto Principal:</span> {ticket.productName}</p>
                  <p className="text-slate-600"><span className="font-bold">Código SKU:</span> {ticket.productCode}</p>
                  <p className="text-slate-600"><span className="font-bold">Nota Fiscal:</span> {ticket.invoiceNumber || 'Não informada'}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-slate-600"><span className="font-bold">Lote Rastreável (Batch):</span> {ticket.batch || 'Não Informado'}</p>
                  <p className="text-slate-600"><span className="font-bold">Qtd Afetada / Devolvida:</span> {ticket.quantity} unidades</p>
                  <p className="text-slate-600"><span className="font-bold">Classificação da Ocorrência:</span> {ticket.issueType}{ticket.subCategory ? ` - ${ticket.subCategory}` : ''}</p>
                  <p className="text-slate-600"><span className="font-bold">Data 1º Contato:</span> {ticket.firstContactDate ? new Date(ticket.firstContactDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não informada'}</p>
                </div>
              </div>

              {/* Campos Específicos para Chamado Especial */}
              {(ticket.reseller || ticket.consumer || ticket.shippingValue !== undefined || ticket.requestedReversePac || ticket.registeredUf) && (
                <div className="mt-3 pt-3 border-t border-slate-200">
                  <div className="bg-indigo-50/50 border border-indigo-100 p-3 rounded-lg space-y-2">
                    <span className="font-extrabold text-[10px] text-indigo-900 uppercase font-mono flex items-center gap-1.5">
                      <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                      <span>Informações Adicionais do Chamado Especial:</span>
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 text-xs">
                      {ticket.reseller && (
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Revenda</span>
                          <strong className="text-slate-800">{ticket.reseller}</strong>
                        </div>
                      )}
                      {ticket.consumer && (
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Consumidor</span>
                          <strong className="text-slate-800">{ticket.consumer}</strong>
                        </div>
                      )}
                      {ticket.shippingValue !== undefined && (
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">Valor Frete</span>
                          <strong className="text-slate-800">
                            R$ {ticket.shippingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </strong>
                        </div>
                      )}
                      {ticket.requestedReversePac && (
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">PAC Reverso Solicitado</span>
                          <strong className="text-slate-800">{ticket.requestedReversePac}</strong>
                        </div>
                      )}
                      {ticket.registeredUf && (
                        <div>
                          <span className="text-[10px] text-slate-500 font-bold uppercase block">UF Cadastrado</span>
                          <strong className="text-slate-800 uppercase">{ticket.registeredUf}</strong>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {ticket.items && ticket.items.length > 0 && (
                <div className="border-t border-slate-200 pt-3">
                  <span className="font-bold text-[10px] text-slate-800 uppercase font-mono block mb-1.5">Lista Completa de SKUs Devolvidos neste Chamado:</span>
                  <div className="overflow-x-auto">
                    <table className="w-full border-collapse border border-slate-300 text-[10px] text-left">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="border border-slate-300 p-1.5 font-bold">Código SKU</th>
                          <th className="border border-slate-300 p-1.5 font-bold">Nome do Produto</th>
                          <th className="border border-slate-300 p-1.5 font-bold text-center w-28">Quantidade</th>
                        </tr>
                      </thead>
                      <tbody>
                        {ticket.items.map((item) => (
                          <tr key={item.id} className="hover:bg-slate-55">
                            <td className="border border-slate-300 p-1.5 font-mono font-bold text-slate-900">{item.productCode}</td>
                            <td className="border border-slate-300 p-1.5 text-slate-700">{item.productName}</td>
                            <td className="border border-slate-300 p-1.5 text-center font-bold font-mono text-slate-800">{item.quantity} un</td>
                          </tr>
                        ))}
                        <tr className="bg-slate-100 font-bold">
                          <td colSpan={2} className="border border-slate-300 p-1.5 text-right text-slate-700">Quantidade Total Combinada:</td>
                          <td className="border border-slate-300 p-1.5 text-center font-mono text-blue-700 font-bold">{ticket.items.reduce((sum, item) => sum + item.quantity, 0)} un</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section 2: Relato Original SAC */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold bg-slate-100 px-2 py-1 uppercase text-slate-800 border-l-4 border-slate-800 font-mono">
              2. Relato Detalhado do Desvio (SAC)
            </h2>
            <div className="border border-slate-300 p-3 rounded bg-slate-50/50 italic text-slate-800 whitespace-pre-wrap text-[10px]">
              {ticket.description}
            </div>
          </div>

          {/* Action List (Defects details) if any */}
          {ticket.defects && ticket.defects.length > 0 && (
            <div className="space-y-1.5">
              <span className="font-bold text-[10px] text-slate-700 block">Especificação Física de Avarias / Defeitos:</span>
              <table className="w-full border-collapse border border-slate-300 text-[10px] text-left">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="border border-slate-300 p-1.5 font-bold">Defeito Registrado</th>
                    <th className="border border-slate-300 p-1.5 font-bold text-center w-28">Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  {ticket.defects.map((def, idx) => (
                    <tr key={idx}>
                      <td className="border border-slate-300 p-1.5">{def.description}</td>
                      <td className="border border-slate-300 p-1.5 text-center font-bold font-mono">{def.quantity} un</td>
                    </tr>
                  ))}
                  <tr className="bg-slate-50 font-bold">
                    <td className="border border-slate-300 p-1.5 text-right">Volume Total Detalhado:</td>
                    <td className="border border-slate-300 p-1.5 text-center font-mono">
                      {ticket.defects.reduce((sum, d) => sum + d.quantity, 0)} unidades
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* Section 3: Laudo de Qualidade e Análise de Causa Raiz */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold bg-slate-100 px-2 py-1 uppercase text-slate-800 border-l-4 border-slate-800 font-mono">
              3. Parecer Técnico & Análise de Causa Raiz (Garantia da Qualidade)
            </h2>
            <div className="border border-slate-300 p-4 rounded space-y-4">
              <div>
                <span className="block font-bold text-slate-800 uppercase text-[9px] tracking-wider mb-1">Diagnóstico da Causa Raiz Genuína:</span>
                <p className="text-slate-800 text-xs font-semibold bg-slate-50 p-2.5 rounded border border-slate-150">
                  {ticket.qualityReport?.rootCause || 'ANÁLISE PENDENTE / EM ELABORAÇÃO TÉCNICA'}
                </p>
              </div>

              {/* 5 Whys block */}
              <div>
                <span className="block font-bold text-slate-800 uppercase text-[9px] tracking-wider mb-2">Metodologia ISO de Solução de Problemas (Técnica dos 5 Porquês):</span>
                <div className="space-y-1.5">
                  {ticket.qualityReport?.fiveWhys && ticket.qualityReport.fiveWhys.some(w => w.trim().length > 0) ? (
                    ticket.qualityReport.fiveWhys.map((why, index) => {
                      if (!why || why.trim().length === 0) return null;
                      return (
                        <div key={index} className="flex gap-2 text-[10px]">
                          <span className="font-mono font-bold text-slate-500 bg-slate-100 border border-slate-200 w-6 h-5 rounded flex items-center justify-center shrink-0">
                            {index + 1}
                          </span>
                          <p className="text-slate-700 bg-slate-50/50 rounded px-2 py-0.5 border border-slate-150 flex-1">
                            {why}
                          </p>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-slate-450 italic">Nenhum sequenciamento de 5 Porquês registrado neste parecer.</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Plano de Ação CAPA */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold bg-slate-100 px-2 py-1 uppercase text-slate-800 border-l-4 border-slate-800 font-mono">
              4. Plano de Ação Correção / Bloqueio Preventivo (CAPA)
            </h2>
            <div className="grid grid-cols-2 gap-4 border border-slate-300 p-3 rounded text-[10px]">
              <div>
                <span className="block font-bold text-slate-700 uppercase text-[8px] mb-1">Ação Corretiva Imediata:</span>
                <div className="bg-slate-50 p-2 border border-slate-150 rounded min-h-[50px] whitespace-pre-wrap">
                  {ticket.qualityReport?.correctiveAction || 'PENDENTE DE DEFINIÇÃO'}
                </div>
              </div>
              <div>
                <span className="block font-bold text-slate-700 uppercase text-[8px] mb-1">Ação Preventiva de Longo Prazo:</span>
                <div className="bg-slate-50 p-2 border border-slate-150 rounded min-h-[50px] whitespace-pre-wrap">
                  {ticket.qualityReport?.preventiveAction || 'PENDENTE DE DEFINIÇÃO'}
                </div>
              </div>
              <div className="col-span-2 grid grid-cols-2 gap-2 pt-2 border-t border-slate-200">
                <p className="text-slate-600"><span className="font-bold">Responsável designado:</span> {ticket.qualityReport?.responsible || 'NÃO DESIGNADO'}</p>
                <p className="text-slate-600">
                  <span className="font-bold">Data Alvo de Conclusão:</span>{' '}
                  {ticket.qualityReport?.targetDate 
                    ? new Date(ticket.qualityReport.targetDate).toLocaleDateString() 
                    : 'PENDENTE'
                  }
                </p>
              </div>
            </div>
          </div>

          {/* Section 5: Histórico de Tramitação e Log de Auditoria */}
          <div className="space-y-2">
            <h2 className="text-xs font-bold bg-slate-100 px-2 py-1 uppercase text-slate-800 border-l-4 border-slate-800 font-mono">
              5. Histórico Cronológico de Tramitação e Tratativa de SAC (Log de Auditoria)
            </h2>
            <div className="border border-slate-300 rounded p-2.5 space-y-3 font-mono text-[9px]">
              {(() => {
                const timelineEvents: { date: Date; type: 'HIST' | 'COMM'; author: string; role: string; txt: string; details?: string }[] = [];
                
                if (ticket.history) {
                  ticket.history.forEach(h => {
                    timelineEvents.push({
                      date: new Date(h.timestamp),
                      type: 'HIST',
                      author: h.userName,
                      role: h.userRole,
                      txt: h.action,
                      details: h.details
                    });
                  });
                }

                if (ticket.comments) {
                  ticket.comments.forEach(c => {
                    timelineEvents.push({
                      date: new Date(c.createdAt),
                      type: 'COMM',
                      author: c.userName,
                      role: c.userRole,
                      txt: `Adicionou comentário no chat de tratativa`,
                      details: c.text
                    });
                  });
                }

                timelineEvents.sort((a,b) => a.date.getTime() - b.date.getTime());

                if (timelineEvents.length === 0) {
                  return <p className="text-slate-400 italic">Nenhum evento registrado no histórico.</p>;
                }

                return (
                  <div className="space-y-2 pl-2 border-l border-slate-300">
                    {timelineEvents.map((evt, idx) => (
                      <div key={idx} className="relative pl-3">
                        <div className="absolute -left-[13px] top-1 w-1.5 h-1.5 rounded-full bg-slate-800"></div>
                        <div className="flex justify-between text-slate-500 text-[8px]">
                          <span>
                            {evt.date.toLocaleDateString()} {evt.date.toLocaleTimeString([], {hour: '2-digit', minute: '2-digit'})}
                          </span>
                          <span className="uppercase font-bold text-slate-650">
                            Por: {evt.author} ({evt.role})
                          </span>
                        </div>
                        <p className="text-slate-800 font-bold mt-0.5">{evt.txt}</p>
                        {evt.details && (
                          <p className="text-slate-600 font-sans italic bg-slate-50 border-l border-slate-350 pl-2 py-0.5 mt-0.5 whitespace-pre-wrap">
                            "{evt.details}"
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                );
              })()}
            </div>
          </div>

          {/* Section 6: Assinaturas e Rodapé Homologatório */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-[10px] text-center">
            <div className="space-y-1">
              <p className="text-slate-400">____________________________________________________________</p>
              <p className="font-bold text-slate-700 text-[9px]">Analista / Gestor de Garantia da Qualidade</p>
              <p className="text-[8px] text-slate-500 font-mono">Assinatura do Responsável Técnico do Setor (SGQ)</p>
            </div>
            <div className="space-y-1">
              <p className="text-slate-400">____________________________________________________________</p>
              <p className="font-bold text-slate-700 text-[9px]">Direção Administrativa / SAC Central</p>
              <p className="text-[8px] text-slate-500 font-mono">Homologação de Recebimento e Baixa de Faturamento</p>
            </div>
            <div className="col-span-2 text-center pt-4 text-[8px] text-slate-400 font-mono italic">
              Este laudo impresso é de propriedade exclusiva e confidencial, certificado de acordo com a norma regulamentadora ISO 9001.
              QualiSAC Inteligência SAC e Operações industriais da Qualidade Ltda.
            </div>
          </div>

        </div>
      )}

      {/* -------------------- PRINT VIEWPORT: RETURN SHIPPING LABEL (RÓTULO DE DEVOLUÇÃO) -------------------- */}
      {printType === 'label' && (
        <div className="hidden print:block text-slate-950 bg-white font-sans text-xs p-8 max-w-xl mx-auto border-4 border-double border-slate-800 rounded-lg space-y-6">
          <div className="text-center pb-3 border-b-2 border-slate-800">
            <h1 className="text-sm font-black tracking-wider uppercase">RÓTULO DE LOGÍSTICA REVERSA</h1>
            <p className="text-[9px] text-slate-500 tracking-tight">QualiSAC Co. Setor de Devoluções e Reclamações</p>
          </div>

          <div className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-400 bg-slate-50 rounded">
            {/* Mock Barcode */}
            <div className="font-mono text-xl tracking-widest font-thin text-slate-900 select-none">
              ||| | ||||| | |||| | ||| |||| | || || | || ||||
            </div>
            <p className="font-mono text-xs font-black tracking-widest text-slate-800 mt-1 uppercase">
              *DEVOLUCAO-{ticket.id}*
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="border border-slate-300 p-3 rounded">
              <h3 className="font-black text-[9px] uppercase tracking-wider text-slate-500 mb-1">Remetente (Cliente original)</h3>
              <p className="font-bold text-slate-850 text-xs">{ticket.clientName}</p>
              <div className="text-[10px] text-slate-600 mt-1 space-y-0.5">
                <p><span className="font-bold">ID SAC:</span> {ticket.id}</p>
                <p><span className="font-bold">Nota Fiscal:</span> {ticket.invoiceNumber || 'Não informada'}</p>
                <p><span className="font-bold">Lote:</span> {ticket.batch || 'Não Informado'}</p>
                {ticket.reseller && <p><span className="font-bold">Revenda:</span> {ticket.reseller}</p>}
                {ticket.consumer && <p><span className="font-bold">Consumidor:</span> {ticket.consumer}</p>}
                {ticket.shippingValue !== undefined && <p><span className="font-bold">Frete:</span> R$ {ticket.shippingValue.toFixed(2)}</p>}
                {ticket.requestedReversePac && <p><span className="font-bold">PAC Reverso:</span> {ticket.requestedReversePac}</p>}
                {ticket.registeredUf && <p><span className="font-bold">UF:</span> {ticket.registeredUf}</p>}
                {ticket.items && ticket.items.length > 0 ? (
                  <div className="mt-1 pt-1 border-t border-slate-100 space-y-0.5">
                    <span className="font-bold text-[9px] text-slate-500 uppercase tracking-wider block">Itens Devolvidos ({ticket.items.length}):</span>
                    {ticket.items.map((it, idx) => (
                      <p key={it.id || idx} className="text-[9px] text-slate-700 font-mono">
                        • {it.productCode} ({it.quantity} un)
                      </p>
                    ))}
                  </div>
                ) : (
                  <p><span className="font-bold">Item:</span> {ticket.productCode} - {ticket.productName.substring(0, 30)}</p>
                )}
              </div>
            </div>

            <div className="border border-slate-300 p-3 rounded bg-slate-50/50">
              <h3 className="font-black text-[9px] uppercase tracking-wider text-slate-500 mb-1">Destinatário (Triagem Qualidade)</h3>
              <p className="font-bold text-blue-900 text-xs">Docas de Recebimento de Divergências</p>
              <div className="text-[10px] text-slate-650 mt-1 space-y-0.5">
                <p>QualiSAC Industrial - Setor de Reclame Técnico</p>
                <p>Estação de Descarregamento de Lote e Segregação</p>
                <p><span className="font-bold">Cód. RNC:</span> {ticket.id}</p>
              </div>
            </div>
          </div>

          <div className="border border-slate-800 p-3 rounded bg-slate-100 text-[10px] text-slate-800 text-center font-bold">
            ⚠️ ATENÇÃO OPERADOR LOGÍSTICO: MATERIAL EM TRATATIVA DE QUALIDADE ISO 9001. 
            FAVOR TRANSPORTAR COM CUIDADO E ENCAMINHAR DIRETAMENTE PARA O LABORATÓRIO DE QUALIDADE ASSIM QUE ADENTRAR O PÁTIO.
          </div>

          <p className="text-[9px] text-slate-400 text-center font-mono">
            Este rótulo é emitido automaticamente por Qualisac & de acordo com as especificações contratuais vigentes.
          </p>
        </div>
      )}

      {/* -------------------- MAIN INTERACTIVE WORKSPACE VIEWPORT - HIDDEN ON PRINT -------------------- */}
      <div className="space-y-6 print:hidden">
      
      {/* Back button and critical status workflow header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <button
            id="back-list-btn"
            onClick={onBack}
            className="p-2 bg-white hover:bg-slate-150 text-slate-700 rounded-lg border border-slate-250 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                Código: {ticket.id}
              </span>
              <span className="text-slate-400">&bull;</span>
              <span className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                Criado em {new Date(ticket.createdAt).toLocaleDateString()}
              </span>
            </div>
            <h1 className="text-xl font-extrabold text-slate-900 mt-1">
              {ticket.clientName} &nbsp;|&nbsp; <span className="text-blue-600 font-medium">{ticket.productName}</span>
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Change Status Controls wrapper - Available to Admin and Quality staff */}
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-200 w-max max-w-full">
            <span className="text-xs font-bold text-slate-500 px-2">Fluxo de Status:</span>
            <div className="flex flex-wrap gap-1">
              {(['Aberto', 'Em analise', 'Em tratativa', 'Resolvido', 'Finalizado'] as TicketStatus[]).map((st) => {
                const isCurrent = ticket.status === st;
                
                let btnClass = "text-xs px-2.5 py-1.5 rounded-lg font-semibold transition-all cursor-pointer ";
                if (isCurrent) {
                  if (st === 'Aberto') btnClass += "bg-amber-500 text-white shadow-xs shadow-amber-500/20";
                  else if (st === 'Em analise') btnClass += "bg-rose-500 text-white shadow-xs shadow-rose-500/20";
                  else if (st === 'Em tratativa') btnClass += "bg-indigo-500 text-white shadow-xs shadow-indigo-500/20";
                  else if (st === 'Resolvido') btnClass += "bg-emerald-500 text-white shadow-xs shadow-emerald-500/20";
                  else btnClass += "bg-slate-700 text-white";
                } else {
                  btnClass += "hover:bg-slate-200 text-slate-600";
                }

                return (
                  <button
                    id={`status-to-${st}`}
                    key={st}
                    disabled={!isQualidadeOrAdmin && st !== ticket.status}
                    onClick={() => onUpdateStatus(ticket.id, st)}
                    title={!isQualidadeOrAdmin ? "Apenas perfis de Qualidade ou Administração podem mudar status" : `Alterar status para: ${st}`}
                    className={`${btnClass} ${!isQualidadeOrAdmin && 'opacity-60 cursor-not-allowed'}`}
                  >
                    {st === 'Em analise' ? 'Em análise' : st}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Delete Action button (Admin Only) */}
          {isConfirmingDelete ? (
            <div className="flex items-center gap-2 bg-rose-50 p-2 rounded-xl border border-rose-200 animate-in fade-in duration-200">
              <span className="text-xs font-bold text-rose-800 hidden sm:inline">Excluir permanentemente este chamado?</span>
              <button
                onClick={() => {
                  onDeleteTicket(ticket.id);
                  setIsConfirmingDelete(false);
                }}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer uppercase flex items-center gap-1"
                title="Confirmar exclusão definitiva"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Sim, Apagar</span>
              </button>
              <button
                onClick={() => setIsConfirmingDelete(false)}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold text-xs rounded-lg transition-all shadow-xs cursor-pointer uppercase flex items-center gap-1"
                title="Cancelar exclusão"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>
            </div>
          ) : (
            <button
              id={`delete-ticket-btn`}
              onClick={() => {
                if (currentUser.role === 'ADMIN') {
                  setIsConfirmingDelete(true);
                } else {
                  alert('Apenas o perfil Administrador (ADMIN) possui permissão para apagar chamados do sistema.');
                }
              }}
              disabled={currentUser.role !== 'ADMIN'}
              title={currentUser.role === 'ADMIN' ? 'Apagar este chamado permanentemente' : 'Apenas o administrador do sistema pode apagar chamados'}
              className={`px-3 py-2 text-xs font-bold rounded-xl border flex items-center gap-1.5 transition-all select-none cursor-pointer h-[46px] sm:h-auto ${
                currentUser.role === 'ADMIN'
                  ? 'bg-red-50 text-red-600 border-red-200 hover:bg-red-600 hover:text-white hover:border-red-600 shadow-sm shadow-red-500/10'
                  : 'bg-slate-100 text-slate-400 border-slate-200 opacity-60 cursor-not-allowed'
              }`}
            >
              <Trash2 className="w-4 h-4" />
              <span>Apagar Chamado</span>
            </button>
          )}
        </div>
      </div>

      {/* Main 2-Column workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: SAC Input / Ticket sheet details */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 card-shadow overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
                <FileText className="w-4.5 h-4.5 text-slate-500" />
                <span>Dados de Registro (SAC)</span>
              </h3>
              <div className="flex items-center gap-2">
                <button
                  id="print-ticket-report-btn"
                  onClick={handlePrintTicketReport}
                  className="text-xs text-white bg-blue-600 hover:bg-blue-700 font-bold inline-flex items-center gap-1.5 py-1.5 px-3 rounded-lg shadow-sm transition-all hover:scale-[1.02] cursor-pointer"
                  title="Gerar versão impressa estilizada para conformidade ISO"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Exportar Ticket</span>
                </button>
                <button
                  id="print-label-btn"
                  onClick={handlePrintLabel}
                  className="text-xs text-slate-700 hover:text-slate-900 font-semibold inline-flex items-center gap-1 bg-white border border-slate-250 py-1.5 px-2.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                  title="Imprimir rótulo de embalagem para processo de logística reversa"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Rótulo</span>
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Cód. Produto</label>
                  <p className="font-mono text-sm font-bold text-slate-800 mt-0.5">{ticket.productCode}</p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Lote (Rastreável)</label>
                  <p className="font-mono text-sm font-bold text-slate-800 mt-0.5">{ticket.batch || 'Não informado'}</p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Tipo de Ocorrência</label>
                  <p className="text-sm font-semibold mt-0.5 text-rose-700 bg-rose-50 border border-rose-100 rounded px-2 py-0.5 w-max">
                    {ticket.issueType}{ticket.subCategory ? ` - ${ticket.subCategory}` : ''}
                  </p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Faturamento (Qtd Devolvida)</label>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">{ticket.quantity} unidades</p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Data do 1º Contato</label>
                  <p className="text-sm font-bold text-slate-800 mt-0.5">
                    {ticket.firstContactDate ? new Date(ticket.firstContactDate + 'T12:00:00').toLocaleDateString('pt-BR') : 'Não informada'}
                  </p>
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase">Número da Nota Fiscal</label>
                  <p className="font-mono text-sm font-bold text-slate-800 mt-0.5">
                    {ticket.invoiceNumber || 'Não informada'}
                  </p>
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Cliente Emitente</label>
                <div className="bg-slate-50 p-2.5 rounded-lg border border-slate-150 text-slate-700 text-xs font-semibold mt-0.5">
                  {ticket.clientName}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-400 uppercase">Descrição Histórica do Reclame</label>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3.5 rounded-xl border border-slate-150 mt-1 whitespace-pre-wrap">
                  {ticket.description}
                </p>
              </div>

              {/* Defects breakdown list */}
              {ticket.defects && ticket.defects.length > 0 && (
                <div className="pt-3 border-t border-slate-100">
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Detalhamento de Peças e Defeitos</label>
                  <div className="space-y-1.5 bg-slate-50/50 p-3 rounded-xl border border-slate-150">
                    {ticket.defects.map((def, idx) => (
                      <div key={def.id || idx} className="flex items-center justify-between text-xs py-1.5 px-2 bg-white border border-slate-100 rounded-lg shadow-2xs">
                        <span className="text-slate-600 font-medium">{def.description}</span>
                        <span className="font-mono font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md text-[10px] shrink-0">
                          {def.quantity} peças / unidades
                        </span>
                      </div>
                    ))}
                    <div className="text-[10px] text-right font-bold text-slate-500 pt-1">
                      Volume total detalhado: <strong className="text-slate-800 font-extrabold">{ticket.defects.reduce((sum, d) => sum + d.quantity, 0)}</strong> un
                    </div>
                  </div>
                </div>
              )}

              {/* Created by */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
                <span className="flex items-center gap-1">
                  <UserIcon className="w-3.5 h-3.5" />
                  Registrado por: <strong>{ticket.userName}</strong>
                </span>
                <span>ID SAC: {ticket.userId}</span>
              </div>
            </div>
          </div>

          {/* Attachments panel */}
          <div className="bg-white rounded-xl border border-slate-100 card-shadow overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">Anexos e Provas ({ticket.files.length})</h3>
              <p className="text-xs text-slate-400">PNG, JPG, PDF</p>
            </div>

            <div className="p-5 space-y-4">
              {/* Drag and drop file upload region for testability */}
              <div
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 text-center transition-all relative ${
                  dragActive ? 'border-blue-500 bg-blue-50/30' : 'border-slate-200 hover:border-slate-350 bg-slate-50/30'
                }`}
              >
                <input
                  id="file-element-input"
                  type="file"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-slate-700">Arraste fotos de comprovação de avaria aqui</p>
                <p className="text-[10px] text-slate-400 mt-1">Ou clique para escolher arquivos do seu computador</p>
              </div>

              {/* List of files */}
              {ticket.files.length > 0 ? (
                <div className="space-y-2 mt-2">
                  {ticket.files.map((file) => (
                    <div key={file.id} className="p-2.5 rounded-lg border border-slate-150 flex items-center justify-between gap-3 bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-2 min-w-0">
                        {file.type.startsWith('image/') ? (
                          <img
                            src={file.url}
                            alt="Preview"
                            className="w-10 h-10 object-cover rounded border border-slate-200"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-10 h-10 bg-red-100 rounded flex items-center justify-center text-red-600 font-bold text-xs">
                            PDF
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-slate-700 truncate">{file.name}</p>
                          <p className="text-[10px] text-slate-400">{file.size} &bull; {file.type.split('/')[1] || 'Outro'}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1.5">
                        {file.url !== '#' && (
                          <a
                            href={file.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold"
                          >
                            Abrir
                          </a>
                        )}
                        <span className="p-1.5 bg-slate-50 rounded text-slate-400 cursor-not-allowed text-xs">
                          Salvo
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 text-center py-2">Sem anexos anexados a este chamado de devolução.</p>
              )}
            </div>
          </div>

          {/* CARDS FOR REMINDERS (Tarefas Secundárias & Lembretes) */}
          <div className="bg-white rounded-xl border border-slate-100 card-shadow overflow-hidden">
            <div className="p-4 bg-slate-50/70 border-b border-slate-200 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.55">
                <ListTodo className="w-4.5 h-4.5 text-indigo-700 shrink-0" />
                <span>Lembretes &amp; Tarefas Operacionais</span>
              </h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-150 px-2 py-0.5 rounded-full font-bold">
                {(ticket.reminders?.filter((r) => r.completed).length || 0)}/{(ticket.reminders?.length || 0)} Concluídos
              </span>
            </div>

            <div className="p-4 space-y-4">
              {/* Form to add reminder */}
              <form onSubmit={handleAddReminder} className="p-3 bg-slate-50 border border-slate-150 rounded-xl space-y-3">
                <div className="text-[11px] font-black uppercase text-slate-550 tracking-wider">
                  Adicionar tarefa secundária
                </div>
                <div>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Contatar cliente ou testar amostra..."
                    value={reminderText}
                    onChange={(e) => setReminderText(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-250 rounded-lg text-xs placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 bg-white text-slate-800"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-550 font-bold mb-1 uppercase">Prazo Limite</label>
                    <input
                      type="date"
                      value={reminderDueDate}
                      onChange={(e) => setReminderDueDate(e.target.value)}
                      className="w-full px-2 py-1 border border-slate-250 rounded-lg text-xs bg-white text-slate-700 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-slate-550 font-bold mb-1 uppercase">Prioridade</label>
                    <select
                      value={reminderPriority}
                      onChange={(e) => setReminderPriority(e.target.value as any)}
                      className="w-full px-2 py-1 border border-slate-250 rounded-lg text-xs bg-white text-slate-700 focus:outline-none"
                    >
                      <option value="Baixa">🟢 Baixa</option>
                      <option value="Média">🟡 Média</option>
                      <option value="Alta">🔴 Alta</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  className="w-full py-1.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Incluir na Lista</span>
                </button>
              </form>

              {/* List of existing reminders */}
              {ticket.reminders && ticket.reminders.length > 0 ? (
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {ticket.reminders.map((reminder) => {
                    const isOverdue = !reminder.completed && new Date(reminder.dueDate + 'T23:59:59').getTime() < Date.now();
                    const priorityColor =
                      reminder.priority === 'Alta'
                        ? 'bg-rose-50 text-rose-700 border-rose-100'
                        : reminder.priority === 'Média'
                        ? 'bg-amber-50 text-amber-700 border-amber-100'
                        : 'bg-slate-50 text-slate-600 border-slate-150';

                    return (
                      <div
                        key={reminder.id}
                        className={`p-2.5 rounded-xl border flex items-start justify-between gap-3 transition-all ${
                          reminder.completed
                            ? 'bg-slate-50/70 border-slate-100 opacity-65'
                            : 'bg-white border-slate-250 shadow-2xs hover:border-slate-350'
                        }`}
                      >
                        <div className="flex items-start gap-2.5 min-w-0">
                          <input
                            type="checkbox"
                            checked={reminder.completed}
                            onChange={() => handleToggleReminder(reminder.id)}
                            className="mt-0.5 w-4 h-4 rounded text-indigo-600 border-slate-300 focus:ring-indigo-500 cursor-pointer shrink-0"
                            title="Marcar como concluído"
                          />
                          <div className="min-w-0">
                            <p
                              className={`text-xs font-semibold text-slate-700 break-words leading-tight ${
                                reminder.completed ? 'line-through text-slate-400' : ''
                              }`}
                            >
                              {reminder.text}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <span className={`text-[9px] font-bold uppercase px-1.5 py-0.5 rounded border ${priorityColor}`}>
                                {reminder.priority}
                              </span>
                              
                              <span className={`text-[10px] flex items-center gap-0.5 leading-none ${
                                isOverdue ? 'text-rose-600 font-extrabold' : 'text-slate-450'
                              }`}>
                                <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                <span>Até: {new Date(reminder.dueDate + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                                {isOverdue && <span className="text-[9px] uppercase tracking-wide ml-0.5 font-bold animate-pulse">(Atrasada)</span>}
                              </span>
                            </div>
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => handleRemoveReminder(reminder.id)}
                          className="text-slate-400 hover:text-red-600 p-1 rounded-md hover:bg-rose-50 transition-colors cursor-pointer shrink-0"
                          title="Excluir lembrete de tarefa"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 border border-dashed border-slate-200 rounded-xl">
                  <ListTodo className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                  <p className="text-xs text-slate-400">Nenhum lembrete salvo para este chamado.</p>
                  <p className="text-[10px] text-slate-400 mt-0.5">Use o formulário acima para adicionar tarefas.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Quality actions, 5 Whys analysis, or Interaction log */}
        <div className="xl:col-span-7 space-y-6">
          <div className="bg-white rounded-xl border border-slate-100 card-shadow overflow-hidden">
            {/* Tabs switcher header */}
            <div className="flex border-b border-slate-200 bg-slate-50/50">
              <button
                id="tab-qualidade-btn"
                onClick={() => setActiveTab('qualidade')}
                className={`flex-1 py-4 text-center font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'qualidade'
                    ? 'border-blue-600 text-blue-650 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                Análise de Causa Raiz & Plano de Ação
              </button>
              <button
                id="tab-interacoes-btn"
                onClick={() => setActiveTab('interacoes')}
                className={`flex-1 py-4 text-center font-bold text-xs uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === 'interacoes'
                    ? 'border-blue-600 text-blue-650 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100/50'
                }`}
              >
                Linha do Tempo & Histórico ({ticket.history.length + ticket.comments.length})
              </button>
            </div>

            {/* TAB CONTENT: Quality report */}
            {activeTab === 'qualidade' && (
              <div className="p-6">
                {/* AI Assist Tooltip Banner */}
                {canModifyQuality && (
                  <div className="bg-blue-50 border border-blue-150 rounded-xl p-4 mb-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <div className="flex gap-2.5 min-w-0">
                      <div className="p-2 bg-blue-100 rounded-lg text-blue-700 shrink-0">
                        <BrainCircuit className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-xs font-bold text-blue-900 uppercase">Assistente de Qualidade por IA</h4>
                        <p className="text-[11px] text-blue-700 leading-relaxed mt-0.5">
                          Usar inteligência artificial para formular uma causa raiz industrial provável (Análise 5 Porquês) para este chamado.
                        </p>
                      </div>
                    </div>
                    <button
                      id="ai-assist-btn"
                      type="button"
                      disabled={isAiLoading}
                      onClick={handleAIAssist}
                      className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-lg shadow-sm shadow-blue-500/20 inline-flex items-center gap-1.5 transition-all w-full md:w-auto shrink-0 cursor-pointer"
                    >
                      {isAiLoading ? (
                        <>
                          <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          <span>Analisando...</span>
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-3.5 h-3.5 text-yellow-300 animate-pulse" />
                          <span>Preencher com IA (Gemini)</span>
                        </>
                      )}
                    </button>
                  </div>
                )}

                <form onSubmit={handleSaveReport} className="space-y-6">
                  {/* Title Cause */}
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Causa Raiz da Não Conformidade</label>
                    <input
                      id="root-cause-input"
                      type="text"
                      disabled={!canModifyQuality}
                      placeholder="Ex: Falha no sensor térmico do reservatório de secagem..."
                      value={rootCause}
                      onChange={(e) => setRootCause(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                    />
                  </div>

                  {/* 5 Porquês (Sequence inputs) */}
                  <div>
                    <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
                      <label className="block text-xs font-bold text-slate-600 uppercase">Metodologia Industrial: 5 Porquês (Whys)</label>
                      <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 py-0.5 px-2 rounded-full">Análise Sistemática</span>
                    </div>

                    <div className="space-y-3">
                      {whys.map((why, index) => (
                        <div key={index} className="flex gap-2">
                          <span className="font-bold text-xs text-slate-400 w-8 py-2.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-center font-mono">
                            {index + 1}º
                          </span>
                          <input
                            id={`why-input-${index}`}
                            type="text"
                            disabled={!canModifyQuality}
                            value={why}
                            onChange={(e) => handleWhyChange(index, e.target.value)}
                            placeholder={`Por que ocorreu o ${index === 0 ? 'problema inicial' : 'passo ' + index}?`}
                            className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-400"
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions corrective and preventive */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Ação Corretiva Imediata</label>
                      <textarea
                        id="corrective-action-textarea"
                        disabled={!canModifyQuality}
                        rows={3}
                        placeholder="Quais ações foram postadas para conter a avaria imediata ou re-ensacar?"
                        value={correctiveAction}
                        onChange={(e) => setCorrectiveAction(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Ação Preventiva (Longo Prazo)</label>
                      <textarea
                        id="preventive-action-textarea"
                        disabled={!canModifyQuality}
                        rows={3}
                        placeholder="Como evitar que isso aconteça em outros lotes?"
                        value={preventiveAction}
                        onChange={(e) => setPreventiveAction(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  </div>

                  {/* Responsible and date target */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Responsável Técnico</label>
                      <input
                        id="responsible-input"
                        type="text"
                        disabled={!canModifyQuality}
                        placeholder="Ex: Engenheiro de Processamento"
                        value={responsible}
                        onChange={(e) => setResponsible(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-2">Data Limite de Resolução</label>
                      <input
                        id="target-date-input"
                        type="date"
                        disabled={!canModifyQuality}
                        value={targetDate}
                        onChange={(e) => setTargetDate(e.target.value)}
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-250 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50 disabled:text-slate-500"
                      />
                    </div>
                  </div>

                  {canModifyQuality ? (
                    <div className="space-y-2">
                      {isDraftAutosaved && (
                        <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5 font-bold animate-pulse">
                          <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                          Rascunho recuperado / salvo automaticamente no navegador
                        </div>
                      )}
                      <button
                        id="save-report-btn"
                        type="submit"
                        className="w-full py-2.5 font-bold text-xs text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg text-center transition-all shadow-sm uppercase cursor-pointer"
                      >
                        Salvar Relatório de Não Conformidade
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-center text-xs text-slate-500">
                      🔒 {ticket.status === 'Finalizado' 
                        ? 'O chamado está Finalizado. Registros não podem mais ser modificados.' 
                        : 'Apenas operadores com perfil de Qualidade ou Admin podem preencher este relatório.'
                      }
                    </div>
                  )}
                </form>
              </div>
            )}

            {/* TAB CONTENT: Comments and interactions audit logs */}
            {activeTab === 'interacoes' && (
              <div className="p-6 space-y-6">
                
                {/* 1. Audit Log History List */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <History className="w-4 h-4" />
                    <span>Log de Auditoria Completo (Sustentado)</span>
                  </h4>
                  
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
                    {ticket.history.map((hist) => (
                      <div key={hist.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-150 text-xs text-slate-700">
                        <div className="flex justify-between items-start">
                          <div>
                            <strong className="text-slate-800">{hist.action}</strong>
                            {hist.details && <span className="text-slate-500 block text-[11px] mt-0.5">{hist.details}</span>}
                          </div>
                          <span className="text-[10px] text-slate-400 shrink-0 select-none">
                            {new Date(hist.timestamp).toLocaleDateString()} {new Date(hist.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                          <UserIcon className="w-3 h-3 text-slate-400" />
                          <span>Por: <strong>{hist.userName}</strong> ({hist.userRole.toLowerCase() === 'comum' ? 'comum' : hist.userRole})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 2. Team Instant Messaging Comments */}
                <div>
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                    <MessageSquare className="w-4 h-4" />
                    <span>Chat de Tratativa Inter-Setorial ({ticket.comments.length})</span>
                  </h4>

                  {/* Comments loop */}
                  <div className="space-y-3 max-h-52 overflow-y-auto mb-4 pr-2">
                    {ticket.comments.length > 0 ? (
                      ticket.comments.map((comm) => (
                        <div key={comm.id} className="p-3 rounded-xl border border-slate-100 flex flex-col space-y-1 text-xs">
                          <div className="flex justify-between items-center bg-slate-50/75 p-1 rounded px-2">
                            <span className="font-bold text-slate-800 flex items-center gap-1">
                              {comm.userName}
                              <span className="text-[9px] bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded font-semibold tracking-wider">
                                {comm.userRole}
                              </span>
                            </span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(comm.createdAt).toLocaleDateString()} {new Date(comm.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <p className="text-slate-600 pl-1.5 pt-1 text-xs leading-relaxed">{comm.text}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 text-center py-4">Nenhuma mensagem postada no chat deste chamado.</p>
                    )}
                  </div>

                  {/* Add action message comment form */}
                  <div className="space-y-1">
                    <form onSubmit={handleCommentSubmit} className="flex gap-2">
                      <input
                        id="comment-input"
                        type="text"
                        placeholder="Deixe uma mensagem ou observação..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="flex-1 px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <button
                        id="submit-comment-btn"
                        type="submit"
                        className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs rounded-lg uppercase cursor-pointer"
                      >
                        Enviar
                      </button>
                    </form>
                    {newComment.trim() && (
                      <span className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 pl-1.5 animate-pulse">
                        <span className="w-1 h-1 bg-indigo-500 rounded-full"></span>
                        Digitando... Rascunho salvo no navegador
                      </span>
                    )}
                  </div>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </div>
    </>
  );
};
