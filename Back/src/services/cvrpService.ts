import { Order } from '../models/Order';
import { calculateDistanceKm, DEPOT_LOCATION } from '../utils/geo';

// ========================================================
// ค่าคงที่และเงื่อนไขตามโจทย์ CVRP (Project.md)
// ========================================================
export const MAX_BOXES_PER_RIDER = 10; // มอเตอร์ไซค์แต่ละคันขนข้าวกล่องได้เต็มที่คันละ 10 กล่อง
export const AVERAGE_SPEED_KMH = 25; // ความเร็วเฉลี่ยรถมอเตอร์ไซค์ในเขต มมส. (กม./ชม.)
export const SERVICE_TIME_PER_STOP_MIN = 2.5; // เวลาจอดส่งมอบอาหารเฉลี่ยจุดละ 2.5 นาที

// สีประจำตัวไรเดอร์แต่ละคนตามที่โจทย์กำหนด (ไรเดอร์ 1 สีแดง, คนที่ 2 สีเขียว, คนที่ 3 สีน้ำเงิน ฯลฯ)
export const RIDER_COLORS = [
  '#ef4444', // ไรเดอร์ 1 (แดง)
  '#10b981', // ไรเดอร์ 2 (เขียว)
  '#3b82f6', // ไรเดอร์ 3 (น้ำเงิน)
  '#f59e0b', // ไรเดอร์ 4 (ส้มทอง)
  '#8b5cf6', // ไรเดอร์ 5 (ม่วง)
  '#06b6d4', // ไรเดอร์ 6 (ฟ้าไซแอน)
  '#ec4899', // ไรเดอร์ 7 (ชมพู)
  '#14b8a6', // ไรเดอร์ 8 (เขียวอมฟ้า)
];

export const RIDER_NAMES = [
  'ไรเดอร์ 1 (สมชาย สายด่วน)',
  'ไรเดอร์ 2 (สมศักดิ์ ขามเรียง)',
  'ไรเดอร์ 3 (ธนกร รถไว)',
  'ไรเดอร์ 4 (วิชัย มอไซค์ซิ่ง)',
  'ไรเดอร์ 5 (อนุชา มมส.)',
  'ไรเดอร์ 6 (กิตติ ส่งไว)',
  'ไรเดอร์ 7 (ธีรพงษ์ ทันเที่ยง)',
  'ไรเดอร์ 8 (เอกชัย ไวแสง)',
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
  riderName: string;
  color: string;
  totalBoxes: number; // ต้องไม่เกิน 10 กล่อง
  maxCapacity: number;
  orderCount: number;
  totalDistanceKm: number;
  estimatedMinutes: number;
  departureTime: string;
  estimatedArrivalTime: string;
  isWithinOneHour: boolean; // ส่งทันภายใน 1 ชั่วโมง (ก่อน 12:30 น.) หรือไม่
  lateFineCompensation: number; // ค่าปรับชดเชยถ้าเลท (ออเดอร์ละ 20 บาท)
  stops: DeliveryStop[];
}

/**
 * อัลกอริทึมจัดเส้นทางและแบ่งงานไรเดอร์ (CVRP - Greedy Nearest Neighbor with Capacity <= 10)
 * โค้ดอ่านง่าย สไตล์นิสิต ตามโจทย์ Project.md
 * 1. ออกจากตลาดน้อย (Depot)
 * 2. เลือกจุดส่งที่ใกล้ที่สุดก่อนเสมอ (Nearest Neighbor) เพื่อไม่ให้วิ่งอ้อม
 * 3. คุมความจุในกระเป๋าไม่เกิน 10 กล่อง
 * 4. ครบแล้วขับรถกลับร้าน (Depot)
 */
