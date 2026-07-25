---
# REX Bunny Services — Design System (DESIGN.md)
design_system: "REX Bunny Services Bold Brand"
version: "2.0.0"
style: "Bold Brand — REX Bunny vibrant, mascot-driven"
stack: "Astro 5 + Tailwind CSS 3.4 + Preact"

# ─── BRAND IDENTITY ─────────────────────────────────────────────
brand:
  name: "RexBunny Services"
  mascot: "None — minimal text-based wordmark"
  tagline: "Visible in Every Search"
  voice: "Confident, bold, professional, expert"

# ─── COLOR TOKENS ──────────────────────────────────────────────
colors:
  brand:
    50:  "#fff7ed"   # Lightest orange tint — backgrounds, highlights
    100: "#ffedd5"   # Light orange — hover backgrounds, tags
    200: "#fed7aa"   # Soft orange — borders on accent elements
    300: "#fdba74"   # Medium light — icon fills, chart elements
    400: "#fb923c"   # Vibrant orange — gradients, active states
    500: "#f97316"   # Primary brand — main CTA, links, accents
    600: "#ea580c"   # Hover state for brand-500 elements
    700: "#c2410c"   # Pressed/active state
    800: "#9a3412"   # Dark accent — text on light backgrounds
    900: "#7c2d12"   # Darkest accent
    950: "#431407"   # Near-black orange

  rex:
    orange: "#ff6b00"   # Signature REX orange — CTAs, gradients
    gold:   "#ff8c00"   # Gold accent — stars, highlights
    dark:   "#1a1a2e"   # REX dark — brand backgrounds, logo
    violet: "#7c3aed"   # GEO service color — secondary brand accent
    teal:   "#059669"   # AEO service color
    blue:   "#2563eb"   # Web Dev service color
    pink:   "#d946ef"   # AI Visual service color

  dark:
    50:  "#ffffff"
    100: "#f9fafb"
    200: "#e5e7eb"
    300: "#d1d5db"
    400: "#9ca3af"
    500: "#6b7280"
    600: "#4b5563"
    700: "#374151"
    800: "#1f2937"
    900: "#111827"
    950: "#030712"

  semantic:
    success: "#22c55e"
    warning: "#eab308"
    error:   "#ef4444"
    info:    "#3b82f6"

# ─── TYPOGRAPHY TOKENS ────────────────────────────────────────
typography:
  fonts:
    sans: "Inter, system-ui, -apple-system, sans-serif"
    display: "Plus Jakarta Sans, Inter, system-ui, sans-serif"
    mono: "JetBrains Mono, ui-monospace, monospace"

  weights:
    light:    300
    regular:  400
    medium:   500
    semibold: 600
    bold:     700
    extrabold: 800
    black:    900

  scale:
    xs:   "0.75rem / 1rem"
    sm:   "0.875rem / 1.25rem"
    base: "1rem / 1.5rem"
    lg:   "1.125rem / 1.75rem"
    xl:   "1.25rem / 1.75rem"
    "2xl": "1.5rem / 2rem"
    "3xl": "1.875rem / 2.25rem"
    "4xl": "2.25rem / 2.5rem"
    "5xl": "3rem / 1"
    "6xl": "3.75rem / 1"
    "7xl": "4.5rem / 1"

  heading_patterns:
    page_title:   "font-display text-4xl sm:text-5xl font-extrabold text-rex-dark tracking-tight"
    section:      "font-display text-4xl font-extrabold text-rex-dark tracking-tight"
    card_title:   "font-display text-lg font-bold text-rex-dark"
    subtitle:     "text-lg text-gray-600"
    caption:      "text-sm text-gray-500"
    overline:     "text-xs font-bold uppercase tracking-[2px] text-brand-500"

# ─── SPACING TOKENS ───────────────────────────────────────────
spacing:
  section:
    vertical: "py-16 sm:py-20 lg:py-24"
    horizontal: "px-4 sm:px-6 lg:px-8"
  container: "max-w-7xl mx-auto"
  card: "p-6 sm:p-8"
  gap:
    tight:  "gap-4"
    normal: "gap-5"
    loose:  "gap-6"

# ─── RADIUS TOKENS ────────────────────────────────────────────
radius:
  none: "rounded-none"
  sm:   "rounded-lg"
  md:   "rounded-xl"
  lg:   "rounded-2xl"
  full: "rounded-full"

