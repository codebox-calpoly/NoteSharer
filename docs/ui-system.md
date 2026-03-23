# UI System

## Purpose
- Single source of truth for Poly Pages UI decisions.
- Applies to all user-facing web surfaces.
- Route CSS must consume the shared semantic tokens in `frontend/app/globals.css` instead of inventing page-specific palettes.

## Design Direction
- Tone:
  - academic but approachable
  - warm, quiet, and deliberate rather than glossy or neon
- Visual language:
  - soft paper-like page backgrounds
  - elevated cards with modest depth
  - sage as the main product accent
  - warm apricot reserved for primary calls to action and highlights

## Light Mode
- Page background:
  - warm off-white `#faf7f2`
- Base surface:
  - white / soft ivory panels
- Elevated surface:
  - brighter white with subtle shadow and soft border
- Primary text:
  - charcoal
- Secondary text:
  - slate-gray
- Accent:
  - sage green
- Primary action:
  - warm apricot
- Border:
  - soft neutral border, never stark gray-black
- Positive:
  - muted green
- Negative:
  - muted brick red

## Dark Mode
- Page background:
  - deep charcoal, not pure black
- Base surface:
  - layered charcoal panels
- Elevated surface:
  - slightly lighter charcoal with low-contrast borders
- Primary text:
  - warm near-white
- Secondary text:
  - cool light gray
- Accent:
  - slightly brighter sage than light mode
- Primary action:
  - apricot stays warm and readable, with dark text on top
- Border:
  - translucent light border, low contrast
- Positive:
  - brighter sage-green
- Negative:
  - softened coral red

## Semantic Tokens
- Page:
  - `--poly-page-bg`
  - `--poly-page-bg-accent`
- Surfaces:
  - `--poly-surface`
  - `--poly-surface-raised`
  - `--poly-surface-strong`
  - `--poly-surface-muted`
  - `--poly-surface-overlay`
- Text:
  - `--poly-text-primary`
  - `--poly-text-secondary`
  - `--poly-text-tertiary`
- Borders:
  - `--poly-border`
  - `--poly-border-strong`
  - `--poly-border-subtle`
- Status:
  - `--poly-success`
  - `--poly-success-soft`
  - `--poly-danger`
  - `--poly-danger-soft`
  - `--poly-warning`
  - `--poly-warning-soft`
- Effects:
  - `--poly-shadow-soft`
  - `--poly-shadow-strong`
  - `--poly-focus-ring`

## Spacing And Shape
- Base spacing unit: `8px`
- Standard gaps:
  - compact `8px`
  - regular `16px`
  - section `24px`
  - large section `32px`
- Radius:
  - controls `10px` to `14px`
  - cards `14px` to `18px`
  - pills fully rounded

## Typography
- App body:
  - Geist / Inter stack already configured in the app
- Headings:
  - compact line-height
  - strong weight
  - mild negative tracking only on hero or card titles
- Supporting text:
  - use `--poly-text-secondary`
  - avoid long paragraphs in cards or modal metadata

## Component Rules
- App shell:
  - shared navigation persists across authenticated pages
  - credits are visible in shell
  - free-download count is hidden when zero
  - profile affordances use initials only
- Buttons:
  - primary buttons use the apricot action treatment
  - secondary buttons use surface + border treatment
  - destructive buttons use danger tokens, not custom reds
- Inputs:
  - visible labels required
  - placeholders are assistive only
  - focus always uses the shared focus ring
- Cards:
  - use shared surface and border tokens
  - mixed-content grids normalize heights
  - long titles clamp instead of stretching layouts
- Modals:
  - overlays use the shared overlay token
  - modal panels use raised surfaces, not page backgrounds
  - mobile width must fit without horizontal scrolling
- Scores:
  - passive displays show net score only
  - positive uses success tokens
  - negative uses danger tokens
  - zero uses tertiary text

## Copy Conventions
- Use `bookmark`, never `favorite`, in user-facing copy.
- Use `owned`, never `downloaded`, for note ownership filters.
- Use `Download: X credits`, not negative-credit shorthand.
- Use `course`, not internal IDs or database wording.
- Use `resource type` or the concrete type label, not enum phrasing.
- Use `Start` for first-time onboarding completion.
- Auth copy must explain the shared sign-in / registration flow clearly.

## Mobile Rules
- Target real support at `320px+`.
- Prevent horizontal overflow on all routes.
- Stack multi-column layouts vertically on phones.
- Keep touch targets at comfortable thumb sizes.
- Modal, preview, and PDF surfaces must scale to the viewport.
