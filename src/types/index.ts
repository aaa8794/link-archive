export interface Folder {
  id: string;
  name: string;
  reminderEnabled: boolean;
  userEmail: string;
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
  description?: string;
  liked: boolean;
  retrospective?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  userEmail: string;
  folderId?: string;
}
