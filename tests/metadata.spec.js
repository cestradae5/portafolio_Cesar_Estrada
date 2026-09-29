import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import test from 'node:test'

const indexHtml = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const casoHtml = readFileSync(new URL('../caso-de-estudio.html', import.meta.url), 'utf8')
const favicon = readFileSync(new URL('../public/favicon.svg', import.meta.url), 'utf8')

const pages = [
  { name: 'index.html', html: indexHtml },
  { name: 'caso-de-estudio.html', html: casoHtml },
]

const orphanImagePath = fileURLToPath(new URL('../public/images/projects/login_kg.png', import.meta.url))

function getHead(markup) {
  const headStart = markup.indexOf('<head')
  const headEnd = markup.indexOf('</head>')

  assert.notEqual(headStart, -1, 'the page must include a head element')
  assert.notEqual(headEnd, -1, 'the page must close the head element')
  return markup.slice(headStart, headEnd)
}

function getTags(head, tagName) {
  return head.match(new RegExp(`<${tagName}\\b[^>]*>`, 'gi')) ?? []
}

function getMetaContent(head, attribute, value) {
  const tag = getTags(head, 'meta').find((candidate) =>
    new RegExp(`\\b${attribute}=["']${value}["']`, 'i').test(candidate)
  )

  assert.ok(tag, `head must declare a meta tag with ${attribute}="${value}"`)
  const content = tag.match(/\bcontent=(["'])([\s\S]*?)\1/i)

  assert.ok(content, `the ${attribute}="${value}" meta tag must carry a content attribute`)
  return content[2]
}

test('both pages declare the social preview contract', () => {
  const titles = []
  const descriptions = []

  for (const page of pages) {
    const head = getHead(page.html)

    assert.equal(getMetaContent(head, 'property', 'og:type'), 'website', `${page.name} og:type`)
    assert.equal(getMetaContent(head, 'property', 'og:locale'), 'es_GT', `${page.name} og:locale`)
    assert.equal(
      getMetaContent(head, 'property', 'og:site_name'),
      'Cesar Armando Estrada Elias',
      `${page.name} og:site_name`
    )
    assert.equal(getMetaContent(head, 'name', 'twitter:card'), 'summary', `${page.name} twitter:card`)
    assert.equal(getMetaContent(head, 'name', 'theme-color'), '#141414', `${page.name} theme-color`)

    const title = getMetaContent(head, 'property', 'og:title')
    const description = getMetaContent(head, 'property', 'og:description')

    assert.ok(title.length > 0, `${page.name} og:title must not be empty`)
    assert.ok(description.length > 0, `${page.name} og:description must not be empty`)

    titles.push(title)
    descriptions.push(description)

    const icon = getTags(head, 'link').find((tag) => /\brel=["']icon["']/i.test(tag))

    assert.ok(icon, `${page.name} must declare a rel="icon" link`)
    assert.match(icon, /\btype=["']image\/svg\+xml["']/i, `${page.name} icon type`)
    assert.match(icon, /\bhref=["']\/favicon\.svg["']/i, `${page.name} icon href`)
  }

  assert.notEqual(titles[0], titles[1], 'each page must present its own og:title')
  assert.notEqual(descriptions[0], descriptions[1], 'each page must present its own og:description')
})

test('no page declares an undecided production domain', () => {
  const bannedDomain = /\b(?:localhost|example\.com|your-?domain|placeholder|CHANGE_?ME|TODO)\b/i

  for (const page of pages) {
    const head = getHead(page.html)
    const metadataTags = [...getTags(head, 'meta'), ...getTags(head, 'link')]

    assert.ok(metadataTags.length > 0, `${page.name} must expose metadata tags in its head`)

    for (const tag of metadataTags) {
      assert.doesNotMatch(
        tag,
        /\b(?:https?:)?\/\//i,
        `${page.name} must not declare an absolute URL in metadata: ${tag}`
      )
      assert.doesNotMatch(
        tag,
        bannedDomain,
        `${page.name} must not declare a placeholder domain in metadata: ${tag}`
      )
    }
  }
})

test('the favicon is a local token-based SVG', () => {
  assert.match(favicon, /\bviewBox=["']0 0 32 32["']/, 'the favicon must use a 32x32 viewBox')
  assert.match(favicon, /\bwidth=["']32["']/)
  assert.match(favicon, /\bheight=["']32["']/)
  assert.match(favicon, /#141414/, 'the favicon background must use the surface token color')
  assert.match(favicon, /#f5f74a/, 'the favicon mark must use the primary token color')
  assert.match(favicon, /<rect\b[^>]*\brx=/i, 'the favicon background must use rounded corners')
  assert.doesNotMatch(favicon, /<text/i, 'the favicon must stay legible at 16x16 without text')
  assert.doesNotMatch(favicon, /<script/i, 'the favicon must not carry script')
  assert.doesNotMatch(favicon, /font-family/i, 'the favicon must not depend on a font')

  // The SVG namespace URI is a constant identifier, never a fetched resource.
  // Strip namespace declarations so the assertion targets real external references.
  const withoutNamespaces = favicon.replace(/\bxmlns(?::[\w-]+)?\s*=\s*["'][^"']*["']/gi, '')

  assert.doesNotMatch(
    withoutNamespaces,
    /http/i,
    'the favicon must not reference any external resource'
  )

  for (const page of pages) {
    assert.doesNotMatch(
      page.html,
      /<link\b[^>]*\brel=["']icon["'][^>]*\bhref=["'](?:https?:)?\/\//i,
      `${page.name} must not point its favicon at an external origin`
    )
  }
})

test('the orphan project image is gone', () => {
  assert.equal(existsSync(orphanImagePath), false, 'the unreferenced project image must be deleted')

  for (const page of pages) {
    assert.doesNotMatch(page.html, /login_kg/i, `${page.name} must not reference the deleted image`)
  }
})

// Vite rewrites asset references with the configured base, but it never rewrites
// <a href>. A root-absolute anchor would escape the deployment subdirectory, so
// every internal link must be relative.
function getAbsoluteAnchors(markup) {
  return [...markup.matchAll(/<a\b[^>]*?\bhref\s*=\s*["']\/(?!\/)[^"']*["'][^>]*>/gi)]
}

test('no page links to an internal route with a root-absolute href', () => {
  for (const page of pages) {
    const absoluteAnchors = getAbsoluteAnchors(page.html)

    assert.deepEqual(
      absoluteAnchors.map((anchor) => anchor[0]),
      [],
      `${page.name} must link internally with relative hrefs, not root-absolute ones`,
    )
  }

  // The rule targets internal routes only. A legitimate external anchor such as the
  // Gentle-AI badge, a fragment link, and a known-bad sample all prove the guard is
  // neither blind nor over-broad.
  const gentleAiBadge = indexHtml.match(
    /<a\b[^>]*href=["']https:\/\/github\.com\/Gentleman-Programming\/gentle-ai["'][^>]*>/i,
  )

  assert.ok(gentleAiBadge, 'the Gentle-AI badge anchor must be present in index.html')
  assert.deepEqual(
    getAbsoluteAnchors(gentleAiBadge[0]),
    [],
    'an external anchor must never be reported as a root-absolute internal route',
  )
  assert.deepEqual(
    getAbsoluteAnchors('<a href="#contacto">Contacto</a>'),
    [],
    'a fragment anchor must never be reported as a root-absolute internal route',
  )
  assert.equal(
    getAbsoluteAnchors('<a href="/caso-de-estudio.html">Caso de estudio</a>').length,
    1,
    'the guard must still detect a root-absolute internal route',
  )
})
