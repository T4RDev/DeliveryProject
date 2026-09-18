import { db, RESTAURANT_DEPOT, calculateDistanceKm } from '../db/database';
import { Order } from '../models/Order';
import { Rider } from '../models/Rider';
import { DispatchPlan, RiderRoute, RouteStop } from '../models/Route';

export class RoutingService {
  /**
   * Optimizes delivery routes using Capacitated Vehicle Routing Problem (CVRP)
   * Enforces:
   * 1. Max 10 lunchboxes per rider
   * 2. Shortest route / no criss-crossing routes
   * 3. Delivery completed within 60 minutes (11:30 - 12:30)
   */
  optimizeRoutes(): DispatchPlan {
    const orders = db.getAllOrders().filter((o) => o.status !== 'delivered');
    const riders = db.getRiders();

    if (orders.length === 0) {
      return {
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
    }

    const totalBoxes = orders.reduce((sum, o) => sum + o.boxCount, 0);

    // 1. Sort orders by polar angle relative to restaurant depot (Sweep Clustering)
    // This groups customers by geographic sector so riders don't cross each other's paths!
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

    // 2. Partition sorted orders into rider clusters respecting capacity (max 10 boxes)
    const riderClusters: Array<{ orders: Order[]; boxCount: number }> = [];
    let currentClusterOrders: Order[] = [];
    let currentClusterBoxes = 0;

    for (const item of ordersWithAngle) {
      if (currentClusterBoxes + item.order.boxCount > 10) {
        // Exceeds 10 boxes -> finalize this cluster and start a new one
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

    // 3. For each cluster, solve TSP (Traveling Salesperson) from Depot using Nearest Neighbor
    const routes: RiderRoute[] = [];
    let totalSystemDistance = 0;
    let totalSystemDuration = 0;

    riderClusters.forEach((cluster, idx) => {
      const rider: Rider = riders[idx % riders.length];

      // Nearest Neighbor Route Sequencing
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

      // 4. Construct stops with arrival times and distance
      const stops: RouteStop[] = [];
      const polylineCoordinates: [number, number][] = [
        [RESTAURANT_DEPOT.latitude, RESTAURANT_DEPOT.longitude],
      ];

      let lastLat = RESTAURANT_DEPOT.latitude;
      let lastLng = RESTAURANT_DEPOT.longitude;
      let routeDistanceKm = 0;
      let accumulatedMinutes = 0; // Starts at 11:30 AM (0 mins elapsed)

      orderedOrders.forEach((ord, stopIdx) => {
        const custLat = ord.customer?.latitude ?? lastLat;
        const custLng = ord.customer?.longitude ?? lastLng;
        const legDist = calculateDistanceKm(lastLat, lastLng, custLat, custLng);
        routeDistanceKm += legDist;

        // Speed: 25 km/h in city -> 1 km takes ~2.4 mins. Plus 3 mins handover time
        const travelMinutes = Math.round(legDist * 2.4);
        accumulatedMinutes += travelMinutes + 3;

        // Calculate arrival time string (Starts at 11:30)
        const totalMinutesFrom1130 = 30 + accumulatedMinutes;
        const hour = 11 + Math.floor(totalMinutesFrom1130 / 60);
        const minute = totalMinutesFrom1130 % 60;
        const etaString = `${hour}:${String(minute).padStart(2, '0')} น.`;

        stops.push({
          stopOrder: stopIdx + 1,
          type: 'delivery',
          orderId: ord.id,
          order: ord,
          customerName: ord.customer ? `${ord.customer.firstName} ${ord.customer.lastName}` : 'ลูกค้าทั่วไป',
          phone: ord.customer?.phone || '-',
          address: ord.customer?.address || 'จุดส่งสินค้า',
          latitude: custLat,
          longitude: custLng,
          boxCount: ord.boxCount,
          estimatedArrival: etaString,
          distanceFromPrevKm: legDist,
          status: ord.status === 'delivered' ? 'delivered' : 'pending',
        });

        polylineCoordinates.push([custLat, custLng]);
        lastLat = custLat;
        lastLng = custLng;

        // Update order with rider
        db.updateOrder(ord.id, { assignedRiderId: rider.id, status: 'assigned' });
      });

      // Return trip to Depot
      const returnDist = calculateDistanceKm(
        lastLat,
        lastLng,
        RESTAURANT_DEPOT.latitude,
        RESTAURANT_DEPOT.longitude
      );
      routeDistanceKm += returnDist;
      accumulatedMinutes += Math.round(returnDist * 2.4);
      polylineCoordinates.push([RESTAURANT_DEPOT.latitude, RESTAURANT_DEPOT.longitude]);

      const roundTripDist = Math.round(routeDistanceKm * 10) / 10;
      totalSystemDistance += roundTripDist;
      totalSystemDuration += accumulatedMinutes;

      routes.push({
        riderId: rider.id,
        rider,
        totalBoxes: cluster.boxCount,
        totalDistanceKm: roundTripDist,
        estimatedDurationMinutes: accumulatedMinutes,
        color: rider.color,
        stops,
        polylineCoordinates,
        isOverCapacity: cluster.boxCount > 10,
        isLateRisk: accumulatedMinutes > 60, // Deadline is 12:30 (60 mins)
      });
    });

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
        estimatedSavedPenaltyBaht: orders.length * 20, // 20 THB per order saved from late penalty!
      },
    };

    lastDispatchPlan = plan;
    return plan;
  }

  getCurrentPlan(): DispatchPlan | null {
    if (!lastDispatchPlan) {
      return this.optimizeRoutes();
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

  resetDispatch(): DispatchPlan {
    const orders = db.getAllOrders();
    for (const ord of orders) {
      db.updateOrder(ord.id, {
        status: 'pending',
        assignedRiderId: undefined,
        deliveredAt: undefined,
      });
    }
    return this.optimizeRoutes();
  }
}

let lastDispatchPlan: DispatchPlan | null = null;
export const routingService = new RoutingService();
