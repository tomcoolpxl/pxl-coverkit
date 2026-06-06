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

Alle studiegidsdata is ingebakken in de applicatie als statische JSON-bestanden in `public/data/`. Er zijn altijd drie jaren mee gebundeld (vorig, huidig en volgend academiejaar volgens de 20-september-regel), plus een index `public/data/programmes.seed.index.json` die deze jaren en het huidige jaar opsomt. De app leest die index bij het opstarten en laadt het onthouden jaar (indien nog gebundeld) of anders het huidige jaar. In **Instellingen** kiest de gebruiker met **Laden** een van de gebundelde jaren.

Er is **geen** live scraping in de browser. Een statische GitHub Pages-site kan `studiegids.pxl.be` niet rechtstreeks ophalen: er is geen CORS-header, en de F5-WAF van PXL weigert proxy-IP's (`Request Rejected`). De seeds worden daarom offline gegenereerd (zie hieronder) en gecommit.

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

3. **Bundel de drie jaren in de public map**:
   Genereer en kopieer de seeds voor het vorige, huidige en volgende academiejaar naar `public/data/programmes.seed.YYYY-YY.json` (drie bestanden) en werk de index `public/data/programmes.seed.index.json` bij met diezelfde drie jaren en het huidige jaar:
   ```json
   {
     "version": 1,
     "currentYear": "2025-26",
     "years": ["2024-25", "2025-26", "2026-27"]
   }
   ```
   Laat geen rauwe scrape-dumps of extra jaren in `public/data/` achter — alleen de drie seeds en de index.

4. **Fallback-jaar (optioneel)**:
   `ACTIVE_SEED_YEAR` in `src/app/activeAcademicYear.ts` wordt alleen gebruikt als de index niet geladen kan worden. De app bepaalt het actieve jaar normaal uit de index, dus dit hoef je zelden te wijzigen:
   ```typescript
   export const ACTIVE_SEED_YEAR: AcademicYear = 'YYYY-YY';
   ```
   In **Instellingen** kiest de gebruiker een van de drie gebundelde jaren. Bestaande voorbladen blijven opgeslagen tekstwaarden.

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
