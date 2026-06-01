---
name: Systemic Clarity
colors:
  surface: '#f7f9ff'
  surface-dim: '#d7dae0'
  surface-bright: '#f7f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f4fa'
  surface-container: '#ebeef4'
  surface-container-high: '#e5e8ee'
  surface-container-highest: '#dfe3e8'
  on-surface: '#181c20'
  on-surface-variant: '#424753'
  inverse-surface: '#2d3135'
  inverse-on-surface: '#eef1f7'
  outline: '#727785'
  outline-variant: '#c2c6d5'
  surface-tint: '#005ac1'
  primary: '#0058bd'
  on-primary: '#ffffff'
  primary-container: '#2771df'
  on-primary-container: '#fefcff'
  inverse-primary: '#adc6ff'
  secondary: '#006e2c'
  on-secondary: '#ffffff'
  secondary-container: '#86f898'
  on-secondary-container: '#00722f'
  tertiary: '#b51b15'
  on-tertiary: '#ffffff'
  tertiary-container: '#d9372b'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d8e2ff'
  primary-fixed-dim: '#adc6ff'
  on-primary-fixed: '#001a41'
  on-primary-fixed-variant: '#004494'
  secondary-fixed: '#89fa9b'
  secondary-fixed-dim: '#6ddd81'
  on-secondary-fixed: '#002108'
  on-secondary-fixed-variant: '#005320'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4a9'
  on-tertiary-fixed: '#410001'
  on-tertiary-fixed-variant: '#930004'
  background: '#f7f9ff'
  on-background: '#181c20'
  surface-variant: '#dfe3e8'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 57px
    fontWeight: '400'
    lineHeight: 64px
    letterSpacing: -0.25px
  headline-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '400'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 36px
  headline-md:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '400'
    lineHeight: 36px
  headline-sm:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '400'
    lineHeight: 32px
  title-lg:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '500'
    lineHeight: 28px
  body-lg:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
    letterSpacing: 0.5px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
    letterSpacing: 0.25px
  label-lg:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '500'
    lineHeight: 20px
    letterSpacing: 0.1px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.5px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  xxl: 48px
  container-max: 1280px
  gutter: 24px
  margin-mobile: 16px
  margin-desktop: 24px
---

## Brand & Style

The design system is rooted in the principles of modern utility and approachable professionalism. It draws heavy inspiration from the Material Design philosophy, prioritizing hierarchy, intentional color application, and a clear mental model for the user.

The style is **Corporate / Modern** with a lean toward **Minimalism**. It utilizes generous whitespace to reduce cognitive load and relies on a card-based architecture to group related information. The emotional response is one of reliability, efficiency, and transparency. Every transition and layout choice is designed to feel purposeful and systematic, ensuring the interface remains unobtrusive while guiding the user toward their goals.

## Colors

The color palette utilizes the iconic primary spectrum to signify specific actions and states. **Google Blue** serves as the primary brand color for navigation and primary actions. **Google Green** is reserved for success states and secondary affirmations, while **Google Red** and **Yellow** are used strictly for error and warning messaging respectively.

The neutral palette is built on "Google Greys," ranging from deep charcoal for text (#202124) to soft platinum for borders and background surfaces (#F8F9FA). This ensures a high-contrast, accessible reading environment on a clean white base.

## Typography

This design system uses **Inter** across all levels to achieve a clean, neutral, and highly legible interface. The typographic scale follows a strict rhythmic progression.

- **Headlines:** Set with ample line height and subtle tracking adjustments to maintain readability at large scales.
- **Body Text:** Optimized for long-form reading with a focus on line length and vertical rhythm. 
- **Labels:** Used for buttons, chips, and small UI hints, utilizing a slightly heavier weight (Medium 500) to distinguish them from standard body copy.

Always ensure that text color maintains at least a 4.5:1 contrast ratio against background surfaces, following WCAG AA standards.

## Layout & Spacing

The layout is built on a **12-column fluid grid** for desktop and a **4-column grid** for mobile. A consistent 8px baseline grid governs all spatial relationships.

- **Margins & Gutters:** Desktop layouts use 24px margins and gutters. Mobile layouts compress to 16px margins to maximize screen real estate.
- **Vertical Rhythm:** Components are spaced in multiples of 8px (8, 16, 24, 32, 48) to create a predictable and harmonious flow.
- **Alignment:** All content is left-aligned by default to support natural scanning patterns.

## Elevation & Depth

Hierarchy is communicated through **Tonal Layers** and **Ambient Shadows**. This design system avoids harsh, heavy shadows in favor of soft, diffused blurs that mimic real-world lighting.

- **Level 0 (Flat):** The default background state.
- **Level 1 (Surface):** Used for cards and secondary navigation elements. Features a subtle 1px border (#E0E0E0) or a very soft shadow (4px blur, 10% opacity).
- **Level 2 (Raised):** Used for hovered buttons and cards. The shadow becomes more pronounced (8px blur) to indicate interactivity.
- **Level 3 (Overlay):** Used for menus, dialogs, and floating action buttons. These use the most significant shadows to appear high above the rest of the UI.

## Shapes

The shape language is primarily **Rounded**, using an 8px (0.5rem) base radius for standard containers and cards. This provides a soft, modern feel without appearing overly juvenile.

**Specific Overrides:**
- **Pill-shaped:** Search bars, Chips, and "Floating Action Buttons" (FABs) use full rounding (e.g., `rounded-full` or 9999px) to emphasize their distinct functional roles.
- **Input Fields:** Use the standard 8px radius for a consistent, professional look across forms.

## Components

### Buttons
- **Primary:** Filled with Google Blue, white text, pill-shaped or 8px rounded corners depending on context.
- **Secondary:** Outlined with a 1px border (#DADCE0) and blue text.
- **Tertiary/Ghost:** No background or border, used for low-emphasis actions.

### Cards
Cards are the primary container for content. They should have a white background, an 8px corner radius, and a Level 1 elevation (soft shadow or subtle border). Internal padding should be a minimum of 16px (md).

### Input Fields
Standard inputs use a light grey background (#F1F3F4) with a bottom-border highlight in Google Blue when focused. Labels should float or remain clearly visible above the field.

### Chips
Used for filtering or tags, chips are always pill-shaped with a light grey background (#E8EAED) and body-small typography.

### Search Bars
To align with the brand aesthetic, global search bars are always pill-shaped, featuring a subtle shadow and a leading "Magnifying Glass" icon.