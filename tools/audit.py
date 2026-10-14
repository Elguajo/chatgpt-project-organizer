#!/usr/bin/env python3
"""Small consistency audit for the ProjectPins spec-driven repository."""

from __future__ import annotations

from pathlib import Path
import re
import sys
import json

ROOT = Path(__file__).resolve().parents[1]

REQUIRED = [
    "AGENTS.md",
    ".specify/memory/constitution.md",
    ".token-efficient-spec-kit/VERSION",
    "docs/project/PROJECT_BRIEF.md",
    "docs/project/ARCHITECTURE.md",
    "docs/project/ROADMAP.md",
    "docs/project/NEXT_SESSION.md",
    "docs/project/TOOLING_STATUS.md",
    "docs/system/TOKEN_EFFICIENCY.md",
    "docs/system/ENGINEERING_RULES.md",
    "docs/product/DOM_ADAPTER.md",
    "docs/product/PRIVACY_AND_SECURITY.md",
    "docs/product/TEST_MATRIX.md",
    "package.json",
    "wxt.config.ts",
    "entrypoints/chatgpt.content.ts",
]

ROADMAP_ENTRY = re.compile(
    r"^- \[(?P<mark>[ >x])\] (?P<label>Phase \d+ - .+?) - "
    r"(?P<status>PLANNED|IN PROGRESS|COMPLETE) - `(?P<path>docs/phases/[^`]+)`$"
)


def fail(errors: list[str], message: str) -> None:
    errors.append(message)


def main() -> int:
    errors: list[str] = []

    for rel in REQUIRED:
        if not (ROOT / rel).is_file():
            fail(errors, f"missing required file: {rel}")

    roadmap_path = ROOT / "docs/project/ROADMAP.md"
    next_path = ROOT / "docs/project/NEXT_SESSION.md"

    if roadmap_path.exists():
        entries = []
        for line in roadmap_path.read_text(encoding="utf-8").splitlines():
            m = ROADMAP_ENTRY.match(line)
            if m:
                entries.append(m.groupdict())

        if not entries:
            fail(errors, "ROADMAP contains no parseable phase entries")
        else:
            current = [e for e in entries if e["mark"] == ">"]
            incomplete = [e for e in entries if e["mark"] != "x"]

            if incomplete and len(current) != 1:
                fail(
                    errors,
                    f"expected exactly one [>] current phase, found {len(current)}",
                )
            if not incomplete and current:
                fail(errors, "all phases complete but a current [>] marker still exists")

            for entry in entries:
                phase_file = ROOT / entry["path"]
                if not phase_file.is_file():
                    fail(errors, f"roadmap phase file missing: {entry['path']}")

                mark = entry["mark"]
                status = entry["status"]
                expected = {">": "IN PROGRESS", "x": "COMPLETE", " ": "PLANNED"}[mark]
                if status != expected:
                    fail(
                        errors,
                        f"roadmap marker/status mismatch for {entry['label']}: "
                        f"[{mark}] vs {status}",
                    )

            if current and next_path.exists():
                next_text = next_path.read_text(encoding="utf-8")
                current_label = current[0]["label"]
                current_name = current_label.replace(" - ", " — ", 1)
                # Allow ASCII hyphen form used in the Next Session document.
                if current_label not in next_text and current_name not in next_text:
                    fail(
                        errors,
                        "NEXT_SESSION does not mention the current ROADMAP phase",
                    )

    # Guard against obvious scope/permission drift in WXT config.
    config = ROOT / "wxt.config.ts"
    if config.exists():
        text = config.read_text(encoding="utf-8")
        forbidden = [
            "<all_urls>",
            "'cookies'",
            '"cookies"',
            "'webRequest'",
            '"webRequest"',
            "'history'",
            '"history"',
            "'tabs'",
            '"tabs"',
        ]
        for token in forbidden:
            if token in text:
                fail(errors, f"forbidden MVP permission/scope in wxt.config.ts: {token}")

    content = ROOT / "entrypoints/chatgpt.content.ts"
    if content.exists():
        text = content.read_text(encoding="utf-8")
        if "https://chatgpt.com/*" not in text:
            fail(errors, "content script is not scoped to https://chatgpt.com/*")

    package = json.loads((ROOT / "package.json").read_text(encoding="utf-8"))
    lock = json.loads((ROOT / "package-lock.json").read_text(encoding="utf-8"))
    version = package["version"]
    if lock.get("version") != version or lock.get("packages", {}).get("", {}).get("version") != version:
        fail(errors, "package and lockfile extension versions differ")
    manifest_file = ROOT / ".output/chrome-mv3/manifest.json"
    if manifest_file.exists():
        manifest = json.loads(manifest_file.read_text(encoding="utf-8"))
        if manifest.get("version") != version:
            fail(errors, "production manifest version differs; rebuild the extension")
        if manifest.get("permissions") != ["storage"] or manifest.get("host_permissions"):
            fail(errors, "production manifest permissions differ from approved scope")
        scripts = manifest.get("content_scripts", [])
        if len(scripts) != 1 or scripts[0].get("matches") != ["https://chatgpt.com/*"]:
            fail(errors, "production content script host scope differs")

    network_pattern = re.compile(r"\bfetch\s*\(|\bnew\s+(?:XMLHttpRequest|WebSocket|EventSource)\b")
    for source in list((ROOT / "src").rglob("*.ts")) + list((ROOT / "entrypoints").rglob("*.ts")):
        if network_pattern.search(source.read_text(encoding="utf-8")):
            fail(errors, f"unapproved production network API in {source.relative_to(ROOT)}")

    if errors:
        print("AUDIT FAILED")
        for error in errors:
            print(f"- {error}")
        return 1

    print("AUDIT OK")
    print("- required project/workflow files present")
    print("- roadmap markers and phase references are consistent")
    print("- NEXT_SESSION points to the current phase")
    print("- no obvious forbidden MVP permissions detected")
    print(f"- extension version {version} consistent across package, lockfile and available build")
    print("- production source has no direct network API usage")
    return 0


if __name__ == "__main__":
    sys.exit(main())
