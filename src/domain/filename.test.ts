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
        language: 'nl',
      }),
    ).toBe('2526_42TIN2260_Automation_I_Examenvoorblad_S2.pdf');
  });

  it('appends _EN for English cards', () => {
    expect(
      buildPdfFilename({
        academicYear: '2025-26',
        courseCode: '42TIN2260',
        courseName: 'Automation I',
        examChance: 'S1',
        language: 'en',
      }),
    ).toBe('2526_42TIN2260_Automation_I_Examenvoorblad_S1_EN.pdf');
  });

  it('has no suffix for Dutch cards', () => {
    const nlFilename = buildPdfFilename({
      academicYear: '2025-26',
      courseCode: '42TIN2260',
      courseName: 'Automation I',
      examChance: 'S1',
      language: 'nl',
    });
    expect(nlFilename).not.toContain('_EN');
    expect(nlFilename).toBe('2526_42TIN2260_Automation_I_Examenvoorblad_S1.pdf');
  });

  it('refuses empty critical fields', () => {
    expect(() =>
      buildPdfFilename({
        academicYear: '2025-26',
        courseCode: '',
        courseName: 'Automation I',
        examChance: 'S2',
        language: 'nl',
      }),
    ).toThrow();
    expect(() =>
      buildPdfFilename({
        academicYear: '2025-26',
        courseCode: '42TIN2260',
        courseName: '   ',
        examChance: 'S2',
        language: 'nl',
      }),
    ).toThrow();
  });
});
