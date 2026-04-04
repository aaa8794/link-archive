import { useState } from 'react';
import { Link, Stage } from '../types';

const STORAGE_KEY = 'link-archive-links';

const loadLinks = (): Link[] => {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveLinks = (links: Link[]) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(links));
};

const useLinks = () => {
  const [links, setLinks] = useState<Link[]>(loadLinks);

  const addLink = (title: string, url: string, description?: string) => {
    const newLink: Link = {
      id: Date.now().toString(),
      title,
      url,
      description,
      stage: 'saved',
      createdAt: new Date().toISOString(),
    };
    setLinks((prev) => {
      const updated = [newLink, ...prev];
      saveLinks(updated);
      return updated;
    });
  };

  const moveLink = (id: string, stage: Stage) => {
    setLinks((prev) => {
      const updated = prev.map((link) =>
        link.id === id ? { ...link, stage } : link
      );
      saveLinks(updated);
      return updated;
    });
  };

  const removeLink = (id: string) => {
    setLinks((prev) => {
      const updated = prev.filter((link) => link.id !== id);
      saveLinks(updated);
      return updated;
    });
  };

  return { links, addLink, moveLink, removeLink };
};

export default useLinks;
