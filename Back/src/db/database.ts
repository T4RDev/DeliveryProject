import { Customer } from '../models/Customer';
import { Order } from '../models/Order';
import { Rider } from '../models/Rider';

export interface MsuLandmark {
  name: string;
  category: string;
  address: string;
  latitude: number;
  longitude: number;
}

export const RESTAURANT_DEPOT = {
  name: 'ร้านส่งด่วนมื้อเที่ยง (ตลาดน้อย มมส.)',
  address: 'ศูนย์อาหารตลาดน้อย มหาวิทยาลัยมหาสารคาม (มมส. ขามเรียง) ตำบลขามเรียง อำเภอกันทรวิชัย จังหวัดมหาสารคาม',
  latitude: 16.2435,
  longitude: 103.2545,
};

export const MSU_LANDMARKS: MsuLandmark[] = [
  { name: 'คณะเทคโนโลยีสารสนเทศ (IT MSU)', category: 'คณะ', address: 'คณะเทคโนโลยีสารสนเทศ (IT MSU) มหาวิทยาลัยมหาสารคาม ขามเรียง', latitude: 16.2405, longitude: 103.2585 },
  { name: 'อาคารวิทยบริการ (หอสมุดกลาง มมส.)', category: 'อาคารกลาง', address: 'อาคารวิทยบริการ (หอสมุดกลาง มมส.) ขามเรียง', latitude: 16.2486, longitude: 103.2563 },
  { name: 'อาคารบรมราชกุมารี (สนง.อธิการบดี)', category: 'อาคารกลาง', address: 'อาคารบรมราชกุมารี สำนักงานอธิการบดี มหาวิทยาลัยมหาสารคาม', latitude: 16.2477, longitude: 103.2514 },
  { name: 'คณะการบัญชีและการจัดการ (MBS)', category: 'คณะ', address: 'คณะการบัญชีและการจัดการ (MBS) มหาวิทยาลัยมหาสารคาม ขามเรียง', latitude: 16.2420, longitude: 103.2510 },
  { name: 'คณะวิศวกรรมศาสตร์ มมส.', category: 'คณะ', address: 'คณะวิศวกรรมศาสตร์ มหาวิทยาลัยมหาสารคาม ขามเรียง', latitude: 16.2383, longitude: 103.2577 },
  { name: 'ตึกสิริวิทย์ คณะศึกษาศาสตร์', category: 'คณะ', address: 'ตึกสิริวิทย์ คณะศึกษาศาสตร์ มหาวิทยาลัยมหาสารคาม ขามเรียง', latitude: 16.2470, longitude: 103.2570 },
  { name: 'ศูนย์อาหารกลาง (Complex มมส.)', category: 'ร้านอาหาร/ส่วนกลาง', address: 'ศูนย์อาหารกลาง (Complex มมส.) มหาวิทยาลัยมหาสารคาม ขามเรียง', latitude: 16.2473, longitude: 103.2607 },
  { name: 'โรงพยาบาลสุทธาเวช มมส.', category: 'โรงพยาบาล', address: 'โรงพยาบาลสุทธาเวช คณะแพทยศาสตร์ มหาวิทยาลัยมหาสารคาม', latitude: 16.2495, longitude: 103.2497 },
  { name: 'คณะมนุษยศาสตร์และสังคมศาสตร์', category: 'คณะ', address: 'คณะมนุษยศาสตร์และสังคมศาสตร์ มหาวิทยาลัยมหาสารคาม ขามเรียง', latitude: 16.2455, longitude: 103.2530 },
  { name: 'คณะสาธารณสุขศาสตร์ มมส.', category: 'คณะ', address: 'คณะสาธารณสุขศาสตร์ มหาวิทยาลัยมหาสารคาม ขามเรียง', latitude: 16.2410, longitude: 103.2560 },
  { name: 'หอพักสุขสบาย ซอยวุ่นวาย ขามเรียง', category: 'หอพัก', address: 'หอพักสุขสบาย ซอยวุ่นวาย ตำบลขามเรียง อำเภอกันทรวิชัย', latitude: 16.2390, longitude: 103.2503 },
  { name: 'คอนโดเดอะพาร์ค มมส.', category: 'หอพัก/คอนโด', address: 'คอนโดเดอะพาร์ค มมส. ตำบลขามเรียง อำเภอกันทรวิชัย', latitude: 16.2457, longitude: 103.2490 },
  { name: 'หอพักอินเตอร์ มมส. ขามเรียง', category: 'หอพัก', address: 'หอพักอินเตอร์ มมส. ตำบลขามเรียง อำเภอกันทรวิชัย', latitude: 16.2399, longitude: 103.2485 },
  { name: 'หอพักชื่นชม มมส.', category: 'หอพัก', address: 'หอพักชื่นชม หลัง มมส. ขามเรียง อำเภอกันทรวิชัย', latitude: 16.2465, longitude: 103.2480 },
  { name: 'ศูนย์อาหารตลาดน้อย มมส. (จุดตั้งร้าน)', category: 'ร้านอาหาร/ส่วนกลาง', address: 'ศูนย์อาหารตลาดน้อย มหาวิทยาลัยมหาสารคาม (มมส. ขามเรียง)', latitude: 16.2435, longitude: 103.2545 },
];

