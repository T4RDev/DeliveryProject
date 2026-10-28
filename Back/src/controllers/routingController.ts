import { Request, Response, Router } from 'express';
import { conn } from '../dbconnect';
import { Order } from '../models/Order';
import { DEPOT_LOCATION } from '../utils/geo';
import {
  optimizeDeliveryRoutes,
  calculateFinancialSummary,
  RoutingStrategy,
  RiderRoute,
  DeliveryStop,
  FinancialSummary,
} from '../services/cvrpService';

export const routingRouter = Router();

// Re-export interfaces
export { DeliveryStop, RiderRoute, FinancialSummary } from '../services/cvrpService';

// ตัวเลือกกลยุทธ์การจัดเส้นทางสำหรับนำเสนอ
export const AVAILABLE_STRATEGIES = [
  {
    id: 'fastest',
    name: 'เน้นจัดส่งเร็วที่สุด',
    description: 'เลือกจุดส่งใกล้สุดทีละจุด เพื่อให้ถึงมือลูกค้าเร็วที่สุด',
  },
  {
    id: 'cost_optimized',
    name: 'เน้นประหยัดต้นทุนค่าส่ง',
    description: 'จัดกลุ่มตามจำนวนกล่องเพื่อลดค่าส่ง Box-Km ให้ได้กำไรสูงสุด',
  },
  {
    id: 'balanced',
    name: 'กระจายงานไรเดอร์เท่ากัน',
    description: 'เฉลี่ยภาระงานและจำนวนจุดส่งให้ไรเดอร์แต่ละคนใกล้เคียงกัน',
  },
];

// จัดเส้นทางและแบ่งงานไรเดอร์ (POST /api/routing/optimize)
routingRouter.post('/optimize', async (req: Request, res: Response) => {
  try {
    const strategy = (req.body.strategy as RoutingStrategy) || 'fastest';

    const [rows] = await conn.query(`
      SELECT 
        orders.id, orders.customer_id AS customerId, orders.box_count AS boxCount,
        orders.status, orders.note, orders.created_at AS orderTime,
        customers.first_name AS firstName, customers.last_name AS lastName,
        customers.phone, customers.address,
        CAST(customers.lat AS DOUBLE) AS lat, CAST(customers.lng AS DOUBLE) AS lng
      FROM orders
      JOIN customers ON orders.customer_id = customers.id
    `);

    const allOrders: Order[] = (rows as any[]).map((row) => ({
      id: row.id,
      customerId: row.customerId,
      boxCount: Number(row.boxCount) || 1,
      status: row.status || 'pending',
      note: row.note || '',
      orderTime: row.orderTime || '',
      deliveryDeadline: '12:30 น.',
      customer: {
        id: row.customerId,
        firstName: row.firstName,
        lastName: row.lastName,
        phone: row.phone,
        address: row.address,
        lat: row.lat != null ? Number(row.lat) : 16.2465,
        lng: row.lng != null ? Number(row.lng) : 103.2510,
      },
    }));

    const pendingOrders = allOrders.filter((o) => o.status !== 'delivered');
    const targetOrders = pendingOrders.length > 0 ? pendingOrders : allOrders;

    if (targetOrders.length === 0) {
      return res.json({
        success: true,
        message: 'ไม่มีรายการออเดอร์ที่ต้องจัดส่ง',
        depot: DEPOT_LOCATION,
        strategy,
        availableStrategies: AVAILABLE_STRATEGIES,
        financial: {
          pricePerBox: 65,
          foodCostPerBox: 40,
          totalBoxes: 0,
          totalRevenue: 0,
          totalFoodCost: 0,
          totalRiderCost: 0,
          grossProfit: 0,
          netProfit: 0,
          isProfitable: true,
        },
        summary: {
          totalRiders: 0,
          totalOrders: 0,
          totalBoxes: 0,
          totalDistanceKm: 0,
          maxEstimatedMinutes: 0,
          allOnTime: true,
        },
        riders: [],
      });
    }

    // เรียกใช้ฟังก์ชัน CVRP
    const routes = optimizeDeliveryRoutes(targetOrders, { strategy });

    // บันทึกการมอบหมาย rider_id ลงฐานข้อมูล MySQL
    for (const route of routes) {
      const [existing] = await conn.query('SELECT id FROM riders WHERE id = ?', [route.riderId]);
      if ((existing as any[]).length === 0) {
        await conn.query(
          'INSERT INTO riders (id, name, phone, vehicle_plate, status) VALUES (?, ?, ?, ?, ?)',
          [
            route.riderId,
            route.riderName,
            `089111${String(route.riderId).padStart(4, '0')}`,
            `มอไซค์-${route.riderId} มหาสารคาม`,
            'available',
          ]
        );
      }

      const orderIds = route.stops
        .filter((s) => s.type === 'customer' && s.orderId)
        .map((s) => s.orderId);
      if (orderIds.length > 0) {
        await conn.query('UPDATE orders SET rider_id = ? WHERE id IN (?)', [route.riderId, orderIds]);
      }
    }

    const totalBoxes = routes.reduce((sum, r) => sum + r.totalBoxes, 0);
    const totalDistanceKm = Math.round(routes.reduce((sum, r) => sum + r.totalDistanceKm, 0) * 100) / 100;
    const maxEstimatedMinutes = routes.length > 0 ? Math.max(...routes.map((r) => r.estimatedMinutes)) : 0;
    const financial = calculateFinancialSummary(routes, totalBoxes);

    res.json({
      success: true,
      message: `จัดเส้นทางสำเร็จสำหรับไรเดอร์ ${routes.length} คัน (จำกัดไม่เกินคันละ 3 ออเดอร์, ข้าวกล่องรวม ${totalBoxes} กล่อง)`,
      depot: DEPOT_LOCATION,
      strategy,
      availableStrategies: AVAILABLE_STRATEGIES,
      financial,
      summary: {
        totalRiders: routes.length,
        totalOrders: targetOrders.length,
        totalBoxes,
        totalDistanceKm,
        maxEstimatedMinutes,
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
  req.body = { strategy: req.query.strategy || 'fastest' };
  (routingRouter as any).handle(
    { ...req, method: 'POST', url: '/optimize' },
    res
  );
});
