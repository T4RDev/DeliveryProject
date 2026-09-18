export interface Rider {
  id: number;
  name: string;
  phone: string;
  maxCapacity: number; // Max 10 lunchboxes
  color: string; // Distinct UI route color (Red, Green, Blue, etc.)
  status: 'available' | 'delivering' | 'off_duty';
}
