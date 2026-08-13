#!/usr/bin/env python3
"""Project-specific tooling bootstrap helper.

This script intentionally does not install global AI-agent tools.
It prints the minimum local setup and optional recommendations.
"""

from __future__ import annotations

import json

PROFILE = {
    "project_tier": "M",
    "local_required": [
        "Node.js >=22.4",
        "npm",
        "Chrome/Chromium",
        "Python 3",
    ],
    "npm_dev_dependencies": [
        "wxt@0.21.1",
        "typescript@^7.0.2",
        "vitest@^4.1.10",
        "@playwright/test@^1.62.0",
    ],
    "optional_agent_tools": [
        "Context7",
        "Superpowers-style TDD/debug workflow",
        "Semble",
        "Serena",
        "RTK",
        "gstack/browser QA",
    ],
}


def main() -> None:
    print(json.dumps(PROFILE, indent=2))
    print("\nRun: npm install")
    print("Then: npm run check")


if __name__ == "__main__":
    main()
