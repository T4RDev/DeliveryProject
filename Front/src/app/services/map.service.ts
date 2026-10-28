import { Injectable, inject } from '@angular/core';
import * as L from 'leaflet';
import { RoutingOptimizationResult, DeliveryStop, Customer } from '../models/delivery.model';
import { OsrmService } from './osrm.service';
import { buildStopNavigationUrl } from '../utils/constants';

/**
 * Service จัดการแผนที่ Leaflet และวาดหมุด/เส้นทางจัดส่ง
 * (แยกออกมาเพื่อความเข้าใจง่ายเวลาพรีเซนต์โปรเจกต์)
 */
@Injectable({
  providedIn: 'root',
})
export class MapService {
  private osrm = inject(OsrmService);

  private map: L.Map | null = null;
  private routeLayerGroup: L.LayerGroup | null = null;

  /**
   * เริ่มต้นสร้างแผนที่ Leaflet
   */
  initMap(elementId: string = 'deliveryMap', centerLat: number = 16.2465, centerLng: number = 103.2510): L.Map | null {
    const mapElement = document.getElementById(elementId);
    if (!mapElement) return null;

    // ถ้า map มีอยู่แล้วแต่ container หลุด ให้ทำลายแล้วสร้างใหม่
    if (this.map) {
      try {
        if (!mapElement.contains(this.map.getContainer())) {
          this.map.remove();
          this.map = null;
        } else {
          this.map.invalidateSize();
          return this.map;
        }
      } catch (e) {
        this.map = null;
      }
    }

    // จุดศูนย์กลาง: ศูนย์อาหารตลาดน้อย มมส. ขามเรียง
    this.map = L.map(elementId, {
      fadeAnimation: false, // ปิด fade animation ป้องกัน tile กลายเป็นสีขาว
    }).setView([centerLat, centerLng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);

    this.routeLayerGroup = L.layerGroup().addTo(this.map);

    // ปักหมุดร้านศูนย์อาหารตลาดน้อย มมส. เป็นค่าเริ่มต้น
    this.renderDepotMarker(centerLat, centerLng);

    return this.map;
  }

  /**
   * สั่งปรับขนาดแผนที่ให้พอดีคอนเทนเนอร์ (ใช้เวลาสลับหน้าจอ)
   */
  invalidateSize() {
    if (this.map) {
      this.map.invalidateSize();
    }
  }

  /**
   * ปักหมุดจุดศูนย์กลางร้าน (ตลาดน้อย มมส.)
   */
  renderDepotMarker(lat: number = 16.2465, lng: number = 103.2510) {
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

    L.marker([lat, lng], { icon: depotIcon })
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

  /**
   * วาดหมุดลูกค้าและเส้นทางวิ่งตามแนวถนนจริงสำหรับไรเดอร์แต่ละคน
   */
  async renderRoutesOnMap(result: RoutingOptimizationResult, highlightRiderId: number | null = null) {
    if (!this.map || !this.routeLayerGroup) return;

    this.routeLayerGroup.clearLayers();
    this.renderDepotMarker(result.depot.lat, result.depot.lng);

    const bounds: L.LatLngExpression[] = [[result.depot.lat, result.depot.lng]];

    // กรองไรเดอร์ที่ต้องการแสดง
    const ridersToRender = highlightRiderId
      ? result.riders.filter((r) => r.riderId === highlightRiderId)
      : result.riders;

    // 1. นับจำนวนจุดส่งที่พิกัดซ้ำกัน เพื่อขยับหมุดไม่ให้ทับซ้อนกัน (Spiderfy Offset)
    const coordTotalCount: { [key: string]: number } = {};
    const coordSeenCount: { [key: string]: number } = {};

    ridersToRender.forEach((rider) => {
      rider.stops.forEach((stop) => {
        if (stop.type === 'customer') {
          const key = `${stop.lat.toFixed(4)}_${stop.lng.toFixed(4)}`;
          coordTotalCount[key] = (coordTotalCount[key] || 0) + 1;
        }
      });
    });

    // 2. ปักหมุดลูกค้าทั้งหมด
    ridersToRender.forEach((rider) => {
      rider.stops.forEach((stop) => {
        bounds.push([stop.lat, stop.lng]);

        if (stop.type === 'customer') {
          const key = `${stop.lat.toFixed(4)}_${stop.lng.toFixed(4)}`;
          const totalAtPoint = coordTotalCount[key] || 1;
          const indexAtPoint = coordSeenCount[key] || 0;
          coordSeenCount[key] = indexAtPoint + 1;

          let markerLat = stop.lat;
          let markerLng = stop.lng;

          // ถ้ามีจุดส่งซ้ำพิกัดเดียวกัน ให้กระจายหมุดออกเป็นวงกลมเล็กๆ เพื่อให้มองเห็นครบทุกจุด (ไม่ทับกัน)
          if (totalAtPoint > 1) {
            const angle = (indexAtPoint * (2 * Math.PI)) / totalAtPoint;
            const offsetRadius = 0.00022; // ~20-25 เมตร
            markerLat = stop.lat + Math.sin(angle) * offsetRadius;
            markerLng = stop.lng + Math.cos(angle) * offsetRadius * 1.1;
          }

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
                <a href="${buildStopNavigationUrl(stop)}" target="_blank" style="display: inline-block; background-color: #2563eb; color: white; padding: 3px 8px; border-radius: 4px; text-decoration: none; font-size: 11px;">
                  เปิดแผนที่นำทาง
                </a>
              </div>
            </div>
          `;

          const marker = L.marker([markerLat, markerLng], { icon: markerIcon }).bindPopup(popupContent);
          this.routeLayerGroup?.addLayer(marker);
        }
      });
    });

    if (bounds.length > 1) {
      this.map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
    }

    // 2. ดึงและวาดเส้นทางตามแนวถนนจริง (OSRM) สำหรับไรเดอร์แต่ละคน
    for (const rider of ridersToRender) {
      const roadCoords = await this.osrm.getRoadGeometry(rider.stops);

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

  /**
   * ล้างเส้นทางบนแผนที่
   */
  clearMapRoutes(depotLat: number = 16.2465, depotLng: number = 103.2510) {
    this.routeLayerGroup?.clearLayers();
    this.renderDepotMarker(depotLat, depotLng);
  }

  /**
   * ปักหมุดบ้านลูกค้าทุกคนบนแผนที่ สำหรับหน้าจัดการข้อมูลลูกค้า
   */
  renderCustomerLocations(customers: Customer[], selectedCustomerId?: number | null) {
    if (!this.map || !this.routeLayerGroup) return;

    this.routeLayerGroup.clearLayers();
    this.renderDepotMarker();

    const bounds: L.LatLngExpression[] = [[16.2465, 103.2510]];

    customers.forEach((cust) => {
      if (cust.lat == null || cust.lng == null) return;
      bounds.push([cust.lat, cust.lng]);

      const isSelected = selectedCustomerId != null && cust.id === selectedCustomerId;
      const markerIcon = L.divIcon({
        className: 'customer-home-marker',
        html: `
          <div style="background-color: ${isSelected ? '#ea580c' : '#0284c7'}; color: white; width: ${isSelected ? '32px' : '26px'}; height: ${isSelected ? '32px' : '26px'}; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-weight: bold; font-size: 11px; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.35);">
            ${cust.id}
          </div>
        `,
        iconSize: isSelected ? [32, 32] : [26, 26],
        iconAnchor: isSelected ? [16, 16] : [13, 13],
        popupAnchor: isSelected ? [0, -16] : [0, -13],
      });

      const popupContent = `
        <div style="font-family: 'Prompt', sans-serif; font-size: 12px; line-height: 1.4;">
          <strong style="color: #0369a1; font-size: 13px;">${cust.firstName} ${cust.lastName} (รหัส ${cust.id})</strong><br>
          <span style="color: #475569;">เบอร์โทร: ${cust.phone}</span><br>
          <span style="color: #475569;">ที่อยู่: ${cust.address}</span><br>
          <span style="color: #94a3b8; font-size: 11px;">พิกัด: ${cust.lat.toFixed(4)}, ${cust.lng.toFixed(4)}</span>
        </div>
      `;

      const marker = L.marker([cust.lat, cust.lng], { icon: markerIcon }).bindPopup(popupContent);
      this.routeLayerGroup?.addLayer(marker);

      if (isSelected) {
        marker.openPopup();
      }
    });

    if (bounds.length > 1) {
      this.map.fitBounds(L.latLngBounds(bounds), { padding: [40, 40] });
    }
  }

  getMap(): L.Map | null {
    return this.map;
  }
}
