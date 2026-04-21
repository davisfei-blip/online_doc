import { Note, Tag } from '../types';

const NOTES_KEY = 'local_notes';
const TAGS_KEY = 'local_tags';

export const localDb = {
  // Notes
  getNotes: (): Note[] => {
    const data = localStorage.getItem(NOTES_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveNotes: (notes: Note[]) => {
    localStorage.setItem(NOTES_KEY, JSON.stringify(notes));
  },

  createNote: (note: Partial<Note>): Note => {
    const notes = localDb.getNotes();
    const newNote: Note = {
      id: crypto.randomUUID(),
      title: note.title || '无标题笔记',
      content: note.content || '',
      user_id: note.user_id || 'local-user-id',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      tags: note.tags || [],
    };
    notes.push(newNote);
    localDb.saveNotes(notes);
    return newNote;
  },

  updateNote: (id: string, updates: Partial<Note>): Note | null => {
    const notes = localDb.getNotes();
    const index = notes.findIndex(n => n.id === id);
    if (index === -1) return null;

    const updatedNote = {
      ...notes[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    notes[index] = updatedNote;
    localDb.saveNotes(notes);
    return updatedNote;
  },

  deleteNote: (id: string) => {
    const notes = localDb.getNotes();
    localDb.saveNotes(notes.filter(n => n.id !== id));
  },

  getNoteById: (id: string): Note | null => {
    const notes = localDb.getNotes();
    return notes.find(n => n.id === id) || null;
  },

  // Tags
  getTags: (): Tag[] => {
    const data = localStorage.getItem(TAGS_KEY);
    return data ? JSON.parse(data) : [];
  },

  saveTags: (tags: Tag[]) => {
    localStorage.setItem(TAGS_KEY, JSON.stringify(tags));
  },

  createTag: (name: string, userId: string): Tag => {
    const tags = localDb.getTags();
    const newTag: Tag = {
      id: crypto.randomUUID(),
      name,
      user_id: userId,
      created_at: new Date().toISOString(),
      notes: [{ count: 0 }],
    };
    tags.push(newTag);
    localDb.saveTags(tags);
    return newTag;
  },

  updateTag: (id: string, name: string): Tag | null => {
    const tags = localDb.getTags();
    const index = tags.findIndex(t => t.id === id);
    if (index === -1) return null;

    tags[index].name = name;
    localDb.saveTags(tags);
    
    // Update tag in all notes
    const notes = localDb.getNotes();
    let notesUpdated = false;
    const newNotes = notes.map(note => {
      if (note.tags?.some(t => t.id === id)) {
        notesUpdated = true;
        return {
          ...note,
          tags: note.tags.map(t => t.id === id ? { ...t, name } : t)
        };
      }
      return note;
    });
    
    if (notesUpdated) {
      localDb.saveNotes(newNotes);
    }
    
    return tags[index];
  },

  deleteTag: (id: string) => {
    const tags = localDb.getTags();
    localDb.saveTags(tags.filter(t => t.id !== id));
    
    // Remove tag from all notes
    const notes = localDb.getNotes();
    const newNotes = notes.map(note => ({
      ...note,
      tags: note.tags?.filter(t => t.id !== id) || []
    }));
    localDb.saveNotes(newNotes);
  },
};
