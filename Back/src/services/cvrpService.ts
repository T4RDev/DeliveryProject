import { Order } from '../models/Order';
import { calculateDistanceKm, DEPOT_LOCATION } from '../utils/geo';
import {
  calculateRiderCost,
  calculateEstimatedMinutes,
  calculateFinancialSummary as calcFinance,
  FinancialSummary,
} from '../utils/calculator';

export { FinancialSummary } from '../utils/calculator';

export const MAX_ORDERS_PER_RIDER = 3; // เงื่อนไข: ไรเดอร์รับไม่เกิน 3 ออเดอร์
export const MAX_BOXES_PER_RIDER = 3; // ความจุกระเป๋าไม่เกิน 3 กล่อง

export const RIDER_COLORS = [
  '#ef4444', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6',
  '#06b6d4', '#ec4899', '#14b8a6', '#6366f1', '#84cc16',
];

export const RIDER_NAMES = [
  'ไรเดอร์ 1 (สมชาย สายด่วน)', 'ไรเดอร์ 2 (สมศักดิ์ ขามเรียง)', 'ไรเดอร์ 3 (ธนกร รถไว)',
  'ไรเดอร์ 4 (วิชัย มอไซค์ซิ่ง)', 'ไรเดอร์ 5 (อนุชา มมส.)', 'ไรเดอร์ 6 (กิตติ ส่งไว)',
  'ไรเดอร์ 7 (ธีรพงษ์ ทันเที่ยง)', 'ไรเดอร์ 8 (เอกชัย ไวแสง)', 'ไรเดอร์ 9 (สุรชัย ส่งเร็ว)',
  'ไรเดอร์ 10 (วรวุฒิ นักซิ่ง)',
];

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
  jobCode: string;
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
  riderCost: number;
  stops: DeliveryStop[];
}

export type RoutingStrategy = 'fastest' | 'cost_optimized' | 'balanced';

export interface OptimizationOptions {
  strategy?: RoutingStrategy;
}

