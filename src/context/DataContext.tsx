import React, { createContext, useContext, useState, useMemo, useEffect } from 'react';
import type { ParsedRow, NivelRiesgo, RiesgoHallazgo } from '../services/excelParser';
import { CATEGORIAS_HALLAZGOS, RIESGO_DEFECTO_HALLAZGOS } from '../services/excelParser';
import { fetchEvaluaciones, fetchConfiguracion, updateConfiguracion } from '../services/firestoreService';
import { useAuth } from './AuthContext';

export interface KPIMetrics {
  cobertura: { valor: number; total: number; porcentaje: number };
  realizados: { valor: number; total: number };
  vencidos: { valor: number; porcentaje: number };
  observados: { valor: number; porcentaje: number };
  hallazgos_criticos: { valor: number };
}

interface DataContextType {
  rawData: ParsedRow[];
  filteredData: ParsedRow[];
  filters: Record<string, any>;
  filterOptions: Record<string, string[]>;
  kpis: KPIMetrics;
  chartsData: {
    tipoExamen: { name: string; value: number }[];
    distribucionAptitud: { name: string; value: number }[];
    evolucionCobertura: { periodo: string; Cobertura: number | null; Meta: number }[];
    cumplimientoSede: { sede: string; cobertura: number; programados: number; realizados: number; pendientes: number; atrasados: number }[];
    tendenciaCriticos: { periodo: string; hallazgos: number }[];
    hallazgosFrecuentes: { name: string; categoria: string; value: number; trabajadores: number }[];
    hallazgosPorDivision: { name: string; value: number; trabajadores: number }[];
    hallazgosPorCategoria: { name: string; value: number }[];
    hallazgosPorRiesgo: { name: string; value: number }[];
    hallazgosPorGenero: { name: string; value: number; trabajadores: number }[];
    statsHallazgos: { total: number; trabajadoresAltoCritico: number; hallazgosAltoCritico: number };
    hallazgosEnElTiempo: { periodo: string; Bajo: number; Medio: number; Alto: number; Crítico: number; Total: number }[];
    examenesVencidos: { sede: string; total: number; pctSobreProgramado: number; diasPromedio: number }[];
    distribucionGenero: { name: string; value: number; cobertura: number }[];
    distribucionEdad: { rango: string; realizados: number; cobertura: number; total: number }[];
  };
  isDataLoaded: boolean;
  setRawData: (data: ParsedRow[]) => void;
  setFilter: (key: string, value: any) => void;
  clearFilters: () => void;
  hallazgoDefaults: Record<string, NivelRiesgo | null>;
  updateHallazgoDefault: (hallazgo: string, riesgo: NivelRiesgo | null) => void;
  updatePatientAptitud: (patientId: string, periodo: string, newAptitud: string) => Promise<void>;
  updatePatientHallazgos: (patientId: string, hallazgos: RiesgoHallazgo[], periodo?: string) => Promise<void> | void;
  pendingTriaje: string[];
  rechazadosList: string[];
  setPendingTriaje: (items: string[]) => void;
  resolveTriaje: (hallazgo: string, action: 'accept' | 'reject', categoria?: string, riesgo?: NivelRiesgo) => void;
  restoreRechazado: (hallazgo: string) => void;
  deleteRechazado: (hallazgo: string) => void;
  sinonimosList: Record<string, string>;
  resolveTriajeVincular: (alias: string, principal: string) => void;
  deleteSinonimo: (alias: string) => void;
  deleteHallazgoFromCatalogo: (hallazgo: string) => Promise<{ countAsociaciones: number; associatedAliases: string[] }>;
  addCategoria: (nombre: string, icono: string) => Promise<void>;
  saveCategoriasCatalogo: () => Promise<void>;
  categoriasVersion: number;
  isLoadingGlobal: boolean;
}

const defaultKpis: KPIMetrics = {
  cobertura: { valor: 0, total: 0, porcentaje: 0 },
  realizados: { valor: 0, total: 0 },
  vencidos: { valor: 0, porcentaje: 0 },
  observados: { valor: 0, porcentaje: 0 },
  hallazgos_criticos: { valor: 0 },
};

const defaultChartsData = {
  tipoExamen: [],
  distribucionAptitud: [],
  evolucionCobertura: [],
  cumplimientoSede: [],
  tendenciaCriticos: [],
  hallazgosFrecuentes: [],
  hallazgosPorCategoria: [],
  hallazgosPorRiesgo: [],
  statsHallazgos: { total: 0, trabajadoresAltoCritico: 0, hallazgosAltoCritico: 0 },
  hallazgosEnElTiempo: [],
  hallazgosPorDivision: [],
  hallazgosPorGenero: [],
  examenesVencidos: [],
  distribucionGenero: [],
  distribucionEdad: []
};

export const RIESGO_WEIGHT: Record<string, number> = {
  'Crítico': 4,
  'Alto': 3,
  'Medio': 2,
  'Bajo': 1
};

