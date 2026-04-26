const IMAGE_EXTENSION_RE = /\.(png|jpe?g|gif|webp|avif|svg)(\?.*)?$/i;
const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024;

export const normalizeImageUrlInput = (raw: string) => {
  const trimmed = raw.trim();
  if (!trimmed) return '';
  return /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
};

export const isLikelyImageUrl = (value: string) => IMAGE_EXTENSION_RE.test(value);

export const validateLinkImageFile = (file: File) => {
  if (!file.type.startsWith('image/')) {
    throw new Error('이미지 파일만 업로드할 수 있어요.');
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error('이미지는 10MB 이하만 업로드할 수 있어요.');
  }
};

export const uploadLinkImageFile = async (userId: string, file: File) => {
  validateLinkImageFile(file);
  const { supabase } = await import('./supabase');

  const safeName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
  const path = `${userId}/${safeName}`;

  const { error } = await supabase.storage.from('link-images').upload(path, file, {
    cacheControl: '3600',
    upsert: false,
  });

  if (error) throw error;

  const { data } = supabase.storage.from('link-images').getPublicUrl(path);
  return data.publicUrl;
};
