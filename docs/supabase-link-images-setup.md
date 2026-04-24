# Supabase Link Images Setup

링크에 여러 이미지를 붙이는 기능을 쓰려면 아래 두 가지가 필요합니다.

## 1. `links.images` 컬럼 추가

```sql
alter table public.links
add column if not exists images text[] not null default '{}';
```

기존 레코드에도 빈 배열 기본값이 들어가도록 유지합니다.

## 2. `link-images` Storage bucket 생성

```sql
insert into storage.buckets (id, name, public)
values ('link-images', 'link-images', true)
on conflict (id) do nothing;
```

이 구현은 `getPublicUrl()`을 쓰므로, 첫 버전은 public bucket 기준입니다.

## 3. Storage 정책 추가

로그인한 사용자가 자신의 파일을 업로드/조회/삭제할 수 있게 최소 정책을 둡니다.

```sql
create policy "authenticated users can upload link images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'link-images'
);
```

```sql
create policy "public can read link images"
on storage.objects
for select
to public
using (
  bucket_id = 'link-images'
);
```

```sql
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
```

```sql
create policy "authenticated users can delete link images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'link-images'
);
```

## 권장 추가 점검

- `links` 테이블 RLS가 켜져 있다면, 현재 앱의 기존 insert/select 정책이 `images` 컬럼 추가 후에도 그대로 동작하는지 확인
- Storage 파일 경로는 현재 `userId/timestamp-filename` 패턴을 사용
- 업로드 파일 크기 제한은 프론트에서 `10MB`로 막고 있음

## 런타임 기대 동작

- 이미지 없이 링크 저장 가능
- 로그인 사용자는 로컬 이미지 업로드 가능
- 이미지 URL 추가는 로그인 없이도 가능
- 상세 페이지는 `images[]`가 있으면 캐러셀 표시, 없으면 placeholder 유지
