import { MsuLandmark, DeliveryStop, Order } from '../models/delivery.model';

// ข้อมูลจุดศูนย์กลางเริ่มต้น (ร้านศูนย์อาหารตลาดน้อย มมส.)
export const DEFAULT_DEPOT = {
  name: 'ศูนย์อาหารตลาดน้อย มมส.',
  category: 'ร้านอาหาร/จุดศูนย์กลาง',
  address: 'ศูนย์อาหารตลาดน้อย มหาวิทยาลัยมหาสารคาม (มมส. ขามเรียง)',
  lat: 16.2465,
  lng: 103.2510,
};

// พิกัดสถานที่สำคัญรอบ มมส. ขามเรียง (GPS Landmarks)
export const DEFAULT_MSU_LANDMARKS: MsuLandmark[] = [
  { name: 'คณะเทคโนโลยีสารสนเทศ (IT MSU)', category: 'คณะ', address: 'คณะเทคโนโลยีสารสนเทศ (IT MSU) มหาวิทยาลัยมหาสารคาม ขามเรียง', lat: 16.2445, lng: 103.2500 },
  { name: 'อาคารวิทยบริการ (หอสมุดกลาง มมส.)', category: 'อาคารกลาง', address: 'อาคารวิทยบริการ (หอสมุดกลาง มมส.) ขามเรียง', lat: 16.2475, lng: 103.2520 },
  { name: 'อาคารบรมราชกุมารี (สำนักงานอธิการบดี)', category: 'อาคารกลาง', address: 'อาคารบรมราชกุมารี สำนักงานอธิการบดี มหาวิทยาลัยมหาสารคาม', lat: 16.2490, lng: 103.2515 },
  { name: 'คณะการบัญชีและการจัดการ (MBS)', category: 'คณะ', address: 'คณะการบัญชีและการจัดการ (MBS) มหาวิทยาลัยมหาสารคาม ขามเรียง', lat: 16.2435, lng: 103.2530 },
  { name: 'คณะวิศวกรรมศาสตร์ มมส.', category: 'คณะ', address: 'คณะวิศวกรรมศาสตร์ มหาวิทยาลัยมหาสารคาม ขามเรียง', lat: 16.2420, lng: 103.2510 },
  { name: 'ตึกสิริวิทย์ คณะศึกษาศาสตร์', category: 'คณะ', address: 'ตึกสิริวิทย์ คณะศึกษาศาสตร์ มหาวิทยาลัยมหาสารคาม ขามเรียง', lat: 16.2450, lng: 103.2540 },
  { name: 'ศูนย์อาหารกลาง (Complex มมส.)', category: 'ร้านอาหาร/ส่วนกลาง', address: 'ศูนย์อาหารกลาง (Complex มมส.) มหาวิทยาลัยมหาสารคาม ขามเรียง', lat: 16.2480, lng: 103.2545 },
  { name: 'โรงพยาบาลสุทธาเวช มมส.', category: 'โรงพยาบาล', address: 'โรงพยาบาลสุทธาเวช คณะแพทยศาสตร์ มหาวิทยาลัยมหาสารคาม', lat: 16.2520, lng: 103.2535 },
  { name: 'คณะมนุษยศาสตร์และสังคมศาสตร์', category: 'คณะ', address: 'คณะมนุษยศาสตร์และสังคมศาสตร์ มหาวิทยาลัยมหาสารคาม', lat: 16.2460, lng: 103.2535 },
  { name: 'คณะสาธารณสุขศาสตร์ มมส.', category: 'คณะ', address: 'คณะสาธารณสุขศาสตร์ มหาวิทยาลัยมหาสารคาม ขามเรียง', lat: 16.2425, lng: 103.2490 },
  { name: 'หอพักสุขสบาย ซอยวุ่นวาย ขามเรียง', category: 'หอพัก', address: 'หอพักสุขสบาย ซอยวุ่นวาย ตำบลขามเรียง อำเภอกันทรวิชัย', lat: 16.2495, lng: 103.2460 },
  { name: 'คอนโดเดอะพาร์ค มมส.', category: 'หอพัก/คอนโด', address: 'คอนโดเดอะพาร์ค มมส. ตำบลขามเรียง อำเภอกันทรวิชัย', lat: 16.2510, lng: 103.2480 },
  { name: 'หอพักอินเตอร์ มมส. ขามเรียง', category: 'หอพัก', address: 'หอพักอินเตอร์ มมส. ตำบลขามเรียง อำเภอกันทรวิชัย', lat: 16.2470, lng: 103.2450 },
  { name: 'หอพักชื่นชม มมส.', category: 'หอพัก', address: 'หอพักชื่นชม หลัง มมส. ขามเรียง อำเภอกันทรวิชัย', lat: 16.2440, lng: 103.2445 },
  { name: 'ศูนย์อาหารตลาดน้อย มมส.', category: 'ร้านอาหาร/ส่วนกลาง', address: 'ศูนย์อาหารตลาดน้อย มหาวิทยาลัยมหาสารคาม (มมส. ขามเรียง)', lat: 16.2465, lng: 103.2510 },
];

/**
 * สร้างลิงก์ค้นหาพิกัดบน Google Maps
 */
export function buildGoogleMapsSearchUrl(order: Order): string {
  if (order.customer?.lat && order.customer?.lng) {
    return `https://www.google.com/maps/search/?api=1&query=${order.customer.lat},${order.customer.lng}`;
  }
  const query = `${order.customer?.address || ''} มหาวิทยาลัยมหาสารคาม ขามเรียง`;
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
}

/**
 * สร้างลิงก์เปิด Google Maps Navigation (นำทางขับรถแบบ Turn-by-Turn)
 */
export function buildStopNavigationUrl(stop: DeliveryStop): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`;
}
