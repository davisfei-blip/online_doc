export interface Tag {
  id: string;
  name: string;
  user_id: string;
  created_at: string;
  notes?: { count: number }[];
}

export interface Note {
  id: string;
  title: string;
  content: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  tags?: Tag[];
}
