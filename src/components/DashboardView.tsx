import React from 'react';
import { Ticket, IssueType, TicketStatus } from '../types';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  LineChart,
  Line,
} from 'recharts';
import {
  ClipboardList,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  TrendingDown,
  Clock,
  Shirt,
  ShieldCheck,
  Package,
  Layers,
} from 'lucide-react';

interface DashboardViewProps {
  tickets: Ticket[];
}

export const DashboardView: React.FC<DashboardViewProps> = ({ tickets }) => {
  const [selectedProductCode, setSelectedProductCode] = React.useState<string>('');

  // 1. Calculations
  const total = tickets.length;
  const abertos = tickets.filter((t) => t.status === 'Aberto').length;
  const emAnalise = tickets.filter((t) => t.status === 'Em analise').length;
  const emTratativa = tickets.filter((t) => t.status === 'Em tratativa').length;
  const resolvidos = tickets.filter((t) => t.status === 'Resolvido' || t.status === 'Finalizado').length;

  const totalReturnedQuantity = tickets.reduce((acc, t) => acc + t.quantity, 0);

  // Status distribution for PieChart
  const statusData = [
    { name: 'Aberto', value: abertos, color: '#f59e0b' },      // amber
    { name: 'Em análise', value: emAnalise, color: '#f43f5e' }, // rose
    { name: 'Em tratativa', value: emTratativa, color: '#6366f1' }, // indigo
    { name: 'Resolvido / Finalizado', value: resolvidos, color: '#10b981' }, // emerald
  ].filter((item) => item.value > 0);

  // Group by problem type
  const issueTypes: IssueType[] = ['Avaria', 'Defeito', 'Troca', 'Erro de Logística', 'Outro'];
  const issueTypeData = issueTypes.map((type) => {
    const count = tickets.filter((t) => t.issueType === type).length;
    const qty = tickets.filter((t) => t.issueType === type).reduce((sum, t) => sum + t.quantity, 0);
    return { name: type, Qtd: count, Pecas: qty };
  });

  // Simple monthly timeline calculation based on createdAt dates
  const timelineMap: Record<string, { count: number; qty: number }> = {};
  tickets.forEach((t) => {
    // format to simple DD/MM
    try {
      const d = new Date(t.createdAt);
      const label = `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
      if (!timelineMap[label]) {
        timelineMap[label] = { count: 0, qty: 0 };
      }
      timelineMap[label].count += 1;
      timelineMap[label].qty += t.quantity;
    } catch (e) {
      // Ignored
    }
  });

  const timelineData = Object.entries(timelineMap)
    .map(([date, data]) => ({
      date,
      Registros: data.count,
      Volume: data.qty,
    }))
    .sort((a, b) => {
      // sort DD/MM simple sort
      const [da, ma] = a.date.split('/').map(Number);
      const [db, mb] = b.date.split('/').map(Number);
      return ma !== mb ? ma - mb : da - db;
    });

  // Calculate return rate of top products
  const productReturnMap: Record<string, { code: string; name: string; qty: number; tickets: number }> = {};
  tickets.forEach((t) => {
    if (!productReturnMap[t.productCode]) {
      productReturnMap[t.productCode] = { code: t.productCode, name: t.productName, qty: 0, tickets: 0 };
    }
    productReturnMap[t.productCode].qty += t.quantity;
    productReturnMap[t.productCode].tickets += 1;
  });

  const topProducts = Object.values(productReturnMap)
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 3);

  // Aggregating defects by product
  // Format: Record<productCode, { productName: string, productCode: string, totalDefective: number, defectsList: { id: string, description: string, quantity: number }[] }>
  const productDefectData: Record<string, { productName: string, productCode: string, totalDefective: number, defectsList: { id: string, description: string, quantity: number }[] }> = {};

  tickets.forEach((t) => {
    // If ticket has defects
    const ticketDefects = t.defects || [];
    if (ticketDefects.length > 0) {
      if (!productDefectData[t.productCode]) {
        productDefectData[t.productCode] = {
          productName: t.productName,
          productCode: t.productCode,
          totalDefective: 0,
          defectsList: []
        };
      }
      
      ticketDefects.forEach((d) => {
        productDefectData[t.productCode].totalDefective += d.quantity;
        // Check if defect description already exists for this product code
        const existing = productDefectData[t.productCode].defectsList.find(
          (item) => item.description.toLowerCase().trim() === d.description.toLowerCase().trim()
        );
        if (existing) {
          existing.quantity += d.quantity;
        } else {
          productDefectData[t.productCode].defectsList.push({
            id: d.id,
            description: d.description,
            quantity: d.quantity
          });
        }
      });
    } else {
      // Fallback: Use ticket's general description if no defects listed yet
      if (!productDefectData[t.productCode]) {
        productDefectData[t.productCode] = {
          productName: t.productName,
          productCode: t.productCode,
          totalDefective: 0,
          defectsList: []
        };
      }
      productDefectData[t.productCode].totalDefective += t.quantity;
      
      const descShort = t.description.length > 50 ? t.description.substring(0, 50) + '...' : t.description;
      const existing = productDefectData[t.productCode].defectsList.find(
        (item) => item.description.toLowerCase().trim() === descShort.toLowerCase().trim()
      );
      if (existing) {
        existing.quantity += t.quantity;
      } else {
        productDefectData[t.productCode].defectsList.push({
          id: `fallback_${t.id}`,
          description: descShort,
          quantity: t.quantity
        });
      }
    }
  });

  const productDefectList = Object.values(productDefectData).sort((a, b) => b.totalDefective - a.totalDefective);
  const productDefectCodes = Object.keys(productDefectData);
  const activeProductCode = productDefectCodes.includes(selectedProductCode) ? selectedProductCode : (productDefectCodes[0] || '');
  const activeProduct = productDefectData[activeProductCode];

  // Custom tooltips
  const formatQuantity = (val: number) => `${val} unidades`;

  return (
    <div className="space-y-6">
      {/* 1. Metric tiles */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Tickets */}
        <div id="metric-total-box" className="bg-white p-4 rounded-xl card-shadow border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Total Registrado</p>
            <h2 className="text-2xl font-bold text-slate-800 mt-1">{total}</h2>
            <div className="mt-2 stat-bar">
              <div className="stat-fill bg-blue-500" style={{ width: '100%' }}></div>
            </div>
            <p className="text-[10px] mt-2 text-slate-400 font-medium">Histórico acumulativo</p>
          </div>
        </div>

        {/* Status Aberto */}
        <div id="metric-aberto-box" className="bg-white p-4 rounded-xl card-shadow border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Abertos</p>
            <h2 className="text-2xl font-bold text-slate-805 mt-1">{abertos}</h2>
            <div className="mt-2 stat-bar">
              <div className="stat-fill bg-red-500" style={{ width: `${total > 0 ? (abertos/total)*100 : 0}%` }}></div>
            </div>
            <p className="text-[10px] mt-2 text-slate-400 font-medium">Meta: Abaixo de 30%</p>
          </div>
        </div>

        {/* Em Analise */}
        <div id="metric-analise-box" className="bg-white p-4 rounded-xl card-shadow border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Em Análise</p>
            <h2 className="text-2xl font-bold text-slate-805 mt-1">{emAnalise}</h2>
            <div className="mt-2 stat-bar">
              <div className="stat-fill bg-amber-500" style={{ width: `${total > 0 ? (emAnalise/total)*100 : 0}%` }}></div>
            </div>
            <p className="text-[10px] mt-2 text-slate-400 font-medium">Pela equipe técnica</p>
          </div>
        </div>

        {/* Em Tratativa */}
        <div id="metric-tratativa-box" className="bg-white p-4 rounded-xl card-shadow border border-slate-100 flex flex-col justify-between">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Em Tratativa</p>
            <h2 className="text-2xl font-bold text-slate-805 mt-1">{emTratativa}</h2>
            <div className="mt-2 stat-bar">
              <div className="stat-fill bg-yellow-450" style={{ width: `${total > 0 ? (emTratativa/total)*100 : 0}%` }}></div>
            </div>
            <p className="text-[10px] mt-2 text-slate-400 font-medium font-semibold">Causa e laudo</p>
          </div>
        </div>

        {/* Resolvidos */}
        <div id="metric-resolvidos-box" className="bg-white p-4 rounded-xl card-shadow border border-slate-100 flex flex-col justify-between col-span-2 lg:col-span-1">
          <div>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Resolvidos</p>
            <h2 className="text-2xl font-bold text-slate-850 mt-1">{resolvidos}</h2>
            <div className="mt-2 stat-bar">
              <div className="stat-fill bg-emerald-500" style={{ width: `${total > 0 ? (resolvidos/total)*100 : 0}%` }}></div>
            </div>
            <p className="text-[10px] mt-2 text-green-600 font-medium">Meta batida</p>
          </div>
        </div>
      </div>

      {/* SLA and Quantity Indicator bar */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-sky-50 border border-sky-100 rounded-xl p-4 flex items-center gap-4">
          <div className="bg-sky-200/60 p-3 rounded-lg text-sky-700">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-slate-800 font-semibold text-sm">Tempo Médio de Resolução (SLA)</h4>
            <p className="text-2xl font-bold text-sky-850 mt-0.5">32,5 horas</p>
            <p className="text-xs text-slate-500">Meta interna do depto de qualidade: 48 horas máximo</p>
          </div>
        </div>

        <div className="bg-violet-50 border border-violet-100 rounded-xl p-4 flex items-center gap-4">
          <div className="bg-violet-200/60 p-3 rounded-lg text-violet-700">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-slate-800 font-semibold text-sm">Total de Peças Retornadas / Avariadas</h4>
            <p className="text-2xl font-bold text-violet-850 mt-0.5">{totalReturnedQuantity} unidades</p>
            <p className="text-xs text-slate-500">Acompanhamento contábil de devoluções no período</p>
          </div>
        </div>
      </div>

      {/* 2. Charts Row */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Chart A: Status circular indicator */}
        <div className="bg-white p-4.5 rounded-xl card-shadow border border-slate-100 xl:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Status de Qualidade</h3>
            <p className="text-[11px] text-slate-500">Distribuição percentual dos chamados no funil</p>
          </div>

          <div className="h-56 mt-4 flex items-center justify-center relative">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} chamado(s)`]} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-slate-400 text-xs text-center">Nenhum chamado cadastrado.</p>
            )}

            {/* Float value in center */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-4">
              <span className="text-3xl font-black text-slate-800">{total}</span>
              <span className="text-[10px] uppercase font-bold text-slate-500">Atendimentos</span>
            </div>
          </div>

          {/* Legend Grid */}
          <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-slate-100 text-xs">
            {statusData.map((st) => (
              <div key={st.name} className="flex items-center gap-1.5">
                <span className="w-2 rounded-full h-2" style={{ backgroundColor: st.color }} />
                <span className="text-slate-600 truncate">{st.name}:</span>
                <strong className="text-slate-800">{st.value}</strong>
              </div>
            ))}
          </div>
        </div>

        {/* Chart B: Issue type bar */}
        <div className="bg-white p-4.5 rounded-xl card-shadow border border-slate-100 xl:col-span-7">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Volume por Tipo de Problema</h3>
              <p className="text-[11px] text-slate-500">Total de chamados vs. total de mercadorias danificadas</p>
            </div>
          </div>

          <div className="h-64 mt-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={issueTypeData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                <YAxis yAxisId="left" stroke="#4f46e5" fontSize={11} label={{ value: 'Chamados', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#4f46e5' }} />
                <YAxis yAxisId="right" orientation="right" stroke="#7c3aed" fontSize={11} label={{ value: 'Peças Devolvidas', angle: 90, position: 'insideRight', fontSize: 10, fill: '#7c3aed' }} />
                <Tooltip />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11 }} />
                <Bar yAxisId="left" dataKey="Qtd" name="Qtd Chamados" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={25} />
                <Bar yAxisId="right" dataKey="Pecas" name="Peças Devolvidas" fill="#c084fc" radius={[4, 4, 0, 0]} barSize={25} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Trend Timeline and Critical Alert row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trend Timeline */}
        <div className="bg-white p-4.5 rounded-xl card-shadow border border-slate-100 lg:col-span-7">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">Frequência Temporal de Chamados</h3>
            <p className="text-[11px] text-slate-500">Histórico de abertura de ocorrências por dia</p>
          </div>

          <div className="h-60 mt-4">
            {timelineData.length > 0 ? (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart data={timelineData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" fontSize={11} stroke="#64748b" />
                  <YAxis fontSize={11} stroke="#64748b" />
                  <Tooltip />
                  <Legend iconType="rect" wrapperStyle={{ fontSize: 11 }} />
                  <Line type="monotone" dataKey="Registros" name="Registros (SAC)" stroke="#06b6d4" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="Volume" name="Volume Devolvido" stroke="#f43f5e" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-slate-400 text-xs">Aguardando dados...</div>
            )}
          </div>
        </div>

        {/* Quality Alerts / Critical Material Alert */}
        <div className="bg-white p-4.5 rounded-xl card-shadow border border-slate-100 lg:col-span-5 flex flex-col justify-between">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
              <ShieldCheck className="w-5 h-5 text-emerald-500" />
              <span>Garantia de Qualidade</span>
            </h3>
            <p className="text-[11px] text-slate-500">Principais materiais concentrando reclamações</p>
          </div>

          <div className="space-y-3 mt-4 flex-1">
            {topProducts.length > 0 ? (
              topProducts.map((p, idx) => (
                <div key={p.code} className="p-3 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between gap-3 text-xs">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-slate-800 truncate">{p.name}</p>
                    <p className="text-[10px] text-slate-500 mt-0.5">Cód: {p.code} &bull; {p.tickets} chamados abertos</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-md">
                      {p.qty} un
                    </span>
                    <p className="text-[9px] text-slate-400 mt-1">vazados/danificados</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-xs py-4 text-center">Nenhum retorno computado.</p>
            )}
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 bg-slate-50/50 p-2.5 rounded-lg border border-dashed border-slate-250 text-wrap">
            <p className="text-[11px] leading-relaxed text-slate-600">
              💡 <strong>Regra Industrial:</strong> Emissões com volumes acima de 100 unidades estimulam abertura obrigatória automática do <strong>Relatório 8D / 5 Porquês</strong> no setor de Qualidade.
            </p>
          </div>
        </div>
      </div>

      {/* Componente de Gráfico: Peças com Defeito por Item de Inventário */}
      <div id="chart-defects-by-product" className="bg-white p-5 rounded-xl card-shadow border border-slate-100 space-y-4 animate-in fade-in duration-200">
        <div>
          <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
            <Package className="w-4 h-4 text-violet-500" />
            <span>Defeitos Totais por Item de Inventário</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Comparativo do volume consolidado de peças defeituosas devolvidas por produto e SKU.
          </p>
        </div>

        <div className="h-72 mt-2 bg-slate-50/30 p-3 rounded-xl border border-slate-100">
          {productDefectList.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={productDefectList}
                margin={{ top: 20, right: 20, left: 10, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="productName"
                  stroke="#475569"
                  fontSize={10}
                  tickLine={false}
                  dy={8}
                  tickFormatter={(value) => value && value.length > 18 ? `${value.substring(0, 15)}...` : value}
                />
                <YAxis
                  stroke="#475569"
                  fontSize={10}
                  tickLine={false}
                  label={{ value: 'Quantidade de Defeitos (Peças)', angle: -90, position: 'insideLeft', fontSize: 10, fill: '#475569', offset: -2 }}
                />
                <Tooltip
                  formatter={(value, name, props) => [
                    `${value} unidades com defeito`,
                    `${props.payload.productName} (SKU: ${props.payload.productCode})`
                  ]}
                  contentStyle={{ fontSize: 11, borderRadius: 8 }}
                />
                <Bar
                  dataKey="totalDefective"
                  name="Peças com Defeito"
                  fill="#8b5cf6"
                  radius={[4, 4, 0, 0]}
                  barSize={32}
                  label={{ position: 'top', fill: '#475569', fontSize: 10, fontWeight: 'bold' }}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 text-xs italic">
              Nenhuma peça com defeito registrada.
            </div>
          )}
        </div>
      </div>

      {/* 3. Detailed Defect Analysis by Product */}
      <div className="bg-white p-5 rounded-xl card-shadow border border-slate-100 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <TrendingDown className="w-4 h-4 text-rose-500 animate-pulse" />
              <span>Análise Consolidada de Peças com Defeito (por Produto)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Detalhamento de quantidades e tipos de não conformidades reclamadas nas devoluções de cada cliente.
            </p>
          </div>
          
          {/* Product selector dropdown */}
          {productDefectCodes.length > 0 && (
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-bold text-slate-500 uppercase shrink-0">Filtrar SKU:</span>
              <select
                id="dashboard-defect-product-sku-select"
                value={activeProductCode}
                onChange={(e) => setSelectedProductCode(e.target.value)}
                className="px-3 py-1.5 border border-slate-250 rounded-lg text-xs font-semibold bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 shrink-0 cursor-pointer"
              >
                {productDefectList.map((p) => (
                  <option key={p.productCode} value={p.productCode}>
                    📦 {p.productName} ({p.totalDefective} un)
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {activeProduct ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Recharts Bar Chart */}
            <div className="lg:col-span-7 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase">Gráficos de Proporção por Categoria de Defeito</span>
                <span className="text-[10px] bg-red-50 text-red-650 font-bold px-2.5 py-0.5 rounded-full border border-red-100">
                  Total Avaliado: {activeProduct.totalDefective} un
                </span>
              </div>
              
              <div className="h-64 bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={activeProduct.defectsList}
                    margin={{ top: 10, right: 30, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                    <XAxis type="number" fontSize={10} stroke="#64748b" />
                    <YAxis
                      dataKey="description"
                      type="category"
                      width={160}
                      fontSize={10}
                      stroke="#475569"
                      tickFormatter={(text) => text && text.length > 25 ? text.substring(0, 22) + '...' : text}
                    />
                    <Tooltip
                      formatter={(value) => [`${value} unidades`, 'Não Conformidade']}
                      contentStyle={{ fontSize: 11, borderRadius: 8 }}
                    />
                    <Bar
                      dataKey="quantity"
                      name="Peças Danificadas"
                      fill="#f43f5e"
                      radius={[0, 4, 4, 0]}
                      barSize={15}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Right: Textual listing resembling the specific example format */}
            <div className="lg:col-span-5 flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-150">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Produto sob Inspeção</span>
                  <span className="font-bold text-xs text-slate-800 block mt-0.5 truncate">{activeProduct.productName}</span>
                  <span className="text-[10px] font-mono text-slate-500 mt-1 block">Rastreabilidade SKU: {activeProduct.productCode}</span>
                </div>

                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-2">
                    Lançamentos de Devolução Relacionados:
                  </span>
                  
                  {/* Detailed list box mapping the required "10 peças - mau contato" string format */}
                  <div className="border border-slate-150 rounded-xl overflow-hidden divide-y divide-slate-150 bg-white shadow-3xs max-h-40 overflow-y-auto">
                    {activeProduct.defectsList.map((d, index) => (
                      <div key={d.id || index} className="p-2.5 flex items-center justify-between hover:bg-slate-50/50 transition-all text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="w-5 h-5 rounded-full bg-slate-100 border border-slate-200 text-slate-600 font-mono text-[9px] flex items-center justify-center font-bold shrink-0">
                            {index + 1}
                          </span>
                          <span className="text-slate-600 font-medium truncate">{d.description}</span>
                        </div>
                        <span className="font-mono font-bold text-rose-600 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded text-[10px] shrink-0">
                          {d.quantity} un
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Specific formatted example block mimicking user input style */}
              <div className="p-3 bg-blue-50/60 border border-blue-100 rounded-xl text-blue-950 text-xs">
                <span className="font-bold uppercase tracking-wider text-[9px] text-blue-600 block mb-1">
                  Resumo Romaneio de Devolução (Conforme SAC):
                </span>
                <p className="font-mono text-[10px] leading-relaxed bg-white p-2 rounded-lg border border-blue-100/60 font-semibold select-all text-wrap break-all">
                  {activeProduct.defectsList.map((d) => `${d.quantity} peças - ${d.description.toLowerCase()}`).join(' / ')}
                </p>
                <span className="text-[9px] text-blue-500 italic block mt-1">
                  💡 Selecione o texto acima para copiar a descrição de faturamento das peças descartadas.
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="h-44 flex items-center justify-center text-slate-400 text-xs italic">
            Nenhum produto com defeito cadastrado sob o filtro selecionado.
          </div>
        )}
      </div>
    </div>
  );
};
