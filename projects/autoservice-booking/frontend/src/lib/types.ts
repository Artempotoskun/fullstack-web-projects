export type Locale = 'en' | 'uk' | 'ru';
export type Role = 'USER' | 'ADMIN' | 'MECHANIC';
export type BookingStatus = 'PENDING' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

export interface User { id: string; email: string; firstName: string; lastName: string; phone?: string; role: Role; locale: string }
export interface Vehicle { id: string; make: string; model: string; year: number; engine: string; vin?: string; licensePlate?: string; mileage: number }
export interface WorkshopService { id: string; slug: string; category: string; price: string; durationMinutes: number; icon?: string; name: string; description: string; translations?: { locale: string; name: string; description?: string }[] }
export interface BusinessHours { weekday: number; openTime?: string; closeTime?: string; isClosed: boolean }
export interface Location { id: string; name: string; address: string; phone: string; timeZone: string; businessHours: BusinessHours[]; serviceBays: { id: string; name: string; bayType: string }[]; _count: { mechanics: number } }
export interface Mechanic { id: string; name: string; specialization: string; locationId: string; location?: Location }
export interface Booking {
  id: string; reference: string; startTime: string; endTime: string; status: BookingStatus; quotedPrice: string; customerNotes?: string; cancellationReason?: string;
  vehicle: Vehicle; service: WorkshopService & { translations?: { locale: string; name: string }[] }; location: Location; mechanic?: Mechanic; serviceBay: { id: string; name: string }; user?: User;
}
export interface Notification { id: string; title: string; message: string; type: string; isRead: boolean; createdAt: string }
