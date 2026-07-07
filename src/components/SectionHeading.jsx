import Reveal from './Reveal'

// accent: 'brand' (green) | 'claude' (coral) | 'duo' (gradient of both)
const accents = {
  brand: { pill: 'text-brand-300 ring-brand-500/30', bar: 'from-brand-500 to-brand-300' },
  claude: { pill: 'text-claude-400 ring-claude-500/30', bar: 'from-claude-500 to-claude-300' },
  duo: { pill: 'text-white ring-white/15', bar: 'from-brand-500 via-claude-500 to-claude-400' },
}

// Wrap the `highlight` keyword inside `title` in Claude coral. Case-insensitive,
// preserves the title's original casing.
function renderTitle(title, highlight) {
  if (!highlight) return title
  const idx = title.toLowerCase().indexOf(highlight.toLowerCase())
  if (idx === -1) return title
  return (
    <>
      {title.slice(0, idx)}
      <span className="bg-gradient-to-r from-claude-400 to-claude-500 bg-clip-text text-transparent">
        {title.slice(idx, idx + highlight.length)}
      </span>
      {title.slice(idx + highlight.length)}
    </>
  )
}

export default function SectionHeading({ eyebrow, title, subtitle, align = 'center', accent = 'brand', highlight }) {
  const alignment = align === 'center' ? 'text-center mx-auto' : 'text-left'
  const a = accents[accent] || accents.brand
  return (
    <div className={`max-w-2xl ${alignment}`}>
      {eyebrow && (
        <Reveal>
          <span
            className={`inline-block rounded-full bg-white/5 px-3.5 py-1 text-xs font-bold uppercase tracking-widest ring-1 backdrop-blur ${a.pill}`}
          >
            {eyebrow}
          </span>
        </Reveal>
      )}
      <Reveal delay={80}>
        <h2 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
          {renderTitle(title, highlight)}
        </h2>
      </Reveal>
      {subtitle && (
        <Reveal delay={160}>
          <p className="mt-4 text-base leading-relaxed text-white/55">{subtitle}</p>
        </Reveal>
      )}
      <Reveal delay={220}>
        <div className={`mt-5 h-1 w-16 rounded-full bg-gradient-to-r ${a.bar} ${align === 'center' ? 'mx-auto' : ''}`} />
      </Reveal>
    </div>
  )
}
