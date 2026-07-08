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
import BookingModal from './components/BookingModal'
import AdminPage from './components/AdminPage'
import WebinarsPage from './components/WebinarsPage'

export default function App() {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const onHash = () => setHash(window.location.hash)
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  // Simple hash routes.
  if (hash === '#admin') return <AdminPage />
  if (hash === '#webinars') return <WebinarsPage />

  return (
    <BookingProvider>
      <div className="min-h-screen overflow-x-clip bg-black">
        <Navbar />
        <main>
          <HeroCarousel />
          <PartnerMarquee />
          <Services />
          <Architects />
          <AssociatedWith />
          {/* photos keep their own scroll-in animation (inside Masonry) */}
          <OurWork />
          <ClaudePowered />
          <Testimonials />
          <Contact />
        </main>

        <BookingModal />
      </div>
    </BookingProvider>
  )
}
