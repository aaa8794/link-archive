import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from '../types';

const toLink = (row: any): Link => ({
  id: row.id,
  title: row.title,
  url: row.url,
  description: row.memo,
  liked: row.liked ?? false,
  retrospective: row.retrospective,
  tags: row.tags ?? [],
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  userEmail: row.user_email,
  folderId: row.folder_id,
});

const useLinks = (userEmail: string) => {
  const [links, setLinks] = useState<Link[]>([]);

  const fetchLinks = useCallback(async () => {
    if (!userEmail) return;
    const { data } = await supabase
      .from('links')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: false });
    if (data) setLinks(data.map(toLink));
  }, [userEmail]);

  useEffect(() => {
    fetchLinks();
  }, [fetchLinks]);

  const addLink = async (title: string, url: string, description?: string, folderId?: string) => {
    const { data } = await supabase
      .from('links')
      .insert({ title, url, memo: description, liked: false, tags: [], user_email: userEmail, folder_id: folderId || null })
      .select()
      .single();
    if (data) setLinks((prev) => [toLink(data), ...prev]);
  };

  const updateLink = async (id: string, updates: { title?: string; folderId?: string; tags?: string[]; retrospective?: string }) => {
    const dbUpdates: any = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) dbUpdates.title = updates.title;
    if (updates.folderId !== undefined) dbUpdates.folder_id = updates.folderId || null;
    if (updates.tags !== undefined) dbUpdates.tags = updates.tags;
    if (updates.retrospective !== undefined) dbUpdates.retrospective = updates.retrospective;

    await supabase.from('links').update(dbUpdates).eq('id', id);
    setLinks((prev) => prev.map((l) => l.id === id ? { ...l, ...updates, updatedAt: new Date().toISOString() } : l));
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
