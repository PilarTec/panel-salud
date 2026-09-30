import { collection, doc, writeBatch, getDocs, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import type { ParsedRow, NivelRiesgo } from './excelParser';
import { DIAGNOSTICOS_RECHAZADOS, SINONIMOS_HALLAZGOS, RIESGO_DEFECTO_HALLAZGOS } from './excelParser';

const EVALUACIONES_COLLECTION = 'evaluaciones';
const CONFIG_COLLECTION = 'configuracion';
const GLOBAL_CONFIG_DOC = 'global';

export interface GlobalConfig {
  rechazadosList: string[];
  sinonimosList: Record<string, string>;
  hallazgoDefaults: Record<string, NivelRiesgo | null>;
  categoriasHallazgos: { nombre: string; icono: string; opciones: string[] }[];
  pendingTriaje: string[];
}

/**
 * Función auxiliar para eliminar recursivamente los valores "undefined"
 * ya que Firestore no los soporta.
 */
function sanitizeForFirestore(obj: any): any {
  if (obj === undefined) return null;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitizeForFirestore);
  
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => [k, sanitizeForFirestore(v)])
  );
}

/**
 * Guarda evaluaciones en Firestore usando batches.
 * Realiza un upsert (merge) utilizando la combinación de patient_id y periodo como ID único.
 */
export async function saveEvaluaciones(data: ParsedRow[], onProgress?: (progress: number) => void): Promise<void> {
  const BATCH_SIZE = 500;
  console.log(`Iniciando guardado de ${data.length} registros en Firestore...`);
  
  if (data.length === 0) {
    if (onProgress) onProgress(100);
    return;
  }
  
  for (let i = 0; i < data.length; i += BATCH_SIZE) {
    const chunk = data.slice(i, i + BATCH_SIZE);
    const batch = writeBatch(db);
    
    chunk.forEach(row => {
      // Sanitizamos el docId para evitar slashes que rompan la ruta de Firestore
      const rawId = row.patient_id ? `${row.patient_id}_${row.periodo || 'NOPERIODO'}` : `UNKNOWN_${Date.now()}_${Math.random()}`;
      const docId = rawId.replace(/\//g, '-');
      
      const docRef = doc(db, EVALUACIONES_COLLECTION, docId);
      
      // Firestore no acepta valores "undefined", los pasamos a "null" o los eliminamos
      const cleanRow = sanitizeForFirestore(row);
      
      batch.set(docRef, cleanRow, { merge: true });
    });
    
    console.log(`Enviando batch ${i / BATCH_SIZE + 1} de ${Math.ceil(data.length / BATCH_SIZE)}...`);
    await batch.commit();
    console.log(`Batch ${i / BATCH_SIZE + 1} completado.`);
    
    // Calcular progreso
    const processed = Math.min(i + BATCH_SIZE, data.length);
    const progressPercent = Math.round((processed / data.length) * 100);
    if (onProgress) onProgress(progressPercent);
  }
  console.log("Guardado en Firestore finalizado.");
}

/**
 * Obtiene todas las evaluaciones almacenadas.
 */
export async function fetchEvaluaciones(): Promise<ParsedRow[]> {
  const querySnapshot = await getDocs(collection(db, EVALUACIONES_COLLECTION));
  const data: ParsedRow[] = [];
  querySnapshot.forEach((doc) => {
    data.push(doc.data() as ParsedRow);
  });
  return data;
}

/**
 * Actualiza un paciente específico en Firestore.
 */
export async function updatePatient(patientId: string, periodo: string, updates: Partial<ParsedRow>): Promise<void> {
  const rawId = `${patientId}_${periodo || 'NOPERIODO'}`;
  const docId = rawId.replace(/\//g, '-');
  const docRef = doc(db, EVALUACIONES_COLLECTION, docId);
  const cleanUpdates = sanitizeForFirestore(updates);
  await setDoc(docRef, cleanUpdates, { merge: true });
}

/**
 * Obtiene la configuración global. Si no existe, la crea con los valores por defecto del parser.
 */
export async function fetchConfiguracion(): Promise<GlobalConfig> {
  const docRef = doc(db, CONFIG_COLLECTION, GLOBAL_CONFIG_DOC);
  const docSnap = await getDoc(docRef);
  
  if (docSnap.exists()) {
    return docSnap.data() as GlobalConfig;
  } else {
    // Inicializar configuración con los valores estáticos actuales
    const { CATEGORIAS_HALLAZGOS } = await import('./excelParser');
    const initialConfig: GlobalConfig = {
      rechazadosList: Array.from(DIAGNOSTICOS_RECHAZADOS),
      sinonimosList: { ...SINONIMOS_HALLAZGOS },
      hallazgoDefaults: { ...RIESGO_DEFECTO_HALLAZGOS },
      categoriasHallazgos: JSON.parse(JSON.stringify(CATEGORIAS_HALLAZGOS)),
      pendingTriaje: []
    };
    await setDoc(docRef, initialConfig);
    return initialConfig;
  }
}

/**
 * Actualiza la configuración global.
 */
export async function updateConfiguracion(updates: Partial<GlobalConfig>): Promise<void> {
  const docRef = doc(db, CONFIG_COLLECTION, GLOBAL_CONFIG_DOC);
  
  // Usamos setDoc con merge en caso de que el documento haya sido borrado accidentalmente
  await setDoc(docRef, updates, { merge: true });
}
