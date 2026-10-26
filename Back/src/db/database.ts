import { Customer } from '../models/Customer';
import { Order } from '../models/Order';

export interface MsuLandmark {
  name: string;
  category: string;
  address: string;
  lat: number;
  lng: number;
}

// พิกัดจุดศูนย์กลางร้าน: ศูนย์อาหารตลาดน้อย มหาวิทยาลัยมหาสารคาม (มมส. ขามเรียง)
export const DEPOT_LOCATION = {
  name: 'ศูนย์อาหารตลาดน้อย มมส.',
  category: 'ร้านอาหาร/จุดศูนย์กลาง',
  address: 'ศูนย์อาหารตลาดน้อย มหาวิทยาลัยมหาสารคาม (มมส. ขามเรียง)',
  lat: 16.2465,
  lng: 103.2510,
};

// พิกัดแลนด์มาร์กสำคัญรอบ มมส. ขามเรียง (ระยะทางรัศมีประมาณ 0.3 - 1.8 กม. จากตลาดน้อย)
export const MSU_LANDMARKS: MsuLandmark[] = [
  { name: 'คณะเทคโนโลยีสารสนเทศ (IT MSU)', category: 'คณะ', address: 'คณะเทคโนโลยีสารสนเทศ (IT MSU) มหาวิทยาลัยมหาสารคาม ขามเรียง', lat: 16.2445, lng: 103.2500 },
  { name: 'อาคารวิทยบริการ (หอสมุดกลาง มมส.)', category: 'อาคารกลาง', address: 'อาคารวิทยบริการ (หอสมุดกลาง มมส.) ขามเรียง', lat: 16.2475, lng: 103.2520 },
  { name: 'อาคารบรมราชกุมารี (สนง.อธิการบดี)', category: 'อาคารกลาง', address: 'อาคารบรมราชกุมารี สำนักงานอธิการบดี มหาวิทยาลัยมหาสารคาม', lat: 16.2490, lng: 103.2515 },
  { name: 'คณะการบัญชีและการจัดการ (MBS)', category: 'คณะ', address: 'คณะการบัญชีและการจัดการ (MBS) มหาวิทยาลัยมหาสารคาม ขามเรียง', lat: 16.2435, lng: 103.2530 },
  { name: 'คณะวิศวกรรมศาสตร์ มมส.', category: 'คณะ', address: 'คณะวิศวกรรมศาสตร์ มหาวิทยาลัยมหาสารคาม ขามเรียง', lat: 16.2420, lng: 103.2510 },
  { name: 'ตึกสิริวิทย์ คณะศึกษาศาสตร์', category: 'คณะ', address: 'ตึกสิริวิทย์ คณะศึกษาศาสตร์ มหาวิทยาลัยมหาสารคาม ขามเรียง', lat: 16.2450, lng: 103.2540 },
  { name: 'ศูนย์อาหารกลาง (Complex มมส.)', category: 'ร้านอาหาร/ส่วนกลาง', address: 'ศูนย์อาหารกลาง (Complex มมส.) มหาวิทยาลัยมหาสารคาม ขามเรียง', lat: 16.2480, lng: 103.2545 },
  { name: 'โรงพยาบาลสุทธาเวช มมส.', category: 'โรงพยาบาล', address: 'โรงพยาบาลสุทธาเวช คณะแพทยศาสตร์ มหาวิทยาลัยมหาสารคาม', lat: 16.2520, lng: 103.2535 },
  { name: 'คณะมนุษยศาสตร์และสังคมศาสตร์', category: 'คณะ', address: 'คณะมนุษยศาสตร์และสังคมศาสตร์ มหาวิทยาลัยมหาสารคาม ขามเรียง', lat: 16.2460, lng: 103.2535 },
  { name: 'คณะสาธารณสุขศาสตร์ มมส.', category: 'คณะ', address: 'คณะสาธารณสุขศาสตร์ มหาวิทยาลัยมหาสารคาม ขามเรียง', lat: 16.2425, lng: 103.2490 },
  { name: 'หอพักสุขสบาย ซอยวุ่นวาย ขามเรียง', category: 'หอพัก', address: 'หอพักสุขสบาย ซอยวุ่นวาย ตำบลขามเรียง อำเภอกันทรวิชัย', lat: 16.2495, lng: 103.2460 },
  { name: 'คอนโดเดอะพาร์ค มมส.', category: 'หอพัก/คอนโด', address: 'คอนโดเดอะพาร์ค มมส. ตำบลขามเรียง อำเภอกันทรวิชัย', lat: 16.2510, lng: 103.2480 },
  { name: 'หอพักอินเตอร์ มมส. ขามเรียง', category: 'หอพัก', address: 'หอพักอินเตอร์ มมส. ตำบลขามเรียง อำเภอกันทรวิชัย', lat: 16.2470, lng: 103.2450 },
  { name: 'หอพักชื่นชม มมส.', category: 'หอพัก', address: 'หอพักชื่นชม หลัง มมส. ขามเรียง อำเภอกันทรวิชัย', lat: 16.2440, lng: 103.2445 },
  { name: 'ศูนย์อาหารตลาดน้อย มมส.', category: 'ร้านอาหาร/ส่วนกลาง', address: 'ศูนย์อาหารตลาดน้อย มหาวิทยาลัยมหาสารคาม (มมส. ขามเรียง)', lat: 16.2465, lng: 103.2510 },
];

