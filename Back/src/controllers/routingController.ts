import { Request, Response, Router } from 'express';
import { db, calculateDistanceKm, DEPOT_LOCATION } from '../db/database';
import { Order } from '../models/Order';

export const routingRouter = Router();

// ค่าคงที่ตามเงื่อนไขใน Project.md
const MAX_BOXES_PER_RIDER = 10; // มอเตอร์ไซค์แต่ละคันขนข้าวกล่องได้เต็มที่คันละ 10 กล่อง
const AVERAGE_SPEED_KMH = 25; // ความเร็วเฉลี่ยรถมอเตอร์ไซค์ในเขต มมส. (กม./ชม.)
const SERVICE_TIME_PER_STOP_MIN = 2.5; // เวลาจอดส่งมอบอาหารเฉลี่ยจุดละ 2.5 นาที

// สีประจำตัวไรเดอร์แต่ละคนตามที่โจทย์กำหนด (เช่น สีแดง, สีเขียว, สีน้ำเงิน)
const RIDER_COLORS = [
  '#ef4444', // ไรเดอร์ 1 (แดง)
  '#10b981', // ไรเดอร์ 2 (เขียว)
  '#3b82f6', // ไรเดอร์ 3 (น้ำเงิน)
  '#f59e0b', // ไรเดอร์ 4 (ส้มทอง)
  '#8b5cf6', // ไรเดอร์ 5 (ม่วง)
  '#06b6d4', // ไรเดอร์ 6 (ฟ้าไซแอน)
  '#ec4899', // ไรเดอร์ 7 (ชมพู)
];

const RIDER_NAMES = [
  'ไรเดอร์ 1 (สมชาย สายด่วน)',
  'ไรเดอร์ 2 (สมศักดิ์ ขามเรียง)',
  'ไรเดอร์ 3 (ธนกร รถไว)',
  'ไรเดอร์ 4 (วิชัย มอไซค์ซิ่ง)',
  'ไรเดอร์ 5 (อนุชา มมส.)',
  'ไรเดอร์ 6 (กิตติ ส่งไว)',
  'ไรเดอร์ 7 (ธีรพงษ์ ทันเที่ยง)',
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
 */
function optimizeDeliveryRoutes(ordersToDeliver: Order[]) {
  // ดึงเฉพาะออเดอร์ที่ยังมีสถานะรอส่ง หรือที่ส่งเข้ามา
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
      // คัดกรองออเดอร์ที่ขนาดกล่องพอดีกับที่ว่างในกระเป๋า
      const candidates = unassigned.filter(
        (o) => currentBoxes + o.boxCount <= MAX_BOXES_PER_RIDER
      );

      if (candidates.length === 0) {
        // กระเป๋าเต็มแล้ว (หรือไม่มีออเดอร์ที่กล่องพอดี) ให้จบคันนี้
        break;
      }

      // หาผู้สมัครที่อยู่ใกล้ตำแหน่งปัจจุบันที่สุด (Nearest Neighbor)
      let nearestIdx = -1;
      let minDistance = Infinity;

      for (let i = 0; i < candidates.length; i++) {
        const c = candidates[i].customer;
        const cLat = c?.lat ?? DEPOT_LOCATION.lat;
        const cLng = c?.lng ?? DEPOT_LOCATION.lng;
        const dist = calculateDistanceKm(currentLat, currentLng, cLat, cLng);

        if (dist < minDistance) {
          minDistance = dist;
          nearestIdx = i;
        }
      }

      const pickedOrder = candidates[nearestIdx];
      // นำออเดอร์นี้ออกจาก unassigned
      const removeIndex = unassigned.findIndex((o) => o.id === pickedOrder.id);
      unassigned.splice(removeIndex, 1);

      const cust = pickedOrder.customer;
      const cLat = cust?.lat ?? DEPOT_LOCATION.lat;
      const cLng = cust?.lng ?? DEPOT_LOCATION.lng;

      currentBoxes += pickedOrder.boxCount;
      totalDistanceKm += minDistance;
      currentLat = cLat;
      currentLng = cLng;

      stops.push({
        step: stepCounter++,
        orderId: pickedOrder.id,
        type: 'customer',
        name: cust ? `${cust.firstName} ${cust.lastName}` : 'ลูกค้า',
        phone: cust?.phone,
        address: cust?.address || '-',
        lat: cLat,
        lng: cLng,
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

// POST /api/routing/optimize
routingRouter.post('/optimize', (req: Request, res: Response) => {
  try {
    // รับเงื่อนไขตัวกรอง ถ้าไม่ได้ส่งมาให้ดึงออเดอร์ที่รอจัดส่งทั้งหมด
    const allOrders = db.getAllOrders();
    const pendingOrders = allOrders.filter((o) => o.status !== 'delivered');
    const targetOrders = pendingOrders.length > 0 ? pendingOrders : allOrders;

    if (targetOrders.length === 0) {
      return res.json({
        success: true,
        message: 'ไม่มีรายการออเดอร์ที่ต้องจัดส่ง',
        depot: DEPOT_LOCATION,
        summary: {
          totalRiders: 0,
          totalOrders: 0,
          totalBoxes: 0,
          totalDistanceKm: 0,
          maxEstimatedMinutes: 0,
          totalLateFine: 0,
        },
        riders: [],
      });
    }

    const routes = optimizeDeliveryRoutes(targetOrders);

    const totalBoxes = routes.reduce((sum, r) => sum + r.totalBoxes, 0);
    const totalDistanceKm = Math.round(routes.reduce((sum, r) => sum + r.totalDistanceKm, 0) * 100) / 100;
    const maxEstimatedMinutes = Math.max(...routes.map((r) => r.estimatedMinutes));
    const totalLateFine = routes.reduce((sum, r) => sum + r.lateFineCompensation, 0);

    res.json({
      success: true,
      message: `จัดเส้นทางสำเร็จสำหรับไรเดอร์ ${routes.length} คัน (รวม ${totalBoxes} กล่อง)`,
      depot: DEPOT_LOCATION,
      summary: {
        totalRiders: routes.length,
        totalOrders: targetOrders.length,
        totalBoxes,
        totalDistanceKm,
        maxEstimatedMinutes,
        totalLateFine,
        allOnTime: maxEstimatedMinutes <= 60,
      },
      riders: routes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'เกิดข้อผิดพลาดในการจัดเส้นทาง', error });
  }
});

// GET /api/routing/optimize
routingRouter.get('/optimize', (req: Request, res: Response) => {
  // รองรับ GET ด้วยเพื่อความสะดวกในการทดสอบผ่าน Browser
  req.body = {};
  (routingRouter as any).handle(
    { ...req, method: 'POST', url: '/optimize' },
    res
  );
});
