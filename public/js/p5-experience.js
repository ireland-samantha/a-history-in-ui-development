/* global p5 */
/**
 * A History in UI Development (1966–2026) — Interactive p5.js Experience
 *
 * Implements 4 interactive p5.js modes:
 *   1. "chronos"       — 60-Year Macro Timeline, Era Stream Landscape & Scrubber (1966–2026)
 *   2. "simulator"     — Live Interactive Wireframe Simulator & Era Shader (Blueprint / Authentic Chrome / Fitts Heatmap)
 *   3. "web-morph"     — Web Development UI Trends Morphing Lab (Smooth p5.js geometric interpolation across 1993–2026 web eras)
 *   4. "constellation" — Force/Radial UI Genealogy & Component DNA Network
 */

window.UIHistoryState = {
  wireframes: [],
  filteredWireframes: [],
  trends: null,
  activeWireframe: null,
  selectedNodeId: null,
  hoveredWireframe: null,
  p5Mode: "chronos",
  chronosMetric: "informationDensity",
  chronosYearCap: 2026,
  chronosPlaying: false,
  simFidelity: "era-authentic",
  simShowGrid: true,
  simShowMetrics: true,
  morphArchetypeId: "MORPH_KNOWLEDGE_PORTAL",
  morphProgress: 0.0, // 0.0 to 5.0 across the 6 web stages
  morphPlaying: false,
  constellationGroup: "era",
  constellationShowLineage: true,
  constellationZoom: 1.0,
  constellationPanX: 0,
  constellationPanY: 0,
  pointsCache: [],
  constellationNodes: [],
};

const ERA_COLORS = {
  E01: [40, 209, 96],
  E02: [255, 176, 0],
  E03: [220, 228, 240],
  E04: [168, 185, 255],
  E05: [74, 158, 255],
  E06: [255, 118, 38],
  E07: [0, 194, 255],
  E08: [59, 130, 246],
  E09: [16, 185, 129],
  E10: [139, 92, 246],
  E11: [236, 72, 153],
  E12: [56, 189, 248],
};

function getEraRGB(eraCode) {
  const map = {
    E01: [40, 209, 96],
    E02: [255, 176, 0],
    E03: [216, 224, 236],
    E04: [147, 174, 255],
    E05: [77, 166, 255],
    E06: [255, 122, 45],
    E07: [0, 204, 255],
    E08: [66, 142, 255],
    E09: [34, 211, 153],
    E10: [167, 139, 250],
    E11: [244, 114, 182],
    E12: [56, 189, 248],
  };
  return map[eraCode] || [56, 189, 248];
}

function initP5Experience() {
  const container = document.getElementById("p5-canvas-container");
  if (!container || typeof p5 === "undefined") return;

  const sketch = (p) => {
    let width = 900;
    let height = 500;

    p.setup = () => {
      width = Math.max(640, container.clientWidth || 900);
      height = Math.max(460, container.clientHeight || 500);
      const cnv = p.createCanvas(width, height);
      cnv.parent("p5-canvas-container");
      p.pixelDensity(1);
      p.textFont("monospace");
      rebuildConstellationLayout(width, height);
    };

    p.windowResized = () => {
      width = Math.max(640, container.clientWidth || 900);
      height = Math.max(460, container.clientHeight || 500);
      p.resizeCanvas(width, height);
      rebuildConstellationLayout(width, height);
    };

    p.draw = () => {
      const st = window.UIHistoryState;
      p.background(7, 10, 16);

      if (!st.wireframes || st.wireframes.length === 0) {
        p.fill(56, 189, 248);
        p.textSize(14);
        p.textAlign(p.CENTER, p.CENTER);
        p.text("Loading 60-Year UI Wireframe Corpus (1966–2026)...", width / 2, height / 2);
        return;
      }

      if (st.chronosPlaying && st.p5Mode === "chronos") {
        if (p.frameCount % 6 === 0) {
          st.chronosYearCap = st.chronosYearCap >= 2026 ? 1966 : st.chronosYearCap + 1;
          const slider = document.getElementById("chronos-year-slider");
          const lbl = document.getElementById("chronos-year-label");
          if (slider) slider.value = String(st.chronosYearCap);
          if (lbl) lbl.textContent = `1966–${st.chronosYearCap}`;
        }
      }

      if (st.morphPlaying && st.p5Mode === "web-morph") {
        st.morphProgress += 0.015;
        if (st.morphProgress > 5.0) st.morphProgress = 0.0;
        const slider = document.getElementById("morph-stage-slider");
        if (slider) slider.value = String(Math.round(st.morphProgress * 100));
        updateMorphStageLabel();
      }

      if (st.p5Mode === "chronos") {
        drawChronosMode(p, width, height, st);
      } else if (st.p5Mode === "simulator") {
        drawSimulatorMode(p, width, height, st);
      } else if (st.p5Mode === "web-morph") {
        drawWebMorphMode(p, width, height, st);
      } else if (st.p5Mode === "constellation") {
        drawConstellationMode(p, width, height, st);
      }
    };

    p.mouseMoved = () => {
      if (p.mouseX < 0 || p.mouseX > width || p.mouseY < 0 || p.mouseY > height) return;
      handleHover(p, width, height);
    };

    p.mousePressed = () => {
      if (p.mouseX < 0 || p.mouseX > width || p.mouseY < 0 || p.mouseY > height) return;
      handleClick(p, width, height);
    };
  };

  window.p5Instance = new p5(sketch);
}

