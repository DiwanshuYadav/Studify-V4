import {
  users, notes, events, tasks, messages, 
  studyGroups, posts, timerSessions, 
  noteFiles, postComments, notifications,
  hashtags, studyGroupMembers,
  type User, type InsertUser,
  type Note, type InsertNote,
  type NoteFile, type InsertNoteFile,
  type Event, type InsertEvent,
  type Task, type InsertTask,
  type Message, type InsertMessage,
  type StudyGroup, type InsertStudyGroup,
  type StudyGroupMember, type InsertStudyGroupMember,
  type Post, type InsertPost,
  type PostComment, type InsertPostComment,
  type TimerSession, type InsertTimerSession,
  type Notification, type InsertNotification,
  type Hashtag, type InsertHashtag
} from "../shared/schema";

import { db } from "./db";
import { eq, and, or, desc, sql, like, ilike, asc } from "drizzle-orm";

// Define the Storage Interface
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Note operations
  getNotes(userId: number): Promise<Note[]>;
  getNoteById(id: number): Promise<Note | undefined>;
  createNote(note: InsertNote): Promise<Note>;
  updateNote(id: number, note: Partial<Note>): Promise<Note | undefined>;
  deleteNote(id: number): Promise<boolean>;
  searchNotes(userId: number, query: string): Promise<Note[]>;
  getNoteFiles(noteId: number): Promise<NoteFile[]>;
  createNoteFile(file: InsertNoteFile): Promise<NoteFile>;
  deleteNoteFile(id: number): Promise<boolean>;
  
  // Event operations
  getEvents(userId: number): Promise<Event[]>;
  getEventById(id: number): Promise<Event | undefined>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: number, event: Partial<Event>): Promise<Event | undefined>;
  deleteEvent(id: number): Promise<boolean>;
  
  // Task operations
  getTasks(userId: number): Promise<Task[]>;
  getTaskById(id: number): Promise<Task | undefined>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<Task>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  
  // Message operations
  getMessages(userId: number): Promise<Message[]>;
  getConversations(userId: number): Promise<{ userId: number, unreadCount: number, lastMessage: Message }[]>;
  getConversation(userId1: number, userId2: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  markMessagesAsRead(senderId: number, receiverId: number): Promise<boolean>;
  
  // Study Group operations
  getStudyGroups(): Promise<StudyGroup[]>;
  getStudyGroupsByUserId(userId: number): Promise<StudyGroup[]>;
  getStudyGroupById(id: number): Promise<StudyGroup | undefined>;
  createStudyGroup(group: InsertStudyGroup): Promise<StudyGroup>;
  updateStudyGroup(id: number, group: Partial<StudyGroup>): Promise<StudyGroup | undefined>;
  joinStudyGroup(userId: number, groupId: number, role?: string): Promise<StudyGroupMember>;
  leaveStudyGroup(userId: number, groupId: number): Promise<boolean>;
  
  // Post operations
  getPosts(): Promise<Post[]>;
  getPostById(id: number): Promise<Post | undefined>;
  getUserPosts(userId: number): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  likePost(postId: number, userId: number): Promise<boolean>;
  unlikePost(postId: number, userId: number): Promise<boolean>;
  getPostComments(postId: number): Promise<PostComment[]>;
  createPostComment(comment: InsertPostComment): Promise<PostComment>;
  deletePostComment(id: number): Promise<boolean>;
  searchPostsByHashtag(hashtag: string): Promise<Post[]>;
  
  // Timer Session operations
  getTimerSessions(userId: number): Promise<TimerSession[]>;
  createTimerSession(session: InsertTimerSession): Promise<TimerSession>;
  updateTimerSession(id: number, session: Partial<TimerSession>): Promise<TimerSession | undefined>;
  
  // Notification operations
  getNotifications(userId: number): Promise<Notification[]>;
  getUnreadNotificationsCount(userId: number): Promise<number>;
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<boolean>;
  markAllNotificationsAsRead(userId: number): Promise<boolean>;
  
  // Hashtag operations
  getHashtags(): Promise<Hashtag[]>;
  searchHashtags(query: string): Promise<Hashtag[]>;
  createOrUpdateHashtag(name: string): Promise<Hashtag>;
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(user: InsertUser): Promise<User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Note operations
  async getNotes(userId: number): Promise<Note[]> {
    return db.select().from(notes).where(eq(notes.userId, userId));
  }

  async getNoteById(id: number): Promise<Note | undefined> {
    const [note] = await db.select().from(notes).where(eq(notes.id, id));
    return note;
  }

  async createNote(note: InsertNote): Promise<Note> {
    const [newNote] = await db.insert(notes).values(note).returning();
    return newNote;
  }

  async updateNote(id: number, noteData: Partial<Note>): Promise<Note | undefined> {
    const [updatedNote] = await db
      .update(notes)
      .set({
        ...noteData,
        updatedAt: new Date()
      })
      .where(eq(notes.id, id))
      .returning();
    return updatedNote;
  }

  async deleteNote(id: number): Promise<boolean> {
    const result = await db.delete(notes).where(eq(notes.id, id));
    return !!result;
  }

  async searchNotes(userId: number, query: string): Promise<Note[]> {
    return db
      .select()
      .from(notes)
      .where(
        and(
          eq(notes.userId, userId),
          sql`(${notes.title} ILIKE ${'%' + query + '%'} OR ${notes.content} ILIKE ${'%' + query + '%'} OR ${notes.subject} ILIKE ${'%' + query + '%'})`
        )
      );
  }

  async getNoteFiles(noteId: number): Promise<NoteFile[]> {
    return db.select().from(noteFiles).where(eq(noteFiles.noteId, noteId));
  }

  async createNoteFile(file: InsertNoteFile): Promise<NoteFile> {
    const [newFile] = await db.insert(noteFiles).values(file).returning();
    return newFile;
  }

  async deleteNoteFile(id: number): Promise<boolean> {
    const result = await db.delete(noteFiles).where(eq(noteFiles.id, id));
    return !!result;
  }

  // Event operations
  async getEvents(userId: number): Promise<Event[]> {
    return db.select().from(events).where(eq(events.userId, userId));
  }

  async getEventById(id: number): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async createEvent(event: InsertEvent): Promise<Event> {
    const [newEvent] = await db.insert(events).values(event).returning();
    return newEvent;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const [updatedEvent] = await db
      .update(events)
      .set(eventData)
      .where(eq(events.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    const result = await db.delete(events).where(eq(events.id, id));
    return !!result;
  }

  // Task operations
  async getTasks(userId: number): Promise<Task[]> {
    return db.select().from(tasks).where(eq(tasks.userId, userId));
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(task: InsertTask): Promise<Task> {
    const [newTask] = await db.insert(tasks).values(task).returning();
    return newTask;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    let updateData = {...taskData};
    
    // If marking as completed, add completedAt timestamp
    if (taskData.completed === true) {
      updateData.completedAt = new Date();
    }
    
    const [updatedTask] = await db
      .update(tasks)
      .set(updateData)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db.delete(tasks).where(eq(tasks.id, id));
    return !!result;
  }

  // Message operations
  async getMessages(userId: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          eq(messages.senderId, userId),
          eq(messages.receiverId, userId)
        )
      )
      .orderBy(desc(messages.timestamp));
  }

  async getConversations(userId: number): Promise<{ userId: number; unreadCount: number; lastMessage: Message; }[]> {
    // Get all unique users that the current user has conversed with
    const contactsQuery = await db.execute(sql`
      SELECT DISTINCT
        CASE 
          WHEN sender_id = ${userId} THEN receiver_id
          ELSE sender_id
        END AS contact_id
      FROM messages
      WHERE sender_id = ${userId} OR receiver_id = ${userId}
    `);
    
    const contacts = contactsQuery.rows.map(row => row.contact_id);
    
    // For each contact, get the last message and unread count
    const conversations = [];
    
    for (const contactId of contacts) {
      // Get the last message
      const [lastMessage] = await db
        .select()
        .from(messages)
        .where(
          or(
            and(
              eq(messages.senderId, userId),
              eq(messages.receiverId, contactId)
            ),
            and(
              eq(messages.senderId, contactId),
              eq(messages.receiverId, userId)
            )
          )
        )
        .orderBy(desc(messages.timestamp))
        .limit(1);
      
      // Get unread count
      const unreadCountResult = await db
        .select({ count: sql<number>`count(*)` })
        .from(messages)
        .where(
          and(
            eq(messages.senderId, contactId),
            eq(messages.receiverId, userId),
            eq(messages.isRead, false)
          )
        );
      
      const unreadCount = unreadCountResult[0]?.count || 0;
      
      conversations.push({
        userId: contactId,
        unreadCount,
        lastMessage
      });
    }
    
    return conversations;
  }

  async getConversation(userId1: number, userId2: number): Promise<Message[]> {
    return db
      .select()
      .from(messages)
      .where(
        or(
          and(
            eq(messages.senderId, userId1),
            eq(messages.receiverId, userId2)
          ),
          and(
            eq(messages.senderId, userId2),
            eq(messages.receiverId, userId1)
          )
        )
      )
      .orderBy(asc(messages.timestamp));
  }

  async createMessage(message: InsertMessage): Promise<Message> {
    const [newMessage] = await db.insert(messages).values(message).returning();
    return newMessage;
  }

  async markMessagesAsRead(senderId: number, receiverId: number): Promise<boolean> {
    const result = await db
      .update(messages)
      .set({ isRead: true, readAt: new Date() })
      .where(
        and(
          eq(messages.senderId, senderId),
          eq(messages.receiverId, receiverId),
          eq(messages.isRead, false)
        )
      );
    return !!result;
  }

  // Study Group operations
  async getStudyGroups(): Promise<StudyGroup[]> {
    return db.select().from(studyGroups);
  }

  async getStudyGroupsByUserId(userId: number): Promise<StudyGroup[]> {
    const memberRecords = await db
      .select()
      .from(studyGroupMembers)
      .where(eq(studyGroupMembers.userId, userId));
    
    if (memberRecords.length === 0) return [];
    
    const groupIds = memberRecords.map(record => record.groupId);
    
    return db
      .select()
      .from(studyGroups)
      .where(sql`${studyGroups.id} IN (${groupIds.join(',')})`);
  }

  async getStudyGroupById(id: number): Promise<StudyGroup | undefined> {
    const [group] = await db.select().from(studyGroups).where(eq(studyGroups.id, id));
    return group;
  }

  async createStudyGroup(group: InsertStudyGroup): Promise<StudyGroup> {
    const [newGroup] = await db.insert(studyGroups).values(group).returning();
    
    // Add creator as a member with 'admin' role
    await db.insert(studyGroupMembers).values({
      userId: group.createdBy,
      groupId: newGroup.id,
      role: 'admin'
    });
    
    return newGroup;
  }

  async updateStudyGroup(id: number, groupData: Partial<StudyGroup>): Promise<StudyGroup | undefined> {
    const [updatedGroup] = await db
      .update(studyGroups)
      .set(groupData)
      .where(eq(studyGroups.id, id))
      .returning();
    return updatedGroup;
  }

  async joinStudyGroup(userId: number, groupId: number, role: string = 'member'): Promise<StudyGroupMember> {
    const [membership] = await db
      .insert(studyGroupMembers)
      .values({
        userId,
        groupId,
        role
      })
      .returning();
    return membership;
  }

  async leaveStudyGroup(userId: number, groupId: number): Promise<boolean> {
    const result = await db
      .delete(studyGroupMembers)
      .where(
        and(
          eq(studyGroupMembers.userId, userId),
          eq(studyGroupMembers.groupId, groupId)
        )
      );
    return !!result;
  }

  // Post operations
  async getPosts(): Promise<Post[]> {
    return db.select().from(posts).orderBy(desc(posts.timestamp));
  }

  async getPostById(id: number): Promise<Post | undefined> {
    const [post] = await db.select().from(posts).where(eq(posts.id, id));
    return post;
  }

  async getUserPosts(userId: number): Promise<Post[]> {
    return db
      .select()
      .from(posts)
      .where(eq(posts.userId, userId))
      .orderBy(desc(posts.timestamp));
  }

  async createPost(post: InsertPost): Promise<Post> {
    const [newPost] = await db.insert(posts).values(post).returning();
    
    // Process hashtags if any
    if (post.hashtags && Array.isArray(post.hashtags) && post.hashtags.length > 0) {
      for (const tag of post.hashtags) {
        await this.createOrUpdateHashtag(tag as string);
      }
    }
    
    return newPost;
  }

  async updatePost(id: number, postData: Partial<Post>): Promise<Post | undefined> {
    const [updatedPost] = await db
      .update(posts)
      .set({
        ...postData,
        isEdited: true
      })
      .where(eq(posts.id, id))
      .returning();
    return updatedPost;
  }

  async deletePost(id: number): Promise<boolean> {
    const result = await db.delete(posts).where(eq(posts.id, id));
    return !!result;
  }

  async likePost(postId: number, userId: number): Promise<boolean> {
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    if (!post) return false;
    
    let likes = post.likes as number[] || [];
    if (!likes.includes(userId)) {
      likes.push(userId);
      
      await db
        .update(posts)
        .set({ likes })
        .where(eq(posts.id, postId));
    }
    
    return true;
  }

  async unlikePost(postId: number, userId: number): Promise<boolean> {
    const [post] = await db.select().from(posts).where(eq(posts.id, postId));
    if (!post) return false;
    
    let likes = post.likes as number[] || [];
    likes = likes.filter(id => id !== userId);
    
    await db
      .update(posts)
      .set({ likes })
      .where(eq(posts.id, postId));
    
    return true;
  }

  async getPostComments(postId: number): Promise<PostComment[]> {
    return db
      .select()
      .from(postComments)
      .where(eq(postComments.postId, postId))
      .orderBy(asc(postComments.timestamp));
  }

  async createPostComment(comment: InsertPostComment): Promise<PostComment> {
    const [newComment] = await db.insert(postComments).values(comment).returning();
    return newComment;
  }

  async deletePostComment(id: number): Promise<boolean> {
    const result = await db.delete(postComments).where(eq(postComments.id, id));
    return !!result;
  }

  async searchPostsByHashtag(hashtag: string): Promise<Post[]> {
    return db
      .select()
      .from(posts)
      .where(sql`${hashtag} = ANY (${posts.hashtags})`)
      .orderBy(desc(posts.timestamp));
  }

  // Timer Session operations
  async getTimerSessions(userId: number): Promise<TimerSession[]> {
    return db
      .select()
      .from(timerSessions)
      .where(eq(timerSessions.userId, userId))
      .orderBy(desc(timerSessions.startTime));
  }

  async createTimerSession(session: InsertTimerSession): Promise<TimerSession> {
    const [newSession] = await db.insert(timerSessions).values(session).returning();
    return newSession;
  }

  async updateTimerSession(id: number, sessionData: Partial<TimerSession>): Promise<TimerSession | undefined> {
    const [updatedSession] = await db
      .update(timerSessions)
      .set(sessionData)
      .where(eq(timerSessions.id, id))
      .returning();
    return updatedSession;
  }

  // Notification operations
  async getNotifications(userId: number): Promise<Notification[]> {
    return db
      .select()
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt));
  }

  async getUnreadNotificationsCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: sql<number>`count(*)` })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    
    return result[0]?.count || 0;
  }

  async createNotification(notification: InsertNotification): Promise<Notification> {
    const [newNotification] = await db.insert(notifications).values(notification).returning();
    return newNotification;
  }

  async markNotificationAsRead(id: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(eq(notifications.id, id));
    return !!result;
  }

  async markAllNotificationsAsRead(userId: number): Promise<boolean> {
    const result = await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, userId),
          eq(notifications.isRead, false)
        )
      );
    return !!result;
  }

  // Hashtag operations
  async getHashtags(): Promise<Hashtag[]> {
    return db.select().from(hashtags).orderBy(desc(hashtags.count));
  }

  async searchHashtags(query: string): Promise<Hashtag[]> {
    return db
      .select()
      .from(hashtags)
      .where(ilike(hashtags.name, `%${query}%`))
      .orderBy(desc(hashtags.count));
  }

  async createOrUpdateHashtag(name: string): Promise<Hashtag> {
    // Normalize the hashtag name
    const normalizedName = name.startsWith('#') ? name : `#${name}`;
    
    // Check if the hashtag already exists
    const [existingTag] = await db
      .select()
      .from(hashtags)
      .where(eq(hashtags.name, normalizedName));
    
    if (existingTag) {
      // Update the count
      const [updatedTag] = await db
        .update(hashtags)
        .set({ count: existingTag.count + 1 })
        .where(eq(hashtags.id, existingTag.id))
        .returning();
      
      return updatedTag;
    } else {
      // Create a new hashtag
      const [newTag] = await db
        .insert(hashtags)
        .values({
          name: normalizedName,
          count: 1
        })
        .returning();
      
      return newTag;
    }
  }
}

// Export the database storage instance
export const storage = new DatabaseStorage();