// คำนวณระยะทางระหว่างพิกัด 2 จุด (Haversine Formula คืนค่าเป็นกิโลเมตร)
export function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // รัศมีโลกเฉลี่ย (km)
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export class Database {
  private customers: Customer[] = [];
  private orders: Order[] = [];
  private nextCustomerId = 1;
  private nextOrderId = 1;

  constructor() {
    this.seedInitialCustomers();
    this.generateMockOrders(24);
  }

  getMsuLandmarks(): MsuLandmark[] {
    return MSU_LANDMARKS;
  }

  getDepotLocation() {
    return DEPOT_LOCATION;
  }

  private seedInitialCustomers() {
    const rawCustomers = [
      { firstName: 'สมชาย', lastName: 'มีโชคดี', phone: '089-123-4567', landmark: MSU_LANDMARKS[5] },
      { firstName: 'นงนุช', lastName: 'แสนสุข', phone: '081-987-6543', landmark: MSU_LANDMARKS[2] },
      { firstName: 'กิตติพงษ์', lastName: 'วรดิลก', phone: '086-555-1234', landmark: MSU_LANDMARKS[0] },
      { firstName: 'ศิริพร', lastName: 'สุขใจ', phone: '087-444-9876', landmark: MSU_LANDMARKS[1] },
      { firstName: 'ธีรเดช', lastName: 'เจริญผล', phone: '082-333-7890', landmark: MSU_LANDMARKS[10] },
      { firstName: 'พิมพา', lastName: 'จิตรจำนงค์', phone: '085-111-4567', landmark: MSU_LANDMARKS[11] },
      { firstName: 'อนุสรณ์', lastName: 'เกียรติขจร', phone: '084-222-8765', landmark: MSU_LANDMARKS[4] },
      { firstName: 'สุดารัตน์', lastName: 'เลิศวิไล', phone: '083-777-6543', landmark: MSU_LANDMARKS[6] },
      { firstName: 'ปกรณ์', lastName: 'ทองหล่อ', phone: '088-999-3210', landmark: MSU_LANDMARKS[12] },
      { firstName: 'วราภรณ์', lastName: 'คงมั่น', phone: '089-666-4321', landmark: MSU_LANDMARKS[7] },
    ];

    for (const c of rawCustomers) {
      this.customers.push({
        id: this.nextCustomerId++,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        address: c.landmark.address,
        lat: c.landmark.lat,
        lng: c.landmark.lng,
        createdAt: new Date().toISOString(),
      });
    }
  }

  getAllCustomers(): Customer[] {
    return [...this.customers];
  }

  getCustomerById(id: number): Customer | undefined {
    return this.customers.find((c) => c.id === id);
  }

  findCustomerByPhone(phone: string): Customer | undefined {
    const cleanPhone = phone.replace(/[-\s]/g, '');
    return this.customers.find((c) => c.phone.replace(/[-\s]/g, '') === cleanPhone);
  }

  searchCustomers(query: string): Customer[] {
    const q = query.trim().toLowerCase();
    if (!q) return this.getAllCustomers();
    return this.customers.filter(
      (c) =>
        c.firstName.toLowerCase().includes(q) ||
        c.lastName.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.address.toLowerCase().includes(q)
    );
  }

  // ค้นหาลูกค้าในระยะทางที่กำหนด (เช่น รัศมี 1 กิโลเมตร ตามโจทย์ HW-5)
  findCustomersNearby(lat: number, lng: number, radiusKm = 1.0): Customer[] {
    return this.customers.filter((c) => {
      const cLat = c.lat ?? DEPOT_LOCATION.lat;
      const cLng = c.lng ?? DEPOT_LOCATION.lng;
      const dist = calculateDistanceKm(lat, lng, cLat, cLng);
      return dist <= radiusKm;
    });
  }

  createCustomer(data: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    lat?: number;
    lng?: number;
  }): Customer {
    const cleanPhone = data.phone.replace(/[-\s]/g, '');
    const existing = this.customers.find(
      (c) => c.phone.replace(/[-\s]/g, '') === cleanPhone
    );

    // หาพิกัดจากแลนด์มาร์กที่ตรงกับที่อยู่
    let finalLat = data.lat;
    let finalLng = data.lng;
    if (!finalLat || !finalLng) {
      const matched = MSU_LANDMARKS.find((lm) =>
        data.address.includes(lm.name) || lm.address.includes(data.address)
      );
      if (matched) {
        finalLat = matched.lat;
        finalLng = matched.lng;
      } else {
        finalLat = DEPOT_LOCATION.lat + (Math.random() - 0.5) * 0.008;
        finalLng = DEPOT_LOCATION.lng + (Math.random() - 0.5) * 0.008;
      }
    }

    if (existing) {
      existing.firstName = data.firstName;
      existing.lastName = data.lastName;
      existing.address = data.address;
      existing.lat = finalLat;
      existing.lng = finalLng;
      existing.updatedAt = new Date().toISOString();
      return existing;
    }

    const newCust: Customer = {
      id: this.nextCustomerId++,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address,
      lat: finalLat,
      lng: finalLng,
      createdAt: new Date().toISOString(),
    };
    this.customers.push(newCust);
    return newCust;
  }

  updateCustomer(id: number, data: Partial<Customer>): Customer | null {
    const index = this.customers.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.customers[index] = {
      ...this.customers[index],
      ...data,
      updatedAt: new Date().toISOString(),
    };
    return this.customers[index];
  }

  deleteCustomer(id: number): boolean {
    const initialLen = this.customers.length;
    this.customers = this.customers.filter((c) => c.id !== id);
    return this.customers.length < initialLen;
  }

  getAllOrders(query = ''): Order[] {
    const q = query.trim().toLowerCase();
    const enriched = this.orders.map((o) => ({
      ...o,
      customer: this.getCustomerById(o.customerId),
    }));

    if (!q) return enriched;

    return enriched.filter((o) => {
      const matchCustomer =
        o.customer &&
        (o.customer.firstName.toLowerCase().includes(q) ||
          o.customer.lastName.toLowerCase().includes(q) ||
          o.customer.phone.includes(q) ||
          o.customer.address.toLowerCase().includes(q));
      const matchNote = o.note && o.note.toLowerCase().includes(q);
      const matchId = String(o.id) === q;
      return matchCustomer || matchNote || matchId;
    });
  }

  // ค้นหารายการสั่งซื้อในระยะที่กำหนด (เช่น รัศมี 2 กิโลเมตร ตามโจทย์ HW-5)
  findOrdersNearby(lat: number, lng: number, radiusKm = 2.0): Order[] {
    const all = this.getAllOrders();
    return all.filter((o) => {
      const c = o.customer;
      if (!c) return false;
      const cLat = c.lat ?? DEPOT_LOCATION.lat;
      const cLng = c.lng ?? DEPOT_LOCATION.lng;
      const dist = calculateDistanceKm(lat, lng, cLat, cLng);
      return dist <= radiusKm;
    });
  }

  getOrderById(id: number): Order | undefined {
    const order = this.orders.find((o) => o.id === id);
    if (!order) return undefined;
    return {
      ...order,
      customer: this.getCustomerById(order.customerId),
    };
  }

  createOrder(data: {
    customerId: number;
    boxCount: number;
    note?: string;
  }): Order {
    const now = new Date();
    const timeString = `${String(now.getHours()).padStart(2, '0')}:${String(
      now.getMinutes()
    ).padStart(2, '0')}:00`;

    const newOrder: Order = {
      id: this.nextOrderId++,
      customerId: data.customerId,
      boxCount: data.boxCount,
      orderTime: timeString,
      deliveryDeadline: '12:30:00',
      status: 'pending',
      note: data.note || 'ข้าวกล่องมื้อเที่ยง มมส.',
    };
    this.orders.push(newOrder);
    return {
      ...newOrder,
      customer: this.getCustomerById(newOrder.customerId),
    };
  }

  updateOrder(
    id: number,
    data: {
      boxCount?: number;
      status?: 'pending' | 'in_transit' | 'delivered' | 'cancelled';
      deliveredAt?: string;
      note?: string;
    }
  ): Order | null {
    const index = this.orders.findIndex((o) => o.id === id);
    if (index === -1) return null;
    this.orders[index] = {
      ...this.orders[index],
      ...data,
    };
    return {
      ...this.orders[index],
      customer: this.getCustomerById(this.orders[index].customerId),
    };
  }

  deleteOrder(id: number): boolean {
    const initialLen = this.orders.length;
    this.orders = this.orders.filter((o) => o.id !== id);
    return this.orders.length < initialLen;
  }

  generateMockOrders(count = 24): Order[] {
    const firstNames = [
      'สมชาย', 'วิภา', 'ธนากร', 'ศิริรัตน์', 'อานนท์', 'พรทิพย์',
      'ณัฐวุฒิ', 'กัญญารัตน์', 'พีรพล', 'ลลิตา', 'ปิยะ', 'สุพัตรา',
      'ชนาธิป', 'วรรณภา', 'เอกราช', 'จิดาภา', 'ธีระ', 'ภัทราภรณ์'
    ];
    const lastNames = [
      'มีสุข', 'บุญชู', 'วงษ์สุวรรณ', 'ทองดี', 'รัตนโกสินทร์', 'ศรีสวัสดิ์',
      'เจริญกุล', 'ตั้งตรงจิตร', 'คงกระพัน', 'สมบูรณ์', 'ทรัพย์เจริญ'
    ];

    const generatedOrders: Order[] = [];

    for (let i = 0; i < count; i++) {
      const fName = firstNames[i % firstNames.length];
      const lName = lastNames[i % lastNames.length];
      const phone = `08${Math.floor(10000000 + Math.random() * 90000000)}`;
      const landmark = MSU_LANDMARKS[i % MSU_LANDMARKS.length];

      // สุ่มขยับพิกัดเล็กน้อยไม่ให้ทับจุดเดียวกันเป๊ะ
      const jitterLat = (Math.random() - 0.5) * 0.001;
      const jitterLng = (Math.random() - 0.5) * 0.001;

      const customer = this.createCustomer({
        firstName: fName,
        lastName: lName,
        phone,
        address: landmark.address,
        lat: landmark.lat + jitterLat,
        lng: landmark.lng + jitterLng,
      });

      const boxCount = Math.floor(Math.random() * 3) + 1;

      const order: Order = {
        id: this.nextOrderId++,
        customerId: customer.id,
        boxCount,
        orderTime: `10:${String(Math.floor(Math.random() * 45) + 10).padStart(2, '0')}:00`,
        deliveryDeadline: '12:30:00',
        status: 'pending',
        note: `ข้าวกล่องส่งมื้อเที่ยง ${boxCount} กล่อง`,
      };
      this.orders.push(order);
      generatedOrders.push({
        ...order,
        customer,
      });
    }

    return generatedOrders;
  }

  clearOrders(): void {
    this.orders = [];
  }
}

export const db = new Database();
