import { Card, Title, DonutChart, LineChart, BarList, Legend, Flex, Text } from '@tremor/react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LabelList } from 'recharts';
import { useData } from '../../context/DataContext';

const donutColors = ['emerald', 'amber', 'red', 'slate', 'purple', 'blue', 'cyan', 'rose'];

export default function DashboardCharts() {
  const { chartsData, kpis } = useData();
  const donutNames = chartsData.distribucionAptitud.map(d => d.name);
  const totalPacientes = kpis.realizados.total || 1;

  return (
    <div className="flex flex-col gap-4 mb-4">
      
      {/* FILA 1 y 2: Gráficos principales en grid de 4 columnas */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        
        {/* COLUMNA 1: Cobertura + Evolución */}
        <div className="flex flex-col gap-4 col-span-1">
          {/* Gráfico 1: Tipo de Examen (Real) */}
          <Card className="p-3 ring-0 border border-slate-200 shadow-sm flex flex-col h-[200px]">
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

          {/* Gráfico Evolución (Placeholder) */}
          <Card className="p-3 ring-0 border border-slate-200 shadow-sm flex flex-col h-[200px]">
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
        </div>

        {/* COLUMNA 2: Distribución + Hallazgos */}
        <div className="flex flex-col gap-4 col-span-1">
          {/* Gráfico 2: Distribución por Estado (Real) */}
          <Card className="p-3 ring-0 border border-slate-200 shadow-sm flex flex-col h-[200px]">
            <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight mb-0.5 leading-none">
              DISTRIBUCIÓN DE EXÁMENES POR ESTADO
            </Title>
            <Text className="text-[9px] text-slate-500 mb-2 leading-none">
              BASADO EN EL RESULTADO DE APTITUD
            </Text>

            <div className="flex flex-1 items-center justify-between">
              <div className="w-1/2 flex justify-center h-full items-center">
                <DonutChart
                  data={chartsData.distribucionAptitud}
                  category="value"
                  index="name"
                  colors={donutColors as any}
                  className="w-28 h-28"
                  variant="donut"
                  valueFormatter={(number: number) => Intl.NumberFormat('es-CL').format(number)}
                  showAnimation={true}
                  showTooltip={true}
                />
              </div>
              
              <div className="w-1/2 flex flex-col justify-center pl-2 border-l border-slate-100 h-full">
                <div className="flex-1 flex items-center">
                  <Legend
                    categories={donutNames}
                    colors={donutColors as any}
                    className="max-w-full flex-col space-y-1.5 items-start [&_p]:text-[9px] [&_p]:leading-tight"
                  />
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100">
                  <Text className="text-[9px] font-semibold text-slate-500 uppercase leading-none mb-0.5">Total Evaluados</Text>
                  <p className="text-sm font-bold text-slate-800 leading-none">
                    {Intl.NumberFormat('es-CL').format(kpis.realizados.total)}
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Gráfico Hallazgos Frecuentes */}
          <Card className="p-3 ring-0 border border-slate-200 shadow-sm flex flex-col h-[200px]">
            <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight mb-0.5 leading-none">
              HALLAZGOS DE SALUD MÁS FRECUENTES
            </Title>
            <Text className="text-[9px] text-slate-500 mb-3 leading-none">
              (TOP 5)
            </Text>
            <div className="flex-1 mt-2">
              {chartsData.hallazgosFrecuentes.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={chartsData.hallazgosFrecuentes}
                    layout="vertical"
                    margin={{ top: 5, right: 65, left: 10, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} vertical={true} stroke="#e2e8f0" />
                    <XAxis 
                      type="number" 
                      axisLine={{ stroke: '#cbd5e1' }} 
                      tickLine={true} 
                      tick={{ fontSize: 9, fill: '#64748b' }} 
                    />
                    <YAxis 
                      dataKey="name" 
                      type="category" 
                      axisLine={{ stroke: '#cbd5e1' }} 
                      tickLine={false} 
                      tick={{ fontSize: 9, fill: '#475569' }} 
                      width={140} 
                    />
                    <Bar dataKey="value" fill="#dc2626" barSize={10} radius={[0, 4, 4, 0]}>
                      <LabelList 
                        dataKey="value" 
                        position="right" 
                        formatter={(val: number) => `${val} (${((val / totalPacientes) * 100).toFixed(1).replace('.', ',')}%)`}
                        style={{ fontSize: '9px', fill: '#475569', fontWeight: 600 }}
                      />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200 rounded-md bg-slate-50 h-full">
                  <span className="text-[10px] text-slate-400 text-center px-4">
                    Sin hallazgos registrados.<br />Asigne hallazgos en la ficha de pacientes.
                  </span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* COLUMNA 3 y 4: Minsal (arriba) + Sede y Tendencia (abajo) */}
        <div className="flex flex-col gap-4 col-span-2">
          {/* Tabla MINSAL (Placeholder) - Toma el doble de ancho y alto de 1 tarjeta */}
          <Card className="p-3 ring-0 border border-slate-200 shadow-sm flex flex-col h-[200px]">
            <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight mb-0.5 leading-none">
              CUMPLIMIENTO DE PROTOCOLOS MINSAL (CHILE) / ALINEADOS A PERÚ
            </Title>
            <div className="flex-1 flex items-center justify-center border border-dashed border-slate-200 rounded-md bg-slate-50 mt-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-widest">[TABLA PROTOCOLOS ESPACIO]</span>
            </div>
          </Card>

          {/* Sub-grilla para los 2 de abajo */}
          <div className="grid grid-cols-2 gap-4 h-[200px]">
            {/* Cumplimiento por División */}
            <Card className="p-3 ring-0 border border-slate-200 shadow-sm flex flex-col h-full min-h-0 overflow-hidden">
              <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight mb-0.5 leading-none">
                CUMPLIMIENTO POR DIVISIÓN
              </Title>
              <Text className="text-[9px] text-slate-500 mb-3 leading-none shrink-0">
                % DE COBERTURA DE EXÁMENES
              </Text>
              <div className="flex-1 flex flex-col mt-2 min-h-0">
                {/* Header */}
                <div className="flex justify-between items-center text-[9px] font-semibold text-slate-500 border-b border-slate-100 pb-1 mb-2 shrink-0">
                  <div className="w-24 truncate">División</div>
                  <div className="flex-1 text-right truncate pr-[42px]">Cobertura (%)</div>
                  <div className="w-10 text-center truncate">Estado</div>
                </div>
                
                {/* Rows */}
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 space-y-2">
                  {chartsData.cumplimientoSede.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-[10px]">
                      <div className="w-24 font-medium text-slate-700 truncate pr-2 shrink-0">
                        {item.sede.replace(/^Direcci[óo]n de /i, '').replace(/^Direcci[óo]n /i, '')}
                      </div>
                      <div className="flex-1 flex items-center justify-end gap-2 shrink-0">
                        <div className="w-16 h-[5px] bg-slate-100 rounded-full overflow-hidden shrink-0">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${item.cobertura}%` }} />
                        </div>
                        <span className="font-semibold text-slate-600 w-8 text-right shrink-0">
                          {item.cobertura.toFixed(1).replace('.', ',')}%
                        </span>
                      </div>
                      <div className="w-10 flex justify-center shrink-0">
                        {item.cobertura >= 95 ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" className="text-emerald-500 fill-emerald-500">
                            <circle cx="12" cy="12" r="12" />
                            <path d="M7 12.5l3 3 7-7" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                          </svg>
                        ) : item.cobertura >= 93 ? (
                          <svg width="12" height="12" viewBox="0 0 24 24" className="text-amber-500 fill-amber-500">
                            <circle cx="12" cy="12" r="12" />
                            <path d="M7 12h10" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                          </svg>
                        ) : (
                          <svg width="12" height="12" viewBox="0 0 24 24" className="text-red-500 fill-red-500">
                            <circle cx="12" cy="12" r="12" />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                  {chartsData.cumplimientoSede.length === 0 && (
                    <div className="text-center text-[10px] text-slate-400 py-4">Sin datos</div>
                  )}
                </div>

                {/* Footer Total */}
                <div className="flex justify-between items-center p-1.5 bg-slate-50 rounded mt-2 border border-slate-100">
                  <div className="text-[9px] font-bold text-slate-800">TOTAL / PROMEDIO</div>
                  <div className="text-[10px] font-bold text-slate-800 pr-[40px]">
                    {kpis.cobertura.porcentaje.toFixed(1).replace('.', ',')}%
                  </div>
                </div>
              </div>
            </Card>

            {/* Tendencia Críticos (Placeholder) */}
            <Card className="p-3 ring-0 border border-slate-200 shadow-sm flex flex-col h-full">
              <Title className="text-[10px] font-bold text-slate-800 uppercase tracking-tight mb-0.5 leading-none">
                TENDENCIA DE HALLAZGOS CRÍTICOS
              </Title>
              <Text className="text-[9px] text-slate-500 mb-3 leading-none">
                ÚLTIMOS 12 MESES
              </Text>
              <div className="flex-1 mt-2">
                <LineChart
                  className="h-full w-full custom-criticos-chart"
                  data={chartsData.tendenciaCriticos}
                  index="periodo"
                  categories={["hallazgos"]}
                  colors={["red"]}
                  showLegend={false}
                  showYAxis={true}
                  showGridLines={true}
                  yAxisWidth={30}
                />
              </div>
            </Card>
          </div>
        </div>

      </div>



    </div>
  );
}
