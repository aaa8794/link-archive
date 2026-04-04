export type Stage = 'saved' | 'in-progress' | 'done';

export interface Link {
  id: string;
  title: string;
  url: string;
  description?: string;
  stage: Stage;
  createdAt: string;
}
