export type Stage = 'saved' | 'in-progress' | 'done';

export interface Folder {
  id: string;
  name: string;
  reminderEnabled: boolean;
  userEmail: string;
  createdAt: string;
}

export interface Link {
  id: string;
  title: string;
  url: string;
  description?: string;
  stage: Stage;
  createdAt: string;
  updatedAt: string;
  userEmail: string;
  folderId?: string;
}
