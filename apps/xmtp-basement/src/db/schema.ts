import { pgTable, varchar, numeric, timestamp, boolean, text, integer, index } from 'drizzle-orm/pg-core';

export const spendPermissions = pgTable('spend_permissions', {
  hash: varchar('hash', { length: 66 }).primaryKey(),

  account: varchar('account', { length: 42 }).notNull(),
  spender: varchar('spender', { length: 42 }).notNull(),
  token: varchar('token', { length: 42 }).notNull(),
  allowance: numeric('allowance', { precision: 78 }).notNull(),
  period: integer('period').notNull(),
  start: timestamp('start', { mode: 'date' }).notNull(),
  end: timestamp('end', { mode: 'date' }).notNull(),
  salt: numeric('salt', { precision: 78 }).notNull(),
  extraData: text('extra_data'),

  isApproved: boolean('is_approved').default(false).notNull(),
  isRevoked: boolean('is_revoked').default(false).notNull(),
  approvedAt: timestamp('approved_at', { mode: 'date' }),
  revokedAt: timestamp('revoked_at', { mode: 'date' }),

  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  accountIdx: index('account_idx').on(table.account),
  spenderIdx: index('spender_idx').on(table.spender),
  tokenIdx: index('token_idx').on(table.token),
  accountSpenderIdx: index('account_spender_idx').on(table.account, table.spender),
  isActiveIdx: index('is_active_idx').on(table.isApproved, table.isRevoked),
}));

export const approvalEvents = pgTable('approval_events', {
  id: varchar('id', { length: 66 }).primaryKey(),
  permissionHash: varchar('permission_hash', { length: 66 }).notNull().references(() => spendPermissions.hash),
  transactionHash: varchar('transaction_hash', { length: 66 }).notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  permissionHashIdx: index('approval_permission_hash_idx').on(table.permissionHash),
}));

export const revocationEvents = pgTable('revocation_events', {
  id: varchar('id', { length: 66 }).primaryKey(),
  permissionHash: varchar('permission_hash', { length: 66 }).notNull().references(() => spendPermissions.hash),
  transactionHash: varchar('transaction_hash', { length: 66 }).notNull(),

  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  permissionHashIdx: index('revocation_permission_hash_idx').on(table.permissionHash),
}));

export const spendEvents = pgTable('spend_events', {
  id: varchar('id', { length: 66 }).primaryKey(),
  permissionHash: varchar('permission_hash', { length: 66 }).notNull().references(() => spendPermissions.hash),
  transactionHash: varchar('transaction_hash', { length: 66 }).notNull(),
  value: numeric('value', { precision: 78 }).notNull(),
  createdAt: timestamp('created_at', { mode: 'date' }).defaultNow().notNull(),
}, (table) => ({
  permissionHashIdx: index('spend_permission_hash_idx').on(table.permissionHash),
}));
