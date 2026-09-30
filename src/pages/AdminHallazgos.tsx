import { Title, Text, Card, TabGroup, TabList, Tab, TabPanels, TabPanel, SearchSelect, SearchSelectItem } from '@tremor/react';
import { useData } from '../context/DataContext';
import { CATEGORIAS_HALLAZGOS, addHallazgoToCategoria, moveHallazgoToCategoria } from '../services/excelParser';
import type { NivelRiesgo } from '../services/excelParser';
import * as XLSX from 'xlsx';
import { Plus, ArrowRightLeft, AlertTriangle, ShieldAlert, Check, X, Search, ArchiveRestore, Trash2, PartyPopper, CheckCircle2, Download, ExternalLink, FolderPlus } from 'lucide-react';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import LoadingScreen from '../components/shared/LoadingScreen';

export type RiskFilterType = 'Todos' | NivelRiesgo | 'SinClasificar';

const PRESET_ICONS = ['🩺', '🫁', '🧠', '🦷', '🧴', '🧬', '🩹', '🔬', '🫀', '🩻', '👶', '🦵', '💉', '🧪', '👁️', '❤️', '🩸', '🦴', '👂', '📁'];

export default function AdminHallazgos() {
  const { 
    hallazgoDefaults, 
    updateHallazgoDefault, 
    pendingTriaje, 
    rechazadosList, 
    sinonimosList, 
    resolveTriaje, 
    resolveTriajeVincular, 
    restoreRechazado, 
    deleteRechazado, 
    deleteSinonimo, 
    deleteHallazgoFromCatalogo, 
    addCategoria, 
    saveCategoriasCatalogo, 
    categoriasVersion, 
    isLoadingGlobal 
  } = useData();
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollContainerRef = useRef<HTMLElement | null>(null);
  const [newInputs, setNewInputs] = useState<Record<string, string>>({});
  const [moveMenuOpenFor, setMoveMenuOpenFor] = useState<string | null>(null);

  // Add Category Modal state
  const [addCategoryModal, setAddCategoryModal] = useState<{
    isOpen: boolean;
    nombre: string;
    icono: string;
    isSubmitting: boolean;
    error: string | null;
  }>({
    isOpen: false,
    nombre: '',
    icono: '🩺',
    isSubmitting: false,
    error: null,
  });
  
  // Delete Hallazgo Modal state
  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    hallazgo: string | null;
    categoria: string | null;
    associatedAliases: string[];
    isDeleting: boolean;
  }>({
    isOpen: false,
    hallazgo: null,
    categoria: null,
    associatedAliases: [],
    isDeleting: false,
  });

  // Delete Vínculo Modal state
  const [deleteVinculoModal, setDeleteVinculoModal] = useState<{
    isOpen: boolean;
    alias: string | null;
    principal: string | null;
    isDeleting: boolean;
  }>({
    isOpen: false,
    alias: null,
    principal: null,
    isDeleting: false,
  });
  
  // Category Details Modal state
  const [categoryModal, setCategoryModal] = useState<{
    isOpen: boolean;
    categoriaNombre: string | null;
    searchInside: string;
  }>({
    isOpen: false,
    categoriaNombre: null,
    searchInside: ''
  });

  // Catálogo actual filters
  const [riskFilter, setRiskFilter] = useState<RiskFilterType>('Todos');
  const [searchCatalogo, setSearchCatalogo] = useState<string>('');

  // Triaje state
  const [selectedCategoria, setSelectedCategoria] = useState<Record<string, string>>({});
  const [selectedRiesgo, setSelectedRiesgo] = useState<Record<string, NivelRiesgo>>({});
  const [searchRechazados, setSearchRechazados] = useState('');
  
  // Triaje: Vínculos
  const [triajeMode, setTriajeMode] = useState<Record<string, 'nuevo' | 'vincular'>>({});
  const [selectedSinonimo, setSelectedSinonimo] = useState<Record<string, string>>({});
  const [searchSinonimos, setSearchSinonimos] = useState('');

  // Encontrar el contenedor de scroll del Layout al montar
  const mainRef = useRef<HTMLElement | null>(null);
  useEffect(() => {
    // Buscar el div padre con overflow-y-auto del Layout
    if (mainRef.current) {
      scrollContainerRef.current = mainRef.current.closest('.flex-1.overflow-y-auto') as HTMLElement || mainRef.current.parentElement;
    }
  }, []);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastVisible(true);
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    toastTimerRef.current = setTimeout(() => {
      setToastVisible(false);
    }, 3000);
  }, []);

  const allOpciones = useMemo(() => CATEGORIAS_HALLAZGOS.flatMap(cat => cat.opciones).sort(), [CATEGORIAS_HALLAZGOS, categoriasVersion]);

  const handleAcceptTriaje = (hallazgo: string) => {
    const mode = triajeMode[hallazgo] || 'nuevo';
    if (mode === 'vincular') {
      const principal = selectedSinonimo[hallazgo];
      if (principal) {
        resolveTriajeVincular(hallazgo, principal);
      }
    } else {
      const cat = selectedCategoria[hallazgo] || 'Otros';
      const riesgo = selectedRiesgo[hallazgo] || 'Bajo';
      resolveTriaje(hallazgo, 'accept', cat, riesgo);
    }
  };

  const handleRejectTriaje = (hallazgo: string) => {
    resolveTriaje(hallazgo, 'reject');
  };

  const filteredRechazados = rechazadosList.filter(h => h.toLowerCase().includes(searchRechazados.toLowerCase()));
  const sinonimosEntries = Object.entries(sinonimosList).filter(([alias, principal]) => 
    alias.toLowerCase().includes(searchSinonimos.toLowerCase()) || 
    principal.toLowerCase().includes(searchSinonimos.toLowerCase())
  );

  const handleInputChange = (categoria: string, value: string) => {
    setNewInputs(prev => ({ ...prev, [categoria]: value.toUpperCase() }));
  };

  const handleAdd = async (categoria: string) => {
    const newVal = newInputs[categoria];
    if (newVal && newVal.trim() !== '') {
      const upperVal = newVal.trim().toUpperCase();
      addHallazgoToCategoria(categoria, upperVal, 'Bajo');
      updateHallazgoDefault(upperVal, 'Bajo'); // Triggers render
      await saveCategoriasCatalogo();
      setNewInputs(prev => ({ ...prev, [categoria]: '' }));
      showToast(`"${upperVal}" añadido y guardado en BD.`);
    }
  };

  const handleMove = async (hallazgo: string, fromCat: string, toCat: string) => {
    moveHallazgoToCategoria(hallazgo, fromCat, toCat);
    updateHallazgoDefault(hallazgo, hallazgoDefaults[hallazgo] || 'Bajo');
    await saveCategoriasCatalogo();
    setMoveMenuOpenFor(null);
    showToast(`"${hallazgo}" movido a ${toCat}.`);
  };

  const handleCreateCategory = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanName = addCategoryModal.nombre.trim();
    if (!cleanName) {
      setAddCategoryModal(prev => ({ ...prev, error: 'Por favor, ingresa el nombre de la categoría.' }));
      return;
    }
    const exists = CATEGORIAS_HALLAZGOS.some(c => c.nombre.trim().toLowerCase() === cleanName.toLowerCase());
    if (exists) {
      setAddCategoryModal(prev => ({ ...prev, error: `La categoría "${cleanName}" ya existe.` }));
      return;
    }

    setAddCategoryModal(prev => ({ ...prev, isSubmitting: true, error: null }));
    try {
      await addCategoria(cleanName, addCategoryModal.icono);
      showToast(`Categoría "${cleanName}" creada exitosamente.`);
      setAddCategoryModal({
        isOpen: false,
        nombre: '',
        icono: '🩺',
        isSubmitting: false,
        error: null,
      });
    } catch (err: any) {
      console.error(err);
      setAddCategoryModal(prev => ({ ...prev, isSubmitting: false, error: err.message || 'Error al crear la categoría.' }));
    }
  };

  const handleOpenDelete = (hallazgo: string, categoria: string) => {
    const upper = hallazgo.trim().toUpperCase();
    const aliases = Object.entries(sinonimosList)
      .filter(([_, principal]) => principal.trim().toUpperCase() === upper)
      .map(([alias]) => alias);

    setDeleteModal({
      isOpen: true,
      hallazgo,
      categoria,
      associatedAliases: aliases,
      isDeleting: false,
    });
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.hallazgo) return;
    setDeleteModal(prev => ({ ...prev, isDeleting: true }));
    try {
      const { countAsociaciones } = await deleteHallazgoFromCatalogo(deleteModal.hallazgo);
      const msg = countAsociaciones > 0
        ? `"${deleteModal.hallazgo}" y ${countAsociaciones} asociación(es) movidos a Nuevos Hallazgos.`
        : `"${deleteModal.hallazgo}" movido a Nuevos Hallazgos.`;
      showToast(msg);
      setDeleteModal({ isOpen: false, hallazgo: null, categoria: null, associatedAliases: [], isDeleting: false });
    } catch (err) {
      console.error(err);
      showToast('Error al eliminar el hallazgo.');
      setDeleteModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleOpenDeleteVinculo = (alias: string, principal: string) => {
    setDeleteVinculoModal({
      isOpen: true,
      alias,
      principal,
      isDeleting: false,
    });
  };

  const handleConfirmDeleteVinculo = async () => {
    if (!deleteVinculoModal.alias) return;
    setDeleteVinculoModal(prev => ({ ...prev, isDeleting: true }));
    try {
      await deleteSinonimo(deleteVinculoModal.alias);
      showToast(`Vínculo eliminado. "${deleteVinculoModal.alias}" enviado a Nuevos Hallazgos.`);
      setDeleteVinculoModal({ isOpen: false, alias: null, principal: null, isDeleting: false });
    } catch (err) {
      console.error(err);
      showToast('Error al eliminar el vínculo.');
      setDeleteVinculoModal(prev => ({ ...prev, isDeleting: false }));
    }
  };

  // No necesitamos un estado local complejo si actualizamos el contexto directamente.
  // Pero para dar feedback, mostramos un pequeño mensaje temporal.
  const handleRiskChange = (opcion: string, riesgo: NivelRiesgo) => {
    updateHallazgoDefault(opcion, riesgo);
    showToast(`Riesgo de "${opcion}" guardado en BD`);
  };

  const handleExportExcel = () => {
    try {
      // 1. Hoja Catálogo
      const catalogoRows: any[] = [];
      CATEGORIAS_HALLAZGOS.forEach(cat => {
        cat.opciones.forEach(op => {
          const risk = hallazgoDefaults[op] !== undefined ? hallazgoDefaults[op] : 'Bajo';
          const vinculosCount = Object.values(sinonimosList).filter(p => p.toUpperCase() === op.toUpperCase()).length;
          catalogoRows.push({
            'Categoría': cat.nombre,
            'Hallazgo': op,
            'Nivel de Riesgo': risk || 'Sin Clasificar',
            'Vínculos Asociados': vinculosCount
          });
        });
      });

      // 2. Hoja Vínculos
      const vinculosRows: any[] = [];
      Object.entries(sinonimosList).forEach(([alias, principal]) => {
        let catPrincipal = 'Otros';
        for (const cat of CATEGORIAS_HALLAZGOS) {
          if (cat.opciones.includes(principal.toUpperCase())) {
            catPrincipal = cat.nombre;
            break;
          }
        }
        const riskPrincipal = hallazgoDefaults[principal] !== undefined ? hallazgoDefaults[principal] : 'Bajo';
        vinculosRows.push({
          'Término / Alias (Excel)': alias,
          'Hallazgo Principal (Catálogo)': principal,
          'Categoría': catPrincipal,
          'Nivel de Riesgo': riskPrincipal || 'Sin Clasificar'
        });
      });

      catalogoRows.sort((a, b) => a['Categoría'].localeCompare(b['Categoría']) || a['Hallazgo'].localeCompare(b['Hallazgo']));
      vinculosRows.sort((a, b) => a['Categoría'].localeCompare(b['Categoría']) || a['Hallazgo Principal (Catálogo)'].localeCompare(b['Hallazgo Principal (Catálogo)']));

      const wb = XLSX.utils.book_new();
      const wsCatalogo = XLSX.utils.json_to_sheet(catalogoRows);
      const wsVinculos = XLSX.utils.json_to_sheet(vinculosRows);

      wsCatalogo['!cols'] = [{ wch: 25 }, { wch: 45 }, { wch: 18 }, { wch: 20 }];
      wsVinculos['!cols'] = [{ wch: 45 }, { wch: 45 }, { wch: 25 }, { wch: 18 }];

      XLSX.utils.book_append_sheet(wb, wsCatalogo, 'Catálogo de Hallazgos');
      XLSX.utils.book_append_sheet(wb, wsVinculos, 'Detalle de Vínculos');

      const today = new Date().toISOString().split('T')[0];
      XLSX.writeFile(wb, `Catalogo_Hallazgos_${today}.xlsx`);

      showToast('Catálogo y vínculos exportados a Excel con éxito.');
    } catch (err) {
      console.error('Error al exportar a Excel:', err);
      showToast('Error al exportar catálogo a Excel.');
    }
  };

  const stats = useMemo(() => {
    const s = {
      Bajo: 0,
      Medio: 0,
      Alto: 0,
      Crítico: 0,
      SinClasificar: 0,
      Total: 0
    };

    CATEGORIAS_HALLAZGOS.forEach(cat => {
      cat.opciones.forEach(op => {
        s.Total++;
        const currentRisk = hallazgoDefaults[op] !== undefined ? hallazgoDefaults[op] : 'Bajo';
        if (currentRisk === 'Bajo') s.Bajo++;
        else if (currentRisk === 'Medio') s.Medio++;
        else if (currentRisk === 'Alto') s.Alto++;
        else if (currentRisk === 'Crítico') s.Crítico++;
        else if (currentRisk === null) s.SinClasificar++;
      });
    });
    return s;
  }, [CATEGORIAS_HALLAZGOS, hallazgoDefaults, categoriasVersion]);

  const filteredCategorias = useMemo(() => {
    const query = searchCatalogo.trim().toLowerCase();

    return CATEGORIAS_HALLAZGOS.map(cat => {
      const matchingOpciones = cat.opciones.filter(op => {
        // 1. Text search
        const matchesSearch = query === '' || op.toLowerCase().includes(query);
        if (!matchesSearch) return false;

        // 2. Risk filter
        const currentRisk = hallazgoDefaults[op] !== undefined ? hallazgoDefaults[op] : 'Bajo';
        if (riskFilter === 'Todos') return true;
        if (riskFilter === 'SinClasificar') return currentRisk === null;
        return currentRisk === riskFilter;
      });

      return {
        ...cat,
        matchingOpciones,
        totalOpciones: cat.opciones.length
      };
    }).filter(cat => cat.matchingOpciones.length > 0 || (riskFilter === 'Todos' && query === ''));
  }, [CATEGORIAS_HALLAZGOS, hallazgoDefaults, riskFilter, searchCatalogo, categoriasVersion]);

  const visibleCount = useMemo(() => {
    return filteredCategorias.reduce((acc, cat) => acc + cat.matchingOpciones.length, 0);
  }, [filteredCategorias]);

  if (isLoadingGlobal) {
    return (
      <div className="flex-1 bg-slate-50 relative">
        <LoadingScreen />
      </div>
    );
  }

  return (
    <main ref={mainRef} className="page-padding flex-1 bg-slate-50/50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <Title className="text-2xl font-bold text-slate-800">Catálogo de Hallazgos</Title>
            <Text className="text-slate-500 mt-1">Configura el nivel de riesgo clínico por defecto para cada hallazgo.</Text>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <button
            type="button"
            onClick={() => setRiskFilter('Todos')}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              riskFilter === 'Todos'
                ? 'bg-slate-200 border-slate-400 ring-2 ring-slate-400 shadow-md scale-[1.02]'
                : 'bg-slate-100 border-slate-200/60 hover:bg-slate-200/70 shadow-sm'
            }`}
          >
            <span className="text-xs font-bold text-slate-500 uppercase block">Total</span>
            <span className="text-xl font-black text-slate-700">{stats.Total}</span>
          </button>
          <button
            type="button"
            onClick={() => setRiskFilter('Bajo')}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              riskFilter === 'Bajo'
                ? 'bg-emerald-100 border-emerald-400 ring-2 ring-emerald-500 shadow-md scale-[1.02]'
                : 'bg-emerald-50 border-emerald-100 hover:bg-emerald-100/70 shadow-sm'
            }`}
          >
            <span className="text-xs font-bold text-emerald-600 uppercase block">Bajo</span>
            <span className="text-xl font-black text-emerald-700">{stats.Bajo}</span>
          </button>
          <button
            type="button"
            onClick={() => setRiskFilter('Medio')}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              riskFilter === 'Medio'
                ? 'bg-amber-100 border-amber-400 ring-2 ring-amber-500 shadow-md scale-[1.02]'
                : 'bg-amber-50 border-amber-100 hover:bg-amber-100/70 shadow-sm'
            }`}
          >
            <span className="text-xs font-bold text-amber-600 uppercase block">Medio</span>
            <span className="text-xl font-black text-amber-700">{stats.Medio}</span>
          </button>
          <button
            type="button"
            onClick={() => setRiskFilter('Alto')}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              riskFilter === 'Alto'
                ? 'bg-orange-100 border-orange-400 ring-2 ring-orange-500 shadow-md scale-[1.02]'
                : 'bg-orange-50 border-orange-100 hover:bg-orange-100/70 shadow-sm'
            }`}
          >
            <span className="text-xs font-bold text-orange-600 uppercase block">Alto</span>
            <span className="text-xl font-black text-orange-700">{stats.Alto}</span>
          </button>
          <button
            type="button"
            onClick={() => setRiskFilter('Crítico')}
            className={`p-3 rounded-xl border text-center transition-all cursor-pointer ${
              riskFilter === 'Crítico'
                ? 'bg-red-100 border-red-400 ring-2 ring-red-500 shadow-md scale-[1.02]'
                : 'bg-red-50 border-red-100 hover:bg-red-100/70 shadow-sm'
            }`}
          >
            <span className="text-xs font-bold text-red-600 uppercase block">Crítico</span>
            <span className="text-xl font-black text-red-700">{stats.Crítico}</span>
          </button>
          <button
            type="button"
            onClick={() => setRiskFilter('SinClasificar')}
            className={`p-3 rounded-xl border-2 text-center transition-all cursor-pointer ${
              riskFilter === 'SinClasificar'
                ? 'bg-rose-100 border-rose-500 ring-2 ring-rose-500 shadow-md scale-[1.02]'
                : stats.SinClasificar > 0
                ? 'bg-red-100 border-red-200 animate-pulse hover:bg-red-200'
                : 'bg-slate-50 border-slate-200/60 hover:bg-slate-100'
            }`}
          >
            <span className={`text-xs font-bold uppercase block ${stats.SinClasificar > 0 ? 'text-red-700' : 'text-slate-500'}`}>Sin Clasificar</span>
            <span className={`text-xl font-black ${stats.SinClasificar > 0 ? 'text-red-800' : 'text-slate-700'}`}>{stats.SinClasificar}</span>
          </button>
        </div>
        <TabGroup>
          <TabList className="mt-4">
            <Tab>
              <div className="flex items-center gap-2 font-medium whitespace-nowrap">
                Catálogo Actual
              </div>
            </Tab>
            <Tab>
              <div className="flex items-center gap-2 font-medium whitespace-nowrap">
                Nuevos Hallazgos
                {pendingTriaje.length > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center animate-pulse">
                    {pendingTriaje.length}
                  </span>
                )}
              </div>
            </Tab>
            <Tab>
              <div className="flex items-center gap-2 font-medium whitespace-nowrap">
                Descartados
                {rechazadosList.length > 0 && (
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {rechazadosList.length}
                  </span>
                )}
              </div>
            </Tab>
            <Tab>
              <div className="flex items-center gap-2 font-medium whitespace-nowrap">
                Vínculos
                {Object.keys(sinonimosList).length > 0 && (
                  <span className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">
                    {Object.keys(sinonimosList).length}
                  </span>
                )}
              </div>
            </Tab>
          </TabList>
          <TabPanels>
            {/* TAB 1: CATÁLOGO */}
            <TabPanel>
              <div className="mt-6 space-y-4">
                {/* Toolbar de Filtros */}
                <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
                  {/* Píldoras de Riesgo */}
                  <div className="flex items-center gap-1.5 flex-nowrap shrink-0 overflow-x-auto no-scrollbar py-0.5">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider mr-1 shrink-0">Riesgo:</span>
                    
                    {(['Todos', 'Bajo', 'Medio', 'Alto', 'Crítico'] as const).map((r) => {
                      const isActive = riskFilter === r;
                      const colorStyles = {
                        Todos: isActive ? 'bg-slate-800 text-white shadow-sm ring-1 ring-slate-800' : 'bg-slate-100 text-slate-600 hover:bg-slate-200',
                        Bajo: isActive ? 'bg-emerald-600 text-white shadow-sm ring-1 ring-emerald-600' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100',
                        Medio: isActive ? 'bg-amber-600 text-white shadow-sm ring-1 ring-amber-600' : 'bg-amber-50 text-amber-700 hover:bg-amber-100',
                        Alto: isActive ? 'bg-orange-600 text-white shadow-sm ring-1 ring-orange-600' : 'bg-orange-50 text-orange-700 hover:bg-orange-100',
                        Crítico: isActive ? 'bg-red-600 text-white shadow-sm ring-1 ring-red-600' : 'bg-red-50 text-red-700 hover:bg-red-100',
                      };

                      const count = r === 'Todos' ? stats.Total : stats[r];

                      return (
                        <button
                          key={r}
                          type="button"
                          onClick={() => setRiskFilter(r)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${colorStyles[r]}`}
                        >
                          <span>{r}</span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                            isActive ? 'bg-white/25 text-white' : 'bg-black/5 text-current'
                          }`}>
                            {count}
                          </span>
                        </button>
                      );
                    })}

                    {stats.SinClasificar > 0 && (
                      <button
                        type="button"
                        onClick={() => setRiskFilter('SinClasificar')}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer shrink-0 ${
                          riskFilter === 'SinClasificar' ? 'bg-rose-700 text-white shadow-sm ring-1 ring-rose-700' : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                        }`}
                      >
                        <span>Sin Clasificar</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-red-200 text-red-900 font-black">
                          {stats.SinClasificar}
                        </span>
                      </button>
                    )}
                  </div>

                  {/* Buscador de Texto y Botones de Acción */}
                  <div className="flex items-center gap-2 w-full lg:w-auto shrink-0 justify-end">
                    <div className="relative flex-1 sm:w-44 lg:w-48 xl:w-56">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                        <Search className="w-3.5 h-3.5" />
                      </div>
                      <input
                        type="text"
                        placeholder="Buscar en catálogo..."
                        value={searchCatalogo}
                        onChange={(e) => setSearchCatalogo(e.target.value)}
                        className="block w-full pl-8 pr-7 py-1.5 border border-slate-200 rounded-lg text-xs bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all placeholder:text-slate-400"
                      />
                      {searchCatalogo && (
                        <button
                          type="button"
                          onClick={() => setSearchCatalogo('')}
                          className="absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                          title="Limpiar búsqueda"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={handleExportExcel}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                      title="Descargar catálogo y vínculos en archivo Excel"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Exportar Excel</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAddCategoryModal({ isOpen: true, nombre: '', icono: '🩺', isSubmitting: false, error: null })}
                      className="px-2.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 shrink-0 cursor-pointer"
                      title="Añadir una nueva categoría al catálogo"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Nueva Categoría</span>
                    </button>
                  </div>
                </div>

                {/* Resumen de filtro activo */}
                {(riskFilter !== 'Todos' || searchCatalogo.trim() !== '') && (
                  <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                    <span>
                      Mostrando <strong>{visibleCount}</strong> de <strong>{stats.Total}</strong> hallazgos
                      {riskFilter !== 'Todos' && <> con riesgo <span className="font-bold text-slate-800">{riskFilter}</span></>}
                      {searchCatalogo.trim() && <> coincidiendo con "<strong>{searchCatalogo}</strong>"</>}
                    </span>
                    <button
                      type="button"
                      onClick={() => { setRiskFilter('Todos'); setSearchCatalogo(''); }}
                      className="text-blue-600 font-bold hover:underline cursor-pointer"
                    >
                      Limpiar filtros
                    </button>
                  </div>
                )}

                {/* Grid de Categorías o Empty State */}
                {filteredCategorias.length === 0 ? (
                  <Card className="flex flex-col items-center justify-center p-12 text-center bg-white shadow-sm ring-1 ring-slate-200 border-0 rounded-xl">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400">
                      <Search className="w-6 h-6" />
                    </div>
                    <Title className="text-lg font-bold text-slate-800">No se encontraron hallazgos</Title>
                    <Text className="mt-1 text-slate-500 text-sm max-w-sm">
                      No hay diagnósticos que coincidan con el riesgo <strong className="text-slate-700">{riskFilter}</strong>
                      {searchCatalogo && <> y el texto "<strong>{searchCatalogo}</strong>"</>}.
                    </Text>
                    <button
                      type="button"
                      onClick={() => { setRiskFilter('Todos'); setSearchCatalogo(''); }}
                      className="mt-4 px-4 py-2 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                    >
                      Restablecer filtros
                    </button>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {filteredCategorias.map((categoria) => {
                      const itemsLimit = 5;
                      const displayedOpciones = categoria.matchingOpciones.slice(0, itemsLimit);
                      const hasMore = categoria.matchingOpciones.length > itemsLimit;

                      return (
                        <Card key={categoria.nombre} className="p-0 shadow-sm border-0 ring-1 ring-slate-200 bg-white rounded-xl flex flex-col justify-between">
                          <div>
                            <div 
                              onClick={() => setCategoryModal({ isOpen: true, categoriaNombre: categoria.nombre, searchInside: '' })}
                              className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3 rounded-t-xl hover:bg-slate-100/70 transition-colors cursor-pointer"
                              title="Ver todos los datos de esta categoría"
                            >
                              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center text-lg shadow-inner">
                                {categoria.icono}
                              </div>
                              <h3 className="font-bold text-slate-800">{categoria.nombre}</h3>
                              <span className="ml-auto text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full flex items-center gap-1 hover:text-blue-600 hover:bg-blue-50 transition-colors">
                                {categoria.matchingOpciones.length === categoria.totalOpciones
                                  ? `${categoria.totalOpciones} items`
                                  : `${categoria.matchingOpciones.length} de ${categoria.totalOpciones} items`}
                                <ExternalLink className="w-3 h-3 text-slate-400" />
                              </span>
                            </div>
                            
                            <div className="divide-y divide-slate-100">
                              {displayedOpciones.length === 0 ? (
                                <div className="py-8 px-4 text-center text-slate-400 text-xs italic bg-slate-50/40">
                                  Sin hallazgos aún en esta categoría. Puedes agregar el primer diagnóstico abajo.
                                </div>
                              ) : (
                                displayedOpciones.map((opcion) => {
                                const currentRisk = hallazgoDefaults[opcion] !== undefined ? hallazgoDefaults[opcion] : 'Bajo';
                                const isUnassigned = currentRisk === null;
                                
                                return (
                                  <div key={opcion} className="p-4 flex flex-col xl:flex-row xl:items-center justify-between gap-3 hover:bg-slate-50/50 transition-colors">
                                    <div className="flex items-start gap-2 min-w-0 flex-1">
                                      {isUnassigned && <span title="Sin riesgo asignado" className="mt-0.5 shrink-0"><AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" /></span>}
                                      <span className={`text-sm font-semibold leading-snug break-words ${isUnassigned ? 'text-red-600' : 'text-slate-700'}`}>{opcion}</span>
                                    </div>
                                    
                                    <div className="flex items-center justify-end gap-2 shrink-0">
                                      {isUnassigned && (
                                        <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-1 rounded-md border border-red-200">SIN ASIGNAR</span>
                                      )}
                                      <div className="flex items-center gap-1">
                                        {(['Bajo', 'Medio', 'Alto', 'Crítico'] as NivelRiesgo[]).map(nivel => {
                                          const isActive = currentRisk === nivel;
                                          const colors = {
                                            'Bajo': 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-transparent',
                                            'Medio': 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-transparent',
                                            'Alto': 'text-orange-700 bg-orange-50 hover:bg-orange-100 border-transparent',
                                            'Crítico': 'text-red-700 bg-red-50 hover:bg-red-100 border-transparent'
                                          };
                                          const activeColors = {
                                            'Bajo': 'bg-emerald-500 text-white shadow-sm border-emerald-600',
                                            'Medio': 'bg-amber-500 text-white shadow-sm border-amber-600',
                                            'Alto': 'bg-orange-500 text-white shadow-sm border-orange-600',
                                            'Crítico': 'bg-red-500 text-white shadow-sm border-red-600'
                                          };

                                          return (
                                            <button
                                              key={nivel}
                                              type="button"
                                              onClick={() => handleRiskChange(opcion, nivel)}
                                              className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all border ${isActive ? activeColors[nivel] : colors[nivel]}`}
                                            >
                                              {nivel}
                                            </button>
                                          );
                                        })}
                                      </div>
                                      
                                      {/* Move Button with inline dropdown */}
                                      <div className="relative ml-2">
                                        <button
                                          type="button"
                                          onClick={() => setMoveMenuOpenFor(moveMenuOpenFor === opcion ? null : opcion)}
                                          className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                                          title="Mover a otra categoría"
                                        >
                                          <ArrowRightLeft className="w-3.5 h-3.5" />
                                        </button>
                                        
                                        {moveMenuOpenFor === opcion && (
                                          <div className="absolute right-0 bottom-full mb-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1">
                                            <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-100 mb-1">Mover a...</div>
                                            {CATEGORIAS_HALLAZGOS.filter(c => c.nombre !== categoria.nombre).map(targetCat => (
                                              <button
                                                key={targetCat.nombre}
                                                type="button"
                                                onClick={() => handleMove(opcion, categoria.nombre, targetCat.nombre)}
                                                className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                                              >
                                                <span>{targetCat.icono}</span>
                                                {targetCat.nombre}
                                              </button>
                                            ))}
                                          </div>
                                        )}
                                      </div>

                                      {/* Delete Button */}
                                      <button
                                        type="button"
                                        onClick={() => handleOpenDelete(opcion, categoria.nombre)}
                                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                                        title="Eliminar del catálogo"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                            </div>
                          </div>

                          <div>
                            {/* Botón Ver todos de esta categoría si hay más de 5 */}
                            {hasMore && (
                              <button
                                type="button"
                                onClick={() => setCategoryModal({ isOpen: true, categoriaNombre: categoria.nombre, searchInside: '' })}
                                className="w-full py-2.5 px-4 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50/40 hover:bg-blue-100/60 border-t border-slate-100 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                              >
                                <span>Ver todos los {categoria.matchingOpciones.length} hallazgos (+{categoria.matchingOpciones.length - itemsLimit} más)</span>
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <div className="p-4 flex items-center gap-2 bg-slate-50 border-t border-slate-100 rounded-b-xl">
                              <input
                                type="text"
                                value={newInputs[categoria.nombre] || ''}
                                onChange={(e) => handleInputChange(categoria.nombre, e.target.value)}
                                placeholder="NUEVO RIESGO..."
                                className="flex-1 text-sm px-3 py-1.5 rounded-md border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase placeholder:normal-case"
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') handleAdd(categoria.nombre);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => handleAdd(categoria.nombre)}
                                disabled={!newInputs[categoria.nombre]?.trim()}
                                className="px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 transition-colors cursor-pointer"
                              >
                                <Plus className="w-4 h-4" /> Agregar
                              </button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </div>
            </TabPanel>

            {/* TAB 2: PENDIENTES DE TRIAJE */}
            <TabPanel>
              <div className="mt-6">
                {pendingTriaje.length === 0 ? (
                  <Card className="flex flex-col items-center justify-center p-12 text-center bg-white shadow-sm ring-1 ring-slate-200 border-0 border-t-4 border-t-emerald-500 rounded-xl">
                    <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mb-4">
                      <PartyPopper className="w-8 h-8 text-emerald-600" />
                    </div>
                    <Title className="text-xl font-bold text-slate-800">¡Todo al día!</Title>
                    <Text className="mt-2 max-w-sm text-slate-500">
                      No hay hallazgos pendientes por clasificar. Has procesado todos los diagnósticos nuevos correctamente.
                    </Text>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-blue-50 border border-blue-100 text-blue-800 p-4 rounded-xl flex items-start gap-3">
                      <ShieldAlert className="w-5 h-5 mt-0.5 shrink-0 text-blue-600" />
                      <p className="text-sm">Revisa estos diagnósticos nuevos detectados en los Excel subidos. Asígnales una categoría y riesgo para agregarlos al catálogo, o recházalos si son texto inválido (como "SANO" o "NORMAL").</p>
                    </div>
                    {pendingTriaje.map((hallazgo) => (
                      <Card key={hallazgo} className="p-0 shadow-sm border-0 ring-1 ring-slate-200 bg-white rounded-xl">
                        <div className="p-4 flex flex-col gap-4">
                          {/* Texto arriba */}
                          <div className="w-full">
                            <h3 className="text-base sm:text-lg font-black text-slate-800 break-words leading-tight">{hallazgo}</h3>
                          </div>
                          
                          {/* Acciones e Inputs abajo a ancho completo */}
                          <div className="flex flex-col gap-3 w-full">
                            {/* Selector de Modo */}
                            <div className="flex p-1 bg-slate-100 rounded-lg w-full">
                              <button
                                onClick={() => setTriajeMode(prev => ({ ...prev, [hallazgo]: 'nuevo' }))}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${(!triajeMode[hallazgo] || triajeMode[hallazgo] === 'nuevo') ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                Añadir Nuevo
                              </button>
                              <button
                                onClick={() => setTriajeMode(prev => ({ ...prev, [hallazgo]: 'vincular' }))}
                                className={`flex-1 py-1.5 text-xs font-bold rounded-md transition-all ${(triajeMode[hallazgo] === 'vincular') ? 'bg-white shadow text-blue-700' : 'text-slate-500 hover:text-slate-700'}`}
                              >
                                Vincular a Existente
                              </button>
                            </div>

                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full">
                              {/* Formulario según Modo */}
                              {(!triajeMode[hallazgo] || triajeMode[hallazgo] === 'nuevo') ? (
                                <div className="flex items-center gap-2 flex-1 min-w-0 w-full">
                                  <select 
                                    className="text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 flex-1 min-w-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedCategoria[hallazgo] || 'Otros'}
                                    onChange={(e) => setSelectedCategoria(prev => ({ ...prev, [hallazgo]: e.target.value }))}
                                  >
                                    {CATEGORIAS_HALLAZGOS.map(cat => (
                                      <option key={cat.nombre} value={cat.nombre}>{cat.nombre}</option>
                                    ))}
                                  </select>
                                  
                                  <select
                                    className="text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 w-28 shrink-0 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    value={selectedRiesgo[hallazgo] || 'Bajo'}
                                    onChange={(e) => setSelectedRiesgo(prev => ({ ...prev, [hallazgo]: e.target.value as NivelRiesgo }))}
                                  >
                                    <option value="Bajo">Bajo</option>
                                    <option value="Medio">Medio</option>
                                    <option value="Alto">Alto</option>
                                    <option value="Crítico">Crítico</option>
                                  </select>
                                </div>
                              ) : (
                                <div className="flex-1 min-w-0 w-full">
                                  <SearchSelect 
                                    value={selectedSinonimo[hallazgo] || ''} 
                                    onValueChange={(val) => setSelectedSinonimo(prev => ({ ...prev, [hallazgo]: val }))}
                                    placeholder="Buscar hallazgo..."
                                    className="w-full"
                                  >
                                    {allOpciones.map(op => (
                                      <SearchSelectItem key={op} value={op}>{op}</SearchSelectItem>
                                    ))}
                                  </SearchSelect>
                                </div>
                              )}
                              
                              {/* Acciones */}
                              <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                                <button 
                                  onClick={() => handleAcceptTriaje(hallazgo)}
                                  disabled={triajeMode[hallazgo] === 'vincular' && !selectedSinonimo[hallazgo]}
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                >
                                  <Check className="w-4 h-4" /> {triajeMode[hallazgo] === 'vincular' ? 'Vincular' : 'Aceptar'}
                                </button>
                                <button 
                                  onClick={() => handleRejectTriaje(hallazgo)}
                                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 bg-rose-100 hover:bg-rose-200 text-rose-700 px-4 py-2 rounded-lg text-sm font-bold transition-colors"
                                  title="Descartar (enviar a ignorados)"
                                >
                                  <X className="w-4 h-4" /> Descartar
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            </TabPanel>

            {/* TAB 3: RECHAZADOS (DESCARTADOS) */}
            <TabPanel>
              <div className="mt-6">
                <Card className="shadow-sm border-0 ring-1 ring-slate-200 p-0 bg-white rounded-xl">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between rounded-t-xl">
                    <div>
                      <h3 className="font-bold text-slate-800">Hallazgos Descartados</h3>
                      <p className="text-xs text-slate-500 mt-1">Estos textos fueron detectados en Excel pero se han marcado como inválidos o ruido.</p>
                    </div>
                    
                    <div className="relative w-full sm:w-72 shrink-0">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="w-4 h-4 text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Buscar en rechazados..." 
                        value={searchRechazados}
                        onChange={(e) => setSearchRechazados(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  {rechazadosList.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <Check className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">No hay diagnósticos rechazados.</p>
                    </div>
                  ) : filteredRechazados.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 font-medium">
                      No se encontraron resultados para "{searchRechazados}".
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {filteredRechazados.map((hallazgo) => (
                        <div key={hallazgo} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                          <span className="font-semibold text-slate-700 break-words">{hallazgo}</span>
                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                            <button
                              onClick={() => restoreRechazado(hallazgo)}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                              title="Restaurar a pendientes"
                            >
                              <ArchiveRestore className="w-4 h-4" /> Restaurar
                            </button>
                            <button
                              onClick={() => deleteRechazado(hallazgo)}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              title="Eliminar de la lista negra definitivamente"
                            >
                              <Trash2 className="w-4 h-4" /> Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </TabPanel>

            {/* TAB 4: VÍNCULOS (SINÓNIMOS) */}
            <TabPanel>
              <div className="mt-6">
                <Card className="shadow-sm border-0 ring-1 ring-slate-200 p-0 bg-white rounded-xl">
                  <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row gap-4 items-center justify-between rounded-t-xl">
                    <div>
                      <h3 className="font-bold text-slate-800">Diccionario de Vínculos</h3>
                      <p className="text-xs text-slate-500 mt-1">Estos textos nuevos se han vinculado a hallazgos existentes en el catálogo.</p>
                    </div>
                    
                    <div className="relative w-full sm:w-72 shrink-0">
                      <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                        <Search className="w-4 h-4 text-slate-400" />
                      </div>
                      <input 
                        type="text" 
                        placeholder="Buscar vínculo..." 
                        value={searchSinonimos}
                        onChange={(e) => setSearchSinonimos(e.target.value)}
                        className="block w-full pl-9 pr-3 py-2 border border-slate-200 rounded-lg text-sm bg-white focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>
                  
                  {Object.keys(sinonimosList).length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3">
                        <Check className="w-6 h-6 text-slate-400" />
                      </div>
                      <p className="text-slate-500 font-medium">No hay vínculos creados aún.</p>
                    </div>
                  ) : sinonimosEntries.length === 0 ? (
                    <div className="p-12 text-center text-slate-500 font-medium">
                      No se encontraron resultados para "{searchSinonimos}".
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {sinonimosEntries.map(([alias, principal]) => (
                        <div key={alias} className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                          <div className="flex items-center gap-3 break-words min-w-0 flex-1">
                            <span className="font-semibold text-slate-700">{alias}</span>
                            <span className="text-slate-400 text-xs font-bold uppercase tracking-widest shrink-0">se vincula a</span>
                            <span className="font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">{principal}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto">
                            <button
                              onClick={() => handleOpenDeleteVinculo(alias, principal)}
                              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                              title="Eliminar este vínculo"
                            >
                              <Trash2 className="w-4 h-4" /> Eliminar
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </div>
            </TabPanel>
          </TabPanels>
        </TabGroup>
      </div>

      {/* Modal Amplio de Categoría con todos sus datos */}
      {categoryModal.isOpen && categoryModal.categoriaNombre && (() => {
        const cat = CATEGORIAS_HALLAZGOS.find(c => c.nombre === categoryModal.categoriaNombre);
        if (!cat) return null;

        const query = categoryModal.searchInside.trim().toLowerCase();
        const modalOpciones = cat.opciones.filter(op => {
          const matchesSearch = query === '' || op.toLowerCase().includes(query);
          if (!matchesSearch) return false;
          const currentRisk = hallazgoDefaults[op] !== undefined ? hallazgoDefaults[op] : 'Bajo';
          if (riskFilter === 'Todos') return true;
          if (riskFilter === 'SinClasificar') return currentRisk === null;
          return currentRisk === riskFilter;
        });

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[88vh] flex flex-col overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
              {/* Header del Modal */}
              <div className="px-6 py-4 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center text-xl shadow-inner">
                    {cat.icono}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-black text-slate-800">{cat.nombre}</h3>
                      <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                        {cat.opciones.length} hallazgos en total
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Gestión completa de diagnósticos y niveles de riesgo de esta categoría.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setCategoryModal({ isOpen: false, categoriaNombre: null, searchInside: '' })}
                  className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar ventana"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Buscador dentro de la categoría */}
              <div className="px-6 py-3 border-b border-slate-100 bg-white flex items-center justify-between gap-4">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder={`Buscar dentro de ${cat.nombre}...`}
                    value={categoryModal.searchInside}
                    onChange={(e) => setCategoryModal(prev => ({ ...prev, searchInside: e.target.value }))}
                    className="w-full pl-9 pr-8 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50/50 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  />
                  {categoryModal.searchInside && (
                    <button
                      type="button"
                      onClick={() => setCategoryModal(prev => ({ ...prev, searchInside: '' }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <span className="text-xs font-medium text-slate-500 shrink-0">
                  Mostrando <strong>{modalOpciones.length}</strong> de <strong>{cat.opciones.length}</strong>
                </span>
              </div>

              {/* Lista completa de hallazgos con scroll */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 sm:p-4">
                {modalOpciones.length === 0 ? (
                  <div className="p-12 text-center text-slate-400 text-sm">
                    No se encontraron hallazgos en {cat.nombre} que coincidan con la búsqueda.
                  </div>
                ) : (
                  modalOpciones.map((opcion) => {
                    const currentRisk = hallazgoDefaults[opcion] !== undefined ? hallazgoDefaults[opcion] : 'Bajo';
                    const isUnassigned = currentRisk === null;

                    return (
                      <div key={opcion} className="p-3.5 flex flex-col xl:flex-row xl:items-center justify-between gap-3 hover:bg-slate-50/60 rounded-lg transition-colors">
                        <div className="flex items-start gap-2 min-w-0 flex-1">
                          {isUnassigned && <span title="Sin riesgo asignado" className="mt-0.5 shrink-0"><AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" /></span>}
                          <span className={`text-sm font-semibold leading-snug break-words ${isUnassigned ? 'text-red-600' : 'text-slate-700'}`}>{opcion}</span>
                        </div>

                        <div className="flex items-center justify-end gap-2 shrink-0">
                          {isUnassigned && (
                            <span className="text-[10px] font-bold text-red-600 bg-red-100 px-2 py-1 rounded-md border border-red-200">SIN ASIGNAR</span>
                          )}
                          <div className="flex items-center gap-1">
                            {(['Bajo', 'Medio', 'Alto', 'Crítico'] as NivelRiesgo[]).map(nivel => {
                              const isActive = currentRisk === nivel;
                              const colors = {
                                'Bajo': 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-transparent',
                                'Medio': 'text-amber-700 bg-amber-50 hover:bg-amber-100 border-transparent',
                                'Alto': 'text-orange-700 bg-orange-50 hover:bg-orange-100 border-transparent',
                                'Crítico': 'text-red-700 bg-red-50 hover:bg-red-100 border-transparent'
                              };
                              const activeColors = {
                                'Bajo': 'bg-emerald-500 text-white shadow-sm border-emerald-600',
                                'Medio': 'bg-amber-500 text-white shadow-sm border-amber-600',
                                'Alto': 'bg-orange-500 text-white shadow-sm border-orange-600',
                                'Crítico': 'bg-red-500 text-white shadow-sm border-red-600'
                              };

                              return (
                                <button
                                  key={nivel}
                                  type="button"
                                  onClick={() => handleRiskChange(opcion, nivel)}
                                  className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all border ${isActive ? activeColors[nivel] : colors[nivel]}`}
                                >
                                  {nivel}
                                </button>
                              );
                            })}
                          </div>

                          {/* Move Button with inline dropdown */}
                          <div className="relative ml-2">
                            <button
                              type="button"
                              onClick={() => setMoveMenuOpenFor(moveMenuOpenFor === opcion ? null : opcion)}
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                              title="Mover a otra categoría"
                            >
                              <ArrowRightLeft className="w-3.5 h-3.5" />
                            </button>

                            {moveMenuOpenFor === opcion && (
                              <div className="absolute right-0 bottom-full mb-1 w-48 bg-white rounded-lg shadow-xl border border-slate-200 z-50 py-1">
                                <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 border-b border-slate-100 mb-1">Mover a...</div>
                                {CATEGORIAS_HALLAZGOS.filter(c => c.nombre !== cat.nombre).map(targetCat => (
                                  <button
                                    key={targetCat.nombre}
                                    type="button"
                                    onClick={() => handleMove(opcion, cat.nombre, targetCat.nombre)}
                                    className="w-full text-left px-3 py-1.5 text-xs hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer"
                                  >
                                    <span>{targetCat.icono}</span>
                                    {targetCat.nombre}
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenDelete(opcion, cat.nombre)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Eliminar del catálogo"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pie con input para agregar nuevo */}
              <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
                <input
                  type="text"
                  value={newInputs[cat.nombre] || ''}
                  onChange={(e) => handleInputChange(cat.nombre, e.target.value)}
                  placeholder={`NUEVO RIESGO EN ${cat.nombre.toUpperCase()}...`}
                  className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase placeholder:normal-case bg-white"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd(cat.nombre);
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleAdd(cat.nombre)}
                  disabled={!newInputs[cat.nombre]?.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer transition-colors"
                >
                  <Plus className="w-4 h-4" /> Agregar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Modal de Confirmación para Eliminar Hallazgo */}
      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">¿Eliminar hallazgo del catálogo?</h3>
                  <p className="text-xs text-slate-500">Esta acción no destruye la información, la traslada a triaje.</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 mb-4 text-sm text-slate-700 leading-relaxed">
                ¿Está seguro de eliminar <strong className="text-slate-900 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">{deleteModal.hallazgo}</strong>?
                <p className="mt-2 text-slate-600">
                  Esta acción lo quitará del Catálogo Actual y <strong>lo mandará a Nuevos Hallazgos</strong> junto a sus asociaciones si es que tiene.
                </p>
              </div>

              {/* Panel de Asociaciones */}
              {deleteModal.associatedAliases.length > 0 ? (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 text-amber-800 font-bold text-xs uppercase tracking-wide mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                    <span>Asociaciones vinculadas ({deleteModal.associatedAliases.length})</span>
                  </div>
                  <p className="text-xs text-amber-700 mb-2.5">
                    Los siguientes términos vinculados también se desvincularán y pasarán a Nuevos Hallazgos para su reclasificación:
                  </p>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto pr-1">
                    {deleteModal.associatedAliases.map(alias => (
                      <span key={alias} className="text-xs font-semibold px-2 py-0.5 bg-white text-amber-900 border border-amber-300 rounded-md shadow-2xs">
                        {alias}
                      </span>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-slate-50 border border-slate-200/60 rounded-xl p-3 mb-6 flex items-center gap-2 text-xs text-slate-500">
                  <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>Este hallazgo no tiene asociaciones vinculadas actualmente.</span>
                </div>
              )}

              {/* Botones de acción */}
              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setDeleteModal(prev => ({ ...prev, isOpen: false }))}
                  disabled={deleteModal.isDeleting}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDelete}
                  disabled={deleteModal.isDeleting}
                  className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 shadow-sm"
                >
                  {deleteModal.isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Moviendo...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Sí, eliminar y mover a Nuevos Hallazgos</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmación para Eliminar Vínculo */}
      {deleteVinculoModal.isOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center shrink-0">
                  <Trash2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-800">¿Eliminar este vínculo?</h3>
                  <p className="text-xs text-slate-500">El término se desvinculará y volverá a triaje.</p>
                </div>
              </div>

              <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4 mb-4 text-sm text-slate-700 leading-relaxed space-y-2">
                <p>
                  ¿Está seguro de eliminar el vínculo entre <strong className="text-slate-900 font-bold bg-white px-2 py-0.5 rounded border border-slate-200">{deleteVinculoModal.alias}</strong> y <strong className="text-blue-700 font-bold bg-blue-50 px-2 py-0.5 rounded border border-blue-200">{deleteVinculoModal.principal}</strong>?
                </p>
                <p className="text-slate-600">
                  Esta acción <strong>mandará el término "{deleteVinculoModal.alias}" a Nuevos Hallazgos</strong> para que puedas reclasificarlo o vincularlo nuevamente.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setDeleteVinculoModal(prev => ({ ...prev, isOpen: false }))}
                  disabled={deleteVinculoModal.isDeleting}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleConfirmDeleteVinculo}
                  disabled={deleteVinculoModal.isDeleting}
                  className="px-4 py-2 text-sm font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-70 shadow-sm"
                >
                  {deleteVinculoModal.isDeleting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      <span>Moviendo...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>Sí, eliminar y mover a Nuevos Hallazgos</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Añadir Nueva Categoría */}
      {addCategoryModal.isOpen && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95 duration-200">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center text-xl shadow-inner">
                    <FolderPlus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-800">Nueva Categoría</h3>
                    <p className="text-xs text-slate-500">Agrega una clasificación al catálogo de hallazgos.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAddCategoryModal(prev => ({ ...prev, isOpen: false }))}
                  className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleCreateCategory} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Nombre de la Categoría
                  </label>
                  <input
                    type="text"
                    autoFocus
                    placeholder="Ej: Dermatológicos, Respiratorios, etc."
                    value={addCategoryModal.nombre}
                    onChange={(e) => setAddCategoryModal(prev => ({ ...prev, nombre: e.target.value, error: null }))}
                    className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white bg-slate-50/50 transition-all placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                    Ícono Representativo
                  </label>
                  <div className="flex items-center gap-3 mb-2.5">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-2xl shrink-0 shadow-inner">
                      {addCategoryModal.icono || '📁'}
                    </div>
                    <input
                      type="text"
                      maxLength={4}
                      value={addCategoryModal.icono}
                      onChange={(e) => setAddCategoryModal(prev => ({ ...prev, icono: e.target.value }))}
                      placeholder="Emoji o icono"
                      className="flex-1 text-sm px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <div className="text-[11px] font-semibold text-slate-500 mb-1.5">Selección rápida de íconos:</div>
                  <div className="grid grid-cols-10 gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    {PRESET_ICONS.map(emoji => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => setAddCategoryModal(prev => ({ ...prev, icono: emoji }))}
                        className={`h-8 rounded-lg flex items-center justify-center text-lg transition-transform hover:scale-110 cursor-pointer ${
                          addCategoryModal.icono === emoji ? 'bg-blue-100 ring-2 ring-blue-500' : 'hover:bg-white'
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>

                {addCategoryModal.error && (
                  <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-500" />
                    <span>{addCategoryModal.error}</span>
                  </div>
                )}

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setAddCategoryModal(prev => ({ ...prev, isOpen: false }))}
                    disabled={addCategoryModal.isSubmitting}
                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={addCategoryModal.isSubmitting || !addCategoryModal.nombre.trim()}
                    className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {addCategoryModal.isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Creando...</span>
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        <span>Crear Categoría</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Toast de Feedback - Fijo en la esquina inferior derecha del viewport */}
      <div
        style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          zIndex: 99999,
          transition: 'opacity 0.3s ease, transform 0.3s ease',
          opacity: toastVisible ? 1 : 0,
          transform: toastVisible ? 'translateY(0)' : 'translateY(12px)',
          pointerEvents: toastVisible ? 'auto' : 'none',
        }}
      >
        <div className="flex items-center gap-3 bg-emerald-600 text-white px-4 py-3 rounded-xl shadow-2xl">
          <div className="bg-white/20 p-1.5 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <span className="font-semibold text-sm">{toastMessage}</span>
        </div>
      </div>
    </main>
  );
}
