import type { Language } from '@/domain/types';

export interface TemplateStrings {
  headerDept: string;
  programmePrefix: string;
  academicYearPrefix: string;
  student: string;
  lastName: string;
  firstName: string;
  studentNumber: string;
  classGroup: string;
  courseLecturer: string;
  examRoomSeat: string;
  examDetails: string;
  date: string;
  timeRange: string;
  lecturers: string;
  gradingBreakdown: string;
  timeAllocation: string;
  permittedResources: string;
  instructionHeader: string;
  instructions: Array<{
    text: string;
    bold?: boolean;
    decoration?: string;
  }>;
  confirmTitle: string;
  confirmNote: string;
  confirmationNumber: string;
  submissionTime: string;
  timeSeparator: string;
  page2Title: string;
  page2Sections: Array<{
    heading: string;
    items: Array<{
      text: string;
      bold?: boolean;
      sub?: Array<{
        text: string;
        bold?: boolean;
      }>;
    }>;
  }>;
  // Duration & breakdown helpers
  durationParts: (count: number) => string;
  durationMinutes: string;
  durationHour: string;
  durationHours: string;
  durationFacilitiesNote: string;
  breakdownSinglePart: string;
  breakdownPartLabel: string;
  breakdownThisPart: string;
}

export const templateStrings: Record<Language, TemplateStrings> = {
  nl: {
    headerDept: 'Hogeschool PXL – departement PXL-Digital',
    programmePrefix: 'Opleiding',
    academicYearPrefix: 'Academiejaar',
    student: 'Student',
    lastName: 'Naam student',
    firstName: 'Voornaam student',
    studentNumber: 'Studentennummer',
    classGroup: 'Klasgroep',
    courseLecturer: 'Vaklector',
    examRoomSeat: 'Examenlokaal - Plaatscode',
    examDetails: 'Examengegevens',
    date: 'Datum',
    timeRange: 'Tijdstip (aanvang - einde)',
    lecturers: 'Lectoren',
    gradingBreakdown: 'Puntenverdeling',
    timeAllocation: 'Tijdsverdeling',
    permittedResources: 'Toegelaten hulpmiddelen',
    instructionHeader:
      'ONMIDDELLIJK NA HET VOLTOOIEN VAN ELK DEEL VUL JE HET bevestigingsnummer EN het inzendingstijdstip VAN JE BLACKBOARD EXAMEN IN OP DE VOLGENDE PAGINA.',
    instructions: [
      {
        text: 'Start het examen op Blackboard onmiddellijk wanneer de toezichter hier toestemming voor geeft.',
      },
      { text: 'Je krijgt de toegangscode.' },
      {
        text: 'Blanco afgeven? Schrijf “blanco afgegeven” bovenaan deze kopij, samen met je handtekening.',
      },
      {
        text: 'Noteer op deze pagina de eerste 8 karakters van het bevestigingsnummer en het inzendingstijdstip.',
        bold: true,
      },
      {
        text: 'Dit nummer en tijdstip krijg je te zien in een pop-up die verschijnt nadat je je toets hebt ingezonden.',
      },
      {
        text: 'Bij het niet correct invullen van het bevestigingsnummer en/of het inzendingstijdstip kan je examen als ongeldig beschouwd worden.',
        bold: true,
        decoration: 'underline',
      },
    ],
    confirmTitle: 'In te vullen door student',
    confirmNote:
      'Noteer hier het inzendingstijdstip en de eerste acht karakters van het bevestigingsnummer dat je ziet bij het inzenden van je toets',
    confirmationNumber: 'bevestigingsnummer',
    submissionTime: 'Inzendingstijdstip',
    timeSeparator: 'u',
    page2Title: 'Examenprocedures',
    page2Sections: [
      {
        heading: 'Je komt het examenlokaal binnen',
        items: [
          {
            text: 'Jassen, handtassen en boekentassen achteraan groeperen; als het lokaal zich hier niet toe leent, vooraan groeperen',
          },
          {
            text: 'Pen, laptop + stroomadapter + verlengkabel + muis, studentenkaart, examensteekkaart, drinkfles op de tafel',
          },
          {
            text: 'Telefoons EN smartwatches UITschakelen en omgekeerd op de hoek van de tafel leggen.',
          },
        ],
      },
      {
        heading: 'Voor de aanvang van het examen',
        items: [{ text: 'Laatste gelegenheid voor toiletbezoek.' }],
      },
      {
        heading: 'Starten van het examen',
        items: [
          {
            text: 'Surf naar de toets op Blackboard en wacht tot je de code krijgt van de toezichter',
          },
        ],
      },
      {
        heading: 'Tijdens het examen',
        items: [
          { text: 'Laat het Blackboard-examen open staan' },
          { text: 'Let op de tijdsduur van het examen' },
        ],
      },
      {
        heading: 'Als je de toets gaat inzenden en de kopij gaat afgeven',
        items: [
          { text: 'TE LAAT INDIENEN = ONGELDIG EXAMEN', bold: true },
          {
            text: 'Klik op Verzenden',
            sub: [
              {
                text: "klikken op 'Opslaan en Afsluiten' resulteert in een ongeldig examen!",
                bold: true,
              },
            ],
          },
          {
            text: 'Klik het inzendingsschermpje niet weg!',
            sub: [
              {
                text: 'Schrijf de eerste 8 karakters van de inzendingscode op de examenkopij',
              },
              { text: 'Schrijf de inzendingstijd op de examenkopij' },
            ],
          },
          { text: 'Je mag nu het inzendingsschermpje sluiten' },
        ],
      },
    ],
    durationParts: (count: number) =>
      count === 1 ? '(1 deel)' : `(${count} delen)`,
    durationMinutes: 'minuten',
    durationHour: 'uur',
    durationHours: 'uur',
    durationFacilitiesNote: '(inclusief tijd faciliteiten)',
    breakdownSinglePart: '1 deel, 100%',
    breakdownPartLabel: 'Deel',
    breakdownThisPart: 'dit deel',
  },
  en: {
    headerDept:
      'PXL University of Applied Sciences and Arts – PXL-Digital department',
    programmePrefix: 'Programme',
    academicYearPrefix: 'Academic year',
    student: 'Student',
    lastName: 'Last Name',
    firstName: 'First Name',
    studentNumber: 'Student Number',
    classGroup: 'Class Group',
    courseLecturer: 'Course Lecturer',
    examRoomSeat: 'Examination Room - Seat Code',
    examDetails: 'Examination Details',
    date: 'Date',
    timeRange: 'Time (start - end)',
    lecturers: 'Lecturers',
    gradingBreakdown: 'Grading Breakdown',
    timeAllocation: 'Time Allocation',
    permittedResources: 'Permitted Resources',
    instructionHeader:
      'IMMEDIATELY AFTER COMPLETING EACH PART, FILL IN THE confirmation number AND the submission time OF YOUR BLACKBOARD EXAM ON THE NEXT PAGE.',
    instructions: [
      {
        text: 'Start the exam on Blackboard immediately when the invigilator gives permission to do so.',
      },
      { text: 'You will be given the access code.' },
      {
        text: 'Submitting blank? Write "submitted blank" at the top of this exam paper, together with your signature.',
      },
      {
        text: 'On this page, note the first 8 characters of the confirmation number and the submission time.',
        bold: true,
      },
      {
        text: 'This number and time are shown in a pop-up that appears after you submit your exam.',
      },
      {
        text: 'If the confirmation number and/or the submission time are not filled in correctly, your exam may be considered invalid.',
        bold: true,
        decoration: 'underline',
      },
    ],
    confirmTitle: 'To be completed by the student',
    confirmNote:
      'Note here the submission time and the first eight characters of the confirmation number shown when you submit your exam',
    confirmationNumber: 'confirmation number',
    submissionTime: 'Submission time',
    timeSeparator: 'h',
    page2Title: 'Exam procedures',
    page2Sections: [
      {
        heading: 'When you enter the examination room',
        items: [
          {
            text: 'Group coats, handbags and book bags at the back; if the room does not allow this, group them at the front',
          },
          {
            text: 'Pen, laptop + power adapter + extension cable + mouse, student card, exam card, water bottle on the desk',
          },
          {
            text: 'Switch OFF phones AND smartwatches and place them face-down on the corner of the desk.',
          },
        ],
      },
      {
        heading: 'Before the start of the exam',
        items: [{ text: 'Last opportunity to use the toilet.' }],
      },
      {
        heading: 'Starting the exam',
        items: [
          {
            text: 'Go to the exam on Blackboard and wait until you receive the code from the invigilator',
          },
        ],
      },
      {
        heading: 'During the exam',
        items: [
          { text: 'Keep the Blackboard exam open' },
          { text: 'Keep an eye on the exam duration' },
        ],
      },
      {
        heading: 'When you submit the exam and hand in your exam paper',
        items: [
          { text: 'SUBMITTING TOO LATE = INVALID EXAM', bold: true },
          {
            text: 'Click Submit',
            sub: [
              {
                text: "clicking 'Save and Close' results in an invalid exam!",
                bold: true,
              },
            ],
          },
          {
            text: 'Do not close the submission confirmation screen!',
            sub: [
              {
                text: 'Write the first 8 characters of the confirmation number on the exam paper',
              },
              { text: 'Write the submission time on the exam paper' },
            ],
          },
          {
            text: 'You may now close the submission confirmation screen',
          },
        ],
      },
    ],
    durationParts: (count: number) =>
      count === 1 ? '(1 part)' : `(${count} parts)`,
    durationMinutes: 'minutes',
    durationHour: 'hour',
    durationHours: 'hours',
    durationFacilitiesNote: '(including facilities time)',
    breakdownSinglePart: '1 part, 100%',
    breakdownPartLabel: 'Part',
    breakdownThisPart: 'this part',
  },
};
