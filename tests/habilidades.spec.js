import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

const approvedSkills = [
  'Desarrollo Web',
  'IA y Agentes',
  'JavaScript',
  'HTML',
  'CSS',
  'SQL',
  'Python',
  'React',
  'Node.js',
  'Express',
  'Tailwind CSS',
  'Vite',
  'Django',
  'PHP',
  'PostgreSQL',
  'MySQL',
  'JWT',
  'Google OAuth',
  'Docker',
  'Git',
  'GitHub',
  'Claude Code',
  'OpenCode',
  'Engram',
  'SDD',
  'Gemini',
  'HuggingFace',
]

const approvedSubgroups = [
  'Lenguajes',
  'Frameworks y librerías',
  'Bases de datos',
  'Seguridad y acceso',
  'Infraestructura',
  'Herramientas',
  'Orquestación',
  'Gestión de contexto',
  'Metodología',
  'Ecosistema',
]

function getMainSections() {
  const mainStart = html.indexOf('<main')
  const mainEnd = html.indexOf('</main>')

  assert.notEqual(mainStart, -1, 'the page must include a main landmark')
  assert.notEqual(mainEnd, -1, 'the page must close the main landmark')

  const main = html.slice(mainStart, mainEnd)
  return [...main.matchAll(/<section\b[^>]*>/gi)].map((match) => match[0])
}

function getHabilidadesSection() {
  const sections = getMainSections()
  // Resolved by id, not by position: reordering sections must never make this
  // helper silently read a different section.
  const index = sections.findIndex((section) => /\bid=["']habilidades["']/i.test(section))

  assert.notEqual(index, -1, 'the Habilidades section must be declared')

  const sectionStart = html.indexOf(sections[index], html.indexOf('<main'))
  const sectionEnd = html.indexOf('</section>', sectionStart)

  assert.notEqual(sectionEnd, -1, 'the Habilidades section must be closed')
  return html.slice(sectionStart, sectionEnd + '</section>'.length)
}

function getText(markup) {
  return markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function getTracks(habilidades) {
  return [...habilidades.matchAll(/<article\b[\s\S]*?<\/article>/gi)].map((match) => match[0])
}

test('Habilidades follows Proyectos and precedes Metodo inside main', () => {
  const sections = getMainSections()

  assert.ok(
    sections.length >= 5,
    'main must expose Inicio, Proyectos, Habilidades, Metodo and Contacto in order',
  )
  assert.match(sections[0], /\bid=["']inicio["']/i)
  assert.match(sections[1], /\bid=["']proyectos["']/i)
  assert.match(sections[2], /\bid=["']habilidades["']/i)
  assert.match(sections[2], /\baria-labelledby=["']habilidades-title["']/i)
  assert.match(sections[3], /\bid=["']metodo["']/i)

  const habilidades = getHabilidadesSection()

  assert.match(
    habilidades,
    /<h2\b[^>]*\bid=["']habilidades-title["'][\s\S]*?Habilidades[\s\S]*?<\/h2>/i,
  )

  const intro = habilidades.match(/<p\b[^>]*>[\s\S]*?<\/p>/i)
  assert.ok(intro, 'Habilidades must open with a descriptive paragraph')

  const introText = getText(intro[0])
  assert.match(introText, /desarrollo web/i)
  assert.match(introText, /inteligencia artificial/i)
})

test('Habilidades presents the two approved tracks with their documented skills', () => {
  const habilidadesText = getText(getHabilidadesSection())

  for (const skill of approvedSkills) {
    assert.ok(habilidadesText.includes(skill), `Habilidades must document ${skill}`)
  }

  for (const subgroup of approvedSubgroups) {
    assert.ok(
      habilidadesText.includes(subgroup),
      `Habilidades must expose the ${subgroup} subgroup`,
    )
  }
})

test('Habilidades states no self-assessed proficiency levels', () => {
  const habilidades = getHabilidadesSection()
  const habilidadesText = getText(habilidades)

  assert.doesNotMatch(habilidadesText, /\b\d{1,3}\s?%/i, 'no self-assessed percentage bars')
  assert.doesNotMatch(
    habilidadesText,
    /\b(nivel|level|basico|básico|intermedio|avanzado|experto|expert|senior|junior)\b/i,
    'no self-assessed proficiency labels',
  )
  assert.doesNotMatch(habilidades, /progress|bar|rating/i)
})

test('Habilidades keeps the token-backed, responsive and keyboard-accessible contract', () => {
  const habilidades = getHabilidadesSection()
  const tracks = getTracks(habilidades)

  assert.equal(tracks.length, 2, 'Habilidades must expose exactly two track articles')

  assert.match(habilidades, /\bpx-6\b/)
  assert.match(habilidades, /\bsm:px-8\b/)
  assert.match(habilidades, /\bgrid-cols-1\b/)
  assert.match(habilidades, /\bsm:grid-cols-2\b/)
  assert.doesNotMatch(habilidades, /\blg:grid-cols-2\b/)
  assert.match(habilidades, /\bgap-6\b/)
  assert.match(habilidades, /\brounded-project-card\b/)
  assert.ok(
    tracks.every((track) => /\bmin-w-0\b/.test(track)),
    'every track must stay shrinkable inside the grid',
  )

  const subgroupLabels = [...habilidades.matchAll(/<dt\b[^>]*>/gi)].map((match) => match[0])
  assert.equal(
    subgroupLabels.length,
    approvedSubgroups.length,
    'every documented subgroup must render exactly one dt',
  )
  assert.ok(
    subgroupLabels.every((label) => /uppercase tracking-wide text-secondary/.test(label)),
    'every subgroup label must use the shared token-backed label treatment',
  )

  assert.match(css, /--md-sys-shape-corner-medium:/)
  assert.match(css, /--radius-project-card:\s*var\(--md-sys-shape-corner-medium\)/)
  assert.match(css, /--md-sys-motion-easing-standard:/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(css, /background-color:\s*var\(--md-sys-color-surface\)/)
})
