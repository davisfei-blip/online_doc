import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Plus, Clock, Tag as TagIcon, Trash2, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { useAuth } from '../contexts/AuthContext';
import { Note } from '../types';
import Sidebar from '../components/Sidebar';
import { localDb } from '../lib/localDb';

const NotesList: React.FC = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();

  const fetchNotes = useCallback(() => {
    try {
      const data = localDb.getNotes();
      // Sort by updated_at descending
      const sortedData = data.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
      setNotes(sortedData);
    } catch (error) {
      console.error('Error fetching notes:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotes();
    
    // In a real app we'd use events, but for localDb we just poll or rely on remounts
    const interval = setInterval(() => {
      fetchNotes();
    }, 2000);

    return () => clearInterval(interval);
  }, [fetchNotes]);

  const deleteNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('确定要删除这条笔记吗？')) return;

    try {
      localDb.deleteNote(id);
      setNotes(notes.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error deleting note:', error);
      alert('删除失败');
    }
  };

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shrink-0">
          <div className="relative w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="搜索笔记..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>
          
          <button
            onClick={() => navigate('/notes/new')}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Plus className="w-4 h-4 mr-2" />
            新建笔记
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8">
          {loading ? (
            <div className="flex justify-center items-center h-full text-slate-500">
              加载中...
            </div>
          ) : filteredNotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <FileText className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-lg font-medium text-slate-900 mb-1">暂无笔记</p>
              <p className="text-sm mb-6">开始记录您的第一个灵感吧</p>
              <button
                onClick={() => navigate('/notes/new')}
                className="flex items-center px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4 mr-2" />
                新建笔记
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredNotes.map((note) => (
                <div
                  key={note.id}
                  onClick={() => navigate(`/notes/${note.id}`)}
                  className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col h-64"
                >
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="font-semibold text-slate-900 line-clamp-1 flex-1 pr-2">
                      {note.title || '无标题笔记'}
                    </h3>
                    <button
                      onClick={(e) => deleteNote(note.id, e)}
                      className="text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  {/* Note content preview - strip HTML tags */}
                  <p className="text-sm text-slate-600 line-clamp-4 flex-1 mb-4">
                    {note.content.replace(/<[^>]*>?/gm, '') || '没有内容'}
                  </p>
                  
                  <div className="mt-auto pt-4 border-t border-slate-100 space-y-3">
                    {note.tags && note.tags.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {note.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.id}
                            className="inline-flex items-center px-2 py-1 rounded bg-blue-50 text-blue-600 text-xs"
                          >
                            <TagIcon className="w-3 h-3 mr-1" />
                            {tag.name}
                          </span>
                        ))}
                        {note.tags.length > 3 && (
                          <span className="inline-flex items-center px-2 py-1 rounded bg-slate-100 text-slate-600 text-xs">
                            +{note.tags.length - 3}
                          </span>
                        )}
                      </div>
                    )}
                    
                    <div className="flex items-center text-xs text-slate-400">
                      <Clock className="w-3 h-3 mr-1" />
                      {format(new Date(note.updated_at), 'yyyy年MM月dd日 HH:mm', {
                        locale: zhCN,
                      })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default NotesList;
