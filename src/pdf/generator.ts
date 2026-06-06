/* eslint-disable @typescript-eslint/no-explicit-any */
import pdfMake from 'pdfmake/build/pdfmake';
import type { CourseCard } from '@/domain/types';
import { courseCardSchema } from '@/domain/schema';
import { buildPdfFilename } from '@/domain/filename';
import { renderExamCoverPdfDefinition } from './template-nl-blackboard-v1/definition';
import { PXL_LOGO, BLACKBOARD_SCREENSHOT } from './template-nl-blackboard-v1/assets';
import vfs from 'virtual:pdfmake-vfs';

// Configure pdfmake to use our custom VFS font files
(pdfMake as any).vfs = vfs;
if (typeof (pdfMake as any).addVirtualFileSystem === 'function') {
  (pdfMake as any).addVirtualFileSystem(vfs);
}

const fontConfig = {
  Carlito: {
    normal: 'Carlito-Regular.ttf',
    bold: 'Carlito-Bold.ttf',
    italics: 'Carlito-Italic.ttf',
    bolditalics: 'Carlito-BoldItalic.ttf',
  },
};

pdfMake.fonts = fontConfig;
if (typeof (pdfMake as any).setFonts === 'function') {
  (pdfMake as any).setFonts(fontConfig);
}

export function validateCourseCardData(card: CourseCard): void {
  // Validate card data fields using zod
  const parseResult = courseCardSchema.safeParse(card);
  if (!parseResult.success) {
    const firstError = parseResult.error.errors[0]?.message || 'Ongeldige kaartgegevens.';
    throw new Error(firstError);
  }

  // Validate required static assets (fonts and images)
  const requiredFonts = [
    'Carlito-Regular.ttf',
    'Carlito-Bold.ttf',
    'Carlito-Italic.ttf',
    'Carlito-BoldItalic.ttf',
  ];
  for (const font of requiredFonts) {
    if (!vfs || !vfs[font]) {
      throw new Error(`Vereist lettertypebestand "${font}" ontbreekt in de VFS.`);
    }
  }

  if (!PXL_LOGO || !PXL_LOGO.startsWith('data:image/')) {
    throw new Error('Vereist logo PXL_LOGO ontbreekt of is ongeldig.');
  }

  if (!BLACKBOARD_SCREENSHOT || !BLACKBOARD_SCREENSHOT.startsWith('data:image/')) {
    throw new Error('Vereist Blackboard screenshot ontbreekt of is ongeldig.');
  }
}

export function downloadPdf(card: CourseCard): Promise<void> {
  validateCourseCardData(card);

  const docDefinition = renderExamCoverPdfDefinition(card);

  // Set default font to Carlito
  docDefinition.defaultStyle = {
    font: 'Carlito',
    fontSize: 10,
    ...docDefinition.defaultStyle,
  };

  const filename = buildPdfFilename({
    academicYear: card.academicYear,
    courseCode: card.courseCode,
    courseName: card.courseName,
    examChance: card.examChance,
    language: card.language,
  });

  return pdfMake.createPdf(docDefinition).download(filename);
}
