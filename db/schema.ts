import {
  pgSchema, serial, text, integer, numeric, date,
  boolean, timestamp, unique, jsonb,
} from 'drizzle-orm/pg-core';

export const clockinSchema = pgSchema('clockin');

export const workStatusTypes = clockinSchema.table('work_status_types', {
  id:        serial('id').primaryKey(),
  label:     text('label').notNull(),
  isPaid:    boolean('is_paid').notNull().default(false),
  isDefault: boolean('is_default').notNull().default(false),
});

export const positions = clockinSchema.table('positions', {
  id:                serial('id').primaryKey(),
  name:              text('name').notNull(),
  defaultHourlyRate: numeric('default_hourly_rate', { precision: 10, scale: 2 }),
  createdAt:         timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const employees = clockinSchema.table('employees', {
  id:               serial('id').primaryKey(),
  name:             text('name').notNull(),
  gender:           text('gender').default('unknown'),
  phone:            text('phone'),
  idCard:           text('id_card'),
  positionId:       integer('position_id').references(() => positions.id),
  status:           text('status').default('active'),      // active | inactive
  hireDate:         date('hire_date').notNull(),
  leaveDate:        date('leave_date'),
  currentHourlyRate: numeric('current_hourly_rate', { precision: 10, scale: 2 }),
  notes:            text('notes'),
  createdAt:        timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const hourlyRateHistory = clockinSchema.table('hourly_rate_history', {
  id:            serial('id').primaryKey(),
  employeeId:    integer('employee_id').references(() => employees.id),
  rate:          numeric('rate', { precision: 10, scale: 2 }).notNull(),
  effectiveDate: date('effective_date').notNull(),
  notes:         text('notes'),
  createdAt:     timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const attendanceRecords = clockinSchema.table('attendance_records', {
  id:          serial('id').primaryKey(),
  employeeId:  integer('employee_id').references(() => employees.id),
  workDate:    date('work_date').notNull(),
  hours:       numeric('hours', { precision: 5, scale: 1 }),
  status:      text('status').default('worked'), // worked|leave|holiday|sick|absent|custom
  statusLabel: text('status_label'),
  note:        text('note'),
  isLocked:    boolean('is_locked').notNull().default(false),
  createdAt:   timestamp('created_at', { withTimezone: true }).defaultNow(),
  updatedAt:   timestamp('updated_at', { withTimezone: true }).defaultNow(),
}, t => [unique('attendance_employee_date').on(t.employeeId, t.workDate)]);

export const holidays = clockinSchema.table('holidays', {
  id:        serial('id').primaryKey(),
  date:      date('date').notNull().unique(),
  name:      text('name').notNull(),
  type:      text('type').default('legal'),   // legal | custom
  isPaid:    boolean('is_paid').default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});

export const aiChatLogs = clockinSchema.table('ai_chat_logs', {
  id:             serial('id').primaryKey(),
  userId:         text('user_id'),
  userPhone:      text('user_phone'),
  userMessage:    text('user_message').notNull(),
  assistantReply: text('assistant_reply').notNull(),
  mode:           text('mode').notNull(), // ai | rules
  pageUrl:        text('page_url'),
  actions:        jsonb('actions').$type<Array<{ type: string; label: string; href: string }>>(),
  createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---- Types ----
export type Employee       = typeof employees.$inferSelect;
export type NewEmployee    = typeof employees.$inferInsert;
export type Position       = typeof positions.$inferSelect;
export type AttendanceRecord    = typeof attendanceRecords.$inferSelect;
export type NewAttendanceRecord = typeof attendanceRecords.$inferInsert;
export type HourlyRateHistory   = typeof hourlyRateHistory.$inferSelect;
export type Holiday             = typeof holidays.$inferSelect;
export type AIChatLog           = typeof aiChatLogs.$inferSelect;
