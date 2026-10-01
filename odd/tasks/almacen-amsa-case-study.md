# Almacén de AMSA — segunda tarjeta de proyecto y segundo caso de estudio

## Objective

Add the "Almacén de AMSA" warehouse project to the portfolio as a **second** project card in
`index.html#proyectos` and as its own case study page, alongside the existing "Sistema de
asistencia Escolar" (Colegio Kids Garden) project.

The portfolio currently shows exactly one project. Two materially different systems — school
attendance and warehouse logistics — demonstrate far more range to a reader than one.

## Problem

The repository has no trace of the AMSA project. Verified absences:

1. `grep -ri "amsa"` over the whole worktree returns no match. No code, no copy, no image.
2. `engram_mem_search("almacen amsa proyecto")` returns `No memories found` for project
   `portafolio_cesar_estrada`.
3. `public/images/` holds 13 assets, and **every one of them belongs to Kids Garden or the
   portfolio brand**. There are zero AMSA screenshots and zero orphan images.

Three independent sources, one conclusion: this project has to be authored from content the user
supplies. No copy may be invented — the same constraint the previous feature recorded in
`## Constraints`.

### The contract is hard-locked to a single project

`npm test` is a hard CI gate on `main` (`.github/workflows/deploy.yml` runs it before
`npm run build`). Adding a second card therefore requires deliberately rewriting the contract,
not merely adding markup:

| Blocker | Location | Why it blocks a second card |
|---|---|---|
| `assert.equal(cards.length, 1)` | `tests/proyectos.spec.js:52` | Runs **first**, before any other assertion. Fails on card two. The test is named *"…and exactly one semantic card"*. |
| `const [project] = cards` | `tests/proyectos.spec.js:76, 108` | Hardcoded to `cards[0]`. Card two is never inspected by tests 2 and 3. |
| `anchors.every(a => /caso-de-estudio\.html$/)` | `tests/proyectos.spec.js:126` | Every card's only `href` must end in `caso-de-estudio.html`. AMSA needs its own page. |
| `approvedProject` constant | `tests/proyectos.spec.js:8-20` | A single approved-copy object. AMSA needs a second entry. |
| `assert.equal(sections.length, 8)` + exact `h2` text | `tests/caso-de-estudio.spec.js:103-118` | One case study, one exact 8-section order. |
| h1 must include `'Sistema de asistencia docente'` | `tests/caso-de-estudio.spec.js:79` | Hardcoded. A second page needs its own spec file. |
| `walkthroughScreenshots` | `tests/caso-de-estudio.spec.js:24-36` | 11 files with exact intrinsic dimensions, verified with `existsSync`. **These belong to Kids Garden and are not available to AMSA.** |
| `pages` array | `tests/metadata.spec.js:10` | Hardcoded 2-page array across 5 tests. A third page is unvalidated until added. |
| `rollupOptions.input` | `vite.config.js` | Exactly 2 entries. A third page is **not emitted to `dist/`** until registered. |

### Load-bearing details that must not be "cleaned up"

- `index.html:153` outer grid is `grid-cols-1 gap-8`, but `tests/proyectos.spec.js:135` asserts
  `gap-6`. It passes today only because the card's inner overlay (`index.html:166`) also carries
  `gap-6`. Do not normalize it.
- `caso-de-estudio.spec.js:151` asserts the `min-w-0` count equals the `img` count **exactly**.
  One per gallery cell, no extras.
- `caso-de-estudio.spec.js:123` asserts `externalHosts` deep-equals `['www.youtube-nocookie.com']`
  across the **whole file**. Any other external `src`/`href` in an AMSA page fails.
- `caso-de-estudio.spec.js:344` sweeps every `class="…"` in the file: any `transition-*` class
  must also carry `motion-reduce:transition-none`.

## Why now

The portfolio is feature-complete for one project and the work sits on
`update_caso_studio_index`, 5 commits ahead of `main` and 0 behind. The user is adding a second
project now, and the contract expansion is the natural moment to land it on the same branch
rather than splitting the same work across two.

