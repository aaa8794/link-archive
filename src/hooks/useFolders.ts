import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Folder } from '../types';

const toFolder = (row: any): Folder => ({
  id: row.id,
  name: row.name,
  reminderEnabled: row.reminder_enabled,
  userId: row.user_id,
  createdAt: row.created_at,
});

const useFolders = (userId: string) => {
  const [folders, setFolders] = useState<Folder[]>([]);

  const fetchFolders = useCallback(async () => {
    if (!userId) return;
    const { data } = await supabase
      .from('folders')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    if (data) setFolders(data.map(toFolder));
  }, [userId]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const addFolder = async (name: string) => {
    const { data } = await supabase
      .from('folders')
      .insert({ name, user_id: userId, reminder_enabled: true })
      .select()
      .single();
    if (data) setFolders((prev) => [...prev, toFolder(data)]);
  };

  const removeFolder = async (id: string) => {
    await supabase.from('folders').delete().eq('id', id);
    setFolders((prev) => prev.filter((f) => f.id !== id));
  };

  const toggleReminder = async (id: string, enabled: boolean) => {
    await supabase.from('folders').update({ reminder_enabled: enabled }).eq('id', id);
    setFolders((prev) =>
      prev.map((f) => (f.id === id ? { ...f, reminderEnabled: enabled } : f))
    );
  };

  return { folders, addFolder, removeFolder, toggleReminder };
};

export default useFolders;