/* ==========================================================================
   MODE 1: CHRONOS 60-YEAR MACRO TIMELINE & STREAM LANDSCAPE (1966–2026)
   ========================================================================== */
function drawChronosMode(p, w, h, st) {
  const padL = 62;
  const padR = 26;
  const padT = 46;
  const padB = 54;
  const plotW = w - padL - padR;
  const plotH = h - padT - padB;
  const metric = st.chronosMetric || "informationDensity";

  // Draw 12 Era vertical bands
  const eras = (st.trends && st.trends.eras) || [];
  eras.forEach((era, idx) => {
    const x1 = padL + ((era.startYear - 1966) / 60) * plotW;
    const x2 = padL + ((era.endYear + 1 - 1966) / 60) * plotW;
    const rgb = getEraRGB(era.code);
    p.noStroke();
    p.fill(rgb[0], rgb[1], rgb[2], idx % 2 === 0 ? 18 : 10);
    p.rect(x1, padT, Math.max(2, x2 - x1), plotH);

    // Era label at top
    p.fill(rgb[0], rgb[1], rgb[2], 210);
    p.textSize(10);
    p.textAlign(p.LEFT, p.TOP);
    p.text(era.code, x1 + 3, padT + 4);
  });

  // Web Birth Divider (1991)
  const webX = padL + ((1991 - 1966) / 60) * plotW;
  p.stroke(56, 189, 248, 150);
  p.strokeWeight(1.5);
  p.line(webX, padT, webX, padT + plotH);
  p.noStroke();
  p.fill(56, 189, 248);
  p.textSize(10);
  p.textAlign(p.LEFT, p.BOTTOM);
  p.text("1991: World Wide Web Era Begins →", webX + 5, padT + plotH - 6);

  // Horizontal grid lines
  p.stroke(35, 47, 70);
  p.strokeWeight(1);
  for (let i = 0; i <= 4; i++) {
    const gy = padT + (i / 4) * plotH;
    p.line(padL, gy, padL + plotW, gy);
    p.noStroke();
    p.fill(126, 143, 166);
    p.textSize(10);
    p.textAlign(p.RIGHT, p.MIDDLE);
    let valLbl = "";
    if (metric === "cognitiveLoadIndex") {
      valLbl = (10 - (i / 4) * 9).toFixed(1);
    } else if (metric === "keyboardToPointerBias") {
      valLbl = (1 - (i / 4) * 2).toFixed(1);
    } else {
      valLbl = (1 - i / 4).toFixed(2);
    }
    p.text(valLbl, padL - 8, gy);
    p.stroke(35, 47, 70);
  }

  // Draw Yearly Trend Curve
  if (st.trends && st.trends.yearlySeries) {
    p.noFill();
    p.stroke(56, 189, 248, 200);
    p.strokeWeight(2.2);
    p.beginShape();
    st.trends.yearlySeries.forEach((ys) => {
      if (ys.year > st.chronosYearCap) return;
      const x = padL + ((ys.year - 1966) / 60) * plotW;
      const normY = normalizeMetricValue(ys.avgMetrics[metric], metric);
      const y = padT + (1 - normY) * plotH;
      p.vertex(x, y);
    });
    p.endShape();
  }

  // Plot all filtered wireframes up to chronosYearCap
  const sourceList = st.filteredWireframes.length > 0 ? st.filteredWireframes : st.wireframes;
  st.pointsCache = [];

  for (let i = 0; i < sourceList.length; i++) {
    const wf = sourceList[i];
    if (wf.year > st.chronosYearCap) continue;
    const jitterX = ((wf.index * 19) % 11 - 5) * 0.65;
    const x = padL + ((wf.year - 1966) / 60) * plotW + jitterX;
    const rawVal = wf.uxMetrics[metric];
    const normY = normalizeMetricValue(rawVal, metric);
    const y = padT + (1 - normY) * plotH;

    const rgb = getEraRGB(wf.eraCode);
    const isSelected = st.activeWireframe && st.activeWireframe.id === wf.id;
    const isHovered = st.hoveredWireframe && st.hoveredWireframe.id === wf.id;

    if (isSelected || isHovered) {
      p.stroke(255);
      p.strokeWeight(2);
      p.fill(rgb[0], rgb[1], rgb[2], 255);
      p.circle(x, y, isSelected ? 12 : 10);
    } else if (wf.isLandmark) {
      p.noStroke();
      p.fill(251, 191, 36, 225);
      p.circle(x, y, 6.5);
    } else {
      p.noStroke();
      p.fill(rgb[0], rgb[1], rgb[2], 165);
      p.circle(x, y, 4.5);
    }

    st.pointsCache.push({ x, y, wf });
  }

  // Draw lineage edges for activeWireframe
  if (st.activeWireframe) {
    const actPt = st.pointsCache.find((pt) => pt.wf.id === st.activeWireframe.id);
    if (actPt) {
      const neighbors = new Set([
        ...(st.activeWireframe.predecessorIds || []),
        ...(st.activeWireframe.successorIds || []),
      ]);
      p.stroke(52, 211, 153, 190);
      p.strokeWeight(1.5);
      st.pointsCache.forEach((pt) => {
        if (neighbors.has(pt.wf.id)) {
          p.line(actPt.x, actPt.y, pt.x, pt.y);
        }
      });
    }
  }

  // X-Axis Year Ticks
  p.noStroke();
  p.fill(203, 213, 225);
  p.textSize(11);
  p.textAlign(p.CENTER, p.TOP);
  for (let yr = 1966; yr <= 2026; yr += 5) {
    const x = padL + ((yr - 1966) / 60) * plotW;
    p.text(String(yr), x, padT + plotH + 10);
  }

  // Top Header Title inside Canvas
  p.fill(241, 245, 249);
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  p.text(
    `CHRONOS 60-YEAR UI LANDSCAPE (1966–${st.chronosYearCap}) · Metric: ${metric} · Showing ${st.pointsCache.length} Wireframes`,
    padL,
    14
  );

  // Hover mini-wireframe preview card inside p5 canvas
  const targetWf = st.hoveredWireframe || st.activeWireframe;
  if (targetWf) {
    drawMiniWireframeOverlay(p, targetWf, w - 235, padT + 10, 200, 125);
  }
}