## Scope

### In scope

- **T1 — Lock AMSA content.** Obtain the problem, restrictions, architecture decisions,
  capabilities, discarded alternatives, what went wrong, and the result from the user, plus the
  real stack and the repository visibility. **BLOCKED — no content exists yet.**
- **T2 — AMSA card hero image.** Add `public/images/projects/<hero>.png`. No file exists.
- **T3 — `caso-de-estudio-amsa.html`.** New case study page following the same shell, section
  pattern and design vocabulary as `caso-de-estudio.html`.
- **T4 — Second card in `index.html#proyectos`.** Same markup contract as card one.
- **T5 — Register the page in `vite.config.js`.** Third `rollupOptions.input` entry, or the page
  never ships to `dist/`.
- **T6 — Expand `tests/proyectos.spec.js`.** Count 1→2, parameterize `cards[0]`, make the `href`
  assert per-project, add the AMSA approved-copy constant.
- **T7 — `tests/caso-de-estudio-amsa.spec.js`.** Per-page contract, mirroring the existing spec's
  shape but bound to AMSA's own copy and assets.
- **T8 — Add the page to `tests/metadata.spec.js`.** Third entry in the `pages` array, so the new
  page is actually validated.
- **T9 — Verify.** Full `npm test` green, plus `npm run build` emitting three HTML files.

### Explicitly out of scope

- **Rewriting the Kids Garden case study.** It passes its contract and ships. Deferred.
- **Optimizing image weight.** `built-with-gentle-ai.png` is 474 KB and the 11 Kids Garden PNGs
  total ~1.1 MB. The previous feature already recorded that fixing this needs a new devDependency
  (`sharp` or ImageMagick), which is the user's call. New AMSA images must not make this worse.
- **`og:image`.** Requires a 1200×630 asset that does not exist. Deferred, as before.
- **`og:url` / `canonical`.** Deliberately omitted while the production domain is undecided;
  `metadata.spec.js` forbids it.
- **Any production-domain change.** Would break `metadata.spec.js`.
- **Merging to `main` or opening a pull request.** Delivery is the user's decision under ordinary
  repository policy.

## Authorized scope

The user asked, verbatim: *"necesito que me ayudes a crear la tarjeta y el caso de estudio de mi
proyecto del almacen de amsa, utiliza odd"*, and then selected **"Sumar como segunda tarjeta"**
when offered the replace-vs-add fork.

That authorizes: authoring the AMSA card, authoring the AMSA case study, and expanding the test
and build contracts required to make both ship. It does not authorize replacing or deleting the
Kids Garden project, and it does not authorize delivery.

## Constraints

- **No invented copy.** Every claim in the card and the case study comes from the user. The
  previous feature recorded this constraint; it still holds.
- **Visible copy is Spanish, neutral and professional.** The repo's own existing copy sets the
  register. This document body stays English.
- **Material Design 3 dark palette is locked.** Reuse `surface`, `surface-container`,
  `surface-container-high`, `on-surface`, `on-surface-variant`, `secondary`, `outline-variant`.
  Do not add a project-specific hue.
- **Reuse the existing design vocabulary verbatim** — `rounded-project-card`, `rounded-hero-action`,
  `space-y-12` page rhythm, `max-w-3xl` measure, `space-y-6 … p-8 sm:p-10` section shell.
- **No new devDependency** and no image tooling.
- **Every `<a>` in both pages must stay relative.** `base: '/portafolio_Cesar_Estrada/'` is the
  GitHub Pages repo-subdirectory base, and `metadata.spec.js:148` bans root-absolute internal
  hrefs.
- **Every `transition-*` class needs `motion-reduce:transition-none`** in the same attribute.
- **Design tokens, not hex, in markup.** No `<style>` block in either page.
- **Sections must not be nested.** `getSectionById` uses `main.lastIndexOf('<section', start)`.

## Approved content (T1)

