import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

const approvedProject = {
  title: 'Sistema de asistencia Escolar',
  description:
    'Solución integral para gestionar y controlar la asistencia del personal docente mediante códigos QR dinámicos y reconocimiento biométrico facial. Permite generar reportes detallados por día, semana y mes, y administrar horarios personalizados por usuario.',
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

  assert.ok(sections.length >= 2, 'Proyectos must follow Inicio inside main')
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

function getDisabledActions(card) {
  return [...card.matchAll(/<button\b[^>]*>[\s\S]*?<\/button>/gi)]
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
  assert.doesNotMatch(project, /<a\b|\bhref\s*=|https?:\/\/|github\.com/i)
  assert.match(project, /<img\b[^>]*\bsrc=["']\/images\/projects\/dashboard_kg\.png["']/i)
  assert.match(project, /<img\b[^>]*\balt=["']Vista previa del Sistema de asistencia Escolar["']/i)
  assert.doesNotMatch(project, /<(?:picture|video|source)\b/i)
  assert.doesNotMatch(projectText, /solicitar acceso|captura|screenshot/i)
})

test('the placeholder stays minimal and every unavailable action is a disabled native button', () => {
  const cards = getCards(getProjectsSection())
  const [, placeholder] = cards
  const placeholderText = getText(placeholder)

  assert.equal(placeholderText, 'Próximamente Demo Caso de estudio')
  assert.doesNotMatch(placeholder, /<a\b|\bhref\s*=|\bon\w+\s*=|<form\b|\btype=["']submit["']/i)
  assert.match(placeholder, /<img\b[^>]*\bsrc=["']\/images\/projects\/login_kg\.png["']/i)
  assert.match(placeholder, /<img\b[^>]*\balt=["']Vista previa del próximo proyecto["']/i)

  for (const card of cards) {
    const actions = getDisabledActions(card)

    assert.equal(actions.length, 2, 'each card must expose exactly two unavailable actions')
    assert.ok(actions.some((action) => /\bDemo\b/i.test(action[0])))
    assert.ok(actions.some((action) => /Caso de estudio/i.test(action[0])))

    for (const action of actions) {
      assert.match(action[0], /\btype=["']button["']/i)
      assert.match(action[0], /\bdisabled\b/i)
      assert.doesNotMatch(action[0], /\bhref\s*=|\bon\w+\s*=/i)
    }
  }
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
