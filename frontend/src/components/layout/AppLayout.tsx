import React, { ReactNode } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  const location = useLocation();

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden font-sans">
      {/* Sidebar - Fixed on the left */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 ml-64 overflow-hidden relative">
        <Topbar />
        
        {/* Scrollable Content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 custom-scrollbar bg-slate-50/50 backdrop-blur-sm relative z-0">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="min-h-full"
          >
            {children}
          </motion.div>
        </main>

        {/* Floating elements if needed */}
         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[100px] pointer-events-none rounded-full -mr-16 -mt-16" />
         <div className="absolute bottom-0 left-0 w-32 h-32 bg-sky-500/5 blur-[100px] pointer-events-none rounded-full -ml-16 -mb-16" />
      </div>
    </div>
  );
};

export default AppLayout;
