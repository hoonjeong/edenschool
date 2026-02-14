import pool from '../db';
import type { BillInfo } from '../types';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

// Admin: insertBillInfoAll
export async function insertBillInfoAll(billMonth: string, bill: number, pay: number, payDate: string, payType: string): Promise<void> {
  await pool.query(
    `INSERT INTO bill_info (bill_month, csid, bill, pay, pay_date, pay_type)
     SELECT ?, cs.id, ?, ?, ?, ?
     FROM class_status as cs
     LEFT JOIN (SELECT * FROM bill_info WHERE bill_month=?) as bi ON cs.id=bi.csid
     WHERE cs.status=1 AND bill_month IS NULL`,
    [billMonth, bill, pay, payDate, payType, billMonth]
  );
}

// Admin: selectBillInfoByMonth
export async function selectBillInfoByMonth(billMonth: string): Promise<BillInfo[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT bi.bill_month as billMonth, s.name as studentName, ci.name as className, cs.student_id as studentId, bi.bill, bi.pay, bi.pay_date as payDate, bi.pay_type as payType FROM bill_info bi, class_info ci, class_status cs, student s WHERE bi.bill_month=? AND cs.id=bi.csid AND ci.id=cs.class_id AND s.id=cs.student_id`,
    [billMonth]
  );
  return rows as BillInfo[];
}

// Admin: selectBillMonth
export async function selectBillMonth(): Promise<string[]> {
  const [rows] = await pool.query<RowDataPacket[]>(
    `SELECT DISTINCT bill_month as billMonth FROM bill_info ORDER BY bill_month DESC`
  );
  return rows.map((r) => r.billMonth);
}
