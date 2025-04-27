import express, { Express, Request, Response, NextFunction } from "express";
import { createServer, Server } from "http";
import { storage } from "./storage";
import { WebSocketManager } from "./websocket";
import { db } from "./db";
import { z } from "zod";
import {
  insertUserSchema, insertNoteSchema, insertEventSchema, 
  insertTaskSchema, insertMessageSchema, insertStudyGroupSchema,
  insertPostSchema, insertPostCommentSchema, insertTimerSessionSchema,
  insertNotificationSchema, insertNoteFileSchema
} from "../shared/schema";
import multer from "multer";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { log } from "./vite";

// Setup file storage
const UPLOAD_DIR = path.join(process.cwd(), "uploads");
// Create uploads directory if it doesn't exist
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Configure multer for file uploads
const storage_config = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = crypto.randomBytes(16).toString("hex");
    const fileExt = path.extname(file.originalname);
    cb(null, `${Date.now()}-${uniqueSuffix}${fileExt}`);
  }
});

const upload = multer({ 
  storage: storage_config,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB file size limit
  }
});

// Generate a session ID for video calls
function generateSessionId(): string {
  return crypto.randomBytes(16).toString("hex");
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Error handler middleware
  const errorHandler = (err: any, _req: Request, res: Response, next: NextFunction) => {
    if (res.headersSent) {
      return next(err);
    }
    
    log(`Error: ${err.message}`, 'error');
    console.error(err);
    
    res.status(err.status || 500).json({
      error: {
        message: err.message || 'Internal Server Error',
        status: err.status || 500
      }
    });
  };

  // Authentication middleware (simple version)
  const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    // In a real app, you'd verify a token
    const userId = req.header('X-User-ID');
    
    if (!userId) {
      return res.status(401).json({
        error: 'Authentication required'
      });
    }
    
    try {
      const user = await storage.getUser(parseInt(userId));
      
      if (!user) {
        return res.status(401).json({
          error: 'Invalid user'
        });
      }
      
      // Attach user to request
      (req as any).user = user;
      next();
    } catch (error) {
      next(error);
    }
  };

  // CORS middleware
  app.use((_req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, X-User-ID');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
  });

  // Health check route
  app.get("/api/healthcheck", (_req, res) => {
    res.status(200).json({ 
      status: "OK",
      db: db ? "Connected" : "Not connected",
      timestamp: new Date().toISOString()
    });
  });

  // Serve uploaded files
  app.use('/uploads', express.static(UPLOAD_DIR));

  // Create a server instance
  const httpServer = createServer(app);

  // Initialize WebSocket
  const wsManager = new WebSocketManager(httpServer);

  // API routes will be prefixed with /api
  const router = express.Router();

  // Auth routes
  router.post('/auth/register', async (req, res, next) => {
    try {
      const userInput = insertUserSchema.safeParse(req.body);
      
      if (!userInput.success) {
        return res.status(400).json({
          error: 'Invalid input',
          details: userInput.error.errors
        });
      }
      
      // Check if username already exists
      const existingUser = await storage.getUserByUsername(userInput.data.username);
      
      if (existingUser) {
        return res.status(409).json({
          error: 'Username already exists'
        });
      }
      
      // Create user
      const newUser = await storage.createUser(userInput.data);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = newUser;
      
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  router.post('/auth/login', async (req, res, next) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({
          error: 'Username and password are required'
        });
      }
      
      // Get user
      const user = await storage.getUserByUsername(username);
      
      if (!user || user.password !== password) {
        return res.status(401).json({
          error: 'Invalid credentials'
        });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = user;
      
      // Update last active timestamp
      await storage.updateUser(user.id, { lastActiveAt: new Date() });
      
      // Notify other users about online status
      wsManager.notifyUserStatus(user.id, user.username, true);
      
      res.json({
        user: userWithoutPassword
      });
    } catch (error) {
      next(error);
    }
  });

  // User routes
  router.get('/users/:id', authenticate, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  router.put('/users/:id', authenticate, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.id);
      const currentUser = (req as any).user;
      
      // Ensure user can only update their own profile
      if (currentUser.id !== userId) {
        return res.status(403).json({
          error: 'Forbidden'
        });
      }
      
      // Prevent password update through this endpoint
      const { password, ...updateData } = req.body;
      
      const updatedUser = await storage.updateUser(userId, updateData);
      
      if (!updatedUser) {
        return res.status(404).json({
          error: 'User not found'
        });
      }
      
      // Remove password from response
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      res.json(userWithoutPassword);
    } catch (error) {
      next(error);
    }
  });

  // Note routes
  router.get('/notes', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      const notes = await storage.getNotes(currentUser.id);
      res.json(notes);
    } catch (error) {
      next(error);
    }
  });

  router.get('/notes/:id', authenticate, async (req, res, next) => {
    try {
      const noteId = parseInt(req.params.id);
      const note = await storage.getNoteById(noteId);
      
      if (!note) {
        return res.status(404).json({
          error: 'Note not found'
        });
      }
      
      const currentUser = (req as any).user;
      
      // Check if user has access to the note
      if (note.userId !== currentUser.id && !(note.sharedWith as any[])?.includes(currentUser.id)) {
        return res.status(403).json({
          error: 'Forbidden'
        });
      }
      
      // Get files associated with the note
      const files = await storage.getNoteFiles(noteId);
      
      res.json({
        ...note,
        files
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/notes', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      
      const noteInput = insertNoteSchema.safeParse({
        ...req.body,
        userId: currentUser.id
      });
      
      if (!noteInput.success) {
        return res.status(400).json({
          error: 'Invalid input',
          details: noteInput.error.errors
        });
      }
      
      const newNote = await storage.createNote(noteInput.data);
      
      res.status(201).json(newNote);
    } catch (error) {
      next(error);
    }
  });

  router.put('/notes/:id', authenticate, async (req, res, next) => {
    try {
      const noteId = parseInt(req.params.id);
      const currentUser = (req as any).user;
      
      // Check if note exists and belongs to user
      const note = await storage.getNoteById(noteId);
      
      if (!note) {
        return res.status(404).json({
          error: 'Note not found'
        });
      }
      
      if (note.userId !== currentUser.id) {
        return res.status(403).json({
          error: 'Forbidden'
        });
      }
      
      // Update note
      const updatedNote = await storage.updateNote(noteId, req.body);
      
      res.json(updatedNote);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/notes/:id', authenticate, async (req, res, next) => {
    try {
      const noteId = parseInt(req.params.id);
      const currentUser = (req as any).user;
      
      // Check if note exists and belongs to user
      const note = await storage.getNoteById(noteId);
      
      if (!note) {
        return res.status(404).json({
          error: 'Note not found'
        });
      }
      
      if (note.userId !== currentUser.id) {
        return res.status(403).json({
          error: 'Forbidden'
        });
      }
      
      // Delete note
      await storage.deleteNote(noteId);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  router.get('/notes/search', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({
          error: 'Search query is required'
        });
      }
      
      const results = await storage.searchNotes(currentUser.id, query);
      
      res.json(results);
    } catch (error) {
      next(error);
    }
  });

  // Note files
  router.post('/notes/:id/files', authenticate, upload.single('file'), async (req, res, next) => {
    try {
      const noteId = parseInt(req.params.id);
      const currentUser = (req as any).user;
      
      // Check if note exists and belongs to user
      const note = await storage.getNoteById(noteId);
      
      if (!note) {
        return res.status(404).json({
          error: 'Note not found'
        });
      }
      
      if (note.userId !== currentUser.id) {
        return res.status(403).json({
          error: 'Forbidden'
        });
      }
      
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({
          error: 'No file uploaded'
        });
      }
      
      // Create note file record
      const noteFile = await storage.createNoteFile({
        noteId,
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        fileUrl: `/uploads/${file.filename}`
      });
      
      // Update note attachments count
      await storage.updateNote(noteId, {
        attachments: (note.attachments || 0) + 1
      });
      
      res.status(201).json(noteFile);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/notes/files/:id', authenticate, async (req, res, next) => {
    try {
      const fileId = parseInt(req.params.id);
      const currentUser = (req as any).user;
      
      // Get file
      const files = await db.query.noteFiles.findMany({
        where: (fields, { eq }) => eq(fields.id, fileId),
        with: {
          note: true
        }
      });
      
      if (files.length === 0) {
        return res.status(404).json({
          error: 'File not found'
        });
      }
      
      const file = files[0];
      
      // Check if note belongs to user
      if (file.note.userId !== currentUser.id) {
        return res.status(403).json({
          error: 'Forbidden'
        });
      }
      
      // Delete file from disk
      const filePath = path.join(UPLOAD_DIR, path.basename(file.fileUrl));
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      
      // Delete file record
      await storage.deleteNoteFile(fileId);
      
      // Update note attachments count
      await storage.updateNote(file.noteId, {
        attachments: Math.max(0, (file.note.attachments || 0) - 1)
      });
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Event routes
  router.get('/events', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      const events = await storage.getEvents(currentUser.id);
      res.json(events);
    } catch (error) {
      next(error);
    }
  });

  router.get('/events/:id', authenticate, async (req, res, next) => {
    try {
      const eventId = parseInt(req.params.id);
      const event = await storage.getEventById(eventId);
      
      if (!event) {
        return res.status(404).json({
          error: 'Event not found'
        });
      }
      
      const currentUser = (req as any).user;
      
      // Check if user has access to the event
      if (event.userId !== currentUser.id) {
        return res.status(403).json({
          error: 'Forbidden'
        });
      }
      
      res.json(event);
    } catch (error) {
      next(error);
    }
  });

  router.post('/events', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      
      const eventInput = insertEventSchema.safeParse({
        ...req.body,
        userId: currentUser.id
      });
      
      if (!eventInput.success) {
        return res.status(400).json({
          error: 'Invalid input',
          details: eventInput.error.errors
        });
      }
      
      const newEvent = await storage.createEvent(eventInput.data);
      
      res.status(201).json(newEvent);
    } catch (error) {
      next(error);
    }
  });

  router.put('/events/:id', authenticate, async (req, res, next) => {
    try {
      const eventId = parseInt(req.params.id);
      const currentUser = (req as any).user;
      
      // Check if event exists and belongs to user
      const event = await storage.getEventById(eventId);
      
      if (!event) {
        return res.status(404).json({
          error: 'Event not found'
        });
      }
      
      if (event.userId !== currentUser.id) {
        return res.status(403).json({
          error: 'Forbidden'
        });
      }
      
      // Update event
      const updatedEvent = await storage.updateEvent(eventId, req.body);
      
      res.json(updatedEvent);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/events/:id', authenticate, async (req, res, next) => {
    try {
      const eventId = parseInt(req.params.id);
      const currentUser = (req as any).user;
      
      // Check if event exists and belongs to user
      const event = await storage.getEventById(eventId);
      
      if (!event) {
        return res.status(404).json({
          error: 'Event not found'
        });
      }
      
      if (event.userId !== currentUser.id) {
        return res.status(403).json({
          error: 'Forbidden'
        });
      }
      
      // Delete event
      await storage.deleteEvent(eventId);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Task routes
  router.get('/tasks', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      const tasks = await storage.getTasks(currentUser.id);
      res.json(tasks);
    } catch (error) {
      next(error);
    }
  });

  router.post('/tasks', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      
      const taskInput = insertTaskSchema.safeParse({
        ...req.body,
        userId: currentUser.id
      });
      
      if (!taskInput.success) {
        return res.status(400).json({
          error: 'Invalid input',
          details: taskInput.error.errors
        });
      }
      
      const newTask = await storage.createTask(taskInput.data);
      
      res.status(201).json(newTask);
    } catch (error) {
      next(error);
    }
  });

  router.put('/tasks/:id', authenticate, async (req, res, next) => {
    try {
      const taskId = parseInt(req.params.id);
      const currentUser = (req as any).user;
      
      // Check if task exists and belongs to user
      const task = await storage.getTaskById(taskId);
      
      if (!task) {
        return res.status(404).json({
          error: 'Task not found'
        });
      }
      
      if (task.userId !== currentUser.id) {
        return res.status(403).json({
          error: 'Forbidden'
        });
      }
      
      // Update task
      const updatedTask = await storage.updateTask(taskId, req.body);
      
      res.json(updatedTask);
    } catch (error) {
      next(error);
    }
  });

  router.delete('/tasks/:id', authenticate, async (req, res, next) => {
    try {
      const taskId = parseInt(req.params.id);
      const currentUser = (req as any).user;
      
      // Check if task exists and belongs to user
      const task = await storage.getTaskById(taskId);
      
      if (!task) {
        return res.status(404).json({
          error: 'Task not found'
        });
      }
      
      if (task.userId !== currentUser.id) {
        return res.status(403).json({
          error: 'Forbidden'
        });
      }
      
      // Delete task
      await storage.deleteTask(taskId);
      
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  });

  // Message routes
  router.get('/messages', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      const messages = await storage.getMessages(currentUser.id);
      res.json(messages);
    } catch (error) {
      next(error);
    }
  });

  router.get('/messages/conversations', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      const conversations = await storage.getConversations(currentUser.id);
      
      // Fetch user details for each conversation
      const conversationsWithUsers = await Promise.all(
        conversations.map(async (conversation) => {
          const user = await storage.getUser(conversation.userId);
          
          if (!user) {
            return {
              ...conversation,
              user: null
            };
          }
          
          const { password, ...userWithoutPassword } = user;
          
          return {
            ...conversation,
            user: userWithoutPassword
          };
        })
      );
      
      res.json(conversationsWithUsers);
    } catch (error) {
      next(error);
    }
  });

  router.get('/messages/conversation/:userId', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      const otherUserId = parseInt(req.params.userId);
      
      // Get conversation
      const conversation = await storage.getConversation(currentUser.id, otherUserId);
      
      // Mark messages as read
      await storage.markMessagesAsRead(otherUserId, currentUser.id);
      
      res.json(conversation);
    } catch (error) {
      next(error);
    }
  });

  router.post('/messages', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      
      const messageInput = insertMessageSchema.safeParse({
        ...req.body,
        senderId: currentUser.id
      });
      
      if (!messageInput.success) {
        return res.status(400).json({
          error: 'Invalid input',
          details: messageInput.error.errors
        });
      }
      
      // Create message
      const newMessage = await storage.createMessage(messageInput.data);
      
      // Send WebSocket notification
      wsManager.broadcast({
        type: 'new_message',
        payload: {
          message: newMessage,
          senderId: currentUser.id,
          senderName: currentUser.username
        }
      });
      
      res.status(201).json(newMessage);
    } catch (error) {
      next(error);
    }
  });

  router.post('/messages/file', authenticate, upload.single('file'), async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      const { receiverId, content } = req.body;
      
      if (!receiverId) {
        return res.status(400).json({
          error: 'Recipient ID is required'
        });
      }
      
      const file = req.file;
      
      if (!file) {
        return res.status(400).json({
          error: 'No file uploaded'
        });
      }
      
      // Create message with attachment
      const message = await storage.createMessage({
        senderId: currentUser.id,
        receiverId: parseInt(receiverId),
        content: content || 'File attachment',
        status: 'sent',
        isRead: false,
        attachmentUrl: `/uploads/${file.filename}`,
        attachmentType: file.mimetype
      });
      
      // Send WebSocket notification
      wsManager.broadcast({
        type: 'new_message',
        payload: {
          message,
          senderId: currentUser.id,
          senderName: currentUser.username
        }
      });
      
      res.status(201).json(message);
    } catch (error) {
      next(error);
    }
  });

  router.post('/messages/read', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      const { senderId } = req.body;
      
      if (!senderId) {
        return res.status(400).json({
          error: 'Sender ID is required'
        });
      }
      
      // Mark messages as read
      await storage.markMessagesAsRead(parseInt(senderId), currentUser.id);
      
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  router.post('/messages/session', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      const { receiverId } = req.body;
      
      if (!receiverId) {
        return res.status(400).json({
          error: 'Recipient ID is required'
        });
      }
      
      // Generate a unique session ID
      const sessionId = generateSessionId();
      
      // Create a notification message
      await storage.createMessage({
        senderId: currentUser.id,
        receiverId: parseInt(receiverId),
        content: 'Video call invitation',
        status: 'sent',
        isRead: false,
        sessionId
      });
      
      // Send WebSocket notification
      wsManager.broadcast({
        type: 'video_call_request',
        payload: {
          callerId: currentUser.id,
          callerName: currentUser.username,
          recipientId: parseInt(receiverId),
          sessionId
        }
      });
      
      res.json({ sessionId });
    } catch (error) {
      next(error);
    }
  });

  // Study Group routes
  router.get('/study-groups', authenticate, async (req, res, next) => {
    try {
      const groups = await storage.getStudyGroups();
      res.json(groups);
    } catch (error) {
      next(error);
    }
  });

  router.get('/study-groups/user', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      const groups = await storage.getStudyGroupsByUserId(currentUser.id);
      res.json(groups);
    } catch (error) {
      next(error);
    }
  });

  router.get('/study-groups/:id', authenticate, async (req, res, next) => {
    try {
      const groupId = parseInt(req.params.id);
      const group = await storage.getStudyGroupById(groupId);
      
      if (!group) {
        return res.status(404).json({
          error: 'Study group not found'
        });
      }
      
      res.json(group);
    } catch (error) {
      next(error);
    }
  });

  router.post('/study-groups', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      
      const groupInput = insertStudyGroupSchema.safeParse({
        ...req.body,
        createdBy: currentUser.id
      });
      
      if (!groupInput.success) {
        return res.status(400).json({
          error: 'Invalid input',
          details: groupInput.error.errors
        });
      }
      
      // Create group
      const newGroup = await storage.createStudyGroup(groupInput.data);
      
      res.status(201).json(newGroup);
    } catch (error) {
      next(error);
    }
  });

  router.put('/study-groups/:id', authenticate, async (req, res, next) => {
    try {
      const groupId = parseInt(req.params.id);
      const currentUser = (req as any).user;
      
      // Check if group exists
      const group = await storage.getStudyGroupById(groupId);
      
      if (!group) {
        return res.status(404).json({
          error: 'Study group not found'
        });
      }
      
      // Check if user is the creator
      if (group.createdBy !== currentUser.id) {
        return res.status(403).json({
          error: 'Only the group creator can update the group'
        });
      }
      
      // Update group
      const updatedGroup = await storage.updateStudyGroup(groupId, req.body);
      
      res.json(updatedGroup);
    } catch (error) {
      next(error);
    }
  });

  router.post('/study-groups/:id/join', authenticate, async (req, res, next) => {
    try {
      const groupId = parseInt(req.params.id);
      const currentUser = (req as any).user;
      
      // Check if group exists
      const group = await storage.getStudyGroupById(groupId);
      
      if (!group) {
        return res.status(404).json({
          error: 'Study group not found'
        });
      }
      
      // Join group
      const membership = await storage.joinStudyGroup(currentUser.id, groupId);
      
      res.status(201).json(membership);
    } catch (error) {
      next(error);
    }
  });

  router.post('/study-groups/:id/leave', authenticate, async (req, res, next) => {
    try {
      const groupId = parseInt(req.params.id);
      const currentUser = (req as any).user;
      
      // Leave group
      const success = await storage.leaveStudyGroup(currentUser.id, groupId);
      
      if (!success) {
        return res.status(404).json({
          error: 'Membership not found'
        });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  // Post routes
  router.get('/posts', authenticate, async (req, res, next) => {
    try {
      const posts = await storage.getPosts();
      
      // Get comments for each post
      const postsWithComments = await Promise.all(
        posts.map(async (post) => {
          const comments = await storage.getPostComments(post.id);
          return {
            ...post,
            comments
          };
        })
      );
      
      res.json(postsWithComments);
    } catch (error) {
      next(error);
    }
  });

  router.get('/posts/user/:userId', authenticate, async (req, res, next) => {
    try {
      const userId = parseInt(req.params.userId);
      const posts = await storage.getUserPosts(userId);
      
      // Get comments for each post
      const postsWithComments = await Promise.all(
        posts.map(async (post) => {
          const comments = await storage.getPostComments(post.id);
          return {
            ...post,
            comments
          };
        })
      );
      
      res.json(postsWithComments);
    } catch (error) {
      next(error);
    }
  });

  router.get('/posts/:id', authenticate, async (req, res, next) => {
    try {
      const postId = parseInt(req.params.id);
      const post = await storage.getPostById(postId);
      
      if (!post) {
        return res.status(404).json({
          error: 'Post not found'
        });
      }
      
      // Get comments
      const comments = await storage.getPostComments(postId);
      
      res.json({
        ...post,
        comments
      });
    } catch (error) {
      next(error);
    }
  });

  router.post('/posts', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      
      const postInput = insertPostSchema.safeParse({
        ...req.body,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar
      });
      
      if (!postInput.success) {
        return res.status(400).json({
          error: 'Invalid input',
          details: postInput.error.errors
        });
      }
      
      // Create post
      const newPost = await storage.createPost(postInput.data);
      
      // Create notifications for hashtags
      if (newPost.hashtags && Array.isArray(newPost.hashtags) && newPost.hashtags.length > 0) {
        for (const tag of newPost.hashtags as string[]) {
          await storage.createOrUpdateHashtag(tag);
        }
      }
      
      res.status(201).json(newPost);
    } catch (error) {
      next(error);
    }
  });

  router.post('/posts/:id/comments', authenticate, async (req, res, next) => {
    try {
      const postId = parseInt(req.params.id);
      const currentUser = (req as any).user;
      
      // Check if post exists
      const post = await storage.getPostById(postId);
      
      if (!post) {
        return res.status(404).json({
          error: 'Post not found'
        });
      }
      
      const commentInput = insertPostCommentSchema.safeParse({
        ...req.body,
        postId,
        userId: currentUser.id,
        userName: currentUser.name,
        userAvatar: currentUser.avatar
      });
      
      if (!commentInput.success) {
        return res.status(400).json({
          error: 'Invalid input',
          details: commentInput.error.errors
        });
      }
      
      // Create comment
      const newComment = await storage.createPostComment(commentInput.data);
      
      // Create notification for post owner
      if (post.userId !== currentUser.id) {
        await storage.createNotification({
          userId: post.userId,
          title: 'New Comment',
          message: `${currentUser.name} commented on your post`,
          type: 'comment',
          isRead: false,
          linkTo: `/post/${postId}`,
          sourceId: newComment.id,
          sourceType: 'comment'
        });
        
        // Send WebSocket notification
        wsManager.broadcast({
          type: 'notification',
          payload: {
            userId: post.userId,
            title: 'New Comment',
            message: `${currentUser.name} commented on your post`,
            sourceId: newComment.id,
            sourceType: 'comment'
          }
        });
      }
      
      res.status(201).json(newComment);
    } catch (error) {
      next(error);
    }
  });

  router.post('/posts/:id/like', authenticate, async (req, res, next) => {
    try {
      const postId = parseInt(req.params.id);
      const currentUser = (req as any).user;
      
      // Check if post exists
      const post = await storage.getPostById(postId);
      
      if (!post) {
        return res.status(404).json({
          error: 'Post not found'
        });
      }
      
      // Like post
      const success = await storage.likePost(postId, currentUser.id);
      
      if (!success) {
        return res.status(400).json({
          error: 'Failed to like post'
        });
      }
      
      // Create notification for post owner
      if (post.userId !== currentUser.id) {
        await storage.createNotification({
          userId: post.userId,
          title: 'New Like',
          message: `${currentUser.name} liked your post`,
          type: 'like',
          isRead: false,
          linkTo: `/post/${postId}`,
          sourceId: postId,
          sourceType: 'post'
        });
        
        // Send WebSocket notification
        wsManager.broadcast({
          type: 'notification',
          payload: {
            userId: post.userId,
            title: 'New Like',
            message: `${currentUser.name} liked your post`,
            sourceId: postId,
            sourceType: 'post'
          }
        });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  router.post('/posts/:id/unlike', authenticate, async (req, res, next) => {
    try {
      const postId = parseInt(req.params.id);
      const currentUser = (req as any).user;
      
      // Unlike post
      const success = await storage.unlikePost(postId, currentUser.id);
      
      if (!success) {
        return res.status(400).json({
          error: 'Failed to unlike post'
        });
      }
      
      res.status(200).json({ success: true });
    } catch (error) {
      next(error);
    }
  });

  router.get('/hashtags', authenticate, async (req, res, next) => {
    try {
      const hashtags = await storage.getHashtags();
      res.json(hashtags);
    } catch (error) {
      next(error);
    }
  });

  router.get('/hashtags/search', authenticate, async (req, res, next) => {
    try {
      const query = req.query.q as string;
      
      if (!query) {
        return res.status(400).json({
          error: 'Search query is required'
        });
      }
      
      const hashtags = await storage.searchHashtags(query);
      res.json(hashtags);
    } catch (error) {
      next(error);
    }
  });

  router.get('/posts/hashtag/:hashtag', authenticate, async (req, res, next) => {
    try {
      const hashtag = req.params.hashtag;
      
      if (!hashtag) {
        return res.status(400).json({
          error: 'Hashtag is required'
        });
      }
      
      const posts = await storage.searchPostsByHashtag(hashtag);
      
      // Get comments for each post
      const postsWithComments = await Promise.all(
        posts.map(async (post) => {
          const comments = await storage.getPostComments(post.id);
          return {
            ...post,
            comments
          };
        })
      );
      
      res.json(postsWithComments);
    } catch (error) {
      next(error);
    }
  });

  // Timer routes
  router.get('/timer-sessions', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      const sessions = await storage.getTimerSessions(currentUser.id);
      res.json(sessions);
    } catch (error) {
      next(error);
    }
  });

  router.post('/timer-sessions', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      
      const sessionInput = insertTimerSessionSchema.safeParse({
        ...req.body,
        userId: currentUser.id
      });
      
      if (!sessionInput.success) {
        return res.status(400).json({
          error: 'Invalid input',
          details: sessionInput.error.errors
        });
      }
      
      // Create session
      const newSession = await storage.createTimerSession(sessionInput.data);
      
      res.status(201).json(newSession);
    } catch (error) {
      next(error);
    }
  });

  router.put('/timer-sessions/:id', authenticate, async (req, res, next) => {
    try {
      const sessionId = parseInt(req.params.id);
      const currentUser = (req as any).user;
      
      // Get session
      const sessions = await db.query.timerSessions.findMany({
        where: (fields, { eq }) => eq(fields.id, sessionId)
      });
      
      if (sessions.length === 0) {
        return res.status(404).json({
          error: 'Timer session not found'
        });
      }
      
      const session = sessions[0];
      
      // Check if session belongs to user
      if (session.userId !== currentUser.id) {
        return res.status(403).json({
          error: 'Forbidden'
        });
      }
      
      // Update session
      const updatedSession = await storage.updateTimerSession(sessionId, req.body);
      
      res.json(updatedSession);
    } catch (error) {
      next(error);
    }
  });

  // Notification routes
  router.get('/notifications', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      const notifications = await storage.getNotifications(currentUser.id);
      res.json(notifications);
    } catch (error) {
      next(error);
    }
  });

  router.get('/notifications/unread-count', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      const count = await storage.getUnreadNotificationsCount(currentUser.id);
      res.json({ count });
    } catch (error) {
      next(error);
    }
  });

  router.post('/notifications/:id/read', authenticate, async (req, res, next) => {
    try {
      const notificationId = parseInt(req.params.id);
      const currentUser = (req as any).user;
      
      // Get notification
      const notifications = await db.query.notifications.findMany({
        where: (fields, { eq }) => eq(fields.id, notificationId)
      });
      
      if (notifications.length === 0) {
        return res.status(404).json({
          error: 'Notification not found'
        });
      }
      
      const notification = notifications[0];
      
      // Check if notification belongs to user
      if (notification.userId !== currentUser.id) {
        return res.status(403).json({
          error: 'Forbidden'
        });
      }
      
      // Mark notification as read
      const success = await storage.markNotificationAsRead(notificationId);
      
      res.json({ success });
    } catch (error) {
      next(error);
    }
  });

  router.post('/notifications/read-all', authenticate, async (req, res, next) => {
    try {
      const currentUser = (req as any).user;
      
      // Mark all notifications as read
      const success = await storage.markAllNotificationsAsRead(currentUser.id);
      
      res.json({ success });
    } catch (error) {
      next(error);
    }
  });

  // Register the router
  app.use("/api", router);

  // Apply error handler
  app.use(errorHandler);

  return httpServer;
}