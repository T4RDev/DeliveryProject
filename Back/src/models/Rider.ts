export interface Rider {
  id: number;
  name: string;
  phone: string;
  maxCapacity: number;
  color: string;
  status: 'available' | 'delivering' | 'off_duty';
}