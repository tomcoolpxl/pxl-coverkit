/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi } from 'vitest';
import { validateCourseCardData, downloadPdf } from './generator';
import type { CourseCard } from '@/domain/types';
import pdfMake from 'pdfmake/build/pdfmake';

vi.mock('pdfmake/build/pdfmake', () => {
  const mockCreatePdf = vi.fn(() => ({
    download: vi.fn(() => Promise.resolve()),
  }));
  return {
    default: {
      createPdf: mockCreatePdf,
      fonts: {},
    },
  };
});

vi.mock('virtual:pdfmake-vfs', () => {
  return {
    default: {
      'Carlito-Regular.ttf': 'mock-font',
      'Carlito-Bold.ttf': 'mock-font',
      'Carlito-Italic.ttf': 'mock-font',
      'Carlito-BoldItalic.ttf': 'mock-font',
    },
  };
});

const mockCard: CourseCard = {
  id: 'test-card',
  programmeCode: 'PBTIN',
  seedEntryId: null,
  courseCode: '42TIN2260',
  courseName: 'Automation I',
  academicYear: '2025-26',
  examChance: 'S2',
  language: 'nl',
  examDate: '2026-06-03',
  startTime: '08:30',
  durationMinutes: 90,
  endTime: '10:00',
  durationTextOverride: null,
  vaklector: 'Tom Cool',
  lecturers: ['Tom Cool'],
  roomPlaceCode: null,
  maxScore: 20,
  allowedResources: 'Geen',
  partsCount: 1,
  partIndex: 1,
  partWeights: [100],
  templateId: 'template-nl-blackboard-v1',
  createdAt: '2026-06-02T12:00:00Z',
  updatedAt: '2026-06-02T12:00:00Z',
  lastGeneratedAt: null,
  source: 'manual',
  overrides: [],
};

describe('generator.ts', () => {
  it('should validate valid card successfully', () => {
    expect(() => validateCourseCardData(mockCard)).not.toThrow();
  });

  it('should throw error on invalid card data (missing courseCode)', () => {
    const invalidCard = { ...mockCard, courseCode: '' };
    expect(() => validateCourseCardData(invalidCard)).toThrow('Vakcode is verplicht.');
  });

  it('should call pdfMake.createPdf with proper document definition and download it', async () => {
    await downloadPdf(mockCard);

    expect(pdfMake.createPdf).toHaveBeenCalled();
    const arg = (pdfMake.createPdf as any).mock.calls[0][0];
    expect(arg.pageSize).toBe('A4');
    expect(arg.defaultStyle.font).toBe('Carlito');
  });
});
