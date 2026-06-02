#!/usr/bin/env python3
"""Build one single-year seed file from a raw studiegids tree crawl."""

from __future__ import annotations

import argparse
import json
import re
import sys
import time
import unicodedata
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path


class SeedBuildError(RuntimeError):
    pass


@dataclass
class BuildProgress:
    input_path: Path
    output_path: Path
    enabled: bool = True

    def __post_init__(self) -> None:
        self.started_at = time.monotonic()

    def log(self, message: str) -> None:
        if not self.enabled:
            return
        elapsed = time.monotonic() - self.started_at
        print(f"[seed-build +{elapsed:6.1f}s] {message}", file=sys.stderr, flush=True)


def normalize_space(text: str) -> str:
    return " ".join(str(text).split())


def normalize_fragment(text: str) -> str:
    ascii_text = unicodedata.normalize("NFKD", normalize_space(text)).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", ascii_text.casefold()).strip("-")


def load_raw_document(path: Path) -> dict[str, object]:
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        raise SeedBuildError(f"Raw crawl file not found: {path}") from exc
    except json.JSONDecodeError as exc:
        raise SeedBuildError(f"Raw crawl file is not valid JSON: {path}: {exc}") from exc

    if not isinstance(data, dict):
        raise SeedBuildError("Raw crawl JSON root must be an object.")
    if not isinstance(data.get("programmeTrees"), list):
        raise SeedBuildError("Raw crawl JSON is missing programmeTrees.")
    return data


def build_programme_id(department_value: str, programme_code: str) -> str:
    return f"programme-{normalize_fragment(department_value)}-{normalize_fragment(programme_code)}"


def build_seed_entry_id(programme_code: str, label: str, selection_path: list[dict[str, str]]) -> str:
    parts = [
        "seed",
        normalize_fragment(programme_code),
        normalize_fragment(label) or "unknown",
    ]
    for step in selection_path:
        parts.append(f"{normalize_fragment(step['key'])}-{normalize_fragment(step['value'])}")
    return "-".join(parts)


def build_programmes(raw_document: dict[str, object]) -> list[dict[str, object]]:
    programmes: list[dict[str, object]] = []
    seen_ids: set[str] = set()
    for tree in raw_document["programmeTrees"]:
        department = tree["department"]
        programme = tree["programme"]
        programme_id = build_programme_id(department["value"], programme["value"])
        if programme_id in seen_ids:
            raise SeedBuildError(f"Duplicate programme id generated: {programme_id}")
        seen_ids.add(programme_id)
        programmes.append(
            {
                "id": programme_id,
                "code": programme["value"],
                "name": programme["label"],
                "active": True,
                "department": {
                    "value": department["value"],
                    "label": department["label"],
                },
                "selectionFlow": tree["selectionFlow"],
            }
        )

    programmes.sort(key=lambda item: (item["department"]["label"], item["code"]))
    return programmes


def build_seed_entries(
    raw_document: dict[str, object],
    *,
    default_max_score: int,
) -> list[dict[str, object]]:
    entries: list[dict[str, object]] = []
    seen_ids: set[str] = set()
    generated_at = datetime.now(timezone.utc).isoformat()
    acadjaar = str(raw_document["acadjaar"])
    source_url = str(raw_document.get("sourceUrl") or "")

    for tree in raw_document["programmeTrees"]:
        department = tree["department"]
        programme = tree["programme"]
        programme_id = build_programme_id(department["value"], programme["value"])
        for branch in tree["branches"]:
            selection_context = {
                "departement": {
                    "value": department["value"],
                    "label": f"{department['value']} {department['label']}",
                }
            }
            for step in branch["selectionPath"]:
                selection_context[step["key"]] = {
                    "value": step["value"],
                    "label": f"{step['value']} {step['label']}",
                }

            for label in branch["olodNames"]:
                entry_id = build_seed_entry_id(programme["value"], label, branch["selectionPath"])
                if entry_id in seen_ids:
                    raise SeedBuildError(f"Duplicate seed entry id generated: {entry_id}")
                seen_ids.add(entry_id)
                entries.append(
                    {
                        "id": entry_id,
                        "programmeId": programme_id,
                        "programmeCode": programme["value"],
                        "label": normalize_space(label),
                        "defaultVaklector": None,
                        "defaultLecturers": [],
                        "defaultStartTime": None,
                        "defaultDurationMinutes": None,
                        "defaultAllowedResources": None,
                        "defaultMaxScore": default_max_score,
                        "active": True,
                        "sourceLastUpdated": generated_at,
                        "selectionContext": selection_context,
                        "source": {
                            "type": "studiegids",
                            "acadjaar": acadjaar,
                            "url": source_url,
                        },
                    }
                )

    entries.sort(key=lambda item: (item["programmeCode"], item["label"], item["id"]))
    return entries


def build_seed_document(
    raw_document: dict[str, object],
    *,
    input_path: Path,
    default_max_score: int,
) -> dict[str, object]:
    return {
        "version": 2,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "academicYear": str(raw_document["acadjaar"]),
        "source": {
            "type": "studiegids",
            "generator": "scripts/build_programmes_seed.py",
            "rawInput": str(input_path),
            "url": str(raw_document.get("sourceUrl") or ""),
        },
        "programmes": build_programmes(raw_document),
        "seedEntries": build_seed_entries(raw_document, default_max_score=default_max_score),
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input",
        required=True,
        type=Path,
        help="Raw crawl JSON from scripts/scrape_studiegids_tree.py for exactly one academic year.",
    )
    parser.add_argument(
        "--output",
        required=True,
        type=Path,
        help="Single-year seed JSON output path.",
    )
    parser.add_argument(
        "--default-max-score",
        type=int,
        default=20,
        help="Default max score assigned to every generated seed entry.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    progress = BuildProgress(input_path=args.input, output_path=args.output)
    try:
        progress.log(f"loading raw crawl from {args.input}")
        raw_document = load_raw_document(args.input)
        progress.log(
            f"loaded academic year {raw_document['acadjaar']} with {len(raw_document['programmeTrees'])} programme tree(s)"
        )
        document = build_seed_document(
            raw_document,
            input_path=args.input,
            default_max_score=args.default_max_score,
        )
        progress.log(
            f"built {len(document['programmes'])} programme(s) and {len(document['seedEntries'])} seed entries"
        )
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(document, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        progress.log(f"wrote seed file to {args.output}")
    except (OSError, SeedBuildError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())