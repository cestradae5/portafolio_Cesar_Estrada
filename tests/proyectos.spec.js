import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

const approvedProject = {
  title: 'Sistema de asistencia Escolar',
  description:
    'Solución integral para gestionar y controlar la asistencia del personal docente mediante códigos QR estáticos con token rotativo, con reconocimiento biométrico facial en proceso de desarrollo. Permite generar reportes detallados por los días laborales del docente, y administrar horarios personalizados para los docentes.',
  repositoryStatus: 'Repositorio privado',
  imageSrc: '/images/projects/dashboard_kg.png',
  imageAlt: 'Vista previa del Sistema de asistencia Escolar',
  caseStudyHref: 'caso-de-estudio.html',
}

const approvedProjectAmsa = {
  title: 'Sistema de gestión de almacén AMSA',
  description:
    'Sistema web de gestión de almacén que reemplazó una aplicación de escritorio en Microsoft Access, liberando el acceso que dependía de llaves atadas al equipo original. Centraliza el inventario, las entradas y salidas de insumos y la tarjeta Kardex en una sola plataforma, con formulario 1-H en PDF, búsqueda semántica sobre vectores en PostgreSQL y bitácora de auditoría de solo agregado.',
  repositoryStatus: 'Repositorio privado',
  imageSrc: '/images/amsa/19-bitacora.png',
  imageAlt: 'Bitácora de auditoría del Sistema de gestión de almacén AMSA con los registros de actividad del sistema',
  caseStudyHref: 'caso-de-estudio-amsa.html',
}

// Both approved projects, in the order they render inside #proyectos. The card
// contract is per-project, so every assertion below iterates this list instead
// of reading cards[0] directly.
const approvedProjects = [approvedProject, approvedProjectAmsa]

