#!/usr/bin/env python3
"""Scrape OLOD names from the public PXL studiegids program tables.

The default selection path is:
- Departement: PXL-Digital
- Opleiding: Professionele bachelor in de toegepaste informatica
- Modeltraject: Toegepaste Informatica
- Trajectschijf: all available values
- Deeltraject: all available values per trajectschijf

Example:
  python scripts/scrape_studiegids_olods.py --acadjaar 2025-26 --output pbtin-2025-26.json
"""

from __future__ import annotations

import argparse
import html
import json
import re
import sys
from dataclasses import dataclass
from typing import Iterable

try:
    import requests
except ImportError as exc:
    raise SystemExit("This script requires the 'requests' package. Install it with: pip install requests") from exc


BASE_URL = "https://studiegids.pxl.be/?acadjaar={acadjaar}"
FORM_HEADERS = {
    "User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0 Safari/537.36",
}

DEPARTMENT_CONTROL = "ctl00$ContentPlaceHolderPXL$ddlDepartement"
OPLEIDING_CONTROL = "ctl00$ContentPlaceHolderPXL$ddlOpleiding"
MODELTRAJECT_CONTROL = "ctl00$ContentPlaceHolderPXL$ddlOpleidingstraject"
TRAJECTSCHIJF_CONTROL = "ctl00$ContentPlaceHolderPXL$ddlTrajectschijf"
DEELTRAJECT_CONTROL = "ctl00$ContentPlaceHolderPXL$ddlDeeltraject"
HIDDEN_FIELD_NAMES = (
    "__VIEWSTATE",
    "__VIEWSTATEGENERATOR",
    "__EVENTVALIDATION",
)
OLOD_LINK_PATTERN = re.compile(
    r"<a[^>]+href=\"[^\"]*BMFUIDetailxOLOD\.aspx[^\"]*\"[^>]*>(.*?)</a>",
    re.IGNORECASE | re.DOTALL,
)


class ScrapeError(RuntimeError):
    pass


@dataclass(frozen=True)
class Option:
    value: str
    label: str


def normalize_space(text: str) -> str:
    return " ".join(html.unescape(text).replace("\xa0", " ").split())


def extract_hidden_fields(page_html: str) -> dict[str, str]:
    fields: dict[str, str] = {}
    for field_name in HIDDEN_FIELD_NAMES:
        match = re.search(
            rf'<input[^>]+name="{re.escape(field_name)}"[^>]+value="([^"]*)"',
            page_html,
            re.IGNORECASE,
        )
        if not match:
            raise ScrapeError(f"Missing hidden field {field_name}; the page flow likely changed.")
        fields[field_name] = html.unescape(match.group(1))
    return fields


def extract_select_options(page_html: str, control_name: str) -> list[Option]:
    match = re.search(
        rf'<select[^>]+name="{re.escape(control_name)}"[^>]*>(.*?)</select>',
        page_html,
        re.IGNORECASE | re.DOTALL,
    )
    if not match:
        return []

    options: list[Option] = []
    for value, label in re.findall(
        r'<option(?:[^>]*?)value="([^"]*)"[^>]*>(.*?)</option>',
        match.group(1),
        re.IGNORECASE | re.DOTALL,
    ):
        options.append(Option(value=html.unescape(value).strip(), label=normalize_space(label)))
    return options


def extract_olod_names(page_html: str) -> list[str]:
    names: list[str] = []
    seen: set[str] = set()

    for raw_name in OLOD_LINK_PATTERN.findall(page_html):
        name = normalize_space(raw_name)
        if not name or name in seen:
            continue
        seen.add(name)
        names.append(name)

    return names


def available_labels(options: Iterable[Option]) -> str:
    labels = [option.label for option in options if option.value != "0"]
    return ", ".join(labels) if labels else "<none>"


def choose_option(
    options: list[Option],
    *,
    value: str | None = None,
    label: str | None = None,
    control_name: str,
) -> Option:
    filtered = [option for option in options if option.value != "0"]
    if not filtered:
        raise ScrapeError(f"No selectable options found for {control_name}.")

    if value is not None:
        for option in filtered:
            if option.value == value:
                return option

    if label is not None:
        expected = normalize_space(label).casefold()
        for option in filtered:
            if option.label.casefold() == expected:
                return option

    selector = value if value is not None else label
    raise ScrapeError(
        f"Could not find option {selector!r} for {control_name}. Available: {available_labels(filtered)}"
    )


class StudiegidsClient:
    def __init__(self, acadjaar: str):
        self.acadjaar = acadjaar
        self.url = BASE_URL.format(acadjaar=acadjaar)
        self.session = requests.Session()
        self.session.headers.update(FORM_HEADERS)

    def get(self) -> str:
        try:
            response = self.session.get(self.url, timeout=30)
            response.raise_for_status()
        except requests.RequestException as exc:
            raise ScrapeError(f"Request failed for {self.url}: {exc}") from exc
        return response.text

    def postback(self, page_html: str, event_target: str, state: dict[str, str]) -> str:
        payload = {
            "__EVENTTARGET": event_target,
            "__EVENTARGUMENT": "",
            "__LASTFOCUS": "",
            **extract_hidden_fields(page_html),
            **state,
        }
        try:
            response = self.session.post(self.url, data=payload, timeout=30)
            response.raise_for_status()
        except requests.RequestException as exc:
            raise ScrapeError(f"Postback failed for {event_target}: {exc}") from exc
        return response.text


