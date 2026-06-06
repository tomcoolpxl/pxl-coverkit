// Exam-chance codes used on the cover. The stored/rendered value is always the
// bare code (e.g. "S1"); the description is shown only in the dropdown to help the
// user pick. HE's meaning is currently unknown, so it has no description.
export interface ExamChanceOption {
  value: string;
  title: string;
}

export const EXAM_CHANCE_OPTIONS: ExamChanceOption[] = [
  { value: 'S1', title: 'S1 — semester 1' },
  { value: 'S2', title: 'S2 — semester 2' },
  { value: 'EK1', title: 'EK1 — examenkans 1' },
  { value: 'EK2', title: 'EK2 — examenkans 2' },
  { value: 'HE', title: 'HE' },
];

export const EXAM_CHANCE_CODES = EXAM_CHANCE_OPTIONS.map((o) => o.value);
