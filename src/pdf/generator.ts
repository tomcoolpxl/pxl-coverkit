import pdfMake from 'pdfmake/build/pdfmake';
import type { CourseCard } from '@/domain/types';
import { buildPdfFilename } from '@/domain/filename';
import { renderExamCoverPdfDefinition } from './template-nl-blackboard-v1/definition';
import vfs from 'virtual:pdfmake-vfs';

// Configure pdfmake to use our custom VFS font files
(pdfMake as any).vfs = vfs;

pdfMake.fonts = {
  Carlito: {
    normal: 'Carlito-Regular.ttf',
    bold: 'Carlito-Bold.ttf',
    italics: 'Carlito-Italic.ttf',
    bolditalics: 'Carlito-BoldItalic.ttf',
  },
};

export function downloadPdf(card: CourseCard): void {
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
  });

  pdfMake.createPdf(docDefinition).download(filename);
}
