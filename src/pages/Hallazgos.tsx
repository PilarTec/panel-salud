import TopFilters from '../components/shared/TopFilters';
import KPICards from '../components/dashboard/KPICards';
import { useData } from '../context/DataContext';
import { Card, Title, Text } from '@tremor/react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Legend, LabelList } from 'recharts';
import { CATEGORIAS_HALLAZGOS } from '../services/excelParser';
import { Check } from 'lucide-react';
import LoadingScreen from '../components/shared/LoadingScreen';

const RISK_COLORS: Record<string, string> = {
  'Bajo': '#22c55e',
  'Medio': '#eab308',
  'Alto': '#f97316',
  'Crítico': '#ef4444'
};

const CATEGORY_COLORS: Record<string, string> = {
  'Oftalmológicos': '#3b82f6',
  'Metabólicos': '#eab308',
  'Cardiovasculares': '#ef4444',
  'Hematológicos': '#991b1b',
  'Musculoesqueléticos': '#22c55e',
  'Auditivos': '#14b8a6',
  'Otros': '#64748b'
};

const getColorForCategory = (name: string, index: number) => {
  if (CATEGORY_COLORS[name]) return CATEGORY_COLORS[name];
  const fallback = ['#8b5cf6', '#ec4899', '#06b6d4', '#f59e0b', '#84cc16'];
  return fallback[index % fallback.length];
};

