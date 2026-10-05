import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const html = readFileSync(new URL('../caso-de-estudio-amsa.html', import.meta.url), 'utf8')
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
// Intrinsic sizes are asserted so a wrong width/height pair cannot reintroduce layout
// shift. The values are measured per file, not assumed uniform: three frames are
// 1917 px wide and the rest are 1918 px.
const walkthroughScreenshots = [
  { file: '01-login.png', width: 1918, height: 876 },
  { file: '02-dashboard.png', width: 1918, height: 882 },
  { file: '03-usuarios.png', width: 1918, height: 883 },
  { file: '04-importar-alm.png', width: 1918, height: 880 },
  { file: '05-inventario.png', width: 1918, height: 882 },
  { file: '06-kardex.png', width: 1918, height: 874 },
  { file: '07-producto.png', width: 1918, height: 883 },
  { file: '08-productoNEW.png', width: 1918, height: 880 },
  { file: '09-catalogo-prod.png', width: 1918, height: 877 },
  { file: '10-entrada.png', width: 1917, height: 880 },
  { file: '11-entradaNEW.png', width: 1918, height: 877 },
  { file: '12-descarga-format1h.png', width: 1918, height: 939 },
  { file: '13-salidas.png', width: 1917, height: 880 },
  { file: '14-salida-tot.png', width: 1918, height: 882 },
  { file: '15-salida-tot-pdf.png', width: 1918, height: 936 },
  { file: '16-salida-parcial.png', width: 1918, height: 880 },
  { file: '17-salida-pdf-par.png', width: 1918, height: 877 },
  { file: '18-kardex.png', width: 1918, height: 880 },
  { file: '19-bitacora.png', width: 1917, height: 880 },
  { file: '20-miperfil.png', width: 1918, height: 880 },
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

test('the AMSA case study is a standalone Spanish document linked from the portfolio', () => {
  const main = getMain()
  const headings = [...html.matchAll(/<h1\b[^>]*>([\s\S]*?)<\/h1>/gi)]
  const backLinks = getBackLink()

  assert.match(html, /<html\b[^>]*\blang=["']es["']/i)

  assert.equal(headings.length, 1, 'the case study must expose exactly one h1')
  assert.ok(
    getText(headings[0][0]).includes('Sistema de gestión de almacén AMSA'),
    'the h1 must be the project name',
  )

  assert.equal(backLinks.length, 1, 'the case study must expose one link back to the portfolio')
  assert.match(getText(backLinks[0][0]), /Portafolio/i)
  assert.doesNotMatch(backLinks[0][0], /\btarget\s*=/i)
  assert.doesNotMatch(backLinks[0][0], /\bhref\s*=\s*["'](?:https?:)?\/\//i)

  // The page takes no form input, draws no inline vector art and links out to nowhere:
  // the walkthrough is the only place allowed to reference an external host.
  assert.doesNotMatch(main, /<form\b|<input\b|<footer\b|<svg\b/i)
  assert.doesNotMatch(main, /\bhref\s*=\s*["']https?:\/\//i)

  assert.match(
    indexHtml,
    /<a\b[^>]*href=["'][^"']*caso-de-estudio-amsa\.html["'][^>]*>[\s\S]*?Caso de estudio[\s\S]*?<\/a>/i,
  )
})

test('the AMSA case study keeps the approved section order and headings', () => {
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

test('the AMSA walkthrough embeds the video and the real system screenshots', () => {
  const walkthrough = getSectionById('recorrido-title')
  const iframe = walkthrough.match(/<iframe\b[^>]*>/i)

  assert.notEqual(iframe, null, 'the walkthrough must embed the walkthrough video')
  const iframeAttributes = getAttributes(iframe[0])

  assert.equal(
    iframeAttributes.src,
    'https://www.youtube-nocookie.com/embed/rXcqIQCf_Ak',
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
      `/images/amsa/${screenshot.file}`,
      `the walkthrough must show ${screenshot.file} in the approved order`,
    )
    assert.match(
      attributes.src,
      /^\/images\/amsa\/[^/]+$/,
      `${screenshot.file} must be served from the AMSA image directory`,
    )
    assert.equal(
      existsSync(fileURLToPath(new URL(`../public/images/amsa/${screenshot.file}`, import.meta.url))),
      true,
      `${screenshot.file} must exist in public/images/amsa`,
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
    /captura|screenshot/i,
    'the walkthrough must describe its own screens without resorting to "captura" or "screenshot"',
  )
  // Page-wide, not only inside the walkthrough: no screen may ever be introduced with
  // that word anywhere in the copy.
  assert.doesNotMatch(
    html,
    /\bcapturas?\b|screenshot/i,
    'the case study must not use "captura" or "screenshot" anywhere in its copy',
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

test('the AMSA case study documents the approved technical claims', () => {
  const pageText = getText(getMain())
  const architectureText = getText(getSectionById('arquitectura'))
  const capabilityText = getText(getSectionById('capacidades'))

  for (const claim of [
    'pgvector',
    'HNSW',
    'sentence-transformers',
    'stock_base',
    'stock_actual',
    'Kardex',
    'Nginx',
    'RBAC',
    'rclone',
    'Sentry',
    '1-H',
  ]) {
    assert.ok(pageText.includes(claim), `the case study must document "${claim}"`)
  }

  // The four approved layers travel with the exact technologies the project uses.
  for (const [layer, technologies] of Object.entries({
    Frontend: ['Django Templates', 'Tailwind CSS (CDN)', 'Alpine.js (CDN)'],
    Backend: ['Python', 'Django', 'ReportLab', 'Redis', 'Sentry', 'sentence-transformers'],
    'Base de Datos': ['PostgreSQL', 'pgvector', 'volúmenes persistentes'],
    Seguridad: ['Nginx como reverse proxy', 'CSRF', 'RBAC', 'backups con rclone'],
  })) {
    assert.ok(architectureText.includes(layer), `the architecture section must name the ${layer} layer`)

    for (const technology of technologies) {
      assert.ok(
        architectureText.includes(technology),
        `the ${layer} layer must list ${technology}`,
      )
    }
  }

  // The four layers read as one compact row instead of a 2x2 block, so the section keeps the
  // same footprint on both case study pages. Scoped to the architecture markup: a grid-cols-4
  // anywhere else on the page would not move these cards.
  assert.match(
    getSectionById('arquitectura'),
    /sm:grid-cols-4/,
    'the layer cards must render side by side in a single four-column row',
  )

  // The strongest specificity in the approved narrative must survive into the page.
  //
  // REMOVED 2026-09-30 by explicit user decision, not by oversight. Section 4.4 was rewritten to
  // present the Kardex as a movement report (filters, automatic opening balance, entry and exit
  // columns, PDF download). 'UNION ALL', 'SUM() OVER()' and '5000' documented the adaptive volume
  // strategy below and above the 5000-movement threshold. The user was shown the cost and chose to
  // accept the loss rather than re-add the sentence. Rationale in odd/tasks/almacen-amsa-case-study.md.
  // If these come back, it is because the copy documents them again — not because a test was missed.
  //
  // REMOVED 2026-09-30 by explicit user decision, same reasoning. 'stock_anterior' and 'stock_nuevo'
  // documented the inventory-adjustment module (4.6), which the user removed from the case study
  // entirely. The module is out of scope for the published narrative; the claim list follows.
  //
  // REMOVED 2026-09-30 by explicit user decision, same reasoning. 'PermissionError' documented the
  // append-only three-layer audit log (model QuerySet, Admin permissions set to False, PostgreSQL
  // trigger). Section 4.6 was rewritten to present the audit trail as a user-facing capability —
  // recorded actions, logins, downloads, filters by user/date/action/module — which is what the
  // screen actually offers. The implementation detail is no longer claimed anywhere.
  for (const claim of [
    'intfloat/multilingual-e5-small',
    '384 dimensiones',
    'coseno',
    'Producto.save()',
    'tres solicitudes cada 24 horas',
    'web:8000',
    'db:5432',
    'redis:6379',
  ]) {
    assert.ok(capabilityText.includes(claim) || pageText.includes(claim), `the case study must document "${claim}"`)
  }
})

test('the AMSA case study keeps the token-backed, responsive and keyboard-accessible contract', () => {
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

test('the build config registers all three pages and the AMSA card agrees with its case study', () => {
  assert.match(viteConfig, /rollupOptions\s*:/)
  assert.match(viteConfig, /input\s*:/)
  assert.match(viteConfig, /index\.html/)
  assert.match(viteConfig, /caso-de-estudio\.html/)
  assert.match(viteConfig, /caso-de-estudio-amsa\.html/)

  // The card is located by the case-study link it owns, not by its hero image. The link is the
  // invariant that actually identifies this project (proyectos.spec.js asserts one href per card,
  // each pointing at its own case study), so swapping the hero image cannot silently detach this
  // assertion from the card it guards.
  const card = indexHtml.match(/<article\b(?:(?!<\/article>)[\s\S])*?caso-de-estudio-amsa\.html[\s\S]*?<\/article>/i)

  assert.notEqual(card, null, 'index.html must render the AMSA card')
  assert.match(getText(card[0]), /Sistema de gestión de almacén AMSA/)
  assert.match(
    getText(getSectionById('arquitectura')),
    /Django Templates[\s\S]{0,400}PostgreSQL[\s\S]{0,400}Nginx como reverse proxy/,
  )
})