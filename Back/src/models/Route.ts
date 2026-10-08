import { Order } from './Order';
import { Rider } from './Rider';

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