function normalizeMetricValue(val, metric) {
  if (metric === "cognitiveLoadIndex") {
    return Math.max(0, Math.min(1, (val - 1) / 9));
  }
  if (metric === "keyboardToPointerBias") {
    return Math.max(0, Math.min(1, (val + 1) / 2));
  }
  return Math.max(0, Math.min(1, Number(val) || 0.5));
}

function drawMiniWireframeOverlay(p, wf, ox, oy, ow, oh) {
  const pal = wf.layoutSpec.colorPalette || { bg: "#0f172a", surface: "#1e293b", border: "#38bdf8", accent: "#38bdf8" };
  p.push();
  p.fill(12, 18, 30, 235);
  p.stroke(56, 189, 248);
  p.strokeWeight(1.2);
  p.rect(ox, oy, ow, oh, 6);

  const innerX = ox + 8;
  const innerY = oy + 24;
  const innerW = ow - 16;
  const innerH = oh - 32;

  p.fill(pal.bg);
  p.stroke(pal.border);
  p.strokeWeight(1);
  p.rect(innerX, innerY, innerW, innerH, 3);

  const vw = wf.layoutSpec.viewportWidth;
  const vh = wf.layoutSpec.viewportHeight;
  wf.layoutSpec.nodes.forEach((n) => {
    const nx = innerX + (n.x / vw) * innerW;
    const ny = innerY + (n.y / vh) * innerH;
    const nw = Math.max(3, (n.w / vw) * innerW);
    const nh = Math.max(3, (n.h / vh) * innerH);
    p.fill(n.state === "active" || n.interactiveState === "focused" ? pal.accent : pal.surface);
    p.stroke(pal.border);
    p.strokeWeight(0.8);
    p.rect(nx, ny, nw, nh, 1);
  });

  p.noStroke();
  p.fill(255);
  p.textSize(10);
  p.textAlign(p.LEFT, p.TOP);
  const shortTitle = wf.title.length > 28 ? wf.title.slice(0, 26) + "…" : wf.title;
  p.text(`${wf.year} · ${shortTitle}`, ox + 8, oy + 6);
  p.pop();
}