def select_target_path(
    client: StudiegidsClient,
    *,
    department_label: str,
    department_value: str | None,
    opleiding_code: str,
    opleiding_label: str | None,
    modeltraject_label: str,
) -> tuple[str, dict[str, str], dict[str, dict[str, str]]]:
    page_html = client.get()
    state: dict[str, str] = {}

    department = choose_option(
        extract_select_options(page_html, DEPARTMENT_CONTROL),
        value=department_value,
        label=department_label,
        control_name=DEPARTMENT_CONTROL,
    )
    state[DEPARTMENT_CONTROL] = department.value
    page_html = client.postback(page_html, DEPARTMENT_CONTROL, state)

    opleiding = choose_option(
        extract_select_options(page_html, OPLEIDING_CONTROL),
        value=opleiding_code,
        label=opleiding_label,
        control_name=OPLEIDING_CONTROL,
    )
    state[OPLEIDING_CONTROL] = opleiding.value
    page_html = client.postback(page_html, OPLEIDING_CONTROL, state)

    modeltraject = choose_option(
        extract_select_options(page_html, MODELTRAJECT_CONTROL),
        label=modeltraject_label,
        control_name=MODELTRAJECT_CONTROL,
    )
    state[MODELTRAJECT_CONTROL] = modeltraject.value
    page_html = client.postback(page_html, MODELTRAJECT_CONTROL, state)

    selections = {
        "departement": {"value": department.value, "label": department.label},
        "opleiding": {"value": opleiding.value, "label": opleiding.label},
        "modeltraject": {"value": modeltraject.value, "label": modeltraject.label},
    }
    return page_html, state, selections


def scrape_trajectschijven(
    client: StudiegidsClient,
    page_html: str,
    base_state: dict[str, str],
    requested_trajectschijven: list[str],
) -> list[dict[str, object]]:
    trajectschijf_options = [
        option
        for option in extract_select_options(page_html, TRAJECTSCHIJF_CONTROL)
        if option.value != "0"
    ]
    if not trajectschijf_options:
        raise ScrapeError("No trajectschijf options were found for the selected modeltraject.")

    if requested_trajectschijven:
        selected_trajectschijven = [
            choose_option(
                trajectschijf_options,
                value=requested_value,
                label=requested_value,
                control_name=TRAJECTSCHIJF_CONTROL,
            )
            for requested_value in requested_trajectschijven
        ]
    else:
        selected_trajectschijven = trajectschijf_options

    trajectschijven: list[dict[str, object]] = []
    for trajectschijf in selected_trajectschijven:
        year_state = {**base_state, TRAJECTSCHIJF_CONTROL: trajectschijf.value}
        year_page = client.postback(page_html, TRAJECTSCHIJF_CONTROL, year_state)
        deeltraject_options = [
            option
            for option in extract_select_options(year_page, DEELTRAJECT_CONTROL)
            if option.value != "0"
        ]

        deeltrajecten: list[dict[str, object]] = []
        if deeltraject_options:
            for deeltraject in deeltraject_options:
                detail_state = {**year_state, DEELTRAJECT_CONTROL: deeltraject.value}
                detail_page = client.postback(year_page, DEELTRAJECT_CONTROL, detail_state)
                deeltrajecten.append(
                    {
                        "value": deeltraject.value,
                        "label": deeltraject.label,
                        "olod_names": extract_olod_names(detail_page),
                    }
                )
        else:
            deeltrajecten.append(
                {
                    "value": None,
                    "label": None,
                    "olod_names": extract_olod_names(year_page),
                }
            )

        trajectschijven.append(
            {
                "value": trajectschijf.value,
                "label": trajectschijf.label,
                "deeltrajecten": deeltrajecten,
            }
        )

    return trajectschijven


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--acadjaar", default="2025-26", help="Academic year query value, for example 2025-26.")
    parser.add_argument(
        "--departement",
        default="PXL-Digital",
        help="Visible department label. Ignored when --departement-value is supplied.",
    )
    parser.add_argument(
        "--departement-value",
        default=None,
        help="Raw department option value when you prefer to select by value instead of label.",
    )
    parser.add_argument(
        "--opleiding-code",
        default="PBTIN",
        help="Opleiding option value. Defaults to the code for toegepaste informatica.",
    )
    parser.add_argument(
        "--opleiding-label",
        default=None,
        help="Visible opleiding label. Only used if the code changes and you prefer label matching.",
    )
    parser.add_argument(
        "--modeltraject",
        default="Toegepaste Informatica",
        help="Visible modeltraject label to select after the opleiding step.",
    )
    parser.add_argument(
        "--trajectschijf",
        action="append",
        default=[],
        help="Repeat to limit the scrape to specific trajectschijven, for example --trajectschijf 1 --trajectschijf 3.",
    )
    parser.add_argument(
        "--output",
        default=None,
        help="Write the JSON result to a file instead of stdout.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    client = StudiegidsClient(args.acadjaar)

    try:
        page_html, base_state, selections = select_target_path(
            client,
            department_label=args.departement,
            department_value=args.departement_value,
            opleiding_code=args.opleiding_code,
            opleiding_label=args.opleiding_label,
            modeltraject_label=args.modeltraject,
        )
        result = {
            "source_url": client.url,
            "acadjaar": args.acadjaar,
            **selections,
            "trajectschijven": scrape_trajectschijven(
                client,
                page_html,
                base_state,
                requested_trajectschijven=args.trajectschijf,
            ),
        }
    except ScrapeError as error:
        print(f"error: {error}", file=sys.stderr)
        return 1

    if args.output:
        with open(args.output, "w", encoding="utf-8") as handle:
            json.dump(result, handle, indent=2, ensure_ascii=False)
            handle.write("\n")
    else:
        json.dump(result, sys.stdout, indent=2, ensure_ascii=False)
        sys.stdout.write("\n")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())