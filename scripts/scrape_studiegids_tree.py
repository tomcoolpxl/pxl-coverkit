#!/usr/bin/env python3
"""Scrape the full public studiegids programme tree for one academic year.

The output is a raw source snapshot. It preserves the department, programme,
all discovered selector steps below the programme, and the final OLOD names for
every reachable branch.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

from scrape_studiegids_olods import (
    DEPARTMENT_CONTROL,
    OPLEIDING_CONTROL,
    StudiegidsClient,
    extract_olod_names,
    extract_select_options,
    normalize_space,
)


CONTROL_PREFIX = "ctl00$ContentPlaceHolderPXL$ddl"
KNOWN_CONTROL_KEYS = {
    DEPARTMENT_CONTROL: "departement",
    OPLEIDING_CONTROL: "opleiding",
    "ctl00$ContentPlaceHolderPXL$ddlOpleidingstraject": "modeltraject",
    "ctl00$ContentPlaceHolderPXL$ddlTrajectschijf": "trajectschijf",
    "ctl00$ContentPlaceHolderPXL$ddlDeeltraject": "deeltraject",
}


class CrawlError(RuntimeError):
    pass


def camel_to_snake(value: str) -> str:
    value = re.sub(r"(.)([A-Z][a-z]+)", r"\1_\2", value)
    value = re.sub(r"([a-z0-9])([A-Z])", r"\1_\2", value)
    return value.casefold()


def control_suffix(control_name: str) -> str:
    if "$ddl" not in control_name:
        return control_name.rsplit("$", 1)[-1]
    return control_name.split("$ddl", 1)[1]


def control_key(control_name: str) -> str:
    if control_name in KNOWN_CONTROL_KEYS:
        return KNOWN_CONTROL_KEYS[control_name]
    return camel_to_snake(control_suffix(control_name))


def control_prompt_label(page_html: str, control_name: str) -> str:
    suffix = control_suffix(control_name)
    span_id = f"ctl00_ContentPlaceHolderPXL_lb{suffix}"
    match = re.search(
        rf'<span[^>]+id="{re.escape(span_id)}"[^>]*>(.*?)</span>',
        page_html,
        re.IGNORECASE | re.DOTALL,
    )
    if match:
        return normalize_space(match.group(1))
    return control_key(control_name).replace("_", " ").title()


def extract_select_control_names(page_html: str) -> list[str]:
    control_names: list[str] = []
    for control_name in re.findall(r'<select[^>]+name="([^"]+)"', page_html, re.IGNORECASE):
        if not control_name.startswith(CONTROL_PREFIX):
            continue
        if control_name not in control_names:
            control_names.append(control_name)
    return control_names


def non_placeholder_options(page_html: str, control_name: str) -> list[dict[str, str]]:
    options = []
    for option in extract_select_options(page_html, control_name):
        if option.value == "0":
            continue
        options.append({"value": option.value, "label": option.label})
    return options


def next_unresolved_control(page_html: str, state: dict[str, str]) -> str | None:
    for control_name in extract_select_control_names(page_html):
        if control_name not in state and non_placeholder_options(page_html, control_name):
            return control_name
    return None


def build_selection_flow(branches: list[dict[str, object]]) -> list[dict[str, str]]:
    flow: list[dict[str, str]] = []
    seen: set[str] = set()
    for branch in branches:
        for step in branch["selectionPath"]:
            key = step["key"]
            if key in seen:
                continue
            seen.add(key)
            flow.append(
                {
                    "key": key,
                    "label": step["promptLabel"],
                    "controlName": step["controlName"],
                }
            )
    return flow


def crawl_branches(
    client: StudiegidsClient,
    page_html: str,
    state: dict[str, str],
    selection_path: list[dict[str, str]],
) -> list[dict[str, object]]:
    control_name = next_unresolved_control(page_html, state)
    if control_name is None:
        return [
            {
                "selectionPath": selection_path,
                "olodNames": extract_olod_names(page_html),
            }
        ]

    prompt_label = control_prompt_label(page_html, control_name)
    branches: list[dict[str, object]] = []
    options = non_placeholder_options(page_html, control_name)
    if not options:
        return [
            {
                "selectionPath": selection_path,
                "olodNames": extract_olod_names(page_html),
            }
        ]

    for option in options:
        next_state = {**state, control_name: option["value"]}
        next_page = client.postback(page_html, control_name, next_state)
        next_path = selection_path + [
            {
                "key": control_key(control_name),
                "controlName": control_name,
                "promptLabel": prompt_label,
                "value": option["value"],
                "label": option["label"],
            }
        ]
        branches.extend(crawl_branches(client, next_page, next_state, next_path))
    return branches


def filter_options(
    options: list[dict[str, str]],
    *,
    wanted_values: set[str],
    wanted_labels: set[str],
) -> list[dict[str, str]]:
    if not wanted_values and not wanted_labels:
        return options
    filtered: list[dict[str, str]] = []
    for option in options:
        if option["value"] in wanted_values or option["label"] in wanted_labels:
            filtered.append(option)
    return filtered


def scrape_tree(
    *,
    acadjaar: str,
    department_values: set[str],
    department_labels: set[str],
    programme_codes: set[str],
    programme_labels: set[str],
) -> dict[str, object]:
    client = StudiegidsClient(acadjaar)
    landing_page = client.get()
    departments = filter_options(
        non_placeholder_options(landing_page, DEPARTMENT_CONTROL),
        wanted_values=department_values,
        wanted_labels=department_labels,
    )
    if not departments:
        raise CrawlError("No matching departments were found.")

    programme_trees: list[dict[str, object]] = []
    for department in departments:
        department_state = {DEPARTMENT_CONTROL: department["value"]}
        department_page = client.postback(landing_page, DEPARTMENT_CONTROL, department_state)
        programmes = filter_options(
            non_placeholder_options(department_page, OPLEIDING_CONTROL),
            wanted_values=programme_codes,
            wanted_labels=programme_labels,
        )
        for programme in programmes:
            programme_state = {**department_state, OPLEIDING_CONTROL: programme["value"]}
            programme_page = client.postback(department_page, OPLEIDING_CONTROL, programme_state)
            branches = crawl_branches(client, programme_page, programme_state, [])
            programme_trees.append(
                {
                    "department": department,
                    "programme": programme,
                    "selectionFlow": build_selection_flow(branches),
                    "branches": branches,
                }
            )

    return {
        "version": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "acadjaar": acadjaar,
        "sourceUrl": client.url,
        "programmeTrees": programme_trees,
    }


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--acadjaar", required=True, help="Academic year, for example 2025-26.")
    parser.add_argument(
        "--departement-value",
        action="append",
        default=[],
        help="Limit the scrape to one or more raw department option values.",
    )
    parser.add_argument(
        "--departement-label",
        action="append",
        default=[],
        help="Limit the scrape to one or more visible department labels.",
    )
    parser.add_argument(
        "--opleiding-code",
        action="append",
        default=[],
        help="Limit the scrape to one or more raw opleiding codes.",
    )
    parser.add_argument(
        "--opleiding-label",
        action="append",
        default=[],
        help="Limit the scrape to one or more visible opleiding labels.",
    )
    parser.add_argument("--output", type=Path, help="Optional JSON output path. Defaults to stdout.")
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    try:
        result = scrape_tree(
            acadjaar=args.acadjaar,
            department_values=set(args.departement_value),
            department_labels=set(args.departement_label),
            programme_codes=set(args.opleiding_code),
            programme_labels=set(args.opleiding_label),
        )
    except CrawlError as exc:
        print(f"error: {exc}", file=sys.stderr)
        return 1

    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    else:
        json.dump(result, sys.stdout, ensure_ascii=False, indent=2)
        sys.stdout.write("\n")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())