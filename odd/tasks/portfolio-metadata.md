# Portfolio Metadata and Payload

## Objective

Make the portfolio shareable and correctly sized: add social preview metadata, a favicon and
theme color to both pages; remove the orphaned project image; and resolve the duplicated
discipline in the hero. All content decisions must be locked by contract tests.

## Problem

1. Neither `index.html` nor `caso-de-estudio.html` declares any social metadata
   (`og:*`, `twitter:*`, favicon, `theme-color`). The portfolio is distributed through LinkedIn
   and messaging apps, where a link without Open Graph renders as a bare gray text line.
2. `public/images/projects/login_kg.png` (77 KB) is no longer referenced by any markup after the
   placeholder card was removed, but Vite still copies `public/` into `dist/`, so it ships.
3. The hero repeats "Ingeniería en Sistemas" in two consecutive lines and omits the university,
   which appears in the CV but nowhere on the site.
4. `dist/` weighs 702 KB. The decorative Gentle-AI badge alone is 474 KB (68% of the payload) and
   its source is 900x389 for a 220px-wide render.

## Why now

Hosting is the next step, and a portfolio that is not correctly shareable cannot benefit from
being published. Items 1-3 are independent of the hosting decision and should land first.

## Scope

### In scope

- **T1** Open Graph + Twitter card metadata on both pages.
- **T2** Favicon and `theme-color` on both pages.
- **T3** Delete the orphaned `public/images/projects/login_kg.png`.
- **T4** Hero identity: add the university, remove the duplicated discipline.
- **T5** Contract tests covering all of the above.

### Explicitly out of scope

- `og:url` and `canonical`. Both require the production domain, which is undecided. Omitting
  `og:url` is correct rather than a compromise: a scraper already knows the URL it was given.
  They get added as a one-line change when hosting is chosen.
- An `og:image` / `summary_large_image` card. Requires a 1200x630 social image that does not exist
  yet, and a project screenshot is not a portfolio card. Deferred deliberately.
- Optimizing or resizing the 474 KB badge. No image tooling is available on this machine
  (`convert.exe` in system32 is the Windows filesystem converter, not ImageMagick; `sharp` is not
  installed). Would require a new devDependency, which is the user's call.
- The dead "Demo" button, the second project card, the CV download.
- Any change to `src/styles.css`, `vite.config.js`, `src/main.js`.

## Authorized scope

The user authorized: metadata, orphan-asset removal, and (offered in the same message) adding the
university to the hero. No commits were explicitly requested for this work.

## Constraints

- No invented copy. The university name comes from the user's CV: "Universidad Mariano Gálvez
  de Guatemala".
- No placeholder domain in any committed file.
- Favicon must be an SVG authored from the existing token palette, not an invented brand.
- Every user-facing string change updates its approved-copy constant in the corresponding spec.
- Spanish neutral and professional in visible copy.

## Route declaration

| Task | Route | Trigger evidence |
|------|-------|------------------|
| T1-T5 | delegated direct | 4+ files touched across 2 pages, 1 spec update, 1 asset deletion and 1 new asset. Writer trigger met. |

## Acceptance criteria

- [ ] Both pages expose `og:type`, `og:title`, `og:description`, `og:site_name`, `og:locale`,
      `twitter:card`.
- [ ] Neither page contains a placeholder or guessed domain.
- [ ] Both pages reference the favicon and declare `theme-color`.
- [ ] `login_kg.png` is absent from the working tree and from `dist/`.
- [ ] The hero states the university once and the discipline once.
- [ ] A contract test fails if the metadata is removed or if a placeholder domain is introduced.
- [ ] All 6 specs pass.
- [ ] `npm run build` emits both pages.

## Checks

```bash
node --test tests/inicio.spec.js tests/habilidades.spec.js tests/proyectos.spec.js tests/metodo.spec.js tests/contacto.spec.js tests/caso-de-estudio.spec.js tests/metadata.spec.js
npm run build
Test-Path dist\images\brand\built-with-gentle-ai.png
Select-String -Path index.html,caso-de-estudio.html -Pattern 'og:'
```

## Progress

| Task | State | Evidence |
|------|-------|----------|
| T1 metadata | done | `og:type/locale/site_name/title/description` + `twitter:card` en ambas páginas. `og:title` y `og:description` distintos por página. Sin dominio inventado. |
| T2 favicon + theme-color | done | `public/favicon.svg` con `viewBox="0 0 32 32"`, fondo `#141414`, marca `#f5f74a`, sin `<text>`. `theme-color` y `rel="icon"` en ambas páginas. |
| T3 orphan removal | pending→done | `login_kg.png` borrado; `dist\images\projects\login_kg.png` = `False`. −75 KB. |
| T4 hero identity | done | Línea de identidad → `Ingeniería en Sistemas · Universidad Mariano Gálvez`. `approvedCopy.identity` actualizada. |
| T5 contracts | done | `tests/metadata.spec.js` nuevo, 4 tests. Suite completa: 31/31. |
| T6 credit subtitle | done | Párrafo `La metodología descrita se implementa con Gentle-AI.` encima del badge, con assert de presencia y de orden relativo en `tests/metodo.spec.js`. |

## Deviations

- **El test de favicon fue ajustado, no la SVG.** El requisito original pedía que el SVG no matcheara `http`, pero un `.svg` standalone necesita `xmlns="http://www.w3.org/2000/svg"`. Se conservó el namespace y el test ahora descarta declaraciones de namespace antes de assertar que no hay referencias externas. Verificado mutando el archivo: una referencia externa sí hace fallar el test.
- **T3 se ejecutó sobre `.gitignore`.** Vite copia `public/` a `dist/` completo, así que borrar el archivo era necesario; el directorio `projects/` conserva `dashboard_kg.png`.
- **La carrera sigue apareciendo 2 veces en el hero** (identidad y subtítulo). Eliminar la segunda requiere tocar el subtítulo, que el alcance autorizado excluía. Pendiente de decisión.

## Verification

```
node --test (7 specs)  → 31 tests, 31 pass, 0 fail
npm run build          → index.html 23.85 kB, caso-de-estudio.html 18.17 kB
dist/favicon.svg                    → True
dist/images/brand/...gentle-ai.png  → True
dist/images/projects/login_kg.png   → False
dist total                          → 627 KB (desde 702 KB, −10.7%)
```

## Next step

Verificar en `npm run dev` y luego decidir commit. El badge de 474 KB es ahora el 76% de `dist/` y queda como pendiente conocido.

## Pre-existing repository state

The working tree carries uncommitted work from earlier in this effort, on `main`:
`caso-de-estudio.html` plus `tests/{habilidades,metodo,caso-de-estudio}.spec.js` are untracked,
and `index.html`, `package.json`, `vite.config.js`, `tests/{inicio,proyectos,contacto}.spec.js`
are modified. None of that has been committed or merged. This work adds to that pile.

## Next step

Implement T1-T5, verify, then ask the user whether to commit, since no commit was requested.
