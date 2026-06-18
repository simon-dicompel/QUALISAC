import React, { useState } from 'react';
import { IssueType, TicketDefect, Product } from '../types';
import { X, ClipboardList, Info, HelpCircle, Plus, Trash2 } from 'lucide-react';

interface NewTicketModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: {
    productCode: string;
    productName: string;
    batch: string;
    clientName: string;
    issueType: any;
    quantity: number;
    description: string;
    defects?: TicketDefect[];
  }) => void;
  products: Product[];
  issueTypes: string[];
}

export const NewTicketModal: React.FC<NewTicketModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  products,
  issueTypes,
}) => {
  const [productCode, setProductCode] = useState(products[0]?.code || 'CUSTOM');
  const [customProductName, setCustomProductName] = useState(products[0]?.name || 'Leite Condensado Estrela 395g');
  const [batch, setBatch] = useState('');
  const [clientName, setClientName] = useState('');
  const [issueType, setIssueType] = useState<string>(issueTypes[0] || 'Defeito');
  const [quantity, setQuantity] = useState<number>(1);
  const [description, setDescription] = useState('');
  
  // Specific defects state
  const [defects, setDefects] = useState<TicketDefect[]>([]);
  const [newDefectDesc, setNewDefectDesc] = useState('');
  const [newDefectQty, setNewDefectQty] = useState<number>(5);

  if (!isOpen) return null;

  const handleProductSelect = (code: string) => {
    setProductCode(code);
    if (code === 'CUSTOM') {
      setCustomProductName('');
    } else {
      const found = products.find((p) => p.code === code);
      if (found) {
        setCustomProductName(found.name);
      }
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!batch.trim() || !clientName.trim() || !customProductName.trim() || !description.trim()) {
      alert('Por favor, preencha todos os campos obrigatórios do formulário.');
      return;
    }

    if (quantity <= 0) {
      alert('A quantidade deve ser de pelo menos 1 unidade.');
      return;
    }

    onSubmit({
      productCode: productCode === 'CUSTOM' ? 'PROD-CUSTOM' : productCode,
      productName: customProductName,
      batch,
      clientName,
      issueType,
      quantity,
      description,
      defects: defects.length > 0 ? defects : [
        { id: `def_${Date.now()}`, description: description.substring(0, 50), quantity }
      ],
    });

    // Reset Form
    setProductCode(products[0]?.code || 'CUSTOM');
    setCustomProductName(products[0]?.name || '');
    setBatch('');
    setClientName('');
    setIssueType(issueTypes[0] || 'Defeito');
    setQuantity(1);
    setDescription('');
    setDefects([]);
    setNewDefectDesc('');
    setNewDefectQty(5);
    
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl card-shadow border border-slate-100 w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="p-4.5 bg-slate-55 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800 text-sm uppercase tracking-wider">Abertura de Chamado (SAC - Qualidade)</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 text-slate-400 hover:text-slate-600 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmitForm} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          
          {/* Predefined product select & custom product name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Cód. SKU do Produto *</label>
              <select
                id="modal-product-select"
                value={productCode}
                onChange={(e) => handleProductSelect(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {products.map((p) => (
                  <option key={p.code} value={p.code}>
                    🏷️ {p.code} ({p.name.substring(0, 30)}...)
                  </option>
                ))}
                <option value="CUSTOM">🆕 Outro (Digitar personalizado)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Nome Descritivo do Produto *</label>
              <input
                id="modal-product-name-input"
                type="text"
                disabled={productCode !== 'CUSTOM'}
                placeholder="Ex: Embalagem Alumínio 5kg"
                value={customProductName}
                onChange={(e) => setCustomProductName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lote */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Lote de Identificação *</label>
              <input
                id="modal-batch-input"
                type="text"
                placeholder="Ex: L-141225B"
                value={batch}
                onChange={(e) => setBatch(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Client name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Cliente Solicitante *</label>
              <input
                id="modal-client-input"
                type="text"
                placeholder="Razão Social ou Nome Fantasia"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Issue type */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Tipo de Desvio *</label>
              <select
                id="modal-issue-type"
                value={issueType}
                onChange={(e) => setIssueType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {issueTypes.map((it) => (
                  <option key={it} value={it}>
                    ⚠️ {it}
                  </option>
                ))}
              </select>
            </div>

            {/* Quantity */}
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Quantidade Afetada (Peças/Unidades) *</label>
              <input
                id="modal-quantity"
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">Descrição e Relato Detalhado do Defeito *</label>
            <textarea
              id="modal-description"
              rows={3}
              placeholder="Descreva as reclamações do cliente, condições que as mercadorias chegaram e impactos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Detailed Defective Parts Breakdown */}
          <div className="border border-slate-200 rounded-lg p-3.5 bg-slate-50/50 space-y-3">
            <div>
              <span className="text-[11px] font-bold text-slate-700 uppercase tracking-widest block">Detalhamento de Peças com Defeito</span>
              <span className="text-[9px] text-slate-400">Informe a quantidade e o defeito individual (ex: Mau contato, Sem parafuso, Riscada)</span>
            </div>

            {/* Inline adding controls */}
            <div className="flex gap-2 items-end">
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Descreva o defeito específico..."
                  value={newDefectDesc}
                  onChange={(e) => setNewDefectDesc(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs text-slate-700 placeholder-slate-450 focus:outline-none"
                />
              </div>
              <div className="w-24 shrink-0">
                <input
                  type="number"
                  min="1"
                  placeholder="Qtd"
                  value={newDefectQty}
                  onChange={(e) => setNewDefectQty(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-2.5 py-1.5 border border-slate-250 bg-white rounded-lg text-xs text-slate-700 focus:outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!newDefectDesc.trim()) return;
                  const item = {
                    id: `def_${Date.now()}`,
                    description: newDefectDesc.trim(),
                    quantity: newDefectQty,
                  };
                  const updated = [...defects, item];
                  setDefects(updated);
                  setNewDefectDesc('');
                  setNewDefectQty(5);
                  // Update total qty
                  setQuantity(updated.reduce((sum, d) => sum + d.quantity, 0));
                }}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 cursor-pointer shrink-0 transition-all shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" /> Incluir
              </button>
            </div>

            {/* List of current defects */}
            {defects.length > 0 ? (
               <div className="space-y-1.5 pt-1.5 max-h-36 overflow-y-auto">
                 {defects.map((d) => (
                   <div key={d.id} className="flex items-center justify-between gap-2 p-2 rounded bg-white hover:bg-slate-50 border border-slate-150 text-xs">
                     <span className="text-slate-700 truncate min-w-0 flex-1 font-medium">{d.description}</span>
                     <div className="flex items-center gap-3">
                       <span className="font-mono font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded text-[11px] shrink-0">
                         {d.quantity} un
                       </span>
                       <button
                         type="button"
                         onClick={() => {
                           const updated = defects.filter((it) => it.id !== d.id);
                           setDefects(updated);
                           setQuantity(updated.reduce((sum, item) => sum + item.quantity, 0) || 1);
                         }}
                         className="p-1 hover:bg-slate-100 text-slate-400 hover:text-rose-600 rounded transition-colors"
                       >
                         <Trash2 className="w-3.5 h-3.5" />
                       </button>
                     </div>
                   </div>
                 ))}
                 <div className="text-[10px] text-right font-medium text-slate-500 pt-1">
                   Soma dos itens: <strong className="text-blue-600 font-bold">{defects.reduce((sum, d) => sum + d.quantity, 0)}</strong> un
                 </div>
               </div>
            ) : (
              <p className="text-[10.5px] text-slate-500 italic text-center py-2">
                Nenhum defeito adicionado. O sistema assumirá o relato geral de {quantity} unidades.
              </p>
            )}
          </div>

          <div className="bg-amber-50 p-3 rounded-lg border border-amber-150 flex gap-2 text-[11px] leading-relaxed text-amber-800">
            <Info className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
            <p>
              Ao registrar o chamado, ele será inserido instantaneamente no sistema sob o status de <strong>Aberto</strong> para triagem técnica das esquipes do departamento de Qualidade.
            </p>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-2.5 pt-4 border-t border-slate-100">
            <button
              id="close-modal-footer-btn"
              type="button"
              onClick={onClose}
              className="px-4 py-2 hover:bg-slate-100 text-slate-700 font-semibold text-xs rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="submit-modal-btn"
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg shadow-sm shadow-blue-500/20 transition-all cursor-pointer"
            >
              Salvar Ocorrência (SAC)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
