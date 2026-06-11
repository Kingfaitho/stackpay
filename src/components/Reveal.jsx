import { useEffect, useRef } from 'react'

// Fades sections up as they scroll into view. CSS lives in global.css (.reveal)
// and is disabled automatically under prefers-reduced-motion.
export default function Reveal({ children, delay = 0 }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        el.classList.add('is-visible')
        observer.disconnect()
      }
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' })
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  return (
    <div ref={ref} className="reveal" style={delay ? { transitionDelay: `${delay}ms` } : undefined}>
      {children}
    </div>
  )
}