Authoritative source for T3, T4, T6 and T7. Delivered by the user in their own words. **Do not
invent, embellish or add any claim that is not written here.** Typos corrected, meaning untouched.
Visible copy renders as neutral professional Spanish.

### Repository visibility

Private. Badge text: `Repositorio privado` — the exact string already validated by the contract.

### Section 1 — Problema

Warehouse management ran on a Microsoft Access desktop application with real operational limits:

- **No portability or access.** The application could not be moved to other machines, because the
  private access keys stayed bound to the original computer.
- **Manual processes.** Form 1-H (the warehouse entry certificate), the Kardex cards and the exit
  documents were all produced by hand in Excel spreadsheets.
- **Data loss and inconsistencies.** History was lost and supplies went stale, which produced a
  constant gap between the records inside Access and the real physical inventory.

It hit the financial area directly, specifically the Almacén and Compras departments.

### Section 2 — Restricciones

Because AMSA is an administrative institution, purchases are settled monthly, so any licensed or
paid hosting option would have meant recurring invoice management. Two conditions followed:

- **Infrastructure and cost.** Development and deployment used only the institution's own
  resources, with no additional cost for licenses or external hosting.
- **Application server.** Deployment reused the existing infrastructure of the Informática area,
  hosting the system on the institution's own local server.

### Section 3 — Decisiones de arquitectura

Approved four-layer stack, in the card contract's exact layer names:

| Layer | Approved technologies |
|---|---|
| `Frontend` | Django Templates, Tailwind CSS (CDN), Alpine.js (CDN) |
| `Backend` | Python, Django, ReportLab, Redis, Sentry, sentence-transformers |
| `Base de Datos` | PostgreSQL con extensión pgvector, volúmenes persistentes |
| `Seguridad` | Nginx como reverse proxy, CSRF, RBAC, backups con rclone |

> ReportLab was moved from the user's "Frontend" list to `Backend`. It renders PDFs inside the
> Django process, server-side, so it is not part of the presentation layer. Django legitimately
> appears twice: Django Templates *are* the frontend surface, Django *is* the backend.

Deployment facts: internal Docker network; containers for web (frontend), db (pgvector) and redis;
internal service resolution by Docker DNS — `web:8000`, `db:5432`, `redis:6379`. Nginx terminates as
reverse proxy. Backups go to Google Drive through rclone. Sentry covers observability and error
capture.

### Section 4 — Capacidades del sistema

Eight approved capability groups. Preserve the technical specificity — it is the strongest material
in the whole case study.

1. **Inventario y catálogo — REVISED by the user.** Now describes the business decision rather than
   the control list: real-time stock of supplies, traffic-light alerts for limit levels, filtering
   by category, search by ID or name; the catalog manages new products using SentenceTransformers to
   validate semantic similarity and prevent duplicate records; and **the renglón assignment of every
   supply is governed strictly by the 7th edition of Guatemala's Manual de Clasificaciones
   Presupuestarias para el Sector Público.** That last point is a regulatory constraint, not a
   feature, and it is the strongest differentiator in the whole case study.

   The `stock_actual` / `stock_base` dual column moved out of 4.1 to 4.4, because the user originally
   defined it as *"el invariante de la tarjeta Kardex"* and 4.4 is the Kardex section. The claim is
   preserved; only its section changed.
2. **Entradas — REVISED by the user.** Heading is now `4.2 Entradas`; the word "compras" was removed
   by explicit instruction. Now describes: entry of supplies via the Constancia de Ingreso a
   Almacén (Formulario 1-H); an approval flow with four review states (Borrador, Pendiente,
   Aprobada, Completada); the system records the form header and assigns the stock entry to supplies
   already in the catalog; a PDF whose design matches the physical, authorized Formulario 1-H, keeping
   a detailed change log and edit history; and cascade annulment that validates at every moment that
   stock never goes negative.

   **Four details were dropped by this revision**, flagged to the user: `RECHAZADA`, `ANULADA`, the
   `once rutas` count, and **print calibration in millimetres with configurable offsets**. The last
   is the one that matters: the claim *"coincide con la versión física autorizada"* is an assertion
   without it, and evidence with it. A minimal re-insertion was offered using the user's own original
   wording; the user has not yet responded on it.

   The earlier approved wording, retained for reference: BORRADOR → PENDIENTE → APROBADA →
   COMPLETADA plus RECHAZADA and ANULADA, eleven routes, form 1-H PDF with print calibration in
   millimetres (configurable offsets), cascade annulment verifying stock is not left negative.
