import { Title, Text, Card, Button, ProgressBar } from '@tremor/react';
import { useState, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseExcelFile } from '../services/excelParser';
import { useData } from '../context/DataContext';
import { UploadCloud, CheckCircle2, FileSpreadsheet, Calendar, AlertCircle } from 'lucide-react';
import { saveEvaluaciones } from '../services/firestoreService';

export default function Admin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [unmappedAlerts, setUnmappedAlerts] = useState<string[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState<number>(0);
  
  const { rawData, setRawData, setPendingTriaje } = useData();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const processFile = async (file: File) => {
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
    try {
      const { data, unmappedDiagnosticos } = await parseExcelFile(file);
      setRawData(data);
      if (unmappedDiagnosticos.length > 0) {
        setUnmappedAlerts(unmappedDiagnosticos);
        setPendingTriaje(unmappedDiagnosticos);
      }
      setSuccessMessage(`¡Archivo "${file.name}" procesado con éxito! Se cargaron ${data.length} registros.`);
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error(err);
      setError('Error al procesar el archivo Excel. Por favor, verifica el formato.');
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) processFile(file);
    if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      processFile(file);
    } else {
      setError('Por favor, sube un archivo Excel válido (.xlsx o .xls).');
    }
  };

  const handleSaveToFirestore = async () => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);
    setSaveProgress(0);
    try {
      await saveEvaluaciones(rawData, (progress) => {
        setSaveProgress(progress);
      });
      setSuccessMessage(`Se han guardado ${rawData.length} registros en la base de datos exitosamente.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error(err);
      setError('Ocurrió un error al guardar en la base de datos.');
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveProgress(0), 2000); // Reset progress visually after 2s
    }
  };

  // Group rawData by month (periodo)
  const monthlySummary = useMemo(() => {
    if (rawData.length === 0) return [];
    
    const counts: Record<string, number> = {};
    rawData.forEach(row => {
      const p = row.periodo || 'Desconocido';
      counts[p] = (counts[p] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([periodo, count]) => ({ periodo, count }))
      .sort((a, b) => b.periodo.localeCompare(a.periodo)); // Descending sort
  }, [rawData]);

  return (
    <main className="page-padding flex-1 overflow-y-auto bg-slate-50/50">
      <div className="max-w-5xl mx-auto space-y-6">
        <div>
          <Title className="text-2xl font-bold text-slate-800">Administración de Datos</Title>
          <Text className="text-slate-500 mt-1">Sube el archivo Excel consolidado para actualizar los tableros.</Text>
        </div>
        
        {/* Upload Zone */}
        <Card className="shadow-sm border-0 ring-1 ring-slate-200">
          <div 
            className={`relative p-10 border-2 border-dashed rounded-xl text-center transition-all duration-200 ease-in-out cursor-pointer
              ${isDragging 
                ? 'border-blue-500 bg-blue-50/50 shadow-inner' 
                : 'border-slate-300 bg-slate-50 hover:bg-slate-100 hover:border-slate-400'
              }
              ${loading ? 'opacity-50 pointer-events-none' : ''}
            `}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className={`p-4 rounded-full ${isDragging ? 'bg-blue-100 text-blue-600' : 'bg-white text-slate-400 shadow-sm'}`}>
                <UploadCloud className="w-10 h-10" />
              </div>
              <div>
                <p className="text-base font-semibold text-slate-700">
                  Haz clic o arrastra tu archivo Excel aquí
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  Soporta formatos .xlsx y .xls
                </p>
              </div>
            </div>
          </div>

          {loading && (
            <div className="mt-4 flex items-center justify-center space-x-2 text-blue-600 animate-pulse">
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-medium">Procesando y analizando datos...</span>
            </div>
          )}

          {/* Success Feedback */}
          <div className={`transition-all duration-500 overflow-hidden ${successMessage ? 'max-h-20 opacity-100 mt-4' : 'max-h-0 opacity-0 mt-0'}`}>
            <div className="flex items-center gap-3 bg-emerald-50 text-emerald-700 p-4 rounded-lg border border-emerald-100">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{successMessage}</p>
            </div>
          </div>

          {/* Error Feedback */}
          {error && (
            <div className="mt-4 flex items-center gap-3 bg-red-50 text-red-700 p-4 rounded-lg border border-red-100">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          {/* Unmapped Alerts */}
          {unmappedAlerts.length > 0 && (
            <div className="mt-4 bg-orange-50 text-orange-800 p-4 rounded-lg border border-orange-200">
              <div className="flex items-start gap-3 mb-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-orange-600" />
                <div>
                  <h4 className="font-bold text-sm">Hay {unmappedAlerts.length} diagnósticos sin mapear</h4>
                  <p className="text-xs mt-1 text-orange-700/90">
                    Se han detectado nuevos diagnósticos. Por favor, ve a la Bandeja de Triaje para aceptarlos o rechazarlos.
                  </p>
                  <Button 
                    size="xs" 
                    color="orange" 
                    className="mt-3"
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate('/admin/hallazgos');
                    }}
                  >
                    Ir a Bandeja de Triaje
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>

        {/* Uploaded Data Summary */}
        {monthlySummary.length > 0 && (
          <div className="space-y-4 animate-fade-in-up">
            <div className="flex items-center justify-between">
              <Title className="text-lg font-bold text-slate-800">Cargas por Mes</Title>
              <div className="text-sm text-slate-500 font-medium px-3 py-1 bg-white rounded-full border border-slate-200 shadow-sm">
                Total histórico: {rawData.length} pacientes
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {monthlySummary.map(({ periodo, count }) => (
                <Card key={periodo} className="p-4 flex items-center justify-between shadow-sm border-0 ring-1 ring-slate-200 hover:shadow-md transition-shadow bg-white">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                      <Calendar className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-800">{periodo}</p>
                      <p className="text-xs font-medium text-slate-500 mt-0.5">{count} pacientes cargados</p>
                    </div>
                  </div>
                  <FileSpreadsheet className="w-5 h-5 text-slate-300" />
                </Card>
              ))}
            </div>

            <div className="flex flex-col items-end pt-4 space-y-4">
              {isSaving && (
                <div className="w-full max-w-md bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-slate-700">Subiendo a Firestore...</span>
                    <span className="text-sm font-bold text-blue-600">{saveProgress}%</span>
                  </div>
                  <ProgressBar value={saveProgress} color="blue" className="mt-2" />
                  <p className="text-xs text-orange-500 mt-3 flex items-center gap-1.5 font-medium">
                    <AlertCircle className="w-4 h-4" />
                    Por favor, no salgas de esta página hasta que finalice.
                  </p>
                </div>
              )}
              <Button 
                color="blue" 
                size="md"
                onClick={handleSaveToFirestore}
                loading={isSaving}
                loadingText="Guardando..."
              >
                Guardar Cambios en Base de Datos
              </Button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
