import type { SQL } from 'drizzle-orm';
import { db } from '../db/client';

export async function rawRows<T>(query: SQL): Promise<T[]> {
  const [rows] = (await db.execute(query)) as unknown as [T[], unknown];
  return rows;
}