3. **Salidas — REVISED by the user.** Now structured with labelled lead-ins rather than one paragraph:
   *Salida Total* links directly to the Constancia de Ingreso (Formulario 1-H) and ejects exactly the
   quantity originally entered on that document; *Salida Parcial* allows per-supply egress on a
   requested quantity and automatically validates that exits never drive stock negative; the
   *Flujo de Aprobación* for exits is the same as for entries; and every exit generates its constancia
   in PDF.

   **State machine resolved 2026-09-30.** The user confirmed exits and entries share the **same four
   states** (Borrador, Pendiente, Aprobada, Completada), and that CONFIRMADA and EDITADA do **not**
   exist as distinct exit states. The user's first delivery had listed five states; that earlier
   source was over-specified, and the current wording is the correct one. Flagged once so the user can
   re-check their own notes before an interviewer probes it.

   Two claims were tied to the now-nonexistent CONFIRMADA state and are therefore **unresolved, not
   dismissed**: what now triggers the versioned PDF (`v1.pdf`, `v2.pdf` with consultable history), and
   whether the ROOT+ADMIN restriction on editing a completed exit still exists. Not re-added without
   the user's word.
4. **Kardex.** Movement card with a dual strategy by volume: under 5000 movements accumulates in
   Python, above that it uses a CTE with `UNION ALL` + `SUM() OVER()` in PostgreSQL. Legal landscape
   PDF, 10 columns, paginated with mm→pt offsets.
5. **Búsqueda semántica real — unchanged.** Not simulated. `intfloat/multilingual-e5-small` through
   sentence-transformers → 384-dimension vectors in pgvector, HNSW index with cosine. The embedding
   regenerates by itself only when name, description or category changes (hook on
   `Producto.save()`). Hybrid search: exact code when the pattern matches, otherwise pure semantic.
6. **Ajustes de inventario — REMOVED by the user.** The whole module is out of the published
   narrative: increment/reduction by motive, the `stock_anterior` / `stock_nuevo` snapshot, and the
   guard against negative stock. Section numbering was renumbered contiguously afterwards, so the
   audit log became 4.6 and operational security became 4.7.
7. **Bitácora de auditoría — REVISED by the user, heading kept.** Now: guaranteed total traceability
   through the record of operational actions, logins, file downloads and system events, plus audit
   tooling filtered by user, date, action and module. This rewrite is *more* faithful to the real
   screen than the previous wording — the filter set matches the audit UI exactly.

   What it dropped: append-only, the three-layer defense in depth, the model QuerySet raising
   `PermissionError`, Admin permissions set to False, and the PostgreSQL trigger. `PermissionError`
   was the claim the parent had called the project's strongest differentiator; it is now documented
   nowhere. Accepted by the user after being shown the cost.
8. **Seguridad operacional — REVISED by the user.** Single session anti-double-login backed by Redis,
   forced remote session closure by an administrator, and password reset with a permission matrix
   and a limit of three requests every 24 hours. Anti-enumeration protection was removed on explicit
   instruction.

#### Claims removed from the decision record

The contract went from 25 asserted claims to **19**. Every removal was an explicit user decision, and
each carries a comment in `tests/caso-de-estudio-amsa.spec.js` recording why, so a later reader does
not mistake a decision for an oversight.