/* ==========================================================================
   MODE 2: LIVE INTERACTIVE WIREFRAME SIMULATOR & ERA SHADER
   ========================================================================== */
function drawSimulatorMode(p, w, h, st) {
  const wf = st.activeWireframe || st.wireframes[0];
  if (!wf) return;

  const spec = wf.layoutSpec;
  const pal = spec.colorPalette;
  const fidelity = st.simFidelity || "era-authentic";

  const pad = 38;
  const availW = w - pad * 2;
  const availH = h - pad * 2 - 18;
  const scale = Math.min(availW / spec.viewportWidth, availH / spec.viewportHeight);
  const stageW = spec.viewportWidth * scale;
  const stageH = spec.viewportHeight * scale;
  const stageX = (w - stageW) / 2;
  const stageY = pad + 14 + (availH - stageH) / 2;

  // Header Banner
  p.noStroke();
  p.fill(241, 245, 249);
  p.textSize(12);
  p.textAlign(p.LEFT, p.TOP);
  const simTitle = wf.title.length > 52 ? wf.title.slice(0, 50) + "…" : wf.title;
  p.text(
    `SIMULATOR · [${wf.id}] ${simTitle} · ${spec.chromeStyle} (${spec.viewportWidth}×${spec.viewportHeight})`,
    20,
    12
  );

  // Outer Device / Viewport Frame
  p.push();
  if (fidelity === "blueprint") {
    p.fill(10, 25, 48);
    p.stroke(56, 189, 248);
    p.strokeWeight(1.5);
    p.rect(stageX, stageY, stageW, stageH, 4);
  } else {
    p.fill(pal.bg);
    p.stroke(pal.border);
    p.strokeWeight(2);
    p.rect(stageX, stageY, stageW, stageH, spec.chromeStyle === "glass-spatial" ? 14 : 4);
  }

  // Optional Grid Overlay
  if (st.simShowGrid) {
    const cols = spec.gridColumns || 12;
    const colW = stageW / cols;
    p.noStroke();
    p.fill(56, 189, 248, fidelity === "blueprint" ? 22 : 12);
    for (let c = 0; c < cols; c++) {
      p.rect(stageX + c * colW + 3, stageY, colW - 6, stageH);
    }
  }

  // Sort nodes by zIndex and render each UI component primitive
  const sortedNodes = [...spec.nodes].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));
  const centerX = stageX + stageW / 2;
  const centerY = stageY + stageH / 2;

  sortedNodes.forEach((n, idx) => {
    const nx = stageX + n.x * scale;
    const ny = stageY + n.y * scale;
    const nw = n.w * scale;
    const nh = n.h * scale;
    const isSel = st.selectedNodeId === n.id;

    if (fidelity === "blueprint") {
      p.fill(16, 40, 74, 200);
      p.stroke(isSel ? "#34d399" : "#38bdf8");
      p.strokeWeight(isSel ? 2.2 : 1);
      p.rect(nx, ny, nw, nh);
      // Crossed diagonal lines for media/canvas primitives
      if (n.type.includes("canvas") || n.type.includes("viewport") || n.type.includes("carousel")) {
        p.line(nx, ny, nx + nw, ny + nh);
        p.line(nx + nw, ny, nx, ny + nh);
      }
      p.noStroke();
      p.fill(186, 230, 253);
      p.textSize(10);
      p.textAlign(p.LEFT, p.TOP);
      p.text(`[${n.type}] ${n.label.slice(0, 26)}`, nx + 4, ny + 4);
      p.fill(125, 211, 252);
      p.text(`${Math.round(n.w)}×${Math.round(n.h)}`, nx + 4, ny + Math.min(nh - 12, 18));
    } else if (fidelity === "fitts-heatmap") {
      p.fill(20, 28, 44, 210);
      p.stroke(70, 90, 120);
      p.strokeWeight(1);
      p.rect(nx, ny, nw, nh, 3);

      const targetX = nx + nw / 2;
      const targetY = ny + nh / 2;
      const dist = Math.hypot(targetX - centerX, targetY - centerY);
      const widthScore = Math.min(nw, nh);
      const idScore = Math.log2(dist / Math.max(8, widthScore) + 1);

      // Fitts acquisition heat circle
      p.noStroke();
      const rCol = Math.min(255, Math.round(idScore * 75));
      const gCol = Math.max(40, 240 - rCol);
      p.fill(rCol, gCol, 90, 95);
      p.circle(targetX, targetY, Math.min(nw, nh) * 0.85);

      p.stroke(rCol, gCol, 120, 150);
      p.line(centerX, centerY, targetX, targetY);

      p.noStroke();
      p.fill(255);
      p.textSize(9.5);
      p.textAlign(p.CENTER, p.CENTER);
      p.text(`${n.type} (ID:${idScore.toFixed(1)}b)`, targetX, targetY);
    } else {
      // Era-Authentic Chrome & Shader
      p.fill(n.interactiveState === "focused" || isSel ? pal.accent : pal.surface);
      p.stroke(isSel ? "#34d399" : pal.border);
      p.strokeWeight(isSel ? 2.4 : 1.2);
      const radius = spec.chromeStyle === "glass-spatial" || spec.chromeStyle === "aqua-gloss" ? 6 : 1;
      p.rect(nx, ny, nw, nh, radius);

      // Era-specific visual chrome details
      if (spec.chromeStyle === "bevel-win95") {
        p.stroke(255, 255, 255, 190);
        p.line(nx + 1, ny + 1, nx + nw - 1, ny + 1);
        p.line(nx + 1, ny + 1, nx + 1, ny + nh - 1);
      } else if (spec.chromeStyle === "classic-mac") {
        p.fill(0);
        p.rect(nx + 3, ny + nh, nw, 2);
        p.rect(nx + nw, ny + 3, 2, nh);
      }

      // Component header strip
      p.noStroke();
      p.fill(pal.border);
      p.rect(nx, ny, nw, Math.min(16, nh * 0.25), radius);

      p.fill(pal.text);
      p.textSize(10);
      p.textAlign(p.LEFT, p.TOP);
      const maxChars = Math.max(6, Math.floor(nw / 6.5));
      p.text(n.label.slice(0, maxChars), nx + 5, ny + Math.min(18, nh * 0.3));
      p.fill(pal.muted);
      p.textSize(9);
      p.text(`<${n.type}>`, nx + 5, ny + Math.min(32, nh * 0.58));
    }
  });

  // CRT Scanline overlay for E01/E02
  if (fidelity === "era-authentic" && (wf.eraCode === "E01" || wf.eraCode === "E02")) {
    p.stroke(0, 0, 0, 55);
    p.strokeWeight(1);
    for (let sy = stageY; sy < stageY + stageH; sy += 3) {
      p.line(stageX, sy, stageX + stageW, sy);
    }
  }
  p.pop();
}

