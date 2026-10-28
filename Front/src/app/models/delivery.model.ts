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

export interface Rider {
  id: number;
  name: string;
  phone: string;
  vehiclePlate: string;
  status: 'available' | 'delivering' | 'off_duty';
  createdAt?: string;
}

export interface Order {
  id: number;
  customerId: number;
  riderId?: number | null;
  boxCount: number;
  orderTime: string;
  deliveryDeadline: string;
  status: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
  note?: string;
  customer?: Customer;
  rider?: Rider;
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
  jobCode: string; // เช่น JOB-1
  riderName: string;
  color: string;
  totalBoxes: number;
  maxCapacity: number;
  orderCount: number;
  maxOrders: number;
  totalDistanceKm: number;
  estimatedMinutes: number;
  departureTime: string;
  estimatedArrivalTime: string;
  isWithinOneHour: boolean;
  riderCost: number; // ค่าจ้างไรเดอร์ = 15 + (กม. * 2 * กล่อง)
  stops: DeliveryStop[];
}

export interface FinancialSummary {
  pricePerBox: number;
  foodCostPerBox: number;
  totalBoxes: number;
  totalRevenue: number;
  totalFoodCost: number;
  totalRiderCost: number;
  grossProfit: number;
  netProfit: number;
  isProfitable: boolean;
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
  strategy?: string;
  availableStrategies?: {
    id: string;
    name: string;
    description: string;
  }[];
  financial: FinancialSummary;
  summary: {
    totalRiders: number;
    totalOrders: number;
    totalBoxes: number;
    totalDistanceKm: number;
    maxEstimatedMinutes: number;
    allOnTime: boolean;
  };
  riders: RiderRoute[];
}
