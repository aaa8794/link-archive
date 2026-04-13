import { useState, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { Insight } from '../types';

const toInsight = (row: any): Insight => ({
  id: row.id,
  linkId: row.link_id,
  content: row.content,
  imageUrl: row.image_url,
  isPinned: row.is_pinned ?? false,
  createdAt: row.created_at,
});

const useInsights = () => {
  const [insights, setInsights] = useState<Record<string, Insight[]>>({});

  const fetchInsights = useCallback(async (linkId: string) => {
    const { data } = await supabase
      .from('insights')
      .select('*')
      .eq('link_id', linkId)
      .order('is_pinned', { ascending: false })
      .order('created_at', { ascending: false });
    if (data) {
      setInsights((prev) => ({ ...prev, [linkId]: data.map(toInsight) }));
    }
  }, []);

  const addInsight = async (linkId: string, content: string, imageFile?: File) => {
    let imageUrl: string | undefined;

    if (imageFile) {
      const fileName = `${linkId}/${Date.now()}-${imageFile.name}`;
      const { data: uploadData } = await supabase.storage
        .from('insights')
        .upload(fileName, imageFile);
      if (uploadData) {
        const { data: urlData } = supabase.storage.from('insights').getPublicUrl(fileName);
        imageUrl = urlData.publicUrl;
      }
    }

    const { data } = await supabase
      .from('insights')
      .insert({ link_id: linkId, content, image_url: imageUrl || null, is_pinned: false })
      .select()
      .single();

    if (data) {
      setInsights((prev) => ({
        ...prev,
        [linkId]: [toInsight(data), ...(prev[linkId] || [])],
      }));
    }
  };

  const togglePin = async (linkId: string, insightId: string, isPinned: boolean) => {
    await supabase.from('insights').update({ is_pinned: isPinned }).eq('id', insightId);
    setInsights((prev) => ({
      ...prev,
      [linkId]: (prev[linkId] || []).map((i) =>
        i.id === insightId ? { ...i, isPinned } : i
      ).sort((a, b) => Number(b.isPinned) - Number(a.isPinned)),
    }));
  };

  const removeInsight = async (linkId: string, insightId: string) => {
    await supabase.from('insights').delete().eq('id', insightId);
    setInsights((prev) => ({
      ...prev,
      [linkId]: (prev[linkId] || []).filter((i) => i.id !== insightId),
    }));
  };

  return { insights, fetchInsights, addInsight, togglePin, removeInsight };
};

export default useInsights;
