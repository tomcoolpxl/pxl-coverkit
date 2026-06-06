import { programmesSeedFileSchema } from '@/domain/schema';
import type { AcademicYear, ProgrammesSeedFile, Programme, SeedEntry } from '@/domain/types';

export const STUDIEGIDS_BASE_URL = 'https://studiegids.pxl.be/?acadjaar=';
export const DEPARTMENT_CONTROL = 'ctl00$ContentPlaceHolderPXL$ddlDepartement';
export const OPLEIDING_CONTROL = 'ctl00$ContentPlaceHolderPXL$ddlOpleiding';
const CONTROL_PREFIX = 'ctl00$ContentPlaceHolderPXL$ddl';
const DEFAULT_DEPARTMENT_LABEL = 'PXL-Digital';
const DEFAULT_MAX_SCORE = 20;
export const DEFAULT_OLOD_PROGRESS_ESTIMATE = 400;

const hiddenFieldNames = ['__VIEWSTATE', '__VIEWSTATEGENERATOR', '__EVENTVALIDATION'] as const;
const knownControlKeys: Record<string, string> = {
  [DEPARTMENT_CONTROL]: 'departement',
  [OPLEIDING_CONTROL]: 'opleiding',
  'ctl00$ContentPlaceHolderPXL$ddlOpleidingstraject': 'modeltraject',
  'ctl00$ContentPlaceHolderPXL$ddlTrajectschijf': 'trajectschijf',
  'ctl00$ContentPlaceHolderPXL$ddlDeeltraject': 'deeltraject',
};

export class StudiegidsLiveError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'StudiegidsLiveError';
  }
}

export interface StudiegidsOption {
  value: string;
  label: string;
}

interface SelectionPathStep {
  key: string;
  controlName: string;
  promptLabel: string;
  value: string;
  label: string;
}

interface RawBranch {
  selectionPath: SelectionPathStep[];
  olodNames: string[];
}

interface RawProgrammeTree {
  department: StudiegidsOption;
  programme: StudiegidsOption;
  selectionFlow: Programme['selectionFlow'];
  branches: RawBranch[];
}

interface RawStudiegidsTree {
  version: number;
  generatedAt: string;
  acadjaar: AcademicYear;
  sourceUrl: string;
  programmeTrees: RawProgrammeTree[];
}

export interface StudiegidsTransport {
  get(url: string): Promise<string>;
  post(url: string, payload: Record<string, string>): Promise<string>;
}

export interface StudiegidsProgressEvent {
  message: string;
  completedOlods: number;
  estimatedOlods: number;
  progress: number;
}

interface CrawlContext {
  acadjaar: AcademicYear;
  sourceUrl: string;
  transport: StudiegidsTransport;
  onProgress?: (event: StudiegidsProgressEvent) => void;
  completedOlods: number;
  estimatedOlods: number;
  departmentTotal: number;
  departmentIndex: number;
  programmeTotal: number;
  programmeIndex: number;
  currentProgrammeBranches: number;
}

export function studiegidsUrl(year: AcademicYear): string {
  return `${STUDIEGIDS_BASE_URL}${encodeURIComponent(year)}`;
}

export function createFetchStudiegidsTransport(): StudiegidsTransport {
  const proxyUrl = import.meta.env.VITE_STUDIEGIDS_PROXY_URL as string | undefined;
  if (proxyUrl) {
    return createProxyStudiegidsTransport(proxyUrl);
  }
  return {
    async get(url) {
      return fetchText(url);
    },
    async post(url, payload) {
      const body = new URLSearchParams(payload);
      return fetchText(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        },
        body,
      });
    },
  };
}

export function createProxyStudiegidsTransport(proxyUrl: string): StudiegidsTransport {
  return {
    async get(url) {
      return fetchProxyText(proxyUrl, {
        url,
        method: 'GET',
      });
    },
    async post(url, payload) {
      return fetchProxyText(proxyUrl, {
        url,
        method: 'POST',
        payload,
      });
    },
  };
}

interface ProxyRequest {
  url: string;
  method: 'GET' | 'POST';
  payload?: Record<string, string>;
}

async function fetchProxyText(proxyUrl: string, request: ProxyRequest): Promise<string> {
  let response: Response;
  try {
    response = await fetch(proxyUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });
  } catch (err) {
    throw new StudiegidsLiveError('Studiegids-proxy kon niet bereikt worden.', err);
  }
  if (!response.ok) {
    throw new StudiegidsLiveError(`Studiegids-proxy gaf HTTP ${response.status}.`);
  }
  const contentType = response.headers.get('Content-Type') ?? '';
  if (contentType.includes('application/json')) {
    const body = (await response.json()) as { html?: unknown; text?: unknown; error?: unknown };
    if (typeof body.error === 'string') {
      throw new StudiegidsLiveError(body.error);
    }
    const text = typeof body.html === 'string' ? body.html : body.text;
    if (typeof text === 'string') return rejectRequestRejected(text);
    throw new StudiegidsLiveError('Studiegids-proxy gaf geen HTML-tekst terug.');
  }
  return rejectRequestRejected(await response.text());
}

async function fetchText(url: string, init?: RequestInit): Promise<string> {
  let response: Response;
  try {
    response = await fetch(url, init);
  } catch (err) {
    throw new StudiegidsLiveError(
      'Live studiegids ophalen mislukte. In een statische browserdeploy kan dit door CORS geblokkeerd worden.',
      err,
    );
  }
  if (!response.ok) {
    throw new StudiegidsLiveError(`Live studiegids gaf HTTP ${response.status}.`);
  }
  return rejectRequestRejected(await response.text());
}

function rejectRequestRejected(text: string): string {
  if (/Request Rejected/i.test(text)) {
    throw new StudiegidsLiveError(
      'Live studiegids weigerde de browseraanvraag. Gebruik hiervoor een same-origin proxy of een maintainer-refresh.',
    );
  }
  return text;
}

export function normalizeSpace(value: unknown): string {
  return String(value).replace(/\u00a0/g, ' ').trim().replace(/\s+/g, ' ');
}

function parseHtml(pageHtml: string): Document {
  return new DOMParser().parseFromString(pageHtml, 'text/html');
}

export function extractHiddenFields(pageHtml: string): Record<string, string> {
  const doc = parseHtml(pageHtml);
  const fields: Record<string, string> = {};
  for (const fieldName of hiddenFieldNames) {
    const input = doc.querySelector<HTMLInputElement>(`input[name="${fieldName}"]`);
    if (!input) {
      throw new StudiegidsLiveError(
        `Verborgen veld ${fieldName} ontbreekt; de studiegids-flow is waarschijnlijk gewijzigd.`,
      );
    }
    fields[fieldName] = input.value;
  }
  return fields;
}

export function extractSelectOptions(pageHtml: string, controlName: string): StudiegidsOption[] {
  const doc = parseHtml(pageHtml);
  const select = doc.querySelector<HTMLSelectElement>(`select[name="${cssEscape(controlName)}"]`);
  if (!select) return [];
  return Array.from(select.querySelectorAll('option')).map((option) => ({
    value: option.value.trim(),
    label: normalizeSpace(option.textContent ?? ''),
  }));
}

export function extractOlodNames(pageHtml: string): string[] {
  const doc = parseHtml(pageHtml);
  const seen = new Set<string>();
  const names: string[] = [];
  for (const anchor of Array.from(doc.querySelectorAll<HTMLAnchorElement>('a[href]'))) {
    if (!anchor.href.includes('BMFUIDetailxOLOD.aspx')) continue;
    const name = normalizeSpace(anchor.textContent ?? '');
    if (!name || seen.has(name)) continue;
    seen.add(name);
    names.push(name);
  }
  return names;
}

function cssEscape(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function normalizeFragment(text: string): string {
  return normalizeSpace(text)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function buildProgrammeId(departmentValue: string, programmeCode: string): string {
  return `programme-${normalizeFragment(departmentValue)}-${normalizeFragment(programmeCode)}`;
}

function buildSeedEntryId(
  programmeCode: string,
  label: string,
  selectionPath: SelectionPathStep[],
): string {
  const parts = ['seed', normalizeFragment(programmeCode), normalizeFragment(label) || 'unknown'];
  for (const step of selectionPath) {
    parts.push(`${normalizeFragment(step.key)}-${normalizeFragment(step.value)}`);
  }
  return parts.join('-');
}

function nonPlaceholderOptions(pageHtml: string, controlName: string): StudiegidsOption[] {
  return extractSelectOptions(pageHtml, controlName).filter((option) => option.value !== '0');
}

function extractSelectControlNames(pageHtml: string): string[] {
  const doc = parseHtml(pageHtml);
  const controls: string[] = [];
  for (const select of Array.from(doc.querySelectorAll<HTMLSelectElement>('select[name]'))) {
    const name = select.name;
    if (!name.startsWith(CONTROL_PREFIX) || controls.includes(name)) continue;
    controls.push(name);
  }
  return controls;
}

function nextUnresolvedControl(pageHtml: string, state: Record<string, string>): string | null {
  for (const controlName of extractSelectControlNames(pageHtml)) {
    if (!(controlName in state) && nonPlaceholderOptions(pageHtml, controlName).length > 0) {
      return controlName;
    }
  }
  return null;
}

function controlSuffix(controlName: string): string {
  return controlName.includes('$ddl') ? controlName.split('$ddl', 2)[1] : controlName.split('$').at(-1) ?? controlName;
}

function camelToSnake(value: string): string {
  return value
    .replace(/(.)([A-Z][a-z]+)/g, '$1_$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1_$2')
    .toLowerCase();
}

function controlKey(controlName: string): string {
  return knownControlKeys[controlName] ?? camelToSnake(controlSuffix(controlName));
}

function controlPromptLabel(pageHtml: string, controlName: string): string {
  const doc = parseHtml(pageHtml);
  const suffix = controlSuffix(controlName);
  const label = doc.querySelector(`#ctl00_ContentPlaceHolderPXL_lb${cssEscape(suffix)}`);
  return label ? normalizeSpace(label.textContent ?? '') : controlKey(controlName).replace(/_/g, ' ');
}

async function postback(
  context: CrawlContext,
  pageHtml: string,
  eventTarget: string,
  state: Record<string, string>,
): Promise<string> {
  return context.transport.post(context.sourceUrl, {
    __EVENTTARGET: eventTarget,
    __EVENTARGUMENT: '',
    __LASTFOCUS: '',
    ...extractHiddenFields(pageHtml),
    ...state,
  });
}

function report(context: CrawlContext, message: string): void {
  context.onProgress?.({
    message,
    completedOlods: context.completedOlods,
    estimatedOlods: context.estimatedOlods,
    progress: Math.min(0.98, context.completedOlods / context.estimatedOlods),
  });
}

async function crawlBranches(
  context: CrawlContext,
  pageHtml: string,
  state: Record<string, string>,
  selectionPath: SelectionPathStep[],
): Promise<RawBranch[]> {
  const controlName = nextUnresolvedControl(pageHtml, state);
  if (controlName === null) {
    const olodNames = extractOlodNames(pageHtml);
    context.completedOlods += olodNames.length;
    context.currentProgrammeBranches += 1;
    report(
      context,
      `Branch ${context.currentProgrammeBranches}: ${selectionPath.map((step) => step.label).join(' > ') || 'root'} (${olodNames.length} OLOD's)`,
    );
    return [{ selectionPath, olodNames }];
  }

  const promptLabel = controlPromptLabel(pageHtml, controlName);
  const options = nonPlaceholderOptions(pageHtml, controlName);
  if (options.length === 0) {
    const olodNames = extractOlodNames(pageHtml);
    context.completedOlods += olodNames.length;
    context.currentProgrammeBranches += 1;
    report(context, `Branch ${context.currentProgrammeBranches}: ${olodNames.length} OLOD's`);
    return [{ selectionPath, olodNames }];
  }

  report(
    context,
    `${selectionPath.map((step) => step.label).join(' > ') || 'root'}: ${promptLabel} heeft ${options.length} optie(s).`,
  );

  const branches: RawBranch[] = [];
  for (const option of options) {
    const nextState = { ...state, [controlName]: option.value };
    const nextPage = await postback(context, pageHtml, controlName, nextState);
    branches.push(
      ...(await crawlBranches(context, nextPage, nextState, [
        ...selectionPath,
        {
          key: controlKey(controlName),
          controlName,
          promptLabel,
          value: option.value,
          label: option.label,
        },
      ])),
    );
  }
  return branches;
}

function buildSelectionFlow(branches: RawBranch[]): Programme['selectionFlow'] {
  const flow: NonNullable<Programme['selectionFlow']> = [];
  const seen = new Set<string>();
  for (const branch of branches) {
    for (const step of branch.selectionPath) {
      if (seen.has(step.key)) continue;
      seen.add(step.key);
      flow.push({
        key: step.key,
        label: step.promptLabel,
        controlName: step.controlName,
      });
    }
  }
  return flow;
}

export async function scrapeStudiegidsTree(
  acadjaar: AcademicYear,
  options: {
    transport?: StudiegidsTransport;
    onProgress?: (event: StudiegidsProgressEvent) => void;
    estimatedOlods?: number;
  } = {},
): Promise<RawStudiegidsTree> {
  const sourceUrl = studiegidsUrl(acadjaar);
  const context: CrawlContext = {
    acadjaar,
    sourceUrl,
    transport: options.transport ?? createFetchStudiegidsTransport(),
    onProgress: options.onProgress,
    completedOlods: 0,
    estimatedOlods: options.estimatedOlods ?? DEFAULT_OLOD_PROGRESS_ESTIMATE,
    departmentTotal: 0,
    departmentIndex: 0,
    programmeTotal: 0,
    programmeIndex: 0,
    currentProgrammeBranches: 0,
  };

  report(context, `Start live studiegids import voor ${acadjaar}.`);
  const landingPage = await context.transport.get(sourceUrl);
  const departments = nonPlaceholderOptions(landingPage, DEPARTMENT_CONTROL).filter(
    (department) => department.label === DEFAULT_DEPARTMENT_LABEL,
  );
  if (departments.length === 0) {
    throw new StudiegidsLiveError('PXL-Digital werd niet gevonden in de studiegids.');
  }

  const departmentProgrammes: Array<{
    department: StudiegidsOption;
    programmes: StudiegidsOption[];
    departmentPage: string;
  }> = [];
  for (const department of departments) {
    const departmentState = { [DEPARTMENT_CONTROL]: department.value };
    const departmentPage = await postback(context, landingPage, DEPARTMENT_CONTROL, departmentState);
    const programmes = nonPlaceholderOptions(departmentPage, OPLEIDING_CONTROL);
    departmentProgrammes.push({ department, programmes, departmentPage });
  }

  context.departmentTotal = departmentProgrammes.length;
  context.programmeTotal = departmentProgrammes.reduce(
    (total, department) => total + department.programmes.length,
    0,
  );
  report(
    context,
    `Crawl ${context.departmentTotal} departement(en), ${context.programmeTotal} opleiding(en).`,
  );

  const programmeTrees: RawProgrammeTree[] = [];
  for (const { department, programmes, departmentPage } of departmentProgrammes) {
    context.departmentIndex += 1;
    report(
      context,
      `Departement ${context.departmentIndex}/${context.departmentTotal}: ${department.label}.`,
    );
    const departmentState = { [DEPARTMENT_CONTROL]: department.value };
    for (const programme of programmes) {
      context.programmeIndex += 1;
      context.currentProgrammeBranches = 0;
      report(
        context,
        `Opleiding ${context.programmeIndex}/${context.programmeTotal}: ${programme.value} ${programme.label}.`,
      );
      const programmeState = { ...departmentState, [OPLEIDING_CONTROL]: programme.value };
      const programmePage = await postback(context, departmentPage, OPLEIDING_CONTROL, programmeState);
      const branches = await crawlBranches(context, programmePage, programmeState, []);
      programmeTrees.push({
        department,
        programme,
        selectionFlow: buildSelectionFlow(branches),
        branches,
      });
    }
  }

  report(context, `Live studiegids import afgerond: ${context.completedOlods} OLOD's gevonden.`);
  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    acadjaar,
    sourceUrl,
    programmeTrees,
  };
}

function buildProgrammes(rawDocument: RawStudiegidsTree): Programme[] {
  const seenIds = new Set<string>();
  const programmes: Programme[] = [];
  for (const tree of rawDocument.programmeTrees) {
    const programmeId = buildProgrammeId(tree.department.value, tree.programme.value);
    if (seenIds.has(programmeId)) {
      throw new StudiegidsLiveError(`Duplicate programme id generated: ${programmeId}`);
    }
    seenIds.add(programmeId);
    programmes.push({
      id: programmeId,
      code: tree.programme.value,
      name: tree.programme.label,
      active: true,
      department: {
        value: tree.department.value,
        label: tree.department.label,
      },
      selectionFlow: tree.selectionFlow,
    });
  }
  return programmes.sort((a, b) => `${a.department?.label ?? ''}\0${a.code}`.localeCompare(`${b.department?.label ?? ''}\0${b.code}`));
}

function buildSeedEntries(rawDocument: RawStudiegidsTree, defaultMaxScore: number): SeedEntry[] {
  const seenIds = new Set<string>();
  const entries: SeedEntry[] = [];
  const generatedAt = new Date().toISOString();
  for (const tree of rawDocument.programmeTrees) {
    const programmeId = buildProgrammeId(tree.department.value, tree.programme.value);
    for (const branch of tree.branches) {
      const selectionContext: NonNullable<SeedEntry['selectionContext']> = {
        departement: {
          value: tree.department.value,
          label: `${tree.department.value} ${tree.department.label}`,
        },
      };
      for (const step of branch.selectionPath) {
        selectionContext[step.key] = {
          value: step.value,
          label: `${step.value} ${step.label}`,
        };
      }
      for (const label of branch.olodNames) {
        const entryId = buildSeedEntryId(tree.programme.value, label, branch.selectionPath);
        if (seenIds.has(entryId)) {
          throw new StudiegidsLiveError(`Duplicate seed entry id generated: ${entryId}`);
        }
        seenIds.add(entryId);
        entries.push({
          id: entryId,
          programmeId,
          programmeCode: tree.programme.value,
          label: normalizeSpace(label),
          defaultVaklector: null,
          defaultLecturers: [],
          defaultStartTime: null,
          defaultDurationMinutes: null,
          defaultAllowedResources: null,
          defaultMaxScore,
          active: true,
          sourceLastUpdated: generatedAt,
          selectionContext,
          source: {
            type: 'studiegids',
            acadjaar: rawDocument.acadjaar,
            url: rawDocument.sourceUrl,
          },
        });
      }
    }
  }
  return entries.sort((a, b) => `${a.programmeCode}\0${a.label}\0${a.id}`.localeCompare(`${b.programmeCode}\0${b.label}\0${b.id}`));
}

export function buildSeedDocumentFromStudiegidsTree(
  rawDocument: RawStudiegidsTree,
  options: { defaultMaxScore?: number } = {},
): ProgrammesSeedFile {
  const document: ProgrammesSeedFile = {
    version: 2,
    generatedAt: new Date().toISOString(),
    academicYear: rawDocument.acadjaar,
    source: {
      type: 'studiegids',
      generator: 'src/data/studiegidsLive.ts',
      rawInput: 'live-studiegids',
      url: rawDocument.sourceUrl,
    },
    programmes: buildProgrammes(rawDocument),
    seedEntries: buildSeedEntries(rawDocument, options.defaultMaxScore ?? DEFAULT_MAX_SCORE),
  };
  const parsed = programmesSeedFileSchema.safeParse(document);
  if (!parsed.success) {
    throw new StudiegidsLiveError('Live seed voldoet niet aan het verwachte formaat.', parsed.error);
  }
  return parsed.data as ProgrammesSeedFile;
}

export async function scrapeProgrammesSeed(
  acadjaar: AcademicYear,
  options: {
    transport?: StudiegidsTransport;
    onProgress?: (event: StudiegidsProgressEvent) => void;
    estimatedOlods?: number;
  } = {},
): Promise<ProgrammesSeedFile> {
  const raw = await scrapeStudiegidsTree(acadjaar, options);
  const seed = buildSeedDocumentFromStudiegidsTree(raw);
  options.onProgress?.({
    message: `Seed opgebouwd: ${seed.programmes.length} opleiding(en), ${seed.seedEntries.length} OLOD(s).`,
    completedOlods: seed.seedEntries.length,
    estimatedOlods: options.estimatedOlods ?? DEFAULT_OLOD_PROGRESS_ESTIMATE,
    progress: 1,
  });
  return seed;
}