function getProjectsSection() {
  const mainStart = html.indexOf('<main')
  const mainEnd = html.indexOf('</main>')

  assert.notEqual(mainStart, -1, 'the page must include a main landmark')
  assert.notEqual(mainEnd, -1, 'the page must close the main landmark')

  const main = html.slice(mainStart, mainEnd)
  const sections = [...main.matchAll(/<section\b[^>]*>/gi)].map((match) => match[0])

  assert.ok(sections.length >= 5, 'Proyectos must follow Inicio inside main')
  assert.match(sections[0], /\bid=["']inicio["']/i)
  assert.match(sections[1], /\bid=["']proyectos["']/i)
  assert.match(sections[1], /\baria-labelledby=["']proyectos-title["']/i)

  const sectionStart = html.indexOf(sections[1], mainStart)
  const sectionEnd = html.indexOf('</section>', sectionStart)

  assert.notEqual(sectionEnd, -1, 'the Proyectos section must be closed')
  return html.slice(sectionStart, sectionEnd + '</section>'.length)
}

function getText(markup) {
  return markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function getCards(proyectos) {
  const cards = proyectos.match(/<article\b[\s\S]*?<\/article>/gi) ?? []

  assert.equal(cards.length, 2, 'Proyectos must render exactly two project cards')
  return cards
}

function getButtons(card) {
  return [...card.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/gi)]
}

function getCaseStudyLink(card) {
  return [...card.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)]
}

function getAnchors(card) {
  return [...card.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']*)["'][^>]*>/gi)]
}

test('Proyectos follows Inicio with a labeled section and exactly two semantic cards', () => {
  const proyectos = getProjectsSection()
  const cards = getCards(proyectos)

  assert.match(
    proyectos,
    /<h2\b[^>]*\bid=["']proyectos-title["'][\s\S]*?Proyectos[\s\S]*?<\/h2>/i,
  )
  assert.equal(cards.length, 2)
})

test('the approved projects present only approved Spanish content and keep their repository private', () => {
  const cards = getCards(getProjectsSection())

  cards.forEach((project, index) => {
    const approved = approvedProjects[index]
    const label = approved.title
    const projectText = getText(project)

    assert.ok(projectText.includes(approved.title), `${label}: the approved project title must be present`)
    assert.ok(
      projectText.includes(approved.description),
      `${label}: the approved Spanish project description must be present`,
    )
    // The technology stack moved to the case study pages, where each layer travels with the
    // rationale that justifies it. The card keeps the narrative only: an inline stack here
    // duplicated the case study and squeezed the description into a denser, harder-to-read card.
    const stackMovedToCaseStudy = `${label}: the stack moved to the case study and must not render in the card`

    assert.doesNotMatch(project, /Arquitectura y Tecnologías/i, stackMovedToCaseStudy)
    assert.doesNotMatch(project, /Capas del sistema/i, stackMovedToCaseStudy)
    assert.doesNotMatch(project, /<dl\b/i, stackMovedToCaseStudy)
    assert.ok(
      projectText.includes(approved.repositoryStatus),
      `${label}: the private repository status must be plain text`,
    )
    assert.doesNotMatch(project, /https?:\/\//i)
    assert.doesNotMatch(project, /github\.com/i)
    assert.doesNotMatch(project, /\btarget\s*=/i)
    assert.match(
      project,
      new RegExp(`<img\\b[^>]*\\bsrc=["']${approved.imageSrc.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}["']`, 'i'),
      `${label}: the card must render its approved hero image`,
    )
    assert.match(
      project,
      new RegExp(`<img\\b[^>]*\\balt=["']${approved.imageAlt.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}["']`, 'i'),
      `${label}: the card hero must carry its approved alt text`,
    )
    assert.doesNotMatch(project, /<(?:picture|video|source)\b/i)
    assert.doesNotMatch(projectText, /solicitar acceso|captura|screenshot/i)
  })

  // Card one is guarded by name as well, so renaming the project or swapping the hero
  // cannot pass by editing only the approved-copy constant above.
  assert.match(cards[0], /<img\b[^>]*\bsrc=["']\/images\/projects\/dashboard_kg\.png["']/i)
  assert.match(cards[0], /<img\b[^>]*\balt=["']Vista previa del Sistema de asistencia Escolar["']/i)
})

test('the approved projects expose no dead action and each links its own case study', () => {
  const cards = getCards(getProjectsSection())

  cards.forEach((project, index) => {
    const approved = approvedProjects[index]
    const label = approved.title
    const buttons = getButtons(project)
    const caseStudyLinks = getCaseStudyLink(project)

    assert.doesNotMatch(project, /<form\b|\btype=["']submit["']/i)
    // The permanently disabled "Demo" button was removed: a control that can never be
    // activated reads as a broken link on a portfolio. The card now exposes a single
    // real destination instead of a mixture of live and dead actions.
    assert.equal(buttons.length, 0, `${label}: the approved project must not expose any native button`)
    assert.equal(
      caseStudyLinks.length,
      1,
      `${label}: the approved project must expose exactly one case study link`,
    )
    assert.match(caseStudyLinks[0][0], /Caso de estudio/i)
    assert.doesNotMatch(caseStudyLinks[0][0], /\bdisabled\b|\bon\w+\s*=/i)

    // No anchor other than the case study, and no inline event handler anywhere in the card.
    // Each card points at its own page, so the destination is asserted per project rather
    // than globally: a single fixed pattern could not tell the two case studies apart.
    const anchors = getAnchors(project)

    assert.equal(anchors.length, 1, `${label}: the card must expose exactly one href`)
    assert.equal(
      anchors[0][1],
      approved.caseStudyHref,
      `${label}: the only href in the card must point at its own case study`,
    )
    assert.ok(
      anchors.every((anchor) => anchor[1].toLowerCase().endsWith(approved.caseStudyHref.toLowerCase())),
      `${label}: the only href in the card must point at the case study`,
    )
    assert.doesNotMatch(project, /\son[a-z]+\s*=/i, `${label}: the card must not use inline event handlers`)
  })

  // The two case studies are distinct documents: neither card may borrow the other's page.
  assert.notEqual(
    approvedProjects[0].caseStudyHref,
    approvedProjects[1].caseStudyHref,
    'each project must link to its own case study page',
  )
})

test('Proyectos uses token-backed cards side by side on large screens and wraps essential copy', () => {
  const proyectos = getProjectsSection()
  const cards = getCards(proyectos)

  assert.match(proyectos, /\bgrid\b/)
  // One column on mobile, two from the lg breakpoint. The single-column stack was an
  // earlier deliberate decision, now explicitly reversed: the cards were shrunk so the
  // two of them read as one row instead of competing for the full width. This assertion
  // now guards the two-column layout rather than forbidding it.
  assert.match(proyectos, /\bgrid-cols-1\b/)
  assert.match(proyectos, /\blg:grid-cols-2\b/)
  assert.match(proyectos, /\bgap-6\b/)
  assert.ok(cards.every((card) => /\bmin-w-0\b/.test(card)))
  assert.ok(
    cards.every((card) => /\bbreak-words\b/.test(card)),
    'every card must wrap its description so long words cannot break the layout',
  )
  assert.ok(cards.every((card) => /\brounded-project-card\b/.test(card)))
  assert.match(css, /--md-sys-shape-corner-medium:/)
  assert.match(css, /--radius-project-card:\s*var\(--md-sys-shape-corner-medium\)/)
})