export interface MemoryItem {
  id: string;
  title: string;
  content: string;
  linkedItemId?: string;
  linkedItemTitle?: string;
  linkedItemKind?: 'project' | 'initiative' | 'epic' | 'issue';
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface MemoryFilter {
  search?: string;
  linkedItemKind?: 'project' | 'initiative' | 'epic' | 'issue';
  tags?: string[];
}

export interface MemoryFormData {
  title: string;
  content: string;
  tags?: string[];
}
