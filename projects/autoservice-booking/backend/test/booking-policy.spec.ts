import { BookingStatus } from '@prisma/client';
import { canCustomerChange, canTransition } from '../src/modules/bookings/booking-policy';

describe('Booking status policy', () => {
  it('allows the operational happy path', () => {
    expect(canTransition(BookingStatus.PENDING, BookingStatus.CONFIRMED)).toBe(true);
    expect(canTransition(BookingStatus.CONFIRMED, BookingStatus.IN_PROGRESS)).toBe(true);
    expect(canTransition(BookingStatus.IN_PROGRESS, BookingStatus.COMPLETED)).toBe(true);
  });

  it('prevents reopening terminal states and customer edits after work starts', () => {
    expect(canTransition(BookingStatus.COMPLETED, BookingStatus.CONFIRMED)).toBe(false);
    expect(canTransition(BookingStatus.CANCELLED, BookingStatus.PENDING)).toBe(false);
    expect(canCustomerChange(BookingStatus.IN_PROGRESS)).toBe(false);
  });
});
