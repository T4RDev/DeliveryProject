import { Customer } from './Customer';

export type OrderStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';

export interface Order {
  id: number;
  customerId: number;
  boxCount: number; // Maximum 3 boxes per order as per business rules
  orderTime: string; // Typically around 10:00 - 11:30 AM
  deliveryDeadline: string; // 12:30 PM
  status: OrderStatus;
  note?: string;
  customer?: Customer;
  deliveredAt?: string;
  assignedRiderId?: number;
}
