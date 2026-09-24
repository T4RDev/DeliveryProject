import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { customerRouter } from './controllers/customerController';
import { orderRouter } from './controllers/orderController';
import { dispatchRouter } from './controllers/dispatchController';

export const app: Application = express();

// Middlewares
app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Root Redirect to API
app.get('/', (req: Request, res: Response) => {
  res.redirect('/api');
});

// API Info / Health Check
app.get('/api', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'Lunchbox Delivery Management & Route Optimization API',
    version: '1.0.0',
    depot: {
      location: 'ศูนย์อาหารตลาดน้อย มหาวิทยาลัยมหาสารคาม (มมส. ขามเรียง)',
      serviceHours: '11:30 - 12:30',
    },
    endpoints: {
      customers: {
        list: 'GET /api/customers',
        search: 'GET /api/customers/search?q=:keyword',
        phoneLookup: 'GET /api/customers/phone/:phone',
        nearby: 'GET /api/customers/nearby?lat=:lat&lng=:lng&radius=:km',
        get: 'GET /api/customers/:id',
        create: 'POST /api/customers',
        update: 'PUT /api/customers/:id',
        delete: 'DELETE /api/customers/:id',
      },
      orders: {
        list: 'GET /api/orders',
        nearby: 'GET /api/orders/nearby?lat=:lat&lng=:lng&radius=:km',
        get: 'GET /api/orders/:id',
        create: 'POST /api/orders',
        update: 'PUT /api/orders/:id',
        delete: 'DELETE /api/orders/:id',
        sampleData: 'POST /api/orders/mock',
        clear: 'DELETE /api/orders/clear',
      },
      dispatch: {
        optimize: 'POST /api/dispatch/optimize',
        plan: 'GET /api/dispatch/plan',
        riders: 'GET /api/dispatch/riders',
        riderSheet: 'GET /api/dispatch/rider/:id/sheet',
        deliver: 'PATCH /api/dispatch/stops/:orderId/deliver',
        reset: 'POST /api/dispatch/reset',
      },
    },
  });
});

// Register Routers
app.use('/api/customers', customerRouter);
app.use('/api/orders', orderRouter);
app.use('/api/dispatch', dispatchRouter);