| Claims | Cause |
|---|---|
| `UNION ALL`, `SUM() OVER()`, `5000` | 4.4 rewritten to present the Kardex as a movement report |
| `stock_anterior`, `stock_nuevo` | the inventory-adjustment module (former 4.6) removed entirely |
| `PermissionError` | 4.6 rewritten as a user-facing audit capability |

Eleven further technical details were lost **without any contract signal**, because they were never
asserted and so nothing objected: `calibración` (print calibration in millimetres), `v1.pdf` /
`historial consultable` (versioned exit PDFs), `ROOT` (the privilege hierarchy above confirmation),
`EDITADA` / `CONFIRMADA` (states the user later confirmed never existed as distinct), `quince rutas`,
`once rutas`, `ocho unidades`, `openpyxl`, `milímetros`. The contract only protected 25 claims, so
most of the approved narrative had no net under it.

#### Shape the revised case study actually takes

Section 3 keeps the full four-layer stack plus Docker, DNS and rclone. Section 4.5 keeps the whole
search mechanism and 4.7 keeps operational security. The workflow sections — 4.1 through 4.4 and
4.6 — now read as business capability descriptions rather than implementation detail. That is a
defensible and coherent shape for a portfolio aimed at conveying scope, and it was chosen
deliberately; it is simply no longer a document about engineering decisions.

### Section 5 — Recorrido por el sistema

Delivered. Video and screenshots verified.

**Video.** Public, confirmed via oEmbed. Title `Sistema de almacen amsa`, channel
`CESAR ARMANDO ESTRADA ELIAS`, ID `rXcqIQCf_Ak`.
Embed as `https://www.youtube-nocookie.com/embed/rXcqIQCf_Ak` — the `youtube-nocookie` host is
mandatory, because `caso-de-estudio.spec.js:123` asserts `externalHosts` deep-equals
`['www.youtube-nocookie.com']` across the whole file.

**Screenshots.** 21 PNGs in `public/images/amsa/`, 4,265 KB total. Inside `public/`, so Vite already
copies them to `dist/`. Intrinsic dimensions below are measured, not assumed — the gallery contract
requires each `<img width height>` to match its file exactly.

| # | File | W×H | KB | Content (from filenames) |
|---|---|---|---|---|
| 01 | `01-login.png` | 1918×876 | 597 | Login |
| 02 | `02-dashboard.png` | 1918×882 | 317 | Dashboard |
| 03 | `03-usuarios.png` | 1918×883 | 224 | Users |
| 04 | `04-importar-alm.png` | 1918×880 | 145 | Import inventory |
| 05 | `05-inventario.png` | 1918×882 | 159 | Inventory |
| 06 | `06-kardex.png` | 1918×874 | 134 | Kardex, **empty state** |
| 07 | `07-producto.png` | 1918×883 | 167 | Product |
| 08 | `08-productoNEW.png` | 1918×880 | 141 | New product form |
| 09 | `09-catalogo-prod.png` | 1918×877 | 157 | Product catalog |
| 10 | `10-entrada.png` | 1917×880 | 162 | Entry |
| 11 | `11-entradaNEW.png` | 1918×877 | 132 | New entry form |
| 12 | `12-descarga-format1h.png` | 1918×939 | 63 | Form 1-H download |
| 13 | `13-salidas.png` | 1917×880 | 148 | Exits |
| 14 | `14-salida-tot.png` | 1918×882 | 135 | Total exit |
| 15 | `15-salida-tot-pdf.png` | 1918×936 | 117 | Total exit PDF |
| 16 | `16-salida-parcial.png` | 1918×880 | 144 | Partial exit |
| 17 | `17-salida-pdf-par.png` | 1918×877 | 95 | Partial exit PDF |
| 18 | `18-kardex.png` | 1918×880 | 194 | Kardex, **populated, 10 columns** |
| 19 | `19-bitacora.png` | 1917×880 | 290 | Audit log, 20 records |
| 20 | `20-miperfil.png` | 1918×880 | 148 | User profile |
| — | `hero.png` | 1918×877 | 598 | Login with a visible error |

