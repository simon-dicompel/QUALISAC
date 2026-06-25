import React from 'react';
import { Tenant, User } from '../types';
import { Building2, CreditCard, Sparkles, AlertCircle, RefreshCw } from 'lucide-react';
import { SimonDicompelLogo } from './SimonDicompelLogo';

interface SaasTenantSelectorProps {
  tenants: Tenant[];
  activeTenant: Tenant;
  onSelectTenant: (tenantId: string) => void;
  users: User[];
  currentUser: User;
  onSwitchUser: (userId: string) => void;
}

export const SaasTenantSelector: React.FC<SaasTenantSelectorProps> = ({
  tenants,
  activeTenant,
  onSelectTenant,
  users,
  currentUser,
  onSwitchUser,
}) => {
  // Filter users that belong to the active tenant
  const tenantUsers = users.filter((u) => u.tenantId === activeTenant.id);

  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 py-3 px-6 shadow-md transition-all">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        {/* Left Side: SaaS Multi-tenant switcher */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-lg border border-slate-700 text-sm shadow-inner shrink-0">
            <SimonDicompelLogo height={22} />
          </div>
          
          <div className="relative">
            <select
              id="tenant-dropdown"
              value={activeTenant.id}
              onChange={(e) => onSelectTenant(e.target.value)}
              className="bg-slate-850 hover:bg-slate-800 text-white font-medium text-sm rounded-lg border border-slate-705 px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-sky-500 transition-all cursor-pointer"
            >
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id} className="bg-slate-900 text-white">
                  🏢 {tenant.name}
                </option>
              ))}
            </select>
          </div>

          {/* Plan Badge */}
          <div className="flex items-center gap-1.5 bg-slate-800 px-2.5 py-1 rounded-full text-xs font-semibold text-sky-300 border border-sky-950">
            <CreditCard className="w-3.5 h-3.5" />
            <span>Plano: {activeTenant.plan}</span>
            <span className={`inline-block w-2 h-2 rounded-full ml-1 ${
              activeTenant.status === 'Ativo' ? 'bg-emerald-500' : 'bg-amber-500'
            }`} />
          </div>
        </div>

        {/* Right Side: Quick Role Switcher for seamless testing */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-700 text-xs">
            <RefreshCw className="w-3.5 h-3.5 text-indigo-400 animate-pulse" />
            <span className="font-semibold">Simulador de Perfis (Acesso Rápido):</span>
          </div>

          <div className="flex gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800">
            {tenantUsers.map((user) => {
              const isActive = currentUser.id === user.id;
              let roleBadgeColor = 'text-xs px-2.5 py-1 rounded-md transition-all font-medium ';
              if (isActive) {
                if (user.role === 'ADMIN') roleBadgeColor += 'bg-red-600 text-white font-semibold shadow-sm shadow-red-900/30';
                else if (user.role === 'SAC') roleBadgeColor += 'bg-blue-600 text-white font-semibold shadow-sm shadow-blue-900/30';
                else if (user.role === 'QUALIDADE') roleBadgeColor += 'bg-emerald-600 text-white font-semibold shadow-sm shadow-emerald-900/30';
                else roleBadgeColor += 'bg-slate-650 text-white font-semibold shadow-sm';
              } else {
                roleBadgeColor += 'text-slate-400 hover:text-white hover:bg-slate-850';
              }

              return (
                <button
                  id={`role-btn-${user.id}`}
                  key={user.id}
                  onClick={() => onSwitchUser(user.id)}
                  title={`Alternar para ${user.name} (${user.role})`}
                  className={roleBadgeColor}
                >
                  <span className="capitalize">{user.role.toLowerCase() === 'comum' ? 'Comum' : user.role}</span>
                </button>
              );
            })}
          </div>

          <div className="text-slate-400 text-xs flex items-center gap-1">
            <span>Ativo:</span>
            <strong className="text-slate-200">{currentUser.name}</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
