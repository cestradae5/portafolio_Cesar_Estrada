import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

const repositoryUrl = 'https://github.com/Gentleman-Programming/gentle-ai'
const badgeSrc = '/images/brand/built-with-gentle-ai.png'

// The section documents both Gentle-AI methodologies: ODD is the default everyday flow and SDD is
// entered when the problem is large or open, so the approved copy is per-methodology and a swapped
// or invented step title fails instead of passing as generic filler.
const oddSteps = [
  'Primero se confirma que el cambio está pedido.',
  'Después se lee lo que ya existe.',
  'Lo simple no deja documentos.',
  'Cada tarea se cierra sola.',
]

const sddSteps = [
  'Primero se escribe, no se programa.',
  'El plan se convierte en tareas con orden.',
  'Cada etapa se audita antes de pasar a la siguiente.',
  'El riesgo decide cuánto se revisa.',
]

const methodBlockTitles = [
  'ODD: el flujo de todos los días',
  'SDD: cuando el problema exige un plan escrito',
]

function getMainSections() {
  const mainStart = html.indexOf('<main')
  const mainEnd = html.indexOf('</main>')

  assert.notEqual(mainStart, -1, 'the page must include a main landmark')
  assert.notEqual(mainEnd, -1, 'the page must close the main landmark')

  const main = html.slice(mainStart, mainEnd)
  return [...main.matchAll(/<section\b[^>]*>/gi)].map((match) => match[0])
}

function getMetodoSection() {
  const mainStart = html.indexOf('<main')
  const sections = getMainSections()

  const sectionStart = html.indexOf(sections[3], mainStart)

  assert.notEqual(sectionStart, -1, 'the Metodo section must be declared')
  const sectionEnd = html.indexOf('</section>', sectionStart)

  assert.notEqual(sectionEnd, -1, 'the Metodo section must be closed')
  return html.slice(sectionStart, sectionEnd + '</section>'.length)
}

function getText(markup) {
  return markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function getStepLists(metodo) {
  const lists = [...metodo.matchAll(/<ol\b[\s\S]*?<\/ol>/gi)].map((match) => match[0])

  return lists.map((list) => [...list.matchAll(/<li\b[\s\S]*?<\/li>/gi)].map((item) => item[0]))
}

function getBlockTitles(metodo) {
  const withoutSteps = metodo.replace(/<li\b[\s\S]*?<\/li>/gi, '')

  return [...withoutSteps.matchAll(/<h3\b[^>]*>[\s\S]*?<\/h3>/gi)].map((match) => getText(match[0]))
}

function getBadgeAnchor(metodo) {
  const anchors = [...metodo.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)].map((match) => match[0])
  const badges = anchors.filter((anchor) => anchor.includes(`href="${repositoryUrl}"`))

  assert.equal(badges.length, 1, 'the badge must be a single link to the Gentle-AI repository')
  return badges[0]
}

