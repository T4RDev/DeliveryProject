import { db, RESTAURANT_DEPOT, calculateDistanceKm } from '../db/database';
import { Order } from '../models/Order';
import { Rider } from '../models/Rider';
import { DispatchPlan, RiderRoute, RouteStop } from '../models/Route';

interface OsrmLeg {
  distance: number;
  duration: number;
}

interface OsrmRoute {
  distance: number;
  duration: number;
  geometry: {
    coordinates: [number, number][]; // [lng, lat]
  };
  legs: OsrmLeg[];
}

interface OsrmResponse {
  code: string;
  routes?: OsrmRoute[];
}

/**
 * ดึงข้อมูลเส้นทางและโครงข่ายถนนจริงผ่าน OSRM (Open Source Routing Machine)
 * เพื่อให้เส้นทางคำนวณตามแนวถนนจริง ไม่ใช่เส้นตรงเครื่องบิน
 */
async function fetchRoadRoute(
  waypoints: Array<{ latitude: number; longitude: number }>
): Promise<{
  polylineCoordinates: [number, number][];
  legDistancesKm: number[];
  legDurationsMinutes: number[];
  totalDistanceKm: number;
  totalDurationMinutes: number;
} | null> {
  if (waypoints.length < 2) return null;
  try {
    const coordStr = waypoints.map((w) => `${w.longitude},${w.latitude}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordStr}?overview=full&geometries=geojson`;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 7000);
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) return null;
    const data = (await response.json()) as OsrmResponse;
    if (data.code !== 'Ok' || !data.routes || data.routes.length === 0) return null;

    const route = data.routes[0];
    // OSRM ส่งกลับมาเป็น [lng, lat] จึงแปลงเป็น [lat, lng] ให้ตรงกับ Leaflet
    const polylineCoordinates: [number, number][] = route.geometry.coordinates.map(
      (c) => [c[1], c[0]] as [number, number]
    );

    const legDistancesKm = (route.legs || []).map(
      (leg) => Math.round((leg.distance / 1000) * 100) / 100
    );
    const legDurationsMinutes = (route.legs || []).map(
      (leg) => Math.max(1, Math.round(leg.duration / 60))
    );

    return {
      polylineCoordinates,
      legDistancesKm,
      legDurationsMinutes,
      totalDistanceKm: Math.round((route.distance / 1000) * 10) / 10,
      totalDurationMinutes: Math.round(route.duration / 60),
    };
  } catch (error) {
    console.warn('OSRM road route fetch fallback triggered:', error);
    return null;
  }
}

