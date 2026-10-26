export interface Rider {
  id: number;
  name: string;
  phone: string;
  vehiclePlate: string;
  status: 'available' | 'delivering' | 'off_duty';
  createdAt?: string;
}
