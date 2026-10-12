export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  latitude?: number;
  longitude?: number;
  distanceKm?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface MsuLandmark {
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
}

export interface Order {
  id: number;
  customerId: number;
  boxCount: number;
  orderTime: string;
  deliveryDeadline: string;
  status: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';
  note?: string;
  customer?: Customer;
  distanceKm?: number;
  deliveredAt?: string;
  assignedRiderId?: number;
}

export interface Rider {
  id: number;
  name: string;
  phone: string;
  maxCapacity: number;
  color: string;
  status: 'available' | 'delivering' | 'off_duty';
}

export interface RouteStop {
  stopOrder: number;
  type: 'pickup' | 'delivery' | 'return';
  orderId?: number;
  order?: Order;
  customerName: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  boxCount: number;
  estimatedArrival: string;
  distanceFromPrevKm: number;
  status: 'pending' | 'delivered';
}

export interface RiderRoute {
  riderId: number;
  rider: Rider;
  totalBoxes: number;
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  color: string;
  stops: RouteStop[];
  polylineCoordinates: [number, number][];
  isOverCapacity: boolean;
  isLateRisk: boolean;
}

export interface DispatchPlan {
  planId: string;
  generatedAt: string;
  restaurantLocation: {
    name: string;
    latitude: number;
    longitude: number;
    address: string;
  };
  totalOrders: number;
  totalBoxes: number;
  ridersAssigned: number;
  routes: RiderRoute[];
  summary: {
    avgTimePerRiderMinutes: number;
    totalDistanceAllRidersKm: number;
    allOnTime: boolean;
    estimatedSavedPenaltyBaht: number;
  };
}

export interface RiderSheetData {
  rider: Rider;
  depot: {
    name: string;
    latitude: number;
    longitude: number;
    address: string;
  };
  totalBoxes: number;
  totalStops: number;
  completedStops: number;
  progressPercent: number;
  totalDistanceKm: number;
  estimatedDurationMinutes: number;
  color: string;
  stops: RouteStop[];
}
