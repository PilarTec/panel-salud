import { useState, useRef, useEffect } from 'react';
import { Calendar, Globe, MapPin, FileText, ChevronDown } from 'lucide-react';
import { useData } from '../../context/DataContext';

export default function TopFilters() {
  const { filters, filterOptions, setFilter, isDataLoaded, isLoadingGlobal } = useData();
  const [isProtocoloOpen, setIsProtocoloOpen] = useState(false);
  const protocoloRef = useRef<HTMLDivElement>(null);
  const [isSedeOpen, setIsSedeOpen] = useState(false);
  const sedeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (protocoloRef.current && !protocoloRef.current.contains(event.target as Node)) {
        setIsProtocoloOpen(false);
      }
      if (sedeRef.current && !sedeRef.current.contains(event.target as Node)) {
        setIsSedeOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFilterChange = (key: string, value: any) => {
    setFilter(key, value);
  };

  const toggleSede = (opt: string) => {
    const current = filters.sede || [];
    if (current.includes(opt)) {
      handleFilterChange('sede', current.filter((p: string) => p !== opt));
    } else {
      handleFilterChange('sede', [...current, opt]);
    }
  };

  const toggleProtocolo = (opt: string) => {
    const current = filters.protocolos || [];
    if (current.includes(opt)) {
      handleFilterChange('protocolos', current.filter((p: string) => p !== opt));
    } else {
      handleFilterChange('protocolos', [...current, opt]);
    }
  };

  return (
    <div className={`bg-white px-6 py-2.5 border-b border-tremor-border shadow-sm flex items-center justify-between shrink-0 transition-opacity duration-300 ${isLoadingGlobal ? 'opacity-50 pointer-events-none' : 'opacity-100'}`}>
      {/* Title */}
      <h1 className="text-sm font-semibold text-slate-800 tracking-tight pl-8 whitespace-nowrap">
        PANEL DE INDICADORES – SALUD EN EL TRABAJO
      </h1>

      {/* Filters */}
      <div className="flex items-center gap-2.5">
        {/* Año */}
        <div className="flex items-center gap-1.5 bg-slate-50 pl-2.5 pr-1 py-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div>
            <span className="text-[9px] font-semibold text-slate-400 uppercase block leading-none mb-0.5">Año</span>
            <select 
              value={filters.anio} 
              onChange={(e) => handleFilterChange('anio', e.target.value)}
              disabled={!isDataLoaded}
              className="text-xs text-slate-700 bg-transparent border-none outline-none cursor-pointer w-[60px] p-0 disabled:opacity-50"
            >
              <option value="Todos">Todos</option>
              {filterOptions.anio.map(opt => opt !== 'Todos' && <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        {/* Periodo */}
        <div className="flex items-center gap-1.5 bg-slate-50 pl-2.5 pr-1 py-1.5 rounded-lg border border-slate-200">
          <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div>
            <span className="text-[9px] font-semibold text-slate-400 uppercase block leading-none mb-0.5">Periodo</span>
            <select 
              value={filters.periodo}
              onChange={(e) => handleFilterChange('periodo', e.target.value)}
              disabled={!isDataLoaded}
              className="text-xs text-slate-700 bg-transparent border-none outline-none cursor-pointer w-[72px] p-0 disabled:opacity-50"
            >
              <option value="Todos">Todos</option>
              {filterOptions.periodo.map(opt => opt !== 'Todos' && <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        {/* País */}
        <div className="flex items-center gap-1.5 bg-slate-50 pl-2.5 pr-1 py-1.5 rounded-lg border border-slate-200">
          <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div>
            <span className="text-[9px] font-semibold text-slate-400 uppercase block leading-none mb-0.5">País</span>
            <select 
              value={filters.pais}
              onChange={(e) => handleFilterChange('pais', e.target.value)}
              disabled={!isDataLoaded}
              className="text-xs text-slate-700 bg-transparent border-none outline-none cursor-pointer w-[60px] p-0 disabled:opacity-50"
            >
              <option value="Todos">Todos</option>
              {filterOptions.pais.map(opt => opt !== 'Todos' && <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>
        </div>

        {/* Proceso (MultiSelect) */}
        <div 
          ref={sedeRef} 
          className={`relative flex items-center gap-1.5 bg-slate-50 pl-2.5 pr-2 py-1.5 rounded-lg border border-slate-200 ${isDataLoaded ? 'cursor-pointer hover:bg-slate-100' : 'opacity-50'}`} 
          onClick={() => isDataLoaded && setIsSedeOpen(!isSedeOpen)}
        >
          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold text-slate-400 uppercase block leading-none mb-0.5">Proceso</span>
            <div className="text-xs text-slate-700 truncate w-[76px] leading-none">
              {(!filters.sede || filters.sede.length === 0) 
                ? 'Todos' 
                : filters.sede.length === 1 
                  ? (filters.sede[0].length > 11 ? filters.sede[0].substring(0, 11) + '...' : filters.sede[0])
                  : `${filters.sede.length} selecc.`}
            </div>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          
          {isSedeOpen && (
            <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-slate-200 shadow-lg rounded-xl z-50 p-2 py-2" onClick={e => e.stopPropagation()}>
              <div className="max-h-60 overflow-y-auto custom-scrollbar pr-1 space-y-1">
                <label className="flex items-center px-2 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    className="mr-3 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={!filters.sede || filters.sede.length === 0}
                    onChange={() => handleFilterChange('sede', [])}
                  />
                  <span className="text-xs font-medium text-slate-700">Todos</span>
                </label>
                <div className="h-px bg-slate-100 my-1"></div>
                {filterOptions.sede.map(opt => opt !== 'Todos' && opt !== 'Todas' && (
                  <label key={opt} className="flex items-center px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="mr-3 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={filters.sede?.includes(opt) || false}
                      onChange={() => toggleSede(opt)}
                    />
                    <span className="text-xs text-slate-600">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Protocolo (MultiSelect) */}
        <div 
          ref={protocoloRef} 
          className={`relative flex items-center gap-1.5 bg-slate-50 pl-2.5 pr-2 py-1.5 rounded-lg border border-slate-200 ${isDataLoaded ? 'cursor-pointer hover:bg-slate-100' : 'opacity-50'}`} 
          onClick={() => isDataLoaded && setIsProtocoloOpen(!isProtocoloOpen)}
        >
          <FileText className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <div className="flex flex-col">
            <span className="text-[9px] font-semibold text-slate-400 uppercase block leading-none mb-0.5">Protocolo</span>
            <div className="text-xs text-slate-700 truncate w-[76px] leading-none">
              {(!filters.protocolos || filters.protocolos.length === 0) 
                ? 'Todos' 
                : filters.protocolos.length === 1 
                  ? (filters.protocolos[0].length > 11 ? filters.protocolos[0].substring(0, 11) + '...' : filters.protocolos[0])
                  : `${filters.protocolos.length} selecc.`}
            </div>
          </div>
          <ChevronDown className="w-3 h-3 text-slate-400 shrink-0" />
          
          {isProtocoloOpen && (
            <div className="absolute top-full right-0 mt-1 w-64 bg-white border border-slate-200 shadow-lg rounded-xl z-50 p-2 py-2" onClick={e => e.stopPropagation()}>
              <div className="max-h-60 overflow-y-auto custom-scrollbar pr-1 space-y-1">
                <label className="flex items-center px-2 py-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                  <input 
                    type="checkbox" 
                    className="mr-3 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={!filters.protocolos || filters.protocolos.length === 0}
                    onChange={() => handleFilterChange('protocolos', [])}
                  />
                  <span className="text-xs font-medium text-slate-700">Todos</span>
                </label>
                <div className="h-px bg-slate-100 my-1"></div>
                {filterOptions.protocolo.map(opt => opt !== 'Todos' && (
                  <label key={opt} className="flex items-center px-2 py-1.5 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors">
                    <input 
                      type="checkbox" 
                      className="mr-3 w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      checked={filters.protocolos?.includes(opt) || false}
                      onChange={() => toggleProtocolo(opt)}
                    />
                    <span className="text-xs text-slate-600">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Última actualización */}
        <div className="text-right ml-1">
          <p className="text-[9px] text-slate-400 leading-tight">Actualización:</p>
          <p className="text-[11px] font-medium text-slate-600">
            {isDataLoaded ? new Date().toLocaleDateString('es-CL') : '--/--/----'}
          </p>
        </div>
      </div>
    </div>
  );
}

