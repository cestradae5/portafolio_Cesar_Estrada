import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')

const approvedCopy = {
  name: 'Cesar Estrada',
  photoAlt: 'Fotografía de perfil de Cesar Estrada',
}

const approvedNav = [
  { label: 'Proyectos', href: '#proyectos', sectionId: 'proyectos' },
  { label: 'Habilidades', href: '#habilidades', sectionId: 'habilidades' },
  { label: 'Cómo trabajo', href: '#metodo', sectionId: 'metodo' },
  { label: 'Contacto', href: '#contacto', sectionId: 'contacto' },
]

function getHeader() {
  const headerStart = html.indexOf('<header')
  const headerEnd = html.indexOf('</header>')

  assert.notEqual(headerStart, -1, 'the page must include a header landmark')
  assert.notEqual(headerEnd, -1, 'the header must be closed')

  const mainStart = html.indexOf('<main')
  assert.notEqual(mainStart, -1, 'the page must include a main landmark')
  assert.ok(headerStart < mainStart, 'the header must precede the main landmark')

  return html.slice(headerStart, headerEnd + '</header>'.length)
}

test('Encabezado shows the short profile name as the page banner', () => {
  const header = getHeader()
  const name = header.match(/<p\b[^>]*>\s*Cesar Estrada\s*<\/p>/i)

  assert.ok(name, `the header must expose the short name ${approvedCopy.name}`)
  assert.doesNotMatch(header, /Cesar Armando Estrada Elias/i, 'the banner uses the short name only')
  assert.doesNotMatch(header, /<h1\b/i, 'the banner must not introduce a second h1')
  assert.match(header, /\btext-primary\b/, 'the name leads with the brand accent color')
})

test('Encabezado pairs the name with the profile photo', () => {
  const header = getHeader()
  const photos = header.match(/<img\b[^>]*>/gi) ?? []

  assert.equal(photos.length, 1, 'the header must show exactly one profile photo')
  assert.match(photos[0], /\bsrc=["']\/images\/foto_perfil\.jpg["']/i)
  assert.match(
    photos[0],
    new RegExp(`\\balt=["']${approvedCopy.photoAlt.replace('í', '[íi]')}["']`, 'i'),
    `the profile photo alt text must be the approved copy: ${approvedCopy.photoAlt}`,
  )
  const width = photos[0].match(/\bwidth=["'](\d+)["']/i)
  const height = photos[0].match(/\bheight=["'](\d+)["']/i)

  assert.ok(width && height, 'the profile photo must declare intrinsic width and height')
  assert.equal(width[1], height[1], 'the intrinsic box must stay square so object-cover never distorts')
  assert.ok(Number(width[1]) >= 48, 'the profile photo must stay legible')
  assert.match(photos[0], /\bobject-cover\b/, 'the photo must fill its frame')
  assert.doesNotMatch(photos[0], /\bloading=["']lazy["']/i, 'the above-the-fold photo must not lazy-load')

  const photoIndex = header.indexOf(photos[0])
  const nameIndex = header.search(/<p\b[^>]*>\s*Cesar Estrada\s*<\/p>/i)

  assert.ok(photoIndex < nameIndex, 'the photo must sit before the name, like a brand lockup')
})

test('Encabezado is a masthead, not a filled sticky bar', () => {
  const header = getHeader()

  assert.doesNotMatch(header, /\bsticky\b/i, 'the masthead must not pin itself to the top')
  assert.doesNotMatch(header, /\bbg-surface-container\b/, 'the masthead must stay transparent, not a filled bar')
  assert.doesNotMatch(header, /\bborder-b\b/, 'the masthead must not draw a full-width divider')
  assert.doesNotMatch(header, /\bmax-w-\d/, 'the masthead must not be trapped in a centered column')
  assert.doesNotMatch(header, /#[0-9a-fA-F]{3,8}\b/, 'the masthead must not hardcode colors')
})

test('Encabezado renders the photo as a circle through the full corner shape token', () => {
  const header = getHeader()
  const photos = header.match(/<img\b[^>]*>/gi) ?? []

  assert.match(photos[0], /\brounded-hero-action\b/, 'the photo is round via the Material 3 full corner token')
  assert.doesNotMatch(photos[0], /\brounded-project-card\b|\brounded-sm\b|\brounded-lg\b/, 'the photo must not keep a squared shape')
})

test('Navegación exposes exactly the approved menu buttons', () => {
  const header = getHeader()
  const nav = header.match(/<nav\b[\s\S]*?<\/nav>/i)

  assert.ok(nav, 'the header must include a navigation landmark')
  assert.match(nav[0], /\baria-label=["']Navegación principal["']/i)

  const links = [...nav[0].matchAll(/<a\b[^>]*href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi)]

  assert.equal(links.length, approvedNav.length, 'the menu must expose exactly the approved buttons')

  links.forEach((link, index) => {
    const approved = approvedNav[index]

    assert.equal(link[1], approved.href, `${approved.label} must point to ${approved.href}`)
    assert.equal(link[2].trim(), approved.label, `the ${index + 1} button must read ${approved.label}`)
  })
})

test('Navegación never points at a section that does not exist', () => {
  const header = getHeader()
  const hrefs = [...header.matchAll(/<a\b[^>]*href=["']#([^"']+)["']/gi)].map((match) => match[1])

  assert.ok(hrefs.length > 0, 'the menu must use in-page section anchors')

  for (const target of hrefs) {
    assert.match(html, new RegExp(`\\bid=["']${target}["']`), `#${target} must resolve to a real section`)
  }
})

test('Navegación keeps the repo touch-target, focus and reduced-motion contract', () => {
  const header = getHeader()
  const links = header.match(/<a\b[^>]*>/gi) ?? []

  assert.ok(links.length > 0, 'the menu must expose links')

  for (const link of links) {
    assert.match(link, /\bmin-h-12\b/, 'every menu button keeps the 48px touch target')
    assert.match(link, /\bfocus-visible:outline-4\b/)
    assert.match(link, /\bfocus-visible:outline-offset-4\b/)
    assert.match(link, /\bfocus-visible:underline\b/)
    assert.match(link, /\brounded-hero-action\b/)
    assert.match(link, /\bborder-outline-variant\b/, 'menu buttons use outline-variant, not outline')
    assert.match(link, /\bmotion-reduce:transition-none\b/, 'every transition must be paired with motion-reduce')
  }
})

test('El encabezado no invade el hero ni duplica su acción', () => {
  getHeader()
  const inicio = html.slice(html.indexOf('<section'), html.indexOf('</section>'))

  assert.doesNotMatch(inicio, /<header\b/i, 'Inicio keeps its own scoped presentation')
  assert.doesNotMatch(inicio, /<(?:img|picture)\b/i, 'Inicio stays text-only')

  const heroLinks = inicio.match(/<a\b/gi) ?? []
  assert.equal(heroLinks.length, 0, 'the menu is the single owner of every page handoff')
})