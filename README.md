# PXL Cover Kit

Een browser-gebaseerde statische webapplicatie voor het genereren van het officiële Nederlandse PXL-Digital Blackboard examenvoorblad PDF.

Deze tool vervangt de handmatige workflow van het bewerken van DOCX-bestanden en het exporteren naar PDF voor elk vak en examen. Gegevens worden volledig in de browser van de gebruiker bewaard.

## Functionaliteiten

- **Snel voorbladen aanmaken**: Prefill gegevens uit de officiële PXL studiegids seed of voer handmatig een vak in.
- **Gegevens lokaal opslaan**: Alle gemaakte voorbladen worden bewaard in de lokale browseropslag (localStorage).
- **Actualiseren**: Rol bestaande voorbladen snel door naar het volgende academiejaar met een nieuwe examendatum en -tijd.
- **Offline PDF genereren**: Genereer direct in de browser een perfect opgemaakt tweepagina A4 Blackboard-examenvoorblad met een voorspelbare bestandsnaam.
- **Import/Export**: Exporteer al je opgeslagen voorbladen en docenten naar een JSON-bestand en importeer deze op een andere computer of browser.

---

## Aan de slag (Voor docenten)

De applicatie is beschikbaar als een statische website.

### Voorblad aanmaken
1. Klik op **Nieuw voorblad** op de hoofdpagina.
2. Selecteer je **Opleiding**.
3. Zoek en selecteer het vak (OLOD) uit de studiegids, of kies voor **Handmatige invoer**.
4. Controleer de vooraf ingevulde gegevens, vul de examendatum en -tijd aan, voeg eventueel extra lectoren toe en selecteer de toegestane hulpmiddelen.
5. Sla het voorblad op. Het verschijnt nu in je overzicht.

### PDF downloaden
Klik op de downloadknop op de kaart in het overzicht, in het detailscherm, of in het bewerkscherm om de PDF direct te genereren en downloaden.

### Back-up en Overdracht
Via de **Instellingen** pagina kun je al je voorbladen en docenten exporteren als back-up JSON-bestand. Dit bestand kun je op elk moment weer importeren.

---

## Ontwikkeling (Voor ontwikkelaars)

De applicatie is gebouwd met **Vue 3**, **TypeScript**, **Vite**, **Vuetify 3** en **pdfmake**.

### Systeemvereisten
- **Node.js** v22 (LTS) of hoger
- **npm** v10 of hoger

### Installatie
Clone de repository en installeer de afhankelijkheden:
```bash
npm ci
```

### Lokaal draaien
Start de Vite ontwikkelserver:
```bash
npm start
```
De applicatie is nu bereikbaar op `http://localhost:5173`.

### Tests uitvoeren
Draai de unit tests met Vitest:
```bash
npm test
```

### Typechecking en Pluizen
Controleer de TypeScript typen en code-stijl:
```bash
npm run typecheck
npm run lint
```

### Productie build
Bouw de statische bestanden voor productie:
```bash
npm run build
```
De build-output verschijnt in de `dist/` map en kan direct gehost worden op een statische webserver (zoals GitHub Pages).

---

## Beheerder & Studiegids-seed (Voor beheerders)

De standaard studiegidsdata is ingebakken in de applicatie als statisch JSON-bestand in `public/data/`. Op dit moment is alleen `public/data/programmes.seed.2025-26.json` een runtime preseed. Andere jaren worden in **Instellingen** pas live opgehaald wanneer de gebruiker expliciet op **Laden** klikt.

### Jaarlijkse Studiegids Refresh
Volg deze stappen om de studiegids-seed te vernieuwen voor een nieuw academiejaar:

1. **Scrape de studiegids**:
   Haal een JSON-snapshot op van de PXL-Digital studiegids (vervang `YYYY-YY` door het academiejaar, bijv. `2026-27`):
   ```bash
   python scripts/scrape_studiegids_tree.py --acadjaar YYYY-YY --output seed-data/raw/studiegids-tree.YYYY-YY.json
   ```
   Dit genereert een rauw snapshot in `seed-data/raw/studiegids-tree.YYYY-YY.json`.

2. **Bouw de seed**:
   Converteer de rauwe scrape naar een geoptimaliseerd seed-bestand voor de app:
   ```bash
   python scripts/build_programmes_seed.py --input seed-data/raw/studiegids-tree.YYYY-YY.json --output seed-data/programmes.seed.YYYY-YY.json
   ```
   Dit maakt `seed-data/programmes.seed.YYYY-YY.json` aan.

3. **Kopieer naar de public map**:
   Kopieer alleen de ingebouwde standaardseed naar `public/data/programmes.seed.YYYY-YY.json`. Voeg vorige/volgende jaren niet preventief toe aan `public/data/`; die worden door de app live opgehaald op aanvraag.

4. **Update de ingebouwde standaardseed in de app**:
   Open `src/app/activeAcademicYear.ts` en verander `ACTIVE_SEED_YEAR` als de standaard bij opstarten moet wijzigen:
   ```typescript
   export const ACTIVE_SEED_YEAR: AcademicYear = 'YYYY-YY';
   ```
   Dit is de fallback en standaard voor welk seed-bestand de applicatie laadt bij het opstarten. In **Instellingen** kan de gebruiker het vorige, huidige of volgende academiejaar kiezen; jaren buiten de ingebouwde standaard worden live uit `studiegids.pxl.be` opgehaald met een voortgangslog. Bestaande voorbladen blijven opgeslagen tekstwaarden.

5. **Verifieer en Commit**:
   Verifieer dat `npm test` en `npm run build` slagen, en commit rechtstreeks naar `main`:
   ```bash
   git add .
   git commit -m "seed: refresh YYYY-YY"
   git push origin main
   ```

---

## Licentie & Lettertype credit
De applicatie maakt gebruik van het **Carlito** lettertype (SIL Open Font License), dat met de applicatie is meegeleverd om te voldoen aan offline-gebruik en lay-out-conformiteit met Calibri.
