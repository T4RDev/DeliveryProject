import { Component, OnInit, AfterViewInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from './services/api.service';
import { Customer, Order, Rider, DispatchPlan, RiderSheetData, RiderRoute, RouteStop } from './models/delivery.model';
import * as L from 'leaflet';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './app.html',
  styleUrls: ['./app.css'],
})
export class App implements OnInit, AfterViewInit {
  private api = inject(ApiService);

  readonly MSU_LAT = 16.2435;
  readonly MSU_LNG = 103.2545;

  activeTab = signal<'owner' | 'orders' | 'rider'>('owner');

  backendConnected = signal<boolean>(false);
  isLoading = signal<boolean>(false);
  alertMessage = signal<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  customers = signal<Customer[]>([]);
  orders = signal<Order[]>([]);
  totalOrderCount = signal<number>(0);
  riders = signal<Rider[]>([]);
  dispatchPlan = signal<DispatchPlan | null>(null);

  selectedRiderId = signal<number>(1);
  currentRiderSheet = signal<RiderSheetData | null>(null);

  activeStopForMap = signal<RouteStop | null>(null);
  private riderModalMap: L.Map | null = null;

  customerSearchQuery = '';
  searchPhoneQuery = '';
  phoneLookupResult = signal<string | null>(null);

  newOrderForm = {
    firstName: '',
    lastName: '',
    phone: '',
    address: '',
    latitude: 16.2443,
    longitude: 103.2504,
    boxCount: 2,
    note: 'มื้อเที่ยงส่งด่วน มมส.',
  };

  currentFilterLabel = signal<string>('แสดงทั้งหมด');

  private map: L.Map | null = null;
  private routeLayers: L.LayerGroup | null = null;

  ngOnInit() {
    this.checkBackendAndLoadData();
  }

  ngAfterViewInit() {
    if (this.activeTab() === 'owner') {
      setTimeout(() => this.initMap(), 300);
    }
  }

  setTab(tab: 'owner' | 'orders' | 'rider') {
    this.activeTab.set(tab);
    if (tab === 'owner') {
      setTimeout(() => {
        this.initMap();
        if (this.map) {
          this.map.invalidateSize();
          this.renderRoutesOnMap();
        }
      }, 200);
    } else if (tab === 'rider') {
      this.loadRiderSheet(this.selectedRiderId());
    }
  }

  showAlert(type: 'success' | 'error' | 'info', text: string) {
    this.alertMessage.set({ type, text });
    setTimeout(() => {
      this.alertMessage.set(null);
    }, 4500);
  }

  checkBackendAndLoadData() {
    this.isLoading.set(true);
    this.api.getOrders().subscribe({
      next: (res) => {
        this.backendConnected.set(true);
        this.orders.set(res.data);
        this.totalOrderCount.set(res.count);
        this.loadCustomers();
        this.loadRiders();
        this.loadDispatchPlan();
        this.isLoading.set(false);
      },
      error: () => {
        this.backendConnected.set(false);
        this.isLoading.set(false);
        this.showAlert('error', 'ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์ Backend ได้ กรุณาตรวจสอบสถานะการรัน API');
      },
    });
  }

  loadCustomers() {
    this.api.getCustomers().subscribe({
      next: (res) => this.customers.set(res.data),
    });
  }