export function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLon / 2) *
    Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 100) / 100;
}

export class Database {
  private customers: Customer[] = [];
  private orders: Order[] = [];
  private riders: Rider[] = [];
  private nextCustomerId = 1;
  private nextOrderId = 1;

  constructor() {
    this.seedRiders();
    this.seedInitialCustomers();
    this.generateMockOrders(24);
  }

  private seedRiders() {
    this.riders = [
      { id: 1, name: 'ไรเดอร์ สมชาย (คันที่ 1)', phone: '081-111-2233', maxCapacity: 10, color: '#EF4444', status: 'available' },
      { id: 2, name: 'ไรเดอร์ วีระ (คันที่ 2)', phone: '082-222-3344', maxCapacity: 10, color: '#10B981', status: 'available' },
      { id: 3, name: 'ไรเดอร์ มานะ (คันที่ 3)', phone: '083-333-4455', maxCapacity: 10, color: '#3B82F6', status: 'available' },
      { id: 4, name: 'ไรเดอร์ ธวัช (คันที่ 4)', phone: '084-444-5566', maxCapacity: 10, color: '#F59E0B', status: 'available' },
      { id: 5, name: 'ไรเดอร์ อนุชา (คันที่ 5)', phone: '085-555-6677', maxCapacity: 10, color: '#8B5CF6', status: 'available' },
      { id: 6, name: 'ไรเดอร์ สันติ (คันที่ 6)', phone: '086-666-7788', maxCapacity: 10, color: '#EC4899', status: 'available' },
    ];
  }

  getRiders(): Rider[] {
    return [...this.riders];
  }

  getRiderById(id: number): Rider | undefined {
    return this.riders.find((r) => r.id === id);
  }

  getMsuLandmarks(): MsuLandmark[] {
    return MSU_LANDMARKS;
  }

