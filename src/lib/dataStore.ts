import { supabase } from './supabase';
import { localDb } from './localDb';
import { Note, Tag } from '../types';

const NOTES_TABLE = 'notes_public';
const TAGS_TABLE = 'tags_public';
const NOTE_TAGS_TABLE = 'note_tags_public';
const WORKSPACE_ID = 'default';

const mapSupabaseNotes = (data: Record<string, unknown>[] | null): Note[] => {
  if (!data) return [];
  return data.map((note) => {
    const base = note as {
      id: string;
      title: string;
      content: string;
      created_at: string;
      updated_at: string;
      tags?: { tag: Tag }[];
    };

    return {
      id: base.id,
      title: base.title,
      content: base.content,
      created_at: base.created_at,
      updated_at: base.updated_at,
      user_id: 'cloud',
      tags: Array.isArray(base.tags)
        ? base.tags.map((t) => ({ ...t.tag, user_id: 'cloud' }))
        : [],
    };
  });
};

export const dataStore = {
  isCloudEnabled: !!supabase,

  async getNotes(): Promise<Note[]> {
    if (!supabase) {
      return localDb.getNotes();
    }

    const { data, error } = await supabase
      .from(NOTES_TABLE)
      .select(`*, tags:${NOTE_TAGS_TABLE}(tag:${TAGS_TABLE}(*))`)
      .eq('workspace_id', WORKSPACE_ID)
      .order('updated_at', { ascending: false });

    if (error) {
      throw error;
    }

    return mapSupabaseNotes(data as Record<string, unknown>[]);
  },

  async getNoteById(id: string): Promise<Note | null> {
    if (!supabase) {
      return localDb.getNoteById(id);
    }

    const { data, error } = await supabase
      .from(NOTES_TABLE)
      .select(`*, tags:${NOTE_TAGS_TABLE}(tag:${TAGS_TABLE}(*))`)
      .eq('id', id)
      .single();

    if (error || !data) {
      return null;
    }

    const mapped = mapSupabaseNotes([data as Record<string, unknown>]);
    return mapped[0] || null;
  },

  async createNote(note: Partial<Note>): Promise<Note> {
    if (!supabase) {
      return localDb.createNote(note);
    }

    const { data, error } = await supabase
      .from(NOTES_TABLE)
      .insert([
        {
          title: note.title || '无标题笔记',
          content: note.content || '',
          workspace_id: WORKSPACE_ID,
        },
      ])
      .select()
      .single();

    if (error || !data) {
      throw error;
    }

    const created = mapSupabaseNotes([data as Record<string, unknown>])[0];
    if (note.tags && note.tags.length > 0) {
      const relations = note.tags.map((tag) => ({ note_id: created.id, tag_id: tag.id }));
      await supabase.from(NOTE_TAGS_TABLE).insert(relations);
    }

    return created;
  },

  async updateNote(id: string, updates: Partial<Note>): Promise<Note | null> {
    if (!supabase) {
      return localDb.updateNote(id, updates);
    }

    const { data, error } = await supabase
      .from(NOTES_TABLE)
      .update({
        title: updates.title,
        content: updates.content,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error || !data) {
      return null;
    }

    await supabase.from(NOTE_TAGS_TABLE).delete().eq('note_id', id);
    if (updates.tags && updates.tags.length > 0) {
      const relations = updates.tags.map((tag) => ({ note_id: id, tag_id: tag.id }));
      await supabase.from(NOTE_TAGS_TABLE).insert(relations);
    }

    return mapSupabaseNotes([data as Record<string, unknown>])[0] || null;
  },

  async deleteNote(id: string): Promise<void> {
    if (!supabase) {
      localDb.deleteNote(id);
      return;
    }

    await supabase.from(NOTES_TABLE).delete().eq('id', id);
  },

  async getTags(): Promise<Tag[]> {
    if (!supabase) {
      return localDb.getTags();
    }

    const { data, error } = await supabase
      .from(TAGS_TABLE)
      .select(`*, notes:${NOTE_TAGS_TABLE}(count)`)
      .eq('workspace_id', WORKSPACE_ID)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return (data as Tag[]).map((tag) => ({ ...tag, user_id: 'cloud' }));
  },

  async createTag(name: string): Promise<Tag> {
    if (!supabase) {
      return localDb.createTag(name, 'local-user-id');
    }

    const { data, error } = await supabase
      .from(TAGS_TABLE)
      .insert([{ name, workspace_id: WORKSPACE_ID }])
      .select(`*, notes:${NOTE_TAGS_TABLE}(count)`)
      .single();

    if (error || !data) {
      throw error;
    }

    return { ...(data as Tag), user_id: 'cloud' };
  },

  async updateTag(id: string, name: string): Promise<Tag | null> {
    if (!supabase) {
      return localDb.updateTag(id, name);
    }

    const { data, error } = await supabase
      .from(TAGS_TABLE)
      .update({ name })
      .eq('id', id)
      .select(`*, notes:${NOTE_TAGS_TABLE}(count)`)
      .single();

    if (error || !data) {
      return null;
    }

    return { ...(data as Tag), user_id: 'cloud' };
  },

  async deleteTag(id: string): Promise<void> {
    if (!supabase) {
      localDb.deleteTag(id);
      return;
    }

    await supabase.from(TAGS_TABLE).delete().eq('id', id);
  },
};
