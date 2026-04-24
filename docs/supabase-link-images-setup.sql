-- Link images feature setup
-- Run in Supabase SQL Editor

-- 1. Add ordered image array to links
alter table public.links
add column if not exists images text[] not null default '{}';

-- 2. Create public storage bucket for uploaded link images
insert into storage.buckets (id, name, public)
values ('link-images', 'link-images', true)
on conflict (id) do nothing;

-- 3. Allow authenticated users to upload images
create policy "authenticated users can upload link images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'link-images'
);

-- 4. Allow public reads for rendered image URLs
create policy "public can read link images"
on storage.objects
for select
to public
using (
  bucket_id = 'link-images'
);

-- 5. Allow authenticated users to update uploaded images
create policy "authenticated users can update link images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'link-images'
)
with check (
  bucket_id = 'link-images'
);

-- 6. Allow authenticated users to delete uploaded images
create policy "authenticated users can delete link images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'link-images'
);
