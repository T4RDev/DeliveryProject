import { Request, Response, Router } from 'express';
import { db } from '../db/database';

export const orderRouter = Router();

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

orderRouter.post('/mock', (req: Request, res: Response) => {
  try {
    const count = parseInt(req.body.count as string) || 24;
    const safeCount = Math.min(Math.max(5, count), 50);
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
