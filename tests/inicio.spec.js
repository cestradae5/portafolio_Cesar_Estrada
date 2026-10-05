import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

const approvedCopy = {
  greeting: 'Hola, soy Cesar Estrada',
  headline: 'Desarrollador Web & Estudiante de último año de Ingeniería en Sistemas',
  impact:
    'Además utilizo la Inteligencia Artificial como herramienta para optimizar mi flujo de trabajo y construir experiencias digitales claras, accesibles y orientadas a resultados.',
}

// The approved copy is display text: the markup escapes & as &amp;, and the headline
// ends with a period that has to match literally instead of as a regex wildcard.
function escapeMarkup(text) {
  return text.replace(/&/g, '&amp;')
}

function escapePattern(text) {
  return escapeMarkup(text).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function getInicioSection() {
  const mainStart = html.indexOf('<main')
  const mainEnd = html.indexOf('</main>')

  assert.notEqual(mainStart, -1, 'the page must include a main landmark')
  assert.notEqual(mainEnd, -1, 'the page must close the main landmark')

  const main = html.slice(mainStart, mainEnd)
  const firstSection = main.match(/<section\b[^>]*>/i)

  assert.ok(firstSection, 'main must contain an Inicio section')
  assert.match(firstSection[0], /\bid=["']inicio["']/i)
  assert.match(firstSection[0], /\baria-labelledby=["']inicio-title["']/i)

  const sectionStart = html.indexOf(firstSection[0], mainStart)
  const sectionEnd = html.indexOf('</section>', sectionStart)

  assert.notEqual(sectionEnd, -1, 'the Inicio section must be closed')
  return html.slice(sectionStart, sectionEnd + '</section>'.length)
}

test('Inicio exposes the approved copy in semantic reading order', () => {
  const inicio = getInicioSection()
  const orderedContent = [
    escapeMarkup(approvedCopy.greeting),
    escapeMarkup(approvedCopy.headline),
    escapeMarkup(approvedCopy.impact),
  ]

  let previousIndex = -1
  for (const content of orderedContent) {
    const currentIndex = inicio.indexOf(content)
    assert.notEqual(currentIndex, -1, `missing approved content: ${content}`)
    assert.ok(currentIndex > previousIndex, `${content} must follow the approved reading order`)
    previousIndex = currentIndex
  }

  const headings = html.match(/<h1\b[^>]*>/gi) ?? []
  assert.equal(headings.length, 1, 'the headline must be the only page-level h1')
  assert.match(
    inicio,
    new RegExp(
      `<h1\\b[^>]*\\bid=["']inicio-title["'][^>]*>\\s*${escapePattern(approvedCopy.headline)}\\s*</h1>`,
      'i',
    ),
  )
})

test('Inicio renders the approved copy with the reference type hierarchy', () => {
  const inicio = getInicioSection()

  const greeting = inicio.match(/<p\b[^>]*>\s*Hola, soy Cesar Estrada\s*<\/p>/i)
  assert.ok(greeting, 'the greeting must be its own paragraph above the headline')
  assert.match(greeting[0], /\btext-primary\b/, 'the greeting must use the yellow brand accent')
  assert.ok(
    inicio.indexOf(greeting[0]) < inicio.indexOf('<h1'),
    'the greeting must precede the headline, like the reference masthead copy',
  )

  const headline = inicio.match(/<h1\b[^>]*>/i)[0]

  assert.match(headline, /\btext-5xl\b/, 'the headline must start smaller on a phone')
  assert.match(headline, /\bsm:text-7xl\b/, 'the headline must scale up from the sm breakpoint')
  assert.match(headline, /\blg:text-7xl\b/, 'the headline must carry the largest type scale')

  const impact = inicio.match(/<p\b[^>]*>\s*Además utilizo la Inteligencia Artificial/i)
  assert.ok(impact, 'the impact paragraph must follow the headline')
  assert.doesNotMatch(impact[0], /\btext-7xl\b|\btext-6xl\b/, 'the impact paragraph must stay below the headline')
  assert.doesNotMatch(greeting[0], /\btext-7xl\b/, 'the greeting must stay the smallest text on the page')
  assert.ok(inicio.indexOf('</h1>') < inicio.indexOf(impact[0]), 'the impact paragraph must follow the headline')

  assert.doesNotMatch(inicio, /Cesar Armando Estrada Elias/i, 'the hero now introduces the short name')
  assert.equal(
    (inicio.match(/<p\b/gi) ?? []).length,
    2,
    'the hero keeps exactly the greeting and the impact paragraph',
  )
})

test('Inicio keeps its responsive presentation contract', () => {
  const inicio = getInicioSection()
  const section = inicio.match(/<section\b[^>]*>/i)[0]

  assert.match(inicio, /\bmax-w-7xl\b/)

  // The padding values are tuned by hand, so the contract is that the hero stays
  // responsive across breakpoints, not that a specific pixel value survives.
  assert.match(section, /\bpx-\d/, 'the hero needs base horizontal padding')
  assert.match(section, /\bsm:px-\d/, 'the hero needs a small-screen padding step')
  assert.match(section, /\blg:px-\d/, 'the hero needs a large-screen padding step')
  assert.match(section, /\bpy-\d/, 'the hero needs vertical padding')
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
})

test('No class attribute carries a mistyped Tailwind size', () => {
  // A typo like text-7x1 silently generates no CSS, so the breakpoint quietly
  // stops working with no build error. Tailwind has no digit-x-digit utility.
  for (const attribute of html.matchAll(/class="([^"]*)"/g)) {
    assert.doesNotMatch(
      attribute[1],
      /\b\S*\d+x\d\S*\b/,
      `mistyped Tailwind class in: ${attribute[1]}`,
    )
  }
})

test('Inicio theme maps Tailwind utilities to Material 3 system tokens', () => {
  const requiredMaterialTokens = [
    '--md-sys-color-surface',
    '--md-sys-color-surface-container',
    '--md-sys-color-surface-container-high',
    '--md-sys-color-on-surface',
    '--md-sys-color-on-surface-variant',
    '--md-sys-color-primary',
    '--md-sys-color-on-primary',
    '--md-sys-color-secondary',
    '--md-sys-color-on-secondary',
    '--md-sys-color-outline-variant',
    '--md-sys-shape-corner-full',
    '--md-sys-typescale-body-large-font',
    '--md-sys-motion-easing-standard',
  ]

  for (const token of requiredMaterialTokens) {
    assert.match(css, new RegExp(`${token}:`), `missing Material 3 token ${token}`)
  }

  assert.match(css, /--color-primary:\s*var\(--md-sys-color-primary\)/)
  assert.match(css, /--color-on-primary:\s*var\(--md-sys-color-on-primary\)/)
  assert.match(css, /--color-secondary:\s*var\(--md-sys-color-secondary\)/)
  assert.match(css, /--color-on-secondary:\s*var\(--md-sys-color-on-secondary\)/)
  assert.match(css, /--color-surface-container-high:\s*var\(--md-sys-color-surface-container-high\)/)
  assert.match(css, /--radius-hero-action:\s*var\(--md-sys-shape-corner-full\)/)
  assert.match(css, /background-color:\s*var\(--md-sys-color-surface\)/)
})

test('Inicio uses the approved dark Batman-inspired palette through theme tokens', () => {
  assert.match(css, /color-scheme:\s*dark/)
  assert.match(css, /--md-sys-color-surface:\s*#141414/)
  assert.match(css, /--md-sys-color-surface-container:\s*#242424/)
  assert.match(css, /--md-sys-color-surface-container-high:\s*#282e3c/)
  assert.match(css, /--md-sys-color-outline-variant:\s*#505c7c/)
  assert.match(css, /--md-sys-color-primary:\s*#f5f74a/)
  assert.match(css, /--md-sys-color-on-primary:\s*#202100/)
  assert.match(css, /--md-sys-color-secondary:\s*#988829/)
  assert.match(css, /--md-sys-color-on-secondary:\s*#1f1c08/)
  assert.match(html, /text-secondary/)
})

test('Inicio stays a scoped, typographic hero while the menu owns the actions', () => {
  const inicio = getInicioSection()

  assert.doesNotMatch(html, /<footer\b/i)
  assert.doesNotMatch(html, /<form\b/i)
  assert.doesNotMatch(inicio, /<(?:img|picture|svg)\b/i)
  assert.doesNotMatch(inicio, /\bbtn\b|contacto-pendiente/i)

  const links = inicio.match(/<a\b[^>]*>/gi) ?? []
  assert.equal(links.length, 0, 'Inicio must expose no action; the top menu owns every handoff')
})
