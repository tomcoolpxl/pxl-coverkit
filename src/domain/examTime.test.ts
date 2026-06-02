import { describe, it, expect } from 'vitest';
import { endTime, examTimeRange, formatHHMM, parseHHMM } from './examTime';

describe('parseHHMM', () => {
  it('parses well-formed times', () => {
    expect(parseHHMM('09:30')).toEqual({ hours: 9, minutes: 30 });
    expect(parseHHMM('23:59')).toEqual({ hours: 23, minutes: 59 });
  });

  it('rejects out-of-range', () => {
    expect(() => parseHHMM('24:00')).toThrow();
    expect(() => parseHHMM('12:60')).toThrow();
    expect(() => parseHHMM('garbage')).toThrow();
  });
});

describe('formatHHMM', () => {
  it('zero-pads', () => {
    expect(formatHHMM(9, 5)).toBe('09:05');
  });
});

describe('endTime', () => {
  it('adds duration to start', () => {
    expect(endTime('09:00', 90)).toBe('10:30');
    expect(endTime('13:30', 120)).toBe('15:30');
  });

  it('wraps past midnight', () => {
    expect(endTime('23:30', 60)).toBe('00:30');
  });

  it('rejects non-positive duration', () => {
    expect(() => endTime('09:00', 0)).toThrow();
    expect(() => endTime('09:00', -10)).toThrow();
  });
});

describe('examTimeRange', () => {
  it('returns start, end, and duration', () => {
    expect(examTimeRange('14:00', 75)).toEqual({
      startTime: '14:00',
      endTime: '15:15',
      durationMinutes: 75,
    });
  });
});
