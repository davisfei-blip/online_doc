import React from 'react';
import { Search, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface HeaderProps {
  onSearch?: (query: string) => void;
  showSearch?: boolean;
}

const Header: React.FC<HeaderProps> = ({ onSearch, showSearch = true }) => {
  const navigate = useNavigate();
  const { user } = useAuth();

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6">
      <div className="flex-1 flex items-center">
        {showSearch && (
          <div className="relative w-full max-w-md">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
              type="text"
              placeholder="搜索笔记..."
              className="block w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg leading-5 bg-slate-50 placeholder-slate-400 focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 sm:text-sm transition-colors"
              onChange={(e) => onSearch && onSearch(e.target.value)}
            />
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/notes/new')}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
        >
          <Plus className="h-5 w-5 mr-2" />
          新建笔记
        </button>
        
        <div className="flex items-center">
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold">
            {user?.email?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
