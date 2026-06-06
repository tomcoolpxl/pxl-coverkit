import { describe, expect, it, vi } from 'vitest';
import type { AcademicYear } from '@/domain/types';
import {
  DEPARTMENT_CONTROL,
  DEFAULT_OLOD_PROGRESS_ESTIMATE,
  OPLEIDING_CONTROL,
  buildSeedDocumentFromStudiegidsTree,
  extractHiddenFields,
  extractOlodNames,
  extractSelectOptions,
  scrapeProgrammesSeed,
  StudiegidsLiveError,
  studiegidsUrl,
  type StudiegidsTransport,
} from './studiegidsLive';

const MODEL_CONTROL = 'ctl00$ContentPlaceHolderPXL$ddlOpleidingstraject';
const TRAJECT_CONTROL = 'ctl00$ContentPlaceHolderPXL$ddlTrajectschijf';
const DEEL_CONTROL = 'ctl00$ContentPlaceHolderPXL$ddlDeeltraject';

function hidden() {
  return `
    <input type="hidden" name="__VIEWSTATE" value="view" />
    <input type="hidden" name="__VIEWSTATEGENERATOR" value="generator" />
    <input type="hidden" name="__EVENTVALIDATION" value="validation" />
  `;
}

function page(body: string) {
  return `<html><body><form>${hidden()}${body}</form></body></html>`;
}

function select(name: string, options: Array<[string, string]>) {
  const htmlOptions = options
    .map(([value, label]) => `<option value="${value}">${label}</option>`)
    .join('');
  return `<select name="${name}">${htmlOptions}</select>`;
}

function labelFor(controlName: string, text: string) {
  const suffix = controlName.split('$ddl', 2)[1];
  return `<span id="ctl00_ContentPlaceHolderPXL_lb${suffix}">${text}</span>`;
}

function olods(labels: string[]) {
  return labels
    .map((label, index) => `<a href="BMFUIDetailxOLOD.aspx?id=${index}">${label}</a>`)
    .join('');
}

function makeTransport(): StudiegidsTransport & { postSpy: ReturnType<typeof vi.fn> } {
  const landing = page(
    select(DEPARTMENT_CONTROL, [
      ['0', '-- Selecteer een departement --'],
      ['4', 'PXL-Digital'],
    ]),
  );
  const department = page(
    select(OPLEIDING_CONTROL, [
      ['0', '-- Selecteer een opleiding --'],
      ['PBTIN', 'Professionele bachelor in de toegepaste informatica'],
    ]),
  );
  const programme = page(
    `${labelFor(MODEL_CONTROL, 'Modeltraject')}${select(MODEL_CONTROL, [
      ['0', '-- Selecteer --'],
      ['3301', 'Toegepaste Informatica'],
    ])}`,
  );
  const model = page(
    `${labelFor(TRAJECT_CONTROL, 'Trajectschijf')}${select(TRAJECT_CONTROL, [
      ['0', '-- Selecteer --'],
      ['1', '1'],
      ['2', '2'],
    ])}`,
  );
  const traject1 = page(
    `${labelFor(DEEL_CONTROL, 'Deeltraject')}${select(DEEL_CONTROL, [
      ['0', '-- Selecteer --'],
      ['9811', '1 TIN'],
    ])}`,
  );
  const traject2 = page(olods(['42TIN2260 Automation I']));
  const deel1 = page(olods(['41TIN1230 Web Essentials', '41TIN1230 Web Essentials']));
  const postSpy = vi.fn(async (_url: string, payload: Record<string, string>) => {
    if (payload.__EVENTTARGET === DEPARTMENT_CONTROL) return department;
    if (payload.__EVENTTARGET === OPLEIDING_CONTROL) return programme;
    if (payload.__EVENTTARGET === MODEL_CONTROL) return model;
    if (payload.__EVENTTARGET === TRAJECT_CONTROL && payload[TRAJECT_CONTROL] === '1') {
      return traject1;
    }
    if (payload.__EVENTTARGET === TRAJECT_CONTROL && payload[TRAJECT_CONTROL] === '2') {
      return traject2;
    }
    if (payload.__EVENTTARGET === DEEL_CONTROL && payload[DEEL_CONTROL] === '9811') {
      return deel1;
    }
    throw new Error(`Unexpected postback ${payload.__EVENTTARGET}`);
  });
  return {
    get: vi.fn(async () => landing),
    post: postSpy,
    postSpy,
  };
}

