# A History in UI Development (1966–2026)

**Interactive p5.js Web UI Trends Experience & 1,026-Wireframe UX Research Workbench**

## Overview
**A History in UI Development** is a standalone interactive web product (built with **p5.js** v1.9.4 and vanilla ES2024 HTML5/CSS3) paired with a deterministic, schema-validated seed dataset of **1,026 structurally unique software and web UI wireframes** spanning **60 years of UI history (1966–2026)** across **12 historical UI eras**, **10 application domains**, **10 platform classes**, and **35 UI component primitives**.

## Deliverables & Architecture

1. **Seed Dataset (`public/data/`)**:
   - `wireframes.json` & `wireframes.jsonl`: **1,026 unique wireframes** covering every calendar year from `1966` through `2026` (`span = 60 years`, `16–18 wireframes/year`, `>= 54 wireframes/era`), including **122 curated historical landmarks** (from 1966 MIT Lincoln Lab TX-2 Sketchpad II and 1968 SRI NLS to 1993 NCSA Mosaic, 2004 Gmail Ajax, 2007 iPhone OS, 2016 Figma WebGL, 2019 Linear `⌘K`, and 2026 Agentic Verification Studios).
   - Every wireframe contains a bounded spatial component tree (`layoutSpec.nodes` with 8–16 positioned primitives), quantitative `uxMetrics` (`informationDensity`, `interactionComplexity`, `visualChromeRatio`, `keyboardToPointerBias`, `layoutResponsiveness`, `fittsLawEfficiency`, `cognitiveLoadIndex`), `uxResearchNotes`, bidirectional chronological lineage links (`predecessorIds`, `successorIds`), and an independently verified unique geometric `structuralHash`.
   - `trends.json`: 61-year time-series aggregates (1966–2026), 12 era definitions, 28 component adoption series, and 6 multi-stage **Web Layout Morphing Archetypes** (1993–2026).
   - `schema.json`: JSON Schema (Draft 2020-12) for the wireframe seed dataset.

2. **Interactive p5.js Product Experience (`public/js/p5-experience.js`)**:
   - **Mode 01 — Chronos 60-Year Landscape (`chronos`)**: Interactive p5.js timeline & stream landscape plotting all 1,026 wireframes from 1966 to 2026 with animated time-scrubber playback, selectable Y-axis UX metrics, lineage edges, and hover mini-wireframe schematic cards.
   - **Mode 02 — Live p5.js Wireframe Simulator (`simulator`)**: Renders any selected wireframe on the p5.js stage with 3 switchable shader fidelities:
     - *Era-Authentic Chrome & Shader* (CRT scanlines & phosphor glow for 1966–1978, 1-bit classic Mac drop-shadows for 1979–1984, 3D raised/sunken Win95/Motif bevels for 1985–1996, Web 1.0/2.0 chrome, Flat cards, and Spatial Glass)
     - *Architectural Wireframe Blueprint* (blueprints, crossed media diagonals, dimension callouts)
     - *Fitts's Law & Attention Heatmap* (index-of-difficulty target rings and traversal vectors from viewport center)
   - **Mode 03 — Web UI Trends Morphing Lab (`web-morph`)**: Smooth p5.js geometric interpolation across 6 canonical web layout stages (`1993 HTML 2.0 Flow` → `1998 3-Col Table Portal` → `2005 Web 2.0 Ajax Split` → `2013 Responsive 12-Col Flat` → `2020 Dark Token Bento + ⌘K` → `2026 Agentic Spatial Canvas`) across 6 web application archetypes, paired with a live Web Responsiveness vs. Visual Chrome curve.
   - **Mode 04 — UI Genealogy Constellation (`constellation`)**: Radial 60-year network graph visualizing predecessor/successor lineage edges across eras and domains.

3. **Modern UX Research Dashboard (`public/js/dashboard.js`, `public/index.html`, `public/styles.css`)**:
   - Instant full-text search, year range sliders (`1966–2026`), and multi-facet filtering by Era (12), Decade (7), Domain (10), Platform (10), Layout Engine, Component Primitive (35), Landmarks-Only, and Web-Native-Only.
   - **Wireframe Gallery Grid**: Paginated card grid with live HTML5 canvas wireframe thumbnails and metric sparkbars.
   - **Deep Blueprint Inspector**: High-resolution blueprint canvas, full component node table, UX research commentary, and one-click Predecessor/Successor lineage traversal.
   - **Side-by-Side Era Comparator**: 3-column visual and quantitative comparator with curated historical triads.
   - **60-Year UX & Web Trend Analytics** + one-click **JSON / CSV Export**.

## Quick Start & Verification

```bash
# Regenerate deterministic dataset (1,026 wireframes)
python3 -I scripts/generate_dataset.py

# Start HTTP server (default port 8080)
python3 -I server.py --port 8080

# Run independent verification suite
python3 -I tests/verify_dataset.py
python3 -I tests/verify_app_http.py
node tests/verify_browser_e2e.mjs
python3 -I tests/verify_stewardship.py
```