test('Metodo follows Proyectos and precedes Contacto inside main', () => {
  const sections = getMainSections()

  assert.ok(
    sections.length >= 5,
    'main must expose Inicio, Habilidades, Proyectos, Metodo and Contacto in order',
  )
  assert.match(sections[0], /\bid=["']inicio["']/i)
  assert.match(sections[1], /\bid=["']habilidades["']/i)
  assert.match(sections[2], /\bid=["']proyectos["']/i)
  assert.match(sections[3], /\bid=["']metodo["']/i)
  assert.match(sections[3], /\baria-labelledby=["']metodo-title["']/i)
  assert.match(sections[4], /\bid=["']contacto["']/i)

  const metodo = getMetodoSection()
  const heading = metodo.match(/<h2\b[^>]*\bid=["']metodo-title["'][\s\S]*?<\/h2>/i)

  assert.ok(heading, 'Metodo must expose its own labelled heading')
  assert.match(getText(heading[0]), /Cómo trabajo/)
})

test('Metodo states the method without claiming to build AI products', () => {
  const metodo = getMetodoSection()
  const metodoText = getText(metodo)

  assert.match(metodoText, /ODD/)
  assert.match(metodoText, /No desarrollo productos de inteligencia artificial/)
  assert.match(metodoText, /herramienta de desarrollo/)
  assert.match(metodoText, /desarrollo guiado por especificación/)
  assert.match(metodoText, /artefactos persistentes/)
  assert.match(metodoText, /dependencias explícitas/)
  assert.match(metodoText, /evaluación de riesgo/)
  assert.match(metodoText, /es de la persona/)

  assert.deepEqual(
    getBlockTitles(metodo),
    methodBlockTitles,
    'the method must introduce ODD as the default flow and SDD as the planned one, in that order',
  )

  const stepLists = getStepLists(metodo)
  assert.equal(stepLists.length, 2, 'the method must document exactly two ordered lists')

  const approvedPerList = [oddSteps, sddSteps]

  for (const [listIndex, steps] of stepLists.entries()) {
    const approved = approvedPerList[listIndex]

    assert.equal(
      steps.length,
      4,
      `the "${methodBlockTitles[listIndex]}" list must describe exactly four steps`,
    )

    for (const [stepIndex, step] of steps.entries()) {
      const stepTitle = step.match(/<h4\b[^>]*>[\s\S]*?<\/h4>/i)
      assert.ok(stepTitle, 'every step must carry a heading')

      const title = getText(stepTitle[0])
      assert.equal(
        title,
        approved[stepIndex],
        `the approved titles for "${methodBlockTitles[listIndex]}" are ${approved.join(', ')} but step ${stepIndex + 1} reads "${title}"`,
      )
    }
  }

  assert.doesNotMatch(
    metodoText,
    /\b(\d+)\s+tests?\b/i,
    'the visible copy must not pin a test count that goes stale on the next added test',
  )
  assert.doesNotMatch(metodoText, /\b(senior|expert|experto|avanzado)\b/i)
})

test('Metodo credits Gentle-AI with a locally served badge', () => {
  const metodo = getMetodoSection()
  const badge = getBadgeAnchor(metodo)
  const badgeImage = badge.match(/<img\b[^>]*>/i)

  assert.ok(badgeImage, 'the attribution link must render the badge image')
  assert.match(badgeImage[0], new RegExp(`\\bsrc=["']${badgeSrc}["']`, 'i'))

  const alt = badgeImage[0].match(/\balt=["']([^"']*)["']/i)
  assert.ok(alt, 'the badge must declare alternative text')
  assert.ok(alt[1].trim().length > 0, 'the badge alternative text must not be empty')
  assert.match(alt[1], /Construido con Gentle-AI/)

  const subtitleAt = metodo.indexOf('La metodología descrita se implementa con Gentle-AI')
  assert.notEqual(subtitleAt, -1, 'the attribution must state the credit in text')
  assert.ok(
    subtitleAt < metodo.indexOf(`href="${repositoryUrl}"`),
    'the credit subtitle must precede the badge image',
  )

  assert.match(badgeImage[0], /\bwidth=["']220["']/i)
  assert.match(badgeImage[0], /\bheight=["']95["']/i)
  assert.doesNotMatch(
    metodo,
    /raw\.githubusercontent\.com/i,
    'the badge must be served from the local public directory',
  )
  assert.doesNotMatch(badge, /\btarget\s*=/i)
})

test('Metodo keeps the token-backed, responsive and keyboard-accessible contract', () => {
  const metodo = getMetodoSection()
  const badge = getBadgeAnchor(metodo)
  const badgeImage = badge.match(/<img\b[^>]*>/i)[0]

  assert.match(metodo, /\bpx-6\b/)
  assert.match(metodo, /\bsm:px-8\b/)
  assert.match(metodo, /\bmax-w-3xl\b/)
  assert.match(metodo, /\brounded-project-card\b/)
  assert.match(metodo, /\brounded-hero-action\b/)

  for (const step of getStepLists(metodo).flat()) {
    assert.match(step, /\bborder\b.*\bborder-outline-variant\b/)
    assert.match(step, /\bbg-surface-container\b/)
    assert.match(step, /\brounded-project-card\b/)
    assert.match(step, /\bp-6\b/)
    assert.match(step, /\bsm:p-8\b/)

    const stepHeading = step.match(/<h4\b[^>]*>/i)[0]
    assert.match(stepHeading, /\btext-base\b/)
    assert.match(stepHeading, /\bfont-semibold\b/)
    assert.match(stepHeading, /\btext-secondary\b/)

    const stepBody = step.match(/<p\b[^>]*>/i)[0]
    assert.match(stepBody, /\bmt-2\b/)
    assert.match(stepBody, /\btext-sm\b/)
    assert.match(stepBody, /\bleading-6\b/)
    assert.match(stepBody, /\btext-on-surface-variant\b/)
  }

  assert.match(badge, /\bmin-h-12\b/)
  assert.match(badge, /focus-visible:outline-4/)
  assert.match(badge, /focus-visible:outline-offset-4/)
  assert.match(badge, /focus-visible:outline-focus/)
  assert.match(badge, /motion-reduce:transition-none/)
  assert.match(badgeImage, /loading=["']lazy["']/)

  assert.match(css, /--md-sys-shape-corner-full:/)
  assert.match(css, /--radius-hero-action:\s*var\(--md-sys-shape-corner-full\)/)
  assert.match(css, /--md-sys-motion-easing-standard:/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
})
