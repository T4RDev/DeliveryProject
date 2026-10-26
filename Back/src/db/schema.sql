-- ============================================================
-- SQL Schema สำหรับระบบส่งด่วนมื้อเที่ยง (Delivery Project)
-- รองรับ Aiven.io MySQL และ MySQL ทั่วไป
-- ============================================================

-- สร้างตารางลูกค้า (customers)
CREATE TABLE IF NOT EXISTS customers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL UNIQUE,
    address TEXT NOT NULL,
    lat DECIMAL(10, 7) NOT NULL,
    lng DECIMAL(10, 7) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- สร้างตารางรายการสั่งซื้อ (orders)
CREATE TABLE IF NOT EXISTS orders (
    id INT AUTO_INCREMENT PRIMARY KEY,
    customer_id INT NOT NULL,
    box_count INT NOT NULL DEFAULT 1,
    status ENUM('pending', 'delivered') NOT NULL DEFAULT 'pending',
    note TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- ข้อมูลเริ่มต้น: ลูกค้าและพิกัดสำคัญรอบ มมส. ขามเรียง
-- ============================================================

INSERT INTO customers (first_name, last_name, phone, address, lat, lng) VALUES
('สมชาย', 'สายเรียน', '0812345678', 'คณะเทคโนโลยีสารสนเทศ (IT MSU) ขามเรียง ชั้น 3', 16.2445000, 103.2500000),
('สมหญิง', 'จริงใจ', '0823456789', 'อาคารวิทยบริการ (หอสมุดกลาง มมส.) ชั้น 2', 16.2475000, 103.2520000),
('กิตติศักดิ์', 'รักดี', '0834567890', 'อาคารบรมราชกุมารี (สนง.อธิการบดี) กองบริการการศึกษา', 16.2490000, 103.2515000),
('นภัสสร', 'วรรณวิทย์', '0845678901', 'คณะการบัญชีและการจัดการ (MBS) ตึก B ชั้น 1', 16.2435000, 103.2530000),
('ธนกร', 'เจริญผล', '0856789012', 'คณะวิศวกรรมศาสตร์ มมส. ตึก EN ชั้น 4', 16.2420000, 103.2510000),
('ปิยะดา', 'สุขสำราญ', '0867890123', 'ตึกสิริวิทย์ คณะศึกษาศาสตร์ มมส.', 16.2450000, 103.2540000),
('วรวิทย์', 'มั่งมี', '0878901234', 'ศูนย์อาหารกลาง (Complex มมส.) หน้าร้านถ่ายเอกสาร', 16.2480000, 103.2545000),
('ชลธิชา', 'แสงดาว', '0889012345', 'โรงพยาบาลสุทธาเวช คณะแพทยศาสตร์ แผนกผู้ป่วยนอก', 16.2520000, 103.2535000),
('อัครเดช', 'เดชากุล', '0890123456', 'หอพักสุขสบาย ซอยวุ่นวาย ขามเรียง ห้อง 302', 16.2495000, 103.2460000),
('ศิริพร', 'งามตา', '0801234567', 'คอนโดเดอะพาร์ค มมส. ตึก A ชั้น 5', 16.2510000, 103.2480000),
('ภัทรพล', 'คงกระพัน', '0891112233', 'หอพักอินเตอร์ มมส. ขามเรียง ห้อง 415', 16.2470000, 103.2450000),
('มัลลิกา', 'ศรีสวัสดิ์', '0892223344', 'หอพักชื่นชม หลัง มมส. ขามเรียง ป้อมยาม', 16.2440000, 103.2445000)
ON DUPLICATE KEY UPDATE phone=phone;

-- ตัวอย่างออเดอร์เริ่มต้นรอบเที่ยง
INSERT INTO orders (customer_id, box_count, status, note) VALUES
(1, 2, 'pending', 'โทรหาก่อนส่ง กำลังเรียนอยู่'),
(2, 1, 'pending', 'ฝากไว้โต๊ะประชาสัมพันธ์ชั้น 1'),
(3, 3, 'pending', 'สั่งข้าวเที่ยงฝ่ายทะเบียน'),
(4, 2, 'pending', 'หน้าลิฟต์ตึก B'),
(5, 1, 'pending', 'ใต้ตึกคณะวิศวะ'),
(6, 2, 'pending', 'ห้องพักอาจารย์ชั้น 2'),
(7, 3, 'pending', 'ร้านกาแฟ Complex'),
(8, 1, 'pending', 'เคาน์เตอร์การเงิน'),
(9, 2, 'pending', 'แขวนไว้หน้าห้อง 302'),
(10, 1, 'pending', 'นิติบุคคลคอนโด'),
(11, 2, 'pending', 'โทรเบอร์นี้เมื่อถึง'),
(12, 1, 'pending', 'ป้อมยามหน้าหอ');