export default function Hallazgos() {
  const { isDataLoaded, isLoadingGlobal, chartsData, filteredData } = useData();

  // Preparar datos para gráficos
  const { hallazgosPorCategoria, hallazgosPorRiesgo, statsHallazgos } = chartsData;
  const totalCat = hallazgosPorCategoria.reduce((acc, curr) => acc + curr.value, 0);
  const totalRiesgo = hallazgosPorRiesgo.reduce((acc, curr) => acc + curr.value, 0);
  const trabajadoresConHallazgos = filteredData.filter(r => r.hallazgos_seleccionados && r.hallazgos_seleccionados.length > 0).length;

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-CL').format(num);
  };
  const formatPercent = (value: number, total: number) => {
    if (total === 0) return '0,0%';
    return ((value / total) * 100).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%';
  };

  const altoCriticoPercent = statsHallazgos.total > 0 
    ? ((statsHallazgos.hallazgosAltoCritico / statsHallazgos.total) * 100).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + '%'
    : '0,0%';

  // Calcular hallazgos críticos para la tabla
  const criticalFindingsMap = new Map<string, { categoria: string, count: number }>();
  filteredData.forEach(r => {
    if (r.hallazgos_seleccionados) {
      r.hallazgos_seleccionados.forEach(h => {
        if (h.nivel_riesgo === 'Crítico') {
          const key = h.hallazgo;
          if (!criticalFindingsMap.has(key)) {
            // Find category
            let catName = 'Otros';
            for (const cat of CATEGORIAS_HALLAZGOS) {
              if (cat.opciones.includes(key)) {
                catName = cat.nombre;
                break;
              }
            }
            criticalFindingsMap.set(key, { categoria: catName, count: 0 });
          }
          criticalFindingsMap.get(key)!.count += 1;
        }
      });
    }
  });

  const criticalFindings = Array.from(criticalFindingsMap.entries())
    .map(([hallazgo, data]) => ({ hallazgo, categoria: data.categoria, count: data.count }))
    .sort((a, b) => b.count - a.count);

  const totalCritical = criticalFindings.reduce((sum, item) => sum + item.count, 0);

  // Calcular Hallazgos por Grupo Etario
  const getAge = (nacimiento: string | null): number | null => {
    if (!nacimiento) return null;
    const parts = nacimiento.split(/[-/]/);
    if (parts.length === 3) {
      let year = parts[2];
      if (year.length === 2) {
        year = parseInt(year, 10) > 40 ? `19${year}` : `20${year}`;
      }
      if (parts[0].length === 4) year = parts[0];
      return new Date().getFullYear() - parseInt(year, 10);
    }
    const d = new Date(nacimiento);
    if (!isNaN(d.getTime())) return new Date().getFullYear() - d.getFullYear();
    return null;
  };

  const etarioGroups = [
    { label: '< 25 años', min: 0, max: 24, total: 0, bajo: 0, medio: 0, alto: 0, critico: 0 },
    { label: '25 - 34 años', min: 25, max: 34, total: 0, bajo: 0, medio: 0, alto: 0, critico: 0 },
    { label: '35 - 44 años', min: 35, max: 44, total: 0, bajo: 0, medio: 0, alto: 0, critico: 0 },
    { label: '45 - 54 años', min: 45, max: 54, total: 0, bajo: 0, medio: 0, alto: 0, critico: 0 },
    { label: '≥ 55 años', min: 55, max: 200, total: 0, bajo: 0, medio: 0, alto: 0, critico: 0 },
    { label: 'Desconocido', min: -1, max: -1, total: 0, bajo: 0, medio: 0, alto: 0, critico: 0 },
  ];

  filteredData.forEach(r => {
    if (r.hallazgos_seleccionados && r.hallazgos_seleccionados.length > 0) {
      const age = getAge(r.fecha_nacimiento);
      const group = etarioGroups.find(g => age !== null ? (age >= g.min && age <= g.max) : g.label === 'Desconocido') || etarioGroups[5];
      
      r.hallazgos_seleccionados.forEach(h => {
        group.total += 1;
        if (h.nivel_riesgo === 'Bajo') group.bajo += 1;
        else if (h.nivel_riesgo === 'Medio') group.medio += 1;
        else if (h.nivel_riesgo === 'Alto') group.alto += 1;
        else if (h.nivel_riesgo === 'Crítico') group.critico += 1;
      });
    }
  });

  const activeEtarioGroups = etarioGroups.filter(g => g.total > 0);
  const totalHallazgosEtario = activeEtarioGroups.reduce((acc, curr) => acc + curr.total, 0);

  // Totales de la tabla Top 5

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopFilters />
      <main className="px-6 py-4 bg-slate-50 flex-1 overflow-y-auto custom-scrollbar">
        {isLoadingGlobal ? (
          <LoadingScreen />
        ) : !isDataLoaded ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-16 h-16 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-4">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <h2 className="text-xl font-bold text-slate-800 mb-2">No hay datos cargados</h2>
            <p className="text-slate-500 max-w-md">
              Para comenzar, dirígete a la sección de <strong>Administración &gt; Carga de Excel</strong> en el menú lateral y sube el archivo con el consolidado del mes.
            </p>
          </div>
        ) : (
          <div className="max-w-[1600px] mx-auto w-full">
            {/* KPI Cards */}
            <div className="mb-4">
              <KPICards />
            </div>

            {/* Espacio para gráficos específicos de hallazgos */}
            <div className="flex flex-col gap-4 pb-6">
              
              {/* FILA 1: Distribución, Riesgo, Tiempo */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <Card className="col-span-1 p-3 ring-0 border border-slate-200 shadow-sm h-[180px] flex flex-col rounded-xl">
                  <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-1">DISTRIBUCIÓN DE HALLAZGOS POR CATEGORÍA DE SALUD</Title>
                  <Text className="text-[9px] text-slate-500 mb-2">% del total de hallazgos</Text>
                  <div className="flex-1 flex items-center h-full">
                    <div className="w-[80px] h-[80px] relative shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={hallazgosPorCategoria}
                            cx="50%"
                            cy="50%"
                            innerRadius={28}
                            outerRadius={40}
                            paddingAngle={2}
                            dataKey="value"
                            stroke="none"
                          >
                            {hallazgosPorCategoria.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={getColorForCategory(entry.name, index)} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: number) => [`${formatNumber(value)} (${formatPercent(value, totalCat)})`, 'Hallazgos']}
                            contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-sm font-bold text-slate-800 leading-none">{formatNumber(totalCat)}</span>
                      </div>
                    </div>
                    <div className="flex-1 ml-3 overflow-y-auto pr-1 max-h-[120px] space-y-1.5 scrollbar-thin scrollbar-thumb-slate-200">
                      {hallazgosPorCategoria.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-[9px]">
                          <div className="flex items-center gap-1.5 truncate">
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: getColorForCategory(item.name, idx) }}></span>
                            <span className="text-slate-600 truncate" title={item.name}>{item.name}</span>
                          </div>
                          <div className="flex items-center gap-1 shrink-0 ml-1">
                            <span className="font-semibold text-slate-700">{formatNumber(item.value)}</span>
                            <span className="text-slate-400 text-[8px] w-7 text-right">({formatPercent(item.value, totalCat)})</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>
                <Card className="col-span-1 p-3 ring-0 border border-slate-200 shadow-sm h-[180px] flex flex-col rounded-xl">
                  <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-1">HALLAZGOS POR NIVEL DE RIESGO</Title>
                  <Text className="text-[9px] text-slate-500 mb-1">Según impacto en la salud</Text>
                  <div className="flex-1 flex flex-col justify-between h-full">
                    <div className="flex items-center mt-1">
                      <div className="w-[70px] h-[70px] relative shrink-0">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={hallazgosPorRiesgo}
                              cx="50%"
                              cy="50%"
                              innerRadius={24}
                              outerRadius={35}
                              paddingAngle={2}
                              dataKey="value"
                              stroke="none"
                            >
                              {hallazgosPorRiesgo.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={RISK_COLORS[entry.name] || '#94a3b8'} />
                              ))}
                            </Pie>
                            <Tooltip 
                              formatter={(value: number) => [`${formatNumber(value)} (${formatPercent(value, totalRiesgo)})`, 'Hallazgos']}
                              contentStyle={{ borderRadius: '8px', fontSize: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-xs font-bold text-slate-800 leading-none">{formatNumber(totalRiesgo)}</span>
                        </div>
                      </div>
                      <div className="flex-1 ml-4 space-y-1">
                        {hallazgosPorRiesgo.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between text-[9px]">
                            <div className="flex items-center gap-1.5">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: RISK_COLORS[item.name] || '#94a3b8' }}></span>
                              <span className="text-slate-700 font-medium">{item.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="font-bold text-slate-700">{formatNumber(item.value)}</span>
                              <span className="text-slate-500 text-[8px] w-7 text-right">({formatPercent(item.value, totalRiesgo)})</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Tarjetitas inferioes de Riesgo Alto/Critico */}
                    <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-100">
                      <div className="bg-slate-50 rounded p-1 flex flex-col items-center justify-center border border-slate-100">
                        <span className="text-[8px] text-slate-500 mb-0.5">% Alto+Crítico</span>
                        <span className="text-xs font-bold text-slate-700">{altoCriticoPercent}</span>
                      </div>
                      <div className="bg-slate-50 rounded p-1 flex flex-col items-center justify-center border border-slate-100">
                        <span className="text-[8px] text-slate-500 mb-0.5">Trabaj. Alto+Crítico</span>
                        <span className="text-xs font-bold text-slate-700">{statsHallazgos.trabajadoresAltoCritico}</span>
                      </div>
                    </div>
                  </div>
                </Card>
                <Card className="col-span-1 lg:col-span-2 p-4 ring-0 border border-slate-200 shadow-sm h-[180px] flex flex-col rounded-xl relative">
                  <div className="absolute top-3 left-4">
                    <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-1">HALLAZGOS EN EL TIEMPO</Title>
                    <Text className="text-[9px] text-slate-500">Últimos 12 meses</Text>
                  </div>
                  <div className="flex-1 mt-6">
                    <ResponsiveContainer width="100%" height="100%">
                      <ComposedChart data={chartsData.hallazgosEnElTiempo} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis 
                          dataKey="periodo" 
                          tickFormatter={(val) => {
                            try {
                              const d = new Date(val + '-01T12:00:00');
                              return d.toLocaleDateString('es-ES', { month: 'short' }).replace('.', '').replace(/^\w/, c => c.toUpperCase());
                            } catch (e) { return val; }
                          }}
                          tick={{ fontSize: 9, fill: '#64748b' }} 
                          axisLine={false} 
                          tickLine={false} 
                        />
                        <YAxis tick={{ fontSize: 9, fill: '#64748b' }} axisLine={false} tickLine={false} tickCount={5} />
                        <Tooltip 
                          contentStyle={{ borderRadius: '8px', fontSize: '11px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                          labelFormatter={(label) => `Periodo: ${label}`}
                        />
                        <Legend 
                          wrapperStyle={{ fontSize: '9px', top: -24, right: 0 }} 
                          iconType="circle" 
                          iconSize={6}
                          verticalAlign="top"
                          align="right"
                        />
                        <Bar dataKey="Crítico" stackId="a" fill="#ef4444" barSize={16} />
                        <Bar dataKey="Alto" stackId="a" fill="#f97316" />
                        <Bar dataKey="Medio" name="Moderado" stackId="a" fill="#eab308" />
                        <Bar dataKey="Bajo" stackId="a" fill="#22c55e">
                          <LabelList 
                            dataKey="Total" 
                            position="top" 
                            offset={4} 
                            style={{ fontSize: '10px', fontWeight: 'bold', fill: '#1e293b' }} 
                            formatter={(val: number) => val > 0 ? val : ''}
                          />
                        </Bar>
                        <Line type="monotone" dataKey="Total" stroke="#94a3b8" strokeDasharray="3 3" dot={false} strokeWidth={1.5} name="Tendencia" />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>

              {/* FILA 2: Top 10, Sede/Base, Gestión, Filtros */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <Card className="col-span-1 lg:col-span-6 p-4 ring-0 border border-slate-200 shadow-sm h-[260px] flex flex-col rounded-xl overflow-hidden">
                  <Title className="text-[11px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-4 shrink-0">
                    HALLAZGOS MÁS FRECUENTES <span className="text-slate-400 font-normal normal-case">(Top 5)</span>
                  </Title>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-[10px] whitespace-nowrap">
                      <thead className="sticky top-0 bg-white z-10">
                        <tr className="border-b border-slate-200 text-slate-700 font-bold">
                          <th className="pb-2 font-bold w-[25%]">Hallazgo</th>
                          <th className="pb-2 font-bold w-[25%]">Categoría</th>
                          <th className="pb-2 font-bold w-[20%]">N° hallazgos</th>
                          <th className="pb-2 text-right font-bold">% del total</th>
                          <th className="pb-2 text-center font-bold">Trabajadores</th>
                          <th className="pb-2 text-right font-bold">% de afectados</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600 font-medium">
                        {chartsData.hallazgosFrecuentes.map((item, idx) => {
                          const pctTotal = statsHallazgos.total > 0 ? (item.value / statsHallazgos.total) * 100 : 0;
                          const pctAfectados = filteredData.length > 0 ? (item.trabajadores / filteredData.length) * 100 : 0;
                          const maxVal = chartsData.hallazgosFrecuentes[0]?.value || 1;
                          const barWidth = (item.value / maxVal) * 100;
                          return (
                            <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                              <td className="py-2 pr-2 text-slate-700 font-semibold truncate max-w-[140px]" title={item.name}>{item.name}</td>
                              <td className="py-2 pr-2 truncate max-w-[120px]" title={item.categoria}>{item.categoria}</td>
                              <td className="py-2 pr-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800 w-6 text-right">{item.value}</span>
                                  <div className="h-2 bg-emerald-500 rounded-sm" style={{ width: `${barWidth}%`, minWidth: '4px' }}></div>
                                </div>
                              </td>
                              <td className="py-2 text-right">{pctTotal.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</td>
                              <td className="py-2 text-center">{formatNumber(item.trabajadores)}</td>
                              <td className="py-2 text-right">{pctAfectados.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
                <Card className="col-span-1 lg:col-span-6 p-4 ring-0 border border-slate-200 shadow-sm h-[260px] flex flex-col rounded-xl overflow-hidden">
                  <Title className="text-[11px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-4 shrink-0">HALLAZGOS POR DIVISIÓN</Title>
                  <div className="flex-1 overflow-auto">
                    <table className="w-full text-left text-[10px] whitespace-nowrap relative">
                      <thead className="sticky top-0 bg-white z-10 shadow-sm">
                        <tr className="border-b border-slate-200 text-slate-700 font-bold">
                          <th className="pb-2 font-bold w-[35%]">División</th>
                          <th className="pb-2 font-bold w-[30%]">N° hallazgos</th>
                          <th className="pb-2 text-right font-bold w-[15%]">% del total</th>
                          <th className="pb-2 text-center font-bold w-[20%]">Trabajadores afectados</th>
                        </tr>
                      </thead>
                      <tbody className="text-slate-600 font-medium">
                        {chartsData.hallazgosPorDivision.map((item, idx) => {
                          const pctTotal = statsHallazgos.total > 0 ? (item.value / statsHallazgos.total) * 100 : 0;
                          const maxVal = chartsData.hallazgosPorDivision[0]?.value || 1;
                          const barWidth = (item.value / maxVal) * 100;
                          return (
                            <tr key={idx} className="border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors">
                              <td className="py-2 pr-2 text-slate-700 font-semibold truncate max-w-[150px]" title={item.name}>{item.name}</td>
                              <td className="py-2 pr-4">
                                <div className="flex items-center gap-2">
                                  <span className="font-bold text-slate-800 w-8 text-right">{item.value}</span>
                                  <div className="h-2 bg-emerald-500 rounded-sm" style={{ width: `${barWidth}%`, minWidth: '4px' }}></div>
                                </div>
                              </td>
                              <td className="py-2 text-right">{pctTotal.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</td>
                              <td className="py-2 text-center">{formatNumber(item.trabajadores)}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                      <tfoot className="sticky bottom-0 bg-white z-10 shadow-[0_-2px_4px_rgba(0,0,0,0.02)]">
                        <tr className="border-t border-slate-200 text-slate-800 font-bold">
                          <td className="py-2.5 uppercase text-[11px] bg-slate-50">TOTAL</td>
                          <td className="py-2.5 font-bold text-slate-800 pl-4 bg-slate-50">{formatNumber(statsHallazgos.total)}</td>
                          <td className="py-2.5 text-right font-bold text-slate-800 bg-slate-50">100,0%</td>
                          <td className="py-2.5 text-center font-bold text-slate-800 bg-slate-50">{formatNumber(trabajadoresConHallazgos)}**</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                  <Text className="text-[9px] text-slate-400 mt-2 shrink-0 font-medium">** Trabajadores únicos afectados</Text>
                </Card>
              </div>

              {/* FILA 3: Críticos, Grupo Etario, Género */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Card className="col-span-1 p-3 ring-0 border-l-4 border-l-red-500 border-y-slate-200 border-r-slate-200 shadow-sm min-h-[160px] flex flex-col rounded-xl bg-red-50/10">
                  <Title className="text-[10px] font-bold text-red-700 uppercase tracking-tight flex items-center gap-1.5 mb-1 leading-none shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                    HALLAZGOS CRÍTICOS
                  </Title>
                  <Text className="text-[9px] text-red-500/80 mb-2 font-medium shrink-0">(Requieren atención prioritaria)</Text>
                  
                  <div className="flex-1 overflow-auto bg-white rounded border border-red-100">
                    {criticalFindings.length > 0 ? (
                      <table className="w-full text-left text-[9px] whitespace-nowrap relative">
                        <thead className="sticky top-0 bg-red-50/50 z-10 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
                          <tr className="border-b border-red-100 text-slate-700 font-bold">
                            <th className="py-2 px-2 font-bold w-[45%]">Hallazgo</th>
                            <th className="py-2 px-2 font-bold w-[25%]">Categoría</th>
                            <th className="py-2 px-2 text-center font-bold w-[15%]">Trabajadores</th>
                            <th className="py-2 px-2 text-right font-bold w-[15%]">% del total</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-600 font-medium">
                          {criticalFindings.map((item, idx) => {
                            const pctTotal = filteredData.length > 0 ? (item.count / filteredData.length) * 100 : 0;
                            return (
                              <tr key={idx} className="border-b border-red-50 last:border-0 hover:bg-slate-50 transition-colors">
                                <td className="py-2 px-2 text-slate-700 font-semibold truncate max-w-[120px]" title={item.hallazgo}>{item.hallazgo}</td>
                                <td className="py-2 px-2 truncate max-w-[80px]" title={item.categoria}>{item.categoria}</td>
                                <td className="py-2 px-2 text-center">{formatNumber(item.count)}</td>
                                <td className="py-2 px-2 text-right">{pctTotal.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="sticky bottom-0 bg-red-50/80 z-10 shadow-[0_-1px_2px_rgba(0,0,0,0.02)] border-t border-red-100">
                          <tr className="text-slate-800 font-bold">
                            <td className="py-2 px-2 uppercase text-[10px]">TOTAL</td>
                            <td className="py-2 px-2"></td>
                            <td className="py-2 px-2 text-center font-bold text-slate-800">{formatNumber(totalCritical)}</td>
                            <td className="py-2 px-2 text-right font-bold text-slate-800">
                              {filteredData.length > 0 ? ((totalCritical / filteredData.length) * 100).toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 }) : '0,0'}%
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    ) : (
                      <div className="flex-1 h-full flex flex-col items-center justify-center p-4">
                        <Check className="w-6 h-6 text-emerald-400 mb-1" />
                        <span className="text-[10px] text-slate-500 font-medium">No se detectaron hallazgos críticos</span>
                      </div>
                    )}
                  </div>
                </Card>
                <Card className="col-span-1 p-3 ring-0 border border-slate-200 shadow-sm min-h-[160px] flex flex-col rounded-xl overflow-hidden">
                  <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-3 shrink-0">HALLAZGOS POR GRUPO ETARIO</Title>
                  <div className="flex-1 overflow-auto bg-white">
                    {activeEtarioGroups.length > 0 ? (
                      <table className="w-full text-left text-[9px] whitespace-nowrap">
                        <thead className="sticky top-0 bg-white z-10">
                          <tr className="border-b border-slate-100 text-slate-700 font-bold">
                            <th className="py-2 pr-2 font-bold w-[20%]">Grupo etario</th>
                            <th className="py-2 px-2 text-center font-bold w-[15%]">N° hallazgos</th>
                            <th className="py-2 px-2 text-right font-bold w-[15%]">% del total</th>
                            <th className="py-2 pl-4 text-center font-bold text-slate-400 text-[8px] tracking-wide">
                              <div className="flex justify-between w-full max-w-[200px]">
                                <span>Bajo</span>
                                <span>Moderado</span>
                                <span>Alto</span>
                                <span>Crítico</span>
                              </div>
                            </th>
                            <th className="py-2 px-1 text-center font-bold w-[5%]">Alto</th>
                            <th className="py-2 px-1 text-center font-bold w-[5%]">Crítico</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-600 font-medium">
                          {activeEtarioGroups.map((group, idx) => {
                            const pctTotal = (group.total / totalHallazgosEtario) * 100;
                            const pctBajo = (group.bajo / group.total) * 100;
                            const pctMedio = (group.medio / group.total) * 100;
                            const pctAlto = (group.alto / group.total) * 100;
                            const pctCritico = (group.critico / group.total) * 100;
                            return (
                              <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                <td className="py-2 pr-2 text-slate-700">{group.label}</td>
                                <td className="py-2 px-2 text-center">{formatNumber(group.total)}</td>
                                <td className="py-2 px-2 text-right">{pctTotal.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</td>
                                <td className="py-2 pl-4">
                                  <div className="flex h-3 w-full max-w-[200px] rounded-sm overflow-hidden bg-slate-100">
                                    {pctBajo > 0 && <div style={{ width: `${pctBajo}%` }} className="bg-emerald-500 h-full border-r border-white/20"></div>}
                                    {pctMedio > 0 && <div style={{ width: `${pctMedio}%` }} className="bg-amber-500 h-full border-r border-white/20"></div>}
                                    {pctAlto > 0 && <div style={{ width: `${pctAlto}%` }} className="bg-orange-500 h-full border-r border-white/20"></div>}
                                    {pctCritico > 0 && <div style={{ width: `${pctCritico}%` }} className="bg-red-500 h-full"></div>}
                                  </div>
                                </td>
                                <td className="py-2 px-1 text-center font-semibold text-slate-700">{Math.round(pctAlto)}%</td>
                                <td className="py-2 px-1 text-center font-semibold text-slate-700">{Math.round(pctCritico)}%</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="sticky bottom-0 bg-white z-10 border-t border-slate-100">
                          <tr className="text-slate-800 font-bold">
                            <td className="py-2 pr-2 uppercase text-[10px]">TOTAL</td>
                            <td className="py-2 px-2 text-center">{formatNumber(totalHallazgosEtario)}</td>
                            <td className="py-2 px-2 text-right">100%</td>
                            <td colSpan={3}></td>
                          </tr>
                        </tfoot>
                      </table>
                    ) : (
                      <div className="flex-1 h-full flex flex-col items-center justify-center p-4">
                        <span className="text-[10px] text-slate-500 font-medium">No hay datos</span>
                      </div>
                    )}
                  </div>
                </Card>
                <Card className="col-span-1 p-3 ring-0 border border-slate-200 shadow-sm min-h-[160px] flex flex-col rounded-xl">
                  <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-3">HALLAZGOS POR GÉNERO</Title>
                  <div className="flex-1 overflow-auto">
                    {chartsData.hallazgosPorGenero.length > 0 ? (
                      <table className="w-full text-left text-[10px] whitespace-nowrap relative">
                        <thead className="sticky top-0 bg-white z-10">
                          <tr className="border-b border-slate-100 text-slate-700 font-bold">
                            <th className="py-2 px-2 font-bold w-[30%]">Género</th>
                            <th className="py-2 px-2 text-center font-bold w-[25%]">N° hallazgos</th>
                            <th className="py-2 px-2 text-right font-bold w-[20%]">% del total</th>
                            <th className="py-2 px-2 text-center font-bold w-[25%]">Trabajadores afectados</th>
                          </tr>
                        </thead>
                        <tbody className="text-slate-600 font-medium">
                          {chartsData.hallazgosPorGenero.map((item, idx) => {
                            const pctTotal = statsHallazgos.total > 0 ? (item.value / statsHallazgos.total) * 100 : 0;
                            const isHombres = item.name === 'Hombres';
                            const isMujeres = item.name === 'Mujeres';
                            return (
                              <tr key={idx} className="border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors">
                                <td className="py-2 px-2">
                                  <div className="flex items-center gap-2">
                                    {isHombres ? (
                                      <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center shrink-0">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 1 0 0-10 5 5 0 0 0 0 10Z"/><path d="M13.5 10.5 21 3"/><path d="M16 3h5v5"/></svg>
                                      </div>
                                    ) : isMujeres ? (
                                      <div className="w-5 h-5 rounded-full bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-200 flex items-center justify-center shrink-0">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="10" r="5"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="9" y1="19" x2="15" y2="19"/></svg>
                                      </div>
                                    ) : (
                                      <div className="w-5 h-5 rounded-full bg-slate-50 text-slate-500 border border-slate-200 flex items-center justify-center shrink-0">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
                                      </div>
                                    )}
                                    <span className="text-slate-700 font-semibold">{item.name}</span>
                                  </div>
                                </td>
                                <td className="py-2 px-2 text-center">{formatNumber(item.value)}</td>
                                <td className="py-2 px-2 text-right">{pctTotal.toLocaleString('es-CL', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%</td>
                                <td className="py-2 px-2 text-center">{formatNumber(item.trabajadores)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot className="sticky bottom-0 bg-slate-50 z-10 shadow-[0_-2px_4px_rgba(0,0,0,0.02)]">
                          <tr className="border-t border-slate-200 text-slate-800 font-bold">
                            <td className="py-2.5 px-2 uppercase text-[11px]">TOTAL</td>
                            <td className="py-2.5 px-2 text-center">{formatNumber(statsHallazgos.total)}</td>
                            <td className="py-2.5 px-2 text-right">100%</td>
                            <td className="py-2.5 px-2 text-center">{formatNumber(trabajadoresConHallazgos)}**</td>
                          </tr>
                        </tfoot>
                      </table>
                    ) : (
                      <div className="flex-1 h-full flex flex-col items-center justify-center p-4">
                        <span className="text-[10px] text-slate-500 font-medium">No hay datos</span>
                      </div>
                    )}
                  </div>
                </Card>
              </div>


            </div>
          </div>
        )}
      </main>
    </div>
  );
}
