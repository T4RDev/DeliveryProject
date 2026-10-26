import { Request, Response, Router } from 'express';
import { conn } from '../dbconnect';
import { MSU_LANDMARKS, calculateDistanceKm } from '../db/database';

export const customerRouter = Router();

// 1. ดึงข้อมูลลูกค้าทุกคน (GET /api/customers)
customerRouter.get('/', async (req: Request, res: Response) => {
  try {
    const [rows] = await conn.query(`
      SELECT id, first_name AS firstName, last_name AS lastName, phone, address, 
             CAST(lat AS DOUBLE) AS lat, CAST(lng AS DOUBLE) AS lng, created_at AS createdAt
      FROM customers
      ORDER BY id ASC
    `);
    const customers = rows as any[];
    res.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// 2. ดึงรายการแลนด์มาร์กสำคัญรอบ มมส. (GET /api/customers/landmarks)
customerRouter.get('/landmarks', (req: Request, res: Response) => {
  res.json({
    success: true,
    count: MSU_LANDMARKS.length,
    data: MSU_LANDMARKS,
  });
});

// 3. ค้นหาลูกค้าตามชื่อหรือนามสกุล (GET /api/customers/search?q=...) - ตาม HW-5
customerRouter.get('/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const searchTerm = `%${q}%`;
    const [rows] = await conn.query(`
      SELECT id, first_name AS firstName, last_name AS lastName, phone, address, 
             CAST(lat AS DOUBLE) AS lat, CAST(lng AS DOUBLE) AS lng
      FROM customers
      WHERE first_name LIKE ? OR last_name LIKE ?
      ORDER BY id ASC
    `, [searchTerm, searchTerm]);
    const customers = rows as any[];
    res.json({
      success: true,
      query: q,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// 4. ค้นหาลูกค้าตามเบอร์โทร (GET /api/customers/phone/:phone) - สำหรับลูกค้าเก่า
customerRouter.get('/phone/:phone', async (req: Request, res: Response) => {
  try {
    const phone = req.params.phone;
    const [rows] = await conn.query(`
      SELECT id, first_name AS firstName, last_name AS lastName, phone, address, 
             CAST(lat AS DOUBLE) AS lat, CAST(lng AS DOUBLE) AS lng
      FROM customers
      WHERE phone = ?
      LIMIT 1
    `, [phone]);
    const customers = rows as any[];
    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลลูกค้าจากเบอร์โทรนี้' });
    }
    res.json({ success: true, data: customers[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// 5. ค้นหาลูกค้าในระยะ 1 กม. จากพิกัดที่กำหนด (GET /api/customers/nearby) - ตาม HW-5
customerRouter.get('/nearby', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 16.2465;
    const lng = parseFloat(req.query.lng as string) || 103.2510;
    const radius = parseFloat(req.query.radius as string) || 1.0;

    const [rows] = await conn.query(`
      SELECT id, first_name AS firstName, last_name AS lastName, phone, address, 
             CAST(lat AS DOUBLE) AS lat, CAST(lng AS DOUBLE) AS lng
      FROM customers
    `);
    const all = rows as any[];
    const nearby = all.filter((c) => {
      if (c.lat == null || c.lng == null) return false;
      const dist = calculateDistanceKm(lat, lng, c.lat, c.lng);
      return dist <= radius;
    });

    res.json({
      success: true,
      center: { lat, lng },
      radiusKm: radius,
      count: nearby.length,
      data: nearby,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// 6. ดูข้อมูลลูกค้ารายคนด้วย Id (GET /api/customers/:id)
customerRouter.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const [rows] = await conn.query(`
      SELECT id, first_name AS firstName, last_name AS lastName, phone, address, 
             CAST(lat AS DOUBLE) AS lat, CAST(lng AS DOUBLE) AS lng
      FROM customers
      WHERE id = ?
    `, [id]);
    const customers = rows as any[];
    if (customers.length === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลลูกค้า' });
    }
    res.json({ success: true, data: customers[0] });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// 7. เพิ่มลูกค้าใหม่ (POST /api/customers) - ตาม HW-5
customerRouter.post('/', async (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone, address, lat, lng } = req.body;
    if (!firstName || !lastName || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน: ชื่อ, นามสกุล, เบอร์โทร, ที่อยู่จัดส่ง',
      });
    }

    const [result] = await conn.query(`
      INSERT INTO customers (first_name, last_name, phone, address, lat, lng)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [firstName.trim(), lastName.trim(), phone.trim(), address.trim(), lat || 16.2465, lng || 103.2510]);

    const insertResult = result as any;
    const newId = insertResult.insertId;

    res.status(201).json({
      success: true,
      message: 'บันทึกข้อมูลลูกค้าเรียบร้อยแล้ว',
      data: {
        id: newId,
        firstName,
        lastName,
        phone,
        address,
        lat: lat || 16.2465,
        lng: lng || 103.2510,
      },
      affected_row: insertResult.affectedRows,
      last_idx: newId,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// 8. แก้ไขข้อมูลลูกค้า (PUT /api/customers/:id) - ตาม HW-5
customerRouter.put('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const { firstName, lastName, phone, address, lat, lng } = req.body;

    const [result] = await conn.query(`
      UPDATE customers 
      SET first_name = COALESCE(?, first_name),
          last_name = COALESCE(?, last_name),
          phone = COALESCE(?, phone),
          address = COALESCE(?, address),
          lat = COALESCE(?, lat),
          lng = COALESCE(?, lng)
      WHERE id = ?
    `, [firstName, lastName, phone, address, lat, lng, id]);

    const updateResult = result as any;
    if (updateResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลลูกค้าที่ต้องการแก้ไข' });
    }

    res.json({
      success: true,
      message: 'แก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว',
      affected_row: updateResult.affectedRows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// 9. ลบลูกค้า (DELETE /api/customers/:id) - ตาม HW-5
customerRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id;
    const [result] = await conn.query('DELETE FROM customers WHERE id = ?', [id]);
    const deleteResult = result as any;
    if (deleteResult.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลลูกค้าที่ต้องการลบ' });
    }
    res.json({
      success: true,
      message: 'ลบข้อมูลลูกค้าเรียบร้อยแล้ว',
      affected_row: deleteResult.affectedRows,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});
