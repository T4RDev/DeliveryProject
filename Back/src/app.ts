import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import { customerRouter } from './controllers/customerController';
import { orderRouter } from './controllers/orderController';
import { riderRouter } from './controllers/riderController';
import { routingRouter } from './controllers/routingController';

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
    system: 'ระบบจัดเส้นทางและแบ่งงานไรเดอร์อัจฉริยะ (ส่งด่วนมื้อเที่ยง)',
    version: '1.0.0',
    depot: {
      location: 'ตลาดน้อย มหาวิทยาลัยมหาสารคาม (มมส. ขามเรียง)',
      serviceHours: '11:30 - 12:30',
      maxBoxesPerRider: 10,
    },
    endpoints: {
      customers: '/api/customers',
      orders: '/api/orders',
      riders: '/api/riders',
      routing: '/api/routing/optimize',
    },
  });
});

app.use('/api/customers', customerRouter);
app.use('/api/orders', orderRouter);
app.use('/api/riders', riderRouter);
app.use('/api/routing', routingRouter);

