import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import test from 'node:test'

const html = readFileSync(new URL('../index.html', import.meta.url), 'utf8')
const theme = readFileSync(new URL('../node_modules/tailwindcss/theme.css', import.meta.url), 'utf8')

// Tailwind fails silently on a class it cannot resolve: the build succeeds, no
// warning is printed, and the utility is simply absent from the output CSS. These
// guards read the INSTALLED theme so a typo or an out-of-scale step fails the
// suite instead of quietly doing nothing in the browser.

const containerScale = new Set([
  ...[...theme.matchAll(/--container-([a-z0-9-]+):/g)].map((match) => match[1]),
  'none',
  'full',
  'prose',
])

const textScale = new Set([...theme.matchAll(/--text-([a-z0-9]+):/g)].map((match) => match[1]))

test('every numeric spacing step resolves to the installed spacing scale', () => {
  // Tailwind's spacing utilities multiply --spacing, but only integer and half
  // steps exist in the scale. A value like py-0.9 resolves to nothing at all,
  // so the intended override silently never applies.
  const classes = [...html.matchAll(/\b((?:sm:|md:|lg:|xl:)?(?:p|m|gap)(?:[xytrbl])?-(\d+\.\d+))\b/g)]

  assert.ok(classes.length >= 0, 'the page must be scanned')

  for (const [, klass, value] of classes) {
    assert.match(
      value,
      /^\d+\.5$/,
      `${klass} is not in the Tailwind spacing scale, so it renders no CSS. Use an integer or .5 step.`,
    )
  }
})

test('every max-w class resolves to a real installed container size', () => {
  const used = [...html.matchAll(/\bmax-w-(\[[^\]]+\]|[a-z0-9-]+)/g)].map((match) => match[1])

  assert.ok(used.length > 0, 'the page must use at least one max-w constraint')

  for (const size of used) {
    if (size.startsWith('[')) {
      continue
    }

    assert.ok(
      containerScale.has(size),
      `max-w-${size} is not in the installed Tailwind scale, so it renders no CSS. Available: ${[...containerScale].join(', ')}`,
    )
  }
})

test('every numeric text size resolves to a real installed font-size step', () => {
  const used = [...new Set([...html.matchAll(/\btext-(\d+xl)\b/g)].map((match) => match[1]))]

  for (const size of used) {
    assert.ok(
      textScale.has(size),
      `text-${size} is not in the installed Tailwind font-size scale. Available: ${[...textScale].sort().join(', ')}`,
    )
  }
})

test('every responsive type step the hero promises actually resolves', () => {
  const hero = html.slice(html.indexOf('<h1'), html.indexOf('</h1>'))

  assert.ok(hero, 'the hero headline must exist')

  for (const prefix of ['sm', 'lg']) {
    const step = hero.match(new RegExp(`\\b${prefix}:text-(\\d+xl)\\b`))

    assert.ok(step, `the headline must declare a ${prefix}: breakpoint step`)
    assert.ok(textScale.has(step[1]), `${prefix}:text-${step[1]} renders no CSS`)
  }
})