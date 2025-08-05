
import { varchar, pgTable, timestamp } from 'drizzle-orm/pg-core';

export const merchantBranchesTable = pgTable('merchant_branches', {
  id: varchar('id', { length: 255 }).primaryKey(),
  date_added_utc: timestamp('date_added_utc').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  source_url: varchar('source_url', { length: 255 }),
  address: varchar('address', { length: 255 }),
  merchant_id: varchar('merchant_id', { length: 255 })
});

// TypeScript types for the table schema
export type MerchantBranch = typeof merchantBranchesTable.$inferSelect; // For SELECT operations
export type NewMerchantBranch = typeof merchantBranchesTable.$inferInsert; // For INSERT operations

// Export all tables for proper query building
export const tables = { merchantBranches: merchantBranchesTable };
