import LogoLoop from './LogoLoop'
import ncet from '../assets/logo-ncet.png'
import ycce from '../assets/logo-ycce.png'
import geeta from '../assets/logo-geeta.png'
import torii from '../assets/logo-toriiminds.png'
import claude from '../assets/claude-partner-logo.png'

// All partner / institution logos. Add or remove here.
const logos = [
  { src: ncet, alt: 'Nagarjuna College (NCET)', href: '#' },
  { src: ycce, alt: 'YCCE', href: '#' },
  { src: geeta, alt: 'Geeta University', href: '#' },
  { src: torii, alt: 'Toriiminds', href: '#' },
  { src: claude, alt: 'Claude', href: '#' },
]

// Each logo with a styled tooltip bubble showing its name on hover.
const renderLogo = (item, key) => (
  <a
    key={key}
    href={item.href}
    target="_blank"
    rel="noreferrer noopener"
    aria-label={item.alt}
    className="logo-tip"
  >
    <img src={item.src} alt={item.alt} draggable={false} />
    <span className="logo-tip__bubble">{item.alt}</span>
  </a>
)

export default function PartnerMarquee() {
  return (
    <section className="relative overflow-hidden bg-black py-16">
      <LogoLoop
        logos={logos}
        speed={65}
        direction="left"
        logoHeight={130}
        gap={48}
        hoverSpeed={0}
        scaleOnHover
        fadeOut
        fadeOutColor="#000000"
        className="logoloop--grey"
        ariaLabel="Our institution and technology partners"
        renderItem={renderLogo}
      />
    </section>
  )
}
