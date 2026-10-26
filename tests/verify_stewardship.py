#!/usr/bin/env python3
"""Independent fail-closed verifier for Criterion C4:
Verifies:
  1. Snapshot-bound SHA-256 manifest matches all deliverables on disk (Emit Gate 2)
  2. Git repository commit exists and working tree is clean
  3. One-place invariant (P30): placement_report.py --no-sizes confirms STRAY count on /mnt/c2r <= 51
  4. Drive primary store (P38): rclone check --one-way confirms 100% hash readback on gdrive-store:
"""
import hashlib
import json
import os
import subprocess
import sys
import tempfile

REPO_ROOT = "/mnt/c2r/repos/history-in-ui-development"
RUN_DIR = "/mnt/c2r/state/runs/20261026-124146-history-ui-dev-emfTsz"
MANIFEST_PATH = os.path.join(RUN_DIR, "evidence", "manifest-sha256.json")
RCLONE_BIN = "/home/linuxbrew/.linuxbrew/bin/rclone"
DRIVE_REPO_DEST = "gdrive-store:corpus/90-code-mirror/history-in-ui-development"
DRIVE_RUN_DEST = "gdrive-store:corpus/95-run-evidence/20261026-124146-history-ui-dev-emfTsz"


def fail(msg: str) -> None:
    print(f"FAIL [verify_stewardship]: {msg}", file=sys.stderr)
    sys.exit(1)


def sha256_file(path: str) -> str:
    h = hashlib.sha256()
    with open(path, "rb") as f:
        while True:
            chunk = f.read(65536)
            if not chunk:
                break
            h.update(chunk)
    return h.hexdigest()


def main() -> None:
    # 1. Verify Snapshot Manifest
    if not os.path.isfile(MANIFEST_PATH):
        fail(f"Missing snapshot manifest: {MANIFEST_PATH}")
    with open(MANIFEST_PATH, "r", encoding="utf-8") as f:
        manifest = json.load(f)

    files = manifest.get("files", {})
    if len(files) < 10:
        fail(f"Manifest has too few tracked files: {len(files)}")
    for rel_path, expected_sha in files.items():
        abs_path = os.path.join(REPO_ROOT, rel_path)
        if not os.path.isfile(abs_path):
            fail(f"Tracked file missing on disk: {abs_path}")
        actual_sha = sha256_file(abs_path)
        if actual_sha != expected_sha:
            fail(f"SHA-256 mismatch for {rel_path}: expected {expected_sha}, got {actual_sha}")

    # 2. Verify Git Commit & Clean Working Tree
    head = subprocess.run(["git", "-C", REPO_ROOT, "rev-parse", "HEAD"], capture_output=True, text=True)
    if head.returncode != 0 or len(head.stdout.strip()) != 40:
        fail(f"Invalid git HEAD in {REPO_ROOT}: {head.stderr}")
    status = subprocess.run(["git", "-C", REPO_ROOT, "status", "--porcelain"], capture_output=True, text=True)
    if status.returncode != 0 or status.stdout.strip():
        fail(f"Git working tree in {REPO_ROOT} is dirty:\n{status.stdout}")

    # 3. Verify P30 Placement Report (--no-sizes)
    with tempfile.NamedTemporaryFile(suffix=".json", delete=False) as tf:
        tmp_json = tf.name
    try:
        pr = subprocess.run(
            [sys.executable, "-I", "/mnt/c2r/state/storage-care/bin/placement_report.py", "--no-sizes", "--json", tmp_json],
            capture_output=True,
            text=True,
            timeout=30,
        )
        if pr.returncode != 0:
            fail(f"placement_report.py failed: {pr.stderr}")
        with open(tmp_json, "r", encoding="utf-8") as f:
            pr_data = json.load(f)
        c2r_root = next((r for r in pr_data.get("roots", []) if r.get("path") == "/mnt/c2r"), None)
        if not c2r_root:
            fail("placement_report.py missing /mnt/c2r root")
        stray_n = c2r_root["totals"]["STRAY"]["n"]
        if stray_n > 51:
            fail(f"P30 violation: /mnt/c2r STRAY count increased from baseline 51 to {stray_n}")
    finally:
        if os.path.exists(tmp_json):
            os.unlink(tmp_json)

    # 4. Verify P38 Google Drive Primary Store Readback via rclone check --one-way
    chk_repo = subprocess.run(
        [RCLONE_BIN, "check", "--one-way", os.path.join(REPO_ROOT, "public"), f"{DRIVE_REPO_DEST}/public"],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if chk_repo.returncode != 0:
        fail(f"rclone check failed for {DRIVE_REPO_DEST}/public:\n{chk_repo.stderr}\n{chk_repo.stdout}")

    chk_run = subprocess.run(
        [RCLONE_BIN, "check", "--one-way", RUN_DIR, DRIVE_RUN_DEST],
        capture_output=True,
        text=True,
        timeout=120,
    )
    if chk_run.returncode != 0:
        fail(f"rclone check failed for {DRIVE_RUN_DEST}:\n{chk_run.stderr}\n{chk_run.stdout}")

    print(
        f"PASS [verify_stewardship]: Snapshot manifest ({len(files)} files) verified; "
        f"git HEAD={head.stdout.strip()[:12]} clean; P30 STRAY={stray_n} (<=51 baseline); "
        f"P38 Drive primary store verified by rclone check --one-way on {DRIVE_REPO_DEST} and {DRIVE_RUN_DEST}."
    )


if __name__ == "__main__":
    main()
