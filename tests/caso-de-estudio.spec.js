import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const html = readFileSync(new URL('../caso-de-estudio.html', import.meta.url), 'utf8')
const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')
const viteConfig = readFileSync(new URL('../vite.config.js', import.meta.url), 'utf8')

const approvedSections = [
  '1. Problema',
  '2. Restricciones',
  '3. Decisiones de arquitectura',
  '4. Capacidades del sistema',
  '5. Alternativas descartadas',
  '6. Qué salió mal y qué se rehace',
  '7. Resultado',
]

function getText(markup) {
  return markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function getMain() {
  const mainStart = html.indexOf('<main')
  const mainEnd = html.indexOf('</main>')

  assert.notEqual(mainStart, -1, 'the case study must include a main landmark')
  assert.notEqual(mainEnd, -1, 'the case study must close the main landmark')
  return html.slice(mainStart, mainEnd)
}

function getLabelledSections() {
  return [...getMain().matchAll(/<section\b[^>]*aria-labelledby=["']([^"']+)["'][^>]*>/gi)]
}

function getSectionById(id) {
  const main = getMain()
  const start = main.indexOf(`aria-labelledby="${id}"`)
  const sectionStart = main.lastIndexOf('<section', start)
  const sectionEnd = main.indexOf('</section>', start)

  assert.notEqual(sectionStart, -1, `the ${id} section must be declared`)
  assert.notEqual(sectionEnd, -1, `the ${id} section must be closed`)
  return main.slice(sectionStart, sectionEnd + '</section>'.length)
}

function getBackLink() {
  return [...getMain().matchAll(/<a\b[^>]*href=["'](?:\.\/|\/)?["'][^>]*>[\s\S]*?<\/a>/gi)]
}

test('the case study page is a standalone Spanish document linked from the portfolio', () => {
  const main = getMain()
  const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]
  const backLinks = getBackLink()

  assert.match(html, /<html\b[^>]*\blang=["']es["']/i)

  assert.equal(headings.length, 1, 'the case study must expose exactly one h1')
  assert.ok(
    getText(headings[0][0]).includes('Sistema de asistencia docente'),
    'the h1 must be the project name',
  )

  assert.equal(backLinks.length, 1, 'the case study must expose one link back to the portfolio')
  assert.match(getText(backLinks[0][0]), /Portafolio/i)
  assert.doesNotMatch(backLinks[0][0], /\btarget\s*=/i)
  assert.doesNotMatch(backLinks[0][0], /\bhref\s*=\s*["'](?:https?:)?\/\//i)

  assert.doesNotMatch(main, /<form\b|<input\b|<footer\b|<img\b|<svg\b/i)
  assert.doesNotMatch(main, /\bhref\s*=\s*["']https?:\/\//i)

  assert.match(
    indexHtml,
    /<a\b[^>]*href=["'][^"']*caso-de-estudio\.html["'][^>]*>[\s\S]*?Caso de estudio[\s\S]*?<\/a>/i,
  )
})

test('the case study keeps the approved section order and headings', () => {
  const sections = getLabelledSections()

  assert.equal(sections.length, 7, 'the case study must expose exactly seven labelled sections')

  sections.forEach((section, index) => {
    const id = section[1]
    const sectionMarkup = getSectionById(id)
    const heading = sectionMarkup.match(
      new RegExp(`<h2\\b[^>]*\\bid=["']${id}["'][\\s\\S]*?</h2>`, 'i'),
    )

    assert.notEqual(heading, null, `section ${id} must carry its own h2`)
    assert.equal(getText(heading[0]), approvedSections[index])
  })
})

test('the case study documents the approved technical claims', () => {
  const pageText = getText(getMain())
  const decisionText = getText(getSectionById('arquitectura'))

  for (const claim of [
    'QR estático',
    'token secreto',
    'Google OAuth',
    'correo institucional',
    'PostgreSQL',
    'Docker',
    'Express',
    'en el momento de la consulta',
    'una entrada y una salida por jornada',
    'motivo principal fue económico',
    'Costo operativo cero',
    'cámara',
    'GPS',
    'turnos partidos',
    'vistas materializadas',
  ]) {
    assert.ok(pageText.includes(claim), `the case study must document "${claim}"`)
  }

  assert.doesNotMatch(pageText, /códigos QR dinámicos/i)
  assert.match(decisionText, /no fue reemplazarlo por un QR dinámico/i)
  assert.equal(
    decisionText.match(/dinámic\w*/gi).length,
    1,
    'the architecture section may only mention the dynamic QR to explain its rejection',
  )
})

test('the case study keeps the token-backed, responsive and keyboard-accessible contract', () => {
  const backLink = getBackLink()[0][0]

  assert.match(html, /\bpx-6\b/)
  assert.match(html, /\bsm:px-8\b/)
  assert.match(html, /\bmax-w-3xl\b/)
  assert.match(html, /\brounded-hero-action\b/)
  assert.match(backLink, /\bmin-h-12\b/)
  assert.match(backLink, /focus-visible:outline-4/)
  assert.match(backLink, /motion-reduce:transition-none/)

  assert.match(css, /--md-sys-shape-corner-full:/)
  assert.match(css, /--radius-hero-action:/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)

  for (const classes of html.matchAll(/class="([^"]*)"/g)) {
    if (/\btransition-/.test(classes[1])) {
      assert.match(
        classes[1],
        /motion-reduce:transition-none/,
        'every transition must be paired with motion-reduce:transition-none',
      )
    }
  }
})

function getIndexSectionById(id) {
  const anchor = indexHtml.indexOf(`id="${id}"`)

  assert.notEqual(anchor, -1, `index.html must declare the ${id} section`)

  const start = indexHtml.lastIndexOf('<section', anchor)
  const end = indexHtml.indexOf('</section>', anchor)

  assert.notEqual(start, -1, `the ${id} section must be opened`)
  assert.notEqual(end, -1, `the ${id} section must be closed`)
  return indexHtml.slice(start, end)
}

test('the build config includes both pages and the project card stays consistent with the case study', () => {
  const projectText = getText(getIndexSectionById('proyectos'))

  assert.match(viteConfig, /rollupOptions\s*:/)
  assert.match(viteConfig, /input\s*:/)
  assert.match(viteConfig, /index\.html/)
  assert.match(viteConfig, /caso-de-estudio\.html/)

  assert.ok(projectText.includes('QR estáticos con token rotativo'))
  assert.ok(projectText.includes('reconocimiento biométrico facial en desarrollo'))
  assert.match(
    getText(getSectionById('arquitectura')),
    /biométrico facial[\s\S]{0,80}en desarrollo/i,
  )
})
