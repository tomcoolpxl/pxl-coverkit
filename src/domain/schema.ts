import { z } from 'zod';
import { CURRENT_SCHEMA_VERSION } from './types';

const academicYearRegex = /^\d{4}-\d{2}(?:\d{2})?$/;

export const academicYearSchema = z
  .string()
  .regex(academicYearRegex, 'Academiejaar moet de vorm YYYY-YY of YYYY-YYYY hebben.');

const selectionContextEntrySchema = z.object({
  value: z.string(),
  label: z.string(),
});

const selectionFlowStepSchema = z.object({
  key: z.string(),
  label: z.string(),
  controlName: z.string(),
});

export const programmeSchema = z.object({
  id: z.string(),
  code: z.string(),
  name: z.string(),
  active: z.boolean(),
  department: selectionContextEntrySchema.optional(),
  selectionFlow: z.array(selectionFlowStepSchema).optional(),
});

export const seedEntrySchema = z.object({
  id: z.string(),
  programmeId: z.string(),
  programmeCode: z.string(),
  label: z.string(),
  defaultVaklector: z.string().nullable(),
  defaultLecturers: z.array(z.string()),
  defaultStartTime: z.string().nullable(),
  defaultDurationMinutes: z.number().int().positive().nullable(),
  defaultAllowedResources: z.string().nullable(),
  defaultMaxScore: z.number(),
  active: z.boolean(),
  sourceLastUpdated: z.string().optional(),
  selectionContext: z.record(z.string(), selectionContextEntrySchema).optional(),
  source: z
    .object({
      type: z.string(),
      acadjaar: z.string(),
      url: z.string().optional(),
    })
    .optional(),
});

export const programmesSeedFileSchema = z.object({
  version: z.number().int().positive(),
  generatedAt: z.string(),
  academicYear: academicYearSchema,
  source: z
    .object({
      type: z.string(),
      generator: z.string().optional(),
      rawInput: z.string().optional(),
      url: z.string().optional(),
    })
    .optional(),
  programmes: z.array(programmeSchema),
  seedEntries: z.array(seedEntrySchema),
});

const overrideFieldKeySchema = z.enum([
  'courseCode',
  'courseName',
  'vaklector',
  'lecturers',
  'startTime',
  'durationMinutes',
  'allowedResources',
  'maxScore',
]);

export const courseCardSchema = z.object({
  id: z.string(),
  programmeCode: z.string().min(1, 'Opleiding is verplicht.'),
  seedEntryId: z.string().nullable(),
  courseCode: z.string().min(1, 'Vakcode is verplicht.'),
  courseName: z.string().min(1, 'Vaknaam is verplicht.'),
  academicYear: academicYearSchema,
  examChance: z.string().min(1, 'Examenkans is verplicht.'),
  language: z.enum(['nl', 'en']),
  examDate: z.string().min(1, 'Examendatum is verplicht.'),
  startTime: z.string().min(1, 'Starttijd is verplicht.'),
  durationMinutes: z
    .number({ message: 'Duur is verplicht.' })
    .int()
    .positive('Duur moet groter zijn dan nul.'),
  endTime: z.string().nullable(),
  durationTextOverride: z.string().nullable(),
  vaklector: z.string().nullable().optional(),
  lecturers: z.array(z.string().min(1)).min(1, 'Minstens één lector is verplicht.'),
  roomPlaceCode: z.string().nullable(),
  maxScore: z.number().positive('Maximumscore moet groter zijn dan nul.'),
  allowedResources: z.string().min(1, 'Toegestane hulpmiddelen mogen niet leeg zijn.'),
  partsCount: z.number().int().min(1).max(4),
  partIndex: z.number().int().min(1),
  partWeights: z.array(z.number()),
  templateId: z.string().min(1, 'Sjabloon is verplicht.'),
  createdAt: z.string(),
  updatedAt: z.string(),
  lastGeneratedAt: z.string().nullable(),
  source: z.enum(['manual', 'seeded']),
  overrides: z.array(overrideFieldKeySchema),
});

export const appSettingsSchema = z.object({
  defaultTemplateId: z.string(),
  defaultMaxScore: z.number().positive(),
  defaultExamChance: z.string(),
  defaultDurationMinutes: z.number().int().positive(),
  userName: z.string().default(''),
  activeSeedYear: academicYearSchema.nullable().default(null),
});

export const exportedStateSchema = z.object({
  schemaVersion: z.literal(CURRENT_SCHEMA_VERSION),
  exportedAt: z.string(),
  settings: appSettingsSchema,
  cards: z.array(courseCardSchema),
  lecturers: z.array(z.string()).optional(),
});

export type ProgrammeInput = z.infer<typeof programmeSchema>;
export type SeedEntryInput = z.infer<typeof seedEntrySchema>;
export type ProgrammesSeedFileInput = z.infer<typeof programmesSeedFileSchema>;
export type CourseCardInput = z.infer<typeof courseCardSchema>;
export type AppSettingsInput = z.infer<typeof appSettingsSchema>;
export type ExportedStateInput = z.infer<typeof exportedStateSchema>;
