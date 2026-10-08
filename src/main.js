import './styles.css'

// El carrusel de logos se mueve solo lo que la persona le pide: un logo por clic.
// El scroll nativo mas scroll-snap hace el resto, asi que aqui no hay animacion propia
// que respetar y el reduced-motion del proyecto ya cubre los saltos de scroll.
const carousel = document.querySelector('[data-carousel]')
const previousButton = document.querySelector('[data-carousel-prev]')
const nextButton = document.querySelector('[data-carousel-next]')

if (carousel && previousButton && nextButton) {
  const firstLogo = carousel.querySelector('img')
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')

  // Un clic avanza exactamente un logo, para que el snap siempre caiga en un borde.
  const step = () => {
    if (!firstLogo) return carousel.clientWidth

    const style = getComputedStyle(carousel)
    const gap = parseFloat(style.columnGap) || 0

    return firstLogo.offsetWidth + gap
  }

  const syncButtons = () => {
    const maxScroll = carousel.scrollWidth - carousel.clientWidth
    previousButton.toggleAttribute('disabled', carousel.scrollLeft <= 1)
    nextButton.toggleAttribute('disabled', carousel.scrollLeft >= maxScroll - 1)
  }

  const slide = (direction) => {
    carousel.scrollBy({
      left: direction * step(),
      behavior: reduceMotion.matches ? 'auto' : 'smooth',
    })
  }

  previousButton.addEventListener('click', () => slide(-1))
  nextButton.addEventListener('click', () => slide(1))
  carousel.addEventListener('scroll', syncButtons, { passive: true })
  window.addEventListener('resize', syncButtons)

  syncButtons()
}