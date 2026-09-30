import * as XLSX from 'xlsx';

export type NivelRiesgo = 'Bajo' | 'Medio' | 'Alto' | 'Crítico';

export interface RiesgoHallazgo {
  hallazgo: string;
  nivel_riesgo: NivelRiesgo | null;
}

export interface ParsedRow {
  patient_id: string;
  periodo: string;
  pais: string | null;
  sexo: string | null;
  fecha_nacimiento: string | null;
  edad?: number | string | null;
  cargo: string | null;
  proceso: string | null;
  division: string | null;
  area: string | null;
  estado_emo: string | null;
  fecha_emo: string | null;
  fecha_vencimiento: string | null;
  tipo_protocolo: string | null;
  tipo_emo: string | null;
  aptitud: string | null;
  restricciones: string | null;
  aparece_prexor: boolean;
  diagnosticos_array: string[];
  estado_cierre: string | null;
  es_pendiente: boolean;
  musculo_resultado: string | null;
  oftalmo_resultado: string | null;
  audio_resultado: string | null;
  radio_resultado: string | null;
  dx_nutricional: string | null;
  peso: number | null;
  hemoglobina: number | null;
  hemoglobina_cat: string | null;
  glucosa: number | null;
  glucosa_rango: string | null;
  colesterol: number | null;
  colesterol_cat: string | null;
  trigliceridos: number | null;
  trigliceridos_cat: string | null;
  en_control_gestantes: boolean;
  // Faltantes a ingresar manual
  sede?: string | null;
  hallazgo_critico?: boolean | null;
  protocolo_minsal?: string | null;
  agente_riesgo?: string | null;
  fuente: 'excel';
  timestamp_carga: string;
  hallazgos_seleccionados: RiesgoHallazgo[];
  nivel_riesgo: NivelRiesgo | null;
}

export let CATEGORIAS_HALLAZGOS = [
  {
    nombre: 'Oftalmológicos',
    icono: '👁️',
    opciones: ['AMETROPIA', 'PRESBICIA', 'PTERIGION', 'SÍNDROME DE OJO SECO']
  },
  {
    nombre: 'Metabólicos',
    icono: '🧪',
    opciones: [
      'HIPERCOLESTEROLEMIA',
      'HIPERLIPIDEMIA MIXTA',
      'HIPERTRIGLICERIDEMIA',
      'HIPERGLICEMIA',
      'DIABETES MELLITUS',
      'HIPOTIROIDISMO',
      'BAJO PESO',
      'SOBREPESO',
      'OBESIDAD I',
      'OBESIDAD II',
      'OBESIDAD III'
    ]
  },
  {
    nombre: 'Cardiovasculares',
    icono: '❤️',
    opciones: ['LECTURA ELEVADA DE LA PRESIÓN SANGUÍNEA', 'HIPERTENSION', 'OTROS TIPOS DE BLOQUEO DE RAMA DERECHA DEL HAZ Y']
  },
  {
    nombre: 'Hematológicos',
    icono: '🩸',
    opciones: ['ANEMIA', 'ANEMIA LEVE', 'ANEMIA MOD', 'ANEMIA SEV']
  },
  {
    nombre: 'Musculoesqueléticos',
    icono: '🦴',
    opciones: ['CONDROMALACIA', 'ESCOLIOSIS', 'LUMBAGO', 'CERVICALGIA', 'CONTRACTURA MUSCULAR']
  },
  {
    nombre: 'Auditivos',
    icono: '👂',
    opciones: ['CERUMEN IMPACTADO', 'TAPON DE CERUMEN PARCIAL', 'EFECTOS DEL RUIDO SOBRE EL OIDO', 'HIPOACUSIA NEUROSENSORIAL', 'HIPOACUSIA NO INDUCIDA POR RUIDO', 'OTRAS ALTERACIONES AUDITIVAS']
  },
  {
    nombre: 'Otros',
    icono: '🫁',
    opciones: ['RINITIS', 'SD OVARIO POLIQUISTICO', 'HEMATURIA', 'LITIASIS RENAL', 'PITIRIASIS VERSICOLOR', 'ENDOMETRIOSIS', 'MIGRAÑA', 'ACNE', 'DERMATITIS']
  }
];

