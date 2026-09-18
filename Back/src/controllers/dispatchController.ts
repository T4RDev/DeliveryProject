import { Request, Response, Router } from 'express';
import { db, RESTAURANT_DEPOT } from '../db/database';
import { routingService } from '../services/routingService';

export const dispatchRouter = Router();

// POST /api/dispatch/optimize - เจ้าของร้านกดปุ่ม "จัดเส้นทาง"
// คำนวณแบ่งกลุ่มไรเดอร์ (ไม่เกิน 10 กล่อง/คน) และหาเส้นทางที่ดีที่สุด
dispatchRouter.post('/optimize', (req: Request, res: Response) => {
  try {
    const plan = routingService.optimizeRoutes();
    res.json({
      success: true,
      message: 'จัดเส้นทางและแบ่งงานไรเดอร์อัจฉริยะสำเร็จ',
      data: plan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// GET /api/dispatch/plan - ดูแผนการจัดเส้นทางปัจจุบัน
dispatchRouter.get('/plan', (req: Request, res: Response) => {
  try {
    const plan = routingService.getCurrentPlan();
    res.json({
      success: true,
      data: plan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// GET /api/dispatch/riders - ดูรายชื่อไรเดอร์ทั้งหมด
dispatchRouter.get('/riders', (req: Request, res: Response) => {
  try {
    const riders = db.getRiders();
    res.json({
      success: true,
      data: riders,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// GET /api/dispatch/rider/:riderId/sheet - ไรเดอร์เปิดดู "ใบงาน" ของตัวเองผ่านมือถือ
dispatchRouter.get('/rider/:riderId/sheet', (req: Request, res: Response) => {
  try {
    const riderId = parseInt(req.params.riderId);
    const plan = routingService.getCurrentPlan();
    if (!plan) {
      return res.status(404).json({ success: false, message: 'ยังไม่มีแผนการจัดเส้นทางในขณะนี้' });
    }

    const route = plan.routes.find((r) => r.riderId === riderId);
    if (!route) {
      return res.status(404).json({ success: false, message: `ไรเดอร์รหัส ${riderId} ไม่ได้รับมอบหมายงานในรอบนี้` });
    }

    const completedStops = route.stops.filter((s) => s.status === 'delivered').length;
    const progressPercent = route.stops.length > 0 ? Math.round((completedStops / route.stops.length) * 100) : 0;

    res.json({
      success: true,
      data: {
        rider: route.rider,
        depot: plan.restaurantLocation,
        totalBoxes: route.totalBoxes,
        totalStops: route.stops.length,
        completedStops,
        progressPercent,
        totalDistanceKm: route.totalDistanceKm,
        estimatedDurationMinutes: route.estimatedDurationMinutes,
        color: route.color,
        stops: route.stops,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// PATCH /api/dispatch/stops/:orderId/deliver - ไรเดอร์กดปุ่ม "ส่งสำเร็จ"
dispatchRouter.patch('/stops/:orderId/deliver', (req: Request, res: Response) => {
  try {
    const orderId = parseInt(req.params.orderId);
    const success = routingService.markStopDelivered(orderId);
    if (!success) {
      return res.status(404).json({ success: false, message: 'ไม่พบออเดอร์นี้' });
    }
    res.json({
      success: true,
      message: `บันทึกการส่งออเดอร์ #${orderId} เรียบร้อยแล้ว`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

// POST /api/dispatch/reset - รีเซ็ตสถานะการจัดส่ง
dispatchRouter.post('/reset', (req: Request, res: Response) => {
  try {
    const plan = routingService.resetDispatch();
    res.json({
      success: true,
      message: 'รีเซ็ตสถานะการจัดส่งเรียบร้อยแล้ว',
      data: plan,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});
