import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableHeader } from '@tiptap/extension-table-header';
import { TableCell } from '@tiptap/extension-table-cell';
import { 
  ArrowLeft, Save, Bold, Italic, Strikethrough, 
  List, ListOrdered, Quote, Heading1, Heading2, Tag as TagIcon,
  Image as ImageIcon, Table as TableIcon, Trash2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Tag } from '../types';
import { localDb } from '../lib/localDb';

const SAVE_DELAY = 1000; // 1 second

const NoteEditor: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [title, setTitle] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Setup TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: '开始记录你的灵感...',
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image.configure({
        inline: true,
        allowBase64: true,
        HTMLAttributes: {
          class: 'rounded-lg max-w-full h-auto shadow-sm',
        },
      }),
      Table.configure({
        resizable: true,
        HTMLAttributes: {
          class: 'border-collapse table-auto w-full',
        },
      }),
      TableRow,
      TableHeader.configure({
        HTMLAttributes: {
          class: 'border border-slate-300 bg-slate-50 px-4 py-2 font-semibold text-left',
        },
      }),
      TableCell.configure({
        HTMLAttributes: {
          class: 'border border-slate-300 px-4 py-2',
        },
      }),
    ],
    content: '',
    onUpdate: () => {
      setSaveStatus('saving');
    },
    editorProps: {
      attributes: {
        class: 'prose prose-slate max-w-none focus:outline-none min-h-[500px] py-4',
      },
      handlePaste: (view, event, slice) => {
        const items = Array.from(event.clipboardData?.items || []);
        const imageItem = items.find(item => item.type.indexOf('image') === 0);
        
        if (imageItem) {
          event.preventDefault();
          const file = imageItem.getAsFile();
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              if (src) {
                const { schema } = view.state;
                const node = schema.nodes.image.create({ src });
                const transaction = view.state.tr.replaceSelectionWith(node);
                view.dispatch(transaction);
              }
            };
            reader.readAsDataURL(file);
          }
          return true;
        }
        return false;
      },
      handleDrop: (view, event, slice, moved) => {
        if (!moved && event.dataTransfer && event.dataTransfer.files && event.dataTransfer.files[0]) {
          const file = event.dataTransfer.files[0];
          if (file.type.indexOf('image') === 0) {
            event.preventDefault();
            const reader = new FileReader();
            reader.onload = (e) => {
              const src = e.target?.result as string;
              if (src) {
                const { schema } = view.state;
                const coordinates = view.posAtCoords({ left: event.clientX, top: event.clientY });
                const node = schema.nodes.image.create({ src });
                const transaction = view.state.tr.insert(coordinates?.pos || view.state.selection.to, node);
                view.dispatch(transaction);
              }
            };
            reader.readAsDataURL(file);
            return true;
          }
        }
        return false;
      },
    },
  });

  const fetchTags = useCallback(() => {
    if (!user) return;
    const tags = localDb.getTags();
    setAvailableTags(tags);
  }, [user]);

  const fetchNote = useCallback(() => {
    if (!user || !id) return;
    
    try {
      const note = localDb.getNoteById(id);
      
      if (note) {
        setTitle(note.title);
        editor?.commands.setContent(note.content);
        setSelectedTags(note.tags || []);
      }
    } catch (error) {
      console.error('Error fetching note:', error);
    } finally {
      setIsInitializing(false);
    }
  }, [user, id, editor]);

  useEffect(() => {
    fetchTags();
    if (id) {
      fetchNote();
    } else {
      setIsInitializing(false);
    }
  }, [id, fetchTags, fetchNote]);

  const saveNote = useCallback(() => {
    if (!user) return;
    
    try {
      const noteData = {
        title: title || '无标题笔记',
        content: editor?.getHTML() || '',
        user_id: user.id,
        tags: selectedTags
      };

      if (!id) {
        // Create new
        const newNote = localDb.createNote(noteData);
        // Update URL without reloading to trigger the id dependency and prevent future creates
        window.history.replaceState(null, '', `/notes/${newNote.id}`);
        // We need to force a re-render or state update so the next save acts as an update
        navigate(`/notes/${newNote.id}`, { replace: true });
      } else {
        // Update existing
        localDb.updateNote(id, noteData);
      }

      setSaveStatus('saved');
    } catch (error) {
      console.error('Error saving note:', error);
      setSaveStatus('error');
    }
  }, [user, title, editor, id, selectedTags, navigate]);

  // Debounced save
  const currentHtml = editor?.getHTML();
  useEffect(() => {
    if (isInitializing || !user) return;
    
    const timeoutId = setTimeout(() => {
      if (saveStatus === 'saving') {
        saveNote();
      }
    }, SAVE_DELAY);

    return () => clearTimeout(timeoutId);
  }, [title, currentHtml, saveStatus, isInitializing, user, saveNote]);

  const toggleTag = (tag: Tag) => {
    const isSelected = selectedTags.some(t => t.id === tag.id);
    if (isSelected) {
      setSelectedTags(selectedTags.filter(t => t.id !== tag.id));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
    setSaveStatus('saving');
  };

  const addImage = () => {
    const url = window.prompt('请输入图片链接(URL):');
    if (url) {
      editor?.chain().focus().setImage({ src: url }).run();
    }
  };

  const addTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  if (!editor) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header Toolbar */}
      <header className="h-16 border-b border-slate-200 flex items-center justify-between px-6 shrink-0 bg-white sticky top-0 z-10">
        <div className="flex items-center">
          <button 
            onClick={() => navigate('/notes')}
            className="p-2 hover:bg-slate-100 rounded-lg mr-4 text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          
          <div className="flex items-center space-x-1 border-r border-slate-200 pr-4 mr-4">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('bold') ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
              title="加粗"
            >
              <Bold className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('italic') ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
              title="斜体"
            >
              <Italic className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('strike') ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
              title="删除线"
            >
              <Strikethrough className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-1 border-r border-slate-200 pr-4 mr-4">
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('heading', { level: 1 }) ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
              title="标题 1"
            >
              <Heading1 className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('heading', { level: 2 }) ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
              title="标题 2"
            >
              <Heading2 className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-1">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('bulletList') ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
              title="无序列表"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('orderedList') ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
              title="有序列表"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className={`p-2 rounded hover:bg-slate-100 ${editor.isActive('blockquote') ? 'text-blue-600 bg-blue-50' : 'text-slate-600'}`}
              title="引用"
            >
              <Quote className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center space-x-1 border-l border-slate-200 pl-4 ml-4">
            <button
              onClick={addImage}
              className="p-2 rounded hover:bg-slate-100 text-slate-600"
              title="插入图片"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={addTable}
              className="p-2 rounded hover:bg-slate-100 text-slate-600"
              title="插入表格"
            >
              <TableIcon className="w-4 h-4" />
            </button>
            
            {/* Table controls - only show when a table is active */}
            {editor.isActive('table') && (
              <div className="flex items-center space-x-1 ml-2 bg-slate-50 p-1 rounded-lg">
                <button
                  onClick={() => editor.chain().focus().addColumnAfter().run()}
                  className="px-2 py-1 text-xs rounded hover:bg-slate-200 text-slate-600"
                  title="插入列"
                >
                  +列
                </button>
                <button
                  onClick={() => editor.chain().focus().addRowAfter().run()}
                  className="px-2 py-1 text-xs rounded hover:bg-slate-200 text-slate-600"
                  title="插入行"
                >
                  +行
                </button>
                <button
                  onClick={() => editor.chain().focus().deleteTable().run()}
                  className="p-1 rounded hover:bg-red-100 text-red-500 ml-1"
                  title="删除表格"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              onClick={() => setShowTagMenu(!showTagMenu)}
              className="flex items-center px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <TagIcon className="w-4 h-4 mr-2" />
              标签 ({selectedTags.length})
            </button>
            
            {showTagMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border border-slate-200 p-2 z-20">
                <div className="text-xs font-medium text-slate-500 px-2 py-1 mb-1">选择标签</div>
                <div className="max-h-60 overflow-y-auto space-y-1">
                  {availableTags.length === 0 ? (
                    <div className="px-2 py-3 text-sm text-slate-400 text-center">暂无标签，请先去管理页创建</div>
                  ) : (
                    availableTags.map(tag => {
                      const isSelected = selectedTags.some(t => t.id === tag.id);
                      return (
                        <button
                          key={tag.id}
                          onClick={() => toggleTag(tag)}
                          className="flex items-center w-full px-2 py-1.5 text-sm rounded hover:bg-slate-50 text-left"
                        >
                          <div className={`w-4 h-4 rounded border mr-2 flex items-center justify-center ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-slate-300'}`}>
                            {isSelected && <div className="w-2 h-2 bg-white rounded-sm" />}
                          </div>
                          <span className="truncate">{tag.name}</span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center text-sm">
            {saveStatus === 'saving' && (
              <span className="text-slate-400 flex items-center">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2 animate-pulse" />
                保存中...
              </span>
            )}
            {saveStatus === 'saved' && (
              <span className="text-emerald-600 flex items-center">
                <Save className="w-4 h-4 mr-1.5" />
                已保存
              </span>
            )}
            {saveStatus === 'error' && (
              <span className="text-red-500 flex items-center">
                保存失败
              </span>
            )}
          </div>
        </div>
      </header>

      {/* Editor Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-8 py-12">
          {/* Selected Tags Display */}
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {selectedTags.map(tag => (
                <span key={tag.id} className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-100 text-slate-600 text-sm">
                  <TagIcon className="w-3.5 h-3.5 mr-1.5" />
                  {tag.name}
                  <button 
                    onClick={() => toggleTag(tag)}
                    className="ml-1.5 text-slate-400 hover:text-slate-600"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          )}

          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setSaveStatus('saving');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                editor?.commands.focus();
              }
            }}
            placeholder="无标题笔记"
            className="w-full text-4xl font-bold text-slate-900 placeholder:text-slate-300 border-none outline-none bg-transparent mb-8"
          />
          
          <EditorContent editor={editor} />
        </div>
      </main>
    </div>
  );
};

export default NoteEditor;
