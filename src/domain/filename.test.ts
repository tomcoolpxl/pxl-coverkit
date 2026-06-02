import { describe, it, expect } from 'vitest';
import { buildPdfFilename, slugifyCourseName } from './filename';

describe('slugifyCourseName', () => {
  it('replaces spaces and punctuation with underscores', () => {
    expect(slugifyCourseName('Automation I')).toBe('Automation_I');
    expect(slugifyCourseName('Cloud  Essentials!')).toBe('Cloud_Essentials');
  });

  it('strips diacritics', () => {
    expect(slugifyCourseName('Wéb Éssentiâls')).toBe('Web_Essentials');
  });

  it('handles empty input', () => {
    expect(slugifyCourseName('   ')).toBe('');
  });
});

describe('buildPdfFilename', () => {
  it('matches the reference pattern from REQUIREMENTS.md', () => {
    expect(
      buildPdfFilename({
        academicYear: '2025-26',
        courseCode: '42TIN2260',
        courseName: 'Automation I',
        examChance: 'S2',
      }),
    ).toBe('2526_42TIN2260_Automation_I_Examenvoorblad_S2.pdf');
  });

  it('refuses empty critical fields', () => {
    expect(() =>
      buildPdfFilename({
        academicYear: '2025-26',
        courseCode: '',
        courseName: 'Automation I',
        examChance: 'S2',
      }),
    ).toThrow();
    expect(() =>
      buildPdfFilename({
        academicYear: '2025-26',
        courseCode: '42TIN2260',
        courseName: '   ',
        examChance: 'S2',
      }),
    ).toThrow();
  });
});
