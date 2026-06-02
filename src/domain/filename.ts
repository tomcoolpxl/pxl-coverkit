import type { AcademicYear } from './types';
import { shortAcademicYear } from './academicYear';

export interface FilenameInput {
  academicYear: AcademicYear;
  courseCode: string;
  courseName: string;
  examChance: string;
}

export function slugifyCourseName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) return '';
  return trimmed
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

export function buildPdfFilename(input: FilenameInput): string {
  const year = shortAcademicYear(input.academicYear);
  const code = input.courseCode.trim();
  const slug = slugifyCourseName(input.courseName);
  const chance = input.examChance.trim();
  if (!code) throw new Error('Vakcode is verplicht voor bestandsnaam.');
  if (!slug) throw new Error('Vaknaam is verplicht voor bestandsnaam.');
  if (!chance) throw new Error('Examenkans is verplicht voor bestandsnaam.');
  return `${year}_${code}_${slug}_Examenvoorblad_${chance}.pdf`;
}
