#!/usr/bin/env python3
"""HTTP Server for "A History in UI Development" (1966-2026).

Serves static assets from ./public and provides /api/health and /api/summary JSON endpoints.
"""
import argparse
import http.server
import json
import os
import socketserver

ROOT = os.path.dirname(os.path.abspath(__file__))
PUBLIC_DIR = os.path.join(ROOT, "public")
WF_PATH = os.path.join(PUBLIC_DIR, "data", "wireframes.json")

CACHED_SUMMARY = None


def get_summary() -> dict:
    global CACHED_SUMMARY
    if CACHED_SUMMARY is None:
        with open(WF_PATH, "r", encoding="utf-8") as f:
            data = json.load(f)
        wfs = data.get("wireframes", [])
        years = [w["year"] for w in wfs]
        CACHED_SUMMARY = {
            "product": "A History in UI Development (1966-2026) — Interactive p5.js Web UI Trends & Wireframe Corpus",
            "status": "ok",
            "version": data.get("version", "1.0.0"),
            "totalWireframes": len(wfs),
            "minYear": min(years) if years else 0,
            "maxYear": max(years) if years else 0,
            "yearSpan": (max(years) - min(years)) if years else 0,
            "eraCount": data.get("eraCount", 12),
            "domainCount": data.get("domainCount", 10),
            "platformCount": data.get("platformCount", 10),
            "landmarkCount": sum(1 for w in wfs if w.get("isLandmark")),
            "webNativeCount": sum(1 for w in wfs if w.get("isWebNative")),
            "p5Modes": ["chronos", "simulator", "web-morph", "constellation"],
        }
    return CACHED_SUMMARY


class UIHistoryHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=PUBLIC_DIR, **kwargs)

    def do_GET(self):
        if self.path == "/favicon.ico":
            self.send_response(204)
            self.end_headers()
            return
        if self.path == "/api/health":
            self._send_json({"status": "ok", "service": "history-in-ui-development"})
            return
        if self.path == "/api/summary":
            self._send_json(get_summary())
            return
        return super().do_GET()

    def _send_json(self, obj: dict):
        body = json.dumps(obj).encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format, *args):
        pass


class ReusableTCPServer(socketserver.ThreadingMixIn, socketserver.TCPServer):
    allow_reuse_address = True


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8080)
    args = parser.parse_args()

    with ReusableTCPServer((args.host, args.port), UIHistoryHandler) as httpd:
        actual_port = httpd.server_address[1]
        print(f"Serving A History in UI Development on http://{args.host}:{actual_port}", flush=True)
        httpd.serve_forever()


if __name__ == "__main__":
    main()
