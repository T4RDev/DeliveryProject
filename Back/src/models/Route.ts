import { Order } from './Order';
import { Rider } from './Rider';

export interface RouteStop {
  stopOrder: number; // 1, 2, 3...
  type: 'pickup' | 'delivery' | 'return';
  orderId?: number;
  order?: Order;
  customerName: string;
  phone: string;
  address: string;
  latitude: number;
  longitude: number;
  boxCount: number;
  estimatedArrival: string; // e.g. "11:45"
  distanceFromPrevKm: number;
  status: 'pending' | 'delivered';
}

export interface RiderRoute {
  riderId: number;
  rider: Rider;
  totalBoxes: number; // <= 10
  totalDistanceKm: number;
  estimatedDurationMinutes: number; // Must ensure arrival before 12:30 PM (<= 60 mins)
  color: string;
  stops: RouteStop[];
  polylineCoordinates: [number, number][]; // [lat, lng] path
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
    estimatedSavedPenaltyBaht: number; // 20 THB per order saved!
  };
}
