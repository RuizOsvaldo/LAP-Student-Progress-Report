import {
  pgTable,
  pgEnum,
  serial,
  text,
  integer,
  real,
  boolean,
  timestamp,
  json,
  primaryKey,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// ---------- Enums ----------

export const reviewStatusEnum = pgEnum('review_status', ['pending', 'draft', 'sent']);

// ---------- Tables ----------

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  googleId: text('google_id'),
  passwordHash: text('password_hash'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// connect-pg-simple requires sid/sess/expire columns
export const sessions = pgTable('sessions', {
  sid: text('sid').primaryKey(),
  sess: json('sess').notNull(),
  expire: timestamp('expire').notNull(),
});

export const instructors = pgTable('instructors', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .notNull()
    .references(() => users.id),
  isActive: boolean('is_active').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const students = pgTable(
  'students',
  {
    id: serial('id').primaryKey(),
    name: text('name').notNull(),
    guardianEmail: text('guardian_email'),
    guardianName: text('guardian_name'),
    githubUsername: text('github_username'),
    pike13SyncId: text('pike13_sync_id'),
    createdAt: timestamp('created_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.pike13SyncId)],
);

export const instructorStudents = pgTable(
  'instructor_students',
  {
    instructorId: integer('instructor_id')
      .notNull()
      .references(() => instructors.id),
    studentId: integer('student_id')
      .notNull()
      .references(() => students.id),
    assignedAt: timestamp('assigned_at').notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.instructorId, t.studentId] })],
);

export const monthlyReviews = pgTable(
  'monthly_reviews',
  {
    id: serial('id').primaryKey(),
    instructorId: integer('instructor_id')
      .notNull()
      .references(() => instructors.id),
    studentId: integer('student_id')
      .notNull()
      .references(() => students.id),
    month: text('month').notNull(), // YYYY-MM
    status: reviewStatusEnum('status').notNull().default('pending'),
    subject: text('subject'),
    body: text('body'),
    sentAt: timestamp('sent_at'),
    feedbackToken: uuid('feedback_token').notNull().defaultRandom(),
    createdAt: timestamp('created_at').notNull().defaultNow(),
    updatedAt: timestamp('updated_at').notNull().defaultNow(),
  },
  (t) => [
    unique().on(t.instructorId, t.studentId, t.month),
    unique().on(t.feedbackToken),
  ],
);

export const reviewTemplates = pgTable('review_templates', {
  id: serial('id').primaryKey(),
  instructorId: integer('instructor_id')
    .notNull()
    .references(() => instructors.id),
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  body: text('body').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const serviceFeedback = pgTable('service_feedback', {
  id: serial('id').primaryKey(),
  reviewId: integer('review_id')
    .notNull()
    .references(() => monthlyReviews.id),
  rating: integer('rating').notNull(), // 1–5
  comment: text('comment'),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
});

export const adminSettings = pgTable('admin_settings', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const pike13Tokens = pgTable('pike13_tokens', {
  id: serial('id').primaryKey(),
  instructorId: integer('instructor_id')
    .notNull()
    .references(() => instructors.id),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
}, (t) => [unique().on(t.instructorId)]);

export const taCheckins = pgTable(
  'ta_checkins',
  {
    id: serial('id').primaryKey(),
    instructorId: integer('instructor_id')
      .notNull()
      .references(() => instructors.id),
    taName: text('ta_name').notNull(),
    weekOf: text('week_of').notNull(), // ISO date of Monday, e.g. "2026-03-02"
    wasPresent: boolean('was_present').notNull(),
    submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  },
  (t) => [unique().on(t.instructorId, t.taName, t.weekOf)],
);

export const adminNotifications = pgTable('admin_notifications', {
  id: serial('id').primaryKey(),
  fromUserId: integer('from_user_id')
    .references(() => users.id),
  message: text('message').notNull(),
  isRead: boolean('is_read').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

export const volunteerHours = pgTable(
  'volunteer_hours',
  {
    id: serial('id').primaryKey(),
    volunteerName: text('volunteer_name').notNull(),
    category: text('category').notNull(),
    hours: real('hours').notNull(),
    description: text('description'),
    externalId: text('external_id'),
    recordedAt: timestamp('recorded_at').notNull().defaultNow(),
    source: text('source').notNull().default('manual'),
  },
  (t) => [unique().on(t.source, t.externalId)],
);

export const pike13AdminToken = pgTable('pike13_admin_token', {
  id: serial('id').primaryKey(),
  accessToken: text('access_token').notNull(),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at', { withTimezone: true }),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

// ---------- Exported types ----------

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Instructor = typeof instructors.$inferSelect;
export type NewInstructor = typeof instructors.$inferInsert;
export type Student = typeof students.$inferSelect;
export type NewStudent = typeof students.$inferInsert;
export type MonthlyReview = typeof monthlyReviews.$inferSelect;
export type NewMonthlyReview = typeof monthlyReviews.$inferInsert;
export type ReviewTemplate = typeof reviewTemplates.$inferSelect;
export type NewReviewTemplate = typeof reviewTemplates.$inferInsert;
export type ServiceFeedback = typeof serviceFeedback.$inferSelect;
export type NewServiceFeedback = typeof serviceFeedback.$inferInsert;
export type AdminSetting = typeof adminSettings.$inferSelect;
export type Pike13Token = typeof pike13Tokens.$inferSelect;
export type TaCheckin = typeof taCheckins.$inferSelect;
export type NewTaCheckin = typeof taCheckins.$inferInsert;
export type AdminNotification = typeof adminNotifications.$inferSelect;
export type NewAdminNotification = typeof adminNotifications.$inferInsert;
export type VolunteerHour = typeof volunteerHours.$inferSelect;
export type NewVolunteerHour = typeof volunteerHours.$inferInsert;
export type Pike13AdminToken = typeof pike13AdminToken.$inferSelect;
export type NewPike13AdminToken = typeof pike13AdminToken.$inferInsert;
