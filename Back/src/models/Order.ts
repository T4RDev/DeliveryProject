import { Customer } from './Customer';

export type OrderStatus = 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';

export interface Order {
  id: number;
  customerId: number;
  boxCount: number;
  orderTime: string;
  deliveryDeadline: string;
  status: OrderStatus;
  note?: string;
  customer?: Customer;
  deliveredAt?: string;
  assignedRiderId?: number;
}
