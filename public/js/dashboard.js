/**
 * A History in UI Development (1966–2026) — UX Research Dashboard Controller
 */

(function () {
  const dashState = {
    currentPage: 1,
    pageSize: 24,
    activeTab: "gallery",
    compareIds: [],
    byId: new Map(),
  };

  async function loadCorpusData() {
    if (window.location.protocol !== "file:") {
      try {
        const [wfResp, trResp] = await Promise.all([
          fetch("./data/wireframes.json"),
          fetch("./data/trends.json"),
        ]);
        if (wfResp.ok && trResp.ok) {
          return {
            wfData: await wfResp.json(),
            trData: await trResp.json(),
          };
        }
      } catch (_) {
        // Fall through to bundled corpus on offline / file:// / fetch failure
      }
    }
    if (window.__UI_HISTORY_CORPUS__) {
      return {
        wfData: window.__UI_HISTORY_CORPUS__.wireframesData,
        trData: window.__UI_HISTORY_CORPUS__.trendsData,
      };
    }
    throw new Error("Unable to load wireframe corpus via fetch or corpus-bundle.js");
  }

  async function bootApp() {
    try {
      const { wfData, trData } = await loadCorpusData();

      const st = window.UIHistoryState;
      st.wireframes = wfData.wireframes || [];
      st.trends = trData;
      st.wireframes.forEach((w) => dashState.byId.set(w.id, w));

      // Default active wireframe: 1968 SRI NLS or first landmark
      st.activeWireframe =
        st.wireframes.find((w) => w.year === 1968 && w.isLandmark) || st.wireframes[0];

      // Default 3-era comparison triad (1968, 1995, 2026)
      const wf1968 = st.wireframes.find((w) => w.year === 1968 && w.isLandmark) || st.wireframes[0];
      const wf1995 = st.wireframes.find((w) => w.year === 1995 && w.isLandmark) || st.wireframes[480];
      const wf2026 = st.wireframes.find((w) => w.year === 2026 && w.isLandmark) || st.wireframes[st.wireframes.length - 1];
      dashState.compareIds = [wf1968.id, wf1995.id, wf2026.id];

      updateTopTelemetry(wfData, trData);
      populateControls(trData, st.wireframes);
      bindEvents();
      applyFiltersAndRender();
      updateSideHud(st.activeWireframe);
      renderInspectorView();
      renderCompareView();
      renderAnalyticsView();
      renderGuideView();

      if (window.initP5Experience) {
        window.initP5Experience();
      }
    } catch (err) {
      console.error("Failed to initialize UI History Dashboard:", err);
    }
  }

  function updateTopTelemetry(wfData, trData) {
    const setTxt = (id, v) => {
      const el = document.getElementById(id);
      if (el) el.textContent = v;
    };
    setTxt("stat-total-wf", (wfData.totalWireframes || 1026).toLocaleString());
    setTxt("stat-year-span", `${wfData.yearRange?.spanYears || 60} Yrs`);
    setTxt("stat-era-count", String((trData.eras || []).length));
    setTxt("stat-comp-count", String((trData.componentPrimitives || []).length));
  }

  function populateControls(trData, wireframes) {
    // 12-Era Ribbon
    const ribbon = document.getElementById("era-ribbon");
    if (ribbon && trData.eras) {
      ribbon.innerHTML = trData.eras
        .map(
          (e) => `
        <button class="era-chip" data-era-id="${e.id}" title="${e.name} (${e.startYear}–${e.endYear})">
          <div class="era-chip-code"><span>${e.code}</span><span>${e.startYear}–${String(e.endYear).slice(2)}</span></div>
          <div class="era-chip-name">${e.name}</div>
        </button>`
        )
        .join("");
    }

    // Filter dropdowns
    const eraSel = document.getElementById("filter-era");
    if (eraSel && trData.eras) {
      trData.eras.forEach((e) => {
        const opt = document.createElement("option");
        opt.value = e.id;
        opt.textContent = `${e.code}: ${e.name} (${e.startYear}–${e.endYear})`;
        eraSel.appendChild(opt);
      });
    }

    const domSel = document.getElementById("filter-domain");
    if (domSel && trData.domains) {
      trData.domains.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = d;
        opt.textContent = d;
        domSel.appendChild(opt);
      });
    }

    const platSel = document.getElementById("filter-platform");
    if (platSel && trData.platforms) {
      trData.platforms.forEach((p) => {
        const opt = document.createElement("option");
        opt.value = p;
        opt.textContent = p;
        platSel.appendChild(opt);
      });
    }

    const engSel = document.getElementById("filter-engine");
    if (engSel) {
      const engines = [...new Set(wireframes.map((w) => w.webLayoutEngine))];
      engines.forEach((eng) => {
        const opt = document.createElement("option");
        opt.value = eng;
        opt.textContent = eng;
        engSel.appendChild(opt);
      });
    }

    const compSel = document.getElementById("filter-component");
    if (compSel && trData.componentPrimitives) {
      trData.componentPrimitives.forEach((c) => {
        const opt = document.createElement("option");
        opt.value = c;
        opt.textContent = c;
        compSel.appendChild(opt);
      });
    }

    const morphSel = document.getElementById("morph-archetype-select");
    if (morphSel && trData.webLayoutMorphArchetypes) {
      trData.webLayoutMorphArchetypes.forEach((ma) => {
        const opt = document.createElement("option");
        opt.value = ma.id;
        opt.textContent = ma.name;
        morphSel.appendChild(opt);
      });
    }
  }

  function bindEvents() {
    const st = window.UIHistoryState;

    // p5 Mode Switcher
    document.querySelectorAll(".p5-mode-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.getAttribute("data-p5-mode");
        switchP5Mode(mode);
      });
    });

    // Era Ribbon quick filter
    const ribbon = document.getElementById("era-ribbon");
    if (ribbon) {
      ribbon.addEventListener("click", (e) => {
        const chip = e.target.closest(".era-chip");
        if (!chip) return;
        const eraId = chip.getAttribute("data-era-id");
        const eraSel = document.getElementById("filter-era");
        if (eraSel) {
          eraSel.value = eraSel.value === eraId ? "ALL" : eraId;
          dashState.currentPage = 1;
          applyFiltersAndRender();
        }
      });
    }

    // Chronos controls
    const btnPlay = document.getElementById("btn-chronos-play");
    if (btnPlay) {
      btnPlay.addEventListener("click", () => {
        st.chronosPlaying = !st.chronosPlaying;
        btnPlay.textContent = st.chronosPlaying ? "⏸ Pause Evolution" : "▶ Play 60Y Evolution";
      });
    }

    const yrSlider = document.getElementById("chronos-year-slider");
    if (yrSlider) {
      yrSlider.addEventListener("input", () => {
        st.chronosYearCap = Number(yrSlider.value);
        const lbl = document.getElementById("chronos-year-label");
        if (lbl) lbl.textContent = `1966–${st.chronosYearCap}`;
      });
    }

    const metricSel = document.getElementById("chronos-metric-select");
    if (metricSel) {
      metricSel.addEventListener("change", () => {
        st.chronosMetric = metricSel.value;
      });
    }

    // Simulator controls
    const fidSel = document.getElementById("sim-fidelity-select");
    if (fidSel) {
      fidSel.addEventListener("change", () => {
        st.simFidelity = fidSel.value;
      });
    }

    const gridChk = document.getElementById("sim-show-grid");
    if (gridChk) {
      gridChk.addEventListener("change", () => {
        st.simShowGrid = gridChk.checked;
      });
    }

    const metricsChk = document.getElementById("sim-show-metrics");
    if (metricsChk) {
      metricsChk.addEventListener("change", () => {
        st.simShowMetrics = metricsChk.checked;
      });
    }

    const prevSim = document.getElementById("btn-sim-prev");
    const nextSim = document.getElementById("btn-sim-next");
    if (prevSim) {
      prevSim.addEventListener("click", () => stepActiveWireframe(-1));
    }
    if (nextSim) {
      nextSim.addEventListener("click", () => stepActiveWireframe(1));
    }

    // Web Morph controls
    const morphPlay = document.getElementById("btn-morph-play");
    if (morphPlay) {
      morphPlay.addEventListener("click", () => {
        st.morphPlaying = !st.morphPlaying;
        morphPlay.textContent = st.morphPlaying ? "⏸ Pause Web Morph" : "▶ Auto-Morph Web Eras";
      });
    }

    const morphArch = document.getElementById("morph-archetype-select");
    if (morphArch) {
      morphArch.addEventListener("change", () => {
        st.morphArchetypeId = morphArch.value;
        if (window.updateMorphStageLabel) window.updateMorphStageLabel();
      });
    }

    const morphSlider = document.getElementById("morph-stage-slider");
    if (morphSlider) {
      morphSlider.addEventListener("input", () => {
        st.morphProgress = Number(morphSlider.value) / 100;
        if (window.updateMorphStageLabel) window.updateMorphStageLabel();
      });
    }

    // Constellation controls
    const constGroup = document.getElementById("constellation-group-select");
    if (constGroup) {
      constGroup.addEventListener("change", () => {
        st.constellationGroup = constGroup.value;
        const cnv = document.getElementById("p5-canvas-container");
        if (window.rebuildConstellationLayout && cnv) {
          window.rebuildConstellationLayout(cnv.clientWidth || 900, cnv.clientHeight || 500);
        }
      });
    }

    const constLin = document.getElementById("constellation-show-lineage");
    if (constLin) {
      constLin.addEventListener("change", () => {
        st.constellationShowLineage = constLin.checked;
      });
    }

    const constReset = document.getElementById("btn-constellation-reset");
    if (constReset) {
      constReset.addEventListener("click", () => {
        st.constellationZoom = 1.0;
        st.constellationPanX = 0;
        st.constellationPanY = 0;
        const cnv = document.getElementById("p5-canvas-container");
        if (window.rebuildConstellationLayout && cnv) {
          window.rebuildConstellationLayout(cnv.clientWidth || 900, cnv.clientHeight || 500);
        }
      });
    }

    // HUD buttons
    document.getElementById("btn-hud-simulate")?.addEventListener("click", () => {
      switchP5Mode("simulator");
    });
    document.getElementById("btn-hud-inspect")?.addEventListener("click", () => {
      switchDashTab("inspector");
    });
    document.getElementById("btn-hud-compare")?.addEventListener("click", () => {
      if (st.activeWireframe) toggleCompareWireframe(st.activeWireframe.id);
    });

    // Filter sidebar inputs
    const filterIds = [
      "search-input",
      "filter-year-min",
      "filter-year-max",
      "filter-era",
      "filter-decade",
      "filter-domain",
      "filter-platform",
      "filter-engine",
      "filter-component",
      "sort-by",
      "filter-landmarks-only",
      "filter-web-only",
    ];
    filterIds.forEach((fid) => {
      const el = document.getElementById(fid);
      if (el) {
        el.addEventListener("input", () => {
          dashState.currentPage = 1;
          applyFiltersAndRender();
        });
        el.addEventListener("change", () => {
          dashState.currentPage = 1;
          applyFiltersAndRender();
        });
      }
    });

    document.getElementById("btn-reset-filters")?.addEventListener("click", resetFilters);

    // Dashboard tabs
    document.querySelectorAll(".dash-tab").forEach((tab) => {
      tab.addEventListener("click", () => {
        switchDashTab(tab.getAttribute("data-dash-tab"));
      });
    });

    // Pagination
    document.getElementById("btn-page-prev")?.addEventListener("click", () => {
      if (dashState.currentPage > 1) {
        dashState.currentPage--;
        renderGalleryPage();
      }
    });
    document.getElementById("btn-page-next")?.addEventListener("click", () => {
      const totalPages = Math.max(1, Math.ceil(st.filteredWireframes.length / dashState.pageSize));
      if (dashState.currentPage < totalPages) {
        dashState.currentPage++;
        renderGalleryPage();
      }
    });
    document.getElementById("page-size-select")?.addEventListener("change", (e) => {
      dashState.pageSize = Number(e.target.value) || 24;
      dashState.currentPage = 1;
      renderGalleryPage();
    });

    // Comparator Presets
    document.querySelectorAll("[data-compare-preset]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const preset = btn.getAttribute("data-compare-preset");
        applyComparePreset(preset);
      });
    });

    // Guided Curriculum Lessons & Guide buttons
    document.querySelectorAll("[data-lesson-id]").forEach((btn) => {
      btn.addEventListener("click", () => {
        launchGuidedLesson(btn.getAttribute("data-lesson-id"));
      });
    });

    document.getElementById("btn-open-guide")?.addEventListener("click", () => {
      switchDashTab("guide");
      document.getElementById("view-guide")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    document.getElementById("btn-strip-limits")?.addEventListener("click", () => {
      switchDashTab("guide");
      document.getElementById("view-guide")?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    // Export buttons
    document.getElementById("btn-export-json")?.addEventListener("click", () => exportDataset("json"));
    document.getElementById("btn-export-csv")?.addEventListener("click", () => exportDataset("csv"));
  }

  function switchP5Mode(mode) {
    const st = window.UIHistoryState;
    st.p5Mode = mode;
    document.querySelectorAll(".p5-mode-btn").forEach((b) => {
      const active = b.getAttribute("data-p5-mode") === mode;
      b.classList.toggle("active", active);
      b.setAttribute("aria-selected", String(active));
    });
    ["chronos", "simulator", "web-morph", "constellation"].forEach((m) => {
      const grp = document.getElementById(`p5-ctrl-${m}`);
      if (grp) grp.classList.toggle("hidden", m !== mode);
    });
  }

  function switchDashTab(tabName) {
    dashState.activeTab = tabName;
    document.querySelectorAll(".dash-tab").forEach((t) => {
      t.classList.toggle("active", t.getAttribute("data-dash-tab") === tabName);
    });
    ["gallery", "inspector", "compare", "analytics", "guide"].forEach((v) => {
      const el = document.getElementById(`view-${v}`);
      if (el) el.classList.toggle("hidden", v !== tabName);
    });
    const pag = document.getElementById("gallery-pagination");
    if (pag) pag.classList.toggle("hidden", tabName !== "gallery");

    if (tabName === "inspector") renderInspectorView();
    if (tabName === "compare") renderCompareView();
    if (tabName === "analytics") renderAnalyticsView();
    if (tabName === "guide") renderGuideView();
  }

  function applyFiltersAndRender() {
    const st = window.UIHistoryState;
    const q = (document.getElementById("search-input")?.value || "").trim().toLowerCase();
    const yMin = Number(document.getElementById("filter-year-min")?.value) || 1966;
    const yMax = Number(document.getElementById("filter-year-max")?.value) || 2026;
    const era = document.getElementById("filter-era")?.value || "ALL";
    const dec = document.getElementById("filter-decade")?.value || "ALL";
    const dom = document.getElementById("filter-domain")?.value || "ALL";
    const plat = document.getElementById("filter-platform")?.value || "ALL";
    const eng = document.getElementById("filter-engine")?.value || "ALL";
    const comp = document.getElementById("filter-component")?.value || "ALL";
    const sortBy = document.getElementById("sort-by")?.value || "year-asc";
    const landmarksOnly = Boolean(document.getElementById("filter-landmarks-only")?.checked);
    const webOnly = Boolean(document.getElementById("filter-web-only")?.checked);

    // Highlight active era chip in ribbon
    document.querySelectorAll(".era-chip").forEach((chip) => {
      chip.classList.toggle("active", chip.getAttribute("data-era-id") === era);
    });

    const filtered = st.wireframes.filter((w) => {
      if (w.year < yMin || w.year > yMax) return false;
      if (era !== "ALL" && w.era !== era) return false;
      if (dec !== "ALL" && w.decade !== dec) return false;
      if (dom !== "ALL" && w.domain !== dom) return false;
      if (plat !== "ALL" && w.platform !== plat) return false;
      if (eng !== "ALL" && w.webLayoutEngine !== eng) return false;
      if (comp !== "ALL" && !(w.componentTypes || []).includes(comp)) return false;
      if (landmarksOnly && !w.isLandmark) return false;
      if (webOnly && !w.isWebNative) return false;
      if (q) {
        const hay = `${w.id} ${w.title} ${w.eraName} ${w.domain} ${w.platform} ${w.webTrendCategory} ${w.componentTypes.join(" ")} ${w.uxResearchNotes.paradigmSummary}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    filtered.sort((a, b) => {
      if (sortBy === "year-desc") return b.year - a.year || b.index - a.index;
      if (sortBy === "density-desc") return b.uxMetrics.informationDensity - a.uxMetrics.informationDensity;
      if (sortBy === "chrome-desc") return b.uxMetrics.visualChromeRatio - a.uxMetrics.visualChromeRatio;
      if (sortBy === "responsive-desc") return b.uxMetrics.layoutResponsiveness - a.uxMetrics.layoutResponsiveness;
      if (sortBy === "fitts-desc") return b.uxMetrics.fittsLawEfficiency - a.uxMetrics.fittsLawEfficiency;
      if (sortBy === "cogload-asc") return a.uxMetrics.cognitiveLoadIndex - b.uxMetrics.cognitiveLoadIndex;
      return a.year - b.year || a.index - b.index;
    });

    st.filteredWireframes = filtered;

    const banner = document.getElementById("filter-count-banner");
    if (banner) {
      banner.innerHTML = `Showing <strong>${filtered.length.toLocaleString()}</strong> of ${st.wireframes.length.toLocaleString()} wireframes`;
    }
    const tabCnt = document.getElementById("tab-count-gallery");
    if (tabCnt) tabCnt.textContent = filtered.length.toLocaleString();

    renderGalleryPage();
  }

  function resetFilters() {
    document.getElementById("search-input").value = "";
    document.getElementById("filter-year-min").value = "1966";
    document.getElementById("filter-year-max").value = "2026";
    document.getElementById("filter-era").value = "ALL";
    document.getElementById("filter-decade").value = "ALL";
    document.getElementById("filter-domain").value = "ALL";
    document.getElementById("filter-platform").value = "ALL";
    document.getElementById("filter-engine").value = "ALL";
    document.getElementById("filter-component").value = "ALL";
    document.getElementById("sort-by").value = "year-asc";
    document.getElementById("filter-landmarks-only").checked = false;
    document.getElementById("filter-web-only").checked = false;
    dashState.currentPage = 1;
    applyFiltersAndRender();
  }

  function renderGalleryPage() {
    const st = window.UIHistoryState;
    const grid = document.getElementById("wireframe-grid");
    if (!grid) return;

    const total = st.filteredWireframes.length;
    const totalPages = Math.max(1, Math.ceil(total / dashState.pageSize));
    if (dashState.currentPage > totalPages) dashState.currentPage = totalPages;

    const startIdx = (dashState.currentPage - 1) * dashState.pageSize;
    const pageItems = st.filteredWireframes.slice(startIdx, startIdx + dashState.pageSize);

    const pageInd = document.getElementById("page-indicator");
    if (pageInd) pageInd.textContent = `Page ${dashState.currentPage} of ${totalPages}`;

    grid.innerHTML = pageItems
      .map((wf) => {
        const isSel = st.activeWireframe && st.activeWireframe.id === wf.id;
        const inComp = dashState.compareIds.includes(wf.id);
        const m = wf.uxMetrics;
        return `
        <article class="wf-card ${isSel ? "selected-wf" : ""}" data-wf-id="${wf.id}">
          <div class="wf-thumb-wrap" data-action="simulate" data-wf-id="${wf.id}" title="Click to simulate in p5.js">
            <canvas class="wf-thumb-canvas" id="thumb-${wf.id}" width="290" height="158"></canvas>
            <div class="wf-badge-overlay">
              <span class="badge">${wf.year} · ${wf.eraCode}</span>
              ${wf.isLandmark ? '<span class="badge badge-landmark">★ Landmark</span>' : `<span class="badge">${wf.nodeCount} nodes</span>`}
            </div>
          </div>
          <div class="wf-card-body">
            <div class="wf-card-title">${wf.title}</div>
            <div class="wf-card-sub">${wf.domain} · ${wf.webLayoutEngine}</div>
            <div class="wf-metrics-bars">
              <div class="m-bar-row">
                <div class="m-bar-lbl"><span>Density</span><span>${Math.round(m.informationDensity * 100)}%</span></div>
                <div class="m-bar-track"><div class="m-bar-fill" style="width:${Math.round(m.informationDensity * 100)}%"></div></div>
              </div>
              <div class="m-bar-row">
                <div class="m-bar-lbl"><span>Chrome</span><span>${Math.round(m.visualChromeRatio * 100)}%</span></div>
                <div class="m-bar-track"><div class="m-bar-fill" style="width:${Math.round(m.visualChromeRatio * 100)}%;background:#fbbf24"></div></div>
              </div>
              <div class="m-bar-row">
                <div class="m-bar-lbl"><span>Responsive</span><span>${Math.round(m.layoutResponsiveness * 100)}%</span></div>
                <div class="m-bar-track"><div class="m-bar-fill" style="width:${Math.round(m.layoutResponsiveness * 100)}%;background:#34d399"></div></div>
              </div>
              <div class="m-bar-row">
                <div class="m-bar-lbl"><span>Fitts Eff.</span><span>${Math.round(m.fittsLawEfficiency * 100)}%</span></div>
                <div class="m-bar-track"><div class="m-bar-fill" style="width:${Math.round(m.fittsLawEfficiency * 100)}%;background:#818cf8"></div></div>
              </div>
            </div>
            <div class="wf-card-actions">
              <button class="btn btn-accent btn-sm" data-action="simulate" data-wf-id="${wf.id}">Simulate p5.js</button>
              <button class="btn btn-secondary btn-sm" data-action="inspect" data-wf-id="${wf.id}">Blueprint</button>
              <button class="btn btn-secondary btn-sm" data-action="compare" data-wf-id="${wf.id}">${inComp ? "✓ In Compare" : "+ Compare"}</button>
            </div>
          </div>
        </article>`;
      })
      .join("");

    // Render live wireframe schematics on each card's canvas
    pageItems.forEach((wf) => {
      const cnv = document.getElementById(`thumb-${wf.id}`);
      if (cnv) drawWireframeSchematicOnCanvas(cnv, wf, false);
    });

    // Delegate card button clicks
    grid.querySelectorAll("[data-action]").forEach((el) => {
      el.addEventListener("click", (e) => {
        e.stopPropagation();
        const act = el.getAttribute("data-action");
        const wid = el.getAttribute("data-wf-id");
        if (act === "simulate") {
          selectActiveWireframe(wid, true);
        } else if (act === "inspect") {
          selectActiveWireframe(wid, false);
          switchDashTab("inspector");
        } else if (act === "compare") {
          toggleCompareWireframe(wid);
        }
      });
    });
  }

  function drawWireframeSchematicOnCanvas(canvas, wf, showLabels) {
    const ctx = canvas.getContext("2d");
    const cw = canvas.width;
    const ch = canvas.height;
    const spec = wf.layoutSpec;
    const pal = spec.colorPalette || { bg: "#0d131f", surface: "#172135", border: "#38bdf8", accent: "#38bdf8", text: "#f1f5f9" };

    ctx.fillStyle = pal.bg;
    ctx.fillRect(0, 0, cw, ch);

    const pad = 10;
    const scale = Math.min((cw - pad * 2) / spec.viewportWidth, (ch - pad * 2) / spec.viewportHeight);
    const sw = spec.viewportWidth * scale;
    const sh = spec.viewportHeight * scale;
    const ox = (cw - sw) / 2;
    const oy = (ch - sh) / 2;

    ctx.strokeStyle = pal.border;
    ctx.lineWidth = 1.2;
    ctx.strokeRect(ox, oy, sw, sh);

    const sorted = [...spec.nodes].sort((a, b) => (a.zIndex || 1) - (b.zIndex || 1));
    sorted.forEach((n) => {
      const nx = ox + n.x * scale;
      const ny = oy + n.y * scale;
      const nw = Math.max(3, n.w * scale);
      const nh = Math.max(3, n.h * scale);

      ctx.fillStyle = n.interactiveState === "focused" || n.interactiveState === "active" ? pal.accent : pal.surface;
      ctx.globalAlpha = 0.88;
      ctx.fillRect(nx, ny, nw, nh);
      ctx.globalAlpha = 1.0;

      ctx.strokeStyle = pal.border;
      ctx.lineWidth = 0.9;
      ctx.strokeRect(nx, ny, nw, nh);

      if (showLabels && nw > 38 && nh > 14) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(nx + 1, ny + 1, Math.max(0, nw - 2), Math.max(0, nh - 2));
        ctx.clip();
        ctx.fillStyle = pal.text;
        ctx.font = "10px monospace";
        ctx.fillText(`${n.type}`, nx + 4, ny + 11);
        ctx.restore();
      }
    });
  }

  function selectActiveWireframe(wid, openSimulator) {
    const wf = dashState.byId.get(wid);
    if (!wf) return;
    const st = window.UIHistoryState;
    st.activeWireframe = wf;
    st.selectedNodeId = wf.layoutSpec.nodes[0]?.id || null;
    updateSideHud(wf);
    if (openSimulator) {
      switchP5Mode("simulator");
    }
    renderGalleryPage();
    if (dashState.activeTab === "inspector") {
      renderInspectorView();
    }
  }

  function stepActiveWireframe(delta) {
    const st = window.UIHistoryState;
    const list = st.filteredWireframes.length > 0 ? st.filteredWireframes : st.wireframes;
    if (list.length === 0) return;
    const curIdx = list.findIndex((w) => st.activeWireframe && w.id === st.activeWireframe.id);
    const nextIdx = (curIdx + delta + list.length) % list.length;
    selectActiveWireframe(list[nextIdx].id, false);
  }

  function updateSideHud(wf) {
    if (!wf) return;
    document.getElementById("hud-era-badge").textContent = `${wf.eraCode} · ${wf.year} · ${wf.decade}`;
    document.getElementById("hud-wf-title").textContent = wf.title;
    document.getElementById("hud-wf-meta").textContent = `${wf.domain} · ${wf.platform} · ${wf.webLayoutEngine}`;
    document.getElementById("hud-wf-notes").textContent = wf.uxResearchNotes.paradigmSummary;

    const m = wf.uxMetrics;
    const mini = document.getElementById("hud-metrics-mini");
    if (mini) {
      mini.innerHTML = `
        <div class="hud-metric-box"><span class="m-k">Info Density</span><span class="m-v">${(m.informationDensity * 100).toFixed(0)}%</span></div>
        <div class="hud-metric-box"><span class="m-k">Visual Chrome</span><span class="m-v">${(m.visualChromeRatio * 100).toFixed(0)}%</span></div>
        <div class="hud-metric-box"><span class="m-k">Responsiveness</span><span class="m-v">${(m.layoutResponsiveness * 100).toFixed(0)}%</span></div>
        <div class="hud-metric-box"><span class="m-k">Cognitive Load</span><span class="m-v">${m.cognitiveLoadIndex}/10</span></div>
      `;
    }
  }

  function renderInspectorView() {
    const wf = window.UIHistoryState.activeWireframe;
    const container = document.getElementById("inspector-content");
    if (!wf || !container) return;

    const spec = wf.layoutSpec;
    const m = wf.uxMetrics;
    const notes = wf.uxResearchNotes;

    const predButtons = (wf.predecessorIds || [])
      .map((pid) => {
        const pw = dashState.byId.get(pid);
        return pw ? `<button class="btn btn-secondary btn-sm" data-jump-wf="${pid}">← ${pw.year}: ${pw.title.slice(0, 28)}…</button>` : "";
      })
      .join("");

    const succButtons = (wf.successorIds || [])
      .map((sid) => {
        const sw = dashState.byId.get(sid);
        return sw ? `<button class="btn btn-secondary btn-sm" data-jump-wf="${sid}">${sw.year}: ${sw.title.slice(0, 28)}… →</button>` : "";
      })
      .join("");

    container.innerHTML = `
      <div class="insp-panel">
        <div>
          <span class="badge">${wf.id} · ${wf.year} · ${wf.eraName}</span>
          <h3 style="margin-top:6px;font-size:16px">${wf.title}</h3>
          <p style="font-size:12px;color:var(--text-muted)">Viewport: ${spec.viewportWidth}×${spec.viewportHeight} (${spec.aspectRatio}) · Chrome: ${spec.chromeStyle} · Hash: <code>${wf.structuralHash.slice(0, 16)}…</code></p>
        </div>
        <div class="blueprint-canvas-wrap">
          <canvas id="inspector-blueprint-canvas" width="620" height="380"></canvas>
        </div>
        <div>
          <h4 style="font-size:12px;margin-bottom:6px;color:var(--accent-primary)">HISTORICAL LINEAGE GRAPH (PREDECESSORS ↔ SUCCESSORS)</h4>
          <div class="lineage-pills">
            ${predButtons || '<span style="font-size:11px;color:var(--text-muted)">Root Era Anchor</span>'}
            ${succButtons || '<span style="font-size:11px;color:var(--text-muted)">Contemporary Frontier Leaf</span>'}
          </div>
        </div>
      </div>

      <div class="insp-panel">
        <div>
          <h4 style="font-size:12px;color:var(--accent-primary);margin-bottom:6px">UX RESEARCH ANALYSIS &amp; WEB TREND CONNECTION</h4>
          <p style="font-size:12px;margin-bottom:6px"><strong>Paradigm:</strong> ${notes.paradigmSummary}</p>
          <p style="font-size:12px;margin-bottom:6px"><strong>Innovations:</strong> ${notes.keyInnovations}</p>
          <p style="font-size:12px;margin-bottom:6px"><strong>Trade-offs:</strong> ${notes.usabilityTradeoffs}</p>
          <p style="font-size:12px"><strong>Web UI Trend Lineage:</strong> ${notes.webTrendConnection}</p>
        </div>

        <div>
          <h4 style="font-size:12px;color:var(--accent-primary);margin-bottom:6px">COMPONENT HIERARCHY TREE (${spec.nodes.length} NODES)</h4>
          <div class="node-table-wrap">
            <table class="data-table-ui">
              <thead>
                <tr>
                  <th>Node ID</th>
                  <th>Primitive Type</th>
                  <th>Label</th>
                  <th>Bounds (x,y,w,h)</th>
                  <th>Z</th>
                </tr>
              </thead>
              <tbody>
                ${spec.nodes
                  .map(
                    (n) => `
                  <tr data-insp-node="${n.id}">
                    <td><code>${n.id}</code></td>
                    <td><span class="badge">${n.type}</span></td>
                    <td>${n.label}</td>
                    <td><code>${n.x}, ${n.y}, ${n.w}×${n.h}</code></td>
                    <td>${n.zIndex}</td>
                  </tr>`
                  )
                  .join("")}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    const cnv = document.getElementById("inspector-blueprint-canvas");
    if (cnv) drawWireframeSchematicOnCanvas(cnv, wf, true);

    container.querySelectorAll("[data-jump-wf]").forEach((btn) => {
      btn.addEventListener("click", () => {
        selectActiveWireframe(btn.getAttribute("data-jump-wf"), false);
      });
    });

    container.querySelectorAll("[data-insp-node]").forEach((row) => {
      row.addEventListener("click", () => {
        window.UIHistoryState.selectedNodeId = row.getAttribute("data-insp-node");
        switchP5Mode("simulator");
      });
    });
  }

  function toggleCompareWireframe(wid) {
    const idx = dashState.compareIds.indexOf(wid);
    if (idx >= 0) {
      if (dashState.compareIds.length > 1) dashState.compareIds.splice(idx, 1);
    } else {
      if (dashState.compareIds.length >= 3) dashState.compareIds.shift();
      dashState.compareIds.push(wid);
    }
    const cnt = document.getElementById("tab-count-compare");
    if (cnt) cnt.textContent = String(dashState.compareIds.length);
    renderGalleryPage();
    renderCompareView();
  }

  function applyComparePreset(preset) {
    const wfs = window.UIHistoryState.wireframes;
    if (preset === "triad-classic") {
      const a = wfs.find((w) => w.year === 1968 && w.isLandmark) || wfs[0];
      const b = wfs.find((w) => w.year === 1995 && w.isLandmark) || wfs[480];
      const c = wfs.find((w) => w.year === 2026 && w.isLandmark) || wfs[wfs.length - 1];
      dashState.compareIds = [a.id, b.id, c.id];
    } else if (preset === "triad-web") {
      const a = wfs.find((w) => w.year === 1993 && w.isLandmark) || wfs[450];
      const b = wfs.find((w) => w.year === 2004 && w.isLandmark) || wfs[640];
      const c = wfs.find((w) => w.year === 2020 && w.isLandmark) || wfs[910];
      dashState.compareIds = [a.id, b.id, c.id];
    } else if (preset === "triad-dev") {
      const a = wfs.find((w) => w.year === 1976 && w.isLandmark) || wfs[170];
      const b = wfs.find((w) => w.year === 1989 && w.isLandmark) || wfs[390];
      const c = wfs.find((w) => w.year === 2024 && w.isLandmark) || wfs[980];
      dashState.compareIds = [a.id, b.id, c.id];
    }
    renderCompareView();
  }

  function renderCompareView() {
    const cols = document.getElementById("compare-columns");
    if (!cols) return;
    const items = dashState.compareIds.map((id) => dashState.byId.get(id)).filter(Boolean);

    cols.innerHTML = items
      .map((wf) => {
        const m = wf.uxMetrics;
        return `
        <div class="compare-col" data-compare-card="${wf.id}">
          <div>
            <span class="badge">${wf.year} · ${wf.eraCode}</span>
            <h4 style="margin-top:5px;font-size:14px">${wf.title}</h4>
            <p style="font-size:11px;color:var(--text-muted)">${wf.platform} · ${wf.webLayoutEngine}</p>
          </div>
          <canvas id="comp-canvas-${wf.id}" width="320" height="180" style="width:100%;height:180px;border:1px solid var(--border-subtle);border-radius:6px"></canvas>
          <div class="hud-metrics-mini">
            <div class="hud-metric-box"><span class="m-k">Info Density</span><span class="m-v">${(m.informationDensity * 100).toFixed(0)}%</span></div>
            <div class="hud-metric-box"><span class="m-k">Visual Chrome</span><span class="m-v">${(m.visualChromeRatio * 100).toFixed(0)}%</span></div>
            <div class="hud-metric-box"><span class="m-k">Responsiveness</span><span class="m-v">${(m.layoutResponsiveness * 100).toFixed(0)}%</span></div>
            <div class="hud-metric-box"><span class="m-k">Fitts Eff.</span><span class="m-v">${(m.fittsLawEfficiency * 100).toFixed(0)}%</span></div>
            <div class="hud-metric-box"><span class="m-k">Input Bias</span><span class="m-v">${m.keyboardToPointerBias > 0 ? "Pointer +" + m.keyboardToPointerBias : "Key " + m.keyboardToPointerBias}</span></div>
            <div class="hud-metric-box"><span class="m-k">Cog. Load</span><span class="m-v">${m.cognitiveLoadIndex}/10</span></div>
          </div>
          <div style="font-size:11px;color:var(--text-secondary)">
            <strong>Primitives (${wf.componentTypes.length}):</strong> ${wf.componentTypes.join(", ")}
          </div>
          <p style="font-size:11.5px;color:var(--text-muted)">${wf.uxResearchNotes.webTrendConnection}</p>
        </div>`;
      })
      .join("");

    items.forEach((wf) => {
      const cnv = document.getElementById(`comp-canvas-${wf.id}`);
      if (cnv) drawWireframeSchematicOnCanvas(cnv, wf, true);
    });
  }

  function renderAnalyticsView() {
    const container = document.getElementById("analytics-content");
    const st = window.UIHistoryState;
    if (!container || !st.trends) return;

    const eras = st.trends.eras || [];
    const eraRows = eras
      .map((e) => {
        const ewfs = st.wireframes.filter((w) => w.era === e.id);
        const n = ewfs.length || 1;
        const avgD = (ewfs.reduce((s, w) => s + w.uxMetrics.informationDensity, 0) / n * 100).toFixed(1);
        const avgC = (ewfs.reduce((s, w) => s + w.uxMetrics.visualChromeRatio, 0) / n * 100).toFixed(1);
        const avgR = (ewfs.reduce((s, w) => s + w.uxMetrics.layoutResponsiveness, 0) / n * 100).toFixed(1);
        const avgF = (ewfs.reduce((s, w) => s + w.uxMetrics.fittsLawEfficiency, 0) / n * 100).toFixed(1);
        return `
        <tr>
          <td><span class="badge">${e.code}</span></td>
          <td><strong>${e.name}</strong></td>
          <td><code>${e.startYear}–${e.endYear}</code></td>
          <td>${ewfs.length}</td>
          <td>${e.webLayoutEngine}</td>
          <td>${avgD}%</td>
          <td>${avgC}%</td>
          <td>${avgR}%</td>
          <td>${avgF}%</td>
        </tr>`;
      })
      .join("");

    container.innerHTML = `
      <div class="analytics-cards-row">
        <div class="hud-card"><div class="hud-eyebrow">CORPUS COVERAGE</div><div class="hud-title">1,026 Unique Wireframes</div><p class="hud-subtitle">100% verified non-colliding geometric layout hashes across 61 calendar years (1966–2026).</p></div>
        <div class="hud-card"><div class="hud-eyebrow">PRE-WEB TO WEB LINEAGE</div><div class="hud-title">1966–1990 → 1991–2026</div><p class="hud-subtitle">422 pre-web software wireframes linked via directed lineage edges into 604 web-era wireframes.</p></div>
        <div class="hud-card"><div class="hud-eyebrow">CHROME PEAK &amp; COLLAPSE</div><div class="hud-title">2000–2010 vs 2013+</div><p class="hud-subtitle">Visual chrome peaked at ~78% during Aqua/Skeuomorphic eras before dropping below 28% in Flat/Bento eras.</p></div>
        <div class="hud-card"><div class="hud-eyebrow">RETURN OF KEYBOARD + INTENT</div><div class="hud-title">⌘K &amp; Agentic Streams</div><p class="hud-subtitle">2020–2026 combines 1970s command velocity with spatial glass and generative ephemeral UIs.</p></div>
      </div>

      <div class="insp-panel">
        <h3 style="font-size:14px">60-Year Historical Era Quantitative Breakdown (1966–2026)</h3>
        <div class="node-table-wrap" style="max-height:460px">
          <table class="data-table-ui">
            <thead>
              <tr>
                <th>Era</th>
                <th>Historical UI Paradigm</th>
                <th>Years</th>
                <th>Wireframes</th>
                <th>Dominant Layout Engine</th>
                <th>Avg Density</th>
                <th>Avg Chrome</th>
                <th>Avg Responsive</th>
                <th>Avg Fitts Eff.</th>
              </tr>
            </thead>
            <tbody>${eraRows}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function exportDataset(format) {
    const st = window.UIHistoryState;
    const rows = st.filteredWireframes.length > 0 ? st.filteredWireframes : st.wireframes;
    if (format === "json") {
      const payload = JSON.stringify({ exportedAt: new Date().toISOString(), count: rows.length, wireframes: rows }, null, 2);
      window.lastExportedPayload = { format: "json", count: rows.length, bytes: payload.length };
      triggerDownload(payload, `ui-history-wireframes-${rows.length}.json`, "application/json");
    } else {
      const headers = ["id", "year", "decade", "eraCode", "title", "domain", "platform", "webLayoutEngine", "nodeCount", "informationDensity", "visualChromeRatio", "layoutResponsiveness", "fittsLawEfficiency", "structuralHash"];
      const csvLines = [headers.join(",")];
      rows.forEach((w) => {
        csvLines.push(
          [
            w.id,
            w.year,
            w.decade,
            w.eraCode,
            `"${w.title.replace(/"/g, '""')}"`,
            `"${w.domain}"`,
            `"${w.platform}"`,
            `"${w.webLayoutEngine}"`,
            w.nodeCount,
            w.uxMetrics.informationDensity,
            w.uxMetrics.visualChromeRatio,
            w.uxMetrics.layoutResponsiveness,
            w.uxMetrics.fittsLawEfficiency,
            w.structuralHash,
          ].join(",")
        );
      });
      const csvText = csvLines.join("\n");
      window.lastExportedPayload = { format: "csv", count: rows.length, bytes: csvText.length };
      triggerDownload(csvText, `ui-history-wireframes-${rows.length}.csv`, "text/csv");
    }
  }

  function triggerDownload(content, filename, mime) {
    try {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (_) {
      // Headless fallback
    }
  }

  function launchGuidedLesson(lessonId) {
    const st = window.UIHistoryState;
    const wfs = st.wireframes || [];
    if (wfs.length === 0) return;

    document.querySelectorAll(".lesson-pill").forEach((p) => {
      p.classList.toggle("active", p.getAttribute("data-lesson-id") === lessonId);
    });

    resetFilters();

    const findLandmark = (yr, kw) =>
      wfs.find((w) => w.year === yr && w.isLandmark && (!kw || w.title.toLowerCase().includes(kw.toLowerCase()))) ||
      wfs.find((w) => w.year === yr && w.isLandmark) ||
      wfs[0];

    if (lessonId === "L1") {
      document.getElementById("filter-year-min").value = "1966";
      document.getElementById("filter-year-max").value = "1984";
      applyFiltersAndRender();
      const target = findLandmark(1968, "NLS");
      selectActiveWireframe(target.id, true);
      st.simFidelity = "era-authentic";
      const fidSel = document.getElementById("sim-fidelity-select");
      if (fidSel) fidSel.value = "era-authentic";
      if (window.updateHudReadout) {
        window.updateHudReadout("Lesson L1 Active: 1966–1984 Vector CRTs to Early WIMP Desktops. Inspecting 1968 SRI NLS Console.");
      }
    } else if (lessonId === "L2") {
      document.getElementById("filter-year-min").value = "1991";
      document.getElementById("filter-year-max").value = "2001";
      applyFiltersAndRender();
      const target = findLandmark(1993, "Mosaic");
      selectActiveWireframe(target.id, false);
      switchP5Mode("web-morph");
      st.morphProgress = 1.0;
      const ms = document.getElementById("morph-stage-slider");
      if (ms) ms.value = "100";
      if (window.updateMorphStageLabel) window.updateMorphStageLabel();
    } else if (lessonId === "L3") {
      document.getElementById("filter-era").value = "E07_WEB20_AJAX_RIA";
      applyFiltersAndRender();
      const target = findLandmark(2004, "Gmail");
      selectActiveWireframe(target.id, false);
      switchP5Mode("chronos");
      st.chronosMetric = "visualChromeRatio";
      const cm = document.getElementById("chronos-metric-select");
      if (cm) cm.value = "visualChromeRatio";
    } else if (lessonId === "L4") {
      document.getElementById("filter-year-min").value = "2007";
      document.getElementById("filter-year-max").value = "2016";
      applyFiltersAndRender();
      const target = findLandmark(2007, "iPhone");
      selectActiveWireframe(target.id, false);
      switchP5Mode("web-morph");
      st.morphProgress = 3.0;
      const ms = document.getElementById("morph-stage-slider");
      if (ms) ms.value = "300";
      if (window.updateMorphStageLabel) window.updateMorphStageLabel();
    } else if (lessonId === "L5") {
      const target = findLandmark(1984, "Macintosh");
      selectActiveWireframe(target.id, true);
      st.simFidelity = "fitts-heatmap";
      const fidSel = document.getElementById("sim-fidelity-select");
      if (fidSel) fidSel.value = "fitts-heatmap";
    } else if (lessonId === "L6") {
      document.getElementById("filter-year-min").value = "2017";
      document.getElementById("filter-year-max").value = "2026";
      applyFiltersAndRender();
      const target = findLandmark(2026, "Agentic");
      selectActiveWireframe(target.id, false);
      switchP5Mode("web-morph");
      st.morphProgress = 5.0;
      const ms = document.getElementById("morph-stage-slider");
      if (ms) ms.value = "500";
      if (window.updateMorphStageLabel) window.updateMorphStageLabel();
    }
  }

  function renderGuideView() {
    const container = document.getElementById("guide-content");
    if (!container) return;

    const lessons = [
      {
        id: "L1",
        badge: "LESSON 01 · 1966–1984",
        title: "From Vector CRT Scopes to Direct-Manipulation WIMP Desktops",
        desc: "Trace how light-pen vector displays (1966 TX-2 Sketchpad II, 1968 SRI NLS) and 80×24 block-mode terminals (IBM 3270, VT100) gave way to overlapping bitmap windows, global menu bars, and mouse cursors (1981 Xerox Star, 1984 Macintosh).",
        cta: "Launch Lesson 01 in Simulator →",
      },
      {
        id: "L2",
        badge: "LESSON 02 · 1991–2001",
        title: "Birth of the Web: Linear HTML 2.0 to Dot-Com Table Portals",
        desc: "Compare early single-column hypertext documents (1990 WorldWideWeb.app, 1993 NCSA Mosaic) against dense 3-column nested HTML table portals and 1px spacer GIF grids (1994 Yahoo!, 1995 Amazon, 1998 eBay).",
        cta: "Launch Lesson 02 in Morphing Lab →",
      },
      {
        id: "L3",
        badge: "LESSON 03 · 2002–2006",
        title: "The Web 2.0 Ajax Revolution & the Visual Chrome Peak",
        desc: "Examine how XMLHttpRequest (2004 Gmail Beta, 2005 Google Maps) enabled asynchronous split-pane web apps while glossy gradients, rounded tabs, and skeuomorphic bevels pushed visual chrome ratios near 80%.",
        cta: "Launch Lesson 03 on Chronos Curve →",
      },
      {
        id: "L4",
        badge: "LESSON 04 · 2007–2016",
        title: "Capacitive Multi-Touch, 960px Grids & the Flat Collapse",
        desc: "Observe how capacitive touchscreens (2007 iPhone OS) and responsive 12-column CSS Flexbox/Bootstrap grids replaced scrollbars and heavy bevels, collapsing visual chrome overhead below 28% after 2013.",
        cta: "Launch Lesson 04 in Morphing Lab →",
      },
      {
        id: "L5",
        badge: "LESSON 05 · ERGONOMICS LAB",
        title: "Fitts's Law Target Acquisition & Attention Heatmap",
        desc: "Use the Live p5.js Simulator's Fitts's Law shader to inspect target distance and size across eras, computing Index of Difficulty in bits (ID = log2(D/W + 1)) from the viewport center to every interactive primitive.",
        cta: "Launch Lesson 05 Heatmap Shader →",
      },
      {
        id: "L6",
        badge: "LESSON 06 · 2017–2026",
        title: "Design Tokens, ⌘K Command Velocity & Agentic Proof Ledgers",
        desc: "Explore how modern interfaces combine 1970s keyboard speed (ubiquitous ⌘K command palettes in VS Code, Superhuman, Linear) with CSS Grid bento layouts, multiplayer WebGL canvases, and verifiable agentic trace ledgers.",
        cta: "Launch Lesson 06 (2026 Agentic Stage) →",
      },
    ];

    container.innerHTML = `
      <div class="insp-panel">
        <div>
          <span class="badge">INTERACTIVE CURRICULUM · 6 GUIDED MODULES</span>
          <h3 style="margin-top:6px;font-size:16px">Guided Learning Modules (1966–2026)</h3>
          <p style="font-size:12px;color:var(--text-muted)">Click any module below (or in the top Guided Lessons bar) to automatically configure the p5.js laboratory, shaders, and corpus filters for that topic.</p>
        </div>
        <div class="lesson-cards-grid">
          ${lessons
            .map(
              (l) => `
            <div class="lesson-card">
              <span class="badge">${l.badge}</span>
              <h4>${l.title}</h4>
              <p>${l.desc}</p>
              <button class="btn btn-accent btn-sm" data-guide-lesson="${l.id}">${l.cta}</button>
            </div>`
            )
            .join("")}
        </div>
      </div>

      <div class="insp-panel">
        <div>
          <span class="badge">PLATFORM USABILITY GUIDE</span>
          <h3 style="margin-top:6px;font-size:16px">How to Use the p5.js Visual Laboratory &amp; Research Workbench</h3>
        </div>
        <div class="guide-2col">
          <div class="hud-card">
            <div class="hud-eyebrow">01 · CHRONOS 60-YEAR LANDSCAPE</div>
            <p class="hud-notes">Plots all 1,026 wireframes from 1966 to 2026. <strong>Hover</strong> any dot (gold = historical landmark) to preview its mini schematic; <strong>click</strong> to select it and draw green predecessor/successor lineage edges. Use the <strong>Y-Axis Metric</strong> selector to compare Density, Chrome Ratio, Responsiveness, Fitts Efficiency, or Input Bias.</p>
          </div>
          <div class="hud-card">
            <div class="hud-eyebrow">02 · LIVE p5.js WIREFRAME SIMULATOR</div>
            <p class="hud-notes">Renders any wireframe with 3 switchable shaders: <strong>Era-Authentic Chrome</strong> (CRT scanlines, 1-bit Mac shadows, Win95 bevels, spatial glass), <strong>Architectural Blueprint</strong>, and <strong>Fitts's Law Heatmap</strong>. <strong>Click any component node</strong> on the stage to read its exact coordinates in the right HUD.</p>
          </div>
          <div class="hud-card">
            <div class="hud-eyebrow">03 · WEB UI TRENDS MORPHING LAB</div>
            <p class="hud-notes">Interpolates 8 component slots across 6 web layout eras (<code>1993 HTML 2.0</code> → <code>1998 Table Portal</code> → <code>2005 Web 2.0 Ajax</code> → <code>2013 Responsive Flat</code> → <code>2020 Dark Bento + ⌘K</code> → <code>2026 Agentic Spatial</code>). Drag the slider or <strong>click any stage card on the right</strong> of the canvas.</p>
          </div>
          <div class="hud-card">
            <div class="hud-eyebrow">04 · CONSTELLATION, INSPECTOR &amp; COMPARATOR</div>
            <p class="hud-notes">Use <strong>Mode 04 Constellation</strong> to explore the radial 60-year DAG by Era or Domain. In the bottom workbench, use the <strong>Deep Blueprint Inspector</strong> to traverse Predecessor/Successor pills, or open the <strong>Side-by-Side Era Comparator</strong> to compare 3 wireframes simultaneously.</p>
          </div>
        </div>
      </div>

      <div class="guide-2col">
        <div class="notice-box">
          <div class="hud-eyebrow" style="color:var(--accent-amber)">METHODOLOGY, SCOPE &amp; LIMITATIONS NOTICE</div>
          <h4>What This Educational Dataset Is — and What It Is Not</h4>
          <ul>
            <li><strong>Procedural Schematic Reconstructions, Not Archival Screenshots:</strong> All 1,026 wireframes in <code>wireframes.json</code> are deterministic, procedurally generated bounding-box schematics (<code>layoutSpec.nodes</code>) parameterized by era-authentic layout grammars (<code>scripts/generate_dataset.py</code>). Even the 122 historical landmark entries (such as 1966 Sketchpad II, 1968 SRI NLS, 1984 Macintosh, 1993 NCSA Mosaic, or 2004 Gmail) are structural layout reconstructions for comparative geometry and ergonomics instruction—not pixel-accurate archival captures or original vendor source code.</li>
            <li><strong>Heuristic UX Metric Models, Not Human-Subject Trials:</strong> Quantitative <code>uxMetrics</code> (<code>informationDensity</code>, <code>visualChromeRatio</code>, <code>layoutResponsiveness</code>, <code>fittsLawEfficiency</code>, <code>cognitiveLoadIndex</code>, <code>keyboardToPointerBias</code>) are deterministic geometric and era-parameterized heuristics built for classroom comparison, not measurements from empirical human-subject usability trials or eye-tracking studies.</li>
            <li><strong>Curated Pedagogical Taxonomy:</strong> The 12 historical eras, 10 domains, 10 platform classes, and directed lineage edges represent an instructional model of major inflection points in computing and web UI design (1966–2026), not an exhaustive census of global software history.</li>
          </ul>
        </div>

        <div class="notice-box notice-ip">
          <div class="hud-eyebrow" style="color:var(--accent-emerald)">UNLICENSED IP, PUBLIC DOMAIN &amp; TRADEMARK NOTICE</div>
          <h4>The Unlicense (Public Domain) &amp; Third-Party IP Boundary</h4>
          <ul>
            <li><strong>Original Code &amp; Procedural Dataset — The Unlicense:</strong> All original source code, HTML/CSS/JavaScript visualization modules, procedural layout generators, JSON schemas, and synthetic wireframe geometries created for this project are dedicated to the public domain under <strong>The Unlicense</strong> (see <code>UNLICENSE</code> in the repository root). You may copy, modify, teach with, and redistribute them freely without restriction.</li>
            <li><strong>Third-Party Product Names &amp; Unlicensed IP Boundary:</strong> Historical product names, system titles, and organizations referenced in the 122 landmark records (including <em>Sketchpad</em>, <em>IBM 3270</em>, <em>DEC VT100</em>, <em>Xerox Star</em>, <em>Apple Macintosh</em>, <em>Windows</em>, <em>NeXTSTEP</em>, <em>NCSA Mosaic</em>, <em>Netscape</em>, <em>Yahoo!</em>, <em>Amazon</em>, <em>Gmail</em>, <em>Google Maps</em>, <em>iPhone OS</em>, <em>GitHub</em>, <em>Figma</em>, <em>Notion</em>, <em>Linear</em>, and <em>Cursor</em>) are cited strictly for <strong>nominative, educational, and comparative UX history analysis</strong>.</li>
            <li><strong>No Vendor License or Proprietary Assets:</strong> This independent educational platform is <strong>not licensed by, endorsed by, sponsored by, or affiliated with</strong> any referenced company or trademark owner ("unlicensed IP" in that no third-party proprietary IP is licensed, bundled, or claimed). Zero proprietary vendor screenshots, icons, bitmaps, fonts, or copyrighted UI code are included in this repository. All third-party trademarks remain the property of their respective owners.</li>
          </ul>
        </div>
      </div>
    `;

    container.querySelectorAll("[data-guide-lesson]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const lid = btn.getAttribute("data-guide-lesson");
        launchGuidedLesson(lid);
        document.querySelector(".p5-product-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  window.selectActiveWireframe = selectActiveWireframe;
  window.switchP5Mode = switchP5Mode;
  window.switchDashTab = switchDashTab;
  window.launchGuidedLesson = launchGuidedLesson;

  document.addEventListener("DOMContentLoaded", bootApp);
})();
