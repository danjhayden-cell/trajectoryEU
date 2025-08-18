PRD — Trajectory.eu (Prototype, Cursor-ready)

Owner: Dan
Today’s date: 14 Aug 2025
Repository docs path: docs/PRD.md (paste this file there)

⸻

1) Product summary

One-liner: See how small differences in growth compound into big futures.
Problem: EU policy debates fixate on the present level of indicators and miss long-run trajectory and compounding.
Solution: A web app that lets users compare historical trends and project them 5/10/20/50 years for Europe vs peers, with a plain-language narrative that makes outcomes tangible.

Primary audience: Policy analysts, journalists, think-tanks.
Core outcome: Quickly grasp the impact of different annual growth rates on future living standards, public capacity, innovation, and energy.

⸻

2) Scope (V1)

In scope
	•	Regions: EU (EU27_2020 aggregate), US, China, BRICS (configurable); plus EU country picker.
	•	Time horizons: 5, 10, 20, 50 years and a slider control.
	•	Indicators (initial):
	•	GDP per capita (PPP, constant) — default
	•	Real GDP growth (annual %)
	•	R&D expenditure (% GDP)
	•	Gross capital formation (% GDP)
	•	Labour productivity (per hour worked; index)
	•	Price level / purchasing power (HICP or comparable index)
	•	“Front-page preset”: EU vs US since 2000 → project to 2050.
	•	Projection model: simple compounding from recent CAGR or a user-set growth rate; scenarios ±0.5pp.
	•	LLM narrative panel (clearly flagged Illustrative): ties selected comparison to everyday effects.
	•	Export: shareable URL; PNG of main chart with attribution.
	•	Methodology & Sources page.

Out of scope (V1)
	•	Auth, saved dashboards, collaboration.
	•	Advanced econometrics (confidence intervals, structural models).
	•	Sub-national views (NUTS), sector breakdowns.
	•	Live “AI compute” or “unicorn funding” feeds with restrictive licenses (use placeholder CSVs only).

⸻

3) Success measures (prototype)
	•	Time-to-insight: New user reaches a meaningful compare view in < 20s.
	•	Engagement: Median session ≥ 2 min, ≥ 2 indicators tested.
	•	Shareability: ≥ 10% of sessions come from shared URLs.
	•	Performance: FCP < 2.0s desktop, JS on initial route < 250 kB.

⸻

4) UX & IA

Pages
	1.	Compare (Home) — the app.
	2.	Methodology & Sources — definitions, caveats, data provenance.

Compare page layout
	•	Controls (top bar): Indicator • Geography multi-select • Horizon buttons + slider • Scenario (Baseline / +0.5pp / −0.5pp / Custom rate) • Unit toggle (PPP/real/nominal where relevant) • Preset chip (“EU vs US since 2000”).
	•	Main chart:
	•	History solid lines, projection dashed; index-normalize option (start year = 100).
	•	Optional tabs (later): League table (latest level + CAGR), Small multiples.
	•	Narrative panel (LLM): 120–180 words; bullets for Household / Public services / Startups & capital; explicit disclaimer.
	•	Footer note: “Prototype; illustrative projections based on constant rates.”

Accessibility
	•	Keyboard-first, readable focus states, color-blind-safe palette, WCAG AA.

⸻

5) Data & indicators

Open sources
	•	World Bank (global comparators): GDP per capita PPP (NY.GDP.PCAP.PP.KD), real GDP growth (NY.GDP.MKTP.KD.ZG), capital formation (NE.GDI.TOTL.ZS), R&D (% GDP) (GB.XPD.RSDV.GD.ZS).
	•	Eurostat (EU detail; second wave).
	•	OECD (backup for productivity/R&D).
	•	Manual CSV placeholders (for demo-only): AI compute proxy, unicorn counts/funding.

Tidy schema

{ indicator, unit, geo, year, value, source }