# ─── SHADOW TOKENS ────────────────────────────────────────────
shadows:
  none: ""
  sm:   "shadow-sm"
  md:   "shadow-md hover:shadow-xl hover:-translate-y-1"
  lg:   "shadow-lg shadow-brand-500/10"
  xl:   "shadow-xl shadow-brand-500/20"
  glow: "shadow-lg shadow-brand-500/25"
  cta:  "shadow-2xl shadow-brand-500/30 hover:shadow-[0_0_40px_rgba(249,115,22,0.4)]"

# ─── ANIMATION TOKENS ─────────────────────────────────────────
animation:
  transitions:
    fast:   "transition-all duration-150"
    normal: "transition-all duration-200"
    slow:   "transition-all duration-300"
    spring: "transition-all duration-300 ease-out"
  hover:
    card:     "hover:shadow-xl hover:-translate-y-1 hover:border-gray-300"
    button:   "hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5"
    link:     "hover:text-brand-600"
    subtle:   "hover:bg-gray-50"
  focus:      "focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"

# ─── COMPONENT TOKENS ─────────────────────────────────────────
components:
  button:
    primary: "rounded-xl bg-gradient-to-r from-brand-500 to-rex-orange px-8 py-4 text-base font-semibold text-white shadow-xl shadow-brand-500/30 transition-all hover:shadow-2xl hover:shadow-brand-500/40 hover:-translate-y-0.5"
    primary_sm: "rounded-lg bg-gradient-to-r from-brand-500 to-rex-orange px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5"
    secondary: "rounded-lg border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 hover:border-gray-400"
    ghost: "text-sm font-semibold text-brand-600 hover:text-brand-700 transition-colors"

  nav:
    wrapper: "fixed top-0 z-50 w-full border-b border-brand-200/50 bg-white/90 backdrop-blur-md"
    link: "text-sm font-medium text-gray-600 transition-colors hover:text-brand-600"
    cta: "rounded-lg bg-gradient-to-r from-brand-500 to-rex-orange px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-brand-500/20 transition-all hover:shadow-xl hover:shadow-brand-500/30 hover:-translate-y-0.5"

  badge:
    brand: "inline-flex items-center rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-sm font-medium text-brand-700"
    default: "inline-flex items-center rounded-full bg-brand-100 px-3 py-1 text-xs font-medium text-brand-700"
    success: "inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700"
    warning: "inline-flex items-center rounded-full bg-yellow-100 px-3 py-1 text-xs font-medium text-yellow-700"
    error: "inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-medium text-red-700"
    tag: "rounded-lg bg-brand-50 px-2.5 py-1 text-xs font-medium text-brand-600"

  card:
    default: "rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
    interactive: "rounded-2xl border border-gray-200 bg-white p-6 transition-all duration-300 hover:shadow-xl hover:border-brand-300 hover:-translate-y-1"
    feature: "rounded-2xl border border-gray-200 bg-white p-8 transition-all duration-300 hover:shadow-xl"
    metric: "rounded-xl border border-gray-200 bg-white p-6 text-center"
    stat: "rounded-xl bg-gray-50 border border-gray-200 p-6"

  input:
    text: "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
    textarea: "w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm text-gray-900 placeholder-gray-400 transition-colors focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-y"

# ─── BACKGROUND TOKENS ─────────────────────────────────────────
backgrounds:
  hero: "bg-gradient-to-br from-brand-50 via-white to-brand-50/50 + bg-brand-glow"
  section_light: "bg-gradient-to-b from-gray-50 to-white"
  section_dark: "bg-gradient-to-br from-brand-900 via-rex-dark to-brand-950"
  brand_glow: "bg-brand-glow"
  metrics_bar: "bg-gradient-to-r from-brand-50 via-white to-brand-50 border-y border-brand-200/50"

# ─── LAYOUT PATTERNS ──────────────────────────────────────────
layouts:
  page:
    structure: "BaseLayout.astro → Navigation + <main> + Footer"
    body: "bg-white text-gray-900 antialiased"

  section_alternation: "white → gray-50/white gradient → white (alternating)"

  hero:
    container: "mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-24 pb-16 sm:pt-32 sm:pb-24"
    
  grid:
    cards_2: "grid grid-cols-1 gap-6 sm:grid-cols-2"
    cards_3: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
    cards_4: "grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
    cards_5: "grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5"

  footer_grid: "grid grid-cols-2 gap-8 sm:grid-cols-4"