  /**
   * ค้นหาพิกัดแผนที่จริงใน มมส. โดยอ้างอิงจากชื่อสถานที่หรือที่อยู่จริง
   */
  resolveAddressLocation(address: string): { latitude: number; longitude: number } {
    const clean = address.trim().toLowerCase();
    for (const lm of MSU_LANDMARKS) {
      if (
        clean.includes(lm.name.toLowerCase()) ||
        clean.includes(lm.address.toLowerCase()) ||
        lm.name.toLowerCase().includes(clean)
      ) {
        return { latitude: lm.latitude, longitude: lm.longitude };
      }
    }

    if (clean.includes('it') || clean.includes('สารสนเทศ')) return { latitude: 16.2405, longitude: 103.2585 };
    if (clean.includes('วิศว') || clean.includes('en')) return { latitude: 16.2383, longitude: 103.2577 };
    if (clean.includes('ศึกษา') || clean.includes('สิริวิทย์')) return { latitude: 16.2470, longitude: 103.2570 };
    if (clean.includes('อธิการ') || clean.includes('บรมราช')) return { latitude: 16.2477, longitude: 103.2514 };
    if (clean.includes('หอสมุด') || clean.includes('วิทยบริการ')) return { latitude: 16.2486, longitude: 103.2563 };
    if (clean.includes('complex') || clean.includes('คอมเพล็กซ์')) return { latitude: 16.2473, longitude: 103.2607 };
    if (clean.includes('mbs') || clean.includes('บัญชี')) return { latitude: 16.2420, longitude: 103.2510 };
    if (clean.includes('สุทธาเวช') || clean.includes('แพทย์') || clean.includes('โรงพยาบาล')) return { latitude: 16.2495, longitude: 103.2497 };
    if (clean.includes('วุ่นวาย')) return { latitude: 16.2390, longitude: 103.2503 };
    if (clean.includes('เดอะพาร์ค')) return { latitude: 16.2457, longitude: 103.2490 };

    let hash = 0;
    for (let i = 0; i < address.length; i++) hash = (hash << 5) - hash + address.charCodeAt(i);
    const angle = Math.abs(hash) % 360;
    const rad = (angle * Math.PI) / 180;
    const dist = 0.003 + (Math.abs(hash >> 3) % 40) * 0.0001;
    return {
      latitude: Math.round((RESTAURANT_DEPOT.latitude + Math.sin(rad) * dist) * 1000000) / 1000000,
      longitude: Math.round((RESTAURANT_DEPOT.longitude + Math.cos(rad) * dist) * 1000000) / 1000000,
    };
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
        latitude: c.landmark.latitude,
        longitude: c.landmark.longitude,
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

  getCustomersNearby(lat: number, lng: number, radiusKm: number): Array<Customer & { distanceKm: number }> {
    return this.customers
      .map((c) => ({
        ...c,
        distanceKm: calculateDistanceKm(lat, lng, c.latitude ?? RESTAURANT_DEPOT.latitude, c.longitude ?? RESTAURANT_DEPOT.longitude),
      }))
      .filter((c) => c.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer {
    let lat = data.latitude;
    let lng = data.longitude;

    if (lat === undefined || lng === undefined) {
      const resolved = this.resolveAddressLocation(data.address);
      lat = resolved.latitude;
      lng = resolved.longitude;
    }

    const newCustomer: Customer = {
      id: this.nextCustomerId++,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address,
      latitude: lat,
      longitude: lng,
      createdAt: new Date().toISOString(),
    };
    this.customers.push(newCustomer);
    return newCustomer;
  }

  updateCustomer(id: number, data: Partial<Customer>): Customer | null {
    const index = this.customers.findIndex((c) => c.id === id);
    if (index === -1) return null;
    this.customers[index] = {
      ...this.customers[index],
      ...data,
      id,
      updatedAt: new Date().toISOString(),
    };
    return this.customers[index];
  }

  deleteCustomer(id: number): boolean {
    const initialLen = this.customers.length;
    this.customers = this.customers.filter((c) => c.id !== id);
    this.orders = this.orders.filter((o) => o.customerId !== id);
    return this.customers.length < initialLen;
  }

  getAllOrders(query?: string): Order[] {
    const list = this.orders.map((o) => ({
      ...o,
      customer: this.getCustomerById(o.customerId),
    }));
    if (!query || !query.trim()) return list;
    const q = query.trim().toLowerCase();
    return list.filter(
      (o) =>
        o.id.toString() === q ||
        o.customer?.firstName.toLowerCase().includes(q) ||
        o.customer?.lastName.toLowerCase().includes(q) ||
        o.customer?.phone.includes(q) ||
        o.customer?.address.toLowerCase().includes(q) ||
        (o.note && o.note.toLowerCase().includes(q))
    );
  }

  getOrderById(id: number): Order | undefined {
    const order = this.orders.find((o) => o.id === id);
    if (!order) return undefined;
    return {
      ...order,
      customer: this.getCustomerById(order.customerId),
    };
  }

  createOrder(data: { customerId: number; boxCount: number; note?: string }): Order {
    const orderTime = new Date();
    const timeString = `${String(orderTime.getHours()).padStart(2, '0')}:${String(
      orderTime.getMinutes()
    ).padStart(2, '0')}:${String(orderTime.getSeconds()).padStart(2, '0')}`;

    const newOrder: Order = {
      id: this.nextOrderId++,
      customerId: data.customerId,
      boxCount: data.boxCount,
      orderTime: timeString,
      deliveryDeadline: '12:30:00',
      status: 'pending',
      note: data.note || 'มื้อเที่ยงส่งด่วน มมส.',
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
      status?: 'pending' | 'assigned' | 'in_transit' | 'delivered' | 'cancelled';
      assignedRiderId?: number;
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

  getOrdersNearby(centerLat: number, centerLng: number, radiusKm: number): Order[] {
    return this.getAllOrders().filter((o) => {
      const custLat = o.customer?.latitude ?? RESTAURANT_DEPOT.latitude;
      const custLng = o.customer?.longitude ?? RESTAURANT_DEPOT.longitude;
      const dist = calculateDistanceKm(centerLat, centerLng, custLat, custLng);
      return dist <= radiusKm;
    });
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

      const customer = this.createCustomer({
        firstName: fName,
        lastName: lName,
        phone,
        address: landmark.address,
        latitude: landmark.latitude,
        longitude: landmark.longitude,
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
    for (const r of this.riders) {
      r.status = 'available';
    }
  }
}

export const db = new Database();