Three files are 1917 px wide, not 1918: `10-entrada.png`, `13-salidas.png`, `19-bitacora.png`. The
gallery must carry the measured value per file.

#### Findings from visual inspection

1. **`hero.png` is a bad card hero and is near-duplicate weight.** It is the login screen with a
   visible error state (*"Usuario o contraseña incorrectos. Intenta de nuevo."*) at 598 KB, the
   largest asset in the set, on the portfolio's most visible page. `01-login.png` is the same screen
   at 597 KB. Together that is ~1.2 MB for two copies of one error screen.
2. **`02-dashboard.png` shows every counter at zero** with two empty-state panels, so it reads as an
   empty application rather than a working one.
3. **`06-kardex.png` and `18-kardex.png` are NOT duplicates.** Verified visually: 06 is the empty
   state (*"Seleccione un artículo"*), 18 is populated and shows the full 10-column movement table.
   Together they document capability 4 well and should both be kept.
4. **`19-bitacora.png` is the strongest asset in the set.** 20 real audit records with timestamps,
   module, action, description and a private IP (`192.168.237.1`, no public-address leak), plus the
   complete navigation. It directly evidences capability 7, the append-only three-layer audit log,
   which is the project's strongest technical claim.
5. **Placeholder data leaks into one frame.** `18-kardex.png` shows PROVEEDOR = `prueba`, REQUISICIÓN
   = `123`, FACTURA = `14A66AAA-3143254826`. The literal word "prueba" (trial/test) as a supplier name
   is a credibility leak in a portfolio piece.
6. The seeded database holds one product (`PROD-000001 - Resma papel bond`), four Kardex movements
   and 20 audit records. That is demo seed data, which is normal and acceptable to publish — real
   inventory data is not something to expose.

#### Card hero — DECIDED (changed once, then reverted)

**Final: `19-bitacora.png`** (1917×880, 290 KB), referenced as `/images/amsa/19-bitacora.png`.

The hero went through two decisions. The parent recommended `19-bitacora.png` from the start; the user
first chose `hero.png` (the login screen) on the reasonable grounds that it works as a cover — it
carries the AMSA logo, the product name at large, the value proposition and the three capability
icons. The user then reversed that and chose the audit log.

The reversal is the better outcome: it removes the visible error state from the portfolio's most
prominent image, saves 308 KB above the fold, and puts the project's strongest technical claim
(append-only three-layer audit log) on the first thing a reader sees.

Alt text was made specific rather than generic:
`Bitácora de auditoría del Sistema de gestión de almacén AMSA con los registros de actividad del sistema`.

**Open consequence:** `hero.png` (598 KB) now has **zero references** in any HTML, CSS or spec. Per this
repository's own established orphan policy — Vite copies `public/` wholesale into `dist/`, so an
unreferenced file still ships — it should be physically deleted. Awaiting the user's decision.

`19-bitacora.png` also appears as gallery item 19 in the case study, so it is now seen on both pages.
That is acceptable: it is the strongest asset in the set.

### Section 6 — Alternativas descartadas

- **Hosted platform.** Not deployed to a host for lack of budget, which is why it runs on the local
  server.
- **Dedicated domain.** No specific domain was registered for the platform, so the server's IP
  address is used inside the internal network AMSA operates.
- **Desktop vs web.** It was decided to build it as a web application so more users could reach the
  platform.

### Section 7 — Qué salió mal y qué se rehace

- No architecture was chosen up front in order to organize the project properly.
- Planning and implementation were fast and not well organized.
- The training time given to warehouse users was too short.

### Section 8 — Resultado

Delivered qualitatively. **No metrics were supplied and none may be invented.**

Document creation now happens in a single centralized platform, with a default margin and the
correct schema, so the documentation is preserved and registered. All input and output information
for supplies is centralized and recorded in one platform, and several users can access it to control
the flow by which warehouse entries and exits are recorded.

