import { Injectable } from '@angular/core';
import { DeliveryStop } from '../models/delivery.model';

/**
 * Service ดึงพิกัด GPS และคำนวณเส้นทางตามแนวถนนจริง (OSRM - Open Source Routing Machine)
 * แยกไฟล์ออกมาเพื่อความสะดวกและชัดเจนเวลาพรีเซนต์โปรเจกต์
 */
@Injectable({
  providedIn: 'root',
})
export class OsrmService {
  // แคชเส้นทางตามถนนจริงเพื่อลดการยิง API ซ้ำ และโหลดเร็วขึ้น
  private roadPathCache = new Map<string, [number, number][]>();

  /**
   * ดึงเส้นทางวิ่งตามแนวถนนจริงจาก OSRM
   * ส่งพิกัดจุดแวะทั้งหมดไปคำนวณเส้นทางตามโครงข่ายถนนจริง ไม่ตัดผ่านตึก
   */
  async getRoadGeometry(stops: DeliveryStop[]): Promise<[number, number][]> {
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
}