/* ==========================================================================
   MODE 3: WEB DEVELOPMENT UI TRENDS MORPHING LAB (1993–2026)
   ========================================================================== */
function drawWebMorphMode(p, w, h, st) {
  const archetypes = (st.trends && st.trends.webLayoutMorphArchetypes) || [];
  if (archetypes.length === 0) return;

  const arch = archetypes.find((a) => a.id === st.morphArchetypeId) || archetypes[0];
  const prog = Math.max(0, Math.min(4.999, Number(st.morphProgress) || 0));
  const idxA = Math.floor(prog);
  const idxB = Math.min(5, idxA + 1);
  const t = prog - idxA;

  const stageA = arch.stages[idxA];
  const stageB = arch.stages[idxB];
  const interpYear = Math.round(stageA.year + (stageB.year - stageA.year) * t);

  // Left 58%: Live Morphing Wireframe Stage
  const stageX = 24;
  const stageY = 52;
  const stageW = Math.floor(w * 0.56);
  const stageH = h - 76;

  p.noStroke();
  p.fill(241, 245, 249);
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  p.text(
    `WEB UI TRENDS MORPHING LAB · ${arch.name} · Year ~${interpYear} (${stageA.engine} → ${stageB.engine})`,
    24,
    14
  );

  p.fill(13, 19, 31);
  p.stroke(56, 189, 248, 180);
  p.strokeWeight(1.5);
  p.rect(stageX, stageY, stageW, stageH, 8);

  const colors = [
    [56, 189, 248],
    [129, 140, 248],
    [52, 211, 153],
    [251, 191, 36],
    [244, 114, 182],
    [96, 165, 250],
    [167, 139, 250],
    [45, 212, 191],
  ];

  for (let i = 0; i < stageA.nodes.length; i++) {
    const na = stageA.nodes[i];
    const nb = stageB.nodes[i] || na;
    const lx = na.x + (nb.x - na.x) * t;
    const ly = na.y + (nb.y - na.y) * t;
    const lw = na.w + (nb.w - na.w) * t;
    const lh = na.h + (nb.h - na.h) * t;

    const rx = stageX + lx * stageW;
    const ry = stageY + ly * stageH;
    const rw = lw * stageW;
    const rh = lh * stageH;

    const col = colors[i % colors.length];
    p.fill(col[0], col[1], col[2], 42);
    p.stroke(col[0], col[1], col[2], 220);
    p.strokeWeight(1.5);
    p.rect(rx, ry, rw, rh, 5);

    const activeNode = t < 0.5 ? na : nb;
    p.noStroke();
    p.fill(255);
    p.textSize(10.5);
    p.textAlign(p.LEFT, p.TOP);
    p.text(`[${activeNode.type}]`, rx + 6, ry + 5);
    p.fill(203, 213, 225);
    p.textSize(9.5);
    p.text(activeNode.label.slice(0, Math.max(10, Math.floor(rw / 6.5))), rx + 6, ry + 20);
  }

  // Right 38%: Web Era Stage Timeline & Metric Curves (1991–2026)
  const rightX = stageX + stageW + 22;
  const rightW = w - rightX - 20;
  p.fill(13, 19, 31);
  p.stroke(35, 47, 70);
  p.rect(rightX, stageY, rightW, stageH, 8);

  p.noStroke();
  p.fill(56, 189, 248);
  p.textSize(11);
  p.text("WEB LAYOUT ENGINE STAGES (CLICK TO JUMP)", rightX + 12, stageY + 12);

  arch.stages.forEach((stItem, sIdx) => {
    const sy = stageY + 38 + sIdx * 42;
    const isNear = Math.abs(prog - sIdx) < 0.55;
    p.fill(isNear ? [30, 58, 95] : [19, 26, 40]);
    p.stroke(isNear ? [56, 189, 248] : [45, 58, 84]);
    p.rect(rightX + 12, sy, rightW - 24, 34, 5);

    p.noStroke();
    p.fill(isNear ? 255 : 200);
    p.textSize(11);
    p.text(`${stItem.stage}. ${stItem.label}`, rightX + 20, sy + 6);
    p.fill(125, 211, 252);
    p.textSize(9.5);
    p.text(`Engine: ${stItem.engine}`, rightX + 20, sy + 20);
  });

  // Mini Web Responsiveness vs Chrome Ratio chart at bottom right
  const chartY = stageY + 305;
  const chartH = stageH - 320;
  if (chartH > 50 && st.trends && st.trends.yearlySeries) {
    p.noStroke();
    p.fill(203, 213, 225);
    p.textSize(10);
    p.text("Web Responsiveness (Cyan) vs Chrome Overhead (Amber) 1991–2026", rightX + 12, chartY - 14);

    const webSeries = st.trends.yearlySeries.filter((y) => y.year >= 1991);
    p.noFill();
    p.stroke(56, 189, 248);
    p.strokeWeight(2);
    p.beginShape();
    webSeries.forEach((ys, i) => {
      const cx = rightX + 14 + (i / (webSeries.length - 1)) * (rightW - 28);
      const cy = chartY + (1 - ys.avgMetrics.layoutResponsiveness) * chartH;
      p.vertex(cx, cy);
    });
    p.endShape();

    p.stroke(251, 191, 36);
    p.beginShape();
    webSeries.forEach((ys, i) => {
      const cx = rightX + 14 + (i / (webSeries.length - 1)) * (rightW - 28);
      const cy = chartY + (1 - ys.avgMetrics.visualChromeRatio) * chartH;
      p.vertex(cx, cy);
    });
    p.endShape();
  }
}