# ─── DESIGN PRINCIPLES ────────────────────────────────────────
principles:
  - "Brand-first — every element should feel like RexBunny, not a template"
  - "Bold & vibrant — rich gradients, strong typography, confident colors"
  - "Clean & bold — rich gradients, strong typography, confident colors"
  - "Generous whitespace — let content breathe (py-16 to py-24 sections)"
  - "Subtle elevation — shadows appear on interaction, not rest"
  - "Consistent rhythm — same spacing scale everywhere"
  - "Accessible by default — WCAG AA contrast, focus rings, semantic HTML"
  - "Mobile-first responsive — design for 375px, scale up"

# ─── ICONS & MEDIA ────────────────────────────────────────────
icons:
  approach: "Custom SVG icons per service — no emoji"
  style: "Clean, stroke-based, 48x48 viewBox in circular badge"
  location: "/images/icons/"
  naming: "icon-{service}.svg (icon-seo.svg, icon-geo.svg, etc.)"

images:
  format: "SVG preferred, WebP for photos"
  logo_mark: "/images/logo-mark.png (RexBunny icon mark)"
  logo_full: "/images/logo.png (RexBunny full logo)"
  favicon: "/favicon.svg (R letter mark on dark bg)"
  og: "/images/og-image.svg (1200x630, dark bg + R mark + RexBunny title)"
  alt: "Always provide meaningful alt text"

# ─── RESPONSIVE BREAKPOINTS ───────────────────────────────────
breakpoints:
  sm: "640px"
  md: "768px"
  lg: "1024px"
  xl: "1280px"
  "2xl": "1536px"

# ─── Z-INDEX SCALE ────────────────────────────────────────────
z_index:
  base:     "z-0"
  nav:      "z-50"
  popup:    "z-[100]"

# ─── SPECIFIC PAGE PATTERNS ───────────────────────────────────
pages:
  homepage:
    hero: "Full-width gradient hero with brand badge, large display heading, gradient accent text, 2 CTAs, trust badges"
    metrics: "Branded metrics bar, alternating gradient bg"
    services: "5-column grid of service cards with custom SVG icons, colored accent borders, checkmark features, hover lift"
    testimonials: "3-column cards with star ratings, gradient metrics, avatar circles, hover elevation"
    case_studies: "3-column cards with colored service tags, metric badges"
    blog: "3-column blog cards with brand-colored tag pills"
    process: "4-step numbered process with gradient step numbers"
    faq: "Accordion using native <details>/<summary> in Preact"
    cta: "Full-width dark gradient section with crowned bunny watermark, reversed CTA"

# ─── AI INSTRUCTIONS ──────────────────────────────────────────
instructions:
  general: |
    Always use Tailwind utility classes from this design system.
    Never add custom CSS files. All styling goes through Tailwind.
    Use `brand-*` color scale for primary elements.
    Use `rex-*` (rex-orange, rex-gold, rex-dark, rex-violet, etc.) for brand-specific colors.
    Use `font-display` for headings, `font-sans` for body text.
    Prefer existing component patterns over creating new ones.

  new_components: |
    When creating new components:
    1. Match existing card/button/input patterns above
    2. Use rounded-2xl for cards, rounded-xl for CTAs, rounded-lg for inputs
    3. Include hover transitions (duration-300 with hover:-translate-y-1 for cards)
    4. Add focus:ring-2 for accessibility
    5. Use responsive utilities (sm:, lg:) for all layouts
    6. Use gradient CTAs (from-brand-500 to-rex-orange) for primary actions

  brand_assets: |
    Logo mark: /images/logo-mark.png (RexBunny icon)
    Full logo: /images/logo.png
    Favicon: /favicon.svg
    OG image: /images/og-image.svg
    Icons: /images/icons/icon-{service}.svg

  preact_islands: |
    Interactive components use Preact with client:load or client:visible.
    Use preact/hooks (useState, useEffect) for state management.
    No external UI libraries — all components are hand-rolled.
    Component file extension: .tsx with JSX using Preact imports.

  astro_components: |
    Static components use .astro format.
    Import via relative paths from layouts/components.
    No CSS imports — styling is purely Tailwind utility classes.
    JSON-LD structured data goes in BaseLayout.astro head.
