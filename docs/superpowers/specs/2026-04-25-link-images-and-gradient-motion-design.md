# Link Images And Gradient Motion Design

## Goal

Add optional multi-image support to link creation, display those images in the detail page as a carousel, and introduce a soft animated pastel gradient field in the detail-page top color area that responds to insight progress.

This is a scoped feature addition. It extends link creation and link detail presentation without changing the app's left sidebar behavior or introducing full media-management tooling.

## Scope

### In scope

- Support optional image attachment when creating a link
- Support both:
  - local file upload
  - direct image URL input
- Allow any number of attached images
- Preserve image order as the user adds them
- Store uploaded local files in Supabase Storage
- Store attached image URLs on the link record
- Show attached images in the detail page image area as a carousel
- Show indicator dots based on the number of attached images
- Keep the current placeholder state when there are no attached images
- Add a pastel animated gradient field to the large top color area on the detail page
- Make the gradient field respond to insight-progress stages
- Make the field always subtly alive, with stronger visible motion when an insight is saved

### Out of scope

- Drag-and-drop image reordering
- Mobile-specific carousel gestures
- Autoplay carousel behavior
- Full gallery view or lightbox
- Per-file custom color personalities in this first pass
- Using the top color field as an image preview area

## Existing Context

- `src/components/AddLinkForm.tsx` currently supports URL, title, memo-style description, and folder selection, but only a single OG image.
- `src/hooks/useLinks.ts` currently inserts a single `og_image` and has no concept of user-attached image arrays.
- `src/types/index.ts` defines `Link` with `ogImage` but no user image collection.
- `src/pages/LinkDetailPage.tsx` already has an image panel and indicator-friendly layout space, which makes it the right place to host the new carousel.
- The top detail-page color area is already visually separate from the image panel, and the user explicitly wants to keep it independent from image preview.

## Product Decisions

### Image input model

- Image attachment is optional
- Users can add images by:
  - selecting local files
  - adding image URLs
- Multiple images are allowed
- Images are stored in the order added
- Reordering is deferred to a later iteration

### Storage model

- Local files are uploaded to Supabase Storage
- The link record stores final image URLs in an ordered array field
- OG metadata remains separate from user-attached images

### Detail page image presentation

- The detail page image box shows a carousel
- Navigation is:
  - left/right controls
  - dot indicator clicks
- No autoplay
- No swipe or drag behavior in the first iteration
- If no user-attached images exist, keep the placeholder treatment

### Gradient motion model

- The top large color area is not an image preview
- It is a standalone animated gradient field
- The field uses soft pastel tones only
- The field is always subtly animated
- When insight progress changes, the field becomes more visibly active for a short interval
- The first iteration uses stage-based palettes, not per-file custom palettes

## Data Design

### Link shape

Extend the link model to separate metadata imagery from user imagery:

- `ogImage`
  - link metadata image used for OG preview behavior
- `images: string[]`
  - ordered list of user-attached image URLs

This separation keeps the product model clear:

- OG image = fetched metadata preview
- `images[]` = user-curated visual references

### Persistence

The link database record should support a new ordered image-array field. The app should read and write it consistently through the existing link hooks and detail-page loader path.

Local upload flow:

1. user selects files
2. app uploads each file to Supabase Storage
3. app receives final accessible URLs
4. app appends those URLs to the current draft image list
5. link save persists the ordered image list

URL input flow:

1. user pastes an image URL
2. app validates it as an image-like target
3. app appends it to the current draft image list
4. link save persists the ordered image list

## UI Design

### 1. Link creation modal

`AddLinkForm` gains a dedicated image section.

The section should support:

- file picker for one or more local files
- single image URL input with add action
- preview list of currently attached images
- removal for each attached image
- clear visual distinction between OG preview and user-added images

The preview treatment should stay lightweight. This is not a full editor; it is a simple attachment flow.

### 2. Detail-page image area

The current image box becomes a carousel surface.

Display rules:

- one image visible at a time
- left/right controls if more than one image exists
- dot indicator count matches image count
- current active dot reflects current slide
- clicking a dot jumps to that image

If `images[]` is empty:

- keep the placeholder
- do not show inactive carousel controls

### 3. Top gradient field

The large top color area becomes an animated gradient field made of softly moving pastel color layers.

It should feel:

- calm
- airy
- layered
- readable behind nearby UI

The motion should not feel like a flashy aurora or a loading screen. It should read as a living visual atmosphere.

## Stage Palette Rules

The first iteration uses stage-based palette sets tied to insight progress:

- Stage 0: airy white + pale blue
- Stage 1: pale blue + lavender
- Stage 2: pale blue + pink
- Stage 3+: pale blue + pink + soft yellow

These are not hard visual specs for exact hexes yet, but the implementation must keep the tones pastel, low-contrast, and harmonious.

## Motion Design

### Base behavior

- The gradient field is always gently animated
- Motion remains subtle at rest
- Animation speed is slow and calming

### Trigger behavior

When the user saves an insight and the progress state updates:

- the gradient field briefly becomes more pronounced
- the active palette transitions toward the next stage
- the field should feel like colors are softly blending and drifting together

### Recommended implementation style

Use an animated gradient field composed from multiple layered soft gradients, such as radial gradients or similar blurred color masses, moving slowly through transform, opacity, or position changes.

This should create a “blending field” effect rather than a hard palette swap.

## Architecture

### Files expected to change

- `src/components/AddLinkForm.tsx`
- `src/hooks/useLinks.ts`
- `src/types/index.ts`
- `src/pages/LinkDetailPage.tsx`
- `src/App.css`

Likely addition:

- a small helper under `src/lib/` or `src/utils/` for Supabase Storage uploads

### Responsibility boundaries

- `AddLinkForm`
  - image input UI
  - local draft list of attached images
  - upload and URL-add interaction flow
- `useLinks`
  - persistence of the ordered image list with link creation
- `LinkDetailPage`
  - carousel state
  - indicator behavior
  - insight-stage-to-gradient-state connection
- CSS
  - attachment previews
  - carousel presentation
  - gradient field visuals and animation rules

## Error Handling And Constraints

- Link creation must still work with zero attached images
- Failed uploads must not silently disappear
- Invalid image URLs should be blocked before save
- Large files should be rejected before upload if size limits are exceeded
- Partial upload failure should clearly surface which images failed
- No image failure should corrupt the rest of the link form
- The gradient field must not reduce title or nearby control readability

## Verification Criteria

The feature is successful when:

- users can create links without images
- users can add local files and image URLs in the same draft flow
- attached images persist in add order
- the detail page renders attached images as a carousel
- indicator dots match the number of attached images
- the placeholder remains when no attached images exist
- insight save keeps working
- the top color field animates subtly at rest
- the top color field responds more visibly when insight progress changes
- the visuals remain pastel and calm rather than loud or high-contrast

## Explicit Decisions

- Use both local upload and image URL input
- Preserve add order exactly
- Store local files in Supabase Storage
- Use carousel presentation, not gallery presentation
- Use click/arrow navigation plus dot indicators
- Keep top color field independent from image preview
- Use animated gradient-field motion, not simple palette swap
- Keep the first iteration stage-based; per-file color personalities come later