export function computePatientRisk(
  hallazgos: RiesgoHallazgo[] | undefined,
  hallazgoDefaults: Record<string, NivelRiesgo | null>,
  aptitud?: string | null
): { nivel_riesgo: NivelRiesgo | null; hallazgos_seleccionados: RiesgoHallazgo[] } {
  if (!hallazgos || hallazgos.length === 0) {
    const aptSimplificada = aptitud?.toUpperCase();
    const fallback = aptSimplificada === 'OBSERVADO' ? null : 'Bajo';
    return { nivel_riesgo: fallback, hallazgos_seleccionados: [] };
  }

  let maxRiesgo: NivelRiesgo | null = null;
  const updatedHallazgos: RiesgoHallazgo[] = hallazgos.map(h => {
    const hKey = (h.hallazgo || '').trim();
    const hUpper = hKey.toUpperCase();

    const currentRiesgo = hallazgoDefaults[hKey] !== undefined && hallazgoDefaults[hKey] !== null
      ? hallazgoDefaults[hKey]
      : (hallazgoDefaults[hUpper] !== undefined && hallazgoDefaults[hUpper] !== null
        ? hallazgoDefaults[hUpper]
        : (h.nivel_riesgo || 'Bajo'));

    if (currentRiesgo && (!maxRiesgo || (RIESGO_WEIGHT[currentRiesgo] || 0) > (RIESGO_WEIGHT[maxRiesgo] || 0))) {
      maxRiesgo = currentRiesgo;
    }

    return {
      ...h,
      nivel_riesgo: currentRiesgo
    };
  });

  return {
    nivel_riesgo: maxRiesgo || 'Bajo',
    hallazgos_seleccionados: updatedHallazgos
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const { currentUser } = useAuth();
  const [rawDataState, setRawDataState] = useState<ParsedRow[]>([]);
  const [filters, setFilters] = useState<Record<string, any>>({
    anio: 'Todos',
    periodo: 'Todos',
    pais: 'Todos',
    sede: [],
    protocolos: [],
  });

  const [hallazgoDefaults, setHallazgoDefaults] = useState<Record<string, NivelRiesgo | null>>(RIESGO_DEFECTO_HALLAZGOS);
  const [pendingTriaje, setPendingTriajeState] = useState<string[]>([]);
  const [rechazadosList, setRechazadosList] = useState<string[]>([]);
  const [sinonimosList, setSinonimosList] = useState<Record<string, string>>({});
  const [categoriasVersion, setCategoriasVersion] = useState<number>(0);
  const [isLoadingGlobal, setIsLoadingGlobal] = useState<boolean>(true);

  // Recalcular dinámicamente el riesgo de cada paciente basándose en el catálogo hallazgoDefaults vigente
  const rawData = useMemo(() => {
    return rawDataState.map(row => {
      const { nivel_riesgo, hallazgos_seleccionados } = computePatientRisk(
        row.hallazgos_seleccionados,
        hallazgoDefaults,
        row.aptitud
      );
      return {
        ...row,
        nivel_riesgo,
        hallazgos_seleccionados
      };
    });
  }, [rawDataState, hallazgoDefaults]);

  // Fetch inicial desde Firestore
  useEffect(() => {
    async function loadData() {
      if (!currentUser) {
        setRawDataState([]);
        setIsLoadingGlobal(false);
        return;
      }
      setIsLoadingGlobal(true);
      try {
        const [evals, config] = await Promise.all([
          fetchEvaluaciones(),
          fetchConfiguracion()
        ]);
        
        // Cargar el módulo para sincronizar las configuraciones antes de renderizar los datos
        const m = await import('../services/excelParser');
        
        m.DIAGNOSTICOS_RECHAZADOS.clear();
        config.rechazadosList?.forEach(r => m.DIAGNOSTICOS_RECHAZADOS.add(r));
        
        for (const key in m.SINONIMOS_HALLAZGOS) delete m.SINONIMOS_HALLAZGOS[key];
        if (config.sinonimosList) {
          Object.assign(m.SINONIMOS_HALLAZGOS, config.sinonimosList);
        }
        
        for (const key in m.RIESGO_DEFECTO_HALLAZGOS) delete m.RIESGO_DEFECTO_HALLAZGOS[key];
        if (config.hallazgoDefaults) {
           Object.assign(m.RIESGO_DEFECTO_HALLAZGOS, config.hallazgoDefaults);
        }
        
        if (config.categoriasHallazgos && config.categoriasHallazgos.length > 0) {
          const cats = [...config.categoriasHallazgos];
          const nutricionalesIndex = cats.findIndex(c => c.nombre?.trim().toUpperCase() === 'NUTRICIONALES');
          if (nutricionalesIndex !== -1) {
            const nutricionalesCat = cats[nutricionalesIndex];
            const metabolicoIndex = cats.findIndex(c => c.nombre?.toUpperCase().includes('METAB'));
            if (metabolicoIndex !== -1) {
              const currentOpciones = new Set(cats[metabolicoIndex].opciones);
              (nutricionalesCat.opciones || []).forEach((op: string) => currentOpciones.add(op));
              cats[metabolicoIndex].opciones = Array.from(currentOpciones);
            }
            cats.splice(nutricionalesIndex, 1);
            // Sincronizar en Firestore para persistir la unificación de Nutricionales en Metabólicos
            updateConfiguracion({ categoriasHallazgos: cats }).catch(e => console.error("Error migrating categoriasHallazgos in Firestore:", e));
          }
          m.CATEGORIAS_HALLAZGOS.splice(0, m.CATEGORIAS_HALLAZGOS.length, ...cats);
        }

        // Una vez sincronizados los diccionarios, cargamos la data para que useMemo la analice correctamente
        setRawDataState(evals);
        
        // Auto-seleccionar el mes más reciente al cargar los datos
        if (evals.length > 0) {
          const periodos = evals.map(e => e.periodo).filter(Boolean).sort().reverse();
          if (periodos.length > 0) {
            const mostRecent = periodos[0];
            const parts = mostRecent.split('-');
            if (parts.length === 2) {
              setFilters(prev => ({
                ...prev,
                anio: parts[0],
                periodo: parts[1]
              }));
            }
          }
        }
        
        setRechazadosList(config.rechazadosList || []);
        setSinonimosList(config.sinonimosList || {});
        setHallazgoDefaults(config.hallazgoDefaults || m.RIESGO_DEFECTO_HALLAZGOS);
        setPendingTriajeState(config.pendingTriaje || []);

      } catch (err) {
        console.error("Error cargando datos de Firestore:", err);
      } finally {
        setIsLoadingGlobal(false);
      }
    }
    
    loadData();
  }, [currentUser]);

  const setPendingTriaje = (items: string[]) => {
    setPendingTriajeState(prev => {
      const newItems = new Set([...prev, ...items]);
      const newArray = Array.from(newItems);
      if (items.length > 0) {
        updateConfiguracion({ pendingTriaje: newArray }).catch(console.error);
      }
      return newArray;
    });
  };

  const resolveTriaje = async (hallazgo: string, action: 'accept' | 'reject', categoria?: string, riesgo?: NivelRiesgo) => {
    const { addHallazgoToCategoria, addToRechazados, DIAGNOSTICOS_RECHAZADOS, CATEGORIAS_HALLAZGOS } = await import('../services/excelParser');
    
    if (action === 'accept' && categoria && riesgo) {
      addHallazgoToCategoria(categoria, hallazgo, riesgo);
      updateHallazgoDefault(hallazgo, riesgo); // Updates local defaults state
      // Sincronizar categorías
      await updateConfiguracion({ categoriasHallazgos: CATEGORIAS_HALLAZGOS });
    } else if (action === 'reject') {
      addToRechazados(hallazgo);
      const newList = Array.from(DIAGNOSTICOS_RECHAZADOS);
      setRechazadosList(newList);
      await updateConfiguracion({ rechazadosList: newList });
    }
    setPendingTriajeState(prev => {
      const next = prev.filter(h => h !== hallazgo);
      updateConfiguracion({ pendingTriaje: next }).catch(console.error);
      return next;
    });
  };

  const resolveTriajeVincular = async (alias: string, principal: string) => {
    const { addSinonimo, SINONIMOS_HALLAZGOS } = await import('../services/excelParser');
    addSinonimo(alias, principal);
    const newSinonimos = { ...SINONIMOS_HALLAZGOS };
    setSinonimosList(newSinonimos);
    await updateConfiguracion({ sinonimosList: newSinonimos });
    setPendingTriajeState(prev => {
      const next = prev.filter(h => h !== alias);
      updateConfiguracion({ pendingTriaje: next }).catch(console.error);
      return next;
    });
  };

  const restoreRechazado = async (hallazgo: string) => {
    const { removeFromRechazados, DIAGNOSTICOS_RECHAZADOS } = await import('../services/excelParser');
    removeFromRechazados(hallazgo);
    const newList = Array.from(DIAGNOSTICOS_RECHAZADOS);
    setRechazadosList(newList);
    await updateConfiguracion({ rechazadosList: newList });
    setPendingTriajeState(prev => {
      const next = [...prev, hallazgo];
      updateConfiguracion({ pendingTriaje: next }).catch(console.error);
      return next;
    });
  };

  const deleteRechazado = async (hallazgo: string) => {
    const { removeFromRechazados, DIAGNOSTICOS_RECHAZADOS } = await import('../services/excelParser');
    removeFromRechazados(hallazgo);
    const newList = Array.from(DIAGNOSTICOS_RECHAZADOS);
    setRechazadosList(newList);
    await updateConfiguracion({ rechazadosList: newList });
  };

  const deleteSinonimo = async (alias: string) => {
    const { removeSinonimo, SINONIMOS_HALLAZGOS } = await import('../services/excelParser');
    const upperAlias = alias.trim().toUpperCase();
    
    // 1. Remover de la memoria de sinónimos
    removeSinonimo(upperAlias);
    const newSinonimos = { ...SINONIMOS_HALLAZGOS };
    setSinonimosList(newSinonimos);

    // 2. Agregar a pendingTriaje (Nuevos Hallazgos) sin duplicados
    const newPending = Array.from(new Set([...pendingTriaje, upperAlias]));
    setPendingTriajeState(newPending);

    // 3. Persistir atómicamente en Firestore
    await updateConfiguracion({ 
      sinonimosList: newSinonimos,
      pendingTriaje: newPending
    });
  };

  const deleteHallazgoFromCatalogo = async (hallazgo: string) => {
    const { 
      removeHallazgoFromCategoria, 
      removeSinonimo, 
      CATEGORIAS_HALLAZGOS 
    } = await import('../services/excelParser');
    
    const upperHallazgo = hallazgo.trim().toUpperCase();

    // 1. Detectar todas las asociaciones vinculadas a este hallazgo
    const associatedAliases = Object.entries(sinonimosList)
      .filter(([_, principal]) => principal.trim().toUpperCase() === upperHallazgo)
      .map(([alias]) => alias);

    // 2. Remover de CATEGORIAS_HALLAZGOS y RIESGO_DEFECTO_HALLAZGOS en memoria
    removeHallazgoFromCategoria(upperHallazgo);

    // 3. Remover los alias de SINONIMOS_HALLAZGOS en memoria
    associatedAliases.forEach(alias => {
      removeSinonimo(alias);
    });

    // 4. Preparar nuevos estados inmutables
    const nextSinonimos = { ...sinonimosList };
    associatedAliases.forEach(alias => {
      delete nextSinonimos[alias];
    });

    const nextDefaults = { ...hallazgoDefaults };
    delete nextDefaults[upperHallazgo];

    // 5. Agregar el hallazgo principal y sus asociaciones a pendingTriaje
    const itemsToTriaje = [upperHallazgo, ...associatedAliases];
    const nextPending = Array.from(new Set([...pendingTriaje, ...itemsToTriaje]));

    // 6. Actualizar estados locales de React
    setSinonimosList(nextSinonimos);
    setHallazgoDefaults(nextDefaults);
    setPendingTriajeState(nextPending);

    // 7. Persistir en Firestore de forma atómica
    await updateConfiguracion({
      categoriasHallazgos: CATEGORIAS_HALLAZGOS,
      sinonimosList: nextSinonimos,
      hallazgoDefaults: nextDefaults,
      pendingTriaje: nextPending,
    });

    return { countAsociaciones: associatedAliases.length, associatedAliases };
  };

  const updateHallazgoDefault = (hallazgo: string, riesgo: NivelRiesgo | null) => {
    setHallazgoDefaults(prev => {
      const next = { ...prev, [hallazgo]: riesgo };
      updateConfiguracion({ hallazgoDefaults: next }).catch(console.error);
      return next;
    });
  };

  const addCategoria = async (nombre: string, icono: string) => {
    const { addCategoriaToCatalogo, CATEGORIAS_HALLAZGOS } = await import('../services/excelParser');
    const cleanNombre = nombre.trim();
    if (!cleanNombre) throw new Error('El nombre de la categoría no puede estar vacío.');

    const exists = CATEGORIAS_HALLAZGOS.some(c => c.nombre.trim().toLowerCase() === cleanNombre.toLowerCase());
    if (exists) throw new Error(`La categoría "${cleanNombre}" ya existe.`);

    addCategoriaToCatalogo(cleanNombre, icono);
    setCategoriasVersion(v => v + 1);

    await updateConfiguracion({
      categoriasHallazgos: CATEGORIAS_HALLAZGOS
    });
  };

  const saveCategoriasCatalogo = async () => {
    const { CATEGORIAS_HALLAZGOS } = await import('../services/excelParser');
    await updateConfiguracion({
      categoriasHallazgos: CATEGORIAS_HALLAZGOS
    });
    setCategoriasVersion(v => v + 1);
  };

  const setRawData = (data: ParsedRow[]) => {
    setRawDataState(data);
  };

  const updatePatientAptitud = async (patientId: string, periodo: string, newAptitud: string) => {
    const { updatePatient } = await import('../services/firestoreService');
    
    // Update local state first
    setRawDataState(prev => {
      const next = [...prev];
      const index = next.findIndex(r => r.patient_id === patientId && r.periodo === periodo);
      if (index !== -1) {
        next[index] = { ...next[index], aptitud: newAptitud };
      }
      return next;
    });
    
    // Sync to Firestore
    await updatePatient(patientId, periodo, { aptitud: newAptitud });
  };

  const updatePatientHallazgos = async (patientId: string, hallazgos: RiesgoHallazgo[], periodo?: string) => {
    let targetPeriodo = periodo;
    const { nivel_riesgo, hallazgos_seleccionados } = computePatientRisk(hallazgos, hallazgoDefaults);

    setRawDataState(prev => prev.map(row => {
      if (row.patient_id === patientId && (!targetPeriodo || row.periodo === targetPeriodo)) {
        if (!targetPeriodo) targetPeriodo = row.periodo;
        return { ...row, hallazgos_seleccionados, nivel_riesgo };
      }
      return row;
    }));

    // Sincronizar en Firestore
    if (targetPeriodo) {
      try {
        const { updatePatient } = await import('../services/firestoreService');
        await updatePatient(patientId, targetPeriodo, {
          hallazgos_seleccionados,
          nivel_riesgo
        });
      } catch (err) {
        console.error("Error sincronizando hallazgos con Firestore:", err);
      }
    }
  };

  const setFilter = (key: string, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      anio: 'Todos',
      periodo: 'Todos',
      pais: 'Todos',
      sede: 'Todas',
      protocolos: [],
    });
  };

  // Extraer opciones únicas para los filtros basados en rawData
  const filterOptions = useMemo(() => {
    const options: Record<string, Set<string>> = {
      anio: new Set(['Todos']),
      periodo: new Set(['Todos']),
      pais: new Set(['Todos']),
      sede: new Set(['Todas']),
      protocolo: new Set(['Todos']),
    };

    rawData.forEach(row => {
      // Extraemos año del periodo (ej: "2026-08")
      if (row.periodo) {
        const parts = row.periodo.split('-');
        if (parts.length === 2) {
          options.anio.add(parts[0]);
          options.periodo.add(parts[1]); 
        }
      }
      if (row.pais) options.pais.add(row.pais);
      if (row.proceso) options.sede.add(row.proceso);
      if (row.tipo_protocolo) options.protocolo.add(row.tipo_protocolo);
    });

    return {
      anio: Array.from(options.anio).sort().reverse(),
      periodo: Array.from(options.periodo).sort(),
      pais: Array.from(options.pais).sort(),
      sede: Array.from(options.sede).sort(),
      protocolo: Array.from(options.protocolo).sort(),
    };
  }, [rawData]);

  // Aplicar filtros
  const filteredData = useMemo(() => {
    return rawData.filter(row => {
      let pass = true;

      // Filtro Año
      if (filters.anio !== 'Todos' && row.periodo) {
        if (!row.periodo.startsWith(filters.anio)) pass = false;
      }
      
      // Filtro Periodo (Mes)
      if (filters.periodo !== 'Todos' && row.periodo) {
        if (!row.periodo.endsWith(`-${filters.periodo}`)) pass = false;
      }

      // Filtro País
      if (filters.pais !== 'Todos') {
        if (row.pais !== filters.pais) pass = false;
      }

      // Filtro Sede
      if (filters.sede && filters.sede.length > 0) {
        const rowSede = row.proceso;
        if (!filters.sede.includes(rowSede)) pass = false;
      }

      // Filtro Protocolo (Múltiple)
      if (filters.protocolos && filters.protocolos.length > 0) {
        if (!filters.protocolos.includes(row.tipo_protocolo)) pass = false;
      }

      return pass;
    });
  }, [rawData, filters]);

  // timeSeriesData ignora el filtro de periodo (mes) para poder graficar la línea de tiempo completa del año seleccionado
  const timeSeriesData = useMemo(() => {
    return rawData.filter(row => {
      let pass = true;

      // Filtro Año se mantiene para ver el trend del año seleccionado
      if (filters.anio !== 'Todos' && row.periodo) {
        if (!row.periodo.startsWith(filters.anio)) pass = false;
      }
      
      // Filtro País
      if (filters.pais !== 'Todos') {
        if (row.pais !== filters.pais) pass = false;
      }

      // Filtro Sede
      if (filters.sede && filters.sede.length > 0) {
        const rowSede = row.proceso;
        if (!filters.sede.includes(rowSede)) pass = false;
      }

      // Filtro Protocolo (Múltiple)
      if (filters.protocolos && filters.protocolos.length > 0) {
        if (!filters.protocolos.includes(row.tipo_protocolo)) pass = false;
      }

      return pass;
    });
  }, [rawData, filters]);

  // Calcular KPIs
  const kpis = useMemo(() => {
    if (filteredData.length === 0) return defaultKpis;

    let vigentes = 0;
    let vencidos = 0;
    let observados = 0;
    let hallazgos_criticos = 0;
    let evaluados_aptitud = 0; // Para sacar % de observados

    filteredData.forEach(row => {
      const estadoEmo = row.estado_emo?.toUpperCase();
      const aptitud = row.aptitud?.toUpperCase();

      if (estadoEmo === 'VIGENTE') vigentes++;
      if (estadoEmo === 'VENCIDO') vencidos++;
      
      if (aptitud === 'OBSERVADO') observados++;
      if (aptitud && aptitud !== 'NAN' && aptitud !== 'SIN EMO') evaluados_aptitud++;

      if (row.nivel_riesgo === 'Crítico') hallazgos_criticos++;
    });

    const totalProgramados = filteredData.length;
    const realizados = vigentes + vencidos;
    const coberturaPorcentaje = totalProgramados > 0 ? (realizados / totalProgramados) * 100 : 0;
    
    // Porcentajes para subtítulos
    const vencidosPorcentaje = totalProgramados > 0 ? (vencidos / totalProgramados) * 100 : 0;
    const observadosPorcentaje = evaluados_aptitud > 0 ? (observados / evaluados_aptitud) * 100 : 0;

    return {
      cobertura: {
        valor: realizados,
        total: totalProgramados,
        porcentaje: coberturaPorcentaje
      },
      realizados: {
        valor: realizados,
        total: totalProgramados
      },
      vencidos: {
        valor: vencidos,
        porcentaje: vencidosPorcentaje
      },
      observados: {
        valor: observados,
        porcentaje: observadosPorcentaje
      },
      hallazgos_criticos: {
        valor: hallazgos_criticos
      }
    };
  }, [filteredData]);

  // Calcular Datos para Gráficos
  const chartsData = useMemo(() => {
    if (filteredData.length === 0) return defaultChartsData;

    const tipoExamenCounts: Record<string, number> = {};
    const aptitudCounts: Record<string, number> = {};
    const coberturaPorSede: Record<string, { realizados: number; total: number; atrasados: number; diasAtrasoTotal: number }> = {};
    const hallazgosStats: Record<string, { value: number; trabajadores: Set<string>; categoria: string }> = {};
    const divisionStats: Record<string, { value: number; trabajadores: Set<string> }> = {};
    const generoStats: Record<string, { value: number; trabajadores: Set<string> }> = {};
    const categoriasCounts: Record<string, number> = {};
    const riesgoCounts: Record<string, number> = {};
    const distribucionGeneroObj: Record<string, { realizados: number; total: number }> = {};
    const distribucionEdadObj: Record<string, { realizados: number; total: number }> = {};
    let totalHallazgos = 0;
    let hallazgosAltoCritico = 0;
    let trabajadoresAltoCritico = 0;

    // Calcular datos de series de tiempo usando timeSeriesData (que ignora el mes seleccionado)
    const coberturaPorPeriodo: Record<string, { realizados: number; total: number }> = {};
    const criticosPorPeriodo: Record<string, number> = {};
    const hallazgosPorPeriodo: Record<string, { Bajo: number; Medio: number; Alto: number; Crítico: number }> = {};

    timeSeriesData.forEach(row => {
      const estadoEmo = row.estado_emo?.toUpperCase();
      const esRealizado = estadoEmo === 'VIGENTE' || estadoEmo === 'VENCIDO';
      
      if (row.periodo) {
        if (!coberturaPorPeriodo[row.periodo]) coberturaPorPeriodo[row.periodo] = { realizados: 0, total: 0 };
        if (!criticosPorPeriodo[row.periodo]) criticosPorPeriodo[row.periodo] = 0;
        if (!hallazgosPorPeriodo[row.periodo]) hallazgosPorPeriodo[row.periodo] = { Bajo: 0, Medio: 0, Alto: 0, Crítico: 0 };

        coberturaPorPeriodo[row.periodo].total++;
        if (esRealizado) coberturaPorPeriodo[row.periodo].realizados++;
        if (row.nivel_riesgo === 'Crítico') criticosPorPeriodo[row.periodo]++;

        if (row.hallazgos_seleccionados && row.hallazgos_seleccionados.length > 0) {
           row.hallazgos_seleccionados.forEach(h => {
             const riesgo = h.nivel_riesgo;
             if (riesgo === 'Crítico') hallazgosPorPeriodo[row.periodo]['Crítico']++;
             else if (riesgo === 'Alto') hallazgosPorPeriodo[row.periodo]['Alto']++;
             else if (riesgo === 'Medio') hallazgosPorPeriodo[row.periodo]['Medio']++;
             else hallazgosPorPeriodo[row.periodo]['Bajo']++;
           });
        }
      }
    });

    filteredData.forEach(row => {
      // Tipo Examen
      if (row.tipo_emo) {
        tipoExamenCounts[row.tipo_emo] = (tipoExamenCounts[row.tipo_emo] || 0) + 1;
      }
      
      // Aptitud
      if (row.aptitud) {
        aptitudCounts[row.aptitud] = (aptitudCounts[row.aptitud] || 0) + 1;
      }
      
      // Estado EMO para cobertura (usado en otras partes)
      const estadoEmo = row.estado_emo?.toUpperCase();
      const esRealizado = estadoEmo === 'VIGENTE' || estadoEmo === 'VENCIDO';

      // Distribución Género Global
      const rawGenero = row.sexo || 'Desconocido';
      let generoGlobal = rawGenero;
      const gUpperGlobal = rawGenero.toUpperCase();
      if (gUpperGlobal === 'M' || gUpperGlobal === 'MASCULINO' || gUpperGlobal === 'HOMBRE' || gUpperGlobal === 'HOMBRES') generoGlobal = 'Hombres';
      else if (gUpperGlobal === 'F' || gUpperGlobal === 'FEMENINO' || gUpperGlobal === 'MUJER' || gUpperGlobal === 'MUJERES') generoGlobal = 'Mujeres';

      if (!distribucionGeneroObj[generoGlobal]) {
        distribucionGeneroObj[generoGlobal] = { realizados: 0, total: 0 };
      }
      distribucionGeneroObj[generoGlobal].total++;
      if (esRealizado) {
        distribucionGeneroObj[generoGlobal].realizados++;
      }

      // Distribución por Edad
      let age = -1;
      if (row.edad !== undefined && row.edad !== null && row.edad !== '') {
          age = Number(row.edad);
      } else if (row.fecha_nacimiento) {
        const dateRaw = row.fecha_nacimiento;
        let birthDate: Date | null = null;
        
        if (typeof dateRaw === 'number') {
           birthDate = new Date((dateRaw - 25569) * 86400 * 1000);
        } else if (typeof dateRaw === 'string') {
           const num = Number(dateRaw);
           if (!isNaN(num) && num > 10000) {
               birthDate = new Date((num - 25569) * 86400 * 1000);
           } else {
               const dateOnly = dateRaw.split(' ')[0]; // Remove time like 00:00:00
               const parts = dateOnly.split(/[-/]/);
               if (parts.length === 3) {
                   if (parts[0].length === 4) {
                       birthDate = new Date(`${parts[0]}-${parts[1]}-${parts[2]}T00:00:00`);
                   } else {
                       let year = parts[2].length === 2 ? `19${parts[2]}` : parts[2];
                       const y = parseInt(year);
                       if (y < 25) year = `20${parts[2]}`;
                       birthDate = new Date(`${year}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}T00:00:00`);
                   }
               } else {
                   birthDate = new Date(dateOnly);
               }
           }
        }
        
        if (birthDate && !isNaN(birthDate.getTime())) {
            const diffTime = new Date().getTime() - birthDate.getTime();
            age = Math.floor(diffTime / (1000 * 60 * 60 * 24 * 365.25));
        }
      }
        
        if (age >= 0) {
            let range = '';
            if (age < 25) range = '< 25 años';
            else if (age <= 34) range = '25 - 34 años';
            else if (age <= 44) range = '35 - 44 años';
            else if (age <= 54) range = '45 - 54 años';
            else if (age <= 64) range = '55 - 64 años';
            else range = '≥ 65 años';
            
            if (!distribucionEdadObj[range]) {
                distribucionEdadObj[range] = { realizados: 0, total: 0 };
            }
            distribucionEdadObj[range].total++;
            if (esRealizado) {
                distribucionEdadObj[range].realizados++;
            }
        }

      // Cumplimiento por Sede
      const sede = row.proceso;
      if (sede) {
        if (!coberturaPorSede[sede]) {
          coberturaPorSede[sede] = { realizados: 0, total: 0, atrasados: 0, diasAtrasoTotal: 0 };
        }
        coberturaPorSede[sede].total++;
        if (esRealizado) {
          coberturaPorSede[sede].realizados++;
        }
        if (estadoEmo === 'VENCIDO') {
          coberturaPorSede[sede].atrasados++;
          
          if (row.fecha_vencimiento) {
            const dateStr = String(row.fecha_vencimiento);
            let parsedDate = new Date(dateStr);
            const parts = dateStr.split(/[-/]/);
            if (isNaN(parsedDate.getTime()) && parts.length === 3) {
              // Asumimos DD/MM/YYYY o DD-MM-YYYY
              let year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
              parsedDate = new Date(`${year}-${parts[1]}-${parts[0]}T00:00:00`);
            }
            if (!isNaN(parsedDate.getTime())) {
              const diffTime = new Date().getTime() - parsedDate.getTime();
              if (diffTime > 0) {
                const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
                coberturaPorSede[sede].diasAtrasoTotal += diffDays;
              }
            }
          }
        }
      }
      // Hallazgos Seleccionados
      if (row.hallazgos_seleccionados && row.hallazgos_seleccionados.length > 0) {
        let hasAltoOrCritico = false;

        row.hallazgos_seleccionados.forEach(h => {
          const hallazgo = h.hallazgo;
          let categoriaFound = 'Otros';
          for (const cat of CATEGORIAS_HALLAZGOS) {
            if (cat.opciones.includes(hallazgo)) {
              categoriaFound = cat.nombre;
              break;
            }
          }
          
          if (!hallazgosStats[hallazgo]) {
            hallazgosStats[hallazgo] = { value: 0, trabajadores: new Set(), categoria: categoriaFound };
          }
          hallazgosStats[hallazgo].value++;
          if (row.patient_id) {
            hallazgosStats[hallazgo].trabajadores.add(row.patient_id);
          }
          
          categoriasCounts[categoriaFound] = (categoriasCounts[categoriaFound] || 0) + 1;
          
          const risk = h.nivel_riesgo;
          if (risk) {
             riesgoCounts[risk] = (riesgoCounts[risk] || 0) + 1;
          }
          totalHallazgos++;
          
          const division = row.division || 'Sin División';
          if (!divisionStats[division]) {
            divisionStats[division] = { value: 0, trabajadores: new Set() };
          }
          divisionStats[division].value++;
          if (row.patient_id) {
            divisionStats[division].trabajadores.add(row.patient_id);
          }
          
          const rawGenero = row.sexo || 'Desconocido';
          let genero = rawGenero;
          const gUpper = rawGenero.toUpperCase();
          if (gUpper === 'M' || gUpper === 'MASCULINO' || gUpper === 'HOMBRE' || gUpper === 'HOMBRES') genero = 'Hombres';
          else if (gUpper === 'F' || gUpper === 'FEMENINO' || gUpper === 'MUJER' || gUpper === 'MUJERES') genero = 'Mujeres';
          
          if (!generoStats[genero]) {
            generoStats[genero] = { value: 0, trabajadores: new Set() };
          }
          generoStats[genero].value++;
          if (row.patient_id) {
            generoStats[genero].trabajadores.add(row.patient_id);
          }
          
          if (row.periodo) {
            if (!hallazgosPorPeriodo[row.periodo]) {
              hallazgosPorPeriodo[row.periodo] = { Bajo: 0, Medio: 0, Alto: 0, Crítico: 0 };
            }
            if (risk === 'Crítico') hallazgosPorPeriodo[row.periodo]['Crítico']++;
            else if (risk === 'Alto') hallazgosPorPeriodo[row.periodo]['Alto']++;
            else if (risk === 'Medio') hallazgosPorPeriodo[row.periodo]['Medio']++;
            else hallazgosPorPeriodo[row.periodo]['Bajo']++;
          }
          
          if (risk === 'Alto' || risk === 'Crítico') {
            hallazgosAltoCritico++;
            hasAltoOrCritico = true;
          }
        });

        if (hasAltoOrCritico) {
          trabajadoresAltoCritico++;
        }
      }
    });

    const tipoExamen = Object.entries(tipoExamenCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const distribucionAptitud = Object.entries(aptitudCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // Obtener los años únicos presentes en los datos de series de tiempo
    const years = Array.from(new Set(timeSeriesData.map(row => row.periodo?.split('-')[0]).filter(Boolean)));
    if (years.length === 0) years.push(new Date().getFullYear().toString());

    // Generar todos los meses para los años encontrados
    const allMonths: string[] = [];
    years.sort().forEach(year => {
      for (let i = 1; i <= 12; i++) {
        const month = i.toString().padStart(2, '0');
        allMonths.push(`${year}-${month}`);
      }
    });

    const evolucionCobertura = allMonths.map(periodo => {
      const data = coberturaPorPeriodo[periodo];
      return {
        periodo,
        Cobertura: data && data.total > 0 ? Math.round((data.realizados / data.total) * 100) : null,
        Meta: 95
      };
    });

    const cumplimientoSede = Object.entries(coberturaPorSede)
      .map(([sede, data]) => ({
        sede,
        cobertura: data.total > 0 ? Number(((data.realizados / data.total) * 100).toFixed(1)) : 0,
        programados: data.total,
        realizados: data.realizados,
        pendientes: data.total - data.realizados,
        atrasados: data.atrasados
      }))
      .sort((a, b) => b.cobertura - a.cobertura);

    const tendenciaCriticos = allMonths.map(periodo => ({
      periodo,
      hallazgos: criticosPorPeriodo[periodo] || 0
    }));

    const hallazgosFrecuentes = Object.entries(hallazgosStats)
      .map(([name, stats]) => ({ 
        name, 
        categoria: stats.categoria, 
        value: stats.value, 
        trabajadores: stats.trabajadores.size 
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const hallazgosPorDivision = Object.entries(divisionStats)
      .map(([name, stats]) => ({ 
        name, 
        value: stats.value, 
        trabajadores: stats.trabajadores.size 
      }))
      .sort((a, b) => b.value - a.value);

    const hallazgosPorGenero = Object.entries(generoStats)
      .map(([name, stats]) => ({ 
        name, 
        value: stats.value, 
        trabajadores: stats.trabajadores.size 
      }))
      .sort((a, b) => b.value - a.value);

    const hallazgosEnElTiempo = allMonths.map(periodo => {
      const data = hallazgosPorPeriodo[periodo] || { Bajo: 0, Medio: 0, Alto: 0, Crítico: 0 };
      const total = data.Bajo + data.Medio + data.Alto + data.Crítico;
      return {
        periodo,
        Bajo: data.Bajo,
        Medio: data.Medio,
        Alto: data.Alto,
        Crítico: data.Crítico,
        Total: total
      };
    });

    const examenesVencidos = Object.entries(coberturaPorSede)
      .map(([sede, data]) => {
         const programados = data.total;
         const atrasados = data.atrasados;
         const pctSobreProgramado = programados > 0 ? (atrasados / programados) * 100 : 0;
         const diasPromedio = atrasados > 0 ? Math.round(data.diasAtrasoTotal / atrasados) : 0;
         return {
            sede,
            total: atrasados,
            pctSobreProgramado,
            diasPromedio
         };
      })
      .filter(item => item.total > 0)
      .sort((a, b) => b.total - a.total);

    const distribucionGenero = Object.entries(distribucionGeneroObj)
      .map(([name, data]) => ({
        name,
        value: data.total,
        cobertura: data.total > 0 ? (data.realizados / data.total) * 100 : 0
      }))
      .filter(item => item.name === 'Hombres' || item.name === 'Mujeres')
      .sort((a, b) => b.value - a.value);

    const ordenRangos = ['< 25 años', '25 - 34 años', '35 - 44 años', '45 - 54 años', '55 - 64 años', '≥ 65 años'];
    const distribucionEdad = ordenRangos.map(rango => {
       const data = distribucionEdadObj[rango] || { realizados: 0, total: 0 };
       return {
          rango,
          realizados: data.realizados,
          cobertura: data.total > 0 ? (data.realizados / data.total) * 100 : 0,
          total: data.total
       };
    });

    return { 
      tipoExamen, 
      distribucionAptitud, 
      evolucionCobertura, 
      cumplimientoSede, 
      tendenciaCriticos, 
      hallazgosFrecuentes,
      hallazgosPorDivision,
      hallazgosPorGenero,
      hallazgosPorCategoria: Object.entries(categoriasCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      hallazgosPorRiesgo: ['Bajo', 'Medio', 'Alto', 'Crítico'].map(name => ({ name, value: riesgoCounts[name] || 0 })).filter(item => item.value > 0),
      statsHallazgos: { total: totalHallazgos, trabajadoresAltoCritico, hallazgosAltoCritico },
      hallazgosEnElTiempo,
      examenesVencidos,
      distribucionGenero,
      distribucionEdad
    };
  }, [filteredData, rawData.length]);

  const isDataLoaded = rawData.length > 0;

  return (
    <DataContext.Provider value={{
      rawData,
      filteredData,
      filters,
      filterOptions,
      kpis,
      chartsData,
      isDataLoaded,
      setRawData,
      setFilter,
      clearFilters,
      hallazgoDefaults,
      updateHallazgoDefault,
      updatePatientAptitud,
      updatePatientHallazgos,
      pendingTriaje,
      rechazadosList,
      sinonimosList,
      setPendingTriaje,
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
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}
