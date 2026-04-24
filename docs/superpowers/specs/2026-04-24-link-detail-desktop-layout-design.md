# Link Detail Desktop Layout Design

## Goal

Rework the desktop link detail experience so it visually matches the provided Figma capture as closely as practical, while preserving the current data flow and existing left sidebar behavior.

This is a presentation-focused redesign of the detail page, not a feature expansion. The first iteration optimizes for desktop fidelity rather than responsive coverage.

## Scope

### In scope

- Restyle the desktop detail view to follow the Figma composition
- Keep the current left sidebar unchanged
- Recompose the detail page into:
  - top header
  - central main detail card
  - right insight sidebar
- Preserve existing behaviors for:
  - link fetch and loading states
  - AI summary fetch
  - memo editing and auto-save
  - link title/tag edit flow
  - insight creation and deletion

### Out of scope

- Mobile and tablet redesign
- New product behaviors or backend changes
- Refactoring unrelated app sections
- Changing left sidebar interaction or appearance

## Existing Context

- The current app already has a working archive shell, auth flows, link data hooks, and a dedicated link detail page.
- Recent commits show active work around icon cleanup, sidebar consistency, and folder/insight UI, so the redesign should fit that direction rather than replace it wholesale.
- The current detail page in [src/pages/LinkDetailPage.tsx](/Users/kimmijeong/link-archive/src/pages/LinkDetailPage.tsx) already owns the required page data and actions, which makes it the safest place to keep logic while reshaping markup.
- The current visual system lives mainly in [src/App.css](/Users/kimmijeong/link-archive/src/App.css), so the redesign should land there instead of introducing a parallel styling system for this first pass.

## Design Direction

The desktop detail view should feel like a composed workspace rather than a modal or utility screen. The layout should emphasize calm spacing, large rounded panels, soft blue-lilac surfaces, and clear separation between the main content canvas and supporting insight tools.

The visual hierarchy should follow this order:

1. Global top header
2. Main detail card in the center column
3. Insight support rail on the right

The left sidebar remains visually and structurally as-is.

## Layout Structure

### 1. Top header

- Full-width horizontal header above the detail content
- Left: archiv*o logo
- Right: action buttons aligned to the edge, matching the Figma density
- Height, padding, and button styling should be tightened to feel cleaner and flatter than the current implementation

### 2. Main content area

- The page body uses a multi-column desktop layout
- Left sidebar stays untouched
- Center column becomes the primary canvas with a large rounded white card
- Right column becomes a fixed-width insight rail
- Overall page background should be a very light neutral tone so the cards feel elevated without heavy shadows

### 3. Central main detail card

The central card should contain these sections in order:

- top cover or hero area with a soft blue wash
- back affordance and progress indicator near the top edge
- title block
- created date
- tag chips
- URL row
- content split section containing:
  - image preview area
  - memo area

The card should use large corner radius, restrained border treatment, and generous inner padding.

### 4. Right insight sidebar

The right rail should be vertically stacked and fixed in width on desktop.

It should contain:

- AI summary card
- my insight list card
- insight input area with save button

Each block should read as a separate surface using soft tinted backgrounds closer to the Figma capture than the current generic cards.

## Component Strategy

### Page ownership

[src/pages/LinkDetailPage.tsx](/Users/kimmijeong/link-archive/src/pages/LinkDetailPage.tsx) remains the stateful container for:

- fetching the selected link
- loading AI summary
- managing memo draft state
- managing edit mode state
- managing insight input and save actions

### Presentation structure

The page JSX should be reorganized into clearly named visual regions:

- top header region
- page body wrapper
- main detail card
- right insight rail

For the first pass, this can remain in one file if that keeps logic safer. Small presentational extraction is allowed only if it reduces markup complexity without moving business logic.

### Styling ownership

[src/App.css](/Users/kimmijeong/link-archive/src/App.css) should be the primary styling surface for this redesign, using dedicated detail-page class blocks. The redesign should prefer page-specific class naming over broad global overrides.

## Behavioral Rules

### Must preserve

- Existing data fetch lifecycle
- Existing memo auto-save behavior
- Existing insight save and remove flows
- Existing edit interactions for title and tags
- Existing empty and error states

### Must improve visually

- Clear desktop column proportions
- Larger, calmer spacing
- Card-based grouping closer to the Figma layout
- More deliberate button, chip, and input styling
- Better containment for long text and multiple insight items

## Edge Cases

- Long titles must wrap cleanly without collapsing adjacent controls
- Many tags must wrap within the title section
- Missing OG image should still preserve the main card structure
- Empty AI summary should render a stable placeholder state
- Long memo content should remain readable without breaking the layout
- Multiple insights should scroll or stack without pushing the whole page into an awkward proportion

## Implementation Plan Shape

The implementation should be executed in this order:

1. Reshape the detail page markup to match the approved desktop layout
2. Rebuild detail page CSS around page skeleton first, then interior card styling
3. Reconnect and verify existing interactions inside the new layout
4. Validate the screen against the Figma capture on desktop

## Testing And Verification

The redesign is successful when:

- The desktop page visually resembles the provided Figma capture in structure and spacing
- The left sidebar remains unchanged
- The main content card and right insight rail maintain stable proportions
- Editing title and tags still works
- Memo edits still persist
- Insight creation still works
- Loading and not-found states still render coherently

## Files Expected To Change

- [src/pages/LinkDetailPage.tsx](/Users/kimmijeong/link-archive/src/pages/LinkDetailPage.tsx)
- [src/App.css](/Users/kimmijeong/link-archive/src/App.css)

Optional only if needed:

- small presentational additions under `src/components/`

## Explicit Decisions

- Keep the left sidebar unchanged
- Target desktop fidelity first
- Favor layout restructuring plus CSS rework over a CSS-only patch
- Keep logic local to the current detail page unless a tiny extraction clearly improves readability
- Avoid unrelated refactors during this pass
