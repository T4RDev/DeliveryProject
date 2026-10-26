export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  lat?: number;
  lng?: number;
  createdAt?: string;
  updatedAt?: string;
}
