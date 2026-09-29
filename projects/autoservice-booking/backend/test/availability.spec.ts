import { intervalsOverlap, slotsBetween } from '../src/modules/availability/availability.service';

describe('Availability calculation', () => {
  it('generates duration-aware 30-minute slots', () => {
    const slots = slotsBetween('2030-01-02', '09:00', '12:00', 60);
    expect(slots.map((slot) => slot.toISOString().slice(11, 16))).toEqual(['09:00', '09:30', '10:00', '10:30', '11:00']);
  });

  it('uses half-open intervals so adjacent appointments do not overlap', () => {
    const ten = new Date('2030-01-02T10:00:00.000Z');
    const eleven = new Date('2030-01-02T11:00:00.000Z');
    const noon = new Date('2030-01-02T12:00:00.000Z');
    expect(intervalsOverlap(ten, eleven, eleven, noon)).toBe(false);
    expect(intervalsOverlap(ten, noon, eleven, noon)).toBe(true);
  });
});
