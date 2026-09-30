import { Activity } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="h-full w-full flex flex-col items-center justify-center p-8 bg-slate-50/50">
      <div className="relative flex items-center justify-center mb-8">
        {/* Pulsing background rings */}
        <div className="absolute inset-0 bg-blue-500/20 rounded-full animate-ping" style={{ animationDuration: '2s' }}></div>
        <div className="absolute inset-[-12px] bg-blue-400/10 rounded-full animate-ping" style={{ animationDuration: '3s', animationDelay: '0.5s' }}></div>
        
        {/* Spinner ring */}
        <div className="absolute inset-[-20px] rounded-full border-4 border-transparent border-t-blue-500 border-r-blue-400 animate-spin" style={{ animationDuration: '1.5s' }}></div>
        
        {/* Center Icon */}
        <div className="relative bg-white text-blue-600 w-16 h-16 rounded-full flex items-center justify-center shadow-lg border border-blue-100 z-10">
          <Activity className="w-8 h-8 animate-pulse text-blue-500" />
        </div>
      </div>
      
      <h2 className="text-xl font-bold text-slate-800 tracking-tight">
        Sincronizando con la base de datos
        <span className="inline-flex w-8 justify-start">
          <span className="animate-[bounce_1.4s_infinite] inline-block">.</span>
          <span className="animate-[bounce_1.4s_infinite_0.2s] inline-block">.</span>
          <span className="animate-[bounce_1.4s_infinite_0.4s] inline-block">.</span>
        </span>
      </h2>
      <p className="text-slate-500 mt-2 font-medium">Preparando la información de salud...</p>
      
      {/* Shimmer loading bar */}
      <div className="w-48 h-1.5 bg-slate-200 rounded-full mt-6 overflow-hidden relative">
        <div className="absolute top-0 bottom-0 left-0 right-0 bg-gradient-to-r from-transparent via-blue-400 to-transparent w-[200%] animate-[shimmer_2s_infinite]"></div>
      </div>
    </div>
  );
}
