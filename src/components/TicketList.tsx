import React, { useState } from 'react';
import { Ticket, IssueType, TicketStatus } from '../types';
import { 
  Search, 
  Filter, 
  Download, 
  Printer, 
  Plus, 
  Eye, 
  Tag, 
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText
} from 'lucide-react';

interface TicketListProps {
  tickets: Ticket[];
  onSelectTicket: (ticketId: string) => void;
  onOpenNewTicketModal: () => void;
  canCreateTicket: boolean;
}

export const TicketList: React.FC<TicketListProps> = ({
  tickets,
  onSelectTicket,
  onOpenNewTicketModal,
  canCreateTicket,
}) => {
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  // Filter application
  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.productCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.productName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.batch.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
    const matchesType = typeFilter === 'all' || ticket.issueType === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  // Export to CSV simulation
  const handleExportCSV = () => {
    if (filteredTickets.length === 0) {
      alert('Nenhum resultado filtrado para exportar.');
      return;
    }

    const headers = 'ID,Data Abertura,Cliente,Codigo Produto,Nome Produto,Lote,Tipo Problema,Quantidade,Status,Causa Raiz\n';
    const rows = filteredTickets.map((t) => {
      const rootCauseText = t.qualityReport?.rootCause 
        ? `"${t.qualityReport.rootCause.replace(/"/g, '""')}"` 
        : 'N/A';
        
      return `${t.id},"${new Date(t.createdAt).toLocaleDateString()}","${t.clientName.replace(/"/g, '""')}","${t.productCode}","${t.productName.replace(/"/g, '""')}","${t.batch}","${t.issueType}",${t.quantity},"${t.status}",${rootCauseText}`;
    }).join('\n');

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + encodeURIComponent(headers + rows);
    const link = document.createElement('a');
    link.href = csvContent;
    link.setAttribute('download', 'relatorio_chamados_quali_sac.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Simulating print view
  const handlePrint = () => {
    window.print();
  };

  // Badge rendering helper
  const getStatusBadge = (status: TicketStatus) => {
    switch (status) {
      case 'Aberto':
        return (
          <span className="status-badge status-aberto">
            <span className="w-1.5 h-1.5 bg-red-600 rounded-full animate-pulse mr-1" />
            Aberto
          </span>
        );
      case 'Em analise':
        return (
          <span className="status-badge status-analise">
            <span className="w-1.5 h-1.5 bg-orange-500 rounded-full mr-1" />
            Em análise
          </span>
        );
      case 'Em tratativa':
        return (
          <span className="status-badge status-tratativa">
            <span className="w-1.5 h-1.5 bg-yellow-600 rounded-full mr-1" />
            Em Tratativa
          </span>
        );
      case 'Resolvido':
        return (
          <span className="status-badge status-resolvido">
            <span className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1" />
            Resolvido
          </span>
        );
      case 'Finalizado':
        return (
          <span className="status-badge bg-slate-100 text-slate-700 border border-slate-300">
            <span className="w-1.5 h-1.5 bg-slate-500 rounded-full mr-1" />
            Finalizado
          </span>
        );
    }
  };

  // Color bar styling matching GLPI
  const getIssueColorLeftBorder = (issueType: IssueType) => {
    switch (issueType) {
      case 'Defeito':
        return 'border-l-4 border-l-rose-500';
      case 'Avaria':
        return 'border-l-4 border-l-amber-500';
      case 'Troca':
        return 'border-l-4 border-l-sky-500';
      case 'Erro de Logística':
        return 'border-l-4 border-l-violet-500';
      default:
        return 'border-l-4 border-l-slate-400';
    }
  };

  return (
    <div id="ticket-list-wrapper" className="bg-white rounded-xl card-shadow border border-slate-100 overflow-hidden flex flex-col">
      
      {/* 1. Header Toolbar */}
      <div className="px-6 py-4 border-b border-slate-100 bg-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-slate-500" />
            <span>Painel de Chamados ({filteredTickets.length})</span>
          </h2>
          <p className="text-xs text-slate-500">Filtragem avançada de devoluções e não conformidades</p>
        </div>

        {/* Action Button Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {canCreateTicket && (
            <button
              id="new-ticket-btn"
              onClick={onOpenNewTicketModal}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Chamado (SAC)</span>
            </button>
          )}

          <button
            id="export-csv-btn"
            onClick={handleExportCSV}
            title="Exportar dados filtrados para Excel"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-250 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Exportar Excel</span>
          </button>

          <button
            id="print-btn"
            onClick={handlePrint}
            title="Imprimir visualização simplificada"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold bg-white hover:bg-slate-50 text-slate-700 rounded-lg border border-slate-250 transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-slate-500" />
            <span className="hidden md:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* 2. Direct Filter Bar */}
      <div className="p-4 border-b border-slate-100 flex flex-col md:flex-row gap-3">
        {/* Input Search */}
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            id="ticket-search-input"
            type="text"
            placeholder="Pesquisar por Código, Lote, Cliente, ID ou Nome..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-slate-250 rounded-lg text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>

        {/* Status Dropdown */}
        <div className="w-full md:w-48">
          <select
            id="status-filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">🔍 Status: Todos</option>
            <option value="Aberto">🟠 Aberto</option>
            <option value="Em analise">🔴 Em análise</option>
            <option value="Em tratativa">🔵 Em tratativa</option>
            <option value="Resolvido">🟢 Resolvido</option>
            <option value="Finalizado">⚫ Finalizado</option>
          </select>
        </div>

        {/* Type Dropdown */}
        <div className="w-full md:w-52">
          <select
            id="type-filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full px-3 py-2 border border-slate-250 rounded-lg text-sm bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">🏷️ Problema: Todos</option>
            <option value="Avaria">📦 Avaria</option>
            <option value="Defeito">⚙️ Defeito de Fábrica</option>
            <option value="Troca">🔄 Troca</option>
            <option value="Erro de Logística">🚒 Erro de Logística</option>
            <option value="Outro">💬 Outro</option>
          </select>
        </div>
      </div>

      {/* 3. Ticket Table */}
      <div className="overflow-x-auto">
        {filteredTickets.length > 0 ? (
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
              <tr>
                <th className="px-6 py-3 border-b border-slate-150 font-mono w-24">ID</th>
                <th className="px-6 py-3 border-b border-slate-150">Cliente / Fornecedor</th>
                <th className="px-6 py-3 border-b border-slate-150">Produto</th>
                <th className="px-6 py-3 border-b border-slate-150">Lote / Qtd</th>
                <th className="px-6 py-3 border-b border-slate-150">Tipo</th>
                <th className="px-6 py-3 border-b border-slate-150">Status</th>
                <th className="px-6 py-3 border-b border-slate-150 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-150 text-slate-650">
              {filteredTickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  onClick={() => onSelectTicket(ticket.id)}
                  className={`table-row border-b border-slate-100 transition-colors cursor-pointer text-sm ${getIssueColorLeftBorder(ticket.issueType)}`}
                >
                  <td className="px-6 py-4 font-mono font-bold text-slate-900 group-hover:text-blue-600">
                    {ticket.id}
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-800">{ticket.clientName}</div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Calendar className="w-3 h-3" />
                      <span>Aberto em: {new Date(ticket.createdAt).toLocaleDateString()} {new Date(ticket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-800">{ticket.productName}</div>
                    <div className="text-[11px] text-slate-500 font-mono">Cód: {ticket.productCode}</div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-mono bg-slate-100 hover:bg-slate-200 text-slate-700 px-2.5 py-0.5 rounded text-xs">
                      {ticket.batch}
                    </span>
                    <div className="text-xs text-slate-600 mt-1">
                      <strong>{ticket.quantity}</strong> pçs/unidades
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-0.5">
                      <span className="text-xs font-medium text-slate-700 flex items-center gap-1 bg-slate-50 border border-slate-200 py-1 px-2 rounded-lg w-max shadow-2xs">
                        <Tag className="w-3 h-3 text-slate-400" />
                        <span>{ticket.issueType}</span>
                      </span>
                      {ticket.subCategory && (
                        <span className="text-[10px] text-indigo-600 pl-1 font-bold">
                          ↳ {ticket.subCategory}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getStatusBadge(ticket.status)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <button
                      id={`view-${ticket.id}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTicket(ticket.id);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg border border-slate-200 hover:border-blue-200 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Tratar</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="p-12 text-center text-slate-500">
            <AlertCircle className="w-12 h-12 text-slate-350 mx-auto mb-3" />
            <p className="font-semibold text-slate-700">Nenhum chamado encontrado</p>
            <p className="text-xs text-slate-400 mt-1">Tente ajustar seus termos de busca ou mudar os filtros de status e problema.</p>
          </div>
        )}
      </div>

      {/* 4. Table Footer Pagination/Stat matching GLPI */}
      <div className="p-3.5 border-t border-slate-200 bg-slate-55/40 text-xs text-slate-500 flex items-center justify-between">
        <p>Exibindo {filteredTickets.length} de {tickets.length} chamados do cliente corporativo.</p>
        <div className="flex gap-1">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" title="Defeito de canais do lote" />
          <span className="text-slate-400">Defeitos</span>
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block ml-2" title="Avaria em tráfego" />
          <span className="text-slate-400">Avarias</span>
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 inline-block ml-2" title="Troca de mercadorias" />
          <span className="text-slate-400">Trocas</span>
        </div>
      </div>
    </div>
  );
};
