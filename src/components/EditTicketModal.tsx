import React, { useState, useEffect } from 'react';
import { Ticket, Product, IssueTypeCategory, TicketItem, TicketDefect, User } from '../types';
import { 
  X, 
  Edit3, 
  User as UserIcon, 
  Building2, 
  Calendar, 
  Package, 
  Plus, 
  Trash2, 
  Truck, 
  FileText, 
  Layers, 
  AlertTriangle,
  Lock,
  CheckCircle2,
  Save,
  Users,
  Mail
} from 'lucide-react';

const PRODUCT_LINES = [
  'Simon 19',
  'Simon 20',
  'Simon 24',
  'Simon 30',
  'Simon 35',
  'Simon Connect',
  'Novara',
  'Ágata',
  'Granito',
  'Outra Linha'
];

const BRAZILIAN_UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

interface EditTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  ticket: Ticket;
  currentUser: User;
  products: Product[];
  issueTypes: IssueTypeCategory[];
  onSave: (updatedTicket: Ticket) => void;
}

export const EditTicketModal: React.FC<EditTicketModalProps> = ({
  isOpen,
  onClose,
  ticket,
  currentUser,
  products,
  issueTypes,
  onSave,
}) => {
  // Permissões de edição:
  // - ADMIN pode mexer no chamado todo em qualquer status.
  // - SAC pode editar enquanto o status NÃO for 'Em tratativa', 'Resolvido' ou 'Finalizado'.
  //   Em 'Em tratativa', apenas Qualidade/Admin podem mexer e somente na causa raiz/ações.
  const isAdmin = currentUser.role === 'ADMIN';
  const isSAC = currentUser.role === 'SAC';
  const isBlockedByTratativa = ticket.status === 'Em tratativa';
  const canEdit = isAdmin || (isSAC && !isBlockedByTratativa && ticket.status !== 'Finalizado');

  // 1. Dados do Cliente
  const [customerName, setCustomerName] = useState(ticket.customerName || ticket.clientName || '');
  const [resellerName, setResellerName] = useState(ticket.resellerName || ticket.reseller || '');
  const [firstContactDate, setFirstContactDate] = useState(ticket.firstContactDate || '');
  const [clientEmail, setClientEmail] = useState(ticket.clientEmail || '');
  const [invoiceNumber, setInvoiceNumber] = useState(ticket.invoiceNumber || '');

  // 2. Itens / Produtos Devolvidos
  const [items, setItems] = useState<TicketItem[]>(() => {
    if (ticket.items && ticket.items.length > 0) {
      return JSON.parse(JSON.stringify(ticket.items));
    }
    return [
      {
        id: `item_init_${Date.now()}`,
        productCode: ticket.productCode || (products[0]?.code || ''),
        productName: ticket.productName || (products[0]?.name || ''),
        productLine: ticket.productLine || 'Simon 20',
        quantity: ticket.quantity || 1,
        defectCategory: ticket.issueType || (issueTypes[0]?.name || 'Defeito Elétrico'),
        defectSubcategory: ticket.subCategory || (issueTypes[0]?.subcategories[0] || 'Mau contato elétrico'),
        invoiceNumber: ticket.invoiceNumber || '',
        notes: ticket.notes || ''
      }
    ];
  });

  // Campos para novo item sendo adicionado
  const [newProductCode, setNewProductCode] = useState(products[0]?.code || '');
  const [newProductName, setNewProductName] = useState(products[0]?.name || '');
  const [newProductLine, setNewProductLine] = useState(products[0]?.line || 'Simon 20');
  const [newCustomLine, setNewCustomLine] = useState('');
  const [newQuantity, setNewQuantity] = useState<number>(1);
  const [newBatch, setNewBatch] = useState('');
  const [newInvoiceNumber, setNewInvoiceNumber] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newCategory, setNewCategory] = useState<string>(issueTypes[0]?.name || 'Defeito Elétrico');
  const [newSubcategory, setNewSubcategory] = useState<string>(issueTypes[0]?.subcategories[0] || 'Mau contato elétrico');

  // 3. Logística
  const [freightCost, setFreightCost] = useState<string>(
    ticket.freightCost !== undefined ? String(ticket.freightCost) : (ticket.shippingValue !== undefined ? String(ticket.shippingValue) : '')
  );
  const [pacReversoRequested, setPacReversoRequested] = useState<'Sim' | 'Não'>(
    (ticket.pacReversoRequested === 'Sim' || ticket.requestedReversePac === 'Sim') ? 'Sim' : 'Não'
  );
  const [pacReversoCode, setPacReversoCode] = useState(ticket.pacReversoCode || '');
  const [returnUF, setReturnUF] = useState(ticket.returnUF || ticket.registeredUf || 'SP');

  // 4. Observações / Relato geral
  const [description, setDescription] = useState(ticket.description || ticket.notes || '');

  // 5. Observadores / E-mails
  const [observerEmail, setObserverEmail] = useState(ticket.observerEmail || '');
  const [observers, setObservers] = useState<string[]>(ticket.observers || ['qualidade@dicompel.com.br']);
  const [observerInput, setObserverInput] = useState('');

  // Sincroniza ao abrir ou mudar ticket
  useEffect(() => {
    if (isOpen && ticket) {
      setCustomerName(ticket.customerName || ticket.clientName || '');
      setResellerName(ticket.resellerName || ticket.reseller || '');
      setFirstContactDate(ticket.firstContactDate || '');
      setClientEmail(ticket.clientEmail || '');
      setInvoiceNumber(ticket.invoiceNumber || '');

      if (ticket.items && ticket.items.length > 0) {
        setItems(JSON.parse(JSON.stringify(ticket.items)));
      } else {
        setItems([
          {
            id: `item_init_${Date.now()}`,
            productCode: ticket.productCode || (products[0]?.code || ''),
            productName: ticket.productName || (products[0]?.name || ''),
            productLine: ticket.productLine || 'Simon 20',
            quantity: ticket.quantity || 1,
            defectCategory: ticket.issueType || (issueTypes[0]?.name || 'Defeito Elétrico'),
            defectSubcategory: ticket.subCategory || (issueTypes[0]?.subcategories[0] || 'Mau contato elétrico'),
            invoiceNumber: ticket.invoiceNumber || '',
            notes: ticket.notes || ''
          }
        ]);
      }

      const p0 = products[0];
      setNewProductCode(p0?.code || '');
      setNewProductName(p0?.name || '');
      setNewProductLine(p0?.line || 'Simon 20');
      setNewCustomLine('');
      setNewQuantity(1);
      setNewBatch(ticket.batch || '');
      setNewInvoiceNumber(ticket.invoiceNumber || '');
      setNewNotes('');

      const c0 = issueTypes[0];
      setNewCategory(c0?.name || 'Defeito Elétrico');
      setNewSubcategory(c0?.subcategories[0] || '');

      setFreightCost(
        ticket.freightCost !== undefined ? String(ticket.freightCost) : (ticket.shippingValue !== undefined ? String(ticket.shippingValue) : '')
      );
      setPacReversoRequested(
        (ticket.pacReversoRequested === 'Sim' || ticket.requestedReversePac === 'Sim') ? 'Sim' : 'Não'
      );
      setPacReversoCode(ticket.pacReversoCode || '');
      setReturnUF(ticket.returnUF || ticket.registeredUf || 'SP');
      setDescription(ticket.description || ticket.notes || '');
      setObserverEmail(ticket.observerEmail || '');
      setObservers(ticket.observers || ['qualidade@dicompel.com.br']);
      setObserverInput('');
    }
  }, [isOpen, ticket, products, issueTypes]);

  if (!isOpen) return null;

  // Seleção de produto para adicionar
  const handleSelectProduct = (code: string) => {
    if (code === 'CUSTOM') {
      setNewProductCode('');
      setNewProductName('');
      setNewProductLine('Simon 20');
    } else {
      const found = products.find((p) => p.code === code);
      if (found) {
        setNewProductCode(found.code);
        setNewProductName(found.name);
        if (found.line) setNewProductLine(found.line);
      }
    }
  };

  const handleCategoryChange = (categoryName: string) => {
    setNewCategory(categoryName);
    const cat = issueTypes.find((c) => c.name === categoryName);
    if (cat && cat.subcategories.length > 0) {
      setNewSubcategory(cat.subcategories[0]);
    } else {
      setNewSubcategory('');
    }
  };

  // Adicionar produto à lista do chamado
  const handleAddItem = () => {
    if (!newProductCode.trim()) {
      alert('Por favor, informe o Código do Produto.');
      return;
    }
    if (!newProductName.trim()) {
      alert('Por favor, informe a Descrição do Produto.');
      return;
    }
    if (newQuantity <= 0) {
      alert('A quantidade deve ser de pelo menos 1 unidade.');
      return;
    }

    const effectiveLine = newProductLine === 'Outra Linha' ? (newCustomLine.trim() || 'Outra Linha') : newProductLine;

    const newItem: TicketItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productCode: newProductCode.trim().toUpperCase(),
      productName: newProductName.trim(),
      productLine: effectiveLine,
      quantity: newQuantity,
      defectCategory: newCategory,
      defectSubcategory: newSubcategory,
      notes: newNotes.trim() || undefined,
      invoiceNumber: newInvoiceNumber.trim() || invoiceNumber.trim() || undefined,
    };

    setItems((prev) => [...prev, newItem]);

    // Reseta inputs
    setNewProductCode('');
    setNewProductName('');
    setNewQuantity(1);
    setNewNotes('');
  };

  // Remover produto da lista do chamado
  const handleRemoveItem = (id: string) => {
    if (items.length <= 1) {
      alert('O chamado precisa conter pelo menos um produto devolvido.');
      return;
    }
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  // Atualizar quantidade de um item direto na lista
  const handleUpdateItemQty = (id: string, qty: number) => {
    if (qty <= 0) return;
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, quantity: qty } : it)));
  };

  // Observadores
  const handleAddObserver = () => {
    const raw = observerInput.trim().toLowerCase();
    if (!raw || !raw.includes('@')) return;
    if (!observers.includes(raw)) {
      setObservers((prev) => [...prev, raw]);
    }
    setObserverInput('');
  };

  const handleRemoveObserver = (emailToRemove: string) => {
    setObservers((prev) => prev.filter((o) => o !== emailToRemove));
  };

  // Salvar alterações
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!canEdit) {
      alert('Você não tem permissão para alterar este chamado neste status.');
      return;
    }

    if (!customerName.trim()) {
      alert('O nome do cliente/consumidor é obrigatório.');
      return;
    }

    if (items.length === 0) {
      alert('O chamado deve conter pelo menos um produto devolvido.');
      return;
    }

    const totalQty = items.reduce((acc, curr) => acc + curr.quantity, 0);
    const mainCode = items[0].productCode;
    const mainName = items.length === 1 ? items[0].productName : `${items.length} produtos devolvidos (${items.map(i => i.productCode).join(', ')})`;
    const mainLine = items[0].productLine || 'Simon 20';
    const mainCategory = items[0].defectCategory || ticket.issueType;
    const mainSubcategory = items[0].defectSubcategory || ticket.subCategory;

    const parsedFreight = freightCost.trim() ? parseFloat(freightCost.replace(',', '.')) : undefined;

    const defectsList: TicketDefect[] = items.map((item, idx) => ({
      id: `def_${Date.now()}_${idx}`,
      description: `${item.productCode}: ${item.defectCategory || 'Defeito'} - ${item.defectSubcategory || 'Não especificado'}${item.notes ? ` (${item.notes})` : ''}`,
      quantity: item.quantity,
      category: item.defectCategory,
      subcategory: item.defectSubcategory,
    }));

    const now = new Date().toISOString();
    const historyEntry = {
      id: `hist_${Date.now()}`,
      ticketId: ticket.id,
      action: `Chamado editado por ${currentUser.name} (${currentUser.role})`,
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      details: `Dados do cliente e produtos atualizados. Total de itens: ${items.length} SKUs (${totalQty} unidades).`,
      timestamp: now,
    };

    const updatedTicket: Ticket = {
      ...ticket,
      customerName: customerName.trim(),
      clientName: customerName.trim(),
      consumer: customerName.trim(),
      resellerName: resellerName.trim() || undefined,
      reseller: resellerName.trim() || undefined,
      firstContactDate: firstContactDate || ticket.firstContactDate,
      clientEmail: clientEmail.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      items: items,
      productCode: mainCode,
      productName: mainName,
      productLine: mainLine,
      quantity: totalQty,
      issueType: mainCategory,
      subCategory: mainSubcategory,
      defects: defectsList,
      description: description.trim() || ticket.description,
      notes: description.trim() || ticket.notes,
      freightCost: parsedFreight,
      shippingValue: parsedFreight,
      pacReversoRequested: pacReversoRequested,
      requestedReversePac: pacReversoRequested,
      pacReversoCode: pacReversoCode.trim() || undefined,
      returnUF: returnUF,
      registeredUf: returnUF,
      observerEmail: observerEmail.trim() || undefined,
      observers: observers,
      updatedAt: now,
      history: [...(ticket.history || []), historyEntry],
    };

    onSave(updatedTicket);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/75 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-250 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-150 my-auto">
        
        {/* Header Modal */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/30 border border-blue-400/30 rounded-xl text-blue-300">
              <Edit3 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-black text-blue-300 bg-blue-900/60 px-2 py-0.5 rounded border border-blue-700/50">
                  {ticket.id}
                </span>
                <span className="text-[11px] text-slate-300">
                  Status: <strong>{ticket.status}</strong>
                </span>
              </div>
              <h2 className="text-base font-extrabold text-white mt-0.5">
                Editar Chamado &bull; Dados do Cliente e Produtos
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
            title="Fechar janela de edição"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Banner de restrição de permissão se bloqueado */}
        {!canEdit && (
          <div className="px-6 py-3 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-center gap-2.5">
            <Lock className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>Edição Bloqueada para o perfil SAC:</strong> O chamado está no status{' '}
              <strong className="uppercase">"{ticket.status}"</strong>. Durante a tratativa, apenas a equipe de{' '}
              <strong>Qualidade</strong> ou <strong>Administradores</strong> podem mexer no laudo técnico e ações corretivas.
            </span>
          </div>
        )}

        {/* Formulário com rolagem interna */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">

          {/* 1. SEÇÃO: DADOS DO CLIENTE */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4.5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2">
                <UserIcon className="w-4 h-4 text-blue-600" />
                <span>1. Dados do Cliente & Contato</span>
              </h3>
              <span className="text-[10px] text-slate-500 font-semibold">Obrigatórios para rastreio SAC</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome do Consumidor Final <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  disabled={!canEdit}
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Nome completo do consumidor final"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nome da Revenda / Loja <span className="text-[10px] text-slate-400 font-normal">(Opcional)</span>
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={resellerName}
                  onChange={(e) => setResellerName(e.target.value)}
                  placeholder="Ex: Comercial Elétrica Silva Ltda"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  E-mail do Cliente / Consumidor
                </label>
                <input
                  type="email"
                  disabled={!canEdit}
                  value={clientEmail}
                  onChange={(e) => setClientEmail(e.target.value)}
                  placeholder="cliente@exemplo.com.br"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Número da Nota Fiscal (NF)
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Ex: NF-12345"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-mono focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Data do 1º Contato
                </label>
                <input
                  type="date"
                  disabled={!canEdit}
                  value={firstContactDate}
                  onChange={(e) => setFirstContactDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>
            </div>
          </div>

          {/* 2. SEÇÃO: PRODUTOS DEVOLVIDOS (INCLUIR / TIRAR) */}
          <div className="bg-white border-2 border-blue-200 rounded-xl p-4.5 space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
              <div className="flex items-center gap-2">
                <Package className="w-4.5 h-4.5 text-blue-600" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  2. Produtos Devolvidos ({items.length} SKU{items.length > 1 ? 's' : ''})
                </h3>
              </div>
              <span className="text-[11px] font-bold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-full border border-blue-200">
                Volume Total: {items.reduce((s, i) => s + i.quantity, 0)} un
              </span>
            </div>

            {/* Tabela de produtos atuais no chamado com botões de remover e ajustar quantidade */}
            <div className="space-y-2">
              <label className="block text-[11px] font-bold text-slate-600 uppercase">
                Itens Atualmente Vinculados ao Chamado:
              </label>

              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-200">
                {items.map((item, index) => (
                  <div key={item.id || index} className="p-3 bg-slate-50 hover:bg-white transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono font-black text-slate-900 bg-white px-2 py-0.5 rounded border border-slate-300">
                          {item.productCode}
                        </span>
                        <span className="font-bold text-slate-800">{item.productName}</span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-200">
                          {item.productLine || 'Simon 20'}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                        <span>Defeito: <strong>{item.defectCategory || 'Defeito'}</strong> &gt; {item.defectSubcategory || 'Geral'}</span>
                        {item.invoiceNumber && <span className="font-mono text-slate-400">| NF: {item.invoiceNumber}</span>}
                        {item.notes && <span className="italic text-slate-500">| Obs: {item.notes}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 self-end sm:self-center">
                      <div className="flex items-center gap-1.5 bg-white border border-slate-300 rounded-lg p-1">
                        <label className="text-[10px] font-bold text-slate-400 uppercase px-1">Qtd:</label>
                        <input
                          type="number"
                          min={1}
                          disabled={!canEdit}
                          value={item.quantity}
                          onChange={(e) => handleUpdateItemQty(item.id, parseInt(e.target.value, 10) || 1)}
                          className="w-14 px-1.5 py-0.5 font-bold font-mono text-center text-xs text-blue-700 bg-slate-50 rounded border border-slate-200 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-500 pr-1">un</span>
                      </div>

                      {canEdit && (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(item.id)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg border border-transparent hover:border-red-200 transition-all cursor-pointer"
                          title="Tirar este produto do chamado"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Painel para Incluir Mais Produtos ao Chamado */}
            {canEdit && (
              <div className="bg-blue-50/50 border border-blue-200 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5 text-blue-600" />
                    <span>Incluir Novo Produto neste Chamado</span>
                  </span>
                  <span className="text-[10px] text-blue-700">Selecione da base ou digite manualmente</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 text-xs">
                  {/* Seletor de produto cadastrado */}
                  <div className="sm:col-span-5">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Catálogo Dicompel
                    </label>
                    <select
                      onChange={(e) => handleSelectProduct(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="">-- Selecione do catálogo ou digite abaixo --</option>
                      {products.map((p) => (
                        <option key={p.code} value={p.code}>
                          {p.code} - {p.name} [{p.line || 'Simon'}]
                        </option>
                      ))}
                      <option value="CUSTOM">+ Outro Produto Manual</option>
                    </select>
                  </div>

                  {/* Código SKU */}
                  <div className="sm:col-span-3">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Cód. Produto (SKU)
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: SIM-19011"
                      value={newProductCode}
                      onChange={(e) => setNewProductCode(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-mono uppercase text-slate-800 focus:outline-none"
                    />
                  </div>

                  {/* Linha do Produto */}
                  <div className="sm:col-span-4">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Linha
                    </label>
                    <select
                      value={newProductLine}
                      onChange={(e) => setNewProductLine(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none"
                    >
                      {PRODUCT_LINES.map((line) => (
                        <option key={line} value={line}>{line}</option>
                      ))}
                    </select>
                  </div>

                  {newProductLine === 'Outra Linha' && (
                    <div className="sm:col-span-12">
                      <input
                        type="text"
                        placeholder="Especifique a linha do produto..."
                        value={newCustomLine}
                        onChange={(e) => setNewCustomLine(e.target.value)}
                        className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none"
                      />
                    </div>
                  )}

                  {/* Descrição do Produto */}
                  <div className="sm:col-span-7">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Descrição do Produto
                    </label>
                    <input
                      type="text"
                      placeholder="Ex: Interruptor Simples 10A Simon 19 Branco"
                      value={newProductName}
                      onChange={(e) => setNewProductName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none"
                    />
                  </div>

                  {/* Quantidade */}
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Qtd (un)
                    </label>
                    <input
                      type="number"
                      min={1}
                      value={newQuantity}
                      onChange={(e) => setNewQuantity(parseInt(e.target.value, 10) || 1)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold font-mono text-center text-slate-800 focus:outline-none"
                    />
                  </div>

                  {/* Botão Adicionar Item */}
                  <div className="sm:col-span-3 flex items-end">
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Incluir Produto</span>
                    </button>
                  </div>

                  {/* Categoria Pai e Subcategoria de Defeito para este item */}
                  <div className="sm:col-span-6">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Categoria do Defeito (Pai)
                    </label>
                    <select
                      value={newCategory}
                      onChange={(e) => handleCategoryChange(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none"
                    >
                      {issueTypes.map((cat) => (
                        <option key={cat.id || cat.name} value={cat.name}>{cat.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="sm:col-span-6">
                    <label className="block text-[10px] font-bold text-slate-600 uppercase mb-1">
                      Subcategoria do Defeito (Filho)
                    </label>
                    <select
                      value={newSubcategory}
                      onChange={(e) => setNewSubcategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none"
                    >
                      {(issueTypes.find(c => c.name === newCategory)?.subcategories || []).map((sub) => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 3. SEÇÃO: LOGÍSTICA & DEVOLUÇÃO */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4.5 space-y-4">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-2 border-b border-slate-200 pb-2">
              <Truck className="w-4 h-4 text-indigo-600" />
              <span>3. Logística de Devolução & Frete</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Valor de Frete (R$)
                </label>
                <input
                  type="text"
                  disabled={!canEdit}
                  placeholder="0,00"
                  value={freightCost}
                  onChange={(e) => setFreightCost(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  PAC Reverso Solicitado?
                </label>
                <select
                  disabled={!canEdit}
                  value={pacReversoRequested}
                  onChange={(e) => setPacReversoRequested(e.target.value as 'Sim' | 'Não')}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="Não">Não</option>
                  <option value="Sim">Sim</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  UF da Devolução
                </label>
                <select
                  disabled={!canEdit}
                  value={returnUF}
                  onChange={(e) => setReturnUF(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                >
                  {BRAZILIAN_UFS.map((uf) => (
                    <option key={uf} value={uf}>{uf}</option>
                  ))}
                </select>
              </div>

              {pacReversoRequested === 'Sim' && (
                <div className="sm:col-span-3">
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Código de Autorização / Rastreio PAC Reverso
                  </label>
                  <input
                    type="text"
                    disabled={!canEdit}
                    placeholder="Ex: QB123456789BR"
                    value={pacReversoCode}
                    onChange={(e) => setPacReversoCode(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-mono uppercase text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500"
                  />
                </div>
              )}
            </div>
          </div>

          {/* 4. SEÇÃO: RELATO & OBSERVAÇÃO DO SAC */}
          <div className="bg-slate-50/80 border border-slate-200 rounded-xl p-4.5 space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase">
              Relato da Ocorrência & Observações (SAC)
            </label>
            <textarea
              rows={3}
              disabled={!canEdit}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva detalhadamente a reclamação do consumidor, lote fabril, avarias e apontamentos..."
              className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100 disabled:text-slate-500 leading-relaxed"
            />
          </div>

        </form>

        {/* Footer com botões de ação */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="text-xs text-slate-500 font-medium">
            {canEdit ? (
              <span>Todas as modificações atualizarão o banco de dados oficial (Azure SQL).</span>
            ) : (
              <span className="text-amber-700 font-bold">Modo somente visualização devido ao status 'Em tratativa'.</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            {canEdit && (
              <button
                type="button"
                onClick={handleSubmit}
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 flex items-center gap-1.5 transition-all cursor-pointer hover:scale-[1.01]"
              >
                <Save className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
