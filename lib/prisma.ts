import { PrismaClient } from "../app/generated/prisma/client"; 
import { PrismaPg } from "@prisma/adapter-pg"; 
import { Pool } from "pg";

const globalForPrisma = global as unknown as {
  prisma: PrismaClient; 
  pgPool: Pool;
}; 

const pool = globalForPrisma.pgPool || new Pool({
  connectionString: process.env.DATABASE_URL,
});

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.pgPool = pool;
}

const adapter = new PrismaPg(pool); 

// Self-heal global client cache if schema changes
if (globalForPrisma.prisma && (!(globalForPrisma.prisma as any).transaction || !(globalForPrisma.prisma as any).financeCategory || !(globalForPrisma.prisma as any).notificationPreference)) {
  globalForPrisma.prisma = new PrismaClient({ adapter });
}

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter, 
  }); 

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

export default prisma; 