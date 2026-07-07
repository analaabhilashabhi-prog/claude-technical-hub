# Technical Hub — Landing Page

A fully responsive React landing page for **Technical Hub**, built with Vite + React (functional components & hooks) and Tailwind CSS. All content is placeholder/mock static data.

## Stack
- React 18 (functional components, hooks — no class components)
- Vite 6
- Tailwind CSS 3 (no external UI libraries)
- Inline SVG icons (no icon library)

## Theme
Green palette centered on **#008737**:

| Token | Hex | Use |
|-------|-----|-----|
| `brand-50` | `#e6f4ed` | light tint / backgrounds |
| `brand-300` | `#52b788` | accents |
| `brand-500` | `#008737` | primary |
| `brand-700` | `#005a24` | dark |
| `brand-800` | `#003d18` | darkest / footer |

## Sections
1. **Hero Carousel** — auto-sliding (5s), 4 slides, dot indicators, arrow controls, fade transition
2. **Claude Architects** — 5×2 grid (desktop) / horizontal scroll carousel with arrows (mobile/tablet)
3. **Our Services** — 4 responsive cards with hover glow/lift
4. **Associated With** — 2 centered partner cards
5. **Claude Powered** — 2 app cards (Myna, Project Space) with slide-up hover overlay
6. **Get In Touch** — two-column contact info + working mock form

Sticky navbar with smooth-scroll anchor links, responsive mobile menu, and a simple footer.

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build → dist/
npm run preview  # preview the production build
```

## Structure
```
src/
  App.jsx
  main.jsx
  index.css
  data/mockData.js          # all placeholder content
  components/
    Navbar.jsx
    HeroCarousel.jsx
    Architects.jsx
    Services.jsx
    AssociatedWith.jsx
    ClaudePowered.jsx
    Contact.jsx
    Footer.jsx
    SectionHeading.jsx
    Icons.jsx
```