export const addCategoriaToCatalogo = (nombre: string, icono: string) => {
  const clean = nombre.trim();
  if (!clean) return;
  const exists = CATEGORIAS_HALLAZGOS.some(c => c.nombre.trim().toLowerCase() === clean.toLowerCase());
  if (!exists) {
    const newCat = {
      nombre: clean,
      icono: icono.trim() || '📁',
      opciones: [] as string[]
    };
    const otrosIdx = CATEGORIAS_HALLAZGOS.findIndex(c => c.nombre.toLowerCase() === 'otros');
    if (otrosIdx !== -1) {
      CATEGORIAS_HALLAZGOS.splice(otrosIdx, 0, newCat);
    } else {
      CATEGORIAS_HALLAZGOS.push(newCat);
    }
  }
};

export const addHallazgoToCategoria = (categoriaNombre: string, nuevoHallazgo: string, riesgoDefecto: NivelRiesgo | null) => {
  const upperHallazgo = nuevoHallazgo.trim().toUpperCase();
  const catIndex = CATEGORIAS_HALLAZGOS.findIndex(c => c.nombre === categoriaNombre);
  if (catIndex !== -1) {
    if (!CATEGORIAS_HALLAZGOS[catIndex].opciones.includes(upperHallazgo)) {
      CATEGORIAS_HALLAZGOS[catIndex].opciones.push(upperHallazgo);
      RIESGO_DEFECTO_HALLAZGOS[upperHallazgo] = riesgoDefecto;
    }
  }
};

export const moveHallazgoToCategoria = (hallazgo: string, fromCategoria: string, toCategoria: string) => {
  const fromIndex = CATEGORIAS_HALLAZGOS.findIndex(c => c.nombre === fromCategoria);
  const toIndex = CATEGORIAS_HALLAZGOS.findIndex(c => c.nombre === toCategoria);
  
  if (fromIndex !== -1 && toIndex !== -1) {
    const hallazgoIndex = CATEGORIAS_HALLAZGOS[fromIndex].opciones.indexOf(hallazgo);
    if (hallazgoIndex !== -1) {
      CATEGORIAS_HALLAZGOS[fromIndex].opciones.splice(hallazgoIndex, 1);
      CATEGORIAS_HALLAZGOS[toIndex].opciones.push(hallazgo);
    }
  }
};

export const removeHallazgoFromCategoria = (hallazgo: string) => {
  const upperHallazgo = hallazgo.trim().toUpperCase();
  CATEGORIAS_HALLAZGOS.forEach(cat => {
    const idx = cat.opciones.indexOf(upperHallazgo);
    if (idx !== -1) {
      cat.opciones.splice(idx, 1);
    }
  });
  delete RIESGO_DEFECTO_HALLAZGOS[upperHallazgo];
};

export const DIAGNOSTICOS_RECHAZADOS = new Set<string>();

export const addToRechazados = (hallazgo: string) => {
  DIAGNOSTICOS_RECHAZADOS.add(hallazgo.trim().toUpperCase());
};

export const removeFromRechazados = (hallazgo: string) => {
  DIAGNOSTICOS_RECHAZADOS.delete(hallazgo.trim().toUpperCase());
};

// Mapa de sinónimos: Alias -> Hallazgo Principal
export const SINONIMOS_HALLAZGOS: Record<string, string> = {};

export const addSinonimo = (alias: string, principal: string) => {
  SINONIMOS_HALLAZGOS[alias.trim().toUpperCase()] = principal.trim().toUpperCase();
};

export const removeSinonimo = (alias: string) => {
  delete SINONIMOS_HALLAZGOS[alias.trim().toUpperCase()];
};

