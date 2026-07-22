import { useEffect } from 'react'

export function useOutsideClick(ref, callback) {
  useEffect(() => {
    const listener = (event) => {
      const target = event.target
      // Ignore targets that were removed from the DOM during this same event —
      // e.g. a custom dropdown option that unmounts the instant it's picked.
      // Such a node is no longer "contained" by the ref, which would otherwise
      // be misread as an outside click and wrongly close the modal.
      if (!target || (target.isConnected === false)) return
      // do nothing if clicking the ref element or its children
      if (!ref.current || ref.current.contains(target)) return
      callback(event)
    }
    document.addEventListener('mousedown', listener)
    document.addEventListener('touchstart', listener)
    return () => {
      document.removeEventListener('mousedown', listener)
      document.removeEventListener('touchstart', listener)
    }
  }, [ref, callback])
}
