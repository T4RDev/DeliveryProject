import { Request, Response, Router } from 'express';
import { db, RESTAURANT_DEPOT } from '../db/database';

export const orderRouter = Router();

// GET /api/orders - แสดงรายการสั่งซื้อทั้งหมด (รองรับ ?q=... ค้นหาชื่อ/เบอร์/ที่อยู่)
orderRouter.get('/', (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const orders = db.getAllOrders(q);
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

// GET /api/orders/nearby?lat=...&lng=...&radius=2 - แสดงรายการสั่งซื้อในรัศมีที่กำหนด
orderRouter.get('/nearby', (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || RESTAURANT_DEPOT.latitude;
    const lng = parseFloat(req.query.lng as string) || RESTAURANT_DEPOT.longitude;
    const radius = parseFloat(req.query.radius as string) || 2.0;

    const orders = db.getOrdersNearby(lat, lng, radius);
    const totalBoxes = orders.reduce((sum, o) => sum + o.boxCount, 0);

    res.json({
      success: true,
      center: { lat, lng },
      radiusKm: radius,
      count: orders.length,
      totalBoxes,
      data: orders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// POST /api/orders/mock - สร้างข้อมูลรายการสั่งซื้อตัวอย่าง
orderRouter.post('/mock', (req: Request, res: Response) => {
  try {
    const count = parseInt(req.body.count as string) || 24;
    const safeCount = Math.min(Math.max(10, count), 40);
    const generated = db.generateMockOrders(safeCount);
    const totalBoxes = generated.reduce((sum, o) => sum + o.boxCount, 0);

    res.status(201).json({
      success: true,
      message: `สร้างข้อมูลตัวอย่างสำเร็จ ${generated.length} รายการ (รวม ${totalBoxes} กล่อง)`,
      count: generated.length,
      totalBoxes,
      data: generated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// DELETE /api/orders/clear - ล้างรายการสั่งซื้อทั้งหมด
orderRouter.delete('/clear', (req: Request, res: Response) => {
  try {
    db.clearOrders();
    res.json({
      success: true,
      message: 'ล้างรายการสั่งซื้อทั้งหมดเรียบร้อยแล้ว',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

orderRouter.delete('/mock', (req: Request, res: Response) => {
  try {
    db.clearOrders();
    res.json({
      success: true,
      message: 'ล้างรายการสั่งซื้อทั้งหมดเรียบร้อยแล้ว',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// GET /api/orders/:id - ดึงข้อมูลออเดอร์รายบุคคล
orderRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const order = db.getOrderById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการสั่งซื้อ' });
    }
    res.json({ success: true, data: order });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// POST /api/orders - เพิ่มรายการสั่งซื้อ
orderRouter.post('/', (req: Request, res: Response) => {
  try {
    const { customerId, boxCount, note } = req.body;
    if (!customerId || !boxCount) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุ customerId และ boxCount (ไม่เกิน 3 กล่อง)',
      });
    }

    const order = db.createOrder({
      customerId: parseInt(customerId),
      boxCount: parseInt(boxCount),
      note,
    });

    res.status(201).json({
      success: true,
      message: 'เพิ่มรายการสั่งซื้อเรียบร้อยแล้ว',
      data: order,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// PUT /api/orders/:id - แก้ไขจำนวนกล่อง และข้อมูลออเดอร์
orderRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const { boxCount, status, note } = req.body;

    const updated = db.updateOrder(id, {
      ...(boxCount !== undefined && { boxCount: parseInt(boxCount) }),
      ...(status && { status }),
      ...(note !== undefined && { note }),
    });

    if (!updated) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการสั่งซื้อที่ต้องการแก้ไข' });
    }

    res.json({
      success: true,
      message: 'แก้ไขรายการสั่งซื้อเรียบร้อยแล้ว',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// DELETE /api/orders/:id - ลบรายการสั่งซื้อ
orderRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = db.deleteOrder(id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'ไม่พบรายการสั่งซื้อที่ต้องการลบ' });
    }
    res.json({
      success: true,
      message: 'ลบรายการสั่งซื้อเรียบร้อยแล้ว',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});
