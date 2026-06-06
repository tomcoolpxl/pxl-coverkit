/* eslint-disable @typescript-eslint/no-explicit-any */
import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import type { CourseCard, Language } from '@/domain/types';
import { partTitleSuffix } from '@/domain/parts';
import { PXL_LOGO, BLACKBOARD_SCREENSHOT } from './assets';
import { colors } from './tokens';
import { templateStrings } from './strings';

// Formatter helpers
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function formatTimeForPdf(timeStr: string, lang: Language = 'nl'): string {
  if (!timeStr) return '';
  const sep = templateStrings[lang].timeSeparator;
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    return `${hours}${sep}${minutes}`;
  }
  return timeStr.replace(':', sep);
}

export function formatDuration(minutes: number, partsCount = 1, lang: Language = 'nl'): string {
  const s = templateStrings[lang];
  const deel = s.durationParts(partsCount);
  if (minutes === 80) {
    return `1 ${s.durationHour} 20 ${s.durationMinutes} ${s.durationFacilitiesNote}`;
  }
  if (minutes === 90 || minutes === 120) {
    return `${minutes} ${s.durationMinutes} ${deel}`;
  }
  if (minutes < 60) return `${minutes} ${s.durationMinutes} ${deel}`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const hourWord = hours === 1 ? s.durationHour : s.durationHours;
  if (mins === 0) return `${hours} ${hourWord} ${deel}`;
  return `${hours} ${hourWord} ${mins} ${s.durationMinutes} ${deel}`;
}

// "Puntenverdeling" cell text. Single-part keeps the legacy "1 deel, 100%" wording;
// multi-part lists each deel's weight and marks the deel this cover is for.
export function formatPartsBreakdown(data: CourseCard): string {
  const s = templateStrings[data.language];
  if (data.partsCount <= 1) return s.breakdownSinglePart;
  return data.partWeights
    .map(
      (w, i) =>
        `${s.breakdownPartLabel} ${i + 1}: ${w}%${i + 1 === data.partIndex ? ` (${s.breakdownThisPart})` : ''}`,
    )
    .join(' · ');
}

export function renderExamCoverPdfDefinition(data: CourseCard): TDocumentDefinitions {
  const s = templateStrings[data.language];
  const formattedDate = formatDate(data.examDate);
  const timeRange = `${formatTimeForPdf(data.startTime, data.language)} – ${formatTimeForPdf(data.endTime || '', data.language)}`;
  const lecturersText = data.lecturers.join(', ');
  const durationText = formatDuration(data.durationMinutes, data.partsCount, data.language);
  const partsBreakdown = formatPartsBreakdown(data);
  const titleSuffix = partTitleSuffix(data.partsCount, data.partIndex, data.language);

  // Build the page-2 procedure content dynamically from the string dictionary
  const page2Content: any[] = [
    { text: '', pageBreak: 'before' },
    { text: s.page2Title, style: 'page2Title', margin: [0, 0, 0, 10] },
  ];

  for (let si = 0; si < s.page2Sections.length; si++) {
    const section = s.page2Sections[si];
    // First heading gets different margin to match original layout
    const headingMargin =
      si === 0 ? [0, 0, 0, 5] : [0, 15, 0, 5];
    page2Content.push({
      text: section.heading,
      style: 'page2Heading',
      margin: headingMargin,
    });

    const listItems: any[] = [];
    for (const item of section.items) {
      if (item.sub) {
        if (item.text) {
          const li: any = {
            text: item.text,
            style: 'page2ListItem',
          };
          if (item.bold) {
            li.bold = true;
          }
          listItems.push(li);
        }
        listItems.push({
          ul: item.sub.map((subItem) => {
            const sub: any = {
              text: subItem.text,
              style: 'page2ListItem',
            };
            if (subItem.bold) {
              sub.bold = true;
            }
            return sub;
          }),
          type: 'square',
        });
      } else {
        const li: any = {
          text: item.text,
          style: 'page2ListItem',
        };
        if (item.bold) {
          li.bold = true;
        }
        listItems.push(li);
      }
    }

    page2Content.push({
      ul: listItems,
      margin: si < s.page2Sections.length - 1 ? [0, 0, 0, 10] : undefined,
    });
  }

  return {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [24, 24, 24, 24],
    defaultStyle: {
      font: 'Carlito',
      fontSize: 10,
      color: colors.black,
    },
    images: {
      pxlLogo: PXL_LOGO,
      blackboardScreenshot: BLACKBOARD_SCREENSHOT,
    },
    content: [
      // Page 1 Header
      {
        table: {
          widths: [130, '*', 60],
          body: [
            [
              {
                image: 'pxlLogo',
                width: 120,
                border: [false, false, false, false],
                margin: [0, 5, 0, 0],
              },
              {
                stack: [
                  { text: s.headerDept, style: 'headerDept' },
                  { text: `${s.programmePrefix} ${data.programmeCode}`, style: 'headerInfo' },
                  {
                    text: `${s.academicYearPrefix} ${data.academicYear} ${data.examChance}`,
                    style: 'headerInfo',
                  },
                ],
                border: [false, false, false, false],
              },
              {
                // Half-height bordered box, vertically centered in the header row.
                border: [false, false, false, false],
                margin: [0, 13, 0, 0],
                table: {
                  widths: ['*'],
                  body: [
                    [
                      {
                        text: `/ ${data.maxScore}`,
                        alignment: 'center',
                        fontSize: 16,
                        bold: true,
                      },
                    ],
                  ],
                },
                layout: {
                  hLineWidth: () => 1,
                  vLineWidth: () => 1,
                  hLineColor: () => colors.black,
                  vLineColor: () => colors.black,
                },
              },
            ],
          ],
        },
        margin: [0, 0, 0, 6],
      },

      // Course Title Line
      {
        text: `${data.courseCode} ${data.courseName}${titleSuffix}`,
        style: 'courseTitle',
      },

      // Student + Examengegevens: one continuous table. The pale-gray section
      // rows (Student / Examengegevens) mark each block, so they can butt
      // together with no gap.
      {
        table: {
          widths: [148, '*'],
          heights: [18, 21, 21, 21, 21, 21, 21, 18, 18, 18, 18, 18, 18, 30],
          body: [
            [
              { text: s.student, style: 'tableLabelBold', fillColor: colors.paleGray, colSpan: 2 },
              {},
            ],
            [{ text: s.lastName, style: 'tableLabelBold' }, { text: '' }],
            [{ text: s.firstName, style: 'tableLabelBold' }, { text: '' }],
            [{ text: s.studentNumber, style: 'tableLabelBold' }, { text: '' }],
            [{ text: s.classGroup, style: 'tableLabelBold' }, { text: '' }],
            [
              { text: s.courseLecturer, style: 'tableLabelBold' },
              { text: data.vaklector, style: 'tableValue', margin: [0, 4, 0, 0] },
            ],
            [
              { text: s.examRoomSeat, style: 'tableLabelBold' },
              { text: data.roomPlaceCode || '', style: 'tableValue', margin: [0, 4, 0, 0] },
            ],
            [
              {
                text: s.examDetails,
                style: 'tableLabelBold',
                fillColor: colors.paleGray,
                colSpan: 2,
              },
              {},
            ],
            [
              { text: s.date, style: 'tableLabelRegular' },
              { text: formattedDate, style: 'tableValue' },
            ],
            [
              { text: s.timeRange, style: 'tableLabelRegular' },
              { text: timeRange, style: 'tableValue' },
            ],
            [
              { text: s.lecturers, style: 'tableLabelRegular' },
              { text: lecturersText, style: 'tableValue' },
            ],
            [
              { text: s.gradingBreakdown, style: 'tableLabelRegular' },
              { text: partsBreakdown, style: 'tableValue' },
            ],
            [
              { text: s.timeAllocation, style: 'tableLabelRegular' },
              { text: durationText, style: 'tableValue' },
            ],
            [
              { text: s.permittedResources, style: 'tableLabelRegular' },
              { text: data.allowedResources, style: 'tableValue', margin: [0, 2, 0, 2] },
            ],
          ],
        },
        margin: [0, 0, 0, 6],
      },

      // Blackboard Instruction Block on Page 1
      {
        text: s.instructionHeader,
        style: 'instructionHeader',
      },
      {
        ul: s.instructions.map((instr) => {
          const item: any = {
            text: instr.text,
            style: instr.bold && !instr.decoration ? 'instructionTextBold' : 'instructionText',
          };
          if (instr.bold && instr.decoration) {
            item.bold = true;
          }
          if (instr.decoration) {
            item.decoration = instr.decoration;
          }
          return item;
        }),
        margin: [0, 0, 0, 8],
      },

      // Confirmation Section (Left boxes, Right image)
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: s.confirmTitle, style: 'confirmTitle', margin: [0, 0, 0, 5] },
              {
                text: s.confirmNote,
                style: 'confirmNote',
              },
              { text: s.confirmationNumber, fontSize: 10, margin: [0, 0, 0, 4] },
              {
                table: {
                  widths: [20, 20, 20, 20, 20, 20, 20, 20],
                  heights: [22],
                  body: [['', '', '', '', '', '', '', '']],
                },
                margin: [0, 0, 0, 10],
              },
              { text: s.submissionTime, fontSize: 10, margin: [0, 0, 0, 4] },
              {
                columns: [
                  {
                    width: 'auto',
                    table: {
                      widths: [20, 20],
                      heights: [22],
                      body: [['', '']],
                    },
                  },
                  {
                    width: 'auto',
                    text: s.timeSeparator,
                    fontSize: 18,
                    margin: [6, 0, 6, 0],
                  },
                  {
                    width: 'auto',
                    table: {
                      widths: [20, 20],
                      heights: [22],
                      body: [['', '']],
                    },
                  },
                ],
              },
            ],
          },
          {
            width: 150,
            image: 'blackboardScreenshot',
            margin: [10, 0, 0, 0],
            alignment: 'right',
          },
        ],
      },

      // Page 2: Procedure instructions (built dynamically from strings)
      ...page2Content,
    ],
    styles: {
      headerDept: {
        fontSize: 16,
        bold: true,
        margin: [0, 0, 0, 2],
      },
      headerInfo: {
        fontSize: 12,
        margin: [0, 0, 0, 2],
      },
      courseTitle: {
        fontSize: 20,
        bold: true,
        margin: [0, 2, 0, 2],
      },
      tableLabelBold: {
        fontSize: 11,
        bold: true,
        margin: [0, 2, 0, 2],
      },
      tableLabelRegular: {
        fontSize: 10,
        margin: [0, 2, 0, 2],
      },
      tableValue: {
        fontSize: 10,
        margin: [0, 2, 0, 2],
      },
      instructionHeader: {
        fontSize: 12,
        bold: true,
        margin: [0, 2, 0, 5],
      },
      instructionText: {
        fontSize: 11,
        margin: [0, 1, 0, 1],
      },
      instructionTextBold: {
        fontSize: 11,
        bold: true,
        margin: [0, 1, 0, 1],
      },
      confirmTitle: {
        fontSize: 12,
        bold: true,
      },
      confirmNote: {
        fontSize: 11,
        bold: true,
        italics: true,
        margin: [0, 0, 0, 8],
      },
      page2Title: {
        fontSize: 18,
        bold: true,
      },
      page2Heading: {
        fontSize: 12,
        bold: true,
        margin: [0, 15, 0, 5],
      },
      page2ListItem: {
        fontSize: 11,
        margin: [0, 1, 0, 1],
      },
    },
  };
}
