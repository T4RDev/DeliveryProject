export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MsuLandmark {
  name: string;
  category: string;
  address: string;
}

export interface Order {
  id: number;
  customerId: number;
  boxCount: number;
  orderTime: string;
  deliveryDeadline: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  note?: string;
  customer?: Customer;
  deliveredAt?: string;
}
