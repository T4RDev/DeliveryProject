import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Customer, Order, Rider, DispatchPlan, RiderSheetData, MsuLandmark } from '../models/delivery.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private baseUrl = environment.apiUrl;

  getCustomers(): Observable<{ success: boolean; count: number; data: Customer[] }> {
    return this.http.get<{ success: boolean; count: number; data: Customer[] }>(`${this.baseUrl}/customers`);
  }

  getMsuLandmarks(): Observable<{ success: boolean; count: number; data: MsuLandmark[] }> {
    return this.http.get<{ success: boolean; count: number; data: MsuLandmark[] }>(`${this.baseUrl}/customers/landmarks`);
  }

  searchCustomers(q: string): Observable<{ success: boolean; count: number; data: Customer[] }> {
    return this.http.get<{ success: boolean; count: number; data: Customer[] }>(`${this.baseUrl}/customers/search?q=${encodeURIComponent(q)}`);
  }

  getCustomerByPhone(phone: string): Observable<{ success: boolean; data: Customer }> {
    return this.http.get<{ success: boolean; data: Customer }>(`${this.baseUrl}/customers/phone/${encodeURIComponent(phone)}`);
  }

  getCustomersNearby(lat: number, lng: number, radius = 1): Observable<{ success: boolean; count: number; data: Customer[] }> {
    return this.http.get<{ success: boolean; count: number; data: Customer[] }>(`${this.baseUrl}/customers/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  createCustomer(customer: Partial<Customer>): Observable<{ success: boolean; message: string; data: Customer }> {
    return this.http.post<{ success: boolean; message: string; data: Customer }>(`${this.baseUrl}/customers`, customer);
  }

  updateCustomer(id: number, customer: Partial<Customer>): Observable<{ success: boolean; message: string; data: Customer }> {
    return this.http.put<{ success: boolean; message: string; data: Customer }>(`${this.baseUrl}/customers/${id}`, customer);
  }

  deleteCustomer(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/customers/${id}`);
  }

  getOrders(query?: string): Observable<{ success: boolean; count: number; totalBoxes: number; data: Order[] }> {
    const url = query && query.trim() ? `${this.baseUrl}/orders?q=${encodeURIComponent(query.trim())}` : `${this.baseUrl}/orders`;
    return this.http.get<{ success: boolean; count: number; totalBoxes: number; data: Order[] }>(url);
  }

  getOrdersNearby(lat: number, lng: number, radius = 2): Observable<{ success: boolean; count: number; totalBoxes: number; data: Order[] }> {
    return this.http.get<{ success: boolean; count: number; totalBoxes: number; data: Order[] }>(`${this.baseUrl}/orders/nearby?lat=${lat}&lng=${lng}&radius=${radius}`);
  }

  createOrder(order: { customerId: number; boxCount: number; note?: string }): Observable<{ success: boolean; message: string; data: Order }> {
    return this.http.post<{ success: boolean; message: string; data: Order }>(`${this.baseUrl}/orders`, order);
  }

  updateOrder(id: number, data: { boxCount?: number; status?: string; note?: string }): Observable<{ success: boolean; message: string; data: Order }> {
    return this.http.put<{ success: boolean; message: string; data: Order }>(`${this.baseUrl}/orders/${id}`, data);
  }

  deleteOrder(id: number): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/orders/${id}`);
  }

  mockOrders(count = 24): Observable<{ success: boolean; message: string; count: number; totalBoxes: number; data: Order[] }> {
    return this.http.post<{ success: boolean; message: string; count: number; totalBoxes: number; data: Order[] }>(`${this.baseUrl}/orders/mock`, { count });
  }

  clearOrders(): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(`${this.baseUrl}/orders/clear`);
  }

  optimizeRoutes(): Observable<{ success: boolean; message: string; data: DispatchPlan }> {
    return this.http.post<{ success: boolean; message: string; data: DispatchPlan }>(`${this.baseUrl}/dispatch/optimize`, {});
  }

  getDispatchPlan(): Observable<{ success: boolean; data: DispatchPlan }> {
    return this.http.get<{ success: boolean; data: DispatchPlan }>(`${this.baseUrl}/dispatch/plan`);
  }

  getRiders(): Observable<{ success: boolean; data: Rider[] }> {
    return this.http.get<{ success: boolean; data: Rider[] }>(`${this.baseUrl}/dispatch/riders`);
  }

  getRiderSheet(riderId: number): Observable<{ success: boolean; data: RiderSheetData }> {
    return this.http.get<{ success: boolean; data: RiderSheetData }>(`${this.baseUrl}/dispatch/rider/${riderId}/sheet`);
  }

  markStopDelivered(orderId: number): Observable<{ success: boolean; message: string }> {
    return this.http.patch<{ success: boolean; message: string }>(`${this.baseUrl}/dispatch/stops/${orderId}/deliver`, {});
  }

  resetDispatch(): Observable<{ success: boolean; message: string; data: DispatchPlan }> {
    return this.http.post<{ success: boolean; message: string; data: DispatchPlan }>(`${this.baseUrl}/dispatch/reset`, {});
  }
}