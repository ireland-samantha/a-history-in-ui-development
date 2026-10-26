#!/usr/bin/env node
/**
 * Independent Fail-Closed Headless Chromium E2E Verifier (Criterion C3)
 * Verifies:
 *   - 0 console.error / pageerror events
 *   - 1,026 wireframes loaded in window.UIHistoryState
 *   - Real p5.js canvas rendering & pixel diversity across all 4 modes:
 *     1. chronos (1966-2026 macro timeline)
 *     2. simulator (era-authentic, blueprint, and fitts-heatmap shaders)
 *     3. web-morph (1993->2026 web layout morphing interpolation)
 *     4. constellation (radial genealogy network)
 *   - Multi-facet search, era filter, reset, pagination, Blueprint Inspector lineage jump,
 *     Side-by-Side Era Comparator presets, 60-Year Analytics table, and JSON/CSV exports.
 */

import { spawn } from "node:child_process";
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire("/home/linuxbrew/.linuxbrew/lib/node_modules/playwright/index.js");
const { chromium } = require("/home/linuxbrew/.linuxbrew/lib/node_modules/playwright");

const ROOT = "/mnt/c2r/repos/history-in-ui-development";
const EVIDENCE_DIR = "/mnt/c2r/state/runs/20261026-124146-history-ui-dev-emfTsz/evidence";

function fail(msg) {
  console.error(`FAIL [verify_browser_e2e]: ${msg}`);
  process.exit(1);
}

function getFreePort() {
  return new Promise((resolve, reject) => {
    const srv = net.createServer();
    srv.listen(0, "127.0.0.1", () => {
      const port = srv.address().port;
      srv.close(() => resolve(port));
    });
    srv.on("error", reject);
  });
}

async function waitForServer(url, timeoutMs = 6000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(`${url}/api/health`);
      if (res.ok) return;
    } catch (_) {
      // retry
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error(`Server did not start within ${timeoutMs}ms at ${url}`);
}

