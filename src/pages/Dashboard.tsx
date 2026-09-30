import TopFilters from '../components/shared/TopFilters';
import KPICards from '../components/dashboard/KPICards';
import DashboardCharts from '../components/dashboard/DashboardCharts';
import { useData } from '../context/DataContext';
import LoadingScreen from '../components/shared/LoadingScreen';

export default function Dashboard() {
  const { isDataLoaded, isLoadingGlobal } = useData();

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <TopFilters />
      <main className="px-6 py-4 bg-slate-50 flex-1 overflow-y-auto">
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
          <>
            {/* KPI Cards (5 en una fila sin wrap, escala con tipografía) */}
            <div className="mb-6">
              <KPICards />
            </div>

            {/* Contenedor de Gráficos */}
            <DashboardCharts />
          </>
        )}
      </main>
    </div>
  );
}
