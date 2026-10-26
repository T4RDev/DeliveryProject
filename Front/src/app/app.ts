import { Component, OnInit, AfterViewInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api.service';
import { MapService } from './services/map.service';
import { Customer, Order, Rider, MsuLandmark, RoutingOptimizationResult, RiderRoute, DeliveryStop } from './models/delivery.model';
import { DEFAULT_MSU_LANDMARKS, DEFAULT_DEPOT, buildGoogleMapsSearchUrl, buildStopNavigationUrl } from './utils/constants';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit, AfterViewInit {
  private api = inject(ApiService);
  private mapService = inject(MapService);

  // แท็บหน้าจอ: 'owner' = หน้าจอเจ้าของร้าน, 'rider' = หน้าจอไรเดอร์บนมือถือ
  activeTab = signal<'owner' | 'rider'>('owner');

  backendConnected = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  alertMessage = signal<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // ข้อมูลออเดอร์
  orders = signal<Order[]>([]);
  totalOrderCount = signal<number>(0);
  totalBoxes = signal<number>(0);
  pendingCount = signal<number>(0);
  deliveredCount = signal<number>(0);

  // ข้อมูลไรเดอร์จากฐานข้อมูล MySQL
  riders = signal<Rider[]>([]);

  // ข้อมูลแลนด์มาร์ก มมส.
  msuLandmarks = signal<MsuLandmark[]>(DEFAULT_MSU_LANDMARKS);
  selectedLandmarkName = signal<string>('คณะเทคโนโลยีสารสนเทศ (IT MSU)');

  // ค้นหาและตัวกรอง
  customerSearchQuery = '';
  searchPhoneQuery = '';
  phoneLookupResult = signal<string | null>(null);
  statusFilter = signal<'all' | 'pending' | 'delivered'>('all');

  // ฟอร์มเพิ่มออเดอร์ใหม่
  newOrderForm = {
    firstName: '',
    lastName: '',
    phone: '',
    address: 'คณะเทคโนโลยีสารสนเทศ (IT MSU) มหาวิทยาลัยมหาสารคาม ขามเรียง',
    lat: 16.2445,
    lng: 103.2500,
    boxCount: 1,
    note: '',
    riderId: null as number | null,
  };

  // ผลการจัดเส้นทาง (Optimization Result)
  routingResult = signal<RoutingOptimizationResult | null>(null);
  isOptimizing = signal<boolean>(false);
  selectedRiderId = signal<number | null>(null); // ไรเดอร์ที่เลือกโฟกัสเส้นทาง

  // สถานะการส่งสำเร็จในหน้าจอไรเดอร์ (เก็บใน localStorage)
  completedStops = signal<{ [key: string]: boolean }>({});

  // ไรเดอร์ที่เลือกในหน้าจอมือถือ (Rider View)
  activeRiderIndex = signal<number>(0);
  loggedInRider = signal<Rider | null>(null);
  selectedLoginRiderId: number | null = 1;

  ngOnInit() {
    this.checkBackendAndLoadData();
    this.loadRiders();
    this.loadMsuLandmarks();
    this.restoreCompletedStops();
  }

  ngAfterViewInit() {
    setTimeout(() => {
      this.mapService.initMap('deliveryMap', DEFAULT_DEPOT.lat, DEFAULT_DEPOT.lng);
      if (this.routingResult()) {
        this.mapService.renderRoutesOnMap(this.routingResult()!);
      }
    }, 200);
  }

  // สลับแท็บระหว่าง เจ้าของร้าน กับ ไรเดอร์
  switchTab(tab: 'owner' | 'rider') {
    this.activeTab.set(tab);
    if (tab === 'owner') {
      setTimeout(() => {
        this.mapService.invalidateSize();
        if (this.routingResult()) {
          this.mapService.renderRoutesOnMap(this.routingResult()!);
        }
      }, 100);
    }
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

        // ดึงผลจัดเส้นทางล่วงหน้าเงียบๆ เพื่อให้ไรเดอร์เปิดดูใบงานได้ทันที
        this.api.optimizeRoutes().subscribe({
          next: (routeRes) => {
            this.routingResult.set(routeRes);
            this.mapService.renderRoutesOnMap(routeRes);
          },
          error: (err) => console.warn('Auto route load error:', err),
        });
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

  setFilterStatus(status: 'all' | 'pending' | 'delivered') {
    this.statusFilter.set(status);
  }

  get filteredOrders(): Order[] {
    let list = this.orders();
    const filter = this.statusFilter();
    if (filter === 'pending') {
      list = list.filter((o) => o.status !== 'delivered');
    } else if (filter === 'delivered') {
      list = list.filter((o) => o.status === 'delivered');
    }

    if (this.customerSearchQuery.trim()) {
      const q = this.customerSearchQuery.trim().toLowerCase();
      list = list.filter((o) => {
        const fullName = `${o.customer?.firstName} ${o.customer?.lastName}`.toLowerCase();
        const phone = o.customer?.phone?.toLowerCase() || '';
        const address = o.customer?.address?.toLowerCase() || '';
        return fullName.includes(q) || phone.includes(q) || address.includes(q);
      });
    }

    return list;
  }

  onSearchOrders() {
    this.loadOrders(this.customerSearchQuery);
  }

  clearSearch() {
    this.customerSearchQuery = '';
    this.loadOrders();
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
      this.phoneLookupResult.set('กรุณาระบุเบอร์โทรศัพท์');
      return;
    }

    this.api.getCustomerByPhone(phone).subscribe({
      next: (res) => {
        if (res.data) {
          const cust = res.data;
          this.newOrderForm.firstName = cust.firstName;
          this.newOrderForm.lastName = cust.lastName;
          this.newOrderForm.phone = cust.phone;
          this.newOrderForm.address = cust.address;
          this.newOrderForm.lat = cust.lat != null ? Number(cust.lat) : DEFAULT_DEPOT.lat;
          this.newOrderForm.lng = cust.lng != null ? Number(cust.lng) : DEFAULT_DEPOT.lng;
          this.phoneLookupResult.set(`พบลูกค้าเดิม: ${cust.firstName} ${cust.lastName}`);
          this.showAlert('success', `ดึงข้อมูลลูกค้าเดิม: ${cust.firstName} เรียบร้อย`);
        } else {
          this.phoneLookupResult.set('ไม่พบข้อมูลลูกค้าเดิม (สามารถกรอกเป็นลูกค้าใหม่ได้)');
          this.newOrderForm.phone = phone;
        }
      },
      error: () => {
        this.phoneLookupResult.set('ไม่พบข้อมูลลูกค้าเดิม');
        this.newOrderForm.phone = phone;
      },
    });
  }

  onSelectLandmark(landmarkName: string) {
    this.selectedLandmarkName.set(landmarkName);
    const landmark = this.msuLandmarks().find((l) => l.name === landmarkName);
    if (landmark) {
      this.newOrderForm.address = landmark.address;
      this.newOrderForm.lat = landmark.lat != null ? Number(landmark.lat) : DEFAULT_DEPOT.lat;
      this.newOrderForm.lng = landmark.lng != null ? Number(landmark.lng) : DEFAULT_DEPOT.lng;
    }
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
      lat: Number(this.newOrderForm.lat),
      lng: Number(this.newOrderForm.lng),
    };

    this.api.createCustomer(customerPayload).subscribe({
      next: (cRes) => {
        const customer = cRes.data;
        this.api
          .createOrder({
            customerId: customer.id,
            riderId: this.newOrderForm.riderId,
            boxCount: Number(this.newOrderForm.boxCount),
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
        this.showAlert('error', 'สร้างข้อมูลลูกค้าไม่สำเร็จ');
      },
    });
  }

  loadRiders() {
    this.api.getRiders().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.riders.set(res.data);
        }
      },
      error: (err) => console.error('Failed to load riders', err),
    });
  }

  assignRiderToOrder(order: Order, riderIdVal: any) {
    const rId = riderIdVal ? parseInt(riderIdVal) : null;
    this.api.assignRider(order.id, rId).subscribe({
      next: () => {
        order.riderId = rId;
        order.rider = this.riders().find((r) => r.id === rId);
        this.showAlert('success', `มอบหมายออเดอร์ #${order.id} ให้ไรเดอร์แล้ว`);
      },
      error: () => this.showAlert('error', 'มอบหมายไรเดอร์ไม่สำเร็จ'),
    });
  }

  private resetNewOrderForm() {
    this.newOrderForm.firstName = '';
    this.newOrderForm.lastName = '';
    this.newOrderForm.phone = '';
    this.newOrderForm.note = '';
    this.newOrderForm.riderId = null;
    this.searchPhoneQuery = '';
    this.phoneLookupResult.set(null);
  }

  changeBoxCount(order: Order, delta: number) {
    const nextVal = order.boxCount + delta;
    if (nextVal < 1) return;

    this.api.updateOrder(order.id, { boxCount: nextVal }).subscribe({
      next: () => {
        order.boxCount = nextVal;
        const total = this.orders().reduce((sum, o) => sum + o.boxCount, 0);
        this.totalBoxes.set(total);
      },
      error: () => this.showAlert('error', 'อัปเดตจำนวนกล่องไม่สำเร็จ'),
    });
  }

  toggleOrderStatus(order: Order) {
    const nextStatus = order.status === 'delivered' ? 'pending' : 'delivered';
    this.api.updateOrder(order.id, { status: nextStatus }).subscribe({
      next: () => {
        order.status = nextStatus;
        this.pendingCount.set(this.orders().filter((o) => o.status !== 'delivered').length);
        this.deliveredCount.set(this.orders().filter((o) => o.status === 'delivered').length);
        this.showAlert(
          'success',
          nextStatus === 'delivered'
            ? `ออเดอร์ #${order.id} อัปเดตเป็น: จัดส่งแล้ว`
            : `ออเดอร์ #${order.id} เปลี่ยนกลับเป็น: รอจัดส่ง`
        );
      },
      error: () => this.showAlert('error', 'เปลี่ยนสถานะไม่สำเร็จ'),
    });
  }

  deleteOrder(orderId: number) {
    if (!confirm(`คุณต้องการลบออเดอร์ #${orderId} ใช่หรือไม่?`)) return;

    this.api.deleteOrder(orderId).subscribe({
      next: () => {
        this.showAlert('success', `ลบออเดอร์ #${orderId} เรียบร้อย`);
        this.loadOrders();
      },
      error: () => this.showAlert('error', 'ลบออเดอร์ไม่สำเร็จ'),
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
        this.clearMapRoutes();
        this.routingResult.set(null);
      },
      error: () => {
        this.isLoading.set(false);
        this.showAlert('error', 'ล้างข้อมูลไม่สำเร็จ');
      },
    });
  }

  clearMapRoutes() {
    this.mapService.clearMapRoutes(DEFAULT_DEPOT.lat, DEFAULT_DEPOT.lng);
  }

  mockOrders(count: number = 24) {
    this.isLoading.set(true);
    this.api.mockOrders(count).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.showAlert('success', `สุ่มจำลองออเดอร์ ${count} รายการ สำเร็จแล้ว!`);
        this.updateOrderList(res.data, res.totalBoxes);
        this.optimizeDeliveryRoutes();
      },
      error: () => {
        this.isLoading.set(false);
        this.showAlert('error', 'จำลองออเดอร์ไม่สำเร็จ');
      },
    });
  }

  getGoogleMapsUrl(order: Order): string {
    return buildGoogleMapsSearchUrl(order);
  }

  getStopNavigationUrl(stop: DeliveryStop): string {
    return buildStopNavigationUrl(stop);
  }

  // เรียก API จัดเส้นทางและแบ่งงานไรเดอร์ (Project.md)
  optimizeDeliveryRoutes() {
    this.isOptimizing.set(true);
    this.api.optimizeRoutes().subscribe({
      next: (res) => {
        this.isOptimizing.set(false);
        this.routingResult.set(res);
        this.selectedRiderId.set(null); // แสดงทุกคัน

        // วาดเส้นทางบนแผนที่ผ่าน MapService
        this.mapService.renderRoutesOnMap(res);

        this.showAlert(
          'success',
          `จัดเส้นทางสำเร็จ! แบ่งงานให้ไรเดอร์ ${res.summary.totalRiders} คัน (คันละไม่เกิน 10 กล่อง)`
        );
      },
      error: () => {
        this.isOptimizing.set(false);
        this.showAlert('error', 'เกิดข้อผิดพลาดในการจัดเส้นทาง');
      },
    });
  }

  // กดเลือกดูเฉพาะเส้นทางของไรเดอร์คนใดคนหนึ่ง
  selectRiderFilter(riderId: number | null) {
    this.selectedRiderId.set(riderId);
    const result = this.routingResult();
    if (result) {
      this.mapService.renderRoutesOnMap(result, riderId);
    }
  }

  loginRider(riderId: number | null) {
    if (!riderId) {
      this.showAlert('error', 'กรุณาเลือกชื่อไรเดอร์เพื่อเข้าสู่ระบบ');
      return;
    }
    const rId = Number(riderId);
    const rider = this.riders().find((r) => r.id === rId);
    if (rider) {
      this.loggedInRider.set(rider);

      if (!this.routingResult()) {
        this.optimizeDeliveryRoutes();
      }

      const ridersList = this.routingResult()?.riders || [];
      const matchIdx = ridersList.findIndex((r) => r.riderId === rId);
      if (matchIdx >= 0) {
        this.activeRiderIndex.set(matchIdx);
      } else {
        this.activeRiderIndex.set(0);
      }

      this.showAlert('success', `เข้าสู่ระบบสำเร็จ: ${rider.name}`);
    } else {
      this.showAlert('error', 'ไม่พบข้อมูลไรเดอร์นี้ในระบบ');
    }
  }

  logoutRider() {
    this.loggedInRider.set(null);
    this.showAlert('info', 'ออกจากระบบเรียบร้อยแล้ว');
  }

  // สร้างข้อความสรุปเส้นทางตามโจทย์: 'จุดที่ 1 ต้องไปส่งบ้านคุณ A -> จุดที่ 2 ไปส่งบ้านคุณ B -> เสร็จแล้วให้ขับกลับร้าน'
  getRiderRouteSummaryText(rider: RiderRoute): string {
    const customerStops = rider.stops.filter((s) => s.type === 'customer');
    if (customerStops.length === 0) return 'ไม่มีรายการจัดส่ง';
    const textSeq = customerStops
      .map((s, idx) => `จุดที่ ${idx + 1} ต้องไปส่งบ้านคุณ ${s.name}`)
      .join(' -> ');
    return `${textSeq} -> เสร็จแล้วให้ขับกลับร้าน`;
  }

  get currentRider(): RiderRoute | null {
    const res = this.routingResult();
    if (!res || res.riders.length === 0) return null;

    // ถ้าล็อกอินอยู่ ให้ดึงเฉพาะใบงานของไรเดอร์ที่ล็อกอิน
    const loggedIn = this.loggedInRider();
    if (loggedIn) {
      const found = res.riders.find((r) => r.riderId === loggedIn.id);
      return found ?? null;
    }

    const idx = this.activeRiderIndex();
    return res.riders[idx] ?? res.riders[0];
  }

  selectActiveRider(idx: number) {
    this.activeRiderIndex.set(idx);
    const res = this.routingResult();
    if (res && res.riders[idx]) {
      const matchRider = this.riders().find((r) => r.id === res.riders[idx].riderId);
      if (matchRider) {
        this.loggedInRider.set(matchRider);
      }
    }
  }

  getStopKey(riderId: number, step: number): string {
    return `rider_${riderId}_step_${step}`;
  }

  isStopCompleted(riderId: number, step: number): boolean {
    const key = this.getStopKey(riderId, step);
    return !!this.completedStops()[key];
  }

  toggleStopCompleted(riderId: number, step: number, orderId?: number) {
    const key = this.getStopKey(riderId, step);
    const current = { ...this.completedStops() };
    const nextVal = !current[key];
    current[key] = nextVal;
    this.completedStops.set(current);
    this.saveCompletedStops();

    if (orderId) {
      const nextStatus = nextVal ? 'delivered' : 'pending';
      this.api.updateOrder(orderId, { status: nextStatus }).subscribe({
        next: () => {
          this.loadOrders();
          this.showAlert(
            'success',
            nextVal ? `ออเดอร์ #${orderId} อัปเดตสถานะ: ส่งสำเร็จแล้ว!` : `ยกเลิกสถานะออเดอร์ #${orderId}`
          );
        },
        error: (err) => console.error('Failed to update order status in DB', err),
      });
    }
  }

  private saveCompletedStops() {
    try {
      localStorage.setItem('delivery_rider_completed', JSON.stringify(this.completedStops()));
    } catch (e) {
      // LocalStorage fallback
    }
  }

  private restoreCompletedStops() {
    try {
      const saved = localStorage.getItem('delivery_rider_completed');
      if (saved) {
        this.completedStops.set(JSON.parse(saved));
      }
    } catch (e) {
      // ignore
    }
  }

  getRiderProgress(rider: RiderRoute): { completed: number; total: number; percent: number } {
    const customerStops = rider.stops.filter((s) => s.type === 'customer');
    const total = customerStops.length;
    let completed = 0;

    customerStops.forEach((s) => {
      if (this.isStopCompleted(rider.riderId, s.step)) {
        completed++;
      }
    });

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { completed, total, percent };
  }
}