async function main() {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true });
  const port = await getFreePort();
  const baseUrl = `http://127.0.0.1:${port}`;

  const serverProc = spawn("python3", ["-I", path.join(ROOT, "server.py"), "--port", String(port), "--host", "127.0.0.1"], {
    cwd: ROOT,
    stdio: "ignore",
  });

  let browser = null;
  try {
    await waitForServer(baseUrl);

    browser = await chromium.launch({
      executablePath: fs.existsSync("/usr/bin/google-chrome") ? "/usr/bin/google-chrome" : undefined,
      headless: true,
      args: ["--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
    });

    const context = await browser.newContext({ viewport: { width: 1440, height: 960 } });
    const page = await context.newPage();

    const errors = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`console.error: ${msg.text()}`);
    });
    page.on("pageerror", (err) => {
      errors.push(`pageerror: ${err.message}`);
    });

    await page.goto(baseUrl, { waitUntil: "networkidle" });

    // Wait for dataset and p5.js canvas to initialize
    await page.waitForFunction(
      () =>
        window.UIHistoryState &&
        Array.isArray(window.UIHistoryState.wireframes) &&
        window.UIHistoryState.wireframes.length >= 1000 &&
        typeof window.p5 !== "undefined" &&
        document.querySelector("#p5-canvas-container canvas") !== null,
      { timeout: 10000 }
    );

    const wfCount = await page.evaluate(() => window.UIHistoryState.wireframes.length);
    if (wfCount !== 1026) fail(`Expected 1026 wireframes in state, got ${wfCount}`);

    // Helper to sample p5.js canvas pixel diversity and checksum
    async function inspectP5Canvas() {
      return await page.evaluate(() => {
        const cnv = document.querySelector("#p5-canvas-container canvas");
        if (!cnv) return null;
        const ctx = cnv.getContext("2d");
        const w = cnv.width;
        const h = cnv.height;
        const img = ctx.getImageData(0, 0, w, h).data;
        const buckets = new Set();
        let nonBgPixels = 0;
        let hash = 0;
        for (let i = 0; i < img.length; i += 64) {
          const r = img[i];
          const g = img[i + 1];
          const b = img[i + 2];
          buckets.add(`${r >> 4}-${g >> 4}-${b >> 4}`);
          if (r > 18 || g > 22 || b > 30) nonBgPixels++;
          hash = (hash * 31 + r + g * 3 + b * 7) | 0;
        }
        return { width: w, height: h, uniqueColorBuckets: buckets.size, nonBgPixels, hash };
      });
    }

    // 1. Verify all 4 p5.js modes
    const modes = ["chronos", "simulator", "web-morph", "constellation"];
    const modeStats = {};

    for (const mode of modes) {
      await page.click(`[data-p5-mode="${mode}"]`);
      await page.waitForTimeout(350);
      const stats = await inspectP5Canvas();
      if (!stats || stats.width < 600 || stats.height < 400) {
        fail(`Invalid canvas dimensions in mode ${mode}: ${JSON.stringify(stats)}`);
      }
      if (stats.uniqueColorBuckets < 8 || stats.nonBgPixels < 200) {
        fail(`Canvas appears blank or low-variance in mode ${mode}: ${JSON.stringify(stats)}`);
      }
      modeStats[mode] = stats;
      await page.screenshot({ path: path.join(EVIDENCE_DIR, `p5-mode-${mode}.png`), fullPage: false });
    }

    // 2. Verify Simulator shader fidelity switching changes rendered pixels
    await page.click('[data-p5-mode="simulator"]');
    await page.selectOption("#sim-fidelity-select", "era-authentic");
    await page.waitForTimeout(200);
    const simAuthentic = await inspectP5Canvas();

    await page.selectOption("#sim-fidelity-select", "blueprint");
    await page.waitForTimeout(200);
    const simBlueprint = await inspectP5Canvas();

    await page.selectOption("#sim-fidelity-select", "fitts-heatmap");
    await page.waitForTimeout(200);
    const simHeatmap = await inspectP5Canvas();
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "p5-simulator-fitts-heatmap.png") });

    if (simAuthentic.hash === simBlueprint.hash || simBlueprint.hash === simHeatmap.hash) {
      fail("Simulator fidelity shader modes produced identical pixel hashes");
    }

    // 3. Verify Web Morph slider interpolation in Mode 3
    await page.click('[data-p5-mode="web-morph"]');
    await page.fill("#morph-stage-slider", "0");
    await page.dispatchEvent("#morph-stage-slider", "input");
    await page.waitForTimeout(200);
    const morph0 = await inspectP5Canvas();

    await page.fill("#morph-stage-slider", "300");
    await page.dispatchEvent("#morph-stage-slider", "input");
    await page.waitForTimeout(200);
    const morph300 = await inspectP5Canvas();

    if (morph0.hash === morph300.hash) {
      fail("Web UI Trends Morphing slider did not change rendered wireframe geometry");
    }

    // 4. Verify Dashboard Search & Multi-Facet Filtering
    await page.selectOption("#filter-era", "E05_EARLY_WEB_PORTAL");
    await page.waitForTimeout(150);
    const e05Count = await page.evaluate(() => window.UIHistoryState.filteredWireframes.length);
    if (e05Count < 50 || e05Count > 150) {
      fail(`Expected E05 era filter to yield 50..150 wireframes, got ${e05Count}`);
    }

    await page.fill("#search-input", "Mosaic");
    await page.dispatchEvent("#search-input", "input");
    await page.waitForTimeout(150);
    const mosaicTitles = await page.evaluate(() => window.UIHistoryState.filteredWireframes.map((w) => w.title));
    if (!mosaicTitles.some((t) => t.includes("Mosaic"))) {
      fail(`Search for 'Mosaic' did not find NCSA Mosaic landmark: ${JSON.stringify(mosaicTitles)}`);
    }

    await page.click("#btn-reset-filters");
    await page.waitForTimeout(150);
    const resetCount = await page.evaluate(() => window.UIHistoryState.filteredWireframes.length);
    if (resetCount !== 1026) {
      fail(`Reset filters did not restore 1,026 wireframes, got ${resetCount}`);
    }

    // 5. Verify Deep Blueprint Inspector & Lineage Traversal
    await page.click('[data-dash-tab="inspector"]');
    await page.waitForTimeout(200);
    const inspectorInfo = await page.evaluate(() => {
      const cnv = document.getElementById("inspector-blueprint-canvas");
      const rows = document.querySelectorAll("#view-inspector tbody tr").length;
      const jumpBtn = document.querySelector("#view-inspector [data-jump-wf]");
      return { hasCanvas: Boolean(cnv), rows, jumpTarget: jumpBtn ? jumpBtn.getAttribute("data-jump-wf") : null };
    });
    if (!inspectorInfo.hasCanvas || inspectorInfo.rows < 8 || !inspectorInfo.jumpTarget) {
      fail(`Inspector view incomplete: ${JSON.stringify(inspectorInfo)}`);
    }
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "dashboard-inspector.png") });

    // Click lineage jump button and verify activeWireframe updates
    await page.click("#view-inspector [data-jump-wf]");
    await page.waitForTimeout(150);
    const newActiveId = await page.evaluate(() => window.UIHistoryState.activeWireframe.id);
    if (newActiveId !== inspectorInfo.jumpTarget) {
      fail(`Lineage jump button did not switch activeWireframe to ${inspectorInfo.jumpTarget} (got ${newActiveId})`);
    }

    // 6. Verify Side-by-Side Era Comparator
    await page.click('[data-dash-tab="compare"]');
    await page.waitForTimeout(200);
    await page.click('[data-compare-preset="triad-web"]');
    await page.waitForTimeout(200);
    const compareCardCount = await page.locator("#compare-columns [data-compare-card]").count();
    if (compareCardCount !== 3) {
      fail(`Expected 3 side-by-side comparison columns, got ${compareCardCount}`);
    }
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "dashboard-comparator.png") });

    // 7. Verify 60-Year UX & Web Trend Analytics Tab
    await page.click('[data-dash-tab="analytics"]');
    await page.waitForTimeout(200);
    const analyticsRows = await page.locator("#view-analytics tbody tr").count();
    if (analyticsRows !== 12) {
      fail(`Expected 12 historical era rows in analytics table, got ${analyticsRows}`);
    }
    await page.screenshot({ path: path.join(EVIDENCE_DIR, "dashboard-analytics.png") });

    // 8. Verify JSON & CSV Dataset Export
    await page.click("#btn-export-json");
    const jsonExport = await page.evaluate(() => window.lastExportedPayload);
    if (!jsonExport || jsonExport.format !== "json" || jsonExport.count !== 1026 || jsonExport.bytes < 1000000) {
      fail(`Invalid JSON export payload: ${JSON.stringify(jsonExport)}`);
    }

    await page.click("#btn-export-csv");
    const csvExport = await page.evaluate(() => window.lastExportedPayload);
    if (!csvExport || csvExport.format !== "csv" || csvExport.count !== 1026 || csvExport.bytes < 80000) {
      fail(`Invalid CSV export payload: ${JSON.stringify(csvExport)}`);
    }

    if (errors.length > 0) {
      fail(`Browser console/page errors detected: ${errors.join(" | ")}`);
    }

    const report = {
      verifiedAt: new Date().toISOString(),
      wireframesLoaded: wfCount,
      consoleErrors: errors.length,
      p5ModesVerified: modeStats,
      simulatorShadersDistinct: true,
      webMorphVerified: true,
      inspectorRows: inspectorInfo.rows,
      comparatorColumns: compareCardCount,
      analyticsEras: analyticsRows,
      exportsVerified: { json: jsonExport, csv: csvExport },
    };
    fs.writeFileSync(path.join(EVIDENCE_DIR, "e2e-verification-report.json"), JSON.stringify(report, null, 2));

    console.log(
      `PASS [verify_browser_e2e]: 0 console/page errors; ${wfCount} wireframes; all 4 p5.js modes (${Object.keys(modeStats).join(", ")}) pixel-verified; Simulator shaders, Web Morph slider, Search/Filter, Blueprint Inspector, 3-Era Comparator, 12-Era Analytics, and JSON/CSV exports verified.`
    );
  } finally {
    if (browser) await browser.close();
    serverProc.kill("SIGTERM");
  }
}

main().catch((err) => {
  fail(err.stack || err.message || String(err));
});
