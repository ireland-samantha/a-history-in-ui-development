#!/usr/bin/env python3
"""Independent fail-closed verifier for Criterion C1:
Verifies the 60-year (1966-2026) ~1,000+ unique wireframe seed dataset and trends metadata.
Computes its own canonical geometric + component-type structural hash (acyclic trust, Emit Gate 1).
"""
import hashlib
import json
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(ROOT, "public", "data")
WF_JSON = os.path.join(DATA_DIR, "wireframes.json")
WF_JSONL = os.path.join(DATA_DIR, "wireframes.jsonl")
TRENDS_JSON = os.path.join(DATA_DIR, "trends.json")
SCHEMA_JSON = os.path.join(DATA_DIR, "schema.json")


def fail(msg: str) -> None:
    print(f"FAIL [verify_dataset]: {msg}", file=sys.stderr)
    sys.exit(1)


def compute_independent_geometric_hash(wf: dict) -> str:
    spec = wf.get("layoutSpec", {})
    vw = float(spec.get("viewportWidth", 1))
    vh = float(spec.get("viewportHeight", 1))
    nodes = spec.get("nodes", [])
    canonical_nodes = []
    for n in nodes:
        canonical_nodes.append((
            str(n.get("type", "")),
            round(float(n.get("x", 0)) / vw, 3),
            round(float(n.get("y", 0)) / vh, 3),
            round(float(n.get("w", 0)) / vw, 3),
            round(float(n.get("h", 0)) / vh, 3),
            int(n.get("zIndex", 1)),
        ))
    payload = json.dumps({
        "era": wf.get("era"),
        "chromeStyle": spec.get("chromeStyle"),
        "gridColumns": spec.get("gridColumns"),
        "gridRows": spec.get("gridRows"),
        "nodes": canonical_nodes,
    }, sort_keys=True, separators=(",", ":"))
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()


