import { Component, OnInit, AfterViewInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api.service';
import { MapService } from './services/map.service';
import {
  Customer,
  Order,
  Rider,
  MsuLandmark,
  RoutingOptimizationResult,
  RiderRoute,
  DeliveryStop,
} from './models/delivery.model';
import {
  DEFAULT_MSU_LANDMARKS,
  DEFAULT_DEPOT,
  buildGoogleMapsSearchUrl,
  buildStopNavigationUrl,
} from './utils/constants';
import {
  calculateRiderProgress,
  formatRiderRouteSummary,
  calculateOrderSummary,
} from './utils/delivery-calculator';

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

  activeTab = signal<'owner' | 'rider'>('owner');
  ownerSubTab = signal<'routes' | 'customers' | 'orders'>('routes');

  backendConnected = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  alertMessage = signal<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  customers = signal<Customer[]>([]);
  customerSearchText = '';
  selectedCustomerId = signal<number | null>(null);
  customerForm = {
    id: null as number | null,
    firstName: '',
    lastName: '',
    phone: '',
    address: 'มหาวิทยาลัยมหาสารคาม ขามเรียง',
    lat: 16.2445,
    lng: 103.2500,
  };
  isEditingCustomer = signal<boolean>(false);

  orders = signal<Order[]>([]);
  totalOrderCount = signal<number>(0);
  totalBoxes = signal<number>(0);
  pendingCount = signal<number>(0);
  deliveredCount = signal<number>(0);

  riders = signal<Rider[]>([]);
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
    address: 'คณะเทคโนโลยีสารสนเทศ (IT MSU) มหาวิทยาลัยมหาสารคาม ขามเรียง',
    lat: 16.2445,
    lng: 103.2500,
    boxCount: 1,
    note: '',
    riderId: null as number | null,
  };

  routingResult = signal<RoutingOptimizationResult | null>(null);
  isOptimizing = signal<boolean>(false);
  selectedRiderId = signal<number | null>(null);
  selectedStrategy = signal<string>('fastest');

  completedStops = signal<{ [key: string]: boolean }>({});
  activeRiderIndex = signal<number>(0);
  loggedInRider = signal<Rider | null>(null);
  selectedLoginRiderId: number | null = 1;
  jobCodeInput = '';

  ngOnInit() {
    this.checkBackendAndLoadData();
    this.loadCustomers();
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

  // สลับแท็บระหว่างหน้าเจ้าของร้านและหน้าไรเดอร์
  switchTab(tab: 'owner' | 'rider') {
    this.activeTab.set(tab);
    if (tab === 'owner') {
      setTimeout(() => {
        this.mapService.invalidateSize();
        if (this.ownerSubTab() === 'routes' && this.routingResult()) {
          this.mapService.renderRoutesOnMap(this.routingResult()!);
        } else if (this.ownerSubTab() === 'customers') {
          this.mapService.renderCustomerLocations(this.customers(), this.selectedCustomerId());
        }
      }, 100);
    }
  }

  // สลับเมนูย่อยของหน้าเจ้าของร้าน
  switchOwnerSubTab(subTab: 'routes' | 'customers' | 'orders') {
    this.ownerSubTab.set(subTab);
    setTimeout(() => {
      this.mapService.invalidateSize();
      if (subTab === 'routes') {
        if (this.routingResult()) {
          this.mapService.renderRoutesOnMap(this.routingResult()!, this.selectedRiderId());
        } else {
          this.mapService.clearMapRoutes();
        }
      } else if (subTab === 'customers') {
        this.mapService.renderCustomerLocations(this.customers(), this.selectedCustomerId());
      }
    }, 100);
  }

  showAlert(type: 'success' | 'error' | 'info', text: string) {
    this.alertMessage.set({ type, text });
    setTimeout(() => {
      if (this.alertMessage()?.text === text) {
        this.alertMessage.set(null);
      }
    }, 4000);
  }

  // ตรวจสอบการเชื่อมต่อเซิร์ฟเวอร์และดึงข้อมูลออเดอร์เริ่มต้น
  checkBackendAndLoadData() {
    this.isLoading.set(true);
    this.api.getOrders().subscribe({
      next: (res) => {
        this.backendConnected.set(true);
        this.updateOrderList(res.data, res.totalBoxes);
        this.isLoading.set(false);

        this.api.optimizeRoutes(this.selectedStrategy()).subscribe({
          next: (routeRes) => {
            this.routingResult.set(routeRes);
            if (this.ownerSubTab() === 'routes') {
              this.mapService.renderRoutesOnMap(routeRes);
            }
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

  // ดึงข้อมูลลูกค้าทั้งหมด
  loadCustomers() {
    this.api.getCustomers().subscribe({
      next: (res) => {
        if (res.success && res.data) {
          this.customers.set(res.data);
          if (this.ownerSubTab() === 'customers') {
            this.mapService.renderCustomerLocations(res.data, this.selectedCustomerId());
          }
        }
      },
      error: (err) => console.error('Failed to load customers', err),
    });
  }

  get filteredCustomers(): Customer[] {
    const q = this.customerSearchText.trim().toLowerCase();
    if (!q) return this.customers();
    return this.customers().filter((c) => {
      const full = `${c.firstName} ${c.lastName}`.toLowerCase();
      const phone = c.phone?.toLowerCase() || '';
      const address = c.address?.toLowerCase() || '';
      return full.includes(q) || phone.includes(q) || address.includes(q);
    });
  }

  // ปักหมุดตำแหน่งบ้านลูกค้าบนแผนที่
  selectCustomerOnMap(cust: Customer) {
    this.selectedCustomerId.set(cust.id);
    this.mapService.renderCustomerLocations(this.customers(), cust.id);
    this.showAlert('info', `แสดงตำแหน่งบ้าน: ${cust.firstName} ${cust.lastName} บนแผนที่`);
  }

  editCustomer(cust: Customer) {
    this.isEditingCustomer.set(true);
    this.customerForm = {
      id: cust.id,
      firstName: cust.firstName,
      lastName: cust.lastName,
      phone: cust.phone,
      address: cust.address,
      lat: cust.lat || DEFAULT_DEPOT.lat,
      lng: cust.lng || DEFAULT_DEPOT.lng,
    };
    this.selectCustomerOnMap(cust);
  }

  cancelEditCustomer() {
    this.isEditingCustomer.set(false);
    this.customerForm = {
      id: null,
      firstName: '',
      lastName: '',
      phone: '',
      address: 'มหาวิทยาลัยมหาสารคาม ขามเรียง',
      lat: 16.2445,
      lng: 103.2500,
    };
    this.selectedCustomerId.set(null);
  }

  // บันทึกข้อมูลลูกค้า (สร้างใหม่หรืออัปเดต)
  saveCustomer() {
    if (!this.customerForm.firstName.trim() || !this.customerForm.phone.trim()) {
      this.showAlert('error', 'กรุณากรอกชื่อและเบอร์โทรศัพท์ลูกค้า');
      return;
    }

    this.isLoading.set(true);
    const payload: Partial<Customer> = {
      firstName: this.customerForm.firstName.trim(),
      lastName: this.customerForm.lastName.trim(),
      phone: this.customerForm.phone.trim(),
      address: this.customerForm.address.trim(),
      lat: Number(this.customerForm.lat),
      lng: Number(this.customerForm.lng),
    };

    if (this.isEditingCustomer() && this.customerForm.id) {
      this.api.updateCustomer(this.customerForm.id, payload).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.showAlert('success', `อัปเดตข้อมูลลูกค้า #${this.customerForm.id} เรียบร้อยแล้ว`);
          this.loadCustomers();
          this.cancelEditCustomer();
        },
        error: () => {
          this.isLoading.set(false);
          this.showAlert('error', 'อัปเดตข้อมูลลูกค้าไม่สำเร็จ');
        },
      });
    } else {
      this.api.createCustomer(payload).subscribe({
        next: () => {
          this.isLoading.set(false);
          this.showAlert('success', 'เพิ่มลูกค้าใหม่เรียบร้อยแล้ว');
          this.loadCustomers();
          this.cancelEditCustomer();
        },
        error: () => {
          this.isLoading.set(false);
          this.showAlert('error', 'เพิ่มลูกค้าใหม่ไม่สำเร็จ');
        },
      });
    }
  }

  // ลบข้อมูลลูกค้า
  deleteCustomer(id: number) {
    if (!confirm(`คุณต้องการลบข้อมูลลูกค้า #${id} ใช่หรือไม่?`)) return;
    this.api.deleteCustomer(id).subscribe({
      next: () => {
        this.showAlert('success', `ลบข้อมูลลูกค้า #${id} เรียบร้อยแล้ว`);
        this.loadCustomers();
      },
      error: () => this.showAlert('error', 'ลบข้อมูลลูกค้าไม่สำเร็จ (อาจมีออเดอร์ผูกอยู่)'),
    });
  }

  // เรียกใช้ API คำนวณจัดเส้นทาง CVRP
  optimizeDeliveryRoutes(strategy?: string) {
    if (strategy) {
      this.selectedStrategy.set(strategy);
    }
    const currentStrat = this.selectedStrategy();

    this.isOptimizing.set(true);
    this.api.optimizeRoutes(currentStrat).subscribe({
      next: (res) => {
        this.isOptimizing.set(false);
        this.routingResult.set(res);
        this.selectedRiderId.set(null);

        if (this.ownerSubTab() === 'routes') {
          this.mapService.renderRoutesOnMap(res);
        }

        const profitStatus = res.financial.isProfitable
          ? `กำไรสุทธิ +${res.financial.netProfit} บาท`
          : `ขาดทุน ${res.financial.netProfit} บาท`;

        this.showAlert(
          res.financial.isProfitable ? 'success' : 'error',
          `จัดเส้นทางสำเร็จ (${res.summary.totalRiders} คัน, คันละไม่เกิน 3 ออเดอร์) • ${profitStatus}`
        );
      },
      error: () => {
        this.isOptimizing.set(false);
        this.showAlert('error', 'เกิดข้อผิดพลาดในการจัดเส้นทาง');
      },
    });
  }

  changeStrategy(strat: string) {
    this.selectedStrategy.set(strat);
    this.optimizeDeliveryRoutes(strat);
  }

  selectRiderFilter(riderId: number | null) {
    this.selectedRiderId.set(riderId);
    const result = this.routingResult();
    if (result && this.ownerSubTab() === 'routes') {
      this.mapService.renderRoutesOnMap(result, riderId);
    }
  }

  loadMsuLandmarks() {
    this.api.getMsuLandmarks().subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          this.msuLandmarks.set(res.data);
        }
      },
      error: () => this.msuLandmarks.set(DEFAULT_MSU_LANDMARKS),
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

  // อัปเดตรายการออเดอร์และคำนวณตัวเลขสรุป
  private updateOrderList(orders: Order[], totalBoxes?: number) {
    this.orders.set(orders);
    const summary = calculateOrderSummary(orders);
    this.totalOrderCount.set(summary.totalCount);
    this.totalBoxes.set(totalBoxes ?? summary.totalBoxes);
    this.pendingCount.set(summary.pendingCount);
    this.deliveredCount.set(summary.deliveredCount);
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

  // ค้นหาข้อมูลลูกค้าเดิมจากเบอร์โทรศัพท์
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
        this.phoneLookupResult.set('ไม่พบข้อมูลลูกค้าเดิม (สามารถกรอกเป็นลูกค้าใหม่ได้)');
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

  // บันทึกออเดอร์ใหม่ลงฐานข้อมูล
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
              this.loadCustomers();
              this.resetNewOrderForm();
              this.optimizeDeliveryRoutes();
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

  // ปรับจำนวนข้าวกล่อง (จำกัด 1 - 3 กล่องต่อออเดอร์)
  changeBoxCount(order: Order, delta: number) {
    const nextVal = order.boxCount + delta;
    if (nextVal < 1 || nextVal > 3) return;

    this.api.updateOrder(order.id, { boxCount: nextVal }).subscribe({
      next: () => {
        order.boxCount = nextVal;
        const total = this.orders().reduce((sum, o) => sum + o.boxCount, 0);
        this.totalBoxes.set(total);
        this.optimizeDeliveryRoutes();
      },
      error: () => this.showAlert('error', 'อัปเดตจำนวนกล่องไม่สำเร็จ'),
    });
  }

  // สลับสถานะจัดส่ง (รอส่ง / ส่งแล้ว)
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

  // ลบออเดอร์
  deleteOrder(orderId: number) {
    if (!confirm(`คุณต้องการลบออเดอร์ #${orderId} ใช่หรือไม่?`)) return;

    this.api.deleteOrder(orderId).subscribe({
      next: () => {
        this.showAlert('success', `ลบออเดอร์ #${orderId} เรียบร้อย`);
        this.loadOrders();
        this.optimizeDeliveryRoutes();
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
        this.mapService.clearMapRoutes();
        this.routingResult.set(null);
      },
      error: () => {
        this.isLoading.set(false);
        this.showAlert('error', 'ล้างข้อมูลไม่สำเร็จ');
      },
    });
  }

  // จำลองออเดอร์สุ่ม 20 - 30 รายการ (ตามโจทย์)
  mockOrders(count: number = 24) {
    this.isLoading.set(true);
    this.api.mockOrders(count).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.showAlert('success', `จำลองออเดอร์ ${count} รายการ สำเร็จแล้ว`);
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

  // ค้นหาใบงานไรเดอร์จากรหัสเลขใบงาน
  loginRiderByJobCode(rawCode?: string) {
    const code = (rawCode ?? this.jobCodeInput).trim().toUpperCase();
    if (!code) {
      this.showAlert('error', 'กรุณากรอกเลขใบงาน (เช่น 1 หรือ JOB-1)');
      return;
    }

    let parsedRiderId = parseInt(code.replace(/[^0-9]/g, ''), 10);
    if (isNaN(parsedRiderId)) {
      const matchedByName = this.riders().find(
        (r) => r.name.toLowerCase().includes(code.toLowerCase()) || r.phone.includes(code)
      );
      if (matchedByName) {
        parsedRiderId = matchedByName.id;
      }
    }

    if (!parsedRiderId) {
      this.showAlert('error', `ไม่พบใบงานสำหรับรหัส "${code}"`);
      return;
    }

    this.loginRider(parsedRiderId);
  }

  // เข้าสู่ระบบดูใบงานของไรเดอร์
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
      this.activeRiderIndex.set(matchIdx >= 0 ? matchIdx : 0);

      this.showAlert('success', `เข้าสู่ระบบดูใบงานสำเร็จ: ${rider.name}`);
    } else {
      this.showAlert('error', 'ไม่พบข้อมูลไรเดอร์นี้ในระบบ');
    }
  }

  logoutRider() {
    this.loggedInRider.set(null);
    this.jobCodeInput = '';
    this.showAlert('info', 'ออกจากระบบเรียบร้อยแล้ว');
  }

  // สรุปข้อความลำดับการจัดส่ง
  getRiderRouteSummaryText(rider: RiderRoute): string {
    return formatRiderRouteSummary(rider);
  }

  get currentRider(): RiderRoute | null {
    const res = this.routingResult();
    if (!res || res.riders.length === 0) return null;

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

  // บันทึกสถานะส่งสำเร็จทีละจุด
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
            nextVal ? `ออเดอร์ #${orderId} ส่งมอบสำเร็จเรียบร้อย` : `ยกเลิกสถานะออเดอร์ #${orderId}`
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

  // คำนวณความคืบหน้าการส่ง
  getRiderProgress(rider: RiderRoute): { completed: number; total: number; percent: number } {
    return calculateRiderProgress(rider, this.completedStops());
  }
}
