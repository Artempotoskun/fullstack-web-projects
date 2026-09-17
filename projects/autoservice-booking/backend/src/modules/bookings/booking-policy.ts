import { BookingStatus } from '@prisma/client';

const transitions: Record<BookingStatus, BookingStatus[]> = {
  PENDING: [BookingStatus.CONFIRMED, BookingStatus.CANCELLED],
  CONFIRMED: [BookingStatus.IN_PROGRESS, BookingStatus.CANCELLED, BookingStatus.NO_SHOW],
  IN_PROGRESS: [BookingStatus.COMPLETED, BookingStatus.CANCELLED],
  COMPLETED: [],
  CANCELLED: [],
  NO_SHOW: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus) { return transitions[from].includes(to); }
export function canCustomerChange(status: BookingStatus) { return status === BookingStatus.PENDING || status === BookingStatus.CONFIRMED; }