def main() -> None:
    for p in (WF_JSON, WF_JSONL, TRENDS_JSON, SCHEMA_JSON):
        if not os.path.isfile(p) or os.path.getsize(p) == 0:
            fail(f"Missing or empty dataset file: {p}")

    with open(WF_JSON, "r", encoding="utf-8") as f:
        payload = json.load(f)

    wireframes = payload.get("wireframes") if isinstance(payload, dict) else payload
    if not isinstance(wireframes, list):
        fail("wireframes.json must contain a list of wireframes")

    total = len(wireframes)
    if total < 1000:
        fail(f"Expected >= 1000 wireframes, found {total}")

    with open(WF_JSONL, "r", encoding="utf-8") as f:
        jsonl_lines = [line.strip() for line in f if line.strip()]
    if len(jsonl_lines) != total:
        fail(f"wireframes.jsonl line count ({len(jsonl_lines)}) != wireframes.json count ({total})")

    years = [int(w.get("year", 0)) for w in wireframes]
    min_year, max_year = min(years), max(years)
    if min_year != 1966 or max_year != 2026 or (max_year - min_year) != 60:
        fail(f"Year span must be 1966..2026 (60 years), got {min_year}..{max_year}")

    year_counts = {y: 0 for y in range(1966, 2027)}
    for y in years:
        if y not in year_counts:
            fail(f"Out-of-range year {y}")
        year_counts[y] += 1

    missing_years = [y for y, c in year_counts.items() if c < 10]
    if missing_years:
        fail(f"Every year 1966..2026 must have >= 10 wireframes; under-represented years: {missing_years[:10]}")

    ids = set()
    titles = set()
    stored_hashes = set()
    recomputed_hashes = set()
    eras = {}
    domains = set()
    platforms = set()
    layout_engines = set()
    component_types = set()
    landmark_count = 0

    by_id = {}
    for idx, wf in enumerate(wireframes):
        wid = wf.get("id")
        title = wf.get("title")
        if not wid or wid in ids:
            fail(f"Duplicate or missing id at index {idx}: {wid}")
        if not title or title in titles:
            fail(f"Duplicate or missing title at index {idx}: {title}")
        ids.add(wid)
        titles.add(title)
        by_id[wid] = wf

        era = wf.get("era")
        eras[era] = eras.get(era, 0) + 1
        domains.add(wf.get("domain"))
        platforms.add(wf.get("platform"))
        layout_engines.add(wf.get("webLayoutEngine"))
        if wf.get("isLandmark"):
            landmark_count += 1

        # Verify layoutSpec and nodes
        spec = wf.get("layoutSpec")
        if not isinstance(spec, dict):
            fail(f"Wireframe {wid} missing layoutSpec")
        vw = spec.get("viewportWidth", 0)
        vh = spec.get("viewportHeight", 0)
        if vw < 320 or vh < 200:
            fail(f"Wireframe {wid} invalid viewport {vw}x{vh}")
        nodes = spec.get("nodes", [])
        if not isinstance(nodes, list) or len(nodes) < 8 or len(nodes) > 36:
            fail(f"Wireframe {wid} must have between 8 and 36 nodes, got {len(nodes) if isinstance(nodes, list) else 'non-list'}")

        node_ids = set()
        for n in nodes:
            nid = n.get("id")
            ntype = n.get("type")
            if not nid or nid in node_ids:
                fail(f"Wireframe {wid} duplicate/missing node id {nid}")
            node_ids.add(nid)
            component_types.add(ntype)
            x, y, w, h = float(n.get("x", -1)), float(n.get("y", -1)), float(n.get("w", 0)), float(n.get("h", 0))
            if x < -0.5 or y < -0.5 or w <= 0 or h <= 0 or (x + w) > vw + 1.5 or (y + h) > vh + 1.5:
                fail(f"Wireframe {wid} node {nid} out of bounds: ({x}, {y}, {w}, {h}) in {vw}x{vh}")
            # Historical anachronism guard (--interrogate check)
            if wf.get("year", 0) <= 1990 and ntype in ("floating-action-btn", "bento-tile", "spatial-ornament", "agent-trace-ledger", "bottom-sheet"):
                fail(f"Historical anachronism in {wid} ({wf.get('year')}): modern primitive '{ntype}' in pre-1991 wireframe")

        # Verify uxMetrics
        m = wf.get("uxMetrics", {})
        for k in ("informationDensity", "interactionComplexity", "visualChromeRatio", "layoutResponsiveness", "fittsLawEfficiency"):
            val = m.get(k)
            if not isinstance(val, (int, float)) or not (0.0 <= float(val) <= 1.0):
                fail(f"Wireframe {wid} metric {k}={val} out of [0,1]")
        kpb = m.get("keyboardToPointerBias")
        if not isinstance(kpb, (int, float)) or not (-1.0 <= float(kpb) <= 1.0):
            fail(f"Wireframe {wid} metric keyboardToPointerBias={kpb} out of [-1,1]")
        cli = m.get("cognitiveLoadIndex")
        if not isinstance(cli, (int, float)) or not (1.0 <= float(cli) <= 10.0):
            fail(f"Wireframe {wid} metric cognitiveLoadIndex={cli} out of [1,10]")

        # Verify uxResearchNotes
        notes = wf.get("uxResearchNotes", {})
        for nk in ("paradigmSummary", "keyInnovations", "usabilityTradeoffs", "webTrendConnection"):
            if not isinstance(notes.get(nk), str) or len(notes.get(nk, "").strip()) < 20:
                fail(f"Wireframe {wid} missing substantive uxResearchNotes.{nk}")

        # Verify stored and independently recomputed geometric hash
        sh = wf.get("structuralHash")
        if not sh or sh in stored_hashes:
            fail(f"Wireframe {wid} duplicate or missing stored structuralHash")
        stored_hashes.add(sh)

        rh = compute_independent_geometric_hash(wf)
        if rh in recomputed_hashes:
            fail(f"Wireframe {wid} failed independent geometric uniqueness check (collision on {rh})")
        recomputed_hashes.add(rh)

    if len(eras) != 12:
        fail(f"Expected 12 historical eras, found {len(eras)}: {list(eras.keys())}")
    for ek, ec in eras.items():
        if ec < 50:
            fail(f"Era {ek} has fewer than 50 wireframes ({ec})")

    if len(domains) < 10:
        fail(f"Expected >= 10 domains, found {len(domains)}")
    if len(platforms) < 10:
        fail(f"Expected >= 10 platforms, found {len(platforms)}")
    if len(component_types) < 25:
        fail(f"Expected >= 25 distinct component primitive types, found {len(component_types)}")
    if landmark_count < 100:
        fail(f"Expected >= 100 historical landmark wireframes, found {landmark_count}")

    # Verify chronological lineage DAG
    connected = 0
    for wid, wf in by_id.items():
        preds = wf.get("predecessorIds", [])
        succs = wf.get("successorIds", [])
        if preds or succs:
            connected += 1
        for pid in preds:
            if pid == wid:
                fail(f"Wireframe {wid} has self-loop in predecessorIds")
            if pid not in by_id:
                fail(f"Wireframe {wid} has dangling predecessorId {pid}")
            if by_id[pid]["year"] > wf["year"]:
                fail(f"Wireframe {wid} ({wf['year']}) has predecessor {pid} from later year ({by_id[pid]['year']})")
            if wid not in by_id[pid].get("successorIds", []):
                fail(f"Asymmetric lineage link: {pid} in {wid}.predecessorIds but {wid} not in {pid}.successorIds")
        for sid in succs:
            if sid == wid:
                fail(f"Wireframe {wid} has self-loop in successorIds")
            if sid not in by_id:
                fail(f"Wireframe {wid} has dangling successorId {sid}")
            if by_id[sid]["year"] < wf["year"]:
                fail(f"Wireframe {wid} ({wf['year']}) has successor {sid} from earlier year ({by_id[sid]['year']})")
            if wid not in by_id[sid].get("predecessorIds", []):
                fail(f"Asymmetric lineage link: {sid} in {wid}.successorIds but {wid} not in {sid}.predecessorIds")

    if connected < int(0.95 * total):
        fail(f"Expected >= 95% of wireframes in lineage graph, got {connected}/{total}")

    # Verify trends.json
    with open(TRENDS_JSON, "r", encoding="utf-8") as f:
        trends = json.load(f)
    if len(trends.get("eras", [])) != 12:
        fail("trends.json must contain 12 eras")
    if len(trends.get("yearlySeries", [])) != 61:
        fail(f"trends.json yearlySeries must have 61 entries (1966..2026), got {len(trends.get('yearlySeries', []))}")
    if len(trends.get("webLayoutMorphArchetypes", [])) < 5:
        fail("trends.json must contain >= 5 webLayoutMorphArchetypes for p5.js Mode 3")
    if len(trends.get("componentEvolution", [])) < 20:
        fail("trends.json must contain >= 20 componentEvolution series")

    print(
        f"PASS [verify_dataset]: {total} unique wireframes verified across {min_year}-{max_year} "
        f"(60-year span, {len(eras)} eras, {len(domains)} domains, {len(platforms)} platforms, "
        f"{len(component_types)} component types, {landmark_count} landmarks, "
        f"100% unique recomputed geometric hashes)."
    )


if __name__ == "__main__":
    main()