  loadOrders() {
    this.customerSearchQuery = '';
    this.currentFilterLabel.set('แสดงทั้งหมด');
    this.api.getOrders().subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.totalOrderCount.set(res.count);
      },
    });
  }

  loadRiders() {
    this.api.getRiders().subscribe({
      next: (res) => this.riders.set(res.data),
    });
  }

  loadDispatchPlan() {
    this.api.getDispatchPlan().subscribe({
      next: (res) => {
        this.dispatchPlan.set(res.data);
        if (this.activeTab() === 'owner') {
          setTimeout(() => this.renderRoutesOnMap(), 200);
        }
      },
    });
  }

  optimizeRoutes() {
    this.isLoading.set(true);
    this.api.optimizeRoutes().subscribe({
      next: (res) => {
        this.dispatchPlan.set(res.data);
        this.isLoading.set(false);
        this.showAlert('success', `จัดเส้นทางสำเร็จ แบ่งงานให้ไรเดอร์ทั้งหมด ${res.data.ridersAssigned} คน`);
        this.loadOrders();
        setTimeout(() => this.renderRoutesOnMap(), 200);
      },
      error: () => {
        this.isLoading.set(false);
        this.showAlert('error', 'เกิดข้อผิดพลาดในการจัดเส้นทาง');
      },
    });
  }

  mockOrders(count = 24) {
    this.isLoading.set(true);
    this.api.mockOrders(count).subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.totalOrderCount.set(res.count);
        this.currentFilterLabel.set('แสดงทั้งหมด');
        this.customerSearchQuery = '';
        this.isLoading.set(false);
        this.showAlert('success', `จำลองออเดอร์สำเร็จ ${res.count} รายการ (รอบ มมส. ขามเรียง)`);
        this.optimizeRoutes();
      },
      error: () => {
        this.isLoading.set(false);
        this.showAlert('error', 'เกิดข้อผิดพลาดในการจำลองออเดอร์');
      },
    });
  }

  clearOrders() {
    if (!confirm('ยืนยันล้างรายการสั่งซื้อทั้งหมด?')) return;
    this.isLoading.set(true);
    this.api.clearOrders().subscribe({
      next: () => {
        this.orders.set([]);
        this.totalOrderCount.set(0);
        this.dispatchPlan.set(null);
        this.isLoading.set(false);
        this.showAlert('info', 'ล้างรายการสั่งซื้อทั้งหมดเรียบร้อยแล้ว');
        if (this.routeLayers) this.routeLayers.clearLayers();
      },
      error: () => {
        this.isLoading.set(false);
        this.showAlert('error', 'เกิดข้อผิดพลาดในการล้างออเดอร์');
      },
    });
  }

  lookupCustomerByPhone() {
    if (!this.searchPhoneQuery.trim()) return;
    this.api.getCustomerByPhone(this.searchPhoneQuery.trim()).subscribe({
      next: (res) => {
        const c = res.data;
        this.newOrderForm.firstName = c.firstName;
        this.newOrderForm.lastName = c.lastName;
        this.newOrderForm.phone = c.phone;
        this.newOrderForm.address = c.address;
        this.newOrderForm.latitude = c.latitude;
        this.newOrderForm.longitude = c.longitude;
        this.phoneLookupResult.set(`พบลูกค้าเก่า: คุณ${c.firstName} ${c.lastName}`);
        this.showAlert('success', `พบข้อมูลลูกค้าเก่า: คุณ${c.firstName} ${c.lastName} ระบบกรอกข้อมูลให้อัตโนมัติ`);
      },
      error: () => {
        this.phoneLookupResult.set('ไม่พบข้อมูลลูกค้าจากเบอร์โทรนี้ (ลูกค้าใหม่ กรุณากรอกชื่อและที่อยู่)');
      },
    });
  }

  generateRandomLocation() {
    const angle = Math.random() * 2 * Math.PI;
    const distanceOffset = 0.002 + Math.random() * 0.010;
    this.newOrderForm.latitude = Math.round((this.MSU_LAT + Math.sin(angle) * distanceOffset) * 1000000) / 1000000;
    this.newOrderForm.longitude = Math.round((this.MSU_LNG + Math.cos(angle) * distanceOffset * 1.05) * 1000000) / 1000000;
  }

  submitNewOrder() {
    if (!this.newOrderForm.firstName || !this.newOrderForm.phone || !this.newOrderForm.address) {
      this.showAlert('error', 'กรุณากรอกข้อมูลลูกค้าให้ครบถ้วน');
      return;
    }

    this.isLoading.set(true);
    this.api.createCustomer({
      firstName: this.newOrderForm.firstName,
      lastName: this.newOrderForm.lastName || 'ลูกค้า',
      phone: this.newOrderForm.phone,
      address: this.newOrderForm.address,
      latitude: this.newOrderForm.latitude,
      longitude: this.newOrderForm.longitude,
    }).subscribe({
      next: (cRes) => {
        this.api.createOrder({
          customerId: cRes.data.id,
          boxCount: this.newOrderForm.boxCount,
          note: this.newOrderForm.note,
        }).subscribe({
          next: () => {
            this.isLoading.set(false);
            this.showAlert('success', `เพิ่มออเดอร์สำเร็จ (${this.newOrderForm.boxCount} กล่อง)`);
            this.loadOrders();
            this.loadCustomers();
            this.newOrderForm.firstName = '';
            this.newOrderForm.lastName = '';
            this.newOrderForm.phone = '';
            this.newOrderForm.address = '';
            this.phoneLookupResult.set(null);
          },
          error: () => {
            this.isLoading.set(false);
            this.showAlert('error', 'ไม่สามารถสร้างออเดอร์ได้');
          },
        });
      },
      error: () => {
        this.isLoading.set(false);
        this.showAlert('error', 'ไม่สามารถบันทึกข้อมูลลูกค้าได้');
      },
    });
  }

  changeBoxCount(order: Order, delta: number) {
    const newCount = order.boxCount + delta;
    if (newCount < 1 || newCount > 3) {
      this.showAlert('info', 'จำนวนกล่องต่อออเดอร์ต้องอยู่ระหว่าง 1 ถึง 3 กล่อง');
      return;
    }
    this.api.updateOrder(order.id, { boxCount: newCount }).subscribe({
      next: () => {
        this.showAlert('success', `แก้ไขจำนวนกล่องออเดอร์ #${order.id} เป็น ${newCount} กล่อง`);
        this.loadOrders();
        this.loadDispatchPlan();
      },
    });
  }

  deleteOrder(id: number) {
    if (!confirm(`ต้องการลบรายการสั่งซื้อ #${id}?`)) return;
    this.api.deleteOrder(id).subscribe({
      next: () => {
        this.showAlert('info', `ลบรายการสั่งซื้อ #${id} เรียบร้อยแล้ว`);
        this.loadOrders();
        this.loadDispatchPlan();
      },
    });
  }

  onSearchOrders() {
    const q = this.customerSearchQuery.trim();
    if (!q) {
      this.loadOrders();
      return;
    }
    this.api.getOrders(q).subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.currentFilterLabel.set(`ค้นหา: "${q}"`);
        this.showAlert('info', `พบรายการสั่งซื้อ ${res.count} รายการ จากการค้นหา "${q}"`);
      },
      error: () => {
        this.showAlert('error', 'เกิดข้อผิดพลาดในการค้นหา');
      },
    });
  }

  filterOrdersNearby1Km() {
    this.api.getOrdersNearby(this.MSU_LAT, this.MSU_LNG, 1.0).subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.currentFilterLabel.set('ในระยะ 1 กิโลเมตร');
        this.showAlert('info', `พบรายการสั่งซื้อ ${res.count} รายการ ในรัศมี 1 กม. จาก มมส.`);
      },
      error: () => {
        this.showAlert('error', 'เกิดข้อผิดพลาดในการกรองระยะ');
      },
    });
  }

  filterOrdersNearby2Km() {
    this.api.getOrdersNearby(this.MSU_LAT, this.MSU_LNG, 2.0).subscribe({
      next: (res) => {
        this.orders.set(res.data);
        this.currentFilterLabel.set('ในระยะ 2 กิโลเมตร');
        this.showAlert('info', `พบรายการสั่งซื้อ ${res.count} รายการ ในรัศมี 2 กม. จาก มมส.`);
      },
      error: () => {
        this.showAlert('error', 'เกิดข้อผิดพลาดในการกรองระยะ');
      },
    });
  }

  selectRider(id: number) {
    this.selectedRiderId.set(id);
    this.loadRiderSheet(id);
    this.closeRiderMap();
  }

  loadRiderSheet(riderId: number) {
    this.api.getRiderSheet(riderId).subscribe({
      next: (res) => this.currentRiderSheet.set(res.data),
      error: () => this.currentRiderSheet.set(null),
    });
  }

  markDelivered(orderId?: number) {
    if (!orderId) return;
    this.api.markStopDelivered(orderId).subscribe({
      next: () => {
        this.showAlert('success', `บันทึกการส่งมอบออเดอร์ #${orderId} สำเร็จ`);
        this.loadRiderSheet(this.selectedRiderId());
        this.loadOrders();
        this.loadDispatchPlan();
      },
    });
  }

  openRiderMap(stop: RouteStop) {
    this.activeStopForMap.set(stop);
    setTimeout(() => {
      this.initRiderModalMap(stop);
    }, 200);
  }

  closeRiderMap() {
    this.activeStopForMap.set(null);
    if (this.riderModalMap) {
      this.riderModalMap.remove();
      this.riderModalMap = null;
    }
  }

  private initRiderModalMap(stop: RouteStop) {
    const container = document.getElementById('rider-modal-map');
    if (!container) return;

    if (this.riderModalMap) {
      this.riderModalMap.remove();
      this.riderModalMap = null;
    }

    const depotLat = this.MSU_LAT;
    const depotLng = this.MSU_LNG;

    this.riderModalMap = L.map('rider-modal-map').setView([stop.latitude, stop.longitude], 15);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: 'OpenStreetMap contributors',
    }).addTo(this.riderModalMap);

    const depotIcon = L.divIcon({
      html: `<div class="flex items-center justify-center w-7 h-7 bg-slate-900 text-white rounded-md text-[10px] font-bold border border-white">ร้าน</div>`,
      className: 'depot-custom-marker',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
    L.marker([depotLat, depotLng], { icon: depotIcon })
      .bindPopup('<b>ร้านส่งด่วนมื้อเที่ยง (ตลาดน้อย มมส.)</b>')
      .addTo(this.riderModalMap);

    const customerIcon = L.divIcon({
      html: `<div class="flex items-center justify-center w-8 h-8 bg-orange-600 text-white rounded-full text-xs font-bold border-2 border-white shadow">${stop.stopOrder}</div>`,
      className: 'stop-custom-marker',
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });
    L.marker([stop.latitude, stop.longitude], { icon: customerIcon })
      .bindPopup(`<b>จุดที่ ${stop.stopOrder}: ${stop.customerName}</b><br>${stop.address}`)
      .addTo(this.riderModalMap)
      .openPopup();

    // ดึงเส้นทางขับขี่ตามถนนจริงไปยังจุดส่ง (OSRM)
    const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${depotLng},${depotLat};${stop.longitude},${stop.latitude}?overview=full&geometries=geojson`;
    fetch(osrmUrl)
      .then((res) => res.json())
      .then((data) => {
        if (!this.riderModalMap) return;
        if (data?.code === 'Ok' && data.routes?.[0]?.geometry?.coordinates?.length) {
          const roadPoints: [number, number][] = data.routes[0].geometry.coordinates.map(
            (pt: [number, number]) => [pt[1], pt[0]]
          );
          L.polyline(roadPoints, {
            color: '#EA580C',
            weight: 5,
            opacity: 0.9,
          }).addTo(this.riderModalMap);
          this.riderModalMap.fitBounds(L.latLngBounds(roadPoints), { padding: [40, 40] });
        } else {
          this.drawFallbackModalPolyline(depotLat, depotLng, stop);
        }
      })
      .catch(() => {
        if (this.riderModalMap) {
          this.drawFallbackModalPolyline(depotLat, depotLng, stop);
        }
      });

    setTimeout(() => this.riderModalMap?.invalidateSize(), 150);
  }

  private drawFallbackModalPolyline(depotLat: number, depotLng: number, stop: RouteStop) {
    if (!this.riderModalMap) return;
    L.polyline(
      [
        [depotLat, depotLng],
        [stop.latitude, stop.longitude],
      ],
      {
        color: '#EA580C',
        weight: 5,
        dashArray: '6, 6',
        opacity: 0.9,
      }
    ).addTo(this.riderModalMap);
    const bounds = L.latLngBounds([
      [depotLat, depotLng],
      [stop.latitude, stop.longitude],
    ]);
    this.riderModalMap.fitBounds(bounds, { padding: [40, 40] });
  }

  private initMap() {
    const mapContainer = document.getElementById('route-map');
    if (!mapContainer) return;

    if (this.map) {
      this.map.invalidateSize();
      return;
    }

    const depotLat = this.MSU_LAT;
    const depotLng = this.MSU_LNG;

    this.map = L.map('route-map', {
      center: [depotLat, depotLng],
      zoom: 14,
    });

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: 'OpenStreetMap contributors',
    }).addTo(this.map);

    this.routeLayers = L.layerGroup().addTo(this.map);
    this.renderRoutesOnMap();

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 200);
  }

  private renderRoutesOnMap() {
    if (!this.map || !this.routeLayers) return;

    this.routeLayers.clearLayers();

    const plan = this.dispatchPlan();
    const depotLat = plan ? plan.restaurantLocation.latitude : this.MSU_LAT;
    const depotLng = plan ? plan.restaurantLocation.longitude : this.MSU_LNG;


    const depotIcon = L.divIcon({
      html: `
        <div class="flex items-center justify-center w-9 h-9 bg-slate-900 text-white rounded-lg shadow-md border-2 border-white text-xs font-bold">
          ร้าน
        </div>
      `,
      className: 'depot-custom-marker',
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });

    const depotMarker = L.marker([depotLat, depotLng], { icon: depotIcon }).addTo(this.routeLayers);
    depotMarker.bindPopup(`
      <div class="p-2 font-['Prompt',sans-serif]">
        <h4 class="font-bold text-slate-900 text-sm">ร้านส่งด่วนมื้อเที่ยง (ตลาดน้อย มมส.)</h4>
        <p class="text-xs text-slate-600 mt-1">จุดเริ่มต้นรับข้าวกล่อง ศูนย์อาหารตลาดน้อย มมส. ขามเรียง</p>
        <span class="inline-block mt-2 px-2 py-0.5 bg-slate-100 text-slate-800 text-[11px] rounded">พร้อมออกส่ง: 11:30 น.</span>
      </div>
    `);

    if (!plan || plan.routes.length === 0) {
      this.map.setView([depotLat, depotLng], 14);
      return;
    }

    const bounds = L.latLngBounds([[depotLat, depotLng]]);

    plan.routes.forEach((route: RiderRoute, idx: number) => {
      const color = route.color || ['#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899'][idx % 6];

      const polyline = L.polyline(route.polylineCoordinates, {
        color,
        weight: 4,
        opacity: 0.85,
      }).addTo(this.routeLayers!);

      polyline.bindPopup(`
        <div class="p-1 font-['Prompt',sans-serif]">
          <h4 class="font-bold text-sm" style="color: ${color}">${route.rider.name}</h4>
          <p class="text-xs text-slate-600">จำนวนกล่อง: <b>${route.totalBoxes} / 10 กล่อง</b></p>
          <p class="text-xs text-slate-600">ระยะทางรวม: <b>${route.totalDistanceKm} กม.</b> (~${route.estimatedDurationMinutes} นาที)</p>
        </div>
      `);

      route.stops.forEach((stop) => {
        bounds.extend([stop.latitude, stop.longitude]);

        const stopIcon = L.divIcon({
          html: `
            <div class="flex items-center justify-center w-6 h-6 text-white font-bold text-xs rounded-full shadow-md border-2 border-white" style="background-color: ${color};">
              ${stop.stopOrder}
            </div>
          `,
          className: 'stop-custom-marker',
          iconSize: [24, 24],
          iconAnchor: [12, 12],
        });

        const marker = L.marker([stop.latitude, stop.longitude], { icon: stopIcon }).addTo(this.routeLayers!);
        marker.bindPopup(`
          <div class="p-2 font-['Prompt',sans-serif] min-w-[170px]">
            <div class="flex items-center justify-between gap-2 border-b pb-1 mb-1">
              <span class="font-bold text-xs text-slate-800">จุดที่ ${stop.stopOrder}</span>
              <span class="text-[11px] font-semibold px-1.5 py-0.2 rounded text-white" style="background-color: ${color}">${stop.boxCount} กล่อง</span>
            </div>
            <p class="font-medium text-xs text-slate-900">${stop.customerName}</p>
            <p class="text-[11px] text-slate-500">${stop.address}</p>
            <p class="text-[11px] text-slate-500">โทร: ${stop.phone}</p>
            <p class="text-xs text-slate-700 font-medium mt-1">เวลาถึงโดยประมาณ: ${stop.estimatedArrival}</p>
            <div class="mt-2 text-center">
              <span class="text-[10px] px-2 py-0.5 rounded-full ${stop.status === 'delivered' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-100 text-slate-700'}">
                ${stop.status === 'delivered' ? 'ส่งมอบแล้ว' : 'รอดำเนินการ'}
              </span>
            </div>
          </div>
        `);
      });
    });

    this.map.fitBounds(bounds, { padding: [40, 40] });
    setTimeout(() => this.map?.invalidateSize(), 150);
  }
}
