import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// สร้าง Connection Pool ตามแบบที่อาจารย์ M สอน (รองรับทั้ง localhost และ Aiven.io Cloud)
export const conn = createPool({
  connectionLimit: 10,
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'avnadmin',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'defaultdb',
  ssl: process.env.DB_HOST && process.env.DB_HOST !== 'localhost'
    ? { rejectUnauthorized: false } // Aiven.io ต้องเปิด SSL
    : undefined,
});

// ฟังก์ชันทดสอบการเชื่อมต่อฐานข้อมูล
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await conn.getConnection();
    console.log('เชื่อมต่อฐานข้อมูล MySQL สำเร็จ');
    connection.release();
    return true;
  } catch (error) {
    console.warn('ยังไม่ได้เชื่อมต่อฐานข้อมูล MySQL หรือยังไม่ได้ตั้งค่า .env:', (error as Error).message);
    return false;
  }
}
