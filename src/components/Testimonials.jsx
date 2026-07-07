import ScrollFloat from './ScrollFloat'
import './Testimonials.css'

// Placeholder testimonials — swap avatars/quotes for real ones later.
const testimonials = [
  {
    quote:
      "Technical Hub stood up our AI lab end-to-end and had our faculty building with Claude in weeks, not months. Our students now ship real AI products.",
    name: 'Dr. Ramesh Kulkarni',
    role: 'Principal',
    company: 'NCET',
    avatar: 'https://picsum.photos/id/1005/120/120',
  },
  {
    quote:
      "The Claude certification program gave our engineering teams superpowers. Prototypes that took weeks now go live in days — and quality went up.",
    name: 'Ananya Verma',
    role: 'Head of Innovation',
    company: 'Toriiminds',
    avatar: 'https://picsum.photos/id/1027/120/120',
  },
  {
    quote:
      "From curriculum design to deployment, they delivered a Claude-powered platform our whole campus relies on. The partnership just works.",
    name: 'Takeshi Fujiwara',
    role: 'Director',
    company: 'Geeta University',
    avatar: 'https://picsum.photos/id/1012/120/120',
  },
  {
    quote:
      "Hands-on, senior, and genuinely certified on Claude. Every engagement raised the bar for what our teams thought was possible with AI.",
    name: 'Priya Nair',
    role: 'Dean of Engineering',
    company: 'YCCE',
    avatar: 'https://picsum.photos/id/64/120/120',
  },
  {
    quote:
      "They don't just train — they build alongside you. Our team walked away shipping production features on Claude with real confidence.",
    name: 'Arjun Mehta',
    role: 'CTO',
    company: 'Northstar Labs',
    avatar: 'https://picsum.photos/id/91/120/120',
  },
]

function Card({ t }) {
  return (
    <div className="testi-card">
      <span className="testi-mark">&ldquo;</span>
      <p className="testi-quote">{t.quote}</p>
    </div>
  )
}

export default function Testimonials() {
  // Duplicate the set so translateX(-50%) loops seamlessly.
  const loop = [...testimonials, ...testimonials]
  const duration = `${testimonials.length * 7}s`

  return (
    <section id="testimonials" className="relative overflow-hidden bg-black py-12 sm:py-16">
      <div className="mb-14 px-6 sm:px-10 lg:px-16 xl:px-24">
        <p className="text-xs font-bold uppercase tracking-[0.28em] text-claude-400">Testimonials</p>
        <ScrollFloat
          containerClassName="mt-4 font-syne text-4xl font-extrabold tracking-tight text-claude-400 sm:text-5xl lg:text-6xl"
          stagger={0.03}
        >
          Trusted by builders
        </ScrollFloat>
      </div>

      <div className="testi-marquee">
        <div className="testi-track" style={{ '--duration': duration }}>
          {loop.map((t, i) => (
            <Card key={i} t={t} />
          ))}
        </div>
      </div>
    </section>
  )
}
