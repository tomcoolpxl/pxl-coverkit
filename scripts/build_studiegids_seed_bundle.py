#!/usr/bin/env python3
"""Build a multi-year runtime seed bundle from raw studiegids tree crawls.

The output keeps multiple academic years in one file, marks exactly one year as
active, and adds rollover hints between consecutive years when a course can be
matched by code or title.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path


class SeedBundleError(RuntimeError):
    pass


def normalize_space(text: str) -> str:
    return " ".join(str(text).split())


def normalize_fragment(text: str) -> str:
    ascii_text = unicodedata.normalize("NFKD", normalize_space(text)).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "-", ascii_text.casefold()).strip("-")


def normalize_name_key(text: str) -> str:
    ascii_text = unicodedata.normalize("NFKD", normalize_space(text)).encode("ascii", "ignore").decode("ascii")
    return re.sub(r"[^a-z0-9]+", "", ascii_text.casefold())


def academic_year_label(acadjaar: str) -> str:
    match = re.match(r"^(\d{4})-(\d{2})$", acadjaar)
    if not match:
        return acadjaar
    start_year = int(match.group(1))
    end_year = int(f"{str(start_year)[:2]}{match.group(2)}")
    return f"{start_year}-{end_year}"


def parse_olod_name(full_name: str) -> tuple[str, str]:
    match = re.match(r"^([0-9A-Z]+)\s+(.+)$", normalize_space(full_name))
    if not match:
        raise SeedBundleError(f"Could not split OLOD code and name from {full_name!r}")
    return match.group(1), match.group(2)


def load_raw_documents(paths: list[Path]) -> list[dict[str, object]]:
    documents: list[dict[str, object]] = []
    for path in paths:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except FileNotFoundError as exc:
            raise SeedBundleError(f"Raw crawl file not found: {path}") from exc
        except json.JSONDecodeError as exc:
            raise SeedBundleError(f"Raw crawl file is not valid JSON: {path}: {exc}") from exc

        if not isinstance(data, dict):
            raise SeedBundleError(f"Raw crawl file must contain an object root: {path}")
        if not isinstance(data.get("programmeTrees"), list):
            raise SeedBundleError(f"Raw crawl file is missing programmeTrees: {path}")
        documents.append(data)

    if not documents:
        raise SeedBundleError("At least one raw crawl file is required.")
    return documents


def build_offering_id(acadjaar: str, department_value: str, programme_code: str) -> str:
    return "programme-offering-{}-{}-{}".format(
        normalize_fragment(acadjaar),
        normalize_fragment(department_value),
        normalize_fragment(programme_code),
    )


def build_entry_id(
    acadjaar: str,
    programme_code: str,
    course_code: str,
    selection_path: list[dict[str, str]],
) -> str:
    parts = [
        "seed",
        normalize_fragment(acadjaar),
        normalize_fragment(programme_code),
        normalize_fragment(course_code),
    ]
    for step in selection_path:
        parts.append(f"{normalize_fragment(step['key'])}-{normalize_fragment(step['value'])}")
    return "-".join(parts)


def branch_signature(selection_context: dict[str, dict[str, str]]) -> tuple[str, ...]:
    signature: list[str] = []
    for key, value in selection_context.items():
        if key == "departement":
            continue
        signature.append(f"{key}:{normalize_name_key(value['label'])}")
    return tuple(signature)


def build_academic_years(documents: list[dict[str, object]], active_academic_year: str) -> list[dict[str, object]]:
    years = sorted({str(document["acadjaar"]) for document in documents})
    if active_academic_year not in years:
        raise SeedBundleError(f"Active academic year {active_academic_year!r} is not present in the raw inputs.")
    return [
        {
            "id": acadjaar,
            "label": academic_year_label(acadjaar),
            "active": acadjaar == active_academic_year,
        }
        for acadjaar in years
    ]


def build_programme_offerings(
    documents: list[dict[str, object]],
    active_academic_year: str,
) -> list[dict[str, object]]:
    offerings: list[dict[str, object]] = []
    seen_ids: set[str] = set()
    for document in documents:
        acadjaar = str(document["acadjaar"])
        for tree in document["programmeTrees"]:
            department = tree["department"]
            programme = tree["programme"]
            offering_id = build_offering_id(acadjaar, department["value"], programme["value"])
            if offering_id in seen_ids:
                raise SeedBundleError(f"Duplicate programme offering id generated: {offering_id}")
            seen_ids.add(offering_id)
            offerings.append(
                {
                    "id": offering_id,
                    "academicYear": acadjaar,
                    "active": acadjaar == active_academic_year,
                    "department": {
                        "value": department["value"],
                        "label": department["label"],
                    },
                    "programmeCode": programme["value"],
                    "programmeName": programme["label"],
                    "selectionFlow": tree["selectionFlow"],
                }
            )
    offerings.sort(key=lambda item: (item["academicYear"], item["department"]["label"], item["programmeCode"]))
    return offerings


def build_seed_entries(
    documents: list[dict[str, object]],
    active_academic_year: str,
    default_max_score: int,
) -> list[dict[str, object]]:
    entries: list[dict[str, object]] = []
    seen_ids: set[str] = set()
    generated_at = datetime.now(timezone.utc).isoformat()

    for document in documents:
        acadjaar = str(document["acadjaar"])
        source_url = str(document.get("sourceUrl") or "")
        for tree in document["programmeTrees"]:
            department = tree["department"]
            programme = tree["programme"]
            offering_id = build_offering_id(acadjaar, department["value"], programme["value"])
            for branch in tree["branches"]:
                selection_context = {
                    "departement": {
                        "value": department["value"],
                        "label": department["label"],
                    }
                }
                for step in branch["selectionPath"]:
                    selection_context[step["key"]] = {
                        "value": step["value"],
                        "label": step["label"],
                    }

                for olod_name in branch["olodNames"]:
                    course_code, course_name = parse_olod_name(olod_name)
                    entry_id = build_entry_id(acadjaar, programme["value"], course_code, branch["selectionPath"])
                    if entry_id in seen_ids:
                        raise SeedBundleError(f"Duplicate seed entry id generated: {entry_id}")
                    seen_ids.add(entry_id)
                    entries.append(
                        {
                            "id": entry_id,
                            "academicYear": acadjaar,
                            "active": acadjaar == active_academic_year,
                            "programmeOfferingId": offering_id,
                            "programmeCode": programme["value"],
                            "courseCode": course_code,
                            "courseName": course_name,
                            "defaultVaklector": None,
                            "defaultLecturers": [],
                            "defaultStartTime": None,
                            "defaultDurationMinutes": None,
                            "defaultAllowedResources": None,
                            "defaultMaxScore": default_max_score,
                            "entryType": "olod",
                            "activeEntry": True,
                            "sourceLastUpdated": generated_at,
                            "selectionContext": selection_context,
                            "source": {
                                "type": "studiegids",
                                "acadjaar": acadjaar,
                                "url": source_url,
                            },
                            "rollover": {},
                        }
                    )

    entries.sort(key=lambda item: (item["academicYear"], item["programmeCode"], item["courseCode"], item["id"]))
    return entries


def match_by_code(previous_entries: list[dict[str, object]], next_entries: list[dict[str, object]]) -> tuple[list[dict[str, str]], set[str], set[str]]:
    matches: list[dict[str, str]] = []
    matched_previous: set[str] = set()
    matched_next: set[str] = set()
    next_by_code: dict[tuple[str, str], list[dict[str, object]]] = {}
    for entry in next_entries:
        next_by_code.setdefault((entry["programmeCode"], entry["courseCode"]), []).append(entry)

    for previous in previous_entries:
        key = (previous["programmeCode"], previous["courseCode"])
        candidates = [entry for entry in next_by_code.get(key, []) if entry["id"] not in matched_next]
        if not candidates:
            continue
        if len(candidates) > 1:
            same_branch = [
                entry
                for entry in candidates
                if branch_signature(entry["selectionContext"]) == branch_signature(previous["selectionContext"])
            ]
            if len(same_branch) == 1:
                candidates = same_branch
            else:
                continue
        chosen = candidates[0]
        matched_previous.add(previous["id"])
        matched_next.add(chosen["id"])
        matches.append(
            {
                "fromEntryId": previous["id"],
                "toEntryId": chosen["id"],
                "matchType": "courseCode",
            }
        )

    return matches, matched_previous, matched_next


def match_by_name(
    previous_entries: list[dict[str, object]],
    next_entries: list[dict[str, object]],
    matched_previous: set[str],
    matched_next: set[str],
) -> list[dict[str, str]]:
    matches: list[dict[str, str]] = []
    next_index: dict[tuple[str, tuple[str, ...], str], list[dict[str, object]]] = {}
    for entry in next_entries:
        if entry["id"] in matched_next:
            continue
        key = (
            entry["programmeCode"],
            branch_signature(entry["selectionContext"]),
            normalize_name_key(entry["courseName"]),
        )
        next_index.setdefault(key, []).append(entry)

    for previous in previous_entries:
        if previous["id"] in matched_previous:
            continue
        key = (
            previous["programmeCode"],
            branch_signature(previous["selectionContext"]),
            normalize_name_key(previous["courseName"]),
        )
        candidates = [entry for entry in next_index.get(key, []) if entry["id"] not in matched_next]
        if len(candidates) != 1:
            continue
        chosen = candidates[0]
        matched_previous.add(previous["id"])
        matched_next.add(chosen["id"])
        matches.append(
            {
                "fromEntryId": previous["id"],
                "toEntryId": chosen["id"],
                "matchType": "courseName",
            }
        )

    return matches


def match_by_fuzzy_name(
    previous_entries: list[dict[str, object]],
    next_entries: list[dict[str, object]],
    matched_previous: set[str],
    matched_next: set[str],
) -> list[dict[str, str]]:
    matches: list[dict[str, str]] = []
    for previous in previous_entries:
        if previous["id"] in matched_previous:
            continue

        candidates = [
            entry
            for entry in next_entries
            if entry["id"] not in matched_next
            and entry["programmeCode"] == previous["programmeCode"]
            and branch_signature(entry["selectionContext"]) == branch_signature(previous["selectionContext"])
        ]
        if not candidates:
            continue

        scored = sorted(
            (
                SequenceMatcher(
                    None,
                    normalize_name_key(previous["courseName"]),
                    normalize_name_key(candidate["courseName"]),
                ).ratio(),
                candidate,
            )
            for candidate in candidates
        )
        best_score, best_candidate = scored[-1]
        runner_up_score = scored[-2][0] if len(scored) > 1 else 0.0
        if best_score < 0.93 or best_score - runner_up_score < 0.03:
            continue

        matched_previous.add(previous["id"])
        matched_next.add(best_candidate["id"])
        matches.append(
            {
                "fromEntryId": previous["id"],
                "toEntryId": best_candidate["id"],
                "matchType": "fuzzyName",
            }
        )

    return matches


def build_transitions(
    entries: list[dict[str, object]],
    academic_years: list[dict[str, object]],
) -> list[dict[str, object]]:
    transitions: list[dict[str, object]] = []
    entry_by_id = {entry["id"]: entry for entry in entries}
    ordered_years = [year["id"] for year in academic_years]
    for from_year, to_year in zip(ordered_years, ordered_years[1:]):
        previous_entries = [entry for entry in entries if entry["academicYear"] == from_year]
        next_entries = [entry for entry in entries if entry["academicYear"] == to_year]
        code_matches, matched_previous, matched_next = match_by_code(previous_entries, next_entries)
        name_matches = match_by_name(previous_entries, next_entries, matched_previous, matched_next)
        fuzzy_matches = match_by_fuzzy_name(previous_entries, next_entries, matched_previous, matched_next)
        matches = [*code_matches, *name_matches, *fuzzy_matches]

        for match in matches:
            previous = entry_by_id[match["fromEntryId"]]
            next_entry = entry_by_id[match["toEntryId"]]
            previous["rollover"][to_year] = {
                "targetEntryId": next_entry["id"],
                "matchType": match["matchType"],
            }
            next_entry["rollover"][from_year] = {
                "sourceEntryId": previous["id"],
                "matchType": match["matchType"],
            }

        transitions.append(
            {
                "fromAcademicYear": from_year,
                "toAcademicYear": to_year,
                "matches": matches,
                "missingInTarget": sorted(
                    entry["id"] for entry in previous_entries if entry["id"] not in matched_previous
                ),
                "newInTarget": sorted(
                    entry["id"] for entry in next_entries if entry["id"] not in matched_next
                ),
            }
        )

    return transitions


def build_bundle(
    documents: list[dict[str, object]],
    *,
    active_academic_year: str,
    default_max_score: int,
) -> dict[str, object]:
    academic_years = build_academic_years(documents, active_academic_year)
    programme_offerings = build_programme_offerings(documents, active_academic_year)
    seed_entries = build_seed_entries(documents, active_academic_year, default_max_score)
    transitions = build_transitions(seed_entries, academic_years)
    return {
        "version": 2,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "activeAcademicYear": active_academic_year,
        "academicYears": academic_years,
        "programmeOfferings": programme_offerings,
        "seedEntries": seed_entries,
        "transitions": transitions,
        "source": {
            "type": "studiegids",
            "generator": "scripts/build_studiegids_seed_bundle.py",
            "rawInputs": [str(path) for path in []],
        },
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument(
        "--input",
        action="append",
        required=True,
        type=Path,
        help="Raw crawl JSON from scripts/scrape_studiegids_tree.py. Repeat for multiple academic years.",
    )
    parser.add_argument(
        "--active-academic-year",
        required=True,
        help="Academic year that should be marked active in the final seed bundle.",
    )
    parser.add_argument(
        "--default-max-score",
        type=int,
        default=20,
        help="Default max score assigned to every generated seed entry.",
    )
    parser.add_argument(
        "--output",
        required=True,
        type=Path,
        help="Final multi-year seed bundle JSON path.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        documents = load_raw_documents(args.input)
        bundle = build_bundle(
            documents,
            active_academic_year=args.active_academic_year,
            default_max_score=args.default_max_score,
        )
        bundle["source"]["rawInputs"] = [str(path) for path in args.input]
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(bundle, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    except (OSError, SeedBundleError) as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1
    return 0


if __name__ == "__main__":
    raise SystemExit(main())