Normalization
	•	Prefer PPP/real; otherwise expose a Unit toggle.
	•	Use EU27_2020 label for EU aggregate.
	•	Offer Index = 100 at start year.

Refresh
	•	Prototype: on deploy; later: nightly cron.

⸻

6) Projection model (V1)
	•	History: official series as published.
	•	CAGR: last 10 years by default (bounded by available data).
	•	Projection: V(t) = V0 * (1 + r)^t; r = CAGR + scenario_delta.
	•	Bands: optional ±0.25pp sensitivity (low priority).
	•	Display rules: cap horizon at 50y; clamp absurd values; visually separate history vs projection.

⸻

7) LLM narrative (illustrative)

Purpose: Translate trajectories into lived-experience terms; neutral, caveated.
Length: 120–180 words + 3 bullets.
Tone: Descriptive, non-advocacy, avoids certainty.
Inputs: indicator, regions, horizon, base CAGR(s), scenario deltas, units, starting year, last observed values.

Prompt template (drop in lib/narrativePrompt.ts)

SYSTEM: You are an economics explainer for policy audiences. Be neutral, concise, and explicit about uncertainty.
USER: Using the following inputs:
- Indicator: {indicator} (unit: {unit})
- Regions: {regions}
- Start year: {startYear}, Last historical year: {lastYear}
- Recent CAGR: {cagrSummary}
- Projection horizon: {horizon} years
- Scenario delta (pp): {scenarioDelta}

TASK:
1) Explain what a {scenarioDelta} pp difference in annual growth would mean by {lastYear + horizon}, referencing relative levels not precise predictions.
2) Use accessible comparisons (household income, public services capacity, startup capital) with conservative ranges.
3) Include one line "Why this could differ" (demographics, shocks, measurement).

Style: 120–180 words + 3 bullets titled Household, Public services, Startups & capital. End with “Illustrative; constant-rate assumption; not a forecast.”


⸻

8) Architecture & stack
	•	Next.js 15 + React 19, Tailwind v4, shadcn/Radix (later), Observable Plot (charts), Arquero (light data ops).
	•	Edge route(s) with 24h revalidation for data fetches.
	•	Analytics: Plausible (optional).
	•	Hosting: Vercel.
	•	Dev env: Dev Containers (Docker) — already configured.

Initial file map (at repo root)

/app
  /api/worldbank/route.ts        ← GET rows from World Bank (done)
  /components/chart-plot.tsx     ← Plot wrapper (done)
  compare-client.tsx             ← Controls + chart + projection (done)
  page.tsx                       ← Home route (done)
  methodology/page.tsx           ← (new) Sources & caveats
/lib
  worldbank.ts                   ← Fetch + tidy helpers (done)
  narrativePrompt.ts             ← (new) Prompt builder
  project.ts                     ← (new) CAGR + projection helpers
/public
  logo.svg, og.png               ← (new) Branding assets
/docs
  PRD.md                         ← (this file)

Environment

# .env.local
OPENAI_API_KEY= # if/when wiring the narrative panel
PLAUSIBLE_DOMAIN=trajectory.eu # optional later


⸻

9) API contracts (prototype)

GET /api/worldbank

Query:
indicator (default NY.GDP.PCAP.PP.KD) • countries (CSV: EUU,USA) • start (year, default 2000) • end (default current year)
Response:

{ "rows": [
  {"geo":"EUU","year":2000,"value":25000.1,"indicator":"NY.GDP.PCAP.PP.KD"},
  {"geo":"USA","year":2000,"value":45321.9,"indicator":"NY.GDP.PCAP.PP.KD"}
]}

Cache: 24h (Next revalidate); error → { error: string }.

(Eurostat & OECD adapters are V1.1 tasks.)

⸻

10) State & URL scheme

All selections encoded in URL for shareability.

/?ind=NY.GDP.PCAP.PP.KD&geo=EUU,USA&start=2000&h=20&sc=0&idx=1&unit=ppp

	•	ind indicator id; geo CSV of WB/EU codes; start start year; h horizon years; sc scenario delta (pp); idx index-normalize flag; unit current unit choice.

