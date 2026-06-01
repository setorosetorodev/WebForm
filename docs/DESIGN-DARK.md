---
name: Systemic Clarity Dark
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#c2c6d2'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#8c919c'
  outline-variant: '#424751'
  surface-tint: '#a9c7ff'
  primary: '#a9c7ff'
  on-primary: '#003063'
  primary-container: '#7baaf7'
  on-primary-container: '#003d7b'
  inverse-primary: '#295ea6'
  secondary: '#c1c7cd'
  on-secondary: '#2b3136'
  secondary-container: '#41474d'
  on-secondary-container: '#b0b6bc'
  tertiary: '#a8c8ff'
  on-tertiary: '#003061'
  tertiary-container: '#80aaed'
  on-tertiary-container: '#003d79'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#a9c7ff'
  on-primary-fixed: '#001b3d'
  on-primary-fixed-variant: '#00468b'
  secondary-fixed: '#dde3e9'
  secondary-fixed-dim: '#c1c7cd'
  on-secondary-fixed: '#161c21'
  on-secondary-fixed-variant: '#41474d'
  tertiary-fixed: '#d5e3ff'
  tertiary-fixed-dim: '#a8c8ff'
  on-tertiary-fixed: '#001b3c'
  on-tertiary-fixed-variant: '#114784'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-lg:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  gutter: 16px
  margin-mobile: 16px
  margin-desktop: 24px
  max-width: 1440px
---

## Brand & Style
The design system embodies a "Systemic Clarity" ethos, now optimized for low-light environments. The brand personality is professional, focused, and utilitarian, prioritizing information density and eye comfort. 

The aesthetic is **Corporate / Modern** with a technical edge. It utilizes a layered dark-mode approach to create a logical hierarchy through luminance rather than shadow. By shifting from a light to a dark mode orientation, the UI moves from a "canvas" feel to a "command center" feel—reducing visual fatigue for long-session users in SaaS, finance, or enterprise settings.

## Colors
This design system utilizes a "Deep Charcoal" foundation. The primary palette centers on a desaturated version of signature blue, ensuring high legibility and AAA contrast ratios against dark backgrounds without causing "vibration" or eye strain.

Surface colors follow a linear elevation model:
- **Base (#121212):** The lowest layer, used for global backgrounds.
- **Surface (#1E1E1E):** Used for cards, sidebars, and main navigation containers.
- **Surface-Container (#2D2D2D):** Used for nested elements, inputs, and hovered states.

Accent colors are pulled from a muted spectrum to maintain a professional, systematic appearance.

## Typography
The system uses **Inter** exclusively to leverage its neutral, systematic, and highly legible qualities. In dark mode, font weights are slightly adjusted to compensate for the "ink bleed" effect (light text on dark backgrounds often appears thicker). 

Headlines use a tighter letter-spacing to feel more cohesive, while labels use expanded tracking for better scannability at small sizes. All text colors should default to `on-surface` (high contrast) or `on-surface-variant` (medium contrast) to ensure accessibility.

## Layout & Spacing
The layout follows a strict 8px grid system. 

- **Grid Model:** 12-column fluid grid for desktop with 24px gutters.
- **Breakpoints:** Mobile (0-599px), Tablet (600-1023px), Desktop (1024px+).
- **Behavior:** Content should be contained within a max-width of 1440px, centering on ultra-wide screens. Side margins are 16px on mobile and 24px on desktop. 

Vertical rhythm is maintained by using multiples of 8px for all padding and margins between components.

## Elevation & Depth
In this dark mode system, depth is communicated through **Tonal Layers** rather than heavy shadows. As an element rises in the Z-axis, its surface becomes lighter:

1.  **Level 0 (Background):** #121212.
2.  **Level 1 (Cards/Sheet):** #1E1E1E.
3.  **Level 2 (Dialogs/Popovers):** #2D2D2D.

Shadows are used sparingly and should be pure black (#000000) with a higher opacity (around 40-50%) compared to light mode, to remain visible against the dark background. Subtle, low-opacity 1px borders (`outline` color) are preferred over shadows to define component boundaries.

## Shapes
The system utilizes a **Rounded** shape language (8px / 0.5rem base) to soften the technical nature of the UI.

- **Standard (rounded):** 8px (0.5rem) - used for buttons, inputs, and small cards.
- **Large (rounded-lg):** 16px (1rem) - used for main content containers and modals.
- **Extra Large (rounded-xl):** 24px (1.5rem) - used for large featured sections or onboarding cards.

This consistent radius ensures the system feels modern and approachable while maintaining a structured grid.

## Components
- **Buttons:** Primary buttons use the desaturated blue (`primary_color_hex`) with dark text (`on-primary`). Ghost buttons use the `outline` border with `primary` text.
- **Input Fields:** Backgrounds should be `surface-container` to differentiate from the `surface` card. Borders use `outline`, shifting to `primary` on focus.
- **Chips:** Small, low-profile elements with `surface-container` backgrounds and `on-surface-variant` text.
- **Lists:** Use subtle 1px dividers in the `outline` color. Hover states should use a slight luminance increase.
- **Cards:** No shadows by default; use `surface` background and 1px `outline` border.
- **Checkboxes & Radios:** Should use the `primary` color for the "selected" state, with high-contrast checkmarks.