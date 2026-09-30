import React from 'react';
import Sidebar from './Sidebar';
import { SidebarProvider, useSidebar } from './SidebarContext';

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { isOpen, toggle } = useSidebar();
  
  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden relative">
      <Sidebar />
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 transition-opacity" 
          onClick={toggle}
        />
      )}
      <div className="flex-1 flex flex-col w-full h-screen overflow-y-auto">
        {children}
      </div>
    </div>
  );
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <LayoutContent>{children}</LayoutContent>
    </SidebarProvider>
  );
}
