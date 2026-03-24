import { useEffect } from "react"
import { useLocation } from "react-router-dom"

export function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    // Scroll the main content area to top on route change
    const mainEl = document.querySelector("main")
    if (mainEl) {
      mainEl.scrollTo(0, 0)
    }
    window.scrollTo(0, 0)
  }, [pathname])

  return null
}
