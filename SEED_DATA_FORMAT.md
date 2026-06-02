# Seed Data Format

The studiegids scrape result and the runtime seed file should not be the same artifact.

## Hard rule

- Do not combine academic years in one seed file.
- Generate one raw crawl file per academic year.
- Convert each raw crawl into one seed file for that same academic year.
- Replacing the active year later should be a file replacement, not a merge.

## Recommended split

1. Keep one raw crawl JSON snapshot per academic year.
2. Convert that raw snapshot into one app-facing seed JSON file for the same academic year.

## Why this shape fits the project

- The app only needs one active academic year at runtime.
- Programme, branch, and OLOD options can be replaced wholesale when the next year becomes active.
- The selected option text can be copied into a card as default text and later overridden locally.
- The runtime app does not need internal studiegids option IDs beyond building the seed file.

## Recommended runtime files

Suggested paths:

```text
seed-data/programmes.seed.2025-26.json
seed-data/programmes.seed.2026-27.json
```

Example top-level shape for one academic year:

```json
{
  "version": 2,
  "generatedAt": "2026-06-02T14:20:00Z",
  "academicYear": "2025-26",
  "source": {
    "type": "studiegids",
    "generator": "scripts/build_programmes_seed.py",
    "rawInput": "seed-data/raw/studiegids-tree.2025-26.json",
    "url": "https://studiegids.pxl.be/?acadjaar=2025-26"
  },
  "programmes": [
    {
      "id": "programme-4-pbtin",
      "code": "PBTIN",
      "name": "Professionele bachelor in de toegepaste informatica",
      "active": true,
      "department": {
        "value": "4",
        "label": "PXL-Digital"
      },
      "selectionFlow": [
        {
          "key": "modeltraject",
          "label": "Modeltraject",
          "controlName": "ctl00$ContentPlaceHolderPXL$ddlOpleidingstraject"
        },
        {
          "key": "trajectschijf",
          "label": "Trajectschijf",
          "controlName": "ctl00$ContentPlaceHolderPXL$ddlTrajectschijf"
        },
        {
          "key": "deeltraject",
          "label": "Deeltraject",
          "controlName": "ctl00$ContentPlaceHolderPXL$ddlDeeltraject"
        }
      ]
    }
  ],
  "seedEntries": [
    {
      "id": "seed-pbtin-43snb3180-modeltraject-3301-trajectschijf-3-deeltraject-9881",
      "programmeId": "programme-4-pbtin",
      "programmeCode": "PBTIN",
      "label": "43SNB3180 IT Project",
      "defaultVaklector": null,
      "defaultLecturers": [],
      "defaultStartTime": null,
      "defaultDurationMinutes": null,
      "defaultAllowedResources": null,
      "defaultMaxScore": 20,
      "active": true,
      "sourceLastUpdated": "2026-06-02T14:20:00Z",
      "selectionContext": {
        "departement": {
          "value": "4",
          "label": "4 PXL-Digital"
        },
        "modeltraject": {
          "value": "3301",
          "label": "3301 Toegepaste Informatica"
        },
        "trajectschijf": {
          "value": "3",
          "label": "3 3"
        },
        "deeltraject": {
          "value": "9881",
          "label": "9881 3 TIN / Systemen en netwerkbeheer"
        }
      },
      "source": {
        "type": "studiegids",
        "acadjaar": "2025-26",
        "url": "https://studiegids.pxl.be/?acadjaar=2025-26"
      }
    }
  ]
}
```

## Label rule

- Treat the final stored option text as one combined label string.
- For OLODs, that label is the visible studiegids text, for example `43SNB3180 IT Project`.
- For branch selectors, the stored label combines the internal studiegids ID and the visible text, for example `9881 3 TIN / Systemen en netwerkbeheer`.
- Cards can copy those labels as default text and later override them locally.

## Integration model in the app

The app can use one academic-year file with a simple flow:

1. Load `programmes` for the first selector.
2. Read `selectionFlow` for the chosen programme.
3. Derive available option labels from `seedEntries` by filtering on the current `selectionContext`.
4. Show the matching `label` values as the final OLOD picker.
5. Copy the chosen texts into the card as defaults.

## Current tooling

- `scripts/scrape_studiegids_tree.py` creates one raw source snapshot per academic year.
- `scripts/build_programmes_seed.py` converts one raw crawl into one year-specific runtime seed file.
