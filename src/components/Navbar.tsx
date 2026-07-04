import { motion } from 'motion/react';
import { GraduationCap, LogOut, LayoutDashboard, BarChart2, Sparkles, FolderOpen } from 'lucide-react';
import { UserProfile } from '../types.js';
import { ThemeToggle } from './ThemeToggle.js';

interface NavbarProps {
  user: UserProfile;
  currentView: 'dashboard' | 'progress';
  onViewChange: (view: 'dashboard' | 'progress') => void;
  onLogout: () => void;
}

export function Navbar({ user, currentView, onViewChange, onLogout }: NavbarProps) {
  return (
    <header id="main-app-header" className="sticky top-0 z-40 w-full border-b border-slate-200/50 dark:border-white/5 bg-white/70 dark:bg-slate-900/80 backdrop-blur-md transition-colors duration-200 select-none">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 rounded-xl border border-indigo-500/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <span className="text-xl font-black bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-tight">
              StudyAI
            </span>
            {user.isGuest && (
              <span className="hidden sm:inline-block px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[10px] font-bold uppercase tracking-wider">
                Guest
              </span>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="flex items-center gap-1.5 md:gap-2">
            <button
              id="nav-dashboard-btn"
              onClick={() => onViewChange('dashboard')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                currentView === 'dashboard'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>

            <button
              id="nav-progress-btn"
              onClick={() => onViewChange('progress')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                currentView === 'progress'
                  ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5'
              }`}
            >
              <BarChart2 className="h-4.5 w-4.5" />
              <span className="hidden sm:inline">Analytics</span>
            </button>
          </nav>

          {/* Right Profile Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {/* Profile Avatar & Info */}
            <div className="hidden md:flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-white/5">
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/bottts/svg?seed=${user.id}`}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="h-8.5 w-8.5 rounded-full border border-slate-200 dark:border-white/10 bg-slate-100 dark:bg-slate-900 p-0.5 object-cover"
              />
              <div className="text-left">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">{user.name}</p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1 uppercase font-semibold leading-none">Score: {user.learningScore || 0}</p>
              </div>
            </div>

            {/* Logout button */}
            <motion.button
              id="nav-logout-btn"
              whileTap={{ scale: 0.95 }}
              onClick={onLogout}
              className="p-2.5 rounded-xl border border-slate-200 dark:border-white/5 bg-white/70 dark:bg-slate-900/70 text-rose-500 dark:text-rose-400 backdrop-blur-md shadow-sm hover:bg-rose-500/5 dark:hover:bg-rose-500/10 cursor-pointer transition-colors duration-200"
              title="Logout"
            >
              <LogOut className="h-5 w-5" />
            </motion.button>
          </div>

        </div>
      </div>
    </header>
  );
}