export function optimizeDeliveryRoutes(ordersToDeliver: Order[]): RiderRoute[] {
  const unassigned = [...ordersToDeliver];
  const routes: RiderRoute[] = [];
  let riderIndex = 0;

  while (unassigned.length > 0) {
    const color = RIDER_COLORS[riderIndex % RIDER_COLORS.length];
    const name = RIDER_NAMES[riderIndex % RIDER_NAMES.length];

    let currentLat = DEPOT_LOCATION.lat;
    let currentLng = DEPOT_LOCATION.lng;
    let currentBoxes = 0;
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

    // หาออเดอร์ถัดไปที่ใกล้ที่สุดและใส่กระเป๋าได้ (รวมแล้วไม่เกิน 10 กล่อง)
    while (true) {
      const candidates = unassigned.filter(
        (o) => currentBoxes + o.boxCount <= MAX_BOXES_PER_RIDER
      );

      if (candidates.length === 0) {
        // กระเป๋าเต็ม หรือไม่มีออเดอร์ที่พอดีกับความจุที่เหลือ
        break;
      }

      // หาออเดอร์ที่พิกัดใกล้จุดปัจจุบันที่สุด (Nearest Neighbor)
      let nearestIndexInUnassigned = -1;
      let minDistance = Infinity;

      for (let i = 0; i < unassigned.length; i++) {
        const order = unassigned[i];
        if (currentBoxes + order.boxCount > MAX_BOXES_PER_RIDER) continue;

        const custLat = order.customer?.lat ?? DEPOT_LOCATION.lat;
        const custLng = order.customer?.lng ?? DEPOT_LOCATION.lng;
        const dist = calculateDistanceKm(currentLat, currentLng, custLat, custLng);

        if (dist < minDistance) {
          minDistance = dist;
          nearestIndexInUnassigned = i;
        }
      }

      if (nearestIndexInUnassigned === -1) {
        break;
      }

      // ดึงออเดอร์นี้ใส่กระเป๋าไรเดอร์คนปัจจุบัน
      const [pickedOrder] = unassigned.splice(nearestIndexInUnassigned, 1);
      const custLat = pickedOrder.customer?.lat ?? DEPOT_LOCATION.lat;
      const custLng = pickedOrder.customer?.lng ?? DEPOT_LOCATION.lng;

      currentLat = custLat;
      currentLng = custLng;
      currentBoxes += pickedOrder.boxCount;
      totalDistanceKm += minDistance;

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
        distanceFromPrevKm: Math.round(minDistance * 100) / 100,
        note: pickedOrder.note,
      });
    }

    // จุดสุดท้าย: ขับรถกลับร้าน (ศูนย์อาหารตลาดน้อย มมส.)
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

    // คำนวณเวลาวิ่ง: เวลาเดินทาง + เวลาส่งมอบอาหารแต่ละจุด
    const travelMinutes = (totalDistanceKm / AVERAGE_SPEED_KMH) * 60;
    const deliveryMinutes = (stops.length - 2) * SERVICE_TIME_PER_STOP_MIN;
    const estimatedMinutes = Math.round(travelMinutes + deliveryMinutes);

    // เวลาออกรถ 11:30 น. (ตามโจทย์)
    const departureHour = 11;
    const departureMin = 30;
    const arrivalTotalMin = departureHour * 60 + departureMin + estimatedMinutes;
    const arrivalHour = Math.floor(arrivalTotalMin / 60);
    const arrivalMin = arrivalTotalMin % 60;
    const arrivalTimeString = `${String(arrivalHour).padStart(2, '0')}:${String(arrivalMin).padStart(2, '0')} น.`;

    // เช็คว่าเกิน 60 นาที (เลทเกิน 12:30 น.) หรือไม่
    const isWithinOneHour = estimatedMinutes <= 60;
    const lateOrdersCount = isWithinOneHour ? 0 : stops.length - 2;
    const lateFineCompensation = lateOrdersCount * 20; // ปรับ 20 บาท/ออเดอร์

    routes.push({
      riderId: riderIndex + 1,
      riderName: name,
      color,
      totalBoxes: currentBoxes,
      maxCapacity: MAX_BOXES_PER_RIDER,
      orderCount: stops.length - 2,
      totalDistanceKm: Math.round(totalDistanceKm * 100) / 100,
      estimatedMinutes,
      departureTime: '11:30 น.',
      estimatedArrivalTime: arrivalTimeString,
      isWithinOneHour,
      lateFineCompensation,
      stops,
    });

    riderIndex++;
  }

  return routes;
}
