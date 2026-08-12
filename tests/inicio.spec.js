import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

const approvedCopy = {
  identity: 'Estudiante de Ingeniería en Sistemas y Desarrollador Web',
  name: 'Cesar Armando Estrada Elias',
  title: 'Desarrollador Web | Estudiante de Ingeniería en Sistemas, 4.º año',
  impact:
    'Construyo soluciones web accesibles, claras y orientadas a resolver problemas reales con una implementación efectiva.',
  cta: 'Contacto',
  pendingStatus: 'La sección de contacto estará disponible próximamente.',
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
    approvedCopy.identity,
    approvedCopy.name,
    approvedCopy.title,
    approvedCopy.impact,
    approvedCopy.cta,
  ]

  let previousIndex = -1
  for (const content of orderedContent) {
    const currentIndex = inicio.indexOf(content)
    assert.notEqual(currentIndex, -1, `missing approved content: ${content}`)
    assert.ok(currentIndex > previousIndex, `${content} must follow the approved reading order`)
    previousIndex = currentIndex
  }

  const headings = html.match(/<h1\b[^>]*>/gi) ?? []
  assert.equal(headings.length, 1, 'the name must be the only page-level h1')
  assert.match(inicio, /<h1\b[^>]*\bid=["']inicio-title["'][^>]*>\s*Cesar Armando Estrada Elias\s*<\/h1>/i)
})

test('Inicio provides the approved temporary Contacto destination', () => {
  const inicio = getInicioSection()
  const contactLink = inicio.match(/<a\b[^>]*\bhref=["']#contacto-pendiente["'][^>]*>[\s\S]*?Contacto[\s\S]*?<\/a>/i)

  assert.ok(contactLink, 'Contacto must link to the pending contact destination')
  assert.match(contactLink[0], /\baria-describedby=["']contacto-pendiente["']/i)
  assert.match(
    inicio,
    /<p\b[^>]*\bid=["']contacto-pendiente["'][^>]*>\s*La sección de contacto estará disponible próximamente\.\s*<\/p>/i,
  )
})

test('Inicio keeps its responsive and keyboard-accessible presentation contract', () => {
  const inicio = getInicioSection()
  const contactLink = inicio.match(/<a\b[^>]*\bhref=["']#contacto-pendiente["'][^>]*>/i)

  assert.ok(contactLink, 'the Contacto opening tag must be present')
  assert.match(inicio, /\bmax-w-3xl\b/)
  assert.match(inicio, /\bpx-6\b/)
  assert.match(inicio, /\bsm:px-8\b/)
  assert.match(contactLink[0], /\bmin-h-12\b/)
  assert.match(contactLink[0], /\brounded-hero-action\b/)
  assert.match(contactLink[0], /\bfocus-visible:outline-4\b/)
  assert.match(contactLink[0], /\bfocus-visible:underline\b/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
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

test('Inicio introduces only the scoped hero and temporary contact handoff', () => {
  const inicio = getInicioSection()

  assert.doesNotMatch(html, /<footer\b/i)
  assert.doesNotMatch(html, /<form\b/i)
  assert.doesNotMatch(inicio, /<(?:img|picture|svg)\b/i)

  const links = html.match(/<a\b[^>]*>/gi) ?? []
  assert.equal(links.length, 1, 'Inicio must expose exactly one primary action')
})
