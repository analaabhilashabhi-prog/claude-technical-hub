import { useEffect, useState } from 'react'
import { BookingProvider } from './context/BookingContext'
import Navbar from './components/Navbar'
import HeroCarousel from './components/HeroCarousel'
// import GradientBanner from './components/GradientBanner' // retired — re-enable by uncommenting here and below
import Architects from './components/Architects'
import Services from './components/Services'
import AssociatedWith from './components/AssociatedWith'
// import MacbookShowcase from './components/MacbookShowcase' // retired for now — re-enable by uncommenting here and below
import SuccessStories from './components/SuccessStories'
import OurWork from './components/OurWork'
import ClaudePowered from './components/ClaudePowered'
import Testimonials from './components/Testimonials'
import Contact from './components/Contact'
import BookingModal from './components/BookingModal'
import WebinarPopup from './components/WebinarPopup'
import AdminPage from './components/AdminPage'
import WebinarsPage from './components/WebinarsPage'
import { clearAdminToken } from './data/api'

export default function App() {
  const [hash, setHash] = useState(window.location.hash)

  useEffect(() => {
    const onHash = () => {
      const next = window.location.hash
      // Leaving the admin area (e.g. hitting Back or "Back to site") ends the
      // admin session — they must log in again to return.
      if (next !== '#admin') clearAdminToken()
      setHash(next)
    }
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
          <Services />
          <Architects />
          <AssociatedWith />
          {/* <MacbookShowcase /> */}
          <SuccessStories />
          {/* photos keep their own scroll-in animation (inside Masonry) */}
          <OurWork />
          <ClaudePowered />
          <Testimonials />
          <Contact />
        </main>

        <BookingModal />
        <WebinarPopup />
      </div>
    </BookingProvider>
  )
}