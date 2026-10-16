# ระบบจัดการออเดอร์ข้าวกล่อง (ส่งด่วนมื้อเที่ยง)

> **Project Demo** — ระบบจัดการออเดอร์ข้าวกล่องและนำทางจัดส่งด้วย Google Maps  
> ศูนย์กลาง: **ร้านตลาดน้อย มหาวิทยาลัยมหาสารคาม (มมส. ขามเรียง)**

---

## โครงสร้างโปรเจกต์

```
Project_AdvWeb2/
├── Front/          # Angular 22 + Tailwind CSS + Google Maps (Frontend)
├── Back/           # Node.js + Express + TypeScript (Backend API)
├── render.yaml     # Config Deploy Backend บน Render.com
└── README.md
```

---

## ฟีเจอร์ระบบ

| ส่วนงาน | ฟีเจอร์ |
|---------|---------|
| **จัดการออเดอร์และลูกค้า** | เพิ่มออเดอร์, ค้นหาลูกค้าเดิมด้วยเบอร์โทร, สุ่มสถานที่จริงใน มมส., กรองระยะ 1/2 กม., สุ่ม 24 ออเดอร์ |
| **นำทาง Google Maps** | ปุ่มเปิด Google Maps นำทางตรงจากร้านไปยังบ้านลูกค้าทันทีในคลิกเดียว |
| **สถานะการจัดส่ง** | สรุปกล่องข้าว, ปรับจำนวนกล่อง, อัปเดตสถานะ รอดำเนินการ / จัดส่งแล้ว |


---

## รันโปรเจกต์บนเครื่อง (Local Development)

> ต้องติดตั้ง [Node.js 20+](https://nodejs.org/) และ npm ก่อน

### 1. รัน Backend API (Terminal หน้าต่างที่ 1)

```powershell
cd Back
npm install
npm run dev
```

เซิร์ฟเวอร์เปิดที่ **http://localhost:3000/api**

> `npm run dev` ใช้ `ts-node-dev` รันโดยตรงจาก TypeScript (ไม่ต้อง build ก่อน)  
> ถ้าต้องการ build แล้วรัน: `npm run build` จากนั้น `npm start`

### 2. รัน Frontend Angular (Terminal หน้าต่างที่ 2)

```powershell
cd Front
npm install
npm start
```

เปิดเบราว์เซอร์ที่ **http://localhost:4200**

---

## Deploy ออนไลน์ (5 ขั้นตอน)

> Deploy ฟรีได้เลย: **Render.com** (Backend) + **Vercel** (Frontend)

---

### ขั้นตอนที่ 1 — Push โค้ดขึ้น GitHub

สร้าง Repository ใหม่บน [github.com](https://github.com) แล้วรันคำสั่ง:

```powershell
cd "c:\Users\T4R\Desktop\AllWorks\1204208_AdvWeb2\Project_AdvWeb2"
git init
git add .
git commit -m "initial commit"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

---

### ขั้นตอนที่ 2 — Deploy Backend บน Render.com (ฟรี)

1. เปิด [render.com](https://render.com) → สมัคร/เข้าสู่ระบบ
2. กด **New** → **Web Service**
3. เลือก GitHub Repository ที่ Push ไว้
4. กรอกค่าดังนี้:

| Setting | ค่า |
|---------|-----|
| Name | `lunchbox-backend` (ตั้งชื่ออะไรก็ได้) |
| Root Directory | `Back` |
| Runtime | `Node` |
| Build Command | `npm install && npm run build` |
| Start Command | `npm start` |

5. กด **Deploy Web Service**
6. รอ 2-5 นาที → เมื่อ Deploy เสร็จจะได้ URL เช่น:  
   **`https://lunchbox-backend.onrender.com`**
7. ทดสอบเปิด `https://lunchbox-backend.onrender.com/api` ต้องเห็น JSON

> **หมายเหตุ:** Free tier ของ Render จะ sleep เมื่อไม่มีคนใช้ 15 นาที  
> ครั้งแรกที่เรียกอาจช้า ~30-60 วินาที

---

### ขั้นตอนที่ 3 — อัปเดต Backend URL ใน Frontend

เปิดไฟล์ `Front/src/environments/environment.prod.ts` แล้วแก้ URL:

```typescript
export const environment = {
  production: true,
  apiUrl: 'https://lunchbox-backend.onrender.com/api',
  //       ^^^ ใส่ URL จริงที่ได้จาก Render
};
```

จากนั้น commit และ push:

```powershell
git add .
git commit -m "update prod api url"
git push
```

---

### ขั้นตอนที่ 4 — Deploy Frontend บน Vercel (ฟรี)

1. เปิด [vercel.com](https://vercel.com) → สมัค/เข้าสู่ระบบด้วย GitHub
2. กด **Add New Project** → เลือก Repository เดิม
3. กรอกค่าดังนี้:

| Setting | ค่า |
|---------|-----|
| Root Directory | `Front` |
| Framework Preset | `Angular` (หรือ Other) |
| Build Command | `npm run build` |
| Output Directory | `dist/front/browser` |

4. กด **Deploy**
5. เมื่อ Deploy เสร็จจะได้ URL เช่น:  
   **`https://your-project.vercel.app`**

---

### ขั้นตอนที่ 5 — ทดสอบ

1. เปิด Frontend URL จาก Vercel
2. ดูที่มุมบนขวา — **จุดสีเขียว** = เชื่อม Backend ได้แล้ว
3. ลองกด **สุ่มข้อมูล 24 ออเดอร์** แล้ว **จัดเส้นทางอัตโนมัติ**

---

## API Endpoints สรุป

```
GET    /api                                    Health Check
GET    /api/customers                          รายชื่อลูกค้าทั้งหมด
GET    /api/customers/landmarks                รายชื่อสถานที่สำคัญใน มมส.
GET    /api/customers/search?q=...             ค้นหาลูกค้า
GET    /api/customers/phone/:phone             ค้นหาด้วยเบอร์โทร
GET    /api/customers/nearby?lat=&lng=&radius= ลูกค้าในรัศมี

GET    /api/orders                             รายการออเดอร์ (รองรับ ?q=...)
GET    /api/orders/nearby?lat=&lng=&radius=    ออเดอร์ในรัศมี
POST   /api/orders                             สร้างออเดอร์ใหม่
PUT    /api/orders/:id                         แก้ไขออเดอร์ (กล่อง, สถานะ)
DELETE /api/orders/:id                         ลบออเดอร์
POST   /api/orders/mock                        สร้างข้อมูลตัวอย่าง 24 รายการ
DELETE /api/orders/clear                       ล้างออเดอร์ทั้งหมด
```

---

## Tech Stack

| ส่วน | เทคโนโลยี |
|------|-----------|
| Frontend | Angular 22, Tailwind CSS v4, Google Maps Integration |
| Backend | Node.js, Express.js, TypeScript |
| Database | In-Memory (เหมาะสำหรับ Demo) |
| Map & Nav | Google Maps (Navigation & Location API URLs) |
| Deploy Frontend | Vercel (ฟรี) |
| Deploy Backend | Render.com (ฟรี) |

