import { 
  users, type User, type InsertUser,
  notes, type Note, type InsertNote,
  events, type Event, type InsertEvent,
  tasks, type Task, type InsertTask,
  messages, type Message, type InsertMessage,
  studyGroups, type StudyGroup, type InsertStudyGroup,
  posts, type Post, type InsertPost,
  timerSessions, type TimerSession, type InsertTimerSession
} from "@shared/schema";

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
  createMessage(message: InsertMessage): Promise<Message>;
  
  // Study Group operations
  getStudyGroups(): Promise<StudyGroup[]>;
  getStudyGroupById(id: number): Promise<StudyGroup | undefined>;
  createStudyGroup(group: InsertStudyGroup): Promise<StudyGroup>;
  updateStudyGroup(id: number, group: Partial<StudyGroup>): Promise<StudyGroup | undefined>;
  
  // Post operations
  getPosts(): Promise<Post[]>;
  getPostById(id: number): Promise<Post | undefined>;
  createPost(post: InsertPost): Promise<Post>;
  updatePost(id: number, post: Partial<Post>): Promise<Post | undefined>;
  deletePost(id: number): Promise<boolean>;
  
  // Timer Session operations
  getTimerSessions(userId: number): Promise<TimerSession[]>;
  createTimerSession(session: InsertTimerSession): Promise<TimerSession>;
  updateTimerSession(id: number, session: Partial<TimerSession>): Promise<TimerSession | undefined>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private notes: Map<number, Note>;
  private events: Map<number, Event>;
  private tasks: Map<number, Task>;
  private messages: Map<number, Message>;
  private studyGroups: Map<number, StudyGroup>;
  private posts: Map<number, Post>;
  private timerSessions: Map<number, TimerSession>;
  
  private userId: number = 1;
  private noteId: number = 1;
  private eventId: number = 1;
  private taskId: number = 1;
  private messageId: number = 1;
  private studyGroupId: number = 1;
  private postId: number = 1;
  private timerSessionId: number = 1;

  constructor() {
    this.users = new Map();
    this.notes = new Map();
    this.events = new Map();
    this.tasks = new Map();
    this.messages = new Map();
    this.studyGroups = new Map();
    this.posts = new Map();
    this.timerSessions = new Map();
    
    // Add a default user for testing
    this.createUser({
      username: "emmawatson",
      password: "password123",
      name: "Emma Watson",
      email: "emma@example.com",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80",
      major: "Computer Science",
      bio: "Studying Computer Science with a focus on machine learning and AI."
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userId++;
    const user: User = { 
      ...insertUser, 
      id,
      createdAt: new Date().toISOString(),
      followers: [],
      following: []
    };
    
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Note operations
  async getNotes(userId: number): Promise<Note[]> {
    return Array.from(this.notes.values()).filter(note => note.userId === userId);
  }

  async getNoteById(id: number): Promise<Note | undefined> {
    return this.notes.get(id);
  }

  async createNote(insertNote: InsertNote): Promise<Note> {
    const id = this.noteId++;
    const now = new Date().toISOString();
    
    const note: Note = {
      ...insertNote,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.notes.set(id, note);
    return note;
  }

  async updateNote(id: number, noteData: Partial<Note>): Promise<Note | undefined> {
    const note = this.notes.get(id);
    if (!note) return undefined;
    
    const updatedNote: Note = { 
      ...note, 
      ...noteData,
      updatedAt: new Date().toISOString()
    };
    
    this.notes.set(id, updatedNote);
    return updatedNote;
  }

  async deleteNote(id: number): Promise<boolean> {
    return this.notes.delete(id);
  }

  // Event operations
  async getEvents(userId: number): Promise<Event[]> {
    return Array.from(this.events.values()).filter(event => event.userId === userId);
  }

  async getEventById(id: number): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async createEvent(insertEvent: InsertEvent): Promise<Event> {
    const id = this.eventId++;
    
    const event: Event = {
      ...insertEvent,
      id
    };
    
    this.events.set(id, event);
    return event;
  }

  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updatedEvent: Event = { ...event, ...eventData };
    this.events.set(id, updatedEvent);
    return updatedEvent;
  }

  async deleteEvent(id: number): Promise<boolean> {
    return this.events.delete(id);
  }

  // Task operations
  async getTasks(userId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.userId === userId);
  }

  async getTaskById(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.taskId++;
    
    const task: Task = {
      ...insertTask,
      id
    };
    
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: number, taskData: Partial<Task>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updatedTask: Task = { ...task, ...taskData };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Message operations
  async getMessages(userId: number): Promise<Message[]> {
    return Array.from(this.messages.values()).filter(
      message => message.senderId === userId || message.receiverId === userId
    );
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.messageId++;
    
    const message: Message = {
      ...insertMessage,
      id,
      timestamp: new Date().toISOString()
    };
    
    this.messages.set(id, message);
    return message;
  }

  // Study Group operations
  async getStudyGroups(): Promise<StudyGroup[]> {
    return Array.from(this.studyGroups.values());
  }

  async getStudyGroupById(id: number): Promise<StudyGroup | undefined> {
    return this.studyGroups.get(id);
  }

  async createStudyGroup(insertGroup: InsertStudyGroup): Promise<StudyGroup> {
    const id = this.studyGroupId++;
    
    const group: StudyGroup = {
      ...insertGroup,
      id,
      createdAt: new Date().toISOString()
    };
    
    this.studyGroups.set(id, group);
    return group;
  }

  async updateStudyGroup(id: number, groupData: Partial<StudyGroup>): Promise<StudyGroup | undefined> {
    const group = this.studyGroups.get(id);
    if (!group) return undefined;
    
    const updatedGroup: StudyGroup = { ...group, ...groupData };
    this.studyGroups.set(id, updatedGroup);
    return updatedGroup;
  }

  // Post operations
  async getPosts(): Promise<Post[]> {
    return Array.from(this.posts.values());
  }

  async getPostById(id: number): Promise<Post | undefined> {
    return this.posts.get(id);
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const id = this.postId++;
    
    const post: Post = {
      ...insertPost,
      id,
      timestamp: new Date().toISOString(),
      likes: [],
      comments: []
    };
    
    this.posts.set(id, post);
    return post;
  }

  async updatePost(id: number, postData: Partial<Post>): Promise<Post | undefined> {
    const post = this.posts.get(id);
    if (!post) return undefined;
    
    const updatedPost: Post = { ...post, ...postData };
    this.posts.set(id, updatedPost);
    return updatedPost;
  }

  async deletePost(id: number): Promise<boolean> {
    return this.posts.delete(id);
  }

  // Timer Session operations
  async getTimerSessions(userId: number): Promise<TimerSession[]> {
    return Array.from(this.timerSessions.values()).filter(
      session => session.userId === userId
    );
  }

  async createTimerSession(insertSession: InsertTimerSession): Promise<TimerSession> {
    const id = this.timerSessionId++;
    
    const session: TimerSession = {
      ...insertSession,
      id,
      startTime: new Date().toISOString(),
      endTime: null
    };
    
    this.timerSessions.set(id, session);
    return session;
  }

  async updateTimerSession(id: number, sessionData: Partial<TimerSession>): Promise<TimerSession | undefined> {
    const session = this.timerSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession: TimerSession = { ...session, ...sessionData };
    this.timerSessions.set(id, updatedSession);
    return updatedSession;
  }
}

export const storage = new MemStorage();
