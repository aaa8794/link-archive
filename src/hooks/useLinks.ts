import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Link, Stage } from '../types';

const toLink = (row: any): Link => ({
  id: row.id,
  title: row.title,
  url: row.url,
  description: row.memo,
  stage: row.stage,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
  userEmail: row.user_email,
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

  const addLink = async (title: string, url: string, description?: string) => {
    const { data } = await supabase
      .from('links')
      .insert({ title, url, memo: description, stage: 'saved', user_email: userEmail })
      .select()
      .single();
    if (data) setLinks((prev) => [toLink(data), ...prev]);
  };

  const moveLink = async (id: string, stage: Stage) => {
    await supabase
      .from('links')
      .update({ stage, updated_at: new Date().toISOString() })
      .eq('id', id);
    setLinks((prev) =>
      prev.map((l) => (l.id === id ? { ...l, stage, updatedAt: new Date().toISOString() } : l))
    );
  };

  const removeLink = async (id: string) => {
    await supabase.from('links').delete().eq('id', id);
    setLinks((prev) => prev.filter((l) => l.id !== id));
  };

  return { links, addLink, moveLink, removeLink };
};

export default useLinks;
