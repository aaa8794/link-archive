import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Folder } from '../types';

const toFolder = (row: any): Folder => ({
  id: row.id,
  name: row.name,
  reminderEnabled: row.reminder_enabled,
  userEmail: row.user_email,
  createdAt: row.created_at,
});

const useFolders = (userEmail: string) => {
  const [folders, setFolders] = useState<Folder[]>([]);

  const fetchFolders = useCallback(async () => {
    if (!userEmail) return;
    const { data } = await supabase
      .from('folders')
      .select('*')
      .eq('user_email', userEmail)
      .order('created_at', { ascending: true });
    if (data) setFolders(data.map(toFolder));
  }, [userEmail]);

  useEffect(() => {
    fetchFolders();
  }, [fetchFolders]);

  const addFolder = async (name: string) => {
    const { data } = await supabase
      .from('folders')
      .insert({ name, user_email: userEmail, reminder_enabled: true })
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
