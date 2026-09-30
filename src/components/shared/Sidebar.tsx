import { Link, useLocation } from 'react-router-dom';
import { 
  BarChart2, 
  Activity, 
  ClipboardList,
  ChevronRight,
  ChevronLeft,
  UploadCloud,
  UserCheck,
  Settings,
  Stethoscope,
  LogOut
} from 'lucide-react';
import { useSidebar } from './SidebarContext';
import { useData } from '../../context/DataContext';
import { useAuth } from '../../context/AuthContext';

const menuItems = [
  { name: 'Resumen Ejecutivo', icon: BarChart2, path: '/' },
  { name: 'Exámenes médicos', icon: Stethoscope, path: '/examenes' },
  { name: 'Hallazgos de Salud', icon: ClipboardList, path: '/hallazgos' },
];

export default function Sidebar() {
  const location = useLocation();
  const { isOpen, toggle } = useSidebar();
  const { pendingTriaje } = useData();
  const { logout } = useAuth();

  return (
    <aside className={`w-60 bg-[#0F172A] text-white flex flex-col h-screen fixed left-0 top-0 transition-transform duration-300 z-50 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
      
      {/* Bookmark Toggle Button */}
      <button 
        onClick={toggle}
        className="absolute -right-8 top-3 w-8 h-10 bg-[#0F172A] rounded-r-xl flex items-center justify-center shadow-md hover:bg-slate-800 transition-colors"
        title={isOpen ? "Ocultar menú" : "Mostrar menú"}
      >
        {isOpen ? <ChevronLeft className="w-5 h-5 text-white" /> : <ChevronRight className="w-5 h-5 text-white" />}
      </button>
      {/* Logo Area */}
      <div className="flex items-center p-4 border-b border-slate-700/50 mb-4">
        <div className="mr-3">
           {/* Heart outline with pulse icon approximation */}
           <div className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center">
              <Activity className="w-5 h-5" />
           </div>
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-body tracking-wide">SALUD EN EL TRABAJO</span>
          <span className="text-micro text-slate-400 font-medium">DESEMPEÑO Y CUMPLIMIENTO</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 overflow-y-auto px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.name}
              to={item.path}
              className={`flex items-center px-3 py-2.5 rounded-lg text-body font-medium transition-colors ${
                isActive 
                  ? 'bg-blue-600 text-white' 
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <item.icon className={`w-4 h-4 mr-3 ${isActive ? 'text-white' : 'text-slate-400'}`} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* Administración Section */}
      <div className="mt-4 px-4">
        <div className="text-xs font-semibold text-slate-500 tracking-wider mb-2 uppercase">
          Administración
        </div>
        <nav className="space-y-1">
          <Link
            to="/admin/carga"
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/admin/carga'
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <UploadCloud className={`w-4 h-4 mr-3 ${location.pathname === '/admin/carga' ? 'text-white' : 'text-slate-400'}`} />
            Carga de Excel
          </Link>
          <Link
            to="/admin/verificacion"
            className={`flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/admin/verificacion'
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <UserCheck className={`w-4 h-4 mr-3 ${location.pathname === '/admin/verificacion' ? 'text-white' : 'text-slate-400'}`} />
            Verificación Pacientes
          </Link>
          <Link
            to="/admin/hallazgos"
            className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              location.pathname === '/admin/hallazgos'
                ? 'bg-blue-600 text-white' 
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center">
              <Settings className={`w-4 h-4 mr-3 ${location.pathname === '/admin/hallazgos' ? 'text-white' : 'text-slate-400'}`} />
              Catálogo de Hallazgos
            </div>
            {pendingTriaje.length > 0 && (
              <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center justify-center animate-pulse">
                {pendingTriaje.length}
              </span>
            )}
          </Link>
        </nav>
      </div>
      
      {/* Footer Text & Logout */}
      <div className="p-4 border-t border-slate-700/50 mt-4">
        <button
          onClick={logout}
          className="flex w-full items-center px-3 py-2 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors mb-4"
        >
          <LogOut className="w-4 h-4 mr-3 text-slate-400" />
          Cerrar Sesión
        </button>
        <div className="text-micro text-slate-400 leading-tight">
          <p className="mb-1">Alineación normativa:</p>
          <p>MINSAL (Chile) - DS 594</p>
          <p>Perú - RM 312-2011-MINSA</p>
          <p>y modificatorias</p>
        </div>
      </div>
    </aside>
  );
}
