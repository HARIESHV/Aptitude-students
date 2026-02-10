
import React from 'react';
import { User } from '../../types';

interface NavbarProps {
  user: User;
  onLogout: () => void;
  syncStatus?: 'synced' | 'syncing' | 'error';
}

const Navbar: React.FC<NavbarProps> = ({ user, onLogout, syncStatus = 'synced' }) => {
  const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';

  return (
    <nav className="bg-white/80 backdrop-blur-md border-b sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 h-16 sm:h-20 flex items-center justify-between">
        <div className="flex items-center space-x-2 sm:space-x-4">
          <div className="w-10 h-10 sm:w-12 sm:h-12 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
            <span className="text-white font-black text-xl sm:text-2xl">A</span>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="text-lg sm:text-xl font-black text-slate-900 leading-tight">AptiMaster</span>
              <div 
                className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border cursor-help group relative ${isSecure ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-amber-50 border-amber-100 text-amber-600'}`}
              >
                <div className={`w-1.5 h-1.5 rounded-full animate-pulse ${isSecure ? 'bg-emerald-500' : 'bg-amber-500'}`}></div>
                <span className="text-[9px] font-black uppercase tracking-widest">{isSecure ? 'SSL Secure' : 'Insecure'}</span>
              </div>
            </div>
            <div className="flex items-center gap-2 mt-0.5">
               <span className="text-[9px] px-1.5 py-0.5 bg-indigo-50 text-indigo-700 rounded-md font-bold uppercase tracking-widest">
                {user.role} CHANNEL
              </span>
              <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-slate-100 rounded-md">
                <div className={`w-1 h-1 rounded-full ${syncStatus === 'synced' ? 'bg-emerald-500' : syncStatus === 'syncing' ? 'bg-amber-500 animate-pulse' : 'bg-red-500'}`}></div>
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Sync: {user.classroomId}</span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-3 sm:space-x-8">
          <div className="hidden md:flex flex-col text-right">
            <p className="text-sm font-black text-slate-800">{user.name}</p>
            <p className="text-[10px] text-slate-400 font-mono font-bold tracking-tighter">{user.id}</p>
          </div>
          <button 
            onClick={onLogout}
            className="text-xs sm:text-sm font-black text-slate-400 hover:text-red-500 px-4 py-2 sm:px-6 sm:py-3 rounded-2xl border-2 border-slate-50 hover:bg-red-50 hover:border-red-100 transition-all active:scale-95 uppercase tracking-widest"
          >
            Sign Out
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
