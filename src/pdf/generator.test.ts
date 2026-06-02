import { describe, it, expect, vi } from 'vitest';
import { downloadPdf } from './generator';
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
  vaklector: 'Tom Cool',
  lecturers: ['Tom Cool'],
  roomPlaceCode: null,
  maxScore: 20,
  allowedResources: 'Geen',
  templateId: 'template-nl-blackboard-v1',
  createdAt: '2026-06-02T12:00:00Z',
  updatedAt: '2026-06-02T12:00:00Z',
  lastGeneratedAt: null,
  source: 'manual',
  overrides: [],
};

describe('generator.ts', () => {
  it('should call pdfMake.createPdf with proper document definition and download it', async () => {
    await downloadPdf(mockCard);

    expect(pdfMake.createPdf).toHaveBeenCalled();
    const arg = (pdfMake.createPdf as any).mock.calls[0][0];
    expect(arg.pageSize).toBe('A4');
    expect(arg.defaultStyle.font).toBe('Carlito');
  });
});
