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

export interface MsuLandmark {
  name: string;
  category: string;
  address: string;
  lat?: number;
  lng?: number;
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

export interface DeliveryStop {
  step: number;
  orderId?: number;
  type: 'depot' | 'customer';
  name: string;
  phone?: string;
  address: string;
  lat: number;
  lng: number;
  boxCount: number;
  distanceFromPrevKm: number;
  note?: string;
}

export interface RiderRoute {
  riderId: number;
  riderName: string;
  color: string;
  totalBoxes: number;
  maxCapacity: number;
  orderCount: number;
  totalDistanceKm: number;
  estimatedMinutes: number;
  departureTime: string;
  estimatedArrivalTime: string;
  isWithinOneHour: boolean;
  lateFineCompensation: number;
  stops: DeliveryStop[];
}

export interface RoutingOptimizationResult {
  success: boolean;
  message: string;
  depot: {
    name: string;
    category: string;
    address: string;
    lat: number;
    lng: number;
  };
  summary: {
    totalRiders: number;
    totalOrders: number;
    totalBoxes: number;
    totalDistanceKm: number;
    maxEstimatedMinutes: number;
    totalLateFine: number;
    allOnTime: boolean;
  };
  riders: RiderRoute[];
}
