export const PRICE_PER_BOX = 65; // ราคาขายกล่องละ 65 บาท
export const FOOD_COST_PER_BOX = 40; // ต้นทุนอาหารกล่องละ 40 บาท
export const RIDER_BASE_FEE = 15; // ค่าเรียกไรเดอร์เริ่มต้น 15 บาท
export const RIDER_RATE_PER_KM_PER_BOX = 2; // อัตรา 2 บาท ต่อ กม. ต่อ กล่อง
export const AVERAGE_SPEED_KMH = 30; // ความเร็วเฉลี่ย 30 กม./ชม.
export const SERVICE_TIME_PER_STOP_MIN = 2; // เวลาส่งมอบอาหารจุดละ 2 นาที

export interface FinancialSummary {
  pricePerBox: number;
  foodCostPerBox: number;
  totalBoxes: number;
  totalRevenue: number;
  totalFoodCost: number;
  totalRiderCost: number;
  grossProfit: number;
  netProfit: number;
  isProfitable: boolean;
}

// คำนวณค่าจ้างไรเดอร์: 15 บาท + (2 บาท x กม. x จำนวนกล่อง)
export function calculateRiderCost(distanceKm: number, totalBoxes: number): number {
  if (totalBoxes === 0 || distanceKm === 0) return 0;
  const cost = RIDER_BASE_FEE + distanceKm * RIDER_RATE_PER_KM_PER_BOX * totalBoxes;
  return Math.round(cost * 100) / 100;
}

// คำนวณเวลาในการจัดส่ง (นาที): เวลาเดินทาง + เวลาจอดส่งมอบอาหาร
export function calculateEstimatedMinutes(distanceKm: number, orderCount: number): number {
  const travelMinutes = (distanceKm / AVERAGE_SPEED_KMH) * 60;
  const deliveryMinutes = orderCount * SERVICE_TIME_PER_STOP_MIN;
  return Math.max(5, Math.round(travelMinutes + deliveryMinutes));
}

// คำนวณสรุปยอดขาย ต้นทุนอาหาร ค่าส่งไรเดอร์ และกำไรสุทธิ
export function calculateFinancialSummary(
  riderCosts: number[],
  totalBoxes: number
): FinancialSummary {
  const totalRevenue = totalBoxes * PRICE_PER_BOX;
  const totalFoodCost = totalBoxes * FOOD_COST_PER_BOX;
  const totalRiderCost = Math.round(riderCosts.reduce((sum, cost) => sum + cost, 0) * 100) / 100;
  const grossProfit = totalRevenue - totalFoodCost;
  const netProfit = Math.round((grossProfit - totalRiderCost) * 100) / 100;

  return {
    pricePerBox: PRICE_PER_BOX,
    foodCostPerBox: FOOD_COST_PER_BOX,
    totalBoxes,
    totalRevenue,
    totalFoodCost,
    totalRiderCost,
    grossProfit,
    netProfit,
    isProfitable: netProfit >= 0,
  };
}
