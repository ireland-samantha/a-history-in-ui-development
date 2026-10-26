#!/usr/bin/env python3
"""Independent fail-closed verifier for Criterion C2:
Spawns server.py on an ephemeral free port, verifies HTTP 200 responses, MIME headers,
and non-empty valid payloads for index.html, styles.css, p5.min.js, dashboard.js,
p5-experience.js, wireframes.json, trends.json, and schema.json.
"""
import json
import os
import socket
import subprocess
import sys
import time
import urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SERVER_PY = os.path.join(ROOT, "server.py")


def fail(msg: str) -> None:
    print(f"FAIL [verify_app_http]: {msg}", file=sys.stderr)
    sys.exit(1)


def get_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("127.0.0.1", 0))
        return s.getsockname()[1]


def main() -> None:
    if not os.path.isfile(SERVER_PY):
        fail(f"Missing server script: {SERVER_PY}")

    port = get_free_port()
    proc = subprocess.Popen(
        [sys.executable, "-I", SERVER_PY, "--port", str(port), "--host", "127.0.0.1"],
        cwd=ROOT,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )
    try:
        base_url = f"http://127.0.0.1:{port}"
        ready = False
        for _ in range(40):
            try:
                with urllib.request.urlopen(f"{base_url}/api/health", timeout=1.0) as resp:
                    if resp.status == 200:
                        ready = True
                        break
            except Exception:
                time.sleep(0.1)
        if not ready:
            out, err = proc.communicate(timeout=2)
            fail(f"Server did not become ready on {base_url}. stdout={out} stderr={err}")

        endpoints = [
            ("/", "text/html", 2000, ["A History in UI Development", "p5.min.js", "p5-experience.js", "dashboard.js"]),
            ("/styles.css", "text/css", 2000, ["--bg-", "canvas", "dashboard"]),
            ("/vendor/p5.min.js", "javascript", 100000, ["p5", "createCanvas"]),
            ("/js/dashboard.js", "javascript", 4000, ["wireframes", "filter", "compare"]),
            ("/js/p5-experience.js", "javascript", 5000, ["chronos", "simulator", "web-morph", "constellation"]),
            ("/data/wireframes.json", "application/json", 500000, ["wireframes", "layoutSpec", "uxMetrics"]),
            ("/data/trends.json", "application/json", 5000, ["eras", "yearlySeries", "webLayoutMorphArchetypes"]),
            ("/data/schema.json", "application/json", 500, ["$schema", "Wireframe"]),
            ("/api/summary", "application/json", 200, ["totalWireframes", "yearSpan"]),
        ]

        for path, expected_mime, min_bytes, needles in endpoints:
            url = f"{base_url}{path}"
            with urllib.request.urlopen(url, timeout=5.0) as resp:
                if resp.status != 200:
                    fail(f"GET {path} returned HTTP {resp.status}")
                ctype = resp.headers.get("Content-Type", "").lower()
                if expected_mime not in ctype:
                    fail(f"GET {path} Content-Type '{ctype}' missing '{expected_mime}'")
                body = resp.read().decode("utf-8", errors="replace")
                if len(body) < min_bytes:
                    fail(f"GET {path} body length {len(body)} < {min_bytes} bytes")
                for needle in needles:
                    if needle not in body:
                        fail(f"GET {path} body missing expected token '{needle}'")

        # Parse JSON endpoints
        with urllib.request.urlopen(f"{base_url}/api/summary", timeout=5.0) as resp:
            summary = json.loads(resp.read().decode("utf-8"))
            if summary.get("totalWireframes", 0) < 1000 or summary.get("yearSpan") != 60:
                fail(f"Invalid /api/summary payload: {summary}")

        print(f"PASS [verify_app_http]: All {len(endpoints)} HTTP endpoints verified on {base_url} (totalWireframes={summary['totalWireframes']}, yearSpan={summary['yearSpan']}).")
    finally:
        proc.terminate()
        try:
            proc.wait(timeout=3)
        except subprocess.TimeoutExpired:
            proc.kill()


if __name__ == "__main__":
    main()
