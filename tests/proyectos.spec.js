import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

const approvedProject = {
  title: 'Sistema de asistencia Escolar',
  description:
    'Solución integral para gestionar y controlar la asistencia del personal docente mediante códigos QR estáticos con token rotativo, con reconocimiento biométrico facial en proceso de desarrollo. Permite generar reportes detallados por los días laborales del docente, y administrar horarios personalizados para los docentes.',
  stackLayers: {
    Frontend: ['React.js', 'Vite', 'Tailwind CSS', 'Lucide Icons'],
    Backend: ['Express.js'],
    'Base de Datos': ['PostgreSQL relacional'],
    Seguridad: ['JWT', 'Google Auth'],
  },
  repositoryStatus: 'Repositorio privado',
  imageSrc: '/images/projects/dashboard_kg.png',
}

function getProjectsSection() {
  const mainStart = html.indexOf('<main')
  const mainEnd = html.indexOf('</main>')

  assert.notEqual(mainStart, -1, 'the page must include a main landmark')
  assert.notEqual(mainEnd, -1, 'the page must close the main landmark')

  const main = html.slice(mainStart, mainEnd)
  const sections = [...main.matchAll(/<section\b[^>]*>/gi)].map((match) => match[0])

  assert.ok(sections.length >= 4, 'Proyectos must follow Habilidades inside main')
  assert.match(sections[0], /\bid=["']inicio["']/i)
  assert.match(sections[1], /\bid=["']habilidades["']/i)
  assert.match(sections[2], /\bid=["']proyectos["']/i)
  assert.match(sections[2], /\baria-labelledby=["']proyectos-title["']/i)

  const sectionStart = html.indexOf(sections[2], mainStart)
  const sectionEnd = html.indexOf('</section>', sectionStart)

  assert.notEqual(sectionEnd, -1, 'the Proyectos section must be closed')
  return html.slice(sectionStart, sectionEnd + '</section>'.length)
}

function getText(markup) {
  return markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function getCards(proyectos) {
  const cards = proyectos.match(/<article\b[\s\S]*?<\/article>/gi) ?? []

  assert.equal(cards.length, 1, 'Proyectos must render exactly one project card')
  return cards
}

function getButtons(card) {
  return [...card.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/gi)]
}

function getCaseStudyLink(card) {
  return [...card.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)]
}

test('Proyectos follows Inicio with a labeled section and exactly one semantic card', () => {
  const proyectos = getProjectsSection()
  const cards = getCards(proyectos)

  assert.match(
    proyectos,
    /<h2\b[^>]*\bid=["']proyectos-title["'][\s\S]*?Proyectos[\s\S]*?<\/h2>/i,
  )
  assert.equal(cards.length, 1)
})

test('the approved project presents only approved Spanish content and keeps its repository private', () => {
  const [project] = getCards(getProjectsSection())
  const projectText = getText(project)

  assert.ok(projectText.includes(approvedProject.title), 'the approved project title must be present')
  assert.ok(
    projectText.includes(approvedProject.description),
    'the approved Spanish project description must be present',
  )
  for (const [layer, technologies] of Object.entries(approvedProject.stackLayers)) {
    assert.ok(projectText.includes(layer), `the stack must include the ${layer} layer`)

    for (const technology of technologies) {
      assert.ok(
        projectText.includes(technology),
        `${technology} must be listed under the project stack`,
      )
    }
  }
  assert.ok(
    projectText.includes(approvedProject.repositoryStatus),
    'the private repository status must be plain text',
  )
  assert.doesNotMatch(project, /https?:\/\//i)
  assert.doesNotMatch(project, /github\.com/i)
  assert.doesNotMatch(project, /\btarget\s*=/i)
  assert.match(project, /<img\b[^>]*\bsrc=["']\/images\/projects\/dashboard_kg\.png["']/i)
  assert.match(project, /<img\b[^>]*\balt=["']Vista previa del Sistema de asistencia Escolar["']/i)
  assert.doesNotMatch(project, /<(?:picture|video|source)\b/i)
  assert.doesNotMatch(projectText, /solicitar acceso|captura|screenshot/i)
})

test('the approved project exposes no dead action and links the case study', () => {
  const [project] = getCards(getProjectsSection())
  const buttons = getButtons(project)
  const caseStudyLinks = getCaseStudyLink(project)

  assert.doesNotMatch(project, /<form\b|\btype=["']submit["']/i)
  // The permanently disabled "Demo" button was removed: a control that can never be
  // activated reads as a broken link on a portfolio. The card now exposes a single
  // real destination instead of a mixture of live and dead actions.
  assert.equal(buttons.length, 0, 'the approved project must not expose any native button')
  assert.equal(caseStudyLinks.length, 1, 'the approved project must expose exactly one case study link')
  assert.match(caseStudyLinks[0][0], /Caso de estudio/i)
  assert.match(caseStudyLinks[0][0], /\bhref=["'][^"']*caso-de-estudio\.html["']/i)
  assert.doesNotMatch(caseStudyLinks[0][0], /\bdisabled\b|\bon\w+\s*=/i)

  // No anchor other than the case study, and no inline event handler anywhere in the card.
  const anchors = [...project.matchAll(/<a\b[^>]*\bhref\s*=\s*["']([^"']*)["'][^>]*>/gi)]
  assert.equal(anchors.length, 1, 'the card must expose exactly one href')
  assert.ok(
    anchors.every((anchor) => /caso-de-estudio\.html$/i.test(anchor[1])),
    'the only href in the card must point at the case study',
  )
  assert.doesNotMatch(project, /\son[a-z]+\s*=/i, 'the card must not use inline event handlers')
})

test('Proyectos uses token-backed cards stacked in a single column and wraps essential copy', () => {
  const proyectos = getProjectsSection()
  const cards = getCards(proyectos)

  assert.match(proyectos, /\bgrid\b/)
  assert.match(proyectos, /\bgrid-cols-1\b/)
  assert.doesNotMatch(proyectos, /\blg:grid-cols-2\b/)
  assert.match(proyectos, /\bgap-6\b/)
  assert.ok(cards.every((card) => /\bmin-w-0\b/.test(card)))
  assert.match(cards[0], /\bbreak-words\b/)
  assert.ok(cards.every((card) => /\brounded-project-card\b/.test(card)))
  assert.match(css, /--md-sys-shape-corner-medium:/)
  assert.match(css, /--radius-project-card:\s*var\(--md-sys-shape-corner-medium\)/)
})