/* ==========================================================================
   MODE 4: CONSTELLATION & LINEAGE GRAPH EXPLORER
   ========================================================================== */
function rebuildConstellationLayout(w, h) {
  const st = window.UIHistoryState;
  if (!st.wireframes || st.wireframes.length === 0) return;
  const cx = w / 2;
  const cy = h / 2 + 10;
  const maxR = Math.min(w, h) * 0.41;

  st.constellationNodes = st.wireframes.map((wf, idx) => {
    let angle = 0;
    let radius = 0;
    if (st.constellationGroup === "domain") {
      const dIdx = Math.max(0, st.trends.domains.indexOf(wf.domain));
      const sector = (dIdx / 10) * Math.PI * 2;
      angle = sector + ((idx % 23) - 11) * 0.022;
      radius = 45 + ((wf.year - 1966) / 60) * (maxR - 45);
    } else {
      angle = ((wf.year - 1966) / 61) * Math.PI * 2 + (idx % 17) * 0.006;
      radius = 55 + (wf.uxMetrics.informationDensity * 0.65 + (idx % 7) * 0.05) * (maxR - 55);
    }
    return {
      x: cx + Math.cos(angle) * radius,
      y: cy + Math.sin(angle) * radius,
      wf,
    };
  });
}

function drawConstellationMode(p, w, h, st) {
  if (!st.constellationNodes || st.constellationNodes.length === 0) {
    rebuildConstellationLayout(w, h);
  }

  p.noStroke();
  p.fill(241, 245, 249);
  p.textSize(13);
  p.textAlign(p.LEFT, p.TOP);
  p.text(
    `UI GENEALOGY CONSTELLATION (1,026 Nodes · Radial 60-Year Lineage Graph · Group: ${st.constellationGroup.toUpperCase()})`,
    20,
    14
  );

  const byId = new Map();
  st.constellationNodes.forEach((cn) => byId.set(cn.wf.id, cn));

  // Sampled lineage edges + active wireframe full neighborhood
  if (st.constellationShowLineage) {
    p.stroke(56, 189, 248, 26);
    p.strokeWeight(1);
    for (let i = 0; i < st.constellationNodes.length; i += 4) {
      const cn = st.constellationNodes[i];
      (cn.wf.predecessorIds || []).forEach((pid) => {
        const target = byId.get(pid);
        if (target) p.line(cn.x, cn.y, target.x, target.y);
      });
    }
  }

  if (st.activeWireframe) {
    const activeCn = byId.get(st.activeWireframe.id);
    if (activeCn) {
      p.stroke(52, 211, 153, 220);
      p.strokeWeight(2);
      [...(st.activeWireframe.predecessorIds || []), ...(st.activeWireframe.successorIds || [])].forEach((nid) => {
        const target = byId.get(nid);
        if (target) p.line(activeCn.x, activeCn.y, target.x, target.y);
      });
    }
  }

  // Draw constellation nodes
  st.constellationNodes.forEach((cn) => {
    const rgb = getEraRGB(cn.wf.eraCode);
    const isSel = st.activeWireframe && st.activeWireframe.id === cn.wf.id;
    p.noStroke();
    p.fill(rgb[0], rgb[1], rgb[2], isSel ? 255 : 185);
    p.circle(cn.x, cn.y, isSel ? 11 : cn.wf.isLandmark ? 6 : 4);
  });
}

