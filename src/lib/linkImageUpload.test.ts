import { isLikelyImageUrl, normalizeImageUrlInput } from './linkImageUpload';

test('normalizeImageUrlInput adds https protocol when missing', () => {
  expect(normalizeImageUrlInput('example.com/cat.png')).toBe('https://example.com/cat.png');
});

test('isLikelyImageUrl accepts common image extensions', () => {
  expect(isLikelyImageUrl('https://cdn.site.com/photo.webp')).toBe(true);
});

test('isLikelyImageUrl rejects obvious non-image urls', () => {
  expect(isLikelyImageUrl('https://example.com/article')).toBe(false);
});
