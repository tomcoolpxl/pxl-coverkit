#!/usr/bin/env python3
"""Transform raw studiegids scrape output into app-facing seed JSON.

This keeps the raw scrape result as an audit/source artifact and emits a flat
seed-entry file that the future app can filter by programme, modeltraject,
trajectschijf, and deeltraject.

Example:
  python scripts/build_programmes_seed.py \
    --input pbtin-2025-26.raw.json \
    --output public/data/programmes.seed.json
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path


class SeedBuildError(RuntimeError):
    pass


def normalize_fragment(text: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", text.casefold()).strip("-")


def parse_olod_name(full_name: str) -> tuple[str, str]:
    match = re.match(r"^([0-9A-Z]+)\s+(.+)$", full_name.strip())
    if not match:
        raise SeedBuildError(f"Could not split OLOD code and name from {full_name!r}")
    return match.group(1), match.group(2)


def build_entry_id(
    programme_code: str,
    course_code: str,
    modeltraject_value: str | None,
    trajectschijf_value: str | None,
    deeltraject_value: str | None,
) -> str:
    parts = [
        "seed",
        normalize_fragment(programme_code),
        normalize_fragment(course_code),
    ]
    if modeltraject_value:
        parts.append(f"m{normalize_fragment(modeltraject_value)}")
    if trajectschijf_value:
        parts.append(f"t{normalize_fragment(trajectschijf_value)}")
    if deeltraject_value:
        parts.append(f"d{normalize_fragment(deeltraject_value)}")
    return "-".join(parts)


def build_selection_context(
    *,
    departement: dict[str, str] | None,
    modeltraject: dict[str, str] | None,
    trajectschijf: dict[str, str] | None,
    deeltraject: dict[str, str] | None,
) -> dict[str, dict[str, str]]:
    context: dict[str, dict[str, str]] = {}
    if departement and departement.get("value"):
        context["departement"] = {
            "value": departement["value"],
            "label": departement["label"],
        }
    if modeltraject and modeltraject.get("value"):
        context["modeltraject"] = {
            "value": modeltraject["value"],
            "label": modeltraject["label"],
        }
    if trajectschijf and trajectschijf.get("value"):
        context["trajectschijf"] = {
            "value": trajectschijf["value"],
            "label": trajectschijf["label"],
        }
    if deeltraject and deeltraject.get("value"):
        context["deeltraject"] = {
            "value": deeltraject["value"],
            "label": deeltraject["label"],
        }
    return context


def build_seed_document(raw_data: dict[str, object], default_max_score: int) -> dict[str, object]:
    programme = raw_data.get("opleiding")
    if not isinstance(programme, dict):
        raise SeedBuildError("Input JSON is missing the opleiding object.")

    programme_code = programme.get("value")
    programme_name = programme.get("label")
    if not isinstance(programme_code, str) or not isinstance(programme_name, str):
        raise SeedBuildError("The opleiding object must contain string value and label fields.")

    modeltraject = raw_data.get("modeltraject")
    if modeltraject is not None and not isinstance(modeltraject, dict):
        raise SeedBuildError("The modeltraject field must be an object when present.")

    departement = raw_data.get("departement")
    if departement is not None and not isinstance(departement, dict):
        raise SeedBuildError("The departement field must be an object when present.")

    trajectschijven = raw_data.get("trajectschijven")
    if not isinstance(trajectschijven, list):
        raise SeedBuildError("Input JSON is missing the trajectschijven list.")

    generated_at = datetime.now(timezone.utc).isoformat()
    source_url = raw_data.get("source_url")
    acadjaar = raw_data.get("acadjaar")

    seed_entries: list[dict[str, object]] = []
    seen_ids: set[str] = set()
    for trajectschijf in trajectschijven:
        if not isinstance(trajectschijf, dict):
            raise SeedBuildError("Each trajectschijf entry must be an object.")

        trajectschijf_ref = {
            "value": str(trajectschijf.get("value") or ""),
            "label": str(trajectschijf.get("label") or ""),
        }
        deeltrajecten = trajectschijf.get("deeltrajecten")
        if not isinstance(deeltrajecten, list):
            raise SeedBuildError("Each trajectschijf must contain a deeltrajecten list.")

        for deeltraject in deeltrajecten:
            if not isinstance(deeltraject, dict):
                raise SeedBuildError("Each deeltraject entry must be an object.")
            deeltraject_ref = {
                "value": str(deeltraject.get("value") or ""),
                "label": str(deeltraject.get("label") or ""),
            }
            olod_names = deeltraject.get("olod_names")
            if not isinstance(olod_names, list):
                raise SeedBuildError("Each deeltraject must contain an olod_names list.")

            for olod_name in olod_names:
                if not isinstance(olod_name, str):
                    raise SeedBuildError("Each OLOD name must be a string.")
                course_code, course_name = parse_olod_name(olod_name)
                entry_id = build_entry_id(
                    programme_code,
                    course_code,
                    modeltraject.get("value") if isinstance(modeltraject, dict) else None,
                    trajectschijf_ref["value"],
                    deeltraject_ref["value"],
                )
                if entry_id in seen_ids:
                    raise SeedBuildError(f"Duplicate seed entry id generated: {entry_id}")
                seen_ids.add(entry_id)

                seed_entries.append(
                    {
                        "id": entry_id,
                        "entryType": "olod",
                        "programmeCode": programme_code,
                        "courseCode": course_code,
                        "courseName": course_name,
                        "defaultVaklector": None,
                        "defaultLecturers": [],
                        "defaultStartTime": None,
                        "defaultDurationMinutes": None,
                        "defaultAllowedResources": None,
                        "defaultMaxScore": default_max_score,
                        "active": True,
                        "sourceLastUpdated": generated_at,
                        "selectionContext": build_selection_context(
                            departement=departement if isinstance(departement, dict) else None,
                            modeltraject=modeltraject if isinstance(modeltraject, dict) else None,
                            trajectschijf=trajectschijf_ref,
                            deeltraject=deeltraject_ref,
                        ),
                        "source": {
                            "type": "studiegids",
                            "acadjaar": acadjaar,
                            "url": source_url,
                        },
                    }
                )

    return {
        "version": 1,
        "generatedAt": generated_at,
        "source": {
            "type": "studiegids",
            "acadjaar": acadjaar,
            "url": source_url,
        },
        "programmes": [
            {
                "id": f"programme-{normalize_fragment(programme_code)}",
                "code": programme_code,
                "name": programme_name,
                "active": True,
                "selectionFlow": ["modeltraject", "trajectschijf", "deeltraject"],
            }
        ],
        "seedEntries": seed_entries,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--input", required=True, type=Path, help="Raw scrape JSON file from scrape_studiegids_olods.py.")
    parser.add_argument("--output", required=True, type=Path, help="App-facing seed JSON file to write.")
    parser.add_argument(
        "--default-max-score",
        type=int,
        default=20,
        help="Default max score assigned to every generated seed entry.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        raw_data = json.loads(args.input.read_text(encoding="utf-8"))
        if not isinstance(raw_data, dict):
            raise SeedBuildError("Input JSON root must be an object.")
        seed_document = build_seed_document(raw_data, args.default_max_score)
    except OSError as exc:
        print(f"error: could not read input file: {exc}", file=sys.stderr)
        return 1
    except json.JSONDecodeError as exc:
        print(f"error: could not parse input JSON: {exc}", file=sys.stderr)
        return 1
    except SeedBuildError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    try:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(seed_document, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    except OSError as exc:
        print(f"error: could not write output file: {exc}", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())