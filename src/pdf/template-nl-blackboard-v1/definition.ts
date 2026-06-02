import type { TDocumentDefinitions } from 'pdfmake/interfaces';
import type { CourseCard } from '@/domain/types';
import { PXL_LOGO, BLACKBOARD_SCREENSHOT } from './assets';
import { colors } from './tokens';

// Formatter helpers
function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3 && parts[0].length === 4) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function formatTimeForPdf(timeStr: string): string {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length === 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    return `${hours}u${minutes}`;
  }
  return timeStr.replace(':', 'u');
}

export function formatDuration(minutes: number): string {
  if (minutes === 90) return '90 minuten (1 deel)';
  if (minutes === 80) return '1 uur 20 minuten (inclusief tijd faciliteiten)';
  if (minutes === 120) return '120 minuten (1 deel)';
  if (minutes < 60) return `${minutes} minuten (1 deel)`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) return `${hours} uur (1 deel)`;
  return `${hours} uur ${mins} minuten (1 deel)`;
}

export function renderExamCoverPdfDefinition(data: CourseCard): TDocumentDefinitions {
  const formattedDate = formatDate(data.examDate);
  const timeRange = `${formatTimeForPdf(data.startTime)} – ${formatTimeForPdf(data.endTime || '')}`;
  const lecturersText = data.lecturers.join(', ');
  const durationText = formatDuration(data.durationMinutes);

  return {
    pageSize: 'A4',
    pageOrientation: 'portrait',
    pageMargins: [36, 36, 36, 36],
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
                  { text: 'Hogeschool PXL – departement PXL-Digital', style: 'headerDept' },
                  { text: `Opleiding ${data.programmeCode}`, style: 'headerInfo' },
                  {
                    text: `Academiejaar ${data.academicYear} ${data.examChance}`,
                    style: 'headerInfo',
                  },
                ],
                border: [false, false, false, false],
              },
              {
                text: `/ ${data.maxScore}`,
                alignment: 'center',
                fontSize: 16,
                bold: true,
                margin: [0, 10, 0, 10],
                border: [true, true, true, true],
              },
            ],
          ],
        },
        margin: [0, 0, 0, 15],
      },

      // Course Title Line
      {
        text: `${data.courseCode} ${data.courseName}`,
        style: 'courseTitle',
      },

      // Student Section
      {
        table: {
          widths: [148, '*'],
          heights: [18, 24, 24, 24, 24, 18, 24],
          body: [
            [{ text: 'Student', style: 'tableLabelBold', fillColor: '#EAEAEA', colSpan: 2 }, {}],
            [{ text: 'Naam student', style: 'tableLabelBold' }, { text: '' }],
            [{ text: 'Voornaam student', style: 'tableLabelBold' }, { text: '' }],
            [{ text: 'Studentennummer', style: 'tableLabelBold' }, { text: '' }],
            [{ text: 'Klasgroep', style: 'tableLabelBold' }, { text: '' }],
            [
              { text: 'Vaklector', style: 'tableLabelBold' },
              { text: data.vaklector, style: 'tableValue', margin: [0, 4, 0, 0] },
            ],
            [
              { text: 'Examenlokaal - Plaatscode', style: 'tableLabelBold' },
              { text: data.roomPlaceCode || '', style: 'tableValue', margin: [0, 4, 0, 0] },
            ],
          ],
        },
        margin: [0, 0, 0, 15],
      },

      // Exam Data Section
      {
        table: {
          widths: [148, '*'],
          heights: [18, 18, 18, 18, 18, 18, 30],
          body: [
            [
              { text: 'Examengegevens', style: 'tableLabelBold', fillColor: '#EAEAEA', colSpan: 2 },
              {},
            ],
            [
              { text: 'Datum', style: 'tableLabelRegular' },
              { text: formattedDate, style: 'tableValue' },
            ],
            [
              { text: 'Tijdstip (aanvang - einde)', style: 'tableLabelRegular' },
              { text: timeRange, style: 'tableValue' },
            ],
            [
              { text: 'Lectoren', style: 'tableLabelRegular' },
              { text: lecturersText, style: 'tableValue' },
            ],
            [
              { text: 'Puntenverdeling', style: 'tableLabelRegular' },
              { text: '1 deel, 100%', style: 'tableValue' },
            ],
            [
              { text: 'Tijdsverdeling', style: 'tableLabelRegular' },
              { text: durationText, style: 'tableValue' },
            ],
            [
              { text: 'Toegelaten hulpmiddelen', style: 'tableLabelRegular' },
              { text: data.allowedResources, style: 'tableValue', margin: [0, 2, 0, 2] },
            ],
          ],
        },
        margin: [0, 0, 0, 15],
      },

      // Blackboard Instruction Block on Page 1
      {
        text: 'ONMIDDELLIJK NA HET VOLTOOIEN VAN ELK DEEL VUL JE HET bevestigingsnummer EN het inzendingstijdstip VAN JE BLACKBOARD EXAMEN IN OP DE VOLGENDE PAGINA.',
        style: 'instructionHeader',
      },
      {
        ul: [
          {
            text: 'Start het examen op Blackboard onmiddellijk wanneer de toezichter hier toestemming voor geeft.',
            style: 'instructionText',
          },
          { text: 'Je krijgt de toegangscode.', style: 'instructionSubText', listType: 'circle' },
          {
            text: 'Blanco afgeven? Schrijf “blanco afgegeven” bovenaan deze kopij, samen met je handtekening.',
            style: 'instructionText',
          },
          {
            text: 'Noteer op deze pagina de eerste 8 karakters van het bevestigingsnummer en het inzendingstijdstip.',
            style: 'instructionTextBold',
          },
          {
            text: 'Dit nummer en tijdstip krijg je te zien in een pop-up die verschijnt nadat je je toets hebt ingezonden - zie afbeelding hieronder.',
            style: 'instructionText',
          },
        ],
        margin: [0, 0, 0, 10],
      },

      // Warning Box
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                text: 'Bij het niet correct invullen van het bevestigingsnummer en/of het inzendingstijdstip kan je examen als ongeldig beschouwd worden.',
                color: colors.red,
                bold: true,
                fontSize: 10,
                alignment: 'center',
                margin: [0, 5, 0, 5],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 1,
          vLineWidth: () => 1,
          hLineColor: () => colors.red,
          vLineColor: () => colors.red,
          fillColor: () => '#F2DEDE',
        },
        margin: [0, 0, 0, 15],
      },

      // Confirmation Section (Left boxes, Right image)
      {
        columns: [
          {
            width: '*',
            stack: [
              { text: 'In te vullen door student', style: 'confirmTitle' },
              { text: 'BLACKBOARD EXAMEN - DEEL I', style: 'confirmSubTitle' },
              {
                text: 'Noteer hier het inzendingstijdstip en de eerste acht karakters van het bevestigingsnummer dat je ziet bij het inzenden van je toets',
                style: 'confirmNote',
              },
              { text: 'bevestigingsnummer', fontSize: 10, margin: [0, 0, 0, 4] },
              {
                table: {
                  widths: [20, 20, 20, 20, 20, 20, 20, 20],
                  heights: [22],
                  body: [['', '', '', '', '', '', '', '']],
                },
                margin: [0, 0, 0, 10],
              },
              { text: 'Inzendingstijdstip', fontSize: 10, margin: [0, 0, 0, 4] },
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
                    text: 'u',
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
            width: 170,
            image: 'blackboardScreenshot',
            margin: [10, 0, 0, 0],
            alignment: 'right',
          },
        ],
      },

      // Page 2: Blackboard procedure instructions
      { text: '', pageBreak: 'before' },
      { text: 'Je komt het examenlokaal binnen', style: 'page2Heading', margin: [0, 10, 0, 5] },
      {
        ul: [
          {
            text: 'Jassen en tassen vooraan of achteraan in het klaslokaal',
            style: 'page2ListItem',
          },
          {
            text: 'Pen, laptop+stroomadapter+verlengkabel+muis, studentenkaart, examensteekkaart, uitgeschakelde GSM omgekeerd op de bank, drinkfles op de tafel',
            style: 'page2ListItem',
          },
        ],
        type: 'circle',
        margin: [0, 0, 0, 10],
      },
      { text: 'Starten van het examen', style: 'page2Heading' },
      {
        ul: [
          {
            text: 'Ga naar de toets op Blackboard en wacht tot je de code krijgt van de toezichter',
            style: 'page2ListItem',
          },
        ],
        type: 'circle',
        margin: [0, 0, 0, 10],
      },
      { text: 'Tijdens het examen', style: 'page2Heading' },
      {
        ul: [
          { text: 'Laat het Blackboard-examen open staan', style: 'page2ListItem' },
          { text: 'Let op de tijdsduur van het examen', style: 'page2ListItem' },
        ],
        type: 'circle',
        margin: [0, 0, 0, 10],
      },
      { text: 'Als je de toets gaat inzenden en de kopij gaat afgeven', style: 'page2Heading' },
      {
        ul: [
          { text: 'Klik op Verzenden', style: 'page2ListItem' },
          {
            ul: [
              {
                text: "klikken op 'Opslaan en Afsluiten' resulteert in een ongeldig examen!",
                bold: true,
                style: 'page2ListItem',
              },
            ],
            type: 'square',
          },
          { text: 'Klik het inzendingsschermpje niet weg!', style: 'page2ListItem' },
          {
            ul: [
              {
                text: 'Schrijf de eerste 8 karakters van de inzendingscode op de examenkopij',
                style: 'page2ListItem',
              },
              { text: 'Schrijf de inzendingstijd op de examenkopij', style: 'page2ListItem' },
            ],
            type: 'square',
          },
          { text: 'Je mag nu het inzendingsschermpje sluiten', style: 'page2ListItem' },
        ],
        type: 'circle',
      },
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
        fontSize: 24,
        bold: true,
        margin: [0, 10, 0, 15],
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
        margin: [0, 10, 0, 5],
      },
      instructionText: {
        fontSize: 11,
        margin: [0, 1, 0, 1],
      },
      instructionSubText: {
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
      confirmSubTitle: {
        fontSize: 16,
        bold: true,
        margin: [0, 0, 0, 5],
      },
      confirmNote: {
        fontSize: 11,
        bold: true,
        italics: true,
        margin: [0, 0, 0, 8],
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
