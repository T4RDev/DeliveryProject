import { Component, OnInit, AfterViewInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';
import { ApiService } from './services/api.service';
import { Customer, Order, MsuLandmark, RoutingOptimizationResult, RiderRoute, DeliveryStop } from './models/delivery.model';

const DEFAULT_MSU_LANDMARKS: MsuLandmark[] = [
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

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit, AfterViewInit {
  private api = inject(ApiService);

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
  };

  // แผนที่ Leaflet
  private map: L.Map | null = null;
  private routeLayerGroup: L.LayerGroup | null = null;

  // ผลการจัดเส้นทาง (Optimization Result)
  routingResult = signal<RoutingOptimizationResult | null>(null);
  isOptimizing = signal<boolean>(false);
  selectedRiderId = signal<number | null>(null); // ไรเดอร์ที่เลือกโฟกัสเส้นทาง

  // สถานะการส่งสำเร็จในหน้าจอไรเดอร์ (เก็บใน localStorage)
  completedStops = signal<{ [key: string]: boolean }>({});

  // ไรเดอร์ที่เลือกในหน้าจอมือถือ (Rider View)
  activeRiderIndex = signal<number>(0);

  ngOnInit() {
    this.checkBackendAndLoadData();
    this.loadMsuLandmarks();
    this.restoreCompletedStops();
  }

  ngAfterViewInit() {
    // เตรียมแผนที่หลังจาก DOM พร้อม
    setTimeout(() => {
      this.initMap();
    }, 200);
  }

  // สลับแท็บระหว่าง เจ้าของร้าน กับ ไรเดอร์
  switchTab(tab: 'owner' | 'rider') {
    this.activeTab.set(tab);
    if (tab === 'owner') {
      setTimeout(() => {
        if (!this.map) {
          this.initMap();
        } else {
          this.map.invalidateSize();
        }
      }, 150);
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
      this.newOrderForm.lat = landmark.lat ?? 16.2465;
      this.newOrderForm.lng = landmark.lng ?? 103.2510;
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
          if (c.lat && c.lng) {
            this.newOrderForm.lat = c.lat;
            this.newOrderForm.lng = c.lng;
          }
          this.phoneLookupResult.set(`พบข้อมูลเดิม: ${c.firstName} ${c.lastName}`);
          this.showAlert('success', `ดึงข้อมูลลูกค้าเดิมสำเร็จ`);
        } else {
          this.phoneLookupResult.set('ไม่พบข้อมูลเดิม (พร้อมสร้างเป็นลูกค้าใหม่)');
          this.newOrderForm.phone = phone;
        }
      },
      error: () => {
        this.phoneLookupResult.set('ไม่พบข้อมูลลูกค้าเดิม (พร้อมสร้างเป็นลูกค้าใหม่)');
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
      lat: this.newOrderForm.lat,
      lng: this.newOrderForm.lng,
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
        this.clearMapRoutes();
        this.routingResult.set(null);
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

  getStopNavigationUrl(stop: DeliveryStop): string {
    return `https://www.google.com/maps/dir/?api=1&destination=${stop.lat},${stop.lng}`;
  }

  // ==========================================
  // แผนที่ LEAFLET & จัดเส้นทาง (OPTIMIZATION)
  // ==========================================

  private initMap() {
    const mapElement = document.getElementById('deliveryMap');
    if (!mapElement || this.map) return;

    // จุดศูนย์กลาง: ศูนย์อาหารตลาดน้อย มมส. ขามเรียง
    this.map = L.map('deliveryMap').setView([16.2465, 103.2510], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.routeLayerGroup = L.layerGroup().addTo(this.map);

    // ปักหมุดร้านศูนย์อาหารตลาดน้อย มมส. เป็นค่าเริ่มต้น
    this.renderDepotMarker();
  }

  private renderDepotMarker() {
    if (!this.map) return;

    const depotIcon = L.divIcon({
      className: 'depot-marker',
      html: `
        <div style="background-color: #d97706; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: bold; border: 3px solid white; box-shadow: 0 3px 8px rgba(0,0,0,0.4);">
          ร้าน
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      popupAnchor: [0, -18],
    });

    L.marker([16.2465, 103.2510], { icon: depotIcon })
      .addTo(this.map)
      .bindPopup(`
        <div style="font-family: 'Prompt', sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #b45309; font-size: 13px;">ร้านส่งด่วนมื้อเที่ยง (จุดเริ่มต้น/จุดกลับ)</strong><br>
          ศูนย์อาหารตลาดน้อย มหาวิทยาลัยมหาสารคาม ขามเรียง<br>
          <span style="color: #64748b;">เริ่มปล่อยรถ: 11:30 น. | ส่งถึงก่อน: 12:30 น.</span>
        </div>
      `)
      .openPopup();
  }

  // เรียก API จัดเส้นทางและแบ่งงานไรเดอร์ (Project.md)
  optimizeDeliveryRoutes() {
    this.isOptimizing.set(true);
    this.api.optimizeRoutes().subscribe({
      next: (res) => {
        this.isOptimizing.set(false);
        this.routingResult.set(res);
        this.selectedRiderId.set(null); // แสดงทุกคัน

        // วาดเส้นทางบนแผนที่
        this.renderRoutesOnMap(res);

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

  // แคชเส้นทางตามถนนจริงเพื่อลดการยิง API ซ้ำ
  private roadPathCache = new Map<string, [number, number][]>();

  /**
   * ดึงเส้นทางวิ่งตามแนวถนนจริงจาก OSRM (Open Source Routing Machine)
   * โค้ดสไตล์นิสิต: ส่งพิกัดจุดแวะทั้งหมดไปคำนวณเส้นทางตามถนน OpenStreetMap
   */
  private async getRoadGeometry(stops: DeliveryStop[]): Promise<[number, number][]> {
    if (stops.length < 2) return stops.map((s) => [s.lat, s.lng]);

    // สร้างคีย์แคชจากพิกัดทั้งหมด
    const cacheKey = stops.map((s) => `${s.lat},${s.lng}`).join('|');
    if (this.roadPathCache.has(cacheKey)) {
      return this.roadPathCache.get(cacheKey)!;
    }

    try {
      // OSRM รับพิกัดแบบ lng,lat คั่นด้วย semicolon (;)
      const coordsQuery = stops.map((s) => `${s.lng},${s.lat}`).join(';');
      const url = `https://router.project-osrm.org/route/v1/driving/${coordsQuery}?overview=full&geometries=geojson`;

      const response = await fetch(url);
      if (!response.ok) throw new Error(`OSRM HTTP status: ${response.status}`);

      const data = await response.json();
      if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
        // GeoJSON geometry ให้พิกัดเป็น [lng, lat] จึงต้องสลับเป็น [lat, lng] สำหรับ Leaflet
        const roadCoords: [number, number][] = data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );
        this.roadPathCache.set(cacheKey, roadCoords);
        return roadCoords;
      }
    } catch (error) {
      console.warn('ดึงเส้นทางตามถนนไม่สำเร็จ ใช้เส้นตรงแทน:', error);
    }

    // กรณีออฟไลน์หรือไม่สามารถติดต่อ OSRM ได้ ให้ fallback ไปใช้เส้นตรง
    const fallbackCoords: [number, number][] = stops.map((s) => [s.lat, s.lng]);
    this.roadPathCache.set(cacheKey, fallbackCoords);
    return fallbackCoords;
  }

  // วาดเส้นทางไรเดอร์บนแผนที่ให้โค้งเลี้ยวตามถนนจริง
  async renderRoutesOnMap(result: RoutingOptimizationResult, highlightRiderId: number | null = null) {
    if (!this.map || !this.routeLayerGroup) return;

    this.routeLayerGroup.clearLayers();
    this.renderDepotMarker();

    const bounds: L.LatLngExpression[] = [[result.depot.lat, result.depot.lng]];

    // กรองไรเดอร์ที่ต้องการแสดง
    const ridersToRender = highlightRiderId
      ? result.riders.filter((r) => r.riderId === highlightRiderId)
      : result.riders;

    // 1. ปักหมุดลูกค้าทั้งหมดก่อน
    ridersToRender.forEach((rider) => {
      rider.stops.forEach((stop) => {
        bounds.push([stop.lat, stop.lng]);

        // ปักหมุดลูกค้า (ข้าม depot เพราะปักไว้แล้ว)
        if (stop.type === 'customer') {
          const markerIcon = L.divIcon({
            className: 'customer-marker',
            html: `
              <div style="background-color: ${rider.color}; color: white; width: 26px; height: 26px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);">
                ${stop.step - 1}
              </div>
            `,
            iconSize: [26, 26],
            iconAnchor: [13, 13],
            popupAnchor: [0, -13],
          });

          const popupContent = `
            <div style="font-family: 'Prompt', sans-serif; font-size: 12px; line-height: 1.4;">
              <div style="display: flex; align-items: center; gap: 6px; margin-bottom: 4px;">
                <span style="background-color: ${rider.color}; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: bold;">
                  ${rider.riderName} (จุดที่ ${stop.step - 1})
                </span>
                <span style="font-weight: bold; color: #1e293b;">${stop.name}</span>
              </div>
              <p style="margin: 2px 0; color: #475569;">โทร: ${stop.phone || '-'}</p>
              <p style="margin: 2px 0; color: #475569;">ที่อยู่: ${stop.address}</p>
              <p style="margin: 2px 0; font-weight: bold; color: #ea580c;">จำนวน: ${stop.boxCount} กล่อง</p>
              ${stop.note ? `<p style="margin: 2px 0; font-size: 11px; color: #94a3b8;">(${stop.note})</p>` : ''}
              <div style="margin-top: 6px;">
                <a href="${this.getStopNavigationUrl(stop)}" target="_blank" style="display: inline-block; background-color: #2563eb; color: white; padding: 3px 8px; border-radius: 4px; text-decoration: none; font-size: 11px;">
                  เปิดแผนที่นำทาง
                </a>
              </div>
            </div>
          `;

          const marker = L.marker([stop.lat, stop.lng], { icon: markerIcon }).bindPopup(popupContent);
          this.routeLayerGroup?.addLayer(marker);
        }
      });
    });

    if (bounds.length > 1) {
      this.map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
    }

    // 2. ดึงและวาดเส้นทางตามถนนจริงสำหรับไรเดอร์แต่ละคน
    for (const rider of ridersToRender) {
      const roadCoords = await this.getRoadGeometry(rider.stops);

      // วาดเส้นขอบไฮไลต์ (Glow Casing) เมื่อคลิกเลือกไรเดอร์คนนั้น
      if (highlightRiderId === rider.riderId) {
        const glowPolyline = L.polyline(roadCoords, {
          color: '#ffffff',
          weight: 9,
          opacity: 0.9,
          lineCap: 'round',
          lineJoin: 'round',
        });
        this.routeLayerGroup?.addLayer(glowPolyline);
      }

      // วาดเส้นทางวิ่งตามแนวถนนจริง (Road-following Polyline)
      const polyline = L.polyline(roadCoords, {
        color: rider.color,
        weight: highlightRiderId === rider.riderId ? 6 : 4.5,
        opacity: highlightRiderId ? (highlightRiderId === rider.riderId ? 1.0 : 0.25) : 0.85,
        lineCap: 'round',
        lineJoin: 'round',
      });

      polyline.bindTooltip(
        `${rider.riderName}: ${rider.totalBoxes} กล่อง (วิ่งตามถนน ~${rider.totalDistanceKm} กม.)`,
        { sticky: true }
      );

      this.routeLayerGroup?.addLayer(polyline);
    }
  }

  // กดเลือกดูเฉพาะเส้นทางของไรเดอร์คนใดคนหนึ่ง
  selectRiderFilter(riderId: number | null) {
    this.selectedRiderId.set(riderId);
    const res = this.routingResult();
    if (res) {
      this.renderRoutesOnMap(res, riderId);
    }
  }

  clearMapRoutes() {
    this.routeLayerGroup?.clearLayers();
    this.renderDepotMarker();
  }

  // ==========================================
  // ฟังก์ชันสำหรับหน้าจอไรเดอร์ (RIDER VIEW)
  // ==========================================

  get currentRider(): RiderRoute | null {
    const res = this.routingResult();
    if (!res || res.riders.length === 0) return null;
    const idx = this.activeRiderIndex();
    return res.riders[idx] ?? res.riders[0];
  }

  selectActiveRider(idx: number) {
    this.activeRiderIndex.set(idx);
  }

  getStopKey(riderId: number, step: number): string {
    return `rider_${riderId}_step_${step}`;
  }

  isStopCompleted(riderId: number, step: number): boolean {
    const key = this.getStopKey(riderId, step);
    return !!this.completedStops()[key];
  }

  toggleStopCompleted(riderId: number, step: number) {
    const key = this.getStopKey(riderId, step);
    const current = { ...this.completedStops() };
    current[key] = !current[key];
    this.completedStops.set(current);
    this.saveCompletedStops();
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

  // คำนวณความคืบหน้าการส่งของไรเดอร์คนปัจจุบัน
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
