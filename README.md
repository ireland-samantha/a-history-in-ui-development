# A History in UI Development (1966–2026)

**An Open Educational Platform, Interactive p5.js Visual Laboratory & 1,026-Wireframe UX Research Workbench**

Welcome! **A History in UI Development** is a self-contained educational web platform for students, interface designers, HCI researchers, and engineers exploring how software and web user interfaces evolved over the past 60 years (`1966–2026`).

It pairs an interactive **4-mode p5.js visual laboratory** with a **1,026-wireframe procedural research corpus** spanning **12 historical UI eras**, **10 application domains**, **10 platform classes**, and **35 UI component primitives**—from 1960s vector CRT light-pen scopes and 1970s character terminals to 1980s WIMP desktops, 1990s Web 1.0 and table portals, 2000s Ajax RIAs, 2010s responsive flat systems, and 2020s command-first bento grids and agentic workspaces.

## Quick Start (Zero Setup)

- **Direct Browser Open (No Server Required)**: Open `public/index.html` directly in Chrome, Firefox, Safari, or Edge. The platform automatically loads the pre-compiled offline corpus bundle (`public/data/corpus-bundle.js`) and vendored `p5.min.js` v1.9.4 so all 1,026 wireframes, 4 p5.js modes, and 6 guided lessons work immediately offline.
- **Optional Local Server**: Run `server.py` (default port 8080) if you want local JSON summary endpoints (`/api/health` and `/api/summary`).

## Usability Guide: How to Explore & Teach with the Platform

### 1. Top Bar, 12-Era Ribbon & Guided Curriculum
- **12-Era Quick Ribbon (`E01` to `E12`)**: Click any of the 12 historical era chips along the top ribbon to filter both the p5.js timeline and the research workbench to that era. Click the active chip again (or click **Reset All** in the left sidebar) to restore all 1,026 wireframes.
- **Guided Curriculum & Usability Tab (`05 Guided Curriculum, Usability & Limits`)**: Click the **`? Guide & Limits`** button in the top bar (or the 5th tab in the workbench) to launch **6 one-click Interactive Lessons** that automatically configure the p5.js stage, shader fidelity, filters, and 3-era comparator for classroom or self-paced study.
- **Export JSON / Export CSV**: Downloads the currently filtered wireframe subset (or all 1,026 records) for external analysis.

