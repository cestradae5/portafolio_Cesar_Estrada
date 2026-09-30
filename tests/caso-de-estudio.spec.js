import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
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
  '5. Recorrido por el sistema',
  '6. Alternativas descartadas',
  '7. Qué salió mal y qué se rehace',
  '8. Resultado',
]

// Screenshots of the running system, in the order the walkthrough presents them.
// Intrinsic sizes are asserted so a wrong width/height pair cannot reintroduce layout shift.
const walkthroughScreenshots = [
  { file: '01-login.png', width: 1920, height: 875 },
  { file: '02-dashboard.png', width: 1920, height: 873 },
  { file: '03-escaneo-qr.png', width: 1920, height: 871 },
  { file: '04-calendario.png', width: 1920, height: 871 },
  { file: '05-admin-qr.png', width: 1920, height: 876 },
  { file: '06-hoja-hora.png', width: 1920, height: 871 },
  { file: '07-horarios.png', width: 1920, height: 871 },
  { file: '08-config-gps.png', width: 1920, height: 870 },
  { file: '09-users.png', width: 1920, height: 871 },
  { file: '10-bitacora.png', width: 1920, height: 874 },
  { file: '11-config-marcj.png', width: 1920, height: 873 },
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

  // The page still takes no form input and draws no inline vector art. Images are no
  // longer banned here: the walkthrough section documents the real screens, and its
  // dedicated test below enforces alt text, intrinsic size and existence on disk.
  assert.doesNotMatch(main, /<form\b|<input\b|<footer\b|<svg\b/i)
  assert.doesNotMatch(main, /\bhref\s*=\s*["']https?:\/\//i)

  assert.match(
    indexHtml,
    /<a\b[^>]*href=["'][^"']*caso-de-estudio\.html["'][^>]*>[\s\S]*?Caso de estudio[\s\S]*?<\/a>/i,
  )
})

test('the case study keeps the approved section order and headings', () => {
  const sections = getLabelledSections()

  assert.equal(sections.length, 8, 'the case study must expose exactly eight labelled sections')
  assert.deepEqual(
    sections.map((section) => section[1]),
    ['problema', 'restricciones', 'arquitectura', 'capacidades', 'recorrido-title', 'alternativas', 'que-salio-mal', 'resultado'],
    'the walkthrough must sit between the capabilities and the rejected alternatives',
  )

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

function getAttributes(tag) {
  const attributes = {}

  for (const attribute of tag.matchAll(/([a-zA-Z-]+)\s*=\s*["']([^"']*)["']/g)) {
    attributes[attribute[1].toLowerCase()] = attribute[2]
  }

  return attributes
}

test('the walkthrough section embeds the video and the real system screenshots', () => {
  const walkthrough = getSectionById('recorrido-title')
  const iframe = walkthrough.match(/<iframe\b[^>]*>/i)

  assert.notEqual(iframe, null, 'the walkthrough must embed the walkthrough video')
  const iframeAttributes = getAttributes(iframe[0])

  assert.equal(
    iframeAttributes.src,
    'https://www.youtube-nocookie.com/embed/m7SSIb143Vk',
    'the video must come from the privacy-preserving nocookie host',
  )
  assert.ok(
    (iframeAttributes.title ?? '').trim().length > 0,
    'the embedded video must carry a non-empty title for assistive technology',
  )
  assert.equal(iframeAttributes.loading, 'lazy', 'the video must load lazily')
  assert.match(iframe[0], /\ballowfullscreen\b/i, 'the video must be playable fullscreen')
  assert.match(iframe[0], /\baspect-video\b/, 'the video must be wrapped in a responsive aspect ratio')

  const images = [...walkthrough.matchAll(/<img\b[^>]*>/gi)]
  const sources = images.map((image) => getAttributes(image[0]).src)

  assert.equal(
    images.length,
    walkthroughScreenshots.length,
    'the walkthrough must show every documented screenshot',
  )
  assert.equal(new Set(sources).size, sources.length, 'the walkthrough must not repeat a screenshot')

  for (const [index, screenshot] of walkthroughScreenshots.entries()) {
    const attributes = getAttributes(images[index][0])

    assert.equal(
      attributes.src,
      `/images/${screenshot.file}`,
      `the walkthrough must show ${screenshot.file} in the approved order`,
    )
    assert.equal(
      existsSync(fileURLToPath(new URL(`../public/images/${screenshot.file}`, import.meta.url))),
      true,
      `${screenshot.file} must exist in public/images`,
    )
    assert.ok((attributes.alt ?? '').trim().length > 0, `${screenshot.file} must carry a non-empty alt`)
    assert.equal(
      Number(attributes.width),
      screenshot.width,
      `${screenshot.file} must declare its intrinsic width`,
    )
    assert.equal(
      Number(attributes.height),
      screenshot.height,
      `${screenshot.file} must declare its intrinsic height`,
    )
    assert.equal(attributes.loading, 'lazy', `${screenshot.file} must load lazily`)
    assert.equal(attributes.decoding, 'async', `${screenshot.file} must decode asynchronously`)
    assert.match(images[index][0], /\bw-full\b/, `${screenshot.file} must not overflow its column`)
  }

  const gridCells = walkthrough.match(/\bmin-w-0\b/g) ?? []
  assert.equal(
    gridCells.length,
    images.length,
    'every screenshot cell must carry min-w-0 so it can shrink below its content width',
  )
  assert.match(
    getText(walkthrough),
    /pantallas reales del sistema/i,
    'the walkthrough must caption the gallery as real system screens',
  )
  assert.doesNotMatch(
    walkthrough,
    /biom[eé]tric|reconocimiento\s+facial|facial/i,
    'the walkthrough must not reference facial recognition or biometrics',
  )

  const externalHosts = [
    ...new Set(
      [...html.matchAll(/\b(?:src|href)\s*=\s*["'](https?:\/\/[^"']+)["']/gi)].map((match) =>
        new URL(match[1]).host,
      ),
    ),
  ]
  assert.deepEqual(
    externalHosts,
    ['www.youtube-nocookie.com'],
    'the embedded video must remain the only external resource on the page',
  )
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
    'una entrada y una salida por jornada',
    'motivo principal fue económico',
    'Costo operativo cero',
    'cámara',
    'GPS',
    'turnos partidos',
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
  assert.ok(projectText.includes('reconocimiento biométrico facial en proceso de desarrollo'))
  assert.match(
    getText(getSectionById('arquitectura')),
    /biométrico facial[\s\S]{0,80}en desarrollo/i,
  )
})
