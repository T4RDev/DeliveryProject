import { Customer } from './Customer';
import { Rider } from './Rider';

export type OrderStatus = 'pending' | 'in_transit' | 'delivered' | 'cancelled';

export interface Order {
  id: number;
  customerId: number;
  riderId?: number | null;
  boxCount: number;
  orderTime: string;
  deliveryDeadline: string;
  status: OrderStatus;
  note?: string;
  customer?: Customer;
  rider?: Rider;
  deliveredAt?: string;
}
