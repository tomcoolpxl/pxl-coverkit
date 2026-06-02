import pdfMake from 'pdfmake/build/pdfmake';
import type { CourseCard } from '@/domain/types';
import { buildPdfFilename } from '@/domain/filename';
import { renderExamCoverPdfDefinition } from './template-nl-blackboard-v1/definition';
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

export function downloadPdf(card: CourseCard): Promise<void> {
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

  return pdfMake.createPdf(docDefinition).download(filename);
}