## Route declaration

| Task | Route | Trigger evidence |
|---|---|---|
| T1 | Inline (ask) | Open product/content decision. Only the user holds this. |
| T2 | Delegated direct | Mechanical file placement once the asset exists. |
| T3 | Delegated direct | New non-trivial file requiring the T1 narrative as input. |
| T4 | Delegated direct | 2+ non-trivial files in play (T3 and T4 share approved copy). |
| T5 | Inline | One mechanical, already-understood file. Three-line config edit. |
| T6, T7, T8 | Delegated direct | 3 non-trivial spec files; contract expansion must stay coherent across them. |
| T9 | Delegated direct | Per-action worker; the writer reports the observed results. |

## Acceptance criteria

- [ ] `index.html#proyectos` renders exactly two semantic `<article>` cards in a single column.
- [ ] The AMSA card exposes exactly one `<a>`, pointing at its own case study page, with no
      `target`, no inline handler, no `<button>`, no `<form>`.
- [ ] The Kids Garden card and case study still pass their existing contracts untouched.
- [ ] `caso-de-estudio-amsa.html` exposes exactly one `<h1>` and its approved section order.
- [ ] `vite.config.js` emits all three HTML files to `dist/`.
- [ ] `npm test` reports 0 failures.
- [ ] `npm run build` succeeds and `dist/` contains `index.html`, `caso-de-estudio.html` and
      `caso-de-estudio-amsa.html`.
- [ ] No content appears in the AMSA page or card that the user did not supply.

## Checks

```bash
npm test
npm run build
Get-ChildItem dist -Filter *.html | Select-Object Name
```

## Progress

| Task | State | Evidence |
|---|---|---|
| T1 | **done** | Sections 1–4 and 6–8 recorded verbatim. §5 delivered as video + 21 measured screenshots. Repository private. |
| T2 | **done** | `public/images/amsa/19-bitacora.png` (1917×880, 290 KB) is the card hero. `hero.png` became unreferenced. |
| T3 | **done** | `caso-de-estudio-amsa.html` created: 1 `h1`, 8 sections in approved order, video, 20-image gallery. |
| T4 | **done** | Second card in `index.html#proyectos`. `+73 / -0` — the Kids Garden card is byte-identical. |
| T5 | **done** | Third `rollupOptions.input` entry `casoAmsa` added to `vite.config.js`. |
| T6 | **done** | `tests/proyectos.spec.js`: count 2, per-card approved copy, per-card `href`, `break-words` on every card. |
| T7 | **done** | `tests/caso-de-estudio-amsa.spec.js` created, 6 tests. |
| T8 | **done** | Third page added to `tests/metadata.spec.js`, and the og:title/description distinctness check was **tightened** from a `[0]` vs `[1]` comparison to all-pairs. |
| T9 | **done** | `npm test` 39/39, `npm run build` emits three HTML files. |

## Verification

Baseline before any change, recorded 2026-09-30:

```text
npm test  ->  tests 33, pass 33, fail 0, duration_ms 216.6858
git status --short  ->  (clean)
git rev-parse --abbrev-ref HEAD  ->  update_caso_studio_index
git rev-list --left-right --count main...HEAD  ->  0  5
```

After the implementation, re-verified by the parent rather than accepted on the writer's report:

```text
npm test  ->  tests 39, pass 39, fail 0, duration_ms 286.7428   (+6 net, from the new AMSA spec)
dist/*.html  ->  caso-de-estudio-amsa.html, caso-de-estudio.html, index.html

git diff --stat
  index.html              |  73 +++++++++++++++++++   (insertions only)
  tests/metadata.spec.js  |  20 +++++-
  tests/proyectos.spec.js | 183 ++++++++++++++++++++++----
  vite.config.js          |   1 +
  4 files changed, 219 insertions(+), 58 deletions(-)

git diff --stat -- caso-de-estudio.html tests/caso-de-estudio.spec.js   ->  (empty)
```

