import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Tag as TagIcon, Trash2, Edit2, Check, X } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Tag } from '../types';
import Sidebar from '../components/Sidebar';
import { dataStore } from '../lib/dataStore';

const TagsManager: React.FC = () => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTagName, setNewTagName] = useState('');
  const [editingTag, setEditingTag] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const { user } = useAuth();

  const fetchTags = useCallback(async () => {
    if (!user) return;
    try {
      const data = await dataStore.getTags();
      setTags(data);
    } catch (error) {
      console.error('Error fetching tags:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const handleCreateTag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTagName.trim() || !user) return;

    try {
      const name = newTagName.trim();
      const existingTag = tags.find(t => t.name === name);
      if (existingTag) {
        alert('标签名称已存在');
        return;
      }

      const newTag = await dataStore.createTag(name);
      setTags([newTag, ...tags]);
      setNewTagName('');
    } catch (error) {
      console.error('Error creating tag:', error);
      alert('创建失败');
    }
  };

  const startEdit = (tag: Tag) => {
    setEditingTag(tag.id);
    setEditName(tag.name);
  };

  const cancelEdit = () => {
    setEditingTag(null);
    setEditName('');
  };

  const saveEdit = async (id: string) => {
    const name = editName.trim();
    if (!name) return;

    try {
      const existingTag = tags.find(t => t.name === name && t.id !== id);
      if (existingTag) {
        alert('标签名称已存在');
        return;
      }

      const updatedTag = await dataStore.updateTag(id, name);
      if (updatedTag) {
        // Keep the note count when updating the state
        const currentTag = tags.find(t => t.id === id);
        setTags(tags.map(t => t.id === id ? { ...updatedTag, notes: currentTag?.notes } : t));
      }
      setEditingTag(null);
    } catch (error) {
      console.error('Error updating tag:', error);
      alert('更新失败');
    }
  };

  const deleteTag = async (id: string) => {
    if (!window.confirm('确定要删除这个标签吗？关联此标签的笔记将保留，但标签会被移除。')) return;

    try {
      await dataStore.deleteTag(id);
      setTags(tags.filter(t => t.id !== id));
    } catch (error) {
      console.error('Error deleting tag:', error);
      alert('删除失败');
    }
  };

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center px-8 shrink-0">
          <h1 className="text-xl font-semibold text-slate-800">标签管理</h1>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-4xl mx-auto">
            {/* Create Tag Form */}
            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-8">
              <h2 className="text-lg font-medium text-slate-800 mb-4">新建标签</h2>
              <form onSubmit={handleCreateTag} className="flex gap-4">
                <input
                  type="text"
                  value={newTagName}
                  onChange={(e) => setNewTagName(e.target.value)}
                  placeholder="输入标签名称..."
                  className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                  maxLength={50}
                />
                <button
                  type="submit"
                  disabled={!newTagName.trim()}
                  className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  添加
                </button>
              </form>
            </div>

            {/* Tags List */}
            {loading ? (
              <div className="text-center text-slate-500 py-12">加载中...</div>
            ) : tags.length === 0 ? (
              <div className="text-center text-slate-500 py-12">暂无标签，请在上方添加</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tags.map((tag) => (
                  <div key={tag.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between group">
                    {editingTag === tag.id ? (
                      <div className="flex items-center flex-1 w-full gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="flex-1 px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') saveEdit(tag.id);
                            if (e.key === 'Escape') cancelEdit();
                          }}
                        />
                        <button onClick={() => saveEdit(tag.id)} className="p-1 text-green-600 hover:bg-green-50 rounded">
                          <Check className="w-4 h-4" />
                        </button>
                        <button onClick={cancelEdit} className="p-1 text-slate-400 hover:bg-slate-100 rounded">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center overflow-hidden">
                          <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mr-3 shrink-0">
                            <TagIcon className="w-4 h-4 text-blue-600" />
                          </div>
                          <div className="overflow-hidden">
                            <h3 className="font-medium text-slate-800 truncate" title={tag.name}>
                              {tag.name}
                            </h3>
                            <p className="text-xs text-slate-500 mt-0.5">
                              {tag.notes?.[0]?.count || 0} 篇笔记
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity ml-4 shrink-0">
                          <button
                            onClick={() => startEdit(tag)}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors mr-1"
                            title="编辑"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => deleteTag(tag.id)}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                            title="删除"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default TagsManager;
