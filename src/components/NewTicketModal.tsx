import React, { useState, useEffect } from 'react';
import { TicketDefect, Product, IssueTypeCategory, TicketItem } from '../types';
import { 
  X, 
  ClipboardList, 
  Info, 
  Plus, 
  Trash2, 
  User, 
  Building2, 
  Calendar, 
  Package, 
  Truck, 
  FileText, 
  AlertTriangle,
  Layers,
  MapPin,
  DollarSign,
  CheckCircle2
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

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    customerName: string;
    resellerName?: string;
    firstContactDate: string;
    clientName: string;
    productCode: string;
    productName: string;
    productLine: string;
    quantity: number;
    batch?: string;
    invoiceNumber?: string;
    notes?: string;
    description: string;
    issueType: string;
    subCategory: string;
    defects?: TicketDefect[];
    items?: TicketItem[];
    freightCost?: number;
    shippingValue?: number;
    pacReversoRequested: string;
    requestedReversePac?: string;
    pacReversoCode?: string;
    returnUF: string;
    registeredUf?: string;
    reseller?: string;
    consumer?: string;
  }) => void;
  products: Product[];
  issueTypes: IssueTypeCategory[];
  isSpecial?: boolean;
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  products,
  issueTypes,
}) => {
  const todayStr = new Date().toISOString().split('T')[0];

  // 1. Informações do Cliente
  const [resellerName, setResellerName] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [firstContactDate, setFirstContactDate] = useState(todayStr);

  // 2. Produto Devolvido Atual
  const [productCode, setProductCode] = useState(products[0]?.code || '');
  const [productName, setProductName] = useState(products[0]?.name || '');
  const [productLine, setProductLine] = useState(products[0]?.line || 'Simon 20');
  const [customLine, setCustomLine] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [batch, setBatch] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [description, setDescription] = useState('');

  // Defeito (Categoria Pai e Subcategoria)
  const [selectedCategory, setSelectedCategory] = useState<string>(issueTypes[0]?.name || 'Defeito Elétrico');
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>(
    issueTypes[0]?.subcategories[0] || 'Mau contato elétrico'
  );

  // Lista de Múltiplos Produtos Devolvidos (se houver mais de um)
  const [returnedItems, setReturnedItems] = useState<TicketItem[]>([]);

  // 3. Informações Logísticas / Devolução
  const [freightCost, setFreightCost] = useState('');
  const [pacReversoRequested, setPacReversoRequested] = useState<'Sim' | 'Não'>('Não');
  const [pacReversoCode, setPacReversoCode] = useState('');
  const [returnUF, setReturnUF] = useState('SP');

  // Sincronização inicial ao abrir
  useEffect(() => {
    if (isOpen) {
      setResellerName('');
      setCustomerName('');
      setFirstContactDate(new Date().toISOString().split('T')[0]);

      const firstProd = products[0];
      setProductCode(firstProd?.code || '');
      setProductName(firstProd?.name || '');
      setProductLine(firstProd?.line || 'Simon 20');
      setCustomLine('');
      setQuantity(1);
      setBatch('');
      setInvoiceNumber('');
      setNotes('');
      setDescription('');

      const firstCat = issueTypes[0];
      setSelectedCategory(firstCat?.name || 'Defeito Elétrico');
      setSelectedSubcategory(firstCat?.subcategories[0] || '');

      setReturnedItems([]);
      setFreightCost('');
      setPacReversoRequested('Não');
      setPacReversoCode('');
      setReturnUF('SP');
    }
  }, [isOpen, products, issueTypes]);

  if (!isOpen) return null;

  // Ao mudar de produto pré-cadastrado
  const handleProductSelect = (code: string) => {
    if (code === 'CUSTOM') {
      setProductCode('');
      setProductName('');
      setProductLine('Simon 20');
    } else {
      const found = products.find((p) => p.code === code);
      if (found) {
        setProductCode(found.code);
        setProductName(found.name);
        if (found.line) {
          setProductLine(found.line);
        }
      }
    }
  };

  // Ao mudar Categoria Pai
  const handleCategoryChange = (categoryName: string) => {
    setSelectedCategory(categoryName);
    const cat = issueTypes.find((c) => c.name === categoryName);
    if (cat && cat.subcategories.length > 0) {
      setSelectedSubcategory(cat.subcategories[0]);
    } else {
      setSelectedSubcategory('');
    }
  };

  // Adicionar item à lista de produtos devolvidos
  const handleAddReturnedItem = () => {
    if (!productCode.trim()) {
      alert('Por favor, informe o Código do Produto.');
      return;
    }
    if (!productName.trim()) {
      alert('Por favor, informe a Descrição do Produto.');
      return;
    }
    if (quantity <= 0) {
      alert('A quantidade devolvida deve ser maior que zero.');
      return;
    }

    const effectiveLine = productLine === 'Outra Linha' ? (customLine.trim() || 'Outra Linha') : productLine;

    const newItem: TicketItem = {
      id: `item_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      productCode: productCode.trim().toUpperCase(),
      productName: productName.trim(),
      productLine: effectiveLine,
      quantity,
      defectCategory: selectedCategory,
      defectSubcategory: selectedSubcategory,
      notes: notes.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
    };

    setReturnedItems((prev) => [...prev, newItem]);

    // Limpar campos de produto para permitir adicionar o próximo
    setProductCode('');
    setProductName('');
    setQuantity(1);
    setNotes('');
  };

  const handleRemoveReturnedItem = (id: string) => {
    setReturnedItems((prev) => prev.filter((item) => item.id !== id));
  };

  // Envio do formulário
  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim()) {
      alert('O Nome do Consumidor Final é obrigatório.');
      return;
    }

    // Se nenhum item foi adicionado à lista via botão "+ Adicionar", valida os campos atuais do produto
    let finalItems: TicketItem[] = [...returnedItems];
    const effectiveLine = productLine === 'Outra Linha' ? (customLine.trim() || 'Outra Linha') : productLine;

    if (finalItems.length === 0) {
      if (!productCode.trim() || !productName.trim()) {
        alert('Por favor, preencha o Código e a Descrição do produto devolvido.');
        return;
      }
      if (quantity <= 0) {
        alert('A quantidade devolvida deve ser de pelo menos 1 unidade.');
        return;
      }
      finalItems = [
        {
          id: `item_${Date.now()}`,
          productCode: productCode.trim().toUpperCase(),
          productName: productName.trim(),
          productLine: effectiveLine,
          quantity: quantity,
          defectCategory: selectedCategory,
          defectSubcategory: selectedSubcategory,
          notes: notes.trim() || undefined,
          invoiceNumber: invoiceNumber.trim() || undefined,
        }
      ];
    }

    const totalQty = finalItems.reduce((acc, curr) => acc + curr.quantity, 0);
    const mainCode = finalItems.length === 1 ? finalItems[0].productCode : `${finalItems[0].productCode} +${finalItems.length - 1}`;
    const mainName = finalItems.length === 1 ? finalItems[0].productName : `${finalItems.length} produtos devolvidos (${finalItems.map(i => i.productCode).join(', ')})`;
    const mainLine = finalItems.length === 1 ? (finalItems[0].productLine || 'Simon 20') : (finalItems[0].productLine || 'Múltiplas Linhas');

    const mainCategory = finalItems[0].defectCategory || selectedCategory;
    const mainSubcategory = finalItems[0].defectSubcategory || selectedSubcategory;

    const parsedFreight = freightCost.trim() ? parseFloat(freightCost.replace(',', '.')) : undefined;

    // Constrói descrição detalhada se o campo estiver vazio
    let fullDescription = description.trim();
    if (!fullDescription) {
      const itemsDesc = finalItems.map(i => 
        `• [${i.productLine}] ${i.productCode} - ${i.productName} (Qtd: ${i.quantity} un) | Defeito: ${i.defectCategory} > ${i.defectSubcategory}${i.notes ? ` (Obs: ${i.notes})` : ''}`
      ).join('\n');
      fullDescription = `Abertura de chamado SAC para o consumidor ${customerName.trim()}.${resellerName.trim() ? ` Revenda: ${resellerName.trim()}.` : ''}\nItens Devolvidos:\n${itemsDesc}`;
    }

    const defectsList: TicketDefect[] = finalItems.map((item, idx) => ({
      id: `def_${Date.now()}_${idx}`,
      description: `${item.productCode}: ${item.defectCategory || 'Defeito'} - ${item.defectSubcategory || 'Não especificado'}${item.notes ? ` (${item.notes})` : ''}`,
      quantity: item.quantity,
      category: item.defectCategory,
      subcategory: item.defectSubcategory,
    }));

    onSubmit({
      // 1. Cliente
      customerName: customerName.trim(),
      resellerName: resellerName.trim() || undefined,
      firstContactDate: firstContactDate || todayStr,
      clientName: customerName.trim(), // compatibilidade
      reseller: resellerName.trim() || undefined, // compatibilidade
      consumer: customerName.trim(), // compatibilidade

      // 2. Produto Principal
      productCode: mainCode,
      productName: mainName,
      productLine: mainLine,
      quantity: totalQty,
      batch: batch.trim() || undefined,
      invoiceNumber: invoiceNumber.trim() || undefined,
      notes: notes.trim() || undefined,
      description: fullDescription,

      // Defeito
      issueType: mainCategory,
      subCategory: mainSubcategory,
      defects: defectsList,

      // Lista de Itens
      items: finalItems,

      // 3. Logística
      freightCost: parsedFreight,
      shippingValue: parsedFreight, // compatibilidade
      pacReversoRequested: pacReversoRequested,
      requestedReversePac: pacReversoRequested, // compatibilidade
      pacReversoCode: pacReversoRequested === 'Sim' ? (pacReversoCode.trim() || undefined) : undefined,
      returnUF: returnUF,
      registeredUf: returnUF, // compatibilidade
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-150 w-full max-w-4xl my-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ClipboardList className="w-5 h-5 text-blue-300" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm sm:text-base tracking-wide uppercase">
                  Abertura de Chamado SAC
                </span>
                <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-blue-500/20 text-blue-200 border border-blue-400/30 font-mono">
                  SIMON DICOMPEL
                </span>
              </div>
              <span className="text-[11px] text-slate-300">
                Registro de Devolução e Não Conformidade com Diretrizes ISO 9001
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-white/10 text-slate-300 hover:text-white rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmitForm} className="p-6 space-y-6 max-h-[82vh] overflow-y-auto text-slate-700">
          
          {/* ========================================================
              SEÇÃO 1: INFORMAÇÕES DO CLIENTE
             ======================================================== */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <User className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                1. Informações do Cliente
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              {/* Nome da Revenda (não obrigatória) */}
              <div className="md:col-span-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600 uppercase flex items-center gap-1">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" />
                    <span>Nome da Revenda</span>
                  </label>
                  <span className="text-[9.5px] text-slate-400 font-medium bg-slate-200/60 px-1.5 py-0.2 rounded">
                    Não obrigatória
                  </span>
                </div>
                <input
                  id="modal-reseller-input"
                  type="text"
                  placeholder="Ex: Eletro Distribuidora Sul, Ferragens Norte..."
                  value={resellerName}
                  onChange={(e) => setResellerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              {/* Nome do Consumidor final (obrigatório) */}
              <div className="md:col-span-5">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-800 uppercase flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-blue-600" />
                    <span>Nome do Consumidor Final</span>
                    <span className="text-rose-500 font-bold">*</span>
                  </label>
                  <span className="text-[9.5px] text-rose-600 font-bold bg-rose-50 border border-rose-100 px-1.5 py-0.2 rounded">
                    Obrigatório
                  </span>
                </div>
                <input
                  id="modal-customer-input"
                  type="text"
                  required
                  placeholder="Ex: Carlos Eduardo Mendes / Construtora Alvorada..."
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              {/* Data do Primeiro contato */}
              <div className="md:col-span-3">
                <label className="text-[11px] font-bold text-slate-800 uppercase flex items-center gap-1 mb-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Data 1º Contato</span>
                  <span className="text-rose-500 font-bold">*</span>
                </label>
                <input
                  id="modal-first-contact-date"
                  type="date"
                  required
                  value={firstContactDate}
                  onChange={(e) => setFirstContactDate(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>
            </div>
          </div>

          {/* ========================================================
              SEÇÃO 2: DESCRIÇÃO DOS PRODUTOS DEVOLVIDOS
             ======================================================== */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-blue-600" />
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                  2. Descrição dos Produtos Devolvidos
                </h3>
              </div>
              <span className="text-[10px] text-slate-500">
                Preencha os campos abaixo ou adicione múltiplos itens
              </span>
            </div>

            {/* Seletor rápido de produto cadastrado no catálogo Simon Dicompel */}
            <div className="bg-blue-50/50 border border-blue-150 rounded-lg p-3">
              <label className="block text-[10px] font-bold text-blue-800 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                <span>Preenchimento Rápido com Catálogo Simon Dicompel</span>
              </label>
              <select
                id="modal-quick-product-select"
                value={products.some(p => p.code === productCode && p.name === productName) ? productCode : 'CUSTOM'}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full px-3 py-1.5 border border-blue-200 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="CUSTOM">✏️ Digitar produto manualmente...</option>
                {products.map((p) => (
                  <option key={p.code} value={p.code}>
                    {p.code} - {p.name} {p.line ? `[Linha: ${p.line}]` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Linha 1 do Produto: Código, Descrição, Linha do Produto, Qtd */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              {/* Código do Produto */}
              <div className="md:col-span-3">
                <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1 mb-1">
                  <span>Código do Produto</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  id="modal-product-code"
                  type="text"
                  placeholder="Ex: SIM-20101"
                  value={productCode}
                  onChange={(e) => setProductCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-800 font-mono font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              {/* Descrição do Produto */}
              <div className="md:col-span-4">
                <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1 mb-1">
                  <span>Descrição do Produto</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  id="modal-product-desc"
                  type="text"
                  placeholder="Ex: Módulo Interruptor Paralelo 10A Simon 20"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              {/* Linha do Produto que está sendo devolvida */}
              <div className="md:col-span-3">
                <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1 mb-1">
                  <Layers className="w-3.5 h-3.5 text-blue-600" />
                  <span>Linha do Produto</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  id="modal-product-line-select"
                  value={productLine}
                  onChange={(e) => setProductLine(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                >
                  {PRODUCT_LINES.map((line) => (
                    <option key={line} value={line}>
                      {line}
                    </option>
                  ))}
                </select>
                {productLine === 'Outra Linha' && (
                  <input
                    type="text"
                    placeholder="Especifique a linha..."
                    value={customLine}
                    onChange={(e) => setCustomLine(e.target.value)}
                    className="w-full mt-1 px-2.5 py-1.5 border border-slate-250 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                )}
              </div>

              {/* Quantidade Devolvida */}
              <div className="md:col-span-2">
                <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1 mb-1">
                  <span>Qtd Devolvida</span>
                  <span className="text-rose-500">*</span>
                </label>
                <input
                  id="modal-product-quantity"
                  type="number"
                  min="1"
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Linha 2 do Produto: Categoria PAI, SUB Categoria e Número da Nota Fiscal */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              {/* Defeito: Categoria PAI */}
              <div className="md:col-span-4">
                <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1 mb-1">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                  <span>Defeito (Categoria PAI)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  id="modal-category-parent"
                  value={selectedCategory}
                  onChange={(e) => handleCategoryChange(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                >
                  {issueTypes.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      📁 {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Defeito: SUB Categoria */}
              <div className="md:col-span-4">
                <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1 mb-1">
                  <span>Defeito (SUB Categoria)</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  id="modal-category-sub"
                  value={selectedSubcategory}
                  onChange={(e) => setSelectedSubcategory(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                >
                  {issueTypes
                    .find((cat) => cat.name === selectedCategory)
                    ?.subcategories.map((sub) => (
                      <option key={sub} value={sub}>
                        🔹 {sub}
                      </option>
                    )) || <option value="">Sem subcategorias</option>}
                </select>
              </div>

              {/* Número da Nota Fiscal */}
              <div className="md:col-span-4">
                <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1 mb-1">
                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                  <span>Número da Nota Fiscal</span>
                </label>
                <input
                  id="modal-invoice-input"
                  type="text"
                  placeholder="Ex: NF-e 049281 ou 12345"
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>
            </div>

            {/* Linha 3 do Produto: Observação do Produto + Botão de Adicionar à lista */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-end">
              <div className="md:col-span-9">
                <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                  Observação do Produto Devolvido
                </label>
                <input
                  id="modal-item-notes"
                  type="text"
                  placeholder="Ex: Borne travado no terminal positivo, espelho arranhado na quina..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                />
              </div>

              <div className="md:col-span-3">
                <button
                  type="button"
                  id="btn-add-returned-item"
                  onClick={handleAddReturnedItem}
                  className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
                  title="Incluir este produto na lista de devolução do chamado"
                >
                  <Plus className="w-4 h-4 text-emerald-400" />
                  <span>+ Adicionar Produto</span>
                </button>
              </div>
            </div>

            {/* Lista visual dos produtos já adicionados */}
            {returnedItems.length > 0 && (
              <div className="border border-slate-200 rounded-xl bg-white p-3 space-y-2 mt-2 shadow-2xs">
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-150">
                  <span className="font-extrabold text-slate-800 uppercase text-[10.5px] flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Produtos Adicionados para Devolução ({returnedItems.length} itens)</span>
                  </span>
                  <span className="text-[10.5px] font-black text-blue-700 font-mono bg-blue-50 px-2 py-0.5 rounded-full border border-blue-150">
                    Total: {returnedItems.reduce((acc, i) => acc + i.quantity, 0)} unidades
                  </span>
                </div>

                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {returnedItems.map((item, index) => (
                    <div
                      key={item.id || index}
                      className="p-2.5 rounded-lg border border-slate-150 bg-slate-50/70 hover:bg-slate-100/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs transition-colors"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono font-bold text-slate-800 bg-white border border-slate-200 px-2 py-0.5 rounded text-[11px]">
                            {item.productCode}
                          </span>
                          <span className="font-bold text-slate-800">{item.productName}</span>
                          <span className="px-2 py-0.5 rounded-full text-[9.5px] font-extrabold bg-indigo-50 text-indigo-700 border border-indigo-150">
                            Linha: {item.productLine || 'Simon 20'}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[10.5px] text-slate-500">
                          <span className="text-amber-700 font-medium">
                            Defeito: <strong>{item.defectCategory}</strong> &gt; {item.defectSubcategory}
                          </span>
                          {item.invoiceNumber && (
                            <span className="font-mono text-slate-600">
                              | NF: {item.invoiceNumber}
                            </span>
                          )}
                          {item.notes && (
                            <span className="italic text-slate-600 truncate max-w-xs">
                              | Obs: {item.notes}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2.5 shrink-0 self-end sm:self-center">
                        <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-150 px-2.5 py-1 rounded text-xs">
                          {item.quantity} un
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemoveReturnedItem(item.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer"
                          title="Remover produto da lista"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Relato geral / Observação ampliada da ocorrência */}
            <div className="pt-2">
              <label className="text-[11px] font-bold text-slate-700 uppercase block mb-1">
                Observação e Relato Completo da Ocorrência (SAC)
              </label>
              <textarea
                id="modal-general-description"
                rows={2}
                placeholder="Descreva detalhes fornecidos pelo cliente, condições do material recebido ou exigências de laudo..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
              />
            </div>
          </div>

          {/* ========================================================
              SEÇÃO 3: INFORMAÇÕES LOGÍSTICAS / DEVOLUÇÃO
             ======================================================== */}
          <div className="bg-slate-50/70 border border-slate-200 rounded-xl p-4.5 space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-slate-200">
              <Truck className="w-4 h-4 text-blue-600" />
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider">
                3. Informações Logísticas e Devolução
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5">
              {/* Valor de Frete (opcional) */}
              <div className="md:col-span-4">
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Valor de Frete</span>
                  </label>
                  <span className="text-[9.5px] text-slate-400 font-medium bg-slate-200/60 px-1.5 py-0.2 rounded">
                    Opcional
                  </span>
                </div>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400 font-bold text-xs">
                    R$
                  </span>
                  <input
                    id="modal-freight-input"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={freightCost}
                    onChange={(e) => setFreightCost(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                  />
                </div>
              </div>

              {/* Solicitado o PAC Reverso */}
              <div className="md:col-span-4">
                <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1 mb-1">
                  <Truck className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Solicitado o PAC Reverso</span>
                  <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setPacReversoRequested('Não')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      pacReversoRequested === 'Não'
                        ? 'bg-slate-800 text-white border-slate-800 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-250 hover:bg-slate-100'
                    }`}
                  >
                    Não
                  </button>
                  <button
                    type="button"
                    onClick={() => setPacReversoRequested('Sim')}
                    className={`flex-1 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                      pacReversoRequested === 'Sim'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-250 hover:bg-slate-100'
                    }`}
                  >
                    Sim
                  </button>
                </div>
              </div>

              {/* UF da Devolução */}
              <div className="md:col-span-4">
                <label className="text-[11px] font-bold text-slate-700 uppercase flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>UF da Devolução</span>
                  <span className="text-rose-500">*</span>
                </label>
                <select
                  id="modal-return-uf"
                  value={returnUF}
                  onChange={(e) => setReturnUF(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-800 font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs cursor-pointer"
                >
                  {BRAZILIAN_UFS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf} - Estado ({uf})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Campo condicional para código do PAC Reverso */}
            {pacReversoRequested === 'Sim' && (
              <div className="bg-blue-50/60 border border-blue-200 rounded-lg p-3 grid grid-cols-1 md:grid-cols-12 gap-3 items-center animate-in fade-in duration-150">
                <div className="md:col-span-8">
                  <label className="text-[10.5px] font-bold text-blue-900 uppercase block mb-0.5">
                    Código de Autorização / Rastreio PAC Reverso (Opcional)
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: PI123456789BR ou e-Ticket Correios nº 849204"
                    value={pacReversoCode}
                    onChange={(e) => setPacReversoCode(e.target.value)}
                    className="w-full px-3 py-1.5 border border-blue-250 rounded-lg text-xs bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="md:col-span-4 text-[10.5px] text-blue-800">
                  <span className="font-semibold">Logística Reversa Ativa:</span> Um ticket de postagem reversa será emitido em nome do consumidor.
                </div>
              </div>
            )}
          </div>

          {/* Banner explicativo */}
          <div className="bg-blue-50/80 p-3.5 rounded-xl border border-blue-150 flex gap-2.5 text-xs text-blue-900 leading-relaxed">
            <Info className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <p>
              O chamado de SAC será gerado e vinculado para acompanhamento técnico, laudo de conformidade ISO 9001 e eventual reposição de mercadoria para a revenda ou consumidor final.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex flex-col-reverse sm:flex-row justify-end gap-2.5 pt-4 border-t border-slate-200">
            <button
              id="close-modal-footer-btn"
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-xl border border-slate-300 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="submit-modal-btn"
              type="submit"
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Salvar Ocorrência SAC</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