export const RIESGO_DEFECTO_HALLAZGOS: Record<string, NivelRiesgo | null> = {
  // Oftalmológicos
  'AMETROPIA': 'Bajo',
  'PRESBICIA': 'Bajo',
  'PTERIGION': 'Medio',
  'SÍNDROME DE OJO SECO': 'Bajo',
  // Metabólicos (incluye nutricionales)
  'HIPERCOLESTEROLEMIA': 'Medio',
  'HIPERLIPIDEMIA MIXTA': 'Alto',
  'HIPERTRIGLICERIDEMIA': 'Medio',
  'HIPERGLICEMIA': 'Medio',
  'DIABETES MELLITUS': 'Alto',
  'HIPOTIROIDISMO': 'Medio',
  'BAJO PESO': 'Medio',
  'SOBREPESO': 'Bajo',
  'OBESIDAD I': 'Medio',
  'OBESIDAD II': 'Alto',
  'OBESIDAD III': 'Crítico',
  // Cardiovasculares
  'LECTURA ELEVADA DE LA PRESIÓN SANGUÍNEA': 'Medio',
  'HIPERTENSION': 'Alto',
  'OTROS TIPOS DE BLOQUEO DE RAMA DERECHA DEL HAZ Y': 'Alto',
  // Hematológicos
  'ANEMIA': 'Medio',
  'ANEMIA LEVE': 'Bajo',
  'ANEMIA MOD': 'Alto',
  'ANEMIA SEV': 'Crítico',
  // Musculoesqueléticos
  'CONDROMALACIA': 'Medio',
  'ESCOLIOSIS': 'Bajo',
  'LUMBAGO': 'Alto',
  'CERVICALGIA': 'Medio',
  'CONTRACTUA MUSCULAR': 'Bajo',
  // Auditivos
  'CERUMEN IMPACTADO': 'Bajo',
  'TAPON DE CERUMEN PARCIAl': 'Bajo',
  'EFECTOS DEL RUIDO SOBRE EL OIDO': 'Medio',
  'HIPOACUSIA NEUROSENSORIAL': 'Alto',
  'HIPOACUSIA NO INDUCIDA POR RUIDO': 'Medio',
  'OTRAS ALTERACIONES AUDITIVAS': 'Bajo',
  // Otros
  'RINITIS': 'Bajo',
  'SD OVARIO POLIQUISTICO': 'Medio',
  'HEMATURIA': 'Alto',
  'LITIASIS RENAL': 'Alto',
  'PITIRIASIS VERSICOLOR': 'Bajo',
  'endometriosis': 'Medio',
  'MIGRAÑA': 'Alto',
  'ACNE': 'Bajo',
  'DERMATITIS': 'Medio',
};

