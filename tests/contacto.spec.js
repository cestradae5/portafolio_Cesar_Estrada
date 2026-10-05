import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const css = readFileSync(new URL('../src/styles.css', import.meta.url), 'utf8')

const approvedContact = {
  emails: ['cesarestradaelias2003@gmail.com', 'cestradae5@miumg.edu.gt'],
  phoneDisplay: '502 4706 9196',
  phoneHref: 'tel:+50247069196',
  githubUrl: 'https://github.com/cestradae5',
  linkedinUrl: 'https://www.linkedin.com/in/cesar-estrada-elias-46731a219/',
  address: 'Zona 11 — Guatemala City, Guatemala',
}

function getContactoSection() {
  const mainStart = html.indexOf('<main')
  const mainEnd = html.indexOf('</main>')

  assert.notEqual(mainStart, -1, 'the page must include a main landmark')
  assert.notEqual(mainEnd, -1, 'the page must close the main landmark')

  const main = html.slice(mainStart, mainEnd)
  const sections = [...main.matchAll(/<section\b[^>]*>/gi)].map((match) => match[0])

  assert.ok(sections.length >= 5, 'Contacto must follow Metodo inside main')
  assert.match(sections[0], /\bid=["']inicio["']/i)
  assert.match(sections[1], /\bid=["']proyectos["']/i)
  assert.match(sections[2], /\bid=["']habilidades["']/i)
  assert.match(sections[3], /\bid=["']metodo["']/i)
  assert.match(sections[4], /\bid=["']contacto["']/i)
  assert.match(sections[4], /\baria-labelledby=["']contacto-title["']/i)

  const sectionStart = html.indexOf(sections[4], mainStart)
  const sectionEnd = html.indexOf('</section>', sectionStart)

  assert.notEqual(sectionEnd, -1, 'the Contacto section must be closed')
  return html.slice(sectionStart, sectionEnd + '</section>'.length)
}

function getText(markup) {
  return markup.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim()
}

function getAnchors(contacto) {
  return [...contacto.matchAll(/<a\b[^>]*>[\s\S]*?<\/a>/gi)]
}

test('Contacto follows Proyectos inside main with a labeled section', () => {
  const contacto = getContactoSection()

  assert.match(
    contacto,
    /<h2\b[^>]*\bid=["']contacto-title["'][\s\S]*?Contacto[\s\S]*?<\/h2>/i,
  )
})

test('Contacto exposes every approved channel with a working destination', () => {
  const contacto = getContactoSection()
  const contactoText = getText(contacto)

  for (const email of approvedContact.emails) {
    assert.ok(contactoText.includes(email), `${email} must be visible to the reader`)
    assert.ok(contacto.includes(`href="mailto:${email}"`), `${email} must be a mailto link`)
  }

  assert.ok(
    contactoText.includes(approvedContact.phoneDisplay),
    'the phone must be shown in its approved readable format',
  )
  assert.ok(
    contacto.includes(`href="${approvedContact.phoneHref}"`),
    'the phone must be a tel link in international format',
  )

  assert.ok(
    contacto.includes(`href="${approvedContact.githubUrl}"`),
    'GitHub must link to the approved profile',
  )
  assert.ok(
    contacto.includes(`href="${approvedContact.linkedinUrl}"`),
    'LinkedIn must link to the approved profile',
  )

  assert.ok(
    contactoText.includes(approvedContact.address),
    'the approved address must be published in full',
  )

  assert.doesNotMatch(contacto, /<form\b|<input\b|<button\b/i)

  for (const anchor of getAnchors(contacto)) {
    assert.ok(
      !getText(anchor[0]).includes(approvedContact.address),
      'the address must stay plain text instead of a link',
    )
  }
})

test('Contacto keeps the token-backed, wrapped and keyboard-accessible presentation contract', () => {
  const contacto = getContactoSection()
  const anchors = getAnchors(contacto)

  assert.match(contacto, /\bpx-6\b/)
  assert.match(contacto, /\bsm:px-8\b/)
  assert.match(contacto, /\bmax-w-3xl\b/)
  assert.match(contacto, /\brounded-project-card\b/)
  assert.match(contacto, /\bbreak-words\b/)
  assert.match(contacto, /\bgrid-cols-1\b/)

  assert.ok(anchors.length >= 5, 'every contact channel must be a link')
  for (const anchor of anchors) {
    assert.match(anchor[0], /\bmin-h-12\b/)
    assert.match(anchor[0], /focus-visible:outline-4/)
    assert.match(anchor[0], /focus-visible:underline/)
    assert.match(anchor[0], /motion-reduce:transition-none/)
  }

  assert.match(css, /--md-sys-shape-corner-medium:/)
  assert.match(css, /--radius-project-card:\s*var\(--md-sys-shape-corner-medium\)/)
  assert.match(css, /@media \(prefers-reduced-motion: reduce\)/)
  assert.match(css, /background-color:\s*var\(--md-sys-color-surface\)/)
})

test('the retired pending-contact handoff leaves no trace in the document', () => {
  assert.doesNotMatch(html, /contacto-pendiente/i)
  assert.doesNotMatch(html, /próximamente/i)
  assert.doesNotMatch(html, /<footer\b/i)
})
