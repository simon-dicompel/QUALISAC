import React, { useState } from 'react';
import { User, Tenant, Product, UserRole, IssueTypeCategory } from '../types';
import { 
  Package, 
  Tags, 
  Users, 
  Plus, 
  Edit2, 
  Check, 
  Trash2, 
  X, 
  AlertTriangle, 
  UserPlus,
  ShieldAlert,
  Building,
  Mail,
  Key,
  Download,
  Upload,
  FileSpreadsheet,
  Filter,
  Search
} from 'lucide-react';

interface AdminConfigViewProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onEditProduct: (code: string, updatedName: string, updatedProducedQty?: number, updatedLine?: string) => void;
  onDeleteProduct: (code: string) => void;
  
  issueTypes: IssueTypeCategory[];
  onAddIssueType: (type: string) => void;
  onDeleteIssueType: (type: string) => void;
  onAddSubcategory: (categoryId: string, subCategoryName: string) => void;
  onDeleteSubcategory: (categoryId: string, subCategoryName: string) => void;
  
  users: User[];
  onAddUser: (user: User) => void;
  onDeleteUser: (id: string) => void;
  
  tenants: Tenant[];
}

export const AdminConfigView: React.FC<AdminConfigViewProps> = ({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
  
  issueTypes,
  onAddIssueType,
  onDeleteIssueType,
  onAddSubcategory,
  onDeleteSubcategory,
  
  users,
  onAddUser,
  onDeleteUser,
  
  tenants,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'issueTypes' | 'users'>('products');
  
  // Products states
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [newProdQty, setNewProdQty] = useState<string>('');
  const [newProdLine, setNewProdLine] = useState('');
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingQty, setEditingQty] = useState<string>('');
  const [editingLine, setEditingLine] = useState('');
  const [deletingProductCode, setDeletingProductCode] = useState<string | null>(null);
  const [deletingCategoryId, setDeletingCategoryId] = useState<string | null>(null);
  const [deletingSubcategoryKey, setDeletingSubcategoryKey] = useState<string | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
  // Filtering states
  const [filterLine, setFilterLine] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Issue types states
  const [newIssueType, setNewIssueType] = useState('');
  const [selectedParentId, setSelectedParentId] = useState<string>(issueTypes[0]?.id || '');
  const [newSubCategory, setNewSubCategory] = useState('');

  // User registration states
  const [newUserEmail, setNewUserEmail] = useState('');
  const [newUserName, setNewUserName] = useState('');
  const [newUserRole, setNewUserRole] = useState<UserRole>('COMUM');
  const [newUserPassword, setNewUserPassword] = useState('');
  const [newUserTenant, setNewUserTenant] = useState(tenants[0]?.id || 'tenant_1');

  // Submit Product handler
  const handleCreateProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdCode.trim() || !newProdName.trim()) {
      alert('Por favor, preencha o código SKU e o nome do produto.');
      return;
    }
    const cleanCode = newProdCode.trim().toUpperCase();
    if (products.some((p) => p.code === cleanCode)) {
      alert(`Erro: Já existe um produto cadastrado com o SKU ${cleanCode}`);
      return;
    }

    const parsedQty = newProdQty.trim() ? parseInt(newProdQty, 10) : 0;

    onAddProduct({
      code: cleanCode,
      name: newProdName.trim(),
      producedQty: isNaN(parsedQty) ? 0 : parsedQty,
      line: newProdLine.trim() || 'Geral',
    });
    setNewProdCode('');
    setNewProdName('');
    setNewProdQty('');
    setNewProdLine('');
  };

  // Save edited product name
  const handleSaveProductEdit = (code: string) => {
    if (!editingName.trim()) {
      alert('O nome do produto não pode ficar em branco.');
      return;
    }
    const parsedQty = editingQty.trim() ? parseInt(editingQty, 10) : 0;
    onEditProduct(code, editingName.trim(), isNaN(parsedQty) ? 0 : parsedQty, editingLine.trim() || 'Geral');
    setEditingCode(null);
    setEditingName('');
    setEditingQty('');
    setEditingLine('');
  };

  // Handler for Excel/CSV import
  const handleImportExcelCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      if (!text) return;

      const lines = text.split(/\r?\n/);
      if (lines.length < 1) {
        alert('O arquivo selecionado está vazio.');
        return;
      }

      // Read header or first line
      const firstLine = lines[0];
      const separator = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';
      const headers = firstLine.split(separator).map(h => h.trim().toLowerCase());
      
      let codeIdx = -1;
      let nameIdx = -1;
      let lineIdx = -1;
      let qtyIdx = -1;

      headers.forEach((h, idx) => {
        if (h.includes('codigo') || h.includes('código') || h.includes('sku') || h.includes('code')) {
          codeIdx = idx;
        } else if (h.includes('descri') || h.includes('nome') || h.includes('apresenta') || h.includes('description') || h.includes('name')) {
          nameIdx = idx;
        } else if (h.includes('linha') || h.includes('line')) {
          lineIdx = idx;
        } else if (h.includes('produz') || h.includes('volume') || h.includes('produced') || h.includes('quantidade') || h.includes('qtd')) {
          qtyIdx = idx;
        }
      });

      // Default fallbacks if header does not match perfectly
      if (codeIdx === -1) codeIdx = 0;
      if (nameIdx === -1) nameIdx = 1;
      if (lineIdx === -1) lineIdx = 2;
      if (qtyIdx === -1) qtyIdx = 3;

      let successCount = 0;
      let duplicateCount = 0;
      let invalidCount = 0;

      const importedProducts: Product[] = [];

      // Determine if first row is header
      const isFirstRowHeader = headers.some(h => 
        h.includes('codigo') || h.includes('código') || h.includes('sku') || 
        h.includes('descri') || h.includes('nome') || h.includes('linha') || h.includes('line')
      );

      const startIndex = isFirstRowHeader ? 1 : 0;

      for (let i = startIndex; i < lines.length; i++) {
        const lineText = lines[i].trim();
        if (!lineText) continue;

        const cells = lineText.split(separator).map(c => {
          let cleaned = c.trim();
          if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
            cleaned = cleaned.substring(1, cleaned.length - 1).trim();
          }
          return cleaned;
        });

        if (cells.length < 2) {
          invalidCount++;
          continue;
        }

        const sku = cells[codeIdx]?.trim().toUpperCase();
        const description = cells[nameIdx]?.trim();
        const productLine = cells[lineIdx]?.trim() || 'Geral';
        const rawQty = cells[qtyIdx]?.trim() || '0';
        
        let qty = 0;
        if (rawQty) {
          qty = parseInt(rawQty.replace(/[^\d]/g, ''), 10);
          if (isNaN(qty)) qty = 0;
        }

        if (!sku || !description) {
          invalidCount++;
          continue;
        }

        // Check duplication
        const isDuplicate = products.some(p => p.code === sku) || importedProducts.some(p => p.code === sku);
        if (isDuplicate) {
          duplicateCount++;
          continue;
        }

        importedProducts.push({
          code: sku,
          name: description,
          line: productLine,
          producedQty: qty,
        });
        successCount++;
      }

      if (importedProducts.length > 0) {
        importedProducts.forEach(prod => {
          onAddProduct(prod);
        });
        alert(`Importação concluída com sucesso!\n\n- ${successCount} produtos importados.\n- ${duplicateCount} SKUs duplicados ignorados.\n- ${invalidCount} linhas inválidas puladas.`);
      } else {
        alert(`Nenhum produto foi importado.\n- Duplicados: ${duplicateCount}\n- Inválidos: ${invalidCount}\n\nVerifique se o arquivo segue o formato correto (SKU, Descrição, Linha, Volume).`);
      }
      
      e.target.value = '';
    };
    reader.readAsText(file);
  };

  // Submit Issue Type handler
  const handleCreateIssueType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueType.trim()) {
      alert('O nome do tipo de desvio não pode ser vazio.');
      return;
    }
    const cleanType = newIssueType.trim();
    if (issueTypes.some((it) => it.name.toLowerCase() === cleanType.toLowerCase())) {
      alert(`Erro: O tipo de desvio "${cleanType}" já está cadastrado.`);
      return;
    }

    onAddIssueType(cleanType);
    setNewIssueType('');
  };

  // Submit Subcategory handler
  const handleCreateSubcategory = (e: React.FormEvent) => {
    e.preventDefault();
    const parentId = selectedParentId || issueTypes[0]?.id;
    if (!parentId) {
      alert('Por favor, cadastre primeiro uma categoria pai.');
      return;
    }
    if (!newSubCategory.trim()) {
      alert('O nome da subcategoria não pode ser vazio.');
      return;
    }
    const cleanSub = newSubCategory.trim();
    const parentCategory = issueTypes.find(it => it.id === parentId);
    if (parentCategory && parentCategory.subcategories.some(sub => sub.toLowerCase() === cleanSub.toLowerCase())) {
      alert(`Erro: A subcategoria "${cleanSub}" já está cadastrada nesta categoria.`);
      return;
    }

    onAddSubcategory(parentId, cleanSub);
    setNewSubCategory('');
  };

  // Submit User handler
  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword.trim()) {
      alert('Por favor, preencha o nome, email e senha de acesso.');
      return;
    }

    const emailClean = newUserEmail.trim().toLowerCase();
    if (users.some((u) => u.email.toLowerCase() === emailClean)) {
      alert(`Erro: Um usuário com o e-mail ${emailClean} já existe no sistema.`);
      return;
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      name: newUserName.trim(),
      email: emailClean,
      role: newUserRole,
      passwordHash: newUserPassword.trim(),
      tenantId: newUserTenant,
    };

    onAddUser(newUser);
    
    // reset user form fields
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('COMUM');
  };

  return (
    <div className="space-y-6">
      
      {/* Visual Page Header */}
      <div className="bg-white p-6 rounded-xl border border-slate-100 card-shadow flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 rounded px-2.5 py-1 uppercase tracking-wider inline-block mb-2">
            Painel Administrativo ISO 9001
          </span>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight">Configurações Gerais do Sistema</h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Painel exclusivo de Administradores para gerenciamento de catálogos de produtos, parametrização operacional de tipos de não conformidades (regras corporativas) e controle de acessos SaaS.
          </p>
        </div>
        
        {/* Rapid summary widgets */}
        <div className="flex gap-3 text-xs">
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center min-w-20">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Produtos</span>
            <span className="text-base font-extrabold text-slate-800">{products.length}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center min-w-20">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Desvios</span>
            <span className="text-base font-extrabold text-slate-800">{issueTypes.length}</span>
          </div>
          <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-center min-w-20">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Usuários</span>
            <span className="text-base font-extrabold text-slate-800">{users.length}</span>
          </div>
        </div>
      </div>

      {/* Tabs configuration */}
      <div className="flex border-b border-slate-200 bg-slate-50 p-1.5 rounded-xl border">
        <button
          id="tab-config-products"
          onClick={() => setActiveSubTab('products')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex-1 justify-center sm:flex-initial ${
            activeSubTab === 'products'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>📦 Produtos</span>
        </button>
        <button
          id="tab-config-deviations"
          onClick={() => setActiveSubTab('issueTypes')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex-1 justify-center sm:flex-initial ${
            activeSubTab === 'issueTypes'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tags className="w-4 h-4" />
          <span>🏷️ Tipos de Desvio</span>
        </button>
        <button
          id="tab-config-users"
          onClick={() => setActiveSubTab('users')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all cursor-pointer flex-1 justify-center sm:flex-initial ${
            activeSubTab === 'users'
              ? 'bg-white text-blue-600 shadow-sm'
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>👥 Usuários</span>
        </button>
      </div>

      {/* SUB-TAB 1: PRODUCTS CONFIGURATION */}
      {activeSubTab === 'products' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
          
          {/* Create Product Form Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 card-shadow h-fit space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Cadastrar Novo Produto</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Adicione itens de inventário aptos para abertura de SAC e tratativas de laudo.
              </p>
            </div>

            <form onSubmit={handleCreateProduct} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Código SKU único *</label>
                <input
                  id="reg-prod-code"
                  type="text"
                  required
                  placeholder="Ex: DC-1200"
                  value={newProdCode}
                  onChange={(e) => setNewProdCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Nome / Descrição Comercial *</label>
                <input
                  id="reg-prod-name"
                  type="text"
                  required
                  placeholder="Ex: Interruptor Simples"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Linha do Produto</label>
                <input
                  id="reg-prod-line"
                  type="text"
                  placeholder="Ex: Novara, Classique"
                  value={newProdLine}
                  onChange={(e) => setNewProdLine(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Quantidade Produzida (Volume Total)</label>
                <input
                  id="reg-prod-qty"
                  type="number"
                  min="0"
                  placeholder="Ex: 50000"
                  value={newProdQty}
                  onChange={(e) => setNewProdQty(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                id="reg-prod-submit"
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer uppercase tracking-wider"
              >
                <Plus className="w-4 h-4" />
                <span>Salvar Produto</span>
              </button>
            </form>

            {/* Excel / CSV Import Section */}
            <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 space-y-3">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                <h4 className="text-xs font-black text-slate-800 uppercase tracking-wide">Importar Planilha</h4>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Importe múltiplos produtos instantaneamente de arquivos de planilhas Excel (exportados como CSV ou TXT).
              </p>
              
              <div className="bg-white p-2.5 rounded-lg border border-slate-200 text-[10px] text-slate-500 font-mono space-y-1">
                <div className="font-bold border-b border-slate-100 pb-1 text-slate-600">Formato esperado (Exemplo):</div>
                <div>Código do produto;Descrição;Linha;Quantidade</div>
                <div>DC-1200;Interruptor Simples;Novara;25000</div>
                <div>DC-1300;Interruptor Duplo;Novara;15000</div>
              </div>

              <div className="pt-1">
                <label 
                  htmlFor="import-excel-file" 
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-650 hover:text-white rounded-lg border border-emerald-200 hover:border-emerald-600 transition-all cursor-pointer shadow-xs uppercase tracking-wider"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Importar Planilha Excel/CSV</span>
                </label>
                <input
                  id="import-excel-file"
                  type="file"
                  accept=".csv,.txt"
                  onChange={handleImportExcelCSV}
                  className="hidden"
                />
              </div>
            </div>
          </div>

          {/* Preset list of Products */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 card-shadow lg:col-span-2 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-blue-500" />
                  <span>Catálogo de Produtos Cadastrados</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Lista de materiais e mercadorias habilitados para as operações do SAC.
                </p>
              </div>
            </div>

            {/* Search and Line Filters */}
            <div className="flex flex-col sm:flex-row gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/60">
              <div className="flex-1 relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Pesquisar por SKU, nome ou linha..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 border border-slate-250 bg-white rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                <select
                  value={filterLine}
                  onChange={(e) => setFilterLine(e.target.value)}
                  className="px-3 py-1.5 border border-slate-250 bg-white rounded-lg text-xs text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-40"
                >
                  <option value="all">Todas as Linhas</option>
                  {Array.from(new Set(products.map(p => p.line || 'Geral'))).filter(Boolean).sort().map(line => (
                    <option key={line} value={line}>{line}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Código SKU</th>
                    <th className="py-2.5 px-3">Nome Comercial / Descrição</th>
                    <th className="py-2.5 px-3">Linha</th>
                    <th className="py-2.5 px-3 text-center">Volume Produzido</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products
                    .filter((p) => {
                      const pLine = p.line || 'Geral';
                      const matchesLine = filterLine === 'all' || pLine === filterLine;
                      const matchesSearch = p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                                            pLine.toLowerCase().includes(searchQuery.toLowerCase());
                      return matchesLine && matchesSearch;
                    })
                    .map((p) => {
                      const isEditing = editingCode === p.code;
                      
                      return (
                        <tr key={p.code} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3 px-3">
                            <code className="bg-slate-150 text-slate-800 px-2 py-0.5 rounded font-mono text-[10px] font-bold">
                              {p.code}
                            </code>
                          </td>
                          <td className="py-3 px-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingName}
                                onChange={(e) => setEditingName(e.target.value)}
                                className="px-2 py-1 border border-blue-400 bg-white rounded text-xs w-full max-w-sm text-slate-800 outline-none focus:ring-2 focus:ring-blue-400"
                              />
                            ) : (
                              <span className="font-medium text-slate-800">{p.name}</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editingLine}
                                onChange={(e) => setEditingLine(e.target.value)}
                                className="px-2 py-1 border border-blue-400 bg-white rounded text-xs w-28 text-slate-800 outline-none focus:ring-2 focus:ring-blue-400"
                              />
                            ) : (
                              <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[11px] font-medium border border-slate-200">
                                {p.line || 'Geral'}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <input
                                type="number"
                                min="0"
                                value={editingQty}
                                onChange={(e) => setEditingQty(e.target.value)}
                                className="px-2 py-1 border border-blue-400 bg-white rounded text-xs w-24 text-center text-slate-800 outline-none focus:ring-2 focus:ring-blue-400"
                              />
                            ) : (
                              <span className="font-bold text-slate-700 bg-slate-100 px-2 py-1 rounded">
                                {(p.producedQty ?? 0).toLocaleString('pt-BR')}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="flex gap-2 justify-end">
                              {isEditing ? (
                                <>
                                  <button
                                    onClick={() => handleSaveProductEdit(p.code)}
                                    className="p-1.5 bg-emerald-50 hover:bg-emerald-600 text-emerald-600 hover:text-white rounded-lg border border-emerald-200 transition-all cursor-pointer"
                                    title="Salvar Alterações"
                                  >
                                    <Check className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => setEditingCode(null)}
                                    className="p-1.5 bg-slate-50 hover:bg-slate-600 text-slate-400 hover:text-white rounded-lg border border-slate-200 transition-all cursor-pointer"
                                    title="Cancelar"
                                  >
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                              {deletingProductCode === p.code ? (
                                <div className="flex items-center gap-1.5 bg-rose-50 p-1 rounded-lg border border-rose-100">
                                  <span className="text-[10px] font-bold text-rose-700 px-1">Confirma?</span>
                                  <button
                                    onClick={() => {
                                      onDeleteProduct(p.code);
                                      setDeletingProductCode(null);
                                    }}
                                    className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded transition-colors cursor-pointer"
                                    title="Confirmar Exclusão"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={() => setDeletingProductCode(null)}
                                    className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition-colors cursor-pointer"
                                    title="Cancelar"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingCode(p.code);
                                      setEditingName(p.name);
                                      setEditingQty(String(p.producedQty ?? 0));
                                      setEditingLine(p.line || 'Geral');
                                    }}
                                    className="p-1.5 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-all cursor-pointer"
                                    title="Editar Produto"
                                  >
                                    <Edit2 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      setDeletingProductCode(p.code);
                                    }}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-all cursor-pointer"
                                    title="Excluir do Catálogo"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: DEVIATIONS CONFIGURATION */}
      {activeSubTab === 'issueTypes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
          
          {/* Create Deviation Form Cards */}
          <div className="space-y-6">
            {/* Form 1: Create Category (Pai) */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 card-shadow h-fit space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-emerald-500" />
                  <span>Nova Categoria (Pai)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Adicione categoria principal do desvio/ocorrência.
                </p>
              </div>

              <form onSubmit={handleCreateIssueType} className="space-y-3 border-none p-0">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Nome da Categoria *</label>
                  <input
                    id="reg-deviation-type"
                    type="text"
                    required
                    placeholder="Ex: Qualidade de Processo, Embalagem"
                    value={newIssueType}
                    onChange={(e) => setNewIssueType(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="bg-amber-50 p-2.5 rounded-lg border border-amber-150 text-[10.5px] leading-relaxed text-amber-800 flex gap-1.5">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                  <p>
                    Novas taxas e parâmetros estarão imediatamente disponíveis nos formulários de criação de chamados.
                  </p>
                </div>

                <button
                  id="reg-deviation-submit"
                  type="submit"
                  className="w-full py-2 bg-blue-600 hover:bg-blue-750 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Categoria</span>
                </button>
              </form>
            </div>

            {/* Form 2: Create Subcategory (Filho) */}
            <div className="bg-white p-5 rounded-xl border border-slate-100 card-shadow h-fit space-y-4">
              <div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-indigo-500" />
                  <span>Nova Subcategoria (Filho)</span>
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Vincule um desvio filho (ex: Riscado) a uma categoria principal (ex: Defeito).
                </p>
              </div>

              <form onSubmit={handleCreateSubcategory} className="space-y-3 border-none p-0">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Categoria Vinculada (Pai) *</label>
                  <select
                    value={selectedParentId}
                    onChange={(e) => setSelectedParentId(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Selecione uma Categoria...</option>
                    {issueTypes.map((it) => (
                      <option key={it.id} value={it.id}>
                        {it.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Nome da Subcategoria *</label>
                  <input
                    id="reg-deviation-sub"
                    type="text"
                    required
                    placeholder="Ex: Riscado, Amassado, Quebrado"
                    value={newSubCategory}
                    onChange={(e) => setNewSubCategory(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <button
                  id="reg-subcategory-submit"
                  type="submit"
                  className="w-full py-2 bg-indigo-650 hover:bg-indigo-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Cadastrar Subcategoria</span>
                </button>
              </form>
            </div>
          </div>

          {/* List of current Deviation categories and subcategories */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 card-shadow lg:col-span-2 space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Tags className="w-4 h-4 text-blue-500" />
                <span>Estrutura de Desvios (Pai e Filho)</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Categorias e subcategorias parametrizadas para classificação de não-conformidade.
              </p>
            </div>

            <div className="space-y-4 max-h-[80vh] overflow-y-auto">
              {issueTypes.map((cat) => (
                <div 
                  key={cat.id} 
                  className="p-4 bg-slate-50 rounded-xl border border-slate-150 space-y-3"
                >
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 bg-blue-550 rounded-full"></span>
                      <strong className="text-slate-800 text-xs font-black uppercase tracking-wider">{cat.name}</strong>
                      <span className="text-[10px] bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full font-bold">
                        {cat.subcategories.length} subcategorias
                      </span>
                    </div>
                    
                    {deletingCategoryId === cat.id ? (
                      <div className="flex items-center gap-1 bg-rose-50 p-1 rounded-lg border border-rose-200">
                        <span className="text-[10px] font-bold text-rose-700 px-1">Excluir?</span>
                        <button
                          onClick={() => {
                            onDeleteIssueType(cat.id);
                            setDeletingCategoryId(null);
                          }}
                          className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded cursor-pointer"
                          title="Confirmar"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => setDeletingCategoryId(null)}
                          className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded cursor-pointer"
                          title="Cancelar"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          if (['it_defeito', 'it_avaria', 'it_troca', 'it_logistica', 'it_outro'].includes(cat.id)) {
                            alert('Por motivos de conformidade histórica dos relatórios, as categorias nativas não podem ser removidas do sistema.');
                            return;
                          }
                          setDeletingCategoryId(cat.id);
                        }}
                        className="p-1 hover:bg-rose-100 hover:text-rose-600 rounded text-slate-400 transition-colors cursor-pointer"
                        title={['it_defeito', 'it_avaria', 'it_troca', 'it_logistica', 'it_outro'].includes(cat.id) ? 'Protegido de remoção' : 'Apagar categoria'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {cat.subcategories.length === 0 ? (
                    <p className="text-[11px] text-slate-450 italic pl-4">Nenhuma subcategoria vinculada ainda.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2 pl-4">
                      {cat.subcategories.map((sub) => (
                        <div 
                          key={sub}
                          className={`flex items-center gap-1 px-2.5 py-1 bg-white border rounded-lg text-[11px] text-slate-700 transition-all group ${
                            deletingSubcategoryKey === `${cat.id}-${sub}`
                              ? 'border-rose-300 bg-rose-50/30'
                              : 'border-slate-200 hover:border-rose-250'
                          }`}
                        >
                          <span className="text-slate-450">▪</span>
                          <span className="font-semibold text-slate-750">{sub}</span>
                          
                          {deletingSubcategoryKey === `${cat.id}-${sub}` ? (
                            <div className="flex items-center gap-1 ml-1.5 animate-in fade-in duration-100">
                              <button
                                onClick={() => {
                                  onDeleteSubcategory(cat.id, sub);
                                  setDeletingSubcategoryKey(null);
                                }}
                                className="p-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded cursor-pointer"
                                title="Confirmar"
                              >
                                <Check className="w-2.5 h-2.5" />
                              </button>
                              <button
                                onClick={() => setDeletingSubcategoryKey(null)}
                                className="p-0.5 bg-slate-200 hover:bg-slate-350 text-slate-750 rounded cursor-pointer"
                                title="Cancelar"
                              >
                                <X className="w-2.5 h-2.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                setDeletingSubcategoryKey(`${cat.id}-${sub}`);
                              }}
                              className="ml-1 text-slate-300 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                              title="Excluir subcategoria"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: USERS CONFIGURATION */}
      {activeSubTab === 'users' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in duration-150">
          
          {/* Create User Form Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 card-shadow h-fit space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <UserPlus className="w-4 h-4 text-emerald-500" />
                <span>Registrar Novo Usuário</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Crie credenciais e atribua perfis específicos para operar sob as tenants SaaS.
              </p>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-3">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-0.5">Nome Completo *</label>
                <input
                  id="reg-user-name"
                  type="text"
                  required
                  placeholder="Ex: André Martins Santos"
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="w-full px-3 py-1.5 border border-slate-250 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-0.5">E-mail Corporativo *</label>
                <div className="relative">
                  <Mail className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-450 pointer-events-none" />
                  <input
                    id="reg-user-email"
                    type="email"
                    required
                    placeholder="andre@quali.com"
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-250 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-0.5">Senha Provisória de Acesso *</label>
                <div className="relative">
                  <Key className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-450 pointer-events-none" />
                  <input
                    id="reg-user-password"
                    type="text"
                    required
                    placeholder="andre123"
                    value={newUserPassword}
                    onChange={(e) => setNewUserPassword(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 border border-slate-250 rounded-lg text-xs font-mono text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-0.5">Perfil / Role Operatório *</label>
                  <select
                    id="reg-user-role"
                    value={newUserRole}
                    onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                    className="w-full px-2 py-1.5 border border-slate-250 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 font-bold"
                  >
                    <option value="COMUM">COMUM (Leitura)</option>
                    <option value="SAC">SAC (Aberturas)</option>
                    <option value="QUALIDADE">QUALIDADE (Laudo)</option>
                    <option value="ADMIN">ADMINISTRADOR</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-0.5">Filial SaaS Tenant *</label>
                  <select
                    id="reg-user-tenant"
                    value={newUserTenant}
                    onChange={(e) => setNewUserTenant(e.target.value)}
                    className="w-full px-2 py-1.5 border border-slate-250 rounded-lg text-xs bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {tenants.map((ten) => (
                      <option key={ten.id} value={ten.id}>
                        🏢 {ten.name.substring(0, 16)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <button
                id="reg-user-submit"
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>Salvar Colaborador</span>
              </button>
            </form>
          </div>

          {/* Preset list of Users */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 card-shadow lg:col-span-2 space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-500" />
                <span>Colaboradores Cadastrados no Sistema</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Todos os usuários parametrizados que possuem acesso e auditorias de histórico assinadas.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Nome</th>
                    <th className="py-2.5 px-3">E-mail Operacional</th>
                    <th className="py-2.5 px-3">Perfil</th>
                    <th className="py-2.5 px-3">Empresa/Tenant</th>
                    <th className="py-2.5 px-3 text-right">Ação</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((u) => {
                    const matchedTenant = tenants.find((t) => t.id === u.tenantId);
                    
                    return (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="py-3 px-3">
                          <span className="font-extrabold text-slate-800 block text-xs">{u.name}</span>
                          <span className="text-[9px] block text-slate-400 mt-0.5">ID: {u.id}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-mono text-[11px] text-slate-700">{u.email}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">Senha: <code className="bg-slate-100 px-1 rounded text-red-500 font-bold">{u.passwordHash}</code></span>
                        </td>
                        <td className="py-3 px-3">
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded uppercase inline-block ${
                            u.role === 'ADMIN'
                              ? 'bg-red-50 text-red-600 border border-red-100'
                              : u.role === 'QUALIDADE'
                              ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                              : u.role === 'SAC'
                              ? 'bg-blue-50 text-blue-600 border border-blue-100'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-1 text-[11px] text-slate-700 font-medium">
                            <Building className="w-3 h-3 text-slate-400 shrink-0" />
                            <span>{matchedTenant ? matchedTenant.name : 'Outro Cliente'}</span>
                          </div>
                        </td>
                        <td className="py-3 px-3 text-right">
                          {deletingUserId === u.id ? (
                            <div className="flex items-center gap-1.5 bg-rose-50 p-1 rounded-lg border border-rose-100 justify-end">
                              <span className="text-[10px] font-bold text-rose-700 px-1">Confirma?</span>
                              <button
                                onClick={() => {
                                  onDeleteUser(u.id);
                                  setDeletingUserId(null);
                                }}
                                className="p-1 bg-rose-600 hover:bg-rose-700 text-white rounded transition-colors cursor-pointer"
                                title="Confirmar Exclusão"
                              >
                                <Check className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => setDeletingUserId(null)}
                                className="p-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded transition-colors cursor-pointer"
                                title="Cancelar"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => {
                                if (u.id === 'user_admin') {
                                  alert('O usuário Administrador Principal não pode ser removido para evitar bloqueio permanente de acesso ao sistema.');
                                  return;
                                }
                                setDeletingUserId(u.id);
                              }}
                              disabled={u.id === 'user_admin'}
                              className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                                u.id === 'user_admin'
                                  ? 'bg-slate-50 text-slate-350 border-slate-100 cursor-not-allowed'
                                  : 'text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border-slate-200 hover:border-rose-200'
                              }`}
                              title={u.id === 'user_admin' ? 'Protegido contra exclusão' : 'Excluir Usuário'}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
