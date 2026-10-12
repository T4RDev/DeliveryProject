export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  createdAt?: string;
  updatedAt?: string;
}