export const parseExcelFile = async (file: File): Promise<{ data: ParsedRow[], unmappedDiagnosticos: string[] }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        
        // Asumimos que los datos están en la primera hoja o en la hoja "Consolidado"
        const sheetName = workbook.SheetNames.includes('Consolidado') ? 'Consolidado' : workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json<any>(worksheet, { raw: false });
        
        const unmappedSet = new Set<string>();

        const parsedData: ParsedRow[] = jsonData.map((row) => {
          // Helper para buscar keys ignorando mayúsculas y espacios
          const findKey = (searchKeys: string[]) => {
             const rowKeys = Object.keys(row);
             for (const sk of searchKeys) {
                 const normalizedSk = sk.trim().toUpperCase();
                 const found = rowKeys.find(k => k.trim().toUpperCase() === normalizedSk);
                 if (found) return row[found];
             }
             return null;
          };

          // Extraer año y mes de procesamiento
          // Usamos una amplia variedad de llaves para evitar problemas de tildes, ñ, guiones y espacios
          const yearKeys = ['año-procesamiento', 'año procesamiento', 'año_procesamiento', 'ano-procesamiento', 'ano procesamiento', 'ano_procesamiento', 'año', 'ano'];
          const monthKeys = ['mes-procesamiento', 'mes procesamiento', 'mes_procesamiento', 'mes'];
          
          const yearRaw = findKey(yearKeys);
          const monthRaw = findKey(monthKeys);
          
          const year = yearRaw ? String(yearRaw).trim() : String(new Date().getFullYear());
          const month = monthRaw ? String(monthRaw).trim().padStart(2, '0') : String(new Date().getMonth() + 1).padStart(2, '0');
          const periodo = `${year}-${month}`;

          const rawDiag = findKey(['diagnósticos', 'diagnosticos', 'diagnóstico', 'diagnostico']) || '';
          let diagArray: string[] = [];
          if (typeof rawDiag === 'string') {
            diagArray = rawDiag.split(',').map(d => d.trim()).filter(d => d.length > 0);
          }

          const autoDetectedHallazgos: RiesgoHallazgo[] = [];
          
          diagArray.forEach(d => {
            let diagUpper = d.toUpperCase();
            
            // Si está en la lista de rechazados, lo ignoramos por completo
            if (DIAGNOSTICOS_RECHAZADOS.has(diagUpper)) {
              return;
            }

            // Si es un sinónimo, lo transformamos al hallazgo principal
            if (SINONIMOS_HALLAZGOS[diagUpper]) {
              diagUpper = SINONIMOS_HALLAZGOS[diagUpper];
            }

            let found = false;
            CATEGORIAS_HALLAZGOS.forEach(cat => {
              if (cat.opciones.includes(diagUpper)) {
                const riesgo = RIESGO_DEFECTO_HALLAZGOS[diagUpper] || 'Bajo';
                autoDetectedHallazgos.push({ hallazgo: diagUpper, nivel_riesgo: riesgo });
                found = true;
              }
            });
            if (!found) {
              unmappedSet.add(diagUpper);
            }
          });

          // Calcular el nivel de riesgo más alto del paciente basado en sus hallazgos
          let maxNivelRiesgo: NivelRiesgo | null = null;
          if (autoDetectedHallazgos.length > 0) {
            const riesgoWeight = { 'Crítico': 4, 'Alto': 3, 'Medio': 2, 'Bajo': 1 };
            autoDetectedHallazgos.forEach(h => {
              if (h.nivel_riesgo) {
                if (!maxNivelRiesgo || riesgoWeight[h.nivel_riesgo] > riesgoWeight[maxNivelRiesgo]) {
                  maxNivelRiesgo = h.nivel_riesgo;
                }
              }
            });
          } else {
             // Fallback al aptitud de excel si no hay hallazgos detectados
             const aptSimplificada = findKey(['APTITUD_SIMPLIFICADA', 'APTITUD SIMPLIFICADA', 'APTITUD']);
             maxNivelRiesgo = aptSimplificada?.toUpperCase() === 'OBSERVADO' ? null : 'Bajo';
          }

            let aptitudRaw = findKey(['APTITUD_SIMPLIFICADA', 'APTITUD SIMPLIFICADA', 'APTITUD']);
            let aptitudParsed = aptitudRaw ? String(aptitudRaw).trim() : null;
            if (aptitudParsed && aptitudParsed.toUpperCase() === 'NAN') {
              aptitudParsed = 'SIN APTITUD';
            }

            return {
              patient_id: String(findKey(['id', 'ID', 'DNI', 'RUT']) || ''),
              periodo,
              pais: findKey(['País', 'Pais']) ? String(findKey(['País', 'Pais'])).trim() : null,
              sexo: findKey(['Sexo', 'Género', 'Genero']) || null,
              fecha_nacimiento: findKey(['Fecha de Nacimiento', 'FECHA DE NACIMIENTO', 'FECHA NACIMIENTO', 'Fecha nacimiento']) || null,
              edad: findKey(['Edad', 'EDAD']) || null,
              cargo: findKey(['Cargo', 'CARGO']) || null,
              proceso: findKey(['Proceso', 'PROCESO']) ? String(findKey(['Proceso', 'PROCESO'])).trim() : null,
              division: findKey(['División', 'Division', 'DIVISIÓN']) || null,
              area: findKey(['Área', 'Area', 'ÁREA']) || null,
              estado_emo: findKey(['EstadoEMO-v2', 'Estado EMO', 'Estado_EMO', 'EstadoEMO']) || null,
              fecha_emo: findKey(['FECHA DE LA EMO', 'Fecha EMO', 'Fecha de EMO']) || null,
              fecha_vencimiento: findKey(['FECHA DE VENCIMIENTO', 'Fecha Vencimiento', 'Fecha de Vencimiento']) || null,
              tipo_protocolo: findKey(['TIPO DE PROTOCOLO', 'Tipo Protocolo', 'Tipo de Protocolo']) ? String(findKey(['TIPO DE PROTOCOLO', 'Tipo Protocolo', 'Tipo de Protocolo'])).trim() : null,
              tipo_emo: findKey(['TIPO DE EMO', 'Tipo EMO', 'Tipo de EMO']) || null,
              aptitud: aptitudParsed,
            restricciones: findKey(['RESTRICCIONES_CONSOLIDADO', 'RESTRICCIONES', 'Restricciones']) || null,
            aparece_prexor: String(findKey(['¿APARECE EN PREXOR?', 'PREXOR', 'Aparece en Prexor'])).toUpperCase() === 'SÍ',
            diagnosticos_array: diagArray,
            estado_cierre: findKey(['ESTADO', 'Estado', 'Estado Cierre']) || null,
            es_pendiente: String(findKey(['PENDIENTE', 'Pendiente'])).toUpperCase() === 'SI',
            musculo_resultado: findKey(['MUSCULOESQUELETICO_PROCESADO', 'Musculoesqueletico']) || null,
            oftalmo_resultado: findKey(['OFTALMOLOGIA_PROCESADO', 'Oftalmologia']) || null,
            audio_resultado: findKey(['INTERPRETACION_AUDIO_PROCESADO', 'Audiometria']) || null,
            radio_resultado: findKey(['RADIOGRAFIA_PROCESADO', 'Radiografia']) || null,
            dx_nutricional: findKey(['DIAGNOSTICO NUTRICIONAL', 'Diagnostico Nutricional']) || null,
            peso: findKey(['PESO', 'Peso']) ? parseFloat(findKey(['PESO', 'Peso'])) : null,
            hemoglobina: findKey(['HEMOGLOBINA (g/d)', 'HEMOGLOBINA', 'Hemoglobina']) ? parseFloat(findKey(['HEMOGLOBINA (g/d)', 'HEMOGLOBINA', 'Hemoglobina'])) : null,
            hemoglobina_cat: findKey(['Categoría Hemoglobina', 'Categoria Hemoglobina']) || null,
            glucosa: findKey(['GLUCOSA', 'Glucosa']) ? parseFloat(findKey(['GLUCOSA', 'Glucosa'])) : null,
            glucosa_rango: findKey(['RangoGlucosa', 'Rango Glucosa']) || null,
            colesterol: findKey(['COLESTEROL', 'Colesterol']) ? parseFloat(findKey(['COLESTEROL', 'Colesterol'])) : null,
            colesterol_cat: findKey(['Categoría Colesterol', 'Categoria Colesterol']) || null,
            trigliceridos: findKey(['TRIGLICERIDOS', 'Trigliceridos']) ? parseFloat(findKey(['TRIGLICERIDOS', 'Trigliceridos'])) : null,
            trigliceridos_cat: findKey(['Categoría Triglicéridos', 'Categoria Trigliceridos']) || null,
            en_control_gestantes: String(findKey(['¿EN CONTROL GESTANTES?', 'Control Gestantes'])).toUpperCase() === 'SÍ',
            fuente: 'excel' as const,
            timestamp_carga: new Date().toISOString(),
            hallazgos_seleccionados: autoDetectedHallazgos,
            nivel_riesgo: maxNivelRiesgo,
          };
        }).filter(row => row.patient_id !== ''); // Filtramos filas vacías sin ID

        const unmappedDiagnosticos = Array.from(unmappedSet);
        // Ya no agregamos automáticamente los no mapeados a "Otros"
        // Ahora se devolverán en la promesa para que Admin.tsx los pase a Triaje

        resolve({ data: parsedData, unmappedDiagnosticos });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = (error) => reject(error);
    reader.readAsArrayBuffer(file);
  });
};
