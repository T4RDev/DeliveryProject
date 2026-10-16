import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api.service';
import { Customer, Order, MsuLandmark } from './models/delivery.model';

const DEFAULT_MSU_LANDMARKS: MsuLandmark[] = [
  { name: 'คณะเทคโนโลยีสารสนเทศ (IT MSU)', category: 'คณะ', address: 'คณะเทคโนโลยีสารสนเทศ มหาวิทยาลัยมหาสารคาม ขามเรียง' },
  { name: 'อาคารวิทยบริการ (หอสมุดกลาง มมส.)', category: 'อาคารกลาง', address: 'หอสมุดกลาง มหาวิทยาลัยมหาสารคาม ขามเรียง' },
  { name: 'อาคารบรมราชกุมารี (สำนักงานอธิการบดี)', category: 'อาคารกลาง', address: 'สำนักงานอธิการบดี มหาวิทยาลัยมหาสารคาม ขามเรียง' },
  { name: 'คณะการบัญชีและการจัดการ (MBS)', category: 'คณะ', address: 'คณะการบัญชีและการจัดการ มหาวิทยาลัยมหาสารคาม ขามเรียง' },
  { name: 'คณะวิศวกรรมศาสตร์ มมส.', category: 'คณะ', address: 'คณะวิศวกรรมศาสตร์ มหาวิทยาลัยมหาสารคาม ขามเรียง' },
  { name: 'ตึกสิริวิทย์ คณะศึกษาศาสตร์', category: 'คณะ', address: 'คณะศึกษาศาสตร์ มหาวิทยาลัยมหาสารคาม ขามเรียง' },
  { name: 'ศูนย์อาหารกลาง (Complex มมส.)', category: 'ร้านอาหาร/ส่วนกลาง', address: 'อาคารคอมเพล็กซ์ มหาวิทยาลัยมหาสารคาม ขามเรียง' },
  { name: 'โรงพยาบาลสุทธาเวช มมส.', category: 'โรงพยาบาล', address: 'โรงพยาบาลสุทธาเวช มหาวิทยาลัยมหาสารคาม' },
  { name: 'คณะมนุษยศาสตร์และสังคมศาสตร์', category: 'คณะ', address: 'คณะมนุษยศาสตร์และสังคมศาสตร์ มหาวิทยาลัยมหาสารคาม' },
  { name: 'คณะสาธารณสุขศาสตร์ มมส.', category: 'คณะ', address: 'คณะสาธารณสุขศาสตร์ มหาวิทยาลัยมหาสารคาม ขามเรียง' },
  { name: 'หอพักสุขสบาย ซอยวุ่นวาย ขามเรียง', category: 'หอพัก', address: 'หอพักสุขสบาย ซอยวุ่นวาย ขามเรียง มหาสารคาม' },
  { name: 'คอนโดเดอะพาร์ค มมส.', category: 'หอพัก/คอนโด', address: 'คอนโดเดอะพาร์ค ขามเรียง มหาสารคาม' },
  { name: 'หอพักอินเตอร์ มมส. ขามเรียง', category: 'หอพัก', address: 'หอพักอินเตอร์ ขามเรียง มหาสารคาม' },
  { name: 'หอพักชื่นชม มมส.', category: 'หอพัก', address: 'หอพักชื่นชม ขามเรียง มหาสารคาม' },
  { name: 'ศูนย์อาหารตลาดน้อย มมส.', category: 'ร้านอาหาร/ส่วนกลาง', address: 'ศูนย์อาหารตลาดน้อย มหาวิทยาลัยมหาสารคาม ขามเรียง' },
];

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit {
  private api = inject(ApiService);

  backendConnected = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  alertMessage = signal<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  orders = signal<Order[]>([]);
  totalOrderCount = signal<number>(0);
  totalBoxes = signal<number>(0);
  pendingCount = signal<number>(0);
  deliveredCount = signal<number>(0);

  msuLandmarks = signal<MsuLandmark[]>(DEFAULT_MSU_LANDMARKS);
  selectedLandmarkName = signal<string>('คณะเทคโนโลยีสารสนเทศ (IT MSU)');

  customerSearchQuery = '';
  searchPhoneQuery = '';
  phoneLookupResult = signal<string | null>(null);
  statusFilter = signal<'all' | 'pending' | 'delivered'>('all');

  newOrderForm = {
    firstName: '',
    lastName: '',
    phone: '',
    address: 'คณะเทคโนโลยีสารสนเทศ มหาวิทยาลัยมหาสารคาม ขามเรียง',
    boxCount: 1,
    note: '',
  };

  ngOnInit() {
    this.checkBackendAndLoadData();
    this.loadMsuLandmarks();
  }

  showAlert(type: 'success' | 'error' | 'info', text: string) {
    this.alertMessage.set({ type, text });
    setTimeout(() => {
      if (this.alertMessage()?.text === text) {
        this.alertMessage.set(null);
      }
    }, 4000);
  }

  checkBackendAndLoadData() {
    this.isLoading.set(true);
    this.api.getOrders().subscribe({
      next: (res) => {
        this.backendConnected.set(true);
        this.updateOrderList(res.data, res.totalBoxes);
        this.isLoading.set(false);
      },
      error: () => {
        this.backendConnected.set(false);
        this.isLoading.set(false);
        this.showAlert('error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ได้');
      },
    });
  }

  loadMsuLandmarks() {
    this.api.getMsuLandmarks().subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          this.msuLandmarks.set(res.data);
        }
      },
      error: () => {
        this.msuLandmarks.set(DEFAULT_MSU_LANDMARKS);
      },
    });
  }

  loadOrders(query?: string) {
    this.isLoading.set(true);
    this.api.getOrders(query).subscribe({
      next: (res) => {
        this.updateOrderList(res.data, res.totalBoxes);
        this.isLoading.set(false);
      },
      error: () => {
        this.isLoading.set(false);
        this.showAlert('error', 'โหลดข้อมูลไม่สำเร็จ');
      },
    });
  }

  private updateOrderList(orders: Order[], totalBoxes?: number) {
    this.orders.set(orders);
    this.totalOrderCount.set(orders.length);
    const boxes = totalBoxes ?? orders.reduce((sum, o) => sum + o.boxCount, 0);
    this.totalBoxes.set(boxes);
    this.pendingCount.set(orders.filter((o) => o.status !== 'delivered').length);
    this.deliveredCount.set(orders.filter((o) => o.status === 'delivered').length);
  }

  get filteredOrders(): Order[] {
    const filter = this.statusFilter();
    if (filter === 'pending') return this.orders().filter((o) => o.status !== 'delivered');
    if (filter === 'delivered') return this.orders().filter((o) => o.status === 'delivered');
    return this.orders();
  }

  setFilterStatus(status: 'all' | 'pending' | 'delivered') {
    this.statusFilter.set(status);
  }

  onSearchOrders() {
    this.loadOrders(this.customerSearchQuery);
  }

  onSelectLandmark(name: string) {
    this.selectedLandmarkName.set(name);
    const landmark = this.msuLandmarks().find((lm) => lm.name === name);
    if (landmark) {
      this.newOrderForm.address = landmark.address;
    }
  }

  pickRandomMsuLocation() {
    const list = this.msuLandmarks();
    if (!list || list.length === 0) return;
    const randomIdx = Math.floor(Math.random() * list.length);
    const picked = list[randomIdx];
    this.onSelectLandmark(picked.name);
  }

  lookupCustomerByPhone() {
    const phone = this.searchPhoneQuery.trim();
    if (!phone) {
      this.phoneLookupResult.set('กรุณาใส่เบอร์โทรศัพท์');
      return;
    }

    this.api.getCustomerByPhone(phone).subscribe({
      next: (res) => {
        if (res.success && res.data) {
          const c = res.data;
          this.newOrderForm.firstName = c.firstName;
          this.newOrderForm.lastName = c.lastName;
          this.newOrderForm.phone = c.phone;
          this.newOrderForm.address = c.address;
          this.phoneLookupResult.set(`พบข้อมูล: ${c.firstName} ${c.lastName}`);
          this.showAlert('success', `ดึงข้อมูลลูกค้าเดิมสำเร็จ`);
        } else {
          this.phoneLookupResult.set('ไม่พบข้อมูล (สร้างเป็นลูกค้าใหม่)');
          this.newOrderForm.phone = phone;
        }
      },
      error: () => {
        this.phoneLookupResult.set('ไม่พบข้อมูลลูกค้าเดิม');
        this.newOrderForm.phone = phone;
      },
    });
  }

  submitNewOrder() {
    if (!this.newOrderForm.firstName.trim() || !this.newOrderForm.phone.trim()) {
      this.showAlert('error', 'กรุณากรอกชื่อและเบอร์โทรศัพท์');
      return;
    }

    this.isLoading.set(true);
    const customerPayload: Partial<Customer> = {
      firstName: this.newOrderForm.firstName.trim(),
      lastName: this.newOrderForm.lastName.trim(),
      phone: this.newOrderForm.phone.trim(),
      address: this.newOrderForm.address.trim(),
    };

    this.api.createCustomer(customerPayload).subscribe({
      next: (cRes) => {
        const customer = cRes.data;
        this.api
          .createOrder({
            customerId: customer.id,
            boxCount: this.newOrderForm.boxCount,
            note: this.newOrderForm.note?.trim() || undefined,
          })
          .subscribe({
            next: (oRes) => {
              this.isLoading.set(false);
              this.showAlert('success', `บันทึกออเดอร์ #${oRes.data.id} สำเร็จ`);
              this.loadOrders();
              this.resetNewOrderForm();
            },
            error: () => {
              this.isLoading.set(false);
              this.showAlert('error', 'บันทึกออเดอร์ไม่สำเร็จ');
            },
          });
      },
      error: () => {
        this.isLoading.set(false);
        this.showAlert('error', 'บันทึกข้อมูลลูกค้าไม่สำเร็จ');
      },
    });
  }

  private resetNewOrderForm() {
    this.newOrderForm.firstName = '';
    this.newOrderForm.lastName = '';
    this.newOrderForm.phone = '';
    this.newOrderForm.note = '';
    this.searchPhoneQuery = '';
    this.phoneLookupResult.set(null);
  }

  changeBoxCount(order: Order, delta: number) {
    const newCount = order.boxCount + delta;
    if (newCount < 1 || newCount > 3) return;

    this.api.updateOrder(order.id, { boxCount: newCount }).subscribe({
      next: () => {
        order.boxCount = newCount;
        const total = this.orders().reduce((s, o) => s + o.boxCount, 0);
        this.totalBoxes.set(total);
      },
      error: () => {
        this.showAlert('error', 'แก้ไขจำนวนกล่องไม่สำเร็จ');
      },
    });
  }

  toggleOrderStatus(order: Order) {
    const nextStatus = order.status === 'delivered' ? 'pending' : 'delivered';
    this.api.updateOrder(order.id, { status: nextStatus }).subscribe({
      next: () => {
        order.status = nextStatus;
        this.pendingCount.set(this.orders().filter((o) => o.status !== 'delivered').length);
        this.deliveredCount.set(this.orders().filter((o) => o.status === 'delivered').length);
      },
      error: () => {
        this.showAlert('error', 'อัปเดตสถานะไม่สำเร็จ');
      },
    });
  }

  deleteOrder(id: number) {
    if (!confirm(`ลบออเดอร์ #${id} หรือไม่?`)) return;

    this.api.deleteOrder(id).subscribe({
      next: () => {
        this.showAlert('info', `ลบออเดอร์ #${id} แล้ว`);
        this.loadOrders();
      },
      error: () => {
        this.showAlert('error', 'ลบออเดอร์ไม่สำเร็จ');
      },
    });
  }

  mockOrders(count = 24) {
    this.isLoading.set(true);
    this.api.mockOrders(count).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.showAlert('success', `สร้างข้อมูลตัวอย่าง ${res.count} รายการแล้ว`);
        this.loadOrders();
      },
      error: () => {
        this.isLoading.set(false);
        this.showAlert('error', 'สร้างข้อมูลตัวอย่างไม่สำเร็จ');
      },
    });
  }

  clearOrders() {
    if (!confirm('ต้องการล้างออเดอร์ทั้งหมดใช่หรือไม่?')) return;

    this.isLoading.set(true);
    this.api.clearOrders().subscribe({
      next: () => {
        this.isLoading.set(false);
        this.showAlert('info', 'ล้างข้อมูลออเดอร์ทั้งหมดแล้ว');
        this.updateOrderList([], 0);
      },
      error: () => {
        this.isLoading.set(false);
        this.showAlert('error', 'ล้างข้อมูลไม่สำเร็จ');
      },
    });
  }

  getGoogleMapsUrl(order: Order): string {
    const query = order.customer?.address?.trim() || 'มหาวิทยาลัยมหาสารคาม ขามเรียง';
    return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;
  }
}
