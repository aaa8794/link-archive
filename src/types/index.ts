export interface Folder {
  id: string;
  name: string;
  reminderEnabled: boolean;
  userId: string;
  createdAt: string;
}

export interface Insight {
  id: string;
  linkId: string;
  content: string;
  imageUrl?: string;
  isPinned: boolean;
  createdAt: string;
}

export interface Link {
  id: string;
  title: string;
  url: string;
  ogImage?: string;
  description?: string;
  liked: boolean;
  insight?: string;
  idea?: string;
  status: 'saved' | 'insight' | 'expanded';
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
  folderId?: string;
}
