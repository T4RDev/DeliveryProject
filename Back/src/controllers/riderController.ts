import { Request, Response, Router } from 'express';
import { conn } from '../dbconnect';

export const riderRouter = Router();

// 1. ดึงข้อมูลไรเดอร์ทั้งหมด (GET /api/riders)
riderRouter.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await conn.query(`
      SELECT id, name, phone, vehicle_plate AS vehiclePlate, status, created_at AS createdAt
      FROM riders
      ORDER BY id ASC
    `);
    const riders = rows as any[];
    res.json({
      success: true,
      count: riders.length,
      data: riders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// 2. ดึงออเดอร์ของไรเดอร์คนนี้ (GET /api/riders/:id/orders) - ดูว่าต้องไปส่งที่ไหน มีกี่กล่อง เบอร์ลูกค้า
riderRouter.get('/:id/orders', async (req: Request, res: Response) => {
  try {
    const riderId = req.params.id;

    // 1. เช็กข้อมูลไรเดอร์ก่อน
    const [riderRows] = await conn.query('SELECT id, name, phone, vehicle_plate AS vehiclePlate FROM riders WHERE id = ?', [riderId]);
    const riders = riderRows as any[];
    if (riders.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลไรเดอร์' });
    }

    // 2. ดึงออเดอร์ที่มอบหมายให้ไรเดอร์คนนี้
    const [orderRows] = await conn.query(`
      SELECT 
        orders.id, orders.customer_id AS customerId, orders.rider_id AS riderId,
        orders.box_count AS boxCount, orders.status, orders.note, orders.created_at AS orderTime,
        customers.first_name AS firstName, customers.last_name AS lastName,
        customers.phone AS customerPhone, customers.address,
        CAST(customers.lat AS DOUBLE) AS lat, CAST(customers.lng AS DOUBLE) AS lng
      FROM orders
      JOIN customers ON orders.customer_id = customers.id
      WHERE orders.rider_id = ?
      ORDER BY orders.status ASC, orders.id ASC
    `, [riderId]);

    const orders = (orderRows as any[]).map((row) => ({
      id: row.id,
      customerId: row.customerId,
      riderId: row.riderId,
      boxCount: Number(row.boxCount) || 1,
      status: row.status, // 'pending' หรือ 'delivered'
      note: row.note,
      orderTime: row.orderTime,
      customer: {
        id: row.customerId,
        firstName: row.firstName,
        lastName: row.lastName,
        phone: row.customerPhone,
        address: row.address,
        lat: row.lat != null ? Number(row.lat) : 16.2465,
        lng: row.lng != null ? Number(row.lng) : 103.2510,
      },
    }));

    const totalBoxes = orders.reduce((sum, o) => sum + o.boxCount, 0);
    const deliveredCount = orders.filter((o) => o.status === 'delivered').length;
    const pendingCount = orders.filter((o) => o.status !== 'delivered').length;

    res.json({
      success: true,
      rider: riders[0],
      totalOrders: orders.length,
      totalBoxes,
      deliveredCount,
      pendingCount,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// 3. ไรเดอร์กดยืนยัน "ส่งอาหารสำเร็จ" (PUT /api/riders/orders/:orderId/deliver)
riderRouter.put('/orders/:orderId/deliver', async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId;
    const [result] = await conn.query(`
      UPDATE orders 
      SET status = 'delivered' 
      WHERE id = ?
    `, [orderId]);

    const updateResult = result as any;
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการออเดอร์นี้' });
    }

    res.json({
      success: true,
      message: 'อัปเดตสถานะ: ส่งอาหารสำเร็จเรียบร้อยแล้ว',
      affected_row: updateResult.affectedRows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// 4. มอบหมายออเดอร์ให้ไรเดอร์ (PUT /api/riders/orders/:orderId/assign)
riderRouter.put('/orders/:orderId/assign', async (req: Request, res: Response) => {
  try {
    const orderId = req.params.orderId;
    const { riderId } = req.body;

    const [result] = await conn.query(`
      UPDATE orders 
      SET rider_id = ? 
      WHERE id = ?
    `, [riderId || null, orderId]);

    const updateResult = result as any;
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการออเดอร์นี้' });
    }

    res.json({
      success: true,
      message: 'มอบหมายไรเดอร์ให้ออเดอร์สำเร็จ',
      affected_row: updateResult.affectedRows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// 5. เพิ่มไรเดอร์ใหม่ (POST /api/riders)
riderRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { name, phone, vehiclePlate } = req.body;
    if (!name || !phone || !vehiclePlate) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบ: ชื่อไรเดอร์, เบอร์โทร, ป้ายทะเบียนรถ',
      });
    }

    const [result] = await conn.query(`
      INSERT INTO riders (name, phone, vehicle_plate)
      VALUES (?, ?, ?)
    `, [name.trim(), phone.trim(), vehiclePlate.trim()]);

    const insertResult = result as any;
    res.status(201).json({
      success: true,
      message: 'เพิ่มข้อมูลไรเดอร์เรียบร้อยแล้ว',
      last_idx: insertResult.insertId,
      affected_row: insertResult.affectedRows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});
