import { Request, Response, Router } from 'express';
import { db } from '../db/database';

export const customerRouter = Router();

customerRouter.get('/', (req: Request, res: Response) => {
  try {
    const customers = db.getAllCustomers();
    res.json({
      success: true,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

customerRouter.get('/search', (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const results = db.searchCustomers(q);
    res.json({
      success: true,
      query: q,
      count: results.length,
      data: results,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

customerRouter.get('/phone/:phone', (req: Request, res: Response) => {
  try {
    const phone = req.params.phone;
    const customer = db.findCustomerByPhone(phone);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลลูกค้าจากเบอร์โทรนี้' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

customerRouter.get('/nearby', (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string);
    const lng = parseFloat(req.query.lng as string);
    const radius = parseFloat(req.query.radius as string) || 1.0;

    if (isNaN(lat) || isNaN(lng)) {
      return res.status(400).json({
        success: false,
        message: 'กรุณาระบุพิกัด lat และ lng ให้ถูกต้อง เช่น ?lat=16.2443&lng=103.2504&radius=1',
      });
    }

    const customers = db.getCustomersNearby(lat, lng, radius);
    res.json({
      success: true,
      center: { lat, lng },
      radiusKm: radius,
      count: customers.length,
      data: customers,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

customerRouter.get('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const customer = db.getCustomerById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลลูกค้า' });
    }
    res.json({ success: true, data: customer });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

customerRouter.get('/landmarks', (req: Request, res: Response) => {
  try {
    const landmarks = db.getMsuLandmarks();
    res.json({
      success: true,
      count: landmarks.length,
      data: landmarks,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

customerRouter.post('/', (req: Request, res: Response) => {
  try {
    const { firstName, lastName, phone, address } = req.body;
    let { latitude, longitude } = req.body;

    if (!firstName || !lastName || !phone || !address) {
      return res.status(400).json({
        success: false,
        message: 'กรุณากรอกข้อมูลให้ครบถ้วน: firstName, lastName, phone, address',
      });
    }

    if (latitude === undefined || longitude === undefined || isNaN(parseFloat(latitude)) || isNaN(parseFloat(longitude))) {
      const resolved = db.resolveAddressLocation(address);
      latitude = resolved.latitude;
      longitude = resolved.longitude;
    } else {
      latitude = parseFloat(latitude);
      longitude = parseFloat(longitude);
    }

    const newCustomer = db.createCustomer({
      firstName,
      lastName,
      phone,
      address,
      latitude,
      longitude,
    });

    res.status(201).json({
      success: true,
      message: 'เพิ่มข้อมูลลูกค้าเรียบร้อยแล้ว',
      data: newCustomer,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

customerRouter.put('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updated = db.updateCustomer(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลลูกค้าที่ต้องการแก้ไข' });
    }
    res.json({
      success: true,
      message: 'แก้ไขข้อมูลลูกค้าเรียบร้อยแล้ว',
      data: updated,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

customerRouter.delete('/:id', (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const success = db.deleteCustomer(id);
    if (!success) {
      return res.status(404).json({ success: false, message: 'ไม่พบข้อมูลลูกค้าที่ต้องการลบ' });
    }
    res.json({
      success: true,
      message: 'ลบข้อมูลลูกค้าเรียบร้อยแล้ว',
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Internal server error', error });
  }
});

