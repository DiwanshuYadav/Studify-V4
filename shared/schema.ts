import { pgTable, text, serial, integer, boolean, timestamp, json, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums for better type safety
export const eventTypeEnum = pgEnum('event_type', ['lecture', 'studyGroup', 'assignment', 'meeting', 'exam']);
export const priorityEnum = pgEnum('priority_type', ['low', 'medium', 'high']);
export const timerTypeEnum = pgEnum('timer_type', ['focus', 'shortBreak', 'longBreak']);
export const postTypeEnum = pgEnum('post_type', ['text', 'note', 'group', 'image', 'file']);
export const messageStatusEnum = pgEnum('message_status', ['sent', 'delivered', 'read']);

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  avatar: text("avatar"),
  major: text("major"),
  bio: text("bio"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  followers: json("followers").default([]),
  following: json("following").default([]),
  settings: json("settings").default({
    theme: 'light',
    notifications: true,
    privacy: 'public'
  }),
  lastActiveAt: timestamp("last_active_at").defaultNow(),
});

export const userRelations = relations(users, ({ many }) => ({
  notes: many(notes),
  events: many(events),
  tasks: many(tasks),
  sentMessages: many(messages, { relationName: "sender" }),
  receivedMessages: many(messages, { relationName: "receiver" }),
  memberships: many(studyGroupMembers),
  posts: many(posts),
  timerSessions: many(timerSessions),
  notifications: many(notifications),
}));

export const notes = pgTable("notes", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  content: text("content").notNull(),
  subject: text("subject").notNull(),
  attachments: integer("attachments").default(0),
  sharedWith: json("shared_with").default([]),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  hashtags: json("hashtags").default([]),
  isPublic: boolean("is_public").default(false),
});

export const noteRelations = relations(notes, ({ one, many }) => ({
  user: one(users, {
    fields: [notes.userId],
    references: [users.id],
  }),
  files: many(noteFiles),
}));

export const noteFiles = pgTable("note_files", {
  id: serial("id").primaryKey(),
  noteId: integer("note_id").notNull().references(() => notes.id, { onDelete: "cascade" }),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(),
  fileSize: integer("file_size").notNull(),
  fileUrl: text("file_url").notNull(),
  uploadedAt: timestamp("uploaded_at").defaultNow().notNull(),
});

export const noteFileRelations = relations(noteFiles, ({ one }) => ({
  note: one(notes, {
    fields: [noteFiles.noteId],
    references: [notes.id],
  }),
}));

export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  type: text("type").notNull(),
  start: timestamp("start").notNull(),
  end: timestamp("end").notNull(),
  location: text("location"),
  isRecurring: boolean("is_recurring").default(false),
  recurringPattern: text("recurring_pattern"),
  color: text("color"),
  notifications: boolean("notifications").default(true),
});

export const eventRelations = relations(events, ({ one }) => ({
  user: one(users, {
    fields: [events.userId],
    references: [users.id],
  }),
}));

export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  dueDate: timestamp("due_date"),
  priority: text("priority"),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
  reminderAt: timestamp("reminder_at"),
  relatedNoteId: integer("related_note_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const taskRelations = relations(tasks, ({ one }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  relatedNote: one(notes, {
    fields: [tasks.relatedNoteId],
    references: [notes.id],
  }),
}));

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  status: text("status").default('sent').notNull(),
  isRead: boolean("is_read").default(false).notNull(),
  readAt: timestamp("read_at"),
  attachmentUrl: text("attachment_url"),
  attachmentType: text("attachment_type"),
  sessionId: text("session_id"),
});

export const messageRelations = relations(messages, ({ one }) => ({
  sender: one(users, {
    fields: [messages.senderId],
    references: [users.id],
    relationName: "sender",
  }),
  receiver: one(users, {
    fields: [messages.receiverId],
    references: [users.id],
    relationName: "receiver",
  }),
}));

export const studyGroups = pgTable("study_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  subject: text("subject"),
  meetingTime: text("meeting_time"),
  location: text("location"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isPublic: boolean("is_public").default(true),
  hashtags: json("hashtags").default([]),
  meetingLink: text("meeting_link"),
  members: json("members").default([]),
});

export const studyGroupRelations = relations(studyGroups, ({ one, many }) => ({
  creator: one(users, {
    fields: [studyGroups.createdBy],
    references: [users.id],
  }),
  members: many(studyGroupMembers),
}));

export const studyGroupMembers = pgTable("study_group_members", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  groupId: integer("group_id").notNull().references(() => studyGroups.id, { onDelete: "cascade" }),
  joinedAt: timestamp("joined_at").defaultNow().notNull(),
  role: text("role").default('member').notNull(),
});

export const studyGroupMemberRelations = relations(studyGroupMembers, ({ one }) => ({
  user: one(users, {
    fields: [studyGroupMembers.userId],
    references: [users.id],
  }),
  group: one(studyGroups, {
    fields: [studyGroupMembers.groupId],
    references: [studyGroups.id],
  }),
}));

export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  userName: text("user_name").notNull(),
  userAvatar: text("user_avatar"),
  content: text("content"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  type: text("type").notNull(),
  attachment: json("attachment"),
  likes: json("likes").default([]),
  comments: json("comments").default([]),
  hashtags: json("hashtags").default([]),
  noteId: integer("note_id").references(() => notes.id),
  isEdited: boolean("is_edited").default(false),
});

export const postRelations = relations(posts, ({ one, many }) => ({
  user: one(users, {
    fields: [posts.userId],
    references: [users.id],
  }),
  comments: many(postComments),
  sharedNote: one(notes, {
    fields: [posts.noteId],
    references: [notes.id],
  }),
}));