describe('studiegids live helpers', () => {
  it('builds the dynamic studiegids URL from the selected academic year', () => {
    expect(studiegidsUrl('2024-25')).toBe('https://studiegids.pxl.be/?acadjaar=2024-25');
    expect(studiegidsUrl('2025-26')).toBe('https://studiegids.pxl.be/?acadjaar=2025-26');
    expect(studiegidsUrl('2026-27')).toBe('https://studiegids.pxl.be/?acadjaar=2026-27');
  });

  it('extracts ASP.NET hidden fields and select options', () => {
    const html = page(
      select(DEPARTMENT_CONTROL, [
        ['0', '-- Selecteer een departement --'],
        ['4', 'PXL-Digital'],
      ]),
    );
    expect(extractHiddenFields(html)).toEqual({
      __VIEWSTATE: 'view',
      __VIEWSTATEGENERATOR: 'generator',
      __EVENTVALIDATION: 'validation',
    });
    expect(extractSelectOptions(html, DEPARTMENT_CONTROL)).toEqual([
      { value: '0', label: '-- Selecteer een departement --' },
      { value: '4', label: 'PXL-Digital' },
    ]);
  });

  it('deduplicates OLOD links while preserving first-seen order', () => {
    expect(extractOlodNames(page(olods(['A Course', 'A Course', 'B Course'])))).toEqual([
      'A Course',
      'B Course',
    ]);
  });
});

describe('scrapeProgrammesSeed', () => {
  it('ports the Python crawl/build flow with dynamic postbacks and progress events', async () => {
    const transport = makeTransport();
    const progress: string[] = [];

    const seed = await scrapeProgrammesSeed('2026-27', {
      transport,
      estimatedOlods: DEFAULT_OLOD_PROGRESS_ESTIMATE,
      onProgress: (event) => progress.push(event.message),
    });

    expect(seed.academicYear).toBe('2026-27');
    expect(seed.source?.url).toBe('https://studiegids.pxl.be/?acadjaar=2026-27');
    expect(seed.programmes).toHaveLength(1);
    expect(seed.programmes[0]).toMatchObject({
      id: 'programme-4-pbtin',
      code: 'PBTIN',
      name: 'Professionele bachelor in de toegepaste informatica',
    });
    expect(seed.seedEntries.map((entry) => entry.label)).toEqual([
      '41TIN1230 Web Essentials',
      '42TIN2260 Automation I',
    ]);
    expect(seed.seedEntries[0].selectionContext?.departement.label).toBe('4 PXL-Digital');
    expect(seed.seedEntries[0].selectionContext?.deeltraject.label).toBe('9811 1 TIN');
    expect(progress.some((line) => line.includes('Opleiding 1/1'))).toBe(true);
    expect(progress.at(-1)).toContain('Seed opgebouwd');
    expect(transport.postSpy).toHaveBeenCalledWith(
      'https://studiegids.pxl.be/?acadjaar=2026-27',
      expect.objectContaining({
        __EVENTTARGET: DEEL_CONTROL,
        __VIEWSTATE: 'view',
        [DEEL_CONTROL]: '9811',
      }),
    );
  });

  it('builds a schema-valid seed document from a raw tree', async () => {
    const rawSeed = await scrapeProgrammesSeed('2024-25' as AcademicYear, {
      transport: makeTransport(),
    });

    const rebuilt = buildSeedDocumentFromStudiegidsTree({
      version: 1,
      generatedAt: '2026-06-06T00:00:00.000Z',
      acadjaar: rawSeed.academicYear,
      sourceUrl: rawSeed.source?.url ?? '',
      programmeTrees: [
        {
          department: { value: '4', label: 'PXL-Digital' },
          programme: {
            value: rawSeed.programmes[0].code,
            label: rawSeed.programmes[0].name,
          },
          selectionFlow: rawSeed.programmes[0].selectionFlow,
          branches: [
            {
              selectionPath: [],
              olodNames: ['99TIN9999 Future Course'],
            },
          ],
        },
      ],
    });

    expect(rebuilt.academicYear).toBe('2024-25');
    expect(rebuilt.seedEntries[0]).toMatchObject({
      id: 'seed-pbtin-99tin9999-future-course',
      label: '99TIN9999 Future Course',
      defaultMaxScore: 20,
    });
  });

  it('fails with a clear error when the expected PXL-Digital department is absent', async () => {
    const transport: StudiegidsTransport = {
      get: vi.fn(async () =>
        page(
          select(DEPARTMENT_CONTROL, [
            ['0', '-- Selecteer een departement --'],
            ['2', 'PXL-Business'],
          ]),
        ),
      ),
      post: vi.fn(),
    };

    await expect(scrapeProgrammesSeed('2026-27', { transport })).rejects.toThrow(
      StudiegidsLiveError,
    );
    await expect(scrapeProgrammesSeed('2026-27', { transport })).rejects.toThrow(
      'PXL-Digital werd niet gevonden',
    );
  });
});