export class RoutingService {
  async optimizeRoutes(): Promise<DispatchPlan> {
    const orders = db.getAllOrders().filter((o) => o.status !== 'delivered');
    const riders = db.getRiders();

    if (orders.length === 0) {
      const emptyPlan: DispatchPlan = {
        planId: `PLAN-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        restaurantLocation: RESTAURANT_DEPOT,
        totalOrders: 0,
        totalBoxes: 0,
        ridersAssigned: 0,
        routes: [],
        summary: {
          avgTimePerRiderMinutes: 0,
          totalDistanceAllRidersKm: 0,
          allOnTime: true,
          estimatedSavedPenaltyBaht: 0,
        },
      };
      lastDispatchPlan = emptyPlan;
      return emptyPlan;
    }

    const totalBoxes = orders.reduce((sum, o) => sum + o.boxCount, 0);

    // คำนวณมุมเชิงขั้ว (Polar Angle) เพื่อแบ่ง Cluster ตามทิศทางรอบ มมส. ขามเรียง
    const ordersWithAngle = orders.map((order) => {
      const lat = order.customer?.latitude ?? RESTAURANT_DEPOT.latitude;
      const lng = order.customer?.longitude ?? RESTAURANT_DEPOT.longitude;
      const angle = Math.atan2(lat - RESTAURANT_DEPOT.latitude, lng - RESTAURANT_DEPOT.longitude);
      const distFromDepot = calculateDistanceKm(
        RESTAURANT_DEPOT.latitude,
        RESTAURANT_DEPOT.longitude,
        lat,
        lng
      );
      return { order, angle, distFromDepot, lat, lng };
    });

    ordersWithAngle.sort((a, b) => a.angle - b.angle);

    // จัดกลุ่มตามความจุสูงสุดของไรเดอร์ (ไม่เกิน 10 กล่องต่อคัน)
    const riderClusters: Array<{ orders: Order[]; boxCount: number }> = [];
    let currentClusterOrders: Order[] = [];
    let currentClusterBoxes = 0;

    for (const item of ordersWithAngle) {
      if (currentClusterBoxes + item.order.boxCount > 10) {
        if (currentClusterOrders.length > 0) {
          riderClusters.push({
            orders: currentClusterOrders,
            boxCount: currentClusterBoxes,
          });
        }
        currentClusterOrders = [item.order];
        currentClusterBoxes = item.order.boxCount;
      } else {
        currentClusterOrders.push(item.order);
        currentClusterBoxes += item.order.boxCount;
      }
    }

    if (currentClusterOrders.length > 0) {
      riderClusters.push({
        orders: currentClusterOrders,
        boxCount: currentClusterBoxes,
      });
    }

    // ประมวลผลเส้นทางของไรเดอร์แต่ละคันตามโครงข่ายถนนจริง
    const routePromises = riderClusters.map(async (cluster, idx) => {
      const rider: Rider = riders[idx % riders.length];

      // จัดลำดับจุดส่งด้วย Nearest Neighbor TSP
      let unvisited = [...cluster.orders];
      const orderedOrders: Order[] = [];
      let currentLat = RESTAURANT_DEPOT.latitude;
      let currentLng = RESTAURANT_DEPOT.longitude;

      while (unvisited.length > 0) {
        let bestIndex = 0;
        let bestDistance = Infinity;

        for (let i = 0; i < unvisited.length; i++) {
          const ord = unvisited[i];
          const custLat = ord.customer?.latitude ?? currentLat;
          const custLng = ord.customer?.longitude ?? currentLng;
          const dist = calculateDistanceKm(currentLat, currentLng, custLat, custLng);
          if (dist < bestDistance) {
            bestDistance = dist;
            bestIndex = i;
          }
        }

        const nextOrder = unvisited.splice(bestIndex, 1)[0];
        orderedOrders.push(nextOrder);
        currentLat = nextOrder.customer?.latitude ?? currentLat;
        currentLng = nextOrder.customer?.longitude ?? currentLng;
      }

      // พิกัดจุดแวะ: ร้าน -> จุดส่ง 1..N -> ร้าน
      const waypoints = [
        { latitude: RESTAURANT_DEPOT.latitude, longitude: RESTAURANT_DEPOT.longitude },
        ...orderedOrders.map((ord) => ({
          latitude: ord.customer?.latitude ?? RESTAURANT_DEPOT.latitude,
          longitude: ord.customer?.longitude ?? RESTAURANT_DEPOT.longitude,
        })),
        { latitude: RESTAURANT_DEPOT.latitude, longitude: RESTAURANT_DEPOT.longitude },
      ];

      // ดึงเส้นทางวิ่งจริงตามถนนจาก OSRM
      const roadRoute = await fetchRoadRoute(waypoints);

      const stops: RouteStop[] = [];
      let lastLat = RESTAURANT_DEPOT.latitude;
      let lastLng = RESTAURANT_DEPOT.longitude;
      let routeDistanceKm = 0;
      let accumulatedMinutes = 0;

      orderedOrders.forEach((ord, stopIdx) => {
        const custLat = ord.customer?.latitude ?? lastLat;
        const custLng = ord.customer?.longitude ?? lastLng;

        // คำนวณระยะทางจริงตามถนน (หาก fallback ใช้ตัวคูณโค้งถนน 1.35)
        const legDist =
          roadRoute?.legDistancesKm[stopIdx] ??
          Math.round(calculateDistanceKm(lastLat, lastLng, custLat, custLng) * 1.35 * 100) / 100;
        routeDistanceKm += legDist;

        // เวลาวิ่งจริงตามถนน + เผื่อเวลาส่งมอบ 3 นาที
        const travelMinutes =
          roadRoute?.legDurationsMinutes[stopIdx] ?? Math.max(1, Math.round(legDist * 2.5));
        accumulatedMinutes += travelMinutes + 3;

        const totalMinutesFrom1130 = 30 + accumulatedMinutes;
        const hour = 11 + Math.floor(totalMinutesFrom1130 / 60);
        const minute = totalMinutesFrom1130 % 60;
        const etaString = `${hour}:${String(minute).padStart(2, '0')} น.`;

        stops.push({
          stopOrder: stopIdx + 1,
          type: 'delivery',
          orderId: ord.id,
          order: ord,
          customerName: ord.customer
            ? `${ord.customer.firstName} ${ord.customer.lastName}`
            : 'ลูกค้าทั่วไป',
          phone: ord.customer?.phone || '-',
          address: ord.customer?.address || 'จุดส่งสินค้า',
          latitude: custLat,
          longitude: custLng,
          boxCount: ord.boxCount,
          estimatedArrival: etaString,
          distanceFromPrevKm: legDist,
          status: ord.status === 'delivered' ? 'delivered' : 'pending',
        });

        lastLat = custLat;
        lastLng = custLng;

        db.updateOrder(ord.id, { assignedRiderId: rider.id, status: 'assigned' });
      });

      // ขากลับจากจุดส่งสุดท้ายกลับร้าน
      const returnLegIndex = orderedOrders.length;
      const returnDist =
        roadRoute?.legDistancesKm[returnLegIndex] ??
        Math.round(
          calculateDistanceKm(
            lastLat,
            lastLng,
            RESTAURANT_DEPOT.latitude,
            RESTAURANT_DEPOT.longitude
          ) * 1.35 * 100
        ) / 100;
      routeDistanceKm += returnDist;

      const returnTravelMinutes =
        roadRoute?.legDurationsMinutes[returnLegIndex] ?? Math.max(1, Math.round(returnDist * 2.5));
      accumulatedMinutes += returnTravelMinutes;

      // เส้น Polyline เลี้ยวตามถนนจริงในแผนที่
      const polylineCoordinates: [number, number][] =
        roadRoute && roadRoute.polylineCoordinates.length > 0
          ? roadRoute.polylineCoordinates
          : [
              [RESTAURANT_DEPOT.latitude, RESTAURANT_DEPOT.longitude],
              ...orderedOrders.map(
                (o) =>
                  [
                    o.customer?.latitude ?? RESTAURANT_DEPOT.latitude,
                    o.customer?.longitude ?? RESTAURANT_DEPOT.longitude,
                  ] as [number, number]
              ),
              [RESTAURANT_DEPOT.latitude, RESTAURANT_DEPOT.longitude],
            ];

      const roundTripDist = roadRoute
        ? roadRoute.totalDistanceKm
        : Math.round(routeDistanceKm * 10) / 10;

      return {
        riderId: rider.id,
        rider,
        totalBoxes: cluster.boxCount,
        totalDistanceKm: roundTripDist,
        estimatedDurationMinutes: accumulatedMinutes,
        color: rider.color,
        stops,
        polylineCoordinates,
        isOverCapacity: cluster.boxCount > 10,
        isLateRisk: accumulatedMinutes > 60,
      } as RiderRoute;
    });

    const routes: RiderRoute[] = await Promise.all(routePromises);

    const totalSystemDistance = routes.reduce((sum, r) => sum + r.totalDistanceKm, 0);
    const totalSystemDuration = routes.reduce((sum, r) => sum + r.estimatedDurationMinutes, 0);

    const plan: DispatchPlan = {
      planId: `DISPATCH-${Date.now()}`,
      generatedAt: new Date().toISOString(),
      restaurantLocation: RESTAURANT_DEPOT,
      totalOrders: orders.length,
      totalBoxes,
      ridersAssigned: routes.length,
      routes,
      summary: {
        avgTimePerRiderMinutes:
          routes.length > 0 ? Math.round(totalSystemDuration / routes.length) : 0,
        totalDistanceAllRidersKm: Math.round(totalSystemDistance * 10) / 10,
        allOnTime: routes.every((r) => !r.isLateRisk),
        estimatedSavedPenaltyBaht: orders.length * 20,
      },
    };

    lastDispatchPlan = plan;
    return plan;
  }

  async getCurrentPlan(): Promise<DispatchPlan | null> {
    if (!lastDispatchPlan) {
      return await this.optimizeRoutes();
    }
    return lastDispatchPlan;
  }

  markStopDelivered(orderId: number): boolean {
    const updated = db.updateOrder(orderId, {
      status: 'delivered',
      deliveredAt: new Date().toISOString(),
    });

    if (lastDispatchPlan) {
      for (const route of lastDispatchPlan.routes) {
        for (const stop of route.stops) {
          if (stop.orderId === orderId) {
            stop.status = 'delivered';
          }
        }
      }
    }
    return !!updated;
  }

  async resetDispatch(): Promise<DispatchPlan> {
    const orders = db.getAllOrders();
    for (const ord of orders) {
      db.updateOrder(ord.id, {
        status: 'pending',
        assignedRiderId: undefined,
        deliveredAt: undefined,
      });
    }
    return await this.optimizeRoutes();
  }
}

let lastDispatchPlan: DispatchPlan | null = null;
export const routingService = new RoutingService();