⸻

11) Non-functional
	•	Perf budgets: FCP < 2.0s, JS < 250 kB on initial route, LCP < 2.5s.
	•	A11y: WCAG AA; keyboard navigation; chart alt summary (data caption).
	•	Privacy: No cookies beyond optional analytics; explicit source attribution.
	•	Security: Rate-limit LLM route if added; validate query params.

⸻

12) Acceptance criteria (Given/When/Then)
	1.	Compare view renders
	•	Given the app loads with default preset
	•	When I press Preset: EU vs US
	•	Then I see solid history lines and dashed projections, indexed to 100 at the start year.
	2.	Scenario affects slope
	•	Given horizon = 20 years
	•	When I set Scenario to +0.5pp
	•	Then projection slopes increase consistently and the legend shows “Baseline vs +0.5pp”.
	3.	URL share works
	•	Given I change indicator, horizons, and countries
	•	When I copy the URL and open it in a new tab
	•	Then the exact state is restored.
	4.	PNG export
	•	Given a rendered chart
	•	When I click Export PNG
	•	Then I receive a ≥2× image with a footer “Source: World Bank — Prototype”.
	5.	Narrative panel
	•	Given indicator = GDP per capita PPP, EU vs US, horizon 20y
	•	When I request the narrative
	•	Then I get 120–180 words + 3 bullets + disclaimer, reflecting my current selections.

⸻

13) Build plan (tasks Cursor can pick up)

Copy the list below into docs/TASKS.md or as GitHub issues.

M0 — Baseline (✅ mostly done)
	•	Confirm dev server runs in Dev Container.
	•	Install @observablehq/plot, arquero.

M1 — Compare page polish
	•	Replace text inputs with compact controls (selects, buttons, slider).
	•	Add index-normalize toggle and unit toggle (where applicable).
	•	Limit visible series to ≤6; show warning if more selected.

M2 — URL state & preset
	•	Read/write state from URL params (ind, geo, start, h, sc, idx, unit).
	•	Add “EU vs US since 2000” preset chip.

M3 — PNG export
	•	Implement chart PNG export (toDataURL or html-to-image) with source footer.

M4 — Methodology page
	•	Create /methodology with sources, definitions, and caveats.

M5 — Narrative (stub → live)
	•	Add lib/narrativePrompt.ts and a server route /api/narrative that accepts the current selection and returns text (guardrails + 120–180 words).
	•	Client: Generate narrative button; loading/error states; disclaimer banner.
	•	Env: OPENAI_API_KEY support.

M6 — Indicators & data adapters (stretch)
	•	Add R&D % GDP, capital formation % GDP endpoints via /api/worldbank.
	•	Add Eurostat adapter for HICP and productivity (V1.1).
	•	Add manual CSV loader for AI compute/unicorn placeholders (label “demo”).

⸻

14) Risks & mitigations
	•	Comparability (PPP vs nominal, EU series definitions): expose unit toggle + caveats; default to PPP/real.
	•	Narrative overreach: hard-cap length; include uncertainty line; never state certainties.
	•	Visual overload: limit series; provide small multiples later.
	•	Licensing (unicorn data): demo-only CSV, clearly labelled.

⸻

15) Copy blocks (ready to paste)
	•	Hero: “See how small differences become big futures.”
	•	Narrative disclaimer: “Illustrative projection. Assumes constant annual growth; outcomes can diverge due to shocks, demographics, or measurement.”
	•	Methodology lead: “History uses official sources (World Bank/Eurostat). Projections apply simple compounding from recent average growth or a user-set rate.”

⸻

Final note

This PRD is intentionally implementation-ready for Cursor. Create docs/PRD.md with this content, then open Tasks and start with M1 → M3. If you want, I can generate docs/TASKS.md as individual GitHub issues text next.