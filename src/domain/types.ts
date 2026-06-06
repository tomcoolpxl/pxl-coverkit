export type Language = 'nl' | 'en';

export type CardSource = 'manual' | 'seeded';

export type AcademicYear = `${number}-${number}`;

export interface SelectionContextEntry {
  value: string;
  label: string;
}

export interface SelectionFlowStep {
  key: string;
  label: string;
  controlName: string;
}

export interface Programme {
  id: string;
  code: string;
  name: string;
  active: boolean;
  department?: SelectionContextEntry;
  selectionFlow?: SelectionFlowStep[];
}

export interface SeedEntry {
  id: string;
  programmeId: string;
  programmeCode: string;
  label: string;
  defaultVaklector: string | null;
  defaultLecturers: string[];
  defaultStartTime: string | null;
  defaultDurationMinutes: number | null;
  defaultAllowedResources: string | null;
  defaultMaxScore: number;
  active: boolean;
  sourceLastUpdated?: string;
  selectionContext?: Record<string, SelectionContextEntry>;
  source?: { type: string; acadjaar: string; url?: string };
}

export interface ProgrammesSeedFile {
  version: number;
  generatedAt: string;
  academicYear: AcademicYear;
  source?: {
    type: string;
    generator?: string;
    rawInput?: string;
    url?: string;
  };
  programmes: Programme[];
  seedEntries: SeedEntry[];
}

export type OverrideFieldKey =
  | 'courseCode'
  | 'courseName'
  | 'vaklector'
  | 'lecturers'
  | 'startTime'
  | 'durationMinutes'
  | 'allowedResources'
  | 'maxScore';

export interface CourseCard {
  id: string;
  programmeCode: string;
  seedEntryId: string | null;
  courseCode: string;
  courseName: string;
  academicYear: AcademicYear;
  examChance: string;
  language: Language;
  examDate: string;
  startTime: string;
  durationMinutes: number;
  endTime: string | null;
  durationTextOverride: string | null;
  vaklector: string;
  lecturers: string[];
  roomPlaceCode: string | null;
  maxScore: number;
  allowedResources: string;
  partsCount: number;
  partIndex: number;
  partWeights: number[];
  templateId: string;
  createdAt: string;
  updatedAt: string;
  lastGeneratedAt: string | null;
  source: CardSource;
  overrides: OverrideFieldKey[];
}

export interface AppSettings {
  defaultTemplateId: string;
  defaultMaxScore: number;
  defaultExamChance: string;
  defaultDurationMinutes: number;
  userName: string;
}

export interface ExportedState {
  schemaVersion: number;
  exportedAt: string;
  settings: AppSettings;
  cards: CourseCard[];
  lecturers?: string[];
}

export const CURRENT_SCHEMA_VERSION = 1;