export const postComments = pgTable("post_comments", {
  id: serial("id").primaryKey(),
  postId: integer("post_id").notNull().references(() => posts.id, { onDelete: "cascade" }),
  userId: integer("user_id").notNull().references(() => users.id),
  userName: text("user_name").notNull(),
  userAvatar: text("user_avatar"),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const postCommentRelations = relations(postComments, ({ one }) => ({
  post: one(posts, {
    fields: [postComments.postId],
    references: [posts.id],
  }),
  user: one(users, {
    fields: [postComments.userId],
    references: [users.id],
  }),
}));

export const timerSessions = pgTable("timer_sessions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: text("type").notNull(),
  duration: integer("duration").notNull(),
  startTime: timestamp("start_time").defaultNow().notNull(),
  endTime: timestamp("end_time"),
  completed: boolean("completed").default(false),
  notes: text("notes"),
  taskId: integer("task_id").references(() => tasks.id),
});

export const timerSessionRelations = relations(timerSessions, ({ one }) => ({
  user: one(users, {
    fields: [timerSessions.userId],
    references: [users.id],
  }),
  task: one(tasks, {
    fields: [timerSessions.taskId],
    references: [tasks.id],
  }),
}));

export const notifications = pgTable("notifications", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type").notNull(),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  linkTo: text("link_to"),
  sourceId: integer("source_id"),
  sourceType: text("source_type"),
});

export const notificationRelations = relations(notifications, ({ one }) => ({
  user: one(users, {
    fields: [notifications.userId],
    references: [users.id],
  }),
}));

export const hashtags = pgTable("hashtags", {
  id: serial("id").primaryKey(),
  name: text("name").notNull().unique(),
  count: integer("count").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  name: true,
  email: true,
  avatar: true,
  major: true,
  bio: true,
  settings: true,
});

export const insertNoteSchema = createInsertSchema(notes).pick({
  userId: true,
  title: true,
  content: true,
  subject: true,
  attachments: true,
  sharedWith: true,
  hashtags: true,
  isPublic: true,
});

export const insertNoteFileSchema = createInsertSchema(noteFiles).pick({
  noteId: true,
  fileName: true,
  fileType: true,
  fileSize: true,
  fileUrl: true,
});

export const insertEventSchema = createInsertSchema(events).pick({
  userId: true,
  title: true,
  description: true,
  type: true,
  start: true,
  end: true,
  location: true,
  isRecurring: true,
  recurringPattern: true,
  color: true,
  notifications: true,
});

export const insertTaskSchema = createInsertSchema(tasks).pick({
  userId: true,
  title: true,
  description: true,
  dueDate: true,
  priority: true,
  completed: true,
  reminderAt: true,
  relatedNoteId: true,
});

export const insertMessageSchema = createInsertSchema(messages).pick({
  senderId: true,
  receiverId: true,
  content: true,
  status: true,
  isRead: true,
  attachmentUrl: true,
  attachmentType: true,
  sessionId: true,
});

export const insertStudyGroupSchema = createInsertSchema(studyGroups).pick({
  name: true,
  description: true,
  subject: true,
  meetingTime: true,
  location: true,
  createdBy: true,
  isPublic: true,
  hashtags: true,
  meetingLink: true,
  members: true,
});

export const insertStudyGroupMemberSchema = createInsertSchema(studyGroupMembers).pick({
  userId: true,
  groupId: true,
  role: true,
});

export const insertPostSchema = createInsertSchema(posts).pick({
  userId: true,
  userName: true,
  userAvatar: true,
  content: true,
  type: true,
  attachment: true,
  hashtags: true,
  noteId: true,
});

export const insertPostCommentSchema = createInsertSchema(postComments).pick({
  postId: true,
  userId: true,
  userName: true,
  userAvatar: true,
  content: true,
});

export const insertTimerSessionSchema = createInsertSchema(timerSessions).pick({
  userId: true,
  type: true,
  duration: true,
  endTime: true,
  completed: true,
  notes: true,
  taskId: true,
});

export const insertNotificationSchema = createInsertSchema(notifications).pick({
  userId: true,
  title: true,
  message: true,
  type: true,
  isRead: true,
  linkTo: true,
  sourceId: true,
  sourceType: true,
});

export const insertHashtagSchema = createInsertSchema(hashtags).pick({
  name: true,
  count: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertNote = z.infer<typeof insertNoteSchema>;
export type Note = typeof notes.$inferSelect;

export type InsertNoteFile = z.infer<typeof insertNoteFileSchema>;
export type NoteFile = typeof noteFiles.$inferSelect;

export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Event = typeof events.$inferSelect;

export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Task = typeof tasks.$inferSelect;

export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

export type InsertStudyGroup = z.infer<typeof insertStudyGroupSchema>;
export type StudyGroup = typeof studyGroups.$inferSelect;

export type InsertStudyGroupMember = z.infer<typeof insertStudyGroupMemberSchema>;
export type StudyGroupMember = typeof studyGroupMembers.$inferSelect;

export type InsertPost = z.infer<typeof insertPostSchema>;
export type Post = typeof posts.$inferSelect;

export type InsertPostComment = z.infer<typeof insertPostCommentSchema>;
export type PostComment = typeof postComments.$inferSelect;

export type InsertTimerSession = z.infer<typeof insertTimerSessionSchema>;
export type TimerSession = typeof timerSessions.$inferSelect;

export type InsertNotification = z.infer<typeof insertNotificationSchema>;
export type Notification = typeof notifications.$inferSelect;

export type InsertHashtag = z.infer<typeof insertHashtagSchema>;
export type Hashtag = typeof hashtags.$inferSelect;
