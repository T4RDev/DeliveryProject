import { Customer } from '../models/Customer';
import { Order } from '../models/Order';
import { Rider } from '../models/Rider';

export const RESTAURANT_DEPOT = {
  name: 'ร้านส่งด่วนมื้อเที่ยง (ตลาดน้อย มมส.)',
  address: 'ศูนย์อาหารตลาดน้อย มหาวิทยาลัยมหาสารคาม (มมส. ขามเรียง) ตำบลขามเรียง อำเภอกันทรวิชัย จังหวัดมหาสารคาม',
  latitude: 16.2435,
  longitude: 103.2545,
};

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

  private seedInitialCustomers() {
    const rawCustomers = [
      { firstName: 'สมชาย', lastName: 'มีโชคดี', phone: '089-123-4567', address: 'ตึกสิริวิทย์ คณะศึกษาศาสตร์ มมส.', latOffset: 0.0035, lngOffset: 0.0025 },
      { firstName: 'นงนุช', lastName: 'แสนสุข', phone: '081-987-6543', address: 'อาคารบรมราชกุมารี สำนักงานอธิการบดี มมส.', latOffset: 0.0042, lngOffset: -0.0031 },
      { firstName: 'กิตติพงษ์', lastName: 'วรดิลก', phone: '086-555-1234', address: 'คณะเทคโนโลยีสารสนเทศ (IT MSU)', latOffset: -0.0030, lngOffset: 0.0040 },
      { firstName: 'ศิริพร', lastName: 'สุขใจ', phone: '087-444-9876', address: 'อาคารวิทยบริการ (หอสมุดกลาง มมส.)', latOffset: 0.0051, lngOffset: 0.0018 },
      { firstName: 'ธีรเดช', lastName: 'เจริญผล', phone: '082-333-7890', address: 'หอพักสุขสบาย ซอยวุ่นวาย ขามเรียง', latOffset: -0.0045, lngOffset: -0.0042 },
      { firstName: 'พิมพา', lastName: 'จิตรจำนงค์', phone: '085-111-4567', address: 'คอนโดเดอะพาร์ค มมส. ชั้น 4', latOffset: 0.0022, lngOffset: -0.0055 },
      { firstName: 'อนุสรณ์', lastName: 'เกียรติขจร', phone: '084-222-8765', address: 'คณะวิศวกรรมศาสตร์ มมส.', latOffset: -0.0052, lngOffset: 0.0032 },
      { firstName: 'สุดารัตน์', lastName: 'เลิศวิไล', phone: '083-777-6543', address: 'ศูนย์อาหารกลาง (Complex มมส.)', latOffset: 0.0038, lngOffset: 0.0062 },
      { firstName: 'ปกรณ์', lastName: 'ทองหล่อ', phone: '088-999-3210', address: 'หอพักอินเตอร์ มมส. ขามเรียง', latOffset: -0.0036, lngOffset: -0.0060 },
      { firstName: 'วราภรณ์', lastName: 'คงมั่น', phone: '089-666-4321', address: 'โรงพยาบาลสุทธาเวช มมส.', latOffset: 0.0060, lngOffset: -0.0048 },
    ];

    for (const c of rawCustomers) {
      this.customers.push({
        id: this.nextCustomerId++,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        address: c.address,
        latitude: Math.round((RESTAURANT_DEPOT.latitude + c.latOffset) * 1000000) / 1000000,
        longitude: Math.round((RESTAURANT_DEPOT.longitude + c.lngOffset) * 1000000) / 1000000,
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
        distanceKm: calculateDistanceKm(lat, lng, c.latitude, c.longitude),
      }))
      .filter((c) => c.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  createCustomer(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Customer {
    const newCustomer: Customer = {
      id: this.nextCustomerId++,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      address: data.address,
      latitude: data.latitude,
      longitude: data.longitude,
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
    let result = this.orders.map((o) => ({
      ...o,
      customer: this.getCustomerById(o.customerId),
    }));

    if (query && query.trim()) {
      const q = query.trim().toLowerCase();
      result = result.filter((o) => {
        const custName = o.customer ? `${o.customer.firstName} ${o.customer.lastName}`.toLowerCase() : '';
        const phone = o.customer ? o.customer.phone : '';
        const address = o.customer ? o.customer.address.toLowerCase() : '';
        const note = o.note ? o.note.toLowerCase() : '';
        return (
          custName.includes(q) ||
          phone.includes(q) ||
          address.includes(q) ||
          note.includes(q) ||
          String(o.id).includes(q)
        );
      });
    }

    return result;
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
    const safeBoxCount = Math.min(Math.max(1, data.boxCount || 1), 3);
    const order: Order = {
      id: this.nextOrderId++,
      customerId: data.customerId,
      boxCount: safeBoxCount,
      orderTime: '10:45:00',
      deliveryDeadline: '12:30:00',
      status: 'pending',
      note: data.note || '',
    };
    this.orders.push(order);
    return {
      ...order,
      customer: this.getCustomerById(order.customerId),
    };
  }

  updateOrder(id: number, data: Partial<Order>): Order | null {
    const index = this.orders.findIndex((o) => o.id === id);
    if (index === -1) return null;

    if (data.boxCount !== undefined) {
      data.boxCount = Math.min(Math.max(1, data.boxCount), 3);
    }

    this.orders[index] = {
      ...this.orders[index],
      ...data,
      id,
    };
    return this.getOrderById(id) || null;
  }

  deleteOrder(id: number): boolean {
    const initialLen = this.orders.length;
    this.orders = this.orders.filter((o) => o.id !== id);
    return this.orders.length < initialLen;
  }

  getOrdersNearby(lat: number, lng: number, radiusKm: number): Array<Order & { distanceKm: number }> {
    return this.getAllOrders()
      .map((o) => {
        const custLat = o.customer ? o.customer.latitude : RESTAURANT_DEPOT.latitude;
        const custLng = o.customer ? o.customer.longitude : RESTAURANT_DEPOT.longitude;
        const dist = calculateDistanceKm(lat, lng, custLat, custLng);
        return {
          ...o,
          distanceKm: dist,
        };
      })
      .filter((o) => o.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm);
  }

  generateMockOrders(count = 24): Order[] {
    this.clearOrders();

    const firstNames = ['สมชาย', 'สมพร', 'วิภา', 'อรทัย', 'ชาญชัย', 'พรทิพย์', 'ณัฐวุฒิ', 'ศุภชัย', 'กาญจนา', 'ธนากร', 'ประวิทย์', 'สุภาพร', 'เอกชัย', 'มณีรัตน์', 'เฉลิมชัย', 'จารุวรรณ', 'ชลธิชา', 'ธีระพงษ์', 'ปิยะมาศ', 'วรวิทย์', 'อภิสิทธิ์', 'ดวงใจ', 'สุรชัย', 'ทิพวรรณ'];
    const lastNames = ['วงศ์สวัสดิ์', 'เจริญสุข', 'ศรีวิไล', 'บุญชู', 'รัตนโกสินทร์', 'พานิชย์เจริญ', 'เกษมสันต์', 'คงเจริญ', 'มั่นคง', 'ศรีสุข', 'สิทธิโชค', 'วัฒนพาณิชย์'];

    const msuLocations = [
      'ตึกสิริวิทย์ คณะศึกษาศาสตร์ มมส.',
      'อาคารบรมราชกุมารี (สำนักงานอธิการบดี มมส.)',
      'คณะเทคโนโลยีสารสนเทศ (IT MSU)',
      'อาคารวิทยบริการ (หอสมุดกลาง มมส.)',
      'ศูนย์อาหารกลาง Complex มมส.',
      'หอพักสุขสบาย ซอยวุ่นวาย ขามเรียง',
      'คอนโดเดอะพาร์ค มมส. ขามเรียง',
      'หอพักบุญฑริก มมส. ขามเรียง',
      'คณะวิศวกรรมศาสตร์ มมส.',
      'หอพักเจริญผล ขามเรียง ซอย 3',
      'อาคารปฏิบัติการกลางวิทยาศาสตร์ มมส.',
      'โรงพยาบาลสุทธาเวช มมส.',
      'หอพักตักศิลา มมส. ขามเรียง',
      'หอพักชิดชนก ซอยวุ่นวาย',
      'คณะเภสัชศาสตร์ มมส.',
      'อาคารพลศึกษา มมส.',
      'หอพักใน มมส. ขามเรียง ตึก 2',
      'สำนักคอมพิวเตอร์ มมส.',
      'ประตู มมส. ฝั่งขามเรียง',
      'คณะมนุษยศาสตร์และสังคมศาสตร์ มมส.',
      'หมู่บ้านเสริมไทยธานี มมส.',
      'หอพักแกรนด์โฮม ขามเรียง',
      'คลินิกเวชกรรม มมส.',
      'อาคารบริการวิชาการ มมส.'
    ];

    const generatedOrders: Order[] = [];

    for (let i = 0; i < count; i++) {
      const fName = firstNames[i % firstNames.length];
      const lName = lastNames[i % lastNames.length];
      const phone = `08${Math.floor(10000000 + Math.random() * 90000000)}`;
      const address = msuLocations[i % msuLocations.length];


      const angle = (i / count) * 2 * Math.PI + (Math.random() * 0.2 - 0.1);

      const distanceOffset = i % 2 === 0
        ? 0.002 + Math.random() * 0.005
        : 0.008 + Math.random() * 0.007;

      const lat = Math.round((RESTAURANT_DEPOT.latitude + Math.sin(angle) * distanceOffset) * 1000000) / 1000000;
      const lng = Math.round((RESTAURANT_DEPOT.longitude + Math.cos(angle) * distanceOffset * 1.05) * 1000000) / 1000000;

      const customer = this.createCustomer({
        firstName: fName,
        lastName: lName,
        phone,
        address,
        latitude: lat,
        longitude: lng,
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
