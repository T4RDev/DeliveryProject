import { Request, Response, Router } from 'express';
import { conn } from '../dbconnect';
import { calculateDistanceKm } from '../db/database';

export const orderRouter = Router();

// Helper แปลงข้อมูลแถวจากการ JOIN ให้เป็น Object ออเดอร์ที่มี customer และ rider ซ้อนอยู่ข้างใน
function formatOrderRow(row: any) {
  return {
    id: row.id,
    customerId: row.customerId,
    riderId: row.riderId || null,
    boxCount: Number(row.boxCount) || 1,
    status: row.status || 'pending',
    note: row.note || '',
    orderTime: row.orderTime || new Date().toISOString(),
    customer: {
      id: row.customerId,
      firstName: row.firstName,
      lastName: row.lastName,
      phone: row.phone,
      address: row.address,
      lat: row.lat != null ? Number(row.lat) : 16.2465,
      lng: row.lng != null ? Number(row.lng) : 103.2510,
    },
    rider: row.riderId
      ? {
          id: row.riderId,
          name: row.riderName,
          phone: row.riderPhone,
          vehiclePlate: row.vehiclePlate,
        }
      : undefined,
  };
}

// 1. ดึงรายการสั่งซื้อทั้งหมด (GET /api/orders) พร้อม JOIN ลูกค้าและไรเดอร์
orderRouter.get('/', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    let sql = `
      SELECT 
        orders.id, orders.customer_id AS customerId, orders.rider_id AS riderId,
        orders.box_count AS boxCount, orders.status, orders.note, orders.created_at AS orderTime,
        customers.first_name AS firstName, customers.last_name AS lastName,
        customers.phone, customers.address,
        CAST(customers.lat AS DOUBLE) AS lat, CAST(customers.lng AS DOUBLE) AS lng,
        riders.name AS riderName, riders.phone AS riderPhone, riders.vehicle_plate AS vehiclePlate
      FROM orders
      JOIN customers ON orders.customer_id = customers.id
      LEFT JOIN riders ON orders.rider_id = riders.id
    `;
    const params: any[] = [];
    if (q.trim()) {
      sql += ` WHERE customers.first_name LIKE ? OR customers.last_name LIKE ? OR customers.phone LIKE ? OR riders.name LIKE ?`;
      const term = `%${q.trim()}%`;
      params.push(term, term, term, term);
    }
    sql += ` ORDER BY orders.id DESC`;

    const [rows] = await conn.query(sql, params);
    const rawOrders = rows as any[];
    const orders = rawOrders.map(formatOrderRow);
    const totalBoxes = orders.reduce((sum, o) => sum + o.boxCount, 0);

    res.json({
      success: true,
      count: orders.length,
      totalBoxes,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// 2. ค้นหารายการสั่งซื้อในระยะ 2 กม. (GET /api/orders/nearby) - ตาม HW-5
orderRouter.get('/nearby', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 16.2465;
    const lng = parseFloat(req.query.lng as string) || 103.2510;
    const radius = parseFloat(req.query.radius as string) || 2.0;

    const [rows] = await conn.query(`
      SELECT 
        orders.id, orders.customer_id AS customerId, orders.rider_id AS riderId,
        orders.box_count AS boxCount, orders.status, orders.note, orders.created_at AS orderTime,
        customers.first_name AS firstName, customers.last_name AS lastName,
        customers.phone, customers.address,
        CAST(customers.lat AS DOUBLE) AS lat, CAST(customers.lng AS DOUBLE) AS lng,
        riders.name AS riderName, riders.phone AS riderPhone, riders.vehicle_plate AS vehiclePlate
      FROM orders
      JOIN customers ON orders.customer_id = customers.id
      LEFT JOIN riders ON orders.rider_id = riders.id
      ORDER BY orders.id DESC
    `);
    const all = (rows as any[]).map(formatOrderRow);
    const nearby = all.filter((o) => {
      const dist = calculateDistanceKm(lat, lng, o.customer.lat, o.customer.lng);
      return dist <= radius;
    });
    const totalBoxes = nearby.reduce((sum, o) => sum + o.boxCount, 0);

    res.json({
      success: true,
      center: { lat, lng },
      radiusKm: radius,
      count: nearby.length,
      totalBoxes,
      data: nearby,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// 3. จำลองรายการสั่งซื้อ 20-30 รายการลงใน MySQL (POST /api/orders/mock) - ตาม HW-5
orderRouter.post('/mock', async (req: Request, res: Response) => {
  try {
    const count = parseInt(req.body.count as string) || 24;
    const safeCount = Math.min(Math.max(5, count), 40);

    const [custRows] = await conn.query('SELECT id FROM customers');
    const customers = custRows as any[];
    if (customers.length === 0) {
      return res.status(400).json({ success: false, message: 'ไม่มีข้อมูลลูกค้าในระบบ กรุณาเพิ่มลูกค้าก่อน' });
    }

    const [riderRows] = await conn.query('SELECT id FROM riders');
    const riders = riderRows as any[];

    const notes = [
      'โทรหาก่อนส่ง กำลังเรียนอยู่',
      'ฝากไว้โต๊ะประชาสัมพันธ์',
      'ส่งหน้าลิฟต์',
      'ห้องพักอาจารย์',
      'แขวนไว้หน้าห้อง',
      'โทรเบอร์นี้เมื่อถึง',
      'ป้อมยามหน้าหอ',
      '',
    ];

    for (let i = 0; i < safeCount; i++) {
      const randCust = customers[Math.floor(Math.random() * customers.length)];
      const randRider = riders.length > 0 && Math.random() > 0.3
        ? riders[Math.floor(Math.random() * riders.length)].id
        : null;
      const boxCount = Math.floor(Math.random() * 3) + 1; // 1-3 กล่อง
      const note = notes[Math.floor(Math.random() * notes.length)];
      await conn.query('INSERT INTO orders (customer_id, rider_id, box_count, status, note) VALUES (?, ?, ?, ?, ?)', [
        randCust.id,
        randRider,
        boxCount,
        'pending',
        note,
      ]);
    }

    const [latestRows] = await conn.query(`
      SELECT 
        orders.id, orders.customer_id AS customerId, orders.rider_id AS riderId,
        orders.box_count AS boxCount, orders.status, orders.note, orders.created_at AS orderTime,
        customers.first_name AS firstName, customers.last_name AS lastName,
        customers.phone, customers.address,
        CAST(customers.lat AS DOUBLE) AS lat, CAST(customers.lng AS DOUBLE) AS lng,
        riders.name AS riderName, riders.phone AS riderPhone, riders.vehicle_plate AS vehiclePlate
      FROM orders
      JOIN customers ON orders.customer_id = customers.id
      LEFT JOIN riders ON orders.rider_id = riders.id
      ORDER BY orders.id DESC
    `);
    const orders = (latestRows as any[]).map(formatOrderRow);
    const totalBoxes = orders.reduce((sum, o) => sum + o.boxCount, 0);

    res.status(201).json({
      success: true,
      message: `จำลองออเดอร์สำเร็จ ${safeCount} รายการ (รวม ${totalBoxes} กล่อง)`,
      count: orders.length,
      totalBoxes,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// 4. ล้างรายการสั่งซื้อทั้งหมด (DELETE /api/orders/clear) - ตาม HW-5
orderRouter.delete('/clear', async (req: Request, res: Response) => {
  try {
    await conn.query('DELETE FROM orders');
    res.json({
      success: true,
      message: 'ล้างรายการสั่งซื้อทั้งหมดเรียบร้อยแล้ว',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// 5. ดูออเดอร์รายตัว (GET /api/orders/:id)
orderRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const [rows] = await conn.query(`
      SELECT 
        orders.id, orders.customer_id AS customerId, orders.rider_id AS riderId,
        orders.box_count AS boxCount, orders.status, orders.note, orders.created_at AS orderTime,
        customers.first_name AS firstName, customers.last_name AS lastName,
        customers.phone, customers.address,
        CAST(customers.lat AS DOUBLE) AS lat, CAST(customers.lng AS DOUBLE) AS lng,
        riders.name AS riderName, riders.phone AS riderPhone, riders.vehicle_plate AS vehiclePlate
      FROM orders
      JOIN customers ON orders.customer_id = customers.id
      LEFT JOIN riders ON orders.rider_id = riders.id
      WHERE orders.id = ?
    `, [id]);
    const raw = rows as any[];
    if (raw.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการสั่งซื้อ' });
    }
    res.json({ success: true, data: formatOrderRow(raw[0]) });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// 6. เพิ่มรายการสั่งซื้อใหม่ (POST /api/orders) - ตาม HW-5 (รองรับการเลือก Rider ทันที)
orderRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { customerId, riderId, boxCount, note } = req.body;
    if (!customerId || boxCount === undefined) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ customerId และ boxCount',
      });
    }

    const parsedBoxes = parseInt(boxCount);
    if (isNaN(parsedBoxes) || parsedBoxes < 1 || parsedBoxes > 3) {
      return res.status(400).json({
        success: false,
        message: 'ตามเงื่อนไขของร้าน แต่ละรายการสั่งอาหารได้ไม่เกิน 3 กล่อง (1 - 3 กล่องเท่านั้น)',
      });
    }

    const assignedRider = riderId ? parseInt(riderId) : null;
    const [result] = await conn.query(`
      INSERT INTO orders (customer_id, rider_id, box_count, status, note)
      VALUES (?, ?, ?, 'pending', ?)
    `, [parseInt(customerId), assignedRider, parsedBoxes, note || '']);

    const insertResult = result as any;
    const newId = insertResult.insertId;

    const [newRows] = await conn.query(`
      SELECT 
        orders.id, orders.customer_id AS customerId, orders.rider_id AS riderId,
        orders.box_count AS boxCount, orders.status, orders.note, orders.created_at AS orderTime,
        customers.first_name AS firstName, customers.last_name AS lastName,
        customers.phone, customers.address,
        CAST(customers.lat AS DOUBLE) AS lat, CAST(customers.lng AS DOUBLE) AS lng,
        riders.name AS riderName, riders.phone AS riderPhone, riders.vehicle_plate AS vehiclePlate
      FROM orders
      JOIN customers ON orders.customer_id = customers.id
      LEFT JOIN riders ON orders.rider_id = riders.id
      WHERE orders.id = ?
    `, [newId]);

    const formatted = formatOrderRow((newRows as any[])[0]);
    res.status(201).json({
      success: true,
      message: 'เพิ่มรายการสั่งซื้อเรียบร้อยแล้ว',
      data: formatted,
      affected_row: insertResult.affectedRows,
      last_idx: newId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// 7. แก้ไขออเดอร์: เปลี่ยนไรเดอร์, แก้ไขจำนวนกล่อง, อัปเดตสถานะ (PUT /api/orders/:id)
orderRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { boxCount, status, note, riderId } = req.body;

    if (boxCount != null) {
      const parsedBoxes = parseInt(boxCount);
      if (isNaN(parsedBoxes) || parsedBoxes < 1 || parsedBoxes > 3) {
        return res.status(400).json({
          success: false,
          message: 'ตามเงื่อนไขของร้าน แต่ละรายการสั่งอาหารได้ไม่เกิน 3 กล่อง (1 - 3 กล่องเท่านั้น)',
        });
      }
    }

    const [result] = await conn.query(`
      UPDATE orders
      SET box_count = COALESCE(?, box_count),
          status = COALESCE(?, status),
          note = COALESCE(?, note),
          rider_id = COALESCE(?, rider_id)
      WHERE id = ?
    `, [
      boxCount != null ? parseInt(boxCount) : null,
      status || null,
      note != null ? note : null,
      riderId !== undefined ? (riderId ? parseInt(riderId) : null) : null,
      id,
    ]);

    const updateResult = result as any;
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการสั่งซื้อที่ต้องการแก้ไข' });
    }

    res.json({
      success: true,
      message: 'แก้ไขรายการสั่งซื้อเรียบร้อยแล้ว',
      affected_row: updateResult.affectedRows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// 8. ลบรายการสั่งซื้อ (DELETE /api/orders/:id)
orderRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const [result] = await conn.query('DELETE FROM orders WHERE id = ?', [id]);
    const deleteResult = result as any;
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการสั่งซื้อที่ต้องการลบ' });
    }

    res.json({
      success: true,
      message: 'ลบรายการสั่งซื้อเรียบร้อยแล้ว',
      affected_row: deleteResult.affectedRows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});
