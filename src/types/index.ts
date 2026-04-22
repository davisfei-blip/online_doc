export interface Tag {
  id: string;
  name: string;
  user_id?: string;
  created_at: string;
  notes?: { count: number }[];
}

export interface Attachment {
  id: string;
  name: string;
  type: string;
  size: number;
  dataUrl: string;
  created_at: string;
}

export interface Note {
  id: string;
  title: string;
  content: string;
  user_id?: string;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
  attachments?: Attachment[];
}