/* ==========================================================================
   INTERACTION HANDLERS (HOVER & CLICK)
   ========================================================================== */
function handleHover(p, w, h) {
  const st = window.UIHistoryState;
  if (st.p5Mode === "chronos") {
    let best = null;
    let bestDist = 14;
    for (let i = 0; i < st.pointsCache.length; i++) {
      const pt = st.pointsCache[i];
      const d = Math.hypot(p.mouseX - pt.x, p.mouseY - pt.y);
      if (d < bestDist) {
        bestDist = d;
        best = pt.wf;
      }
    }
    st.hoveredWireframe = best;
    if (best) {
      updateHudReadout(`Hovering [${best.id}] ${best.title} (${best.year}) · Density: ${best.uxMetrics.informationDensity}`);
    }
  }
}

function handleClick(p, w, h) {
  const st = window.UIHistoryState;
  if (st.p5Mode === "chronos" && st.hoveredWireframe) {
    if (window.selectActiveWireframe) {
      window.selectActiveWireframe(st.hoveredWireframe.id, false);
    }
  } else if (st.p5Mode === "simulator" && st.activeWireframe) {
    const wf = st.activeWireframe;
    const spec = wf.layoutSpec;
    const pad = 38;
    const availW = w - pad * 2;
    const availH = h - pad * 2 - 18;
    const scale = Math.min(availW / spec.viewportWidth, availH / spec.viewportHeight);
    const stageW = spec.viewportWidth * scale;
    const stageH = spec.viewportHeight * scale;
    const stageX = (w - stageW) / 2;
    const stageY = pad + 14 + (availH - stageH) / 2;

    const clicked = [...spec.nodes]
      .reverse()
      .find((n) => {
        const nx = stageX + n.x * scale;
        const ny = stageY + n.y * scale;
        const nw = n.w * scale;
        const nh = n.h * scale;
        return p.mouseX >= nx && p.mouseX <= nx + nw && p.mouseY >= ny && p.mouseY <= ny + nh;
      });
    if (clicked) {
      st.selectedNodeId = clicked.id;
      updateHudReadout(
        `Selected Node [${clicked.id}] <${clicked.type}> "${clicked.label}" at (${clicked.x}, ${clicked.y}, ${clicked.w}×${clicked.h})`
      );
    }
  } else if (st.p5Mode === "web-morph") {
    const stageX = 24;
    const stageW = Math.floor(w * 0.56);
    const rightX = stageX + stageW + 22;
    if (p.mouseX >= rightX) {
      const idx = Math.floor((p.mouseY - 90) / 42);
      if (idx >= 0 && idx <= 5) {
        st.morphProgress = idx;
        const slider = document.getElementById("morph-stage-slider");
        if (slider) slider.value = String(idx * 100);
        updateMorphStageLabel();
      }
    }
  } else if (st.p5Mode === "constellation") {
    let best = null;
    let bestDist = 14;
    st.constellationNodes.forEach((cn) => {
      const d = Math.hypot(p.mouseX - cn.x, p.mouseY - cn.y);
      if (d < bestDist) {
        bestDist = d;
        best = cn.wf;
      }
    });
    if (best && window.selectActiveWireframe) {
      window.selectActiveWireframe(best.id, false);
    }
  }
}

function updateHudReadout(msg) {
  const el = document.getElementById("hud-node-readout");
  if (el) el.textContent = msg;
}

function updateMorphStageLabel() {
  const st = window.UIHistoryState;
  const lbl = document.getElementById("morph-stage-label");
  if (!lbl || !st.trends) return;
  const arch = st.trends.webLayoutMorphArchetypes[0];
  const idx = Math.min(5, Math.round(st.morphProgress));
  const stage = arch.stages[idx];
  lbl.textContent = stage ? `${stage.year} (${stage.engine})` : "";
}

window.initP5Experience = initP5Experience;
window.rebuildConstellationLayout = rebuildConstellationLayout;
window.updateMorphStageLabel = updateMorphStageLabel;
