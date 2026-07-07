import { createContext, useCallback, useContext, useState } from 'react'

// Shared booking modal state. `type` is a key into bookingForms
// (e.g. 'webinar' | 'aiLab'); null means the modal is closed.
const BookingContext = createContext(null)

export function BookingProvider({ children }) {
  const [type, setType] = useState(null)

  const openBooking = useCallback((t) => setType(t), [])
  const closeBooking = useCallback(() => setType(null), [])

  return (
    <BookingContext.Provider value={{ type, openBooking, closeBooking }}>
      {children}
    </BookingContext.Provider>
  )
}

export function useBooking() {
  const ctx = useContext(BookingContext)
  if (!ctx) throw new Error('useBooking must be used within <BookingProvider>')
  return ctx
}