// อัลกอริทึมจัดเส้นทางและแบ่งงานไรเดอร์ (CVRP - Capacitated Vehicle Routing Problem)
export function optimizeDeliveryRoutes(
  ordersToDeliver: Order[],
  options: OptimizationOptions = {}
): RiderRoute[] {
  const strategy = options.strategy || 'fastest';
  let unassigned = [...ordersToDeliver];

  if (unassigned.length === 0) return [];

  // ปรับการจัดเรียงออเดอร์เริ่มต้นตามกลยุทธ์ที่เลือก
  if (strategy === 'cost_optimized') {
    unassigned.sort((a, b) => b.boxCount - a.boxCount);
  } else if (strategy === 'balanced') {
    unassigned.sort((a, b) => {
      const distA = calculateDistanceKm(DEPOT_LOCATION.lat, DEPOT_LOCATION.lng, a.customer?.lat ?? DEPOT_LOCATION.lat, a.customer?.lng ?? DEPOT_LOCATION.lng);
      const distB = calculateDistanceKm(DEPOT_LOCATION.lat, DEPOT_LOCATION.lng, b.customer?.lat ?? DEPOT_LOCATION.lat, b.customer?.lng ?? DEPOT_LOCATION.lng);
      return distA - distB;
    });
  }

  const routes: RiderRoute[] = [];
  let riderIndex = 0;

  while (unassigned.length > 0) {
    const color = RIDER_COLORS[riderIndex % RIDER_COLORS.length];
    const name = RIDER_NAMES[riderIndex % RIDER_NAMES.length];
    const riderId = riderIndex + 1;
    const jobCode = `JOB-${riderId}`;

    let currentLat = DEPOT_LOCATION.lat;
    let currentLng = DEPOT_LOCATION.lng;
    let currentBoxes = 0;
    let currentOrderCount = 0;
    let totalDistanceKm = 0;
    const stops: DeliveryStop[] = [];

    // จุดเริ่มต้น: ร้าน (ศูนย์อาหารตลาดน้อย มมส.)
    stops.push({
      step: 1,
      type: 'depot',
      name: `${DEPOT_LOCATION.name} (จุดรับอาหาร)`,
      address: DEPOT_LOCATION.address,
      lat: DEPOT_LOCATION.lat,
      lng: DEPOT_LOCATION.lng,
      boxCount: 0,
      distanceFromPrevKm: 0,
    });

    let stepCounter = 2;

    // หาออเดอร์ถัดไป: จำกัดไม่เกิน 3 ออเดอร์ต่อคน และกล่องรวมไม่เกิน 10 กล่อง
    while (currentOrderCount < MAX_ORDERS_PER_RIDER) {
      const candidates = unassigned.filter(
        (o) => currentBoxes + o.boxCount <= MAX_BOXES_PER_RIDER
      );
      if (candidates.length === 0) break;

      let chosenIndex = -1;
      let minScore = Infinity;

      for (let i = 0; i < unassigned.length; i++) {
        const order = unassigned[i];
        if (currentBoxes + order.boxCount > MAX_BOXES_PER_RIDER) continue;

        const custLat = order.customer?.lat ?? DEPOT_LOCATION.lat;
        const custLng = order.customer?.lng ?? DEPOT_LOCATION.lng;
        const dist = calculateDistanceKm(currentLat, currentLng, custLat, custLng);

        let score = dist;
        if (strategy === 'cost_optimized') {
          score = dist * (order.boxCount || 1);
        }

        if (score < minScore) {
          minScore = score;
          chosenIndex = i;
        }
      }

      if (chosenIndex === -1) break;

      const [pickedOrder] = unassigned.splice(chosenIndex, 1);
      const custLat = pickedOrder.customer?.lat ?? DEPOT_LOCATION.lat;
      const custLng = pickedOrder.customer?.lng ?? DEPOT_LOCATION.lng;
      const stepDist = calculateDistanceKm(currentLat, currentLng, custLat, custLng);

      currentLat = custLat;
      currentLng = custLng;
      currentBoxes += pickedOrder.boxCount;
      currentOrderCount += 1;
      totalDistanceKm += stepDist;

      stops.push({
        step: stepCounter++,
        orderId: pickedOrder.id,
        type: 'customer',
        name: `${pickedOrder.customer?.firstName ?? ''} ${pickedOrder.customer?.lastName ?? ''}`.trim() || 'ลูกค้า',
        phone: pickedOrder.customer?.phone,
        address: pickedOrder.customer?.address || 'มหาวิทยาลัยมหาสารคาม ขามเรียง',
        lat: custLat,
        lng: custLng,
        boxCount: pickedOrder.boxCount,
        distanceFromPrevKm: Math.round(stepDist * 100) / 100,
        note: pickedOrder.note,
      });
    }

    // จุดสุดท้าย: ขับรถกลับร้าน
    const returnDist = calculateDistanceKm(currentLat, currentLng, DEPOT_LOCATION.lat, DEPOT_LOCATION.lng);
    totalDistanceKm += returnDist;

    stops.push({
      step: stepCounter,
      type: 'depot',
      name: `${DEPOT_LOCATION.name} (กลับร้าน)`,
      address: DEPOT_LOCATION.address,
      lat: DEPOT_LOCATION.lat,
      lng: DEPOT_LOCATION.lng,
      boxCount: 0,
      distanceFromPrevKm: Math.round(returnDist * 100) / 100,
    });

    const roundedDistanceKm = Math.round(totalDistanceKm * 100) / 100;
    const estimatedMinutes = calculateEstimatedMinutes(roundedDistanceKm, currentOrderCount);

    // เวลาออกเดินทาง 11:30 น.
    const departureTotalMin = 11 * 60 + 30;
    const arrivalTotalMin = departureTotalMin + estimatedMinutes;
    const arrivalHour = Math.floor(arrivalTotalMin / 60);
    const arrivalMin = arrivalTotalMin % 60;
    const arrivalTimeString = `${String(arrivalHour).padStart(2, '0')}:${String(arrivalMin).padStart(2, '0')} น.`;

    const isWithinOneHour = estimatedMinutes <= 60;
    const riderCost = calculateRiderCost(roundedDistanceKm, currentBoxes);

    routes.push({
      riderId,
      jobCode,
      riderName: name,
      color,
      totalBoxes: currentBoxes,
      maxCapacity: MAX_BOXES_PER_RIDER,
      orderCount: currentOrderCount,
      maxOrders: MAX_ORDERS_PER_RIDER,
      totalDistanceKm: roundedDistanceKm,
      estimatedMinutes,
      departureTime: '11:30 น.',
      estimatedArrivalTime: arrivalTimeString,
      isWithinOneHour,
      riderCost,
      stops,
    });

    riderIndex++;
  }

  return routes;
}

// ฟังก์ชันเรียกคำนวณสรุปผลการเงิน (ส่งต่อไปยัง calculator)
export function calculateFinancialSummary(routes: RiderRoute[], totalBoxes: number): FinancialSummary {
  const riderCosts = routes.map((r) => r.riderCost);
  return calcFinance(riderCosts, totalBoxes);
}
