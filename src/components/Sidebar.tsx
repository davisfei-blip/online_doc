import React from 'react';
import { NavLink } from 'react-router-dom';
import { FileText, Tags, LogOut, BookOpen } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Sidebar: React.FC = () => {
  const { logout } = useAuth();
  
  const handleLogout = () => {
    logout();
  };

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col min-h-screen">
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <BookOpen className="w-6 h-6 text-blue-500 mr-3" />
        <span className="text-white font-semibold text-lg">云笔记</span>
      </div>

      <nav className="flex-1 py-4 px-3 space-y-1">
        <NavLink
          to="/notes"
          end
          className={({ isActive }) =>
            `flex items-center px-3 py-2.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <FileText className="w-5 h-5 mr-3" />
          全部笔记
        </NavLink>
        <NavLink
          to="/tags"
          className={({ isActive }) =>
            `flex items-center px-3 py-2.5 rounded-lg transition-colors ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'hover:bg-slate-800 hover:text-white'
            }`
          }
        >
          <Tags className="w-5 h-5 mr-3" />
          标签管理
        </NavLink>
      </nav>

      <div className="p-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-3 py-2.5 rounded-lg text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
        >
          <LogOut className="w-5 h-5 mr-3" />
          退出登录
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