The last command is the important one: the Kids Garden page and its spec are **untouched**, so the
existing contract still guards the existing project. `index.html` shows insertions only, so the
original card was not modified.

Structural readback of `caso-de-estudio-amsa.html`, independent of the test suite:

```text
h1 count : 1  ->  Sistema de gestión de almacén AMSA
h2 order : 1. Problema / 2. Restricciones / 3. Decisiones de arquitectura /
           4. Capacidades del sistema / 5. Recorrido por el sistema /
           6. Alternativas descartadas / 7. Qué salió mal y qué se rehace / 8. Resultado
sections : problema -> restricciones -> arquitectura -> capacidades ->
           recorrido-title -> alternativas -> que-salio-mal -> resultado
imgs     : 20 | min-w-0: 20 | iframes: 1
transition-* missing motion-reduce: 0
mojibake : 0
"captura" occurrences: 0
dimension mismatches (declared vs real PNG bytes): none
```

The dimension check reads the PNG IHDR header directly rather than trusting the table in this
document. That is how the writer caught the transposed filename `17-salida-pdf-par.png`.

## Deviations

1. **Filename corrected against disk.** This document originally listed
   `17-salida-parcial-pdf.png`; the real file is `17-salida-pdf-par.png`. The writer validated every
   `width`/`height` against the actual PNG IHDR bytes and found it. A spec built from the wrong name
   would have failed `existsSync`. Corrected above.
2. **"captura" collision resolved.** The approved content included "Sentry covers observability and
   error capture", which put a banned word on the page (`proyectos.spec.js:104` and the case-study
   copy rules forbid it). Rendered as *el registro de errores* — a faithful synonym, not a
   paraphrase that changes meaning. Page-wide count of `captura` is 0 and the new spec asserts that
   page-wide rather than only inside the gallery.
3. **`tests/metadata.spec.js` tightened, not just extended.** The og:title/og:description
   distinctness check compared only `[0]` against `[1]`. With a third page that would have left page
   three unchecked. Changed to an all-pairs comparison.
4. **`gap-6` left deliberately unnormalised.** The outer `#proyectos` grid is `gap-8` while the spec
   asserts `gap-6`; it passes only via the card's inner overlay class. Left as is and documented.
5. **Hero swap broke a cross-file contract, and the contract caught it.** Changing the AMSA card hero
   made `npm test` fail with `index.html must render the AMSA card`, because
   `tests/caso-de-estudio-amsa.spec.js:336` located the card by hardcoding
   `\/images\/amsa\/hero\.png` in a regex. Rather than patch the path, the locator was rebuilt to
   anchor on the invariant that actually identifies the project — the card's own
   `caso-de-estudio-amsa.html` href — so swapping the hero can never again detach that assertion from
   the card it guards. Verified: the new locator matches exactly the AMSA card and not the Kids Garden
   card, the old locator no longer matches anything, and mutating the href makes it miss.
6. **A grep of mine missed the break.** The parent searched for `hero\.png` to find every reference
   and missed the one that mattered, because inside a regex literal the file reads `hero\.png` — the
   literal-search pattern does not match the escaped form. The test suite found it instead. Lesson:
   when a string may live inside a regex, search for the bare word, not the literal.

## Open question for the user

Section 8 currently reads *"con un margen predeterminado y el esquema correcto"*, kept faithful to
the supplied copy. The phrase is ambiguous: given capability 2 documents 1-H PDF print calibration
in millimetres with configurable offsets, **margen predeterminado** most likely means a default print
margin for that PDF. It could also be an imprecise phrase from the user. Nothing was guessed.

## Next step

1. Confirm the section 8 wording for *margen predeterminado*.
2. User decision required: commit the work-unit on `update_caso_studio_index`. Nothing is committed,
   pushed, or merged — delivery is the user's call under ordinary repository policy.
3. Delivery note: this branch is 5 commits ahead of `main` and the Pages workflow only runs on
   `main`, so nothing publishes until a merge happens.
