import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { customerRouter } from './controllers/customerController';
import { orderRouter } from './controllers/orderController';

export const app: Application = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.redirect('/api');
});

app.get('/api', (req: Request, res: Response) => {
  res.json({
    status: 'online',
    system: 'ระบบจัดการออเดอร์ส่งข้าวกล่อง',
    version: '1.0.0',
    depot: {
      location: 'ตลาดน้อย มหาวิทยาลัยมหาสารคาม (มมส. ขามเรียง)',
      serviceHours: '11:30 - 12:30',
    },
    endpoints: {
      customers: {
        list: 'GET /api/customers',
        landmarks: 'GET /api/customers/landmarks',
        search: 'GET /api/customers/search?q=:keyword',
        phoneLookup: 'GET /api/customers/phone/:phone',
        get: 'GET /api/customers/:id',
        create: 'POST /api/customers',
        update: 'PUT /api/customers/:id',
        delete: 'DELETE /api/customers/:id',
      },
      orders: {
        list: 'GET /api/orders',
        get: 'GET /api/orders/:id',
        create: 'POST /api/orders',
        update: 'PUT /api/orders/:id',
        delete: 'DELETE /api/orders/:id',
        sampleData: 'POST /api/orders/mock',
        clear: 'DELETE /api/orders/clear',
      },
    },
  });
});

app.use('/api/customers', customerRouter);
app.use('/api/orders', orderRouter);
