import React, { useState } from 'react';
import { User, Tenant, Product, UserRole } from '../types';
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
  Key
} from 'lucide-react';

interface AdminConfigViewProps {
  products: Product[];
  onAddProduct: (product: Product) => void;
  onEditProduct: (code: string, updatedName: string) => void;
  onDeleteProduct: (code: string) => void;
  
  issueTypes: string[];
  onAddIssueType: (type: string) => void;
  onDeleteIssueType: (type: string) => void;
  
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
  
  users,
  onAddUser,
  onDeleteUser,
  
  tenants,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'products' | 'issueTypes' | 'users'>('products');
  
  // Products states
  const [newProdCode, setNewProdCode] = useState('');
  const [newProdName, setNewProdName] = useState('');
  const [editingCode, setEditingCode] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');

  // Issue types states
  const [newIssueType, setNewIssueType] = useState('');

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

    onAddProduct({
      code: cleanCode,
      name: newProdName.trim(),
    });
    setNewProdCode('');
    setNewProdName('');
  };

  // Save edited product name
  const handleSaveProductEdit = (code: string) => {
    if (!editingName.trim()) {
      alert('O nome do produto não pode ficar em branco.');
      return;
    }
    onEditProduct(code, editingName.trim());
    setEditingCode(null);
    setEditingName('');
  };

  // Submit Issue Type handler
  const handleCreateIssueType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIssueType.trim()) {
      alert('O nome do tipo de desvio não pode ser vazio.');
      return;
    }
    const cleanType = newIssueType.trim();
    if (issueTypes.some((it) => it.toLowerCase() === cleanType.toLowerCase())) {
      alert(`Erro: O tipo de desvio "${cleanType}" já está cadastrado.`);
      return;
    }

    onAddIssueType(cleanType);
    setNewIssueType('');
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
                  placeholder="Ex: PROD-F104"
                  value={newProdCode}
                  onChange={(e) => setNewProdCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Nome de Apresentação Comercial *</label>
                <input
                  id="reg-prod-name"
                  type="text"
                  required
                  placeholder="Ex: Doce de Leite com Coco 400g"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                id="reg-prod-submit"
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Salvar Produto</span>
              </button>
            </form>
          </div>

          {/* Preset list of Products */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 card-shadow lg:col-span-2 space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Package className="w-4 h-4 text-blue-500" />
                <span>Catálogo de Produtos Cadastrados</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Lista de materiais e mercadorias habilitados para as operações do SAC.
              </p>
            </div>

            <div className="overflow-x-auto border border-slate-100 rounded-lg">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[9px] font-bold border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-3">Código SKU</th>
                    <th className="py-2.5 px-3">Nome Técnico do Produto</th>
                    <th className="py-2.5 px-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map((p) => {
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
                                <button
                                  onClick={() => {
                                    setEditingCode(p.code);
                                    setEditingName(p.name);
                                  }}
                                  className="p-1.5 text-slate-500 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg transition-all cursor-pointer"
                                  title="Editar Produto"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`Tem certeza de que deseja remover o produto "${p.name}" (${p.code}) do catálogo?`)) {
                                      onDeleteProduct(p.code);
                                    }
                                  }}
                                  className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-lg transition-all cursor-pointer"
                                  title="Excluir do Catálogo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
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
          
          {/* Create Deviation Form Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 card-shadow h-fit space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-500" />
                <span>Cadastrar Tipo de Desvio</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Adicione categorias corporativas de erros e desvios para catalogação de SAC.
              </p>
            </div>

            <form onSubmit={handleCreateIssueType} className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">Nome do Desvio / Ocorrência *</label>
                <input
                  id="reg-deviation-type"
                  type="text"
                  required
                  placeholder="Ex: Erro de Embalagem, Devolução Comercial"
                  value={newIssueType}
                  onChange={(e) => setNewIssueType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-250 rounded-lg text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="bg-amber-50 p-3 rounded-lg border border-amber-150 text-[10.5px] leading-relaxed text-amber-800 flex gap-1.5">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500 mt-0.5" />
                <p>
                  As novas taxonomias cadastradas estarão disponíveis nas opções de seleção dos formulários de entrada de novos chamados.
                </p>
              </div>

              <button
                id="reg-deviation-submit"
                type="submit"
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-lg transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Salvar Desvio</span>
              </button>
            </form>
          </div>

          {/* List of current Deviation categories */}
          <div className="bg-white p-5 rounded-xl border border-slate-100 card-shadow lg:col-span-2 space-y-4">
            <div>
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <Tags className="w-4 h-4 text-blue-500" />
                <span>Tipos de Desvio Operando no Sistema</span>
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Categorias parametrizadas usadas para classificação estatística de qualidade.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {issueTypes.map((type) => (
                <div 
                  key={type} 
                  className="p-3 bg-slate-50 rounded-xl border border-slate-150 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></span>
                    <strong className="text-slate-750 font-bold">{type}</strong>
                  </div>
                  
                  <button
                    onClick={() => {
                      if (['Defeito', 'Avaria', 'Troca', 'Erro de Logística'].includes(type)) {
                        alert('Por motivos de conformidade histórica dos relatórios, as categorias nativas não podem ser removidas do sistema.');
                        return;
                      }
                      if (confirm(`Remover a categoria de desvio "${type}" do sistema? Chamados existentes não serão apagados, mas novos posts não poderão usar tal classificação.`)) {
                        onDeleteIssueType(type);
                      }
                    }}
                    className="p-1 hover:bg-rose-100 hover:text-rose-600 rounded text-slate-400 transition-colors cursor-pointer"
                    title={['Defeito', 'Avaria', 'Troca', 'Erro de Logística'].includes(type) ? 'Protegido de remoção' : 'Apagar tipo de desvio'}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
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
                          <button
                            onClick={() => {
                              if (u.id === 'user_admin') {
                                alert('O usuário Administrador Principal não pode ser removido para evitar bloqueio permanente de acesso ao sistema.');
                                return;
                              }
                              if (confirm(`Deseja remover permanentemente o login de "${u.name}" (${u.role}) do sistema?`)) {
                                onDeleteUser(u.id);
                              }
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
