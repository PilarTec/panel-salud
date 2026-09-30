import { useState, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { Search, Activity, FileText, X, AlertTriangle, CheckCircle2, ListFilter } from 'lucide-react';
import { MultiSelect, MultiSelectItem, Select, SelectItem } from '@tremor/react';
import type { ParsedRow, RiesgoHallazgo } from '../services/excelParser';
import { CATEGORIAS_HALLAZGOS } from '../services/excelParser';
import LoadingScreen from '../components/shared/LoadingScreen';

export default function VerificacionPacientes() {
  const { rawData, updatePatientHallazgos, updatePatientAptitud, isDataLoaded, isLoadingGlobal, hallazgoDefaults } = useData();

  const [searchId, setSearchId] = useState('');
  const [selectedPeriodo, setSelectedPeriodo] = useState<string>('Todos');
  const [selectedAptitudes, setSelectedAptitudes] = useState<string[]>([]);
  const [selectedProcesos, setSelectedProcesos] = useState<string[]>([]);
  const [selectedProtocolos, setSelectedProtocolos] = useState<string[]>([]);
  const [selectedPaises, setSelectedPaises] = useState<string[]>([]);
  const [showOnlyCriticos, setShowOnlyCriticos] = useState<boolean>(false);
  
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedPatient, setSelectedPatient] = useState<ParsedRow | null>(null);
  
  // Estado para el modal de confirmación de cambio de aptitud
  const [aptitudChangeDialog, setAptitudChangeDialog] = useState<{
    isOpen: boolean;
    patientId?: string;
    periodo?: string;
    currentAptitud?: string;
    newAptitud?: string;
    isSaving?: boolean;
  }>({ isOpen: false });
  
  const ITEMS_PER_PAGE = 15;

  // Extraer periodos, aptitudes y procesos únicos
  const availablePeriodos = useMemo(() => {
    const periodos = new Set(rawData.map(row => row.periodo).filter(Boolean) as string[]);
    return Array.from(periodos).sort((a, b) => b.localeCompare(a));
  }, [rawData]);

  const availableAptitudes = useMemo(() => {
    const aptitudes = new Set(rawData.map(row => row.aptitud).filter(Boolean) as string[]);
    return Array.from(aptitudes).sort();
  }, [rawData]);

  const availableProcesos = useMemo(() => {
    const procesos = new Set(rawData.map(row => row.proceso).filter(Boolean) as string[]);
    return Array.from(procesos).sort();
  }, [rawData]);

  const availableProtocolos = useMemo(() => {
    const protocolos = new Set(rawData.map(row => row.tipo_protocolo).filter(Boolean) as string[]);
    return Array.from(protocolos).sort();
  }, [rawData]);

  const availablePaises = useMemo(() => {
    const paises = new Set(rawData.map(row => row.pais).filter(Boolean) as string[]);
    return Array.from(paises).sort();
  }, [rawData]);

  // Si no hay periodo seleccionado y existen periodos, autoseleccionar el más reciente
  useMemo(() => {
    if (selectedPeriodo === 'Todos' && availablePeriodos.length > 0) {
      setSelectedPeriodo(availablePeriodos[0]);
    }
  }, [availablePeriodos, selectedPeriodo]);

  // Filtrado de datos
  const filteredPatients = useMemo(() => {
    let result = rawData;

    // Filtro de periodo
    if (selectedPeriodo !== 'Todos') {
      result = result.filter(row => row.periodo === selectedPeriodo);
    }

    if (searchId.trim() !== '') {
      result = result.filter(row => row.patient_id.toLowerCase().includes(searchId.toLowerCase()));
    }

    if (selectedAptitudes.length > 0) {
      result = result.filter(row => row.aptitud && selectedAptitudes.includes(row.aptitud));
    }

    if (selectedProcesos.length > 0) {
      result = result.filter(row => row.proceso && selectedProcesos.includes(row.proceso));
    }

    if (selectedProtocolos.length > 0) {
      result = result.filter(row => row.tipo_protocolo && selectedProtocolos.includes(row.tipo_protocolo));
    }

    if (selectedPaises.length > 0) {
      result = result.filter(row => row.pais && selectedPaises.includes(row.pais));
    }

    if (showOnlyCriticos) {
      result = result.filter(row => {
        // Un paciente solo califica como crítico si tiene al menos un hallazgo con riesgo Crítico vigente
        return row.hallazgos_seleccionados?.some(h => {
          const hKey = (h.hallazgo || '').trim();
          const risk = hallazgoDefaults[hKey] || hallazgoDefaults[hKey.toUpperCase()] || h.nivel_riesgo;
          return risk === 'Crítico';
        });
      });
    }

    return result;
  }, [rawData, searchId, selectedPeriodo, selectedAptitudes, selectedProcesos, selectedProtocolos, selectedPaises, showOnlyCriticos, hallazgoDefaults]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredPatients.length / ITEMS_PER_PAGE));
  const paginatedPatients = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPatients.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPatients, currentPage]);

  // Asegurar que la página actual sea válida si cambia el filtro
  useMemo(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  if (isLoadingGlobal) {
    return (
      <div className="flex-1 bg-slate-50 relative">
        <LoadingScreen />
      </div>
    );
  }

  if (!isDataLoaded) {
    return (
      <div className="flex flex-col h-full bg-slate-50 items-center justify-center p-8">
        <div className="w-16 h-16 bg-slate-200 text-slate-500 rounded-full flex items-center justify-center mb-4">
          <FileText className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 mb-2">No hay pacientes cargados</h2>
        <p className="text-slate-500">Sube primero el archivo Excel en la sección de Carga.</p>
      </div>
    );
  }

  const getAptitudColor = (aptitud: string) => {
    const apt = aptitud.toUpperCase();
    if (apt === 'OBSERVADO') return 'bg-amber-100 text-amber-700 border-amber-200';
    if (apt === 'NO APTO') return 'bg-rose-100 text-rose-700 border-rose-200';
    if (apt === 'SIN APTITUD') return 'bg-slate-100 text-slate-600 border-slate-200';
    return 'bg-emerald-100 text-emerald-700 border-emerald-200';
  };

  const handleConfirmAptitud = async () => {
    if (!aptitudChangeDialog.patientId || !aptitudChangeDialog.periodo || !aptitudChangeDialog.newAptitud) return;
    
    setAptitudChangeDialog(prev => ({ ...prev, isSaving: true }));
    try {
      await updatePatientAptitud(
        aptitudChangeDialog.patientId, 
        aptitudChangeDialog.periodo, 
        aptitudChangeDialog.newAptitud
      );
      setAptitudChangeDialog({ isOpen: false });
    } catch (err) {
      console.error(err);
      alert("Error al guardar el cambio en la base de datos.");
      setAptitudChangeDialog(prev => ({ ...prev, isSaving: false }));
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Header & Controls */}
      <div className="bg-white px-6 py-4 border-b border-slate-200 shrink-0">
        <h1 className="text-lg font-bold text-slate-800 mb-4 ml-10">Verificación de Pacientes</h1>
        
        <div className="flex flex-col gap-4">
          {/* Fila 1: Búsqueda */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar por ID Anónimo..."
              value={searchId}
              onChange={e => { setSearchId(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fila 2: Filtros */}
          <div className="flex flex-wrap items-center gap-3">
            {/* Toggle Críticos */}
            <label className="flex items-center gap-2 cursor-pointer bg-rose-50 px-3 py-2 rounded-lg border border-rose-100 hover:bg-rose-100 transition-colors">
              <input 
                type="checkbox" 
                checked={showOnlyCriticos} 
                onChange={e => { setShowOnlyCriticos(e.target.checked); setCurrentPage(1); }} 
                className="w-4 h-4 rounded border-rose-300 text-rose-600 focus:ring-rose-500" 
              />
              <span className="text-sm font-semibold text-rose-700">Con Hallazgos Críticos</span>
            </label>

            {/* Periodo Filter */}
            <div className="w-40">
              <Select
                value={selectedPeriodo}
                onValueChange={(v) => { setSelectedPeriodo(v); setCurrentPage(1); }}
                enableClear={false}
                placeholder="Mes..."
              >
                <SelectItem value="Todos">Todos los meses</SelectItem>
                {availablePeriodos.map(p => (
                  <SelectItem key={p} value={p}>{p}</SelectItem>
                ))}
              </Select>
            </div>
            
            {/* Aptitud Filter */}
            <div className="w-48">
              <MultiSelect
                value={selectedAptitudes}
                onValueChange={(val) => { setSelectedAptitudes(val); setCurrentPage(1); }}
                placeholder="Filtrar por Aptitud"
              >
                {availableAptitudes.map(opt => (
                  <MultiSelectItem key={opt} value={opt}>{opt}</MultiSelectItem>
                ))}
              </MultiSelect>
            </div>

            {/* Proceso Filter */}
            <div className="w-56">
              <MultiSelect
                value={selectedProcesos}
                onValueChange={(val) => { setSelectedProcesos(val); setCurrentPage(1); }}
                placeholder="Filtrar por Proceso/Sede"
              >
                {availableProcesos.map(opt => (
                  <MultiSelectItem key={opt} value={opt}>{opt}</MultiSelectItem>
                ))}
              </MultiSelect>
            </div>

            {/* Protocolo Filter */}
            <div className="w-48">
              <MultiSelect
                value={selectedProtocolos}
                onValueChange={(val) => { setSelectedProtocolos(val); setCurrentPage(1); }}
                placeholder="Filtrar por Protocolo"
              >
                {availableProtocolos.map(opt => (
                  <MultiSelectItem key={opt} value={opt}>{opt}</MultiSelectItem>
                ))}
              </MultiSelect>
            </div>

            {/* Pais Filter */}
            <div className="w-40">
              <MultiSelect
                value={selectedPaises}
                onValueChange={(val) => { setSelectedPaises(val); setCurrentPage(1); }}
                placeholder="Filtrar por País"
              >
                {availablePaises.map(opt => (
                  <MultiSelectItem key={opt} value={opt}>{opt}</MultiSelectItem>
                ))}
              </MultiSelect>
            </div>
          </div>
        </div>
      </div>

      {/* Table Area */}
      <div className="flex-1 overflow-auto p-6">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                <tr>
                  <th className="px-6 py-3 font-semibold">ID ANÓNIMO</th>
                  <th className="px-6 py-3 font-semibold">SEDE / DIVISIÓN</th>
                  <th className="px-6 py-3 font-semibold">APTITUD</th>
                  <th className="px-6 py-3 font-semibold text-center">DIAGNÓSTICOS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedPatients.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-8 text-center text-slate-500">
                      No se encontraron pacientes con estos filtros.
                    </td>
                  </tr>
                ) : (
                  paginatedPatients.map(row => (
                    <tr key={row.patient_id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-6 py-3 font-mono text-xs text-slate-600">{row.patient_id}</td>
                      <td className="px-6 py-3">
                        <div className="text-slate-800 font-medium">{row.sede || row.division || '-'}</div>
                        <div className="text-xs text-slate-500">{row.cargo || '-'}</div>
                      </td>
                      <td className="px-6 py-3">
                        <div className="relative inline-block w-full max-w-[180px]">
                          <select
                            value={
                              row.aptitud?.toUpperCase() === 'NAN' ? 'SIN APTITUD' : (row.aptitud?.toUpperCase() || 'APTO')
                            }
                            onChange={(e) => {
                              const newApt = e.target.value;
                              const currentApt = row.aptitud?.toUpperCase() === 'NAN' ? 'SIN APTITUD' : (row.aptitud?.toUpperCase() || 'APTO');
                              if (newApt !== currentApt) {
                                setAptitudChangeDialog({
                                  isOpen: true,
                                  patientId: row.patient_id,
                                  periodo: row.periodo,
                                  currentAptitud: currentApt,
                                  newAptitud: newApt
                                });
                              }
                            }}
                            className={`w-full text-xs font-semibold py-1.5 pl-2.5 pr-8 rounded-md appearance-none border cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${getAptitudColor(row.aptitud?.toUpperCase() === 'NAN' ? 'SIN APTITUD' : (row.aptitud?.toUpperCase() || 'APTO'))}`}
                          >
                            <option value="APTO">APTO</option>
                            <option value="APTO CON RESTRICCIONES">APTO CON RESTRICCIONES</option>
                            <option value="OBSERVADO">OBSERVADO</option>
                            <option value="NO APTO">NO APTO</option>
                            <option value="SIN APTITUD">SIN APTITUD</option>
                          </select>
                          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-current opacity-70">
                            <svg className="w-4 h-4 fill-current" viewBox="0 0 20 20"><path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path></svg>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-3 text-center">
                        <button
                          onClick={() => setSelectedPatient(row)}
                          className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 transition-colors"
                          title="Ver Diagnósticos"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex items-center justify-between">
              <span className="text-sm text-slate-500">
                Mostrando {(currentPage - 1) * ITEMS_PER_PAGE + 1} a {Math.min(currentPage * ITEMS_PER_PAGE, filteredPatients.length)} de {filteredPatients.length} pacientes
              </span>
              <div className="flex gap-1">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(p => p - 1)}
                  className="px-3 py-1 text-sm bg-white border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50"
                >
                  Anterior
                </button>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(p => p + 1)}
                  className="px-3 py-1 text-sm bg-white border border-slate-200 rounded-md disabled:opacity-50 hover:bg-slate-50"
                >
                  Siguiente
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modal Dialog for Aptitud Change Confirmation */}
      {aptitudChangeDialog.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-800 mb-2">Confirmar cambio de aptitud</h3>
              <p className="text-slate-600 text-sm mb-4">
                Estás a punto de cambiar la aptitud del paciente <strong>{aptitudChangeDialog.patientId}</strong> en la base de datos de 
                <span className="font-semibold mx-1 text-slate-800">{aptitudChangeDialog.currentAptitud}</span> a 
                <span className="font-semibold mx-1 text-blue-600">{aptitudChangeDialog.newAptitud}</span>.
              </p>
              <div className="bg-blue-50 text-blue-800 text-xs p-3 rounded-lg border border-blue-100 flex items-start gap-2 mb-6">
                <Activity className="w-4 h-4 shrink-0 mt-0.5" />
                <p>Este cambio se registrará permanentemente en Firestore y será visible para todos los usuarios.</p>
              </div>
              
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setAptitudChangeDialog({ isOpen: false })}
                  disabled={aptitudChangeDialog.isSaving}
                  className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmAptitud}
                  disabled={aptitudChangeDialog.isSaving}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center min-w-[120px] disabled:opacity-70"
                >
                  {aptitudChangeDialog.isSaving ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  ) : (
                    "Guardar Cambio"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Ficha Médica Modal */}
      {selectedPatient && (
        <PatientMedicalModal 
          patient={selectedPatient} 
          onClose={() => setSelectedPatient(null)} 
          onSave={async (hallazgos) => {
            await updatePatientHallazgos(selectedPatient.patient_id, hallazgos, selectedPatient.periodo);
            setSelectedPatient(null);
          }}
        />
      )}
    </div>
  );
}

// ----------------------------------------------------------------------
// COMPONENTE: PatientMedicalModal
// ----------------------------------------------------------------------

function PatientMedicalModal({ 
  patient, 
  onClose, 
  onSave 
}: { 
  patient: ParsedRow; 
  onClose: () => void; 
  onSave: (h: RiesgoHallazgo[]) => Promise<void> | void; 
}) {
  const { hallazgoDefaults } = useData();
  const [isSaving, setIsSaving] = useState(false);

  // Inicializar estado de hallazgos
  const [selectedHallazgos, setSelectedHallazgos] = useState<Set<string>>(() => {
    return new Set((patient.hallazgos_seleccionados || []).map(h => h.hallazgo));
  });

  const [showOnlySelected, setShowOnlySelected] = useState<boolean>(false);

  // Agrupar los hallazgos seleccionados por categoría
  const selectedByCategory = useMemo(() => {
    const map = new Map<string, { icono: string; items: string[] }>();
    
    // Mantener el orden de CATEGORIAS_HALLAZGOS
    CATEGORIAS_HALLAZGOS.forEach(cat => {
      const items = cat.opciones.filter(op => selectedHallazgos.has(op));
      if (items.length > 0) {
        map.set(cat.nombre, { icono: cat.icono, items });
      }
    });

    // Hallazgos que no estén mapeados en las categorías estándar
    const allKnown = new Set(CATEGORIAS_HALLAZGOS.flatMap(c => c.opciones));
    const unmapped = Array.from(selectedHallazgos).filter(h => !allKnown.has(h));
    if (unmapped.length > 0) {
      map.set('Otros', { icono: '🫁', items: unmapped });
    }

    return Array.from(map.entries()).map(([nombre, data]) => ({
      nombre,
      icono: data.icono,
      items: data.items,
    }));
  }, [selectedHallazgos]);

  const toggleHallazgo = (hallazgo: string) => {
    setSelectedHallazgos(prev => {
      const next = new Set(prev);
      if (next.has(hallazgo)) next.delete(hallazgo);
      else next.add(hallazgo);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result: RiesgoHallazgo[] = Array.from(selectedHallazgos).map(hallazgo => {
        const hKey = (hallazgo || '').trim();
        const currentRisk = hallazgoDefaults[hKey] || hallazgoDefaults[hKey.toUpperCase()] || 'Bajo';
        return {
          hallazgo,
          nivel_riesgo: currentRisk
        };
      });
      await onSave(result);
    } catch (error) {
      console.error("Error al guardar evaluación:", error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-hidden">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl flex flex-col relative overflow-hidden max-h-[85vh]">
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 text-white rounded-xl flex items-center justify-center shadow-inner">
              <Activity className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-800 leading-tight">Ficha Médica y Hallazgos</h2>
              <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
                <span className="font-mono text-blue-600">ID: {patient.patient_id}</span>
                <span>•</span>
                <span>{patient.periodo}</span>
                <span>•</span>
                <span>{patient.division || patient.sede || 'Sin División'}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:bg-slate-200 hover:text-slate-700 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Contenido (2 Columnas) */}
        <div className="flex flex-col md:flex-row flex-1 min-h-0">
          
          {/* COLUMNA IZQUIERDA: Datos y Resultados */}
          <div className="w-full md:w-2/5 border-r border-slate-200 bg-slate-50/50 p-6 overflow-y-auto custom-scrollbar">
            
            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Información Base</h3>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="block text-slate-400 font-semibold mb-0.5">Aptitud</span>
                  <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md font-bold ${patient.aptitud?.toUpperCase() === 'OBSERVADO' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                    {patient.aptitud || 'APTO'}
                  </span>
                </div>
                <div>
                  <span className="block text-slate-400 font-semibold mb-0.5">Cargo</span>
                  <span className="text-slate-700 font-medium">{patient.cargo || '-'}</span>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Resultados de Exámenes</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-xs bg-white p-2 rounded border border-slate-100 shadow-sm">
                  <span className="font-semibold text-slate-500">Musculoesquelético</span>
                  <span className="text-slate-800 font-medium text-right max-w-[60%] truncate">{patient.musculo_resultado || '-'}</span>
                </div>
                <div className="flex justify-between text-xs bg-white p-2 rounded border border-slate-100 shadow-sm">
                  <span className="font-semibold text-slate-500">Oftalmología</span>
                  <span className="text-slate-800 font-medium text-right max-w-[60%] truncate">{patient.oftalmo_resultado || '-'}</span>
                </div>
                <div className="flex justify-between text-xs bg-white p-2 rounded border border-slate-100 shadow-sm">
                  <span className="font-semibold text-slate-500">Audiometría</span>
                  <span className="text-slate-800 font-medium text-right max-w-[60%] truncate">{patient.audio_resultado || '-'}</span>
                </div>
                <div className="flex justify-between text-xs bg-white p-2 rounded border border-slate-100 shadow-sm">
                  <span className="font-semibold text-slate-500">Radiografía</span>
                  <span className="text-slate-800 font-medium text-right max-w-[60%] truncate">{patient.radio_resultado || '-'}</span>
                </div>
                
                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/60">
                  <div className="bg-white p-2 rounded border border-slate-100 shadow-sm">
                    <span className="block text-[10px] font-semibold text-slate-400">Nutricional</span>
                    <span className="block text-xs font-bold text-slate-700 truncate">{patient.dx_nutricional || '-'}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100 shadow-sm">
                    <span className="block text-[10px] font-semibold text-slate-400">Peso</span>
                    <span className="block text-xs font-bold text-slate-700">{patient.peso ? `${patient.peso} kg` : '-'}</span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100 shadow-sm">
                    <span className="block text-[10px] font-semibold text-slate-400">Glucosa</span>
                    <span className="block text-xs font-bold text-slate-700">{patient.glucosa || '-'} <span className="font-normal text-slate-400 text-[10px]">{patient.glucosa_rango}</span></span>
                  </div>
                  <div className="bg-white p-2 rounded border border-slate-100 shadow-sm">
                    <span className="block text-[10px] font-semibold text-slate-400">Colesterol</span>
                    <span className="block text-xs font-bold text-slate-700">{patient.colesterol || '-'} <span className="font-normal text-slate-400 text-[10px]">{patient.colesterol_cat}</span></span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-bold text-slate-800 mb-3 border-b border-slate-200 pb-2">Diagnósticos Originales</h3>
              {(!patient.diagnosticos_array || patient.diagnosticos_array.length === 0) ? (
                <p className="text-xs text-slate-400 italic">Sin diagnósticos registrados.</p>
              ) : (
                <ul className="space-y-1.5">
                  {patient.diagnosticos_array.map((diag, i) => (
                    <li key={i} className="text-xs text-slate-600 bg-blue-50/50 p-2 rounded border border-blue-100 flex items-start gap-2">
                      <span className="text-blue-500 mt-0.5">•</span>
                      <span>{diag}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

          </div>

          {/* COLUMNA DERECHA: Hallazgos y Riesgo */}
          <div className="w-full md:w-3/5 p-6 overflow-y-auto custom-scrollbar bg-white flex flex-col">
            
            <div className="mb-6">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4 border-b border-slate-200 pb-2.5">
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-slate-800">Selección de Hallazgos</h3>
                  <span className="text-xs font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full">
                    {selectedHallazgos.size} seleccionados
                  </span>
                </div>

                {/* Switch / Segmented control: Ver todos vs Solo seleccionados */}
                <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200/80 shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowOnlySelected(false)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                      !showOnlySelected
                        ? 'bg-white text-slate-800 shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <ListFilter className="w-3.5 h-3.5" />
                    <span>Ver todos</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowOnlySelected(true)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all flex items-center gap-1.5 cursor-pointer ${
                      showOnlySelected
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Solo seleccionados ({selectedHallazgos.size})</span>
                  </button>
                </div>
              </div>

              {!showOnlySelected ? (
                /* VISTA 1: Catálogo Completo con Checkboxes */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-6">
                  {CATEGORIAS_HALLAZGOS.map(cat => (
                    <div key={cat.nombre}>
                      <h4 className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                        <span>{cat.icono}</span> {cat.nombre}
                      </h4>
                      <div className="space-y-1.5 pl-5 border-l-2 border-slate-100 ml-2">
                        {cat.opciones.map(opcion => {
                          const isSelected = selectedHallazgos.has(opcion);
                          return (
                            <div key={opcion} className="flex flex-col">
                              <label className="flex items-start gap-2 cursor-pointer group mb-1">
                                <input 
                                  type="checkbox" 
                                  className="mt-0.5 w-3.5 h-3.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-colors cursor-pointer"
                                  checked={isSelected}
                                  onChange={() => toggleHallazgo(opcion)}
                                />
                                <span className={`text-[11px] leading-tight transition-colors ${isSelected ? 'font-semibold text-blue-700' : 'text-slate-600 group-hover:text-slate-800'}`}>
                                  {opcion}
                                </span>
                              </label>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* VISTA 2: Solo Hallazgos Seleccionados con su Nivel de Riesgo */
                <div>
                  {selectedHallazgos.size === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center my-4">
                      <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-2">
                        <CheckCircle2 className="w-5 h-5" />
                      </div>
                      <p className="text-xs font-bold text-slate-700">Sin hallazgos seleccionados</p>
                      <p className="text-[11px] text-slate-400 mt-0.5 max-w-xs">
                        Actualmente este paciente no tiene ningún diagnóstico marcado en su ficha.
                      </p>
                      <button
                        type="button"
                        onClick={() => setShowOnlySelected(false)}
                        className="mt-3 px-3 py-1.5 text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                      >
                        Ver todos los hallazgos para marcar
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {selectedByCategory.map(cat => (
                        <div key={cat.nombre} className="border border-slate-200/80 rounded-xl overflow-hidden bg-white shadow-2xs">
                          {/* Cabecera de Categoría */}
                          <div className="px-3.5 py-2 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="text-base">{cat.icono}</span>
                              <span className="text-xs font-bold text-slate-800">{cat.nombre}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded-full border border-slate-200">
                              {cat.items.length} {cat.items.length === 1 ? 'hallazgo' : 'hallazgos'}
                            </span>
                          </div>

                          {/* Lista de Hallazgos con Nivel de Riesgo */}
                          <div className="divide-y divide-slate-100">
                            {cat.items.map(opcion => {
                              const risk = hallazgoDefaults[opcion] !== undefined ? hallazgoDefaults[opcion] : 'Bajo';
                              const riskBadgeColors: Record<string, string> = {
                                'Bajo': 'bg-emerald-50 text-emerald-700 border-emerald-200',
                                'Medio': 'bg-amber-50 text-amber-700 border-amber-200',
                                'Alto': 'bg-orange-50 text-orange-700 border-orange-200',
                                'Crítico': 'bg-red-50 text-red-700 border-red-200',
                              };
                              const badgeClass = risk ? (riskBadgeColors[risk] || 'bg-slate-100 text-slate-700 border-slate-200') : 'bg-rose-50 text-rose-700 border-rose-200';

                              return (
                                <div key={opcion} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors">
                                  <label className="flex items-start gap-2.5 cursor-pointer flex-1 min-w-0">
                                    <input 
                                      type="checkbox" 
                                      className="mt-0.5 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                      checked={true}
                                      onChange={() => toggleHallazgo(opcion)}
                                    />
                                    <span className="text-xs font-semibold text-slate-800 leading-snug break-words">
                                      {opcion}
                                    </span>
                                  </label>

                                  <div className="flex items-center gap-2 shrink-0">
                                    <span className={`text-[11px] font-bold px-2.5 py-0.5 rounded-md border ${badgeClass}`}>
                                      Riesgo: {risk || 'Sin Asignar'}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => toggleHallazgo(opcion)}
                                      className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                      title="Desmarcar este hallazgo"
                                    >
                                      <X className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 text-slate-600 bg-white border border-slate-300 text-sm font-semibold rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 shadow-sm transition-colors flex items-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Guardando...</span>
              </>
            ) : (
              "Guardar Evaluación"
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
