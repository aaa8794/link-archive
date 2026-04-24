import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from '../types';

const toLink = (row: any): Link => ({
  id: row.id,
  title: row.title,
  url: row.url,
  ogImage: row.og_image ?? undefined,
  images: row.images ?? [],
  description: row.memo,
  memo: row.memo,
  liked: row.liked ?? false,
  insight: row.insight ?? undefined,
  idea: row.idea ?? undefined,
  status: row.status ?? 'saved',
  tags: row.tags ?? [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  userId: row.user_id,
  folderId: row.folder_id,
});

const useLinks = (userId: string) => {
  const [links, setLinks] = useState<Link[]>([]);

  const fetchLinks = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('links')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (data) setLinks(data.map(toLink));
  }, [userId]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const addLink = async (
    title: string,
    url: string,
    ogImage?: string,
    description?: string,
    folderId?: string,
    images: string[] = []
  ) => {
    const { error } = await supabase
      .from('links')
      .insert({
        title,
        url,
        og_image: ogImage || null,
        images,
        memo: description,
        liked: false,
        tags: [],
        user_id: userId,
        folder_id: folderId || null,
      });
    if (error) {
      console.error('addLink error:', error);
      return;
    }
    await fetchLinks();
  };

  const updateLink = async (id: string, updates: { title?: string; folderId?: string; tags?: string[]; insight?: string; idea?: string }) => {
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.folderId !== undefined) dbUpdates.folder_id = updates.folderId || null;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.insight !== undefined) dbUpdates.insight = updates.insight;
    if (updates.idea !== undefined) dbUpdates.idea = updates.idea;

    // auto-update status based on content depth
    const currentLink = links.find((l) => l.id === id);
    const nextIdea = updates.idea !== undefined ? updates.idea : currentLink?.idea;
    const nextInsight = updates.insight !== undefined ? updates.insight : currentLink?.insight;
    if (nextIdea?.trim()) {
      dbUpdates.status = 'expanded';
    } else if (nextInsight?.trim()) {
      dbUpdates.status = 'insight';
    } else {
      dbUpdates.status = 'saved';
    }

    await supabase.from('links').update(dbUpdates).eq('id', id);
    setLinks((prev) => prev.map((l) => l.id === id ? { ...l, ...updates, status: dbUpdates.status, updatedAt: new Date().toISOString() } : l));
  };

  const toggleLike = async (id: string, liked: boolean) => {
    await supabase.from('links').update({ liked }).eq('id', id);
    setLinks((prev) => prev.map((l) => (l.id === id ? { ...l, liked } : l)));
  };

  const removeLink = async (id: string) => {
    await supabase.from('links').delete().eq('id', id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  return { links, addLink, updateLink, toggleLike, removeLink };
};

export default useLinks;
