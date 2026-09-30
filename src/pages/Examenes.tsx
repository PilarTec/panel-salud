import TopFilters from '../components/shared/TopFilters';
import KPICards from '../components/dashboard/KPICards';
import { useData } from '../context/DataContext';
import LoadingScreen from '../components/shared/LoadingScreen';
import { Card, Title, Text, Flex, BarList, DonutChart, LineChart } from '@tremor/react';

export default function Examenes() {
  const { isDataLoaded, isLoadingGlobal, chartsData, kpis, filteredData } = useData();
  const donutColors = ['emerald', 'blue', 'amber', 'purple', 'cyan', 'red', 'rose', 'slate'];
  const totalRealizados = kpis?.realizados?.total || 1;
  const pendientesCount = Math.max(0, (kpis?.realizados?.total || 0) - (kpis?.realizados?.valor || 0));

  const MESES: Record<string, string> = {
    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr', '05': 'May', '06': 'Jun',
    '07': 'Jul', '08': 'Ago', '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
  };
  const MESES_FULL: Record<string, string> = {
    '01': 'Enero', '02': 'Febrero', '03': 'Marzo', '04': 'Abril', '05': 'Mayo', '06': 'Junio',
    '07': 'Julio', '08': 'Agosto', '09': 'Septiembre', '10': 'Octubre', '11': 'Noviembre', '12': 'Diciembre'
  };

  let maxPeriod = '';
  if (filteredData && filteredData.length > 0) {
    maxPeriod = filteredData.reduce((max, row) => (row.periodo && row.periodo > max ? row.periodo : max), '');
  }

  let currentSubtitle = 'Mes Actual';
  let currentHeader = 'Mes Actual';
  let prevHeader = 'Mes Anterior';

  if (maxPeriod && maxPeriod.includes('-')) {
    const [anio, mes] = maxPeriod.split('-');
    currentSubtitle = `${MESES_FULL[mes] || mes} ${anio}`;
    currentHeader = `${MESES[mes] || mes} ${anio}`;
    
    let prevMesNum = parseInt(mes) - 1;
    let prevAnioNum = parseInt(anio);
    if (prevMesNum === 0) {
      prevMesNum = 12;
      prevAnioNum -= 1;
    }
    const prevMesStr = prevMesNum.toString().padStart(2, '0');
    prevHeader = `${MESES[prevMesStr] || prevMesStr} ${prevAnioNum}`;
  }

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

            {/* Grid de Gráficos (Vacíos) */}
            <div className="flex flex-col gap-4 pb-6">
              
              {/* FILA 1 */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <Card className="col-span-1 p-4 ring-0 border border-slate-200 shadow-sm h-[220px] flex flex-col rounded-xl">
                  <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight mb-0.5 leading-none">
                    COBERTURA DE EXÁMENES OCUPACIONALES
                  </Title>
                  <Text className="text-[9px] text-slate-500 mb-3 leading-none">
                    CANTIDAD ABSOLUTA POR TIPO DE EXAMEN
                  </Text>
                  
                  <Flex className="mb-1.5">
                    <Text className="text-[9px] font-semibold text-slate-500 uppercase">Tipo de Examen</Text>
                    <Text className="text-[9px] font-semibold text-slate-500 uppercase">Cantidad</Text>
                  </Flex>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1">
                    <BarList 
                      data={chartsData.tipoExamen} 
                      color="emerald"
                      valueFormatter={(number: number) => Intl.NumberFormat('es-CL').format(number)}
                      className="[&_p]:text-[10px] [&_p]:font-medium mt-2"
                    />
                  </div>
                </Card>
                
                <Card className="col-span-1 p-4 ring-0 border border-slate-200 shadow-sm h-[220px] flex flex-col rounded-xl">
                  <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-4">
                    EXÁMENES POR TIPO
                  </Title>
                  <div className="flex-1 flex items-center justify-between">
                    <div className="w-1/2 flex justify-center h-full items-center relative">
                      <DonutChart
                        data={chartsData.tipoExamen}
                        category="value"
                        index="name"
                        colors={donutColors as any}
                        className="w-32 h-32"
                        variant="donut"
                        showAnimation={true}
                        showTooltip={true}
                        showLabel={false}
                        valueFormatter={(number: number) => Intl.NumberFormat('es-CL').format(number)}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-sm font-bold text-slate-800 leading-none">{Intl.NumberFormat('es-CL').format(totalRealizados)}</span>
                        <span className="text-[8px] text-slate-500 mt-0.5">Total realizados</span>
                      </div>
                    </div>
                    
                    <div className="w-1/2 flex flex-col justify-center pl-2 h-full">
                      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1.5 flex flex-col justify-center">
                        {chartsData.tipoExamen.map((item: any, idx: number) => {
                          const pct = ((item.value / totalRealizados) * 100).toFixed(1).replace('.', ',');
                          const colorMap: Record<string, string> = {
                            emerald: 'bg-emerald-500', blue: 'bg-blue-500', amber: 'bg-amber-500', 
                            purple: 'bg-purple-500', cyan: 'bg-cyan-500', red: 'bg-red-500', 
                            rose: 'bg-rose-500', slate: 'bg-slate-500'
                          };
                          const colorClass = colorMap[donutColors[idx % donutColors.length]] || 'bg-slate-500';
                          return (
                            <div key={idx} className="flex items-center justify-between text-[9px]">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${colorClass}`}></span>
                                <span className="text-slate-600 truncate" title={item.name}>{item.name}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                <span className="text-slate-700">{Intl.NumberFormat('es-CL').format(item.value)}</span>
                                <span className="text-slate-400 text-[8px] w-7 text-right">({pct}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Card>
                
                <Card className="col-span-1 p-4 ring-0 border border-slate-200 shadow-sm h-[220px] flex flex-col rounded-xl">
                  <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-4">
                    ESTADO DE APTITUD
                  </Title>
                  <div className="flex-1 flex items-center justify-between">
                    <div className="w-1/2 flex justify-center h-full items-center relative">
                      <DonutChart
                        data={chartsData.distribucionAptitud}
                        category="value"
                        index="name"
                        colors={donutColors as any}
                        className="w-32 h-32"
                        variant="donut"
                        showAnimation={true}
                        showTooltip={true}
                        showLabel={false}
                        valueFormatter={(number: number) => Intl.NumberFormat('es-CL').format(number)}
                      />
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-sm font-bold text-slate-800 leading-none">{Intl.NumberFormat('es-CL').format(totalRealizados)}</span>
                        <span className="text-[8px] text-slate-500 mt-0.5">Total realizados</span>
                      </div>
                    </div>
                    
                    <div className="w-1/2 flex flex-col justify-center pl-2 h-full">
                      <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-1.5 flex flex-col justify-center">
                        {chartsData.distribucionAptitud.map((item: any, idx: number) => {
                          const pct = ((item.value / totalRealizados) * 100).toFixed(1).replace('.', ',');
                          const colorMap: Record<string, string> = {
                            emerald: 'bg-emerald-500', blue: 'bg-blue-500', amber: 'bg-amber-500', 
                            purple: 'bg-purple-500', cyan: 'bg-cyan-500', red: 'bg-red-500', 
                            rose: 'bg-rose-500', slate: 'bg-slate-500'
                          };
                          const colorClass = colorMap[donutColors[idx % donutColors.length]] || 'bg-slate-500';
                          return (
                            <div key={idx} className="flex items-center justify-between text-[9px]">
                              <div className="flex items-center gap-1.5 truncate">
                                <span className={`w-2 h-2 rounded-full shrink-0 ${colorClass}`}></span>
                                <span className="text-slate-600 truncate" title={item.name}>{item.name}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 ml-1">
                                <span className="text-slate-700">{Intl.NumberFormat('es-CL').format(item.value)}</span>
                                <span className="text-slate-400 text-[8px] w-7 text-right">({pct}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </Card>

                <Card className="col-span-1 p-4 ring-0 border border-slate-200 shadow-sm h-[220px] flex flex-col rounded-xl">
                  <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-1">
                    VARIACIÓN VS PERÍODO ANTERIOR
                  </Title>
                  <Text className="text-[9px] text-slate-500 font-medium mb-3 leading-none">
                    {currentSubtitle}
                  </Text>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 text-[9px] font-bold text-slate-700">
                          <th className="pb-1.5 font-bold">Indicador</th>
                          <th className="pb-1.5 text-center font-bold">{currentHeader}</th>
                          <th className="pb-1.5 text-center font-bold">{prevHeader}</th>
                          <th className="pb-1.5 text-center font-bold">Δ</th>
                        </tr>
                      </thead>
                      <tbody className="text-[9px] text-slate-700">
                        {chartsData.distribucionAptitud.map((item: any, idx: number) => (
                          <tr key={idx} className="border-b border-slate-50 last:border-0">
                            <td className="py-1.5 font-semibold text-slate-800">{item.name}</td>
                            <td className="py-1.5 text-center font-medium">{Intl.NumberFormat('es-CL').format(item.value)}</td>
                            <td className="py-1.5 text-center font-medium text-slate-400">-</td>
                            <td className="py-1.5 text-center text-slate-400 font-semibold">-</td>
                          </tr>
                        ))}
                        {chartsData.distribucionAptitud.length === 0 && (
                          <tr>
                            <td colSpan={4} className="py-4 text-center text-slate-400 text-xs">Sin datos disponibles</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>

              {/* FILA 2 */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <Card className="col-span-1 p-4 ring-0 border border-slate-200 shadow-sm h-[260px] flex flex-col rounded-xl">
                  <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight mb-0.5 leading-none">
                    EVOLUCIÓN DE COBERTURA (%)
                  </Title>
                  <Text className="text-[9px] text-slate-500 mb-3 leading-none">
                    ÚLTIMOS 12 MESES
                  </Text>
                  <div className="flex-1 mt-2">
                    <LineChart
                      className="h-full w-full custom-line-chart"
                      data={chartsData.evolucionCobertura}
                      index="periodo"
                      categories={["Cobertura", "Meta"]}
                      colors={["blue", "emerald"]}
                      valueFormatter={(number: number | null) => number !== null && number !== undefined ? `${number}%` : ''}
                      showLegend={true}
                      showYAxis={true}
                      yAxisWidth={35}
                      showGridLines={true}
                    />
                  </div>
                </Card>

                <Card className="col-span-1 p-4 ring-0 border border-slate-200 shadow-sm h-[260px] flex flex-col rounded-xl">
                  <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-3">
                    EXÁMENES POR DIVISIÓN
                  </Title>
                  <div className="flex-1 flex flex-col overflow-hidden mt-1">
                    <div className="flex justify-between items-center text-[9px] font-bold text-slate-700 border-b border-slate-200 pb-1.5 mb-2 shrink-0">
                      <div className="w-32 truncate">División</div>
                      <div className="w-16 text-center truncate">Realizados</div>
                      <div className="flex-1 text-center truncate">Cobertura (%)</div>
                      <div className="w-16 text-center truncate border-l border-slate-200 border-dotted pl-1">Pendientes</div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                      {chartsData.cumplimientoSede.map((item, idx) => {
                        const getColor = (cob: number) => cob >= 95 ? 'bg-emerald-600' : cob >= 93 ? 'bg-amber-500' : 'bg-red-600';
                        return (
                          <div key={idx} className="flex justify-between items-center text-[9px] border-b border-slate-50 pb-1.5 last:border-0">
                            <div className="w-32 font-bold text-slate-700 truncate pr-2 shrink-0">
                              {item.sede.replace(/^Direcci[óo]n de /i, '').replace(/^Direcci[óo]n /i, '')}
                            </div>
                            <div className="w-16 text-center font-medium text-slate-600 shrink-0">
                              {Intl.NumberFormat('es-CL').format(item.realizados)}
                            </div>
                            <div className="flex-1 flex items-center justify-center shrink-0 px-2">
                              <div className="w-full max-w-[80px] h-[7px] bg-slate-100 rounded-full overflow-hidden">
                                <div className={`h-full ${getColor(item.cobertura)} rounded-full`} style={{ width: `${item.cobertura}%` }} />
                              </div>
                            </div>
                            <div className="w-16 text-center font-medium text-slate-600 shrink-0 border-l border-slate-100 border-dotted pl-1">
                              {Intl.NumberFormat('es-CL').format(item.pendientes)}
                            </div>
                          </div>
                        );
                      })}
                      {chartsData.cumplimientoSede.length === 0 && (
                        <div className="text-center text-[10px] text-slate-400 py-4">Sin datos</div>
                      )}
                    </div>
                    
                    <div className="flex justify-between items-center text-[10px] font-bold text-slate-800 bg-slate-50 rounded-lg p-2 mt-2 shrink-0">
                      <div className="w-32 truncate text-blue-900">TOTAL</div>
                      <div className="w-16 text-center text-blue-900">{Intl.NumberFormat('es-CL').format(kpis?.realizados?.valor || 0)}</div>
                      <div className="flex-1 text-center text-blue-900">{kpis?.cobertura?.porcentaje.toFixed(1).replace('.', ',')}%</div>
                      <div className="w-16 text-center text-blue-900">{Intl.NumberFormat('es-CL').format(pendientesCount)}</div>
                    </div>
                  </div>
                </Card>
              </div>

              {/* FILA 3 */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                <Card className="col-span-1 p-4 ring-0 border border-slate-200 shadow-sm h-[220px] flex flex-col rounded-xl">
                  <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-4">
                    EXÁMENES VENCIDOS (ATRASADOS)
                  </Title>
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center text-[9px] font-semibold text-slate-500 uppercase pb-1.5 border-b border-slate-200">
                      <div className="flex-1">Sede / Base</div>
                      <div className="w-10 text-center">Total</div>
                      <div className="w-28 text-center">% sobre programado</div>
                      <div className="w-28 text-center">Días promedio de atraso</div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pt-1 space-y-1">
                      {chartsData.examenesVencidos.length > 0 ? (
                        chartsData.examenesVencidos.map((item: any, idx: number) => (
                          <div key={idx} className="flex items-center text-[10px] py-1 border-b border-slate-50 last:border-0">
                            <div className="flex-1 text-slate-700 font-medium truncate pr-2" title={item.sede}>{item.sede}</div>
                            <div className="w-10 text-center text-slate-700 font-semibold">{item.total}</div>
                            <div className="w-28 flex items-center justify-center gap-1.5">
                              <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                <div 
                                  className={`h-full rounded-full ${item.pctSobreProgramado > 3 ? 'bg-red-500' : item.pctSobreProgramado >= 1 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                  style={{ width: `${Math.min(100, item.pctSobreProgramado * 20)}%` }}
                                />
                              </div>
                              <span className="text-[9px] text-slate-600 font-medium w-7">{item.pctSobreProgramado.toFixed(1).replace('.', ',')}%</span>
                            </div>
                            <div className="w-28 text-center text-slate-600 font-medium">{item.diasPromedio}</div>
                          </div>
                        ))
                      ) : (
                        <div className="h-full flex items-center justify-center text-[10px] text-slate-400">Sin datos</div>
                      )}
                    </div>

                    {chartsData.examenesVencidos.length > 0 && (
                      <div className="flex items-center text-[10px] font-bold text-slate-800 bg-slate-50 rounded-lg p-2 mt-2 shrink-0">
                        <div className="flex-1 text-blue-900">TOTAL</div>
                        <div className="w-10 text-center text-blue-900">{kpis?.vencidos?.valor || 0}</div>
                        <div className="w-28 text-center text-blue-900">{kpis?.vencidos?.porcentaje?.toFixed(1).replace('.', ',') || '0,0'}%</div>
                        <div className="w-28 text-center text-blue-900">
                          {Math.round(chartsData.examenesVencidos.reduce((sum, item) => sum + item.diasPromedio * item.total, 0) / Math.max(1, kpis?.vencidos?.valor || 1))}
                        </div>
                      </div>
                    )}
                  </div>
                </Card>
                
                <Card className="col-span-1 p-4 ring-0 border border-slate-200 shadow-sm h-[220px] flex flex-col rounded-xl">
                  <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-4">
                    DISTRIBUCIÓN POR GÉNERO
                  </Title>
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex-1 flex items-center justify-between mt-2">
                      <div className="w-1/2 flex justify-center h-full items-center relative">
                        <DonutChart
                          data={chartsData.distribucionGenero}
                          category="value"
                          index="name"
                          colors={chartsData.distribucionGenero.map(g => g.name === 'Hombres' ? 'emerald' : 'blue') as any}
                          className="w-28 h-28"
                          variant="donut"
                          showAnimation={true}
                          showTooltip={true}
                          showLabel={false}
                          valueFormatter={(number: number) => Intl.NumberFormat('es-CL').format(number)}
                        />
                        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                          <span className="text-lg font-bold text-slate-900 leading-none tracking-tight">
                            {Intl.NumberFormat('es-CL').format(chartsData.distribucionGenero.reduce((a, b) => a + b.value, 0))}
                          </span>
                          <span className="text-[10px] font-semibold text-slate-700 mt-1">Total</span>
                        </div>
                      </div>
                      
                      <div className="w-1/2 flex flex-col justify-center pl-4 h-full gap-3">
                        {chartsData.distribucionGenero.map((item: any, idx: number) => {
                          const total = chartsData.distribucionGenero.reduce((a, b) => a + b.value, 0);
                          const pct = total > 0 ? ((item.value / total) * 100).toFixed(1).replace('.', ',') : '0,0';
                          const colorClass = item.name === 'Hombres' ? 'bg-emerald-600' : 'bg-blue-600';
                          return (
                            <div key={idx} className="flex items-center justify-between text-[11px]">
                              <div className="flex items-center gap-2">
                                <span className={`w-3 h-3 rounded-full shrink-0 ${colorClass}`}></span>
                                <span className="text-slate-700 font-semibold">{item.name}</span>
                              </div>
                              <div className="flex items-center gap-1 shrink-0 ml-2">
                                <span className="text-slate-700">{Intl.NumberFormat('es-CL').format(item.value)}</span>
                                <span className="text-slate-500 font-medium">({pct}%)</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center text-[10px] font-semibold text-slate-600 bg-slate-50 rounded-lg py-2 mt-4 shrink-0">
                      Cobertura hombres: {chartsData.distribucionGenero.find((g: any) => g.name === 'Hombres')?.cobertura.toFixed(1).replace('.', ',') || '0,0'}% <span className="mx-1.5 text-slate-300">|</span> mujeres: {chartsData.distribucionGenero.find((g: any) => g.name === 'Mujeres')?.cobertura.toFixed(1).replace('.', ',') || '0,0'}%
                    </div>
                  </div>
                </Card>
                
                <Card className="col-span-1 p-4 ring-0 border border-slate-200 shadow-sm h-[220px] flex flex-col rounded-xl">
                  <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-4">
                    EXÁMENES POR RANGO DE EDAD
                  </Title>
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center text-[9px] font-semibold text-slate-500 uppercase pb-1.5 border-b border-slate-200">
                      <div className="flex-1">Rango de edad</div>
                      <div className="w-16 text-center">Realizados</div>
                      <div className="w-24 text-center">Cobertura (%)</div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pt-1 space-y-1">
                      {chartsData.distribucionEdad.length > 0 ? (
                        chartsData.distribucionEdad.map((item: any, idx: number) => {
                          const maxRealizados = Math.max(...chartsData.distribucionEdad.map((d: any) => d.realizados));
                          const pctBarra = maxRealizados > 0 ? (item.realizados / maxRealizados) * 100 : 0;
                          const colorClass = item.realizados < 50 ? 'bg-red-500' : item.realizados < 150 ? 'bg-amber-500' : 'bg-emerald-500';
                          
                          return (
                            <div key={idx} className="flex items-center text-[10px] py-1 border-b border-slate-50 last:border-0">
                              <div className="flex-1 text-slate-700 font-medium truncate pr-2" title={item.rango}>{item.rango}</div>
                              <div className="w-16 text-center text-slate-700 font-semibold">{item.realizados}</div>
                              <div className="w-24 flex items-center gap-2 pl-2">
                                <div className="flex-1 flex items-center h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                  <div className={`h-full rounded-full ${colorClass}`} style={{ width: `${pctBarra}%` }} />
                                </div>
                                <div className="w-8 text-right text-slate-600 font-medium border-l border-slate-200 pl-1">{item.cobertura.toFixed(1).replace('.', ',')}%</div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-full flex items-center justify-center text-[10px] text-slate-400">Sin datos</div>
                      )}
                    </div>

                    {chartsData.distribucionEdad.length > 0 && (
                      <div className="flex items-center text-[10px] font-bold text-slate-800 bg-slate-50 rounded-lg p-2 mt-2 shrink-0">
                        <div className="flex-1 text-blue-900">TOTAL</div>
                        <div className="w-16 text-center text-blue-900">{chartsData.distribucionEdad.reduce((sum: number, item: any) => sum + item.realizados, 0)}</div>
                        <div className="w-24 text-center text-blue-900">
                          {(chartsData.distribucionEdad.reduce((sum: number, item: any) => sum + item.cobertura * item.total, 0) / Math.max(1, chartsData.distribucionEdad.reduce((sum: number, item: any) => sum + item.total, 0))).toFixed(1).replace('.', ',')}%
                        </div>
                      </div>
                    )}
                  </div>
                </Card>

                <Card className="col-span-1 p-4 ring-0 border border-slate-200 shadow-sm h-[220px] flex flex-col rounded-xl">
                  <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight leading-none mb-4">
                    TIPOS DE EXÁMENES MÁS FRECUENTES (Top 6)
                  </Title>
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center text-[9px] font-semibold text-slate-500 uppercase pb-1.5 border-b border-slate-200">
                      <div className="flex-1">Tipo de examen</div>
                      <div className="w-16 text-center">Realizados</div>
                      <div className="w-12 text-center">%</div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto custom-scrollbar pt-1 space-y-1">
                      {chartsData.tipoExamen.length > 0 ? (
                        chartsData.tipoExamen.slice(0, 6).map((item: any, idx: number) => {
                          const maxValue = Math.max(...chartsData.tipoExamen.map((d: any) => d.value));
                          const pct = maxValue > 0 ? (item.value / maxValue) * 100 : 0;
                          return (
                            <div key={idx} className="flex items-center text-[10px] py-1 border-b border-slate-50 last:border-0">
                              <div className="flex-1 text-slate-700 font-medium truncate pr-2" title={item.name}>{item.name}</div>
                              <div className="w-16 text-center text-slate-700">{Intl.NumberFormat('es-CL').format(item.value)}</div>
                              <div className="w-12 text-center text-slate-600 font-medium">{pct.toFixed(1).replace('.', ',').replace(',0', '')}%</div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="h-full flex items-center justify-center text-[10px] text-slate-400">Sin datos</div>
                      )}
                    </div>
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