### 2. The 4 Interactive p5.js Modes (Top Stage)
- **Mode 01 — Chronos 60-Year Landscape (`01 Chronos 60-Year Landscape`)**:
  - Plots all 1,026 wireframes across `1966–2026` against any selectable Y-axis UX metric (*Information Density*, *Visual Chrome Ratio*, *Layout Responsiveness*, *Fitts's Law Efficiency*, *Cognitive Load Index*, or *Keyboard ↔ Pointer/Touch Bias*).
  - **Hover** any dot (gold = curated historical landmark; colored = era) to preview its mini schematic on the canvas. **Click** any dot to select it and reveal green directed lineage edges to its predecessors and successors.
  - Click **`▶ Play 60Y Evolution`** or drag the **Scrub Year** slider to animate the 60-year progression.
- **Mode 02 — Live p5.js Wireframe Simulator (`02 Live p5.js Wireframe Simulator`)**:
  - Renders the active wireframe at full scale with three switchable inspection shaders:
    1. *Era-Authentic Chrome & Shader*: Simulates CRT scanlines and phosphor glow (`1966–1978`), 1-bit classic Mac drop shadows (`1979–1984`), 3D raised Win95/Motif bevels (`1985–1996`), Web 2.0 gloss, flat cards, and spatial glass.
    2. *Architectural Wireframe Blueprint*: Cyan-on-navy technical schematics with media diagonals and pixel dimension callouts (`w×h`).
    3. *Fitts's Law & Attention Heatmap*: Draws target acquisition rings and traversal vectors from viewport center, scoring each UI element in bits (`ID = log2(D/W + 1)`).
  - **Click any component box** inside the simulator canvas to inspect its exact bounding-box coordinates (`x, y, w×h`) in the right HUD. Use **`Grid Columns`**, **`HUD Telemetry`**, and **`← Prev Year` / `Next Year →`** to step through the corpus.
- **Mode 03 — Web UI Trends Morphing Lab (`03 Web UI Trends Morphing Lab`)**:
  - Smoothly interpolates bounding-box geometry across 6 web layout eras (`1993 HTML 2.0 Flow` → `1998 3-Col Table Portal` → `2005 Web 2.0 Ajax Split` → `2013 Responsive 12-Col Flat` → `2020 Dark Token Bento + ⌘K` → `2026 Agentic Spatial Canvas`) across 6 web application archetypes.
  - Drag the **Web Era Morph** slider, click **`▶ Auto-Morph Web Eras`**, or **click any of the 6 stage cards** on the right of the canvas to jump directly to that layout engine.
- **Mode 04 — UI Genealogy Constellation (`04 UI Genealogy Constellation`)**:
  - Displays a radial 60-year network graph grouped by **12 Historical Eras Ring** or **10 Software & Web Domains**. Hover or click any node to inspect its predecessor/successor lineage neighborhood, and click **`Reset Camera`** to recenter.

### 3. The 5 Research Workbench Views (Bottom Section)
1. **Wireframe Gallery Grid**: Filter by search query, year range, era, decade, domain, platform, layout engine, component primitive, landmarks-only (`122`), or web-only (`604`). Click **`Simulate p5.js`**, **`Blueprint`**, or **`+ Compare`** on any card.
2. **Deep Blueprint Inspector**: View high-resolution labeled schematics, paradigm/innovation/trade-off commentary, Predecessor/Successor jump pills, and the full **Component Hierarchy Tree** table (clicking any table row highlights that node in the p5.js Simulator).
3. **Side-by-Side Era Comparator**: Compare up to 3 wireframes side-by-side or load one of the 3 curated historical triads (*1968 NLS vs 1995 Amazon vs 2026 Agentic*, *1993 Mosaic vs 2004 Gmail vs 2020 Roam/Bento*, or *1976 vi TUI vs 1989 NeXTSTEP vs 2024 Cursor AI*).
4. **60-Year UX & Web Trend Analytics**: Quantitative table and summary cards comparing average density, visual chrome overhead, responsiveness, and Fitts's Law efficiency across all 12 eras.
5. **Guided Curriculum, Usability & Limits**: Interactive 6-lesson curriculum launcher, quick-reference usability guide, methodology & limitations disclosure, and IP notice.

## Methodology, Scope & Limitations Notice

1. **Procedural Schematic Reconstructions, Not Archival Screenshots**:
   - All 1,026 wireframes in `public/data/wireframes.json` are deterministic, procedurally generated bounding-box schematics (`layoutSpec.nodes`) parameterized by era-authentic layout grammars (`scripts/generate_dataset.py`).
   - The **122 historical landmark entries** (such as 1966 MIT TX-2 Sketchpad II, 1968 SRI NLS, 1981 Xerox Star, 1984 Macintosh System 1.0, 1993 NCSA Mosaic, 2004 Gmail Beta, 2007 iPhone OS, 2016 Figma, 2019 Linear, and 2024 Cursor) are **pedagogical structural approximations** built to teach layout proportions, component hierarchies, and input paradigms. They are **not** pixel-exact archival screenshots, decompiled vendor binaries, or primary historical artifacts.
2. **Heuristic UX Metric Models, Not Empirical Human-Subject Measurements**:
   - Quantitative `uxMetrics` (`informationDensity`, `interactionComplexity`, `visualChromeRatio`, `keyboardToPointerBias`, `layoutResponsiveness`, `fittsLawEfficiency`, and `cognitiveLoadIndex`) are deterministic heuristic models computed from bounding-box geometry and era parameters for comparative instruction, **not** measurements from human-subject laboratory trials or eye-tracking studies.
3. **Curated Pedagogical Taxonomy**:
   - The 12 eras, 10 domains, 10 platform classes, and 35 component primitives represent an instructional model of major inflection points in computing and web UI design (`1966–2026`), not an exhaustive census of global software history.

## Unlicensed IP, Public Domain Dedication & Trademark Notice

1. **Original Code, Schemas & Procedural Dataset — The Unlicense (Public Domain)**:
   - All original source code, visualization modules, procedural layout generators, JSON schemas, and synthetic wireframe geometries in this repository are dedicated to the public domain under **[The Unlicense](UNLICENSE)**.
2. **Third-Party Product Names & Unlicensed IP Boundary**:
   - Historical product names, system titles, and organizations referenced in the 122 landmark records (e.g., *Sketchpad*, *IBM 3270*, *DEC VT100*, *Xerox Star*, *Apple Macintosh*, *Microsoft Windows*, *NeXTSTEP*, *NCSA Mosaic*, *Netscape*, *Yahoo!*, *Amazon*, *Gmail*, *Google Maps*, *iPhone*, *GitHub*, *Figma*, *Notion*, *Linear*, *Cursor*, and others) are cited strictly for **nominative, educational, and comparative UX history instruction**.
   - **No Affiliation or Vendor License**: This educational project is independent and is **not licensed by, endorsed by, sponsored by, or affiliated with** any referenced vendor or rights holder ("unlicensed IP" in that no third-party proprietary IP is licensed, bundled, or claimed).
   - **Zero Proprietary Assets Bundled**: No proprietary screenshots, icons, bitmaps, fonts, or copyrighted UI code from any commercial vendor are included in this repository. All third-party trademarks remain the exclusive property of their respective owners.
   - **Vendored Open-Source Library**: `public/vendor/p5.min.js` is p5.js v1.9.4 (LGPL v2.1).

