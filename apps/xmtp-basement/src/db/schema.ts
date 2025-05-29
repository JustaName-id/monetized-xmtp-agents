import { pgTable, varchar, numeric, timestamp, text, integer, index, uuid } from 'drizzle-orm/pg-core';

export const spendPermissionsTable = pgTable('spend_permissions', {
  id: uuid("id").primaryKey(),
  account: varchar('account', { length: 42 }).notNull(),
  spender: varchar('spender', { length: 42 }).notNull(),
  token: varchar('token', { length: 42 }).notNull(),
  allowance: numeric('allowance', { precision: 78 }).notNull(),
  period: integer('period').notNull(),
  start: timestamp('start', { mode: 'date' }).notNull(),
  end: timestamp('end', { mode: 'date' }).notNull(),
  salt: numeric('salt', { precision: 78 }).notNull(),
  extraData: text('extra_data'),

  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  accountIdx: index('account_idx').on(table.account),
  spenderIdx: index('spender_idx').on(table.spender),
  tokenIdx: index('token_idx').on(table.token),
  accountSpenderIdx: index('account_spender_idx').on(table.account, table.spender),
}));

export const approvalEventsTable = pgTable('approval_events', {
  id: uuid("id").primaryKey(),
  permissionId: uuid("permission_id").notNull().references(() => spendPermissionsTable.id),
  transactionHash: varchar('transaction_hash', { length: 66 }).notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const revocationEventsTable = pgTable('revocation_events', {
  id: uuid("id").primaryKey(),
  permissionId: uuid("permission_id").notNull().references(() => spendPermissionsTable.id),
  transactionHash: varchar('transaction_hash', { length: 66 }).notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
});

export const spendEventsTable = pgTable('spend_events', {
  id: uuid("id").primaryKey(),
  permissionId: uuid("permission_id").notNull().references(() => spendPermissionsTable.id),
  transactionHash: varchar('transaction_hash', {length: 66}).notNull(),
  value: numeric('value', { precision: 78 }).notNull(),

  createdAt: timestamp('created_at', {mode: 'date'}).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', {mode: 'date'}).defaultNow().notNull(),
})
