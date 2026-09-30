import { useData } from '../../context/DataContext';
import { 
  Users, 
  ClipboardCheck, 
  Clock, 
  ShieldAlert, 
  Activity 
} from 'lucide-react';

export default function KPICards() {
  const { kpis } = useData();

  const cards = [
    {
      title: 'COBERTURA EXÁMENES',
      subtitle: 'GLOBAL',
      metric: `${kpis.cobertura.porcentaje.toFixed(1).replace('.', ',')}%`,
      subtext: 'Meta ≥ 95%',
      icon: Users,
      colorClass: 'text-emerald-600',
      bgClass: 'bg-emerald-100',
      sparkline: (
        <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 18 L10 14 L18 16 L26 8 L32 10 L38 2" stroke="#059669" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'EXÁMENES REALIZADOS',
      subtitle: '(PERÍODO)',
      metric: kpis.realizados.valor.toLocaleString('es-CL'),
      subtext: `De ${kpis.realizados.total.toLocaleString('es-CL')} programados`,
      icon: ClipboardCheck,
      colorClass: 'text-blue-600',
      bgClass: 'bg-blue-100',
      sparkline: (
        <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 16 L10 18 L18 12 L26 14 L32 6 L38 4" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'VENCIDOS',
      subtitle: '',
      metric: kpis.vencidos.valor.toLocaleString('es-CL'),
      subtext: `${kpis.vencidos.porcentaje.toFixed(1).replace('.', ',')}% del total`,
      icon: Clock,
      colorClass: 'text-purple-600',
      bgClass: 'bg-purple-100',
      sparkline: (
        <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 10 L10 12 L18 18 L26 6 L32 8 L38 2" stroke="#9333ea" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'OBSERVADOS',
      subtitle: '',
      metric: kpis.observados.valor.toLocaleString('es-CL'),
      subtext: `${kpis.observados.porcentaje.toFixed(1).replace('.', ',')}% del total evaluado`,
      icon: ShieldAlert,
      colorClass: 'text-amber-500',
      bgClass: 'bg-amber-100',
      sparkline: (
        <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 18 L10 18 L18 18 L26 18 L32 10 L38 6" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    },
    {
      title: 'HALLAZGOS CRÍTICOS',
      subtitle: '',
      metric: kpis.hallazgos_criticos.valor.toLocaleString('es-CL'),
      subtext: 'Requieren seguimiento médico',
      icon: Activity,
      colorClass: 'text-red-500',
      bgClass: 'bg-red-100',
      sparkline: (
        <svg width="40" height="20" viewBox="0 0 40 20" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M2 10 L10 10 L15 2 L20 18 L25 10 L38 10" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      )
    }
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {cards.map((card, idx) => (
        <div key={idx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-3 flex flex-col justify-between min-w-0">
          {/* Header */}
          <div className="flex items-start gap-2 mb-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${card.bgClass}`}>
              <card.icon className={`w-4 h-4 ${card.colorClass}`} />
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <h3 className="text-[9px] font-bold text-slate-800 tracking-wide uppercase truncate leading-tight">
                {card.title}
              </h3>
              {card.subtitle && (
                <p className="text-[8px] text-slate-500 mt-0.5 truncate uppercase leading-tight">
                  {card.subtitle}
                </p>
              )}
            </div>
            <div className="shrink-0 mt-0.5">
              <div className="w-4 h-4 rounded-full border border-slate-200 flex items-center justify-center">
                <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-slate-400">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                </svg>
              </div>
            </div>
          </div>

          {/* Body */}
          <div className="mt-auto">
            <div className={`text-xl font-bold tracking-tight mb-0.5 ${card.colorClass}`}>
              {card.metric}
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-slate-500 truncate">
                {card.subtext}
              </p>
              <div className="shrink-0 ml-2">
                {card.sparkline}
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
