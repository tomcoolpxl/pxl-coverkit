const hhmm = /^(\d{1,2}):(\d{2})$/;

// Common exam start times offered as one-click presets. The field stays free-text
// editable; 08:30 is the default.
export const START_TIME_PRESETS: readonly string[] = ['08:30', '13:30', '09:00', '13:00'];

export const DEFAULT_START_TIME = '08:30';

export interface ExamTimeRange {
  startTime: string;
  endTime: string;
  durationMinutes: number;
}

export function parseHHMM(value: string): { hours: number; minutes: number } {
  const match = hhmm.exec(value.trim());
  if (!match) throw new Error(`Ongeldig tijdformaat: ${value}`);
  const hours = Number(match[1]);
  const minutes = Number(match[2]);
  if (hours < 0 || hours > 23) throw new Error(`Ongeldig uur in tijd: ${value}`);
  if (minutes < 0 || minutes > 59) throw new Error(`Ongeldige minuut in tijd: ${value}`);
  return { hours, minutes };
}

export function formatHHMM(hours: number, minutes: number): string {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function endTime(startTime: string, durationMinutes: number): string {
  if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) {
    throw new Error('Duur moet groter zijn dan nul.');
  }
  const { hours, minutes } = parseHHMM(startTime);
  const total = hours * 60 + minutes + Math.round(durationMinutes);
  const endHours = Math.floor(total / 60) % 24;
  const endMinutes = total % 60;
  return formatHHMM(endHours, endMinutes);
}

export function examTimeRange(startTime: string, durationMinutes: number): ExamTimeRange {
  return {
    startTime,
    endTime: endTime(startTime, durationMinutes),
    durationMinutes,
  };
}
