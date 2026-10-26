import { Request, Response, Router } from 'express';
import { conn } from '../dbconnect';
import { Order } from '../models/Order';
import { DEPOT_LOCATION } from '../utils/geo';
import { optimizeDeliveryRoutes } from '../services/cvrpService';

export const routingRouter = Router();

// Re-export interfaces เพื่อให้ไฟล์อื่นที่เคย import จากที่นี่ใช้งานได้ต่อเนื่อง
export { DeliveryStop, RiderRoute } from '../services/cvrpService';

/**
 * POST /api/routing/optimize
 * อัลกอริทึมจัดเส้นทางและแบ่งงานไรเดอร์ (CVRP)
 * ดึงออเดอร์จาก MySQL -> คำนวณเส้นทาง -> บันทึก rider_id ที่ได้รับมอบหมายลงฐานข้อมูล
 */
routingRouter.post('/optimize', async (req: Request, res: Response) => {
  try {
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

    // เรียกใช้ฟังก์ชัน CVRP จาก cvrpService.ts
    const routes = optimizeDeliveryRoutes(targetOrders);

    // บันทึกการมอบหมาย rider_id ลงฐานข้อมูล MySQL
    for (const route of routes) {
      // ป้องกัน Foreign Key Error: ถ้ายังไม่มีไรเดอร์ไอดีนี้ใน DB ให้เพิ่มอัตโนมัติ
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

// GET /api/routing/optimize (รองรับ GET ด้วยเพื่อความสะดวกในการทดสอบ)
routingRouter.get('/optimize', (req: Request, res: Response) => {
  req.body = {};
  (routingRouter as any).handle(
    { ...req, method: 'POST', url: '/optimize' },
    res
  );
});
