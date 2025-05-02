import type { PgTransaction, PgTransactionConfig } from "drizzle-orm/pg-core";
import { drizzle as drizzleVercel } from "drizzle-orm/vercel-postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { IS_DEV } from "@/lib/vars";
import { sql as sqlVercel } from "@vercel/postgres";
import sql from "postgres";
import * as schema from "./schema";

export const sqlDB = IS_DEV
  ? drizzle(sql(process.env.POSTGRES_URL), { schema })
  : drizzleVercel(sqlVercel, { schema });

export async function sqlTransaction<T>(
  transaction: (tx: PgTransaction<any, any, any>) => Promise<T>,
  config?: PgTransactionConfig
): Promise<T> {
  return sqlDB.transaction(transaction, config);
}
