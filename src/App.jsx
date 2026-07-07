import { useEffect, useState } from 'react'
import { BookingProvider } from './context/BookingContext'
import Navbar from './components/Navbar'
import HeroCarousel from './components/HeroCarousel'
import PartnerMarquee from './components/PartnerMarquee'
import Architects from './components/Architects'
import Services from './components/Services'
import AssociatedWith from './components/AssociatedWith'
import OurWork from './components/OurWork'
import ClaudePowered from './components/ClaudePowered'
import Testimonials from './components/Testimonials'
import Contact from './components/Contact'
import Footer from './components/Footer'
import BookingModal from './components/BookingModal'
import AdminPage from './components/AdminPage'
import WebinarsPage from './components/WebinarsPage'
import GradualBlur from './components/GradualBlur'
import MobileInfo from './components/MobileInfo'
import SectionReveal from './components/SectionReveal'

// Below this width we show the compact info screen instead of the full landing.
const SMALL_BREAKPOINT = 768

export default function App() {
  const [hash, setHash] = useState(window.location.hash)
  const [isSmall, setIsSmall] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < SMALL_BREAKPOINT
  )

  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    const onResize = () => setIsSmall(window.innerWidth < SMALL_BREAKPOINT)
    window.addEventListener('hashchange', onHash)
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('hashchange', onHash)
      window.removeEventListener('resize', onResize)
    }
  }, [])

  // Simple hash routes.
  if (hash === '#admin') return <AdminPage />
  if (hash === '#webinars') return <WebinarsPage />

  // Small / phone screens get a compact info screen (booking still works).
  if (isSmall) {
    return (
      <BookingProvider>
        <div className="min-h-screen bg-black">
          <MobileInfo />
          <BookingModal />
        </div>
      </BookingProvider>
    )
  }

  return (
    <BookingProvider>
      <div className="min-h-screen overflow-x-clip bg-black">
        <Navbar />
        <main>
          <SectionReveal variant="blur">
            <HeroCarousel />
          </SectionReveal>
          <PartnerMarquee />
          <SectionReveal variant="slide-right">
            <Services />
          </SectionReveal>
          <SectionReveal variant="fade">
            <Architects />
          </SectionReveal>
          <SectionReveal variant="fade">
            <AssociatedWith />
          </SectionReveal>
          <SectionReveal variant="fade-up">
            <OurWork />
          </SectionReveal>
          <SectionReveal variant="tilt">
            <ClaudePowered />
          </SectionReveal>
          <SectionReveal variant="slide-left">
            <Testimonials />
          </SectionReveal>
          <SectionReveal variant="fade">
            <Contact />
          </SectionReveal>
        </main>
        <SectionReveal variant="fade-up">
          <Footer />
        </SectionReveal>

        {/* page-wide scroll blur at the bottom edge (below the modal z) */}
        <GradualBlur
          target="page"
          position="bottom"
          height="6rem"
          strength={2}
          divCount={5}
          curve="bezier"
          exponential
          opacity={1}
          style={{ zIndex: 60 }}
        />

        <BookingModal />
      </div>
    </BookingProvider>
  )
}
