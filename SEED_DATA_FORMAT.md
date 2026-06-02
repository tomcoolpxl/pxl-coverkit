# Seed Data Format

The studiegids scrape result and the runtime seed file should not be the same artifact.

## Recommended split

1. Keep the raw scrape JSON as a source snapshot.
2. Convert that raw snapshot into one app-facing seed JSON file.

This avoids coupling the frontend to the ASP.NET scrape shape and gives the app a stable format for bundled defaults.

## Why this shape fits the project

- The requirements already model a `Programme` plus flat `Programme seed entry` records.
- The card-creation flow starts with programme selection, then narrows to a seeded entry.
- `modeltraject`, `trajectschijf`, and `deeltraject` are selection filters, not part of the visible course title itself.
- The app can store only `seedEntryId` on a card and keep local overrides separate.
- Future programmes can omit selection steps they do not use.

## Recommended runtime file

Suggested runtime path:

```text
public/data/programmes.seed.json
```

Suggested top-level shape:

```json
{
  "version": 1,
  "generatedAt": "2026-06-02T14:20:00Z",
  "source": {
    "type": "studiegids",
    "acadjaar": "2025-26",
    "url": "https://studiegids.pxl.be/?acadjaar=2025-26"
  },
  "programmes": [
    {
      "id": "programme-pbtin",
      "code": "PBTIN",
      "name": "Professionele bachelor in de toegepaste informatica",
      "active": true,
      "selectionFlow": ["modeltraject", "trajectschijf", "deeltraject"]
    }
  ],
  "seedEntries": [
    {
      "id": "seed-pbtin-43snb3180-m3301-t3-d9881",
      "entryType": "olod",
      "programmeCode": "PBTIN",
      "courseCode": "43SNB3180",
      "courseName": "IT Project",
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
          "label": "PXL-Digital"
        },
        "modeltraject": {
          "value": "3301",
          "label": "Toegepaste Informatica"
        },
        "trajectschijf": {
          "value": "3",
          "label": "3"
        },
        "deeltraject": {
          "value": "9881",
          "label": "3 TIN / Systemen en netwerkbeheer"
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

## Integration model in the app

The app can use this format with a simple flow:

1. Load `programmes` for the first selector.
2. Read `selectionFlow` for the chosen programme.
3. Derive available selector values from `seedEntries` by filtering on the current `selectionContext`.
4. Show the matching `seedEntries` as the final course or OLOD picker.
5. Copy the chosen entry into a local card and save its `seedEntryId`.

## Current tooling

- `scripts/scrape_studiegids_olods.py` creates the raw source snapshot.
- `scripts/build_programmes_seed.py` converts raw scrape output into the runtime seed format above.
