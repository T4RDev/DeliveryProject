import { RiderRoute, Order } from '../models/delivery.model';

// คำนวณความคืบหน้าการส่งอาหารของไรเดอร์ (จำนวนจุดที่ส่งสำเร็จ และเปอร์เซ็นต์ %)
export function calculateRiderProgress(
  rider: RiderRoute,
  completedStops: { [key: string]: boolean }
): { completed: number; total: number; percent: number } {
  const customerStops = rider.stops.filter((s) => s.type === 'customer');
  const total = customerStops.length;
  let completed = 0;

  customerStops.forEach((s) => {
    const key = `rider_${rider.riderId}_step_${s.step}`;
    if (completedStops[key]) {
      completed++;
    }
  });

  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
}

// จัดรูปแบบข้อความลำดับการจัดส่ง: 'จุดที่ 1 ต้องไปส่งบ้านคุณ A -> จุดที่ 2 ... -> เสร็จแล้วให้ขับกลับร้าน'
export function formatRiderRouteSummary(rider: RiderRoute): string {
  const customerStops = rider.stops.filter((s) => s.type === 'customer');
  if (customerStops.length === 0) return 'ไม่มีรายการจัดส่ง';

  const textSeq = customerStops
    .map((s, idx) => `จุดที่ ${idx + 1} ต้องไปส่งบ้านคุณ ${s.name}`)
    .join(' -> ');

  return `${textSeq} -> เสร็จแล้วให้ขับกลับร้าน`;
}

// คำนวณสรุปตัวเลขกล่องและสถานะของออเดอร์ทั้งหมด
export function calculateOrderSummary(orders: Order[]): {
  totalCount: number;
  totalBoxes: number;
  pendingCount: number;
  deliveredCount: number;
} {
  const totalCount = orders.length;
  const totalBoxes = orders.reduce((sum, o) => sum + o.boxCount, 0);
  const pendingCount = orders.filter((o) => o.status !== 'delivered').length;
  const deliveredCount = orders.filter((o) => o.status === 'delivered').length;

  return { totalCount, totalBoxes, pendingCount, deliveredCount };
}
