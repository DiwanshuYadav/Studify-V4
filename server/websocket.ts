import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { log } from './vite';

// Define message types for WebSocket communication
export interface WSMessage {
  type: string;
  payload: any;
}

// Client connection type with userId for authentication
interface ClientConnection {
  userId: number | null;
  username: string | null;
  socket: WebSocket;
}

// WebSocket manager class
export class WebSocketManager {
  private wss: WebSocketServer;
  private clients: Map<WebSocket, ClientConnection> = new Map();
  private roomClients: Map<string, Set<WebSocket>> = new Map();

  constructor(server: Server) {
    this.wss = new WebSocketServer({ server, path: '/ws' });
    this.setupConnectionHandler();
    log('WebSocket server initialized', 'websocket');
  }

  private setupConnectionHandler() {
    this.wss.on('connection', (socket) => {
      log('Client connected', 'websocket');
      
      // Initialize client
      this.clients.set(socket, {
        userId: null,
        username: null,
        socket
      });

      // Handle messages
      socket.on('message', (data) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          this.handleMessage(socket, message);
        } catch (error) {
          log(`Error parsing message: ${error}`, 'websocket');
          this.sendError(socket, 'Invalid message format');
        }
      });

      // Handle disconnection
      socket.on('close', () => {
        this.handleDisconnect(socket);
        log('Client disconnected', 'websocket');
      });
    });
  }

  private handleMessage(socket: WebSocket, message: WSMessage) {
    const client = this.clients.get(socket);
    if (!client) return;

    log(`Received message: ${message.type}`, 'websocket');

    switch (message.type) {
      case 'auth':
        this.handleAuth(socket, message.payload);
        break;
      case 'join_room':
        this.handleJoinRoom(socket, message.payload.roomId);
        break;
      case 'leave_room':
        this.handleLeaveRoom(socket, message.payload.roomId);
        break;
      case 'message':
        this.handleChatMessage(socket, message.payload);
        break;
      case 'typing':
        this.handleTypingStatus(socket, message.payload);
        break;
      case 'video_call_request':
        this.handleVideoCallRequest(socket, message.payload);
        break;
      case 'video_call_accept':
        this.handleVideoCallAccept(socket, message.payload);
        break;
      case 'video_call_reject':
        this.handleVideoCallReject(socket, message.payload);
        break;
      case 'video_call_end':
        this.handleVideoCallEnd(socket, message.payload);
        break;
      case 'notification':
        this.handleNotification(socket, message.payload);
        break;
      default:
        this.sendError(socket, `Unknown message type: ${message.type}`);
    }
  }

  private handleAuth(socket: WebSocket, payload: any) {
    const { userId, username } = payload;
    const client = this.clients.get(socket);
    
    if (client) {
      client.userId = userId;
      client.username = username;
      this.clients.set(socket, client);
      
      this.send(socket, {
        type: 'auth_success',
        payload: { userId, username }
      });
      
      log(`Client authenticated: ${username} (${userId})`, 'websocket');
    }
  }

  private handleJoinRoom(socket: WebSocket, roomId: string) {
    const client = this.clients.get(socket);
    if (!client || client.userId === null) {
      this.sendError(socket, 'Authentication required');
      return;
    }

    // Create room if it doesn't exist
    if (!this.roomClients.has(roomId)) {
      this.roomClients.set(roomId, new Set());
    }

    // Add client to room
    const room = this.roomClients.get(roomId);
    room?.add(socket);

    // Notify room members about the new user
    this.broadcastToRoom(roomId, {
      type: 'user_joined',
      payload: {
        userId: client.userId,
        username: client.username,
        roomId
      }
    }, socket); // Don't send to the joining user

    // Confirm join to the user
    this.send(socket, {
      type: 'room_joined',
      payload: { roomId }
    });

    log(`Client ${client.username} joined room: ${roomId}`, 'websocket');
  }

  private handleLeaveRoom(socket: WebSocket, roomId: string) {
    const client = this.clients.get(socket);
    if (!client || client.userId === null) return;

    // Remove client from room
    const room = this.roomClients.get(roomId);
    if (room) {
      room.delete(socket);
      
      // Delete room if empty
      if (room.size === 0) {
        this.roomClients.delete(roomId);
      } else {
        // Notify room about user leaving
        this.broadcastToRoom(roomId, {
          type: 'user_left',
          payload: {
            userId: client.userId,
            username: client.username,
            roomId
          }
        });
      }
    }

    // Confirm leave to the user
    this.send(socket, {
      type: 'room_left',
      payload: { roomId }
    });

    log(`Client ${client.username} left room: ${roomId}`, 'websocket');
  }

  private handleChatMessage(socket: WebSocket, payload: any) {
    const client = this.clients.get(socket);
    if (!client || client.userId === null) {
      this.sendError(socket, 'Authentication required');
      return;
    }

    const { roomId, message, recipientId } = payload;

    // If it's a direct message (to a specific user)
    if (recipientId) {
      const recipientSocket = this.findSocketByUserId(recipientId);
      if (recipientSocket) {
        this.send(recipientSocket, {
          type: 'message',
          payload: {
            senderId: client.userId,
            senderName: client.username,
            message,
            timestamp: new Date().toISOString()
          }
        });
      }
    } 
    // If it's a room message
    else if (roomId) {
      this.broadcastToRoom(roomId, {
        type: 'message',
        payload: {
          senderId: client.userId,
          senderName: client.username,
          message,
          roomId,
          timestamp: new Date().toISOString()
        }
      });
    }
  }

  private handleTypingStatus(socket: WebSocket, payload: any) {
    const client = this.clients.get(socket);
    if (!client || client.userId === null) return;

    const { roomId, recipientId, isTyping } = payload;

    // For direct messaging
    if (recipientId) {
      const recipientSocket = this.findSocketByUserId(recipientId);
      if (recipientSocket) {
        this.send(recipientSocket, {
          type: 'typing_status',
          payload: {
            senderId: client.userId,
            senderName: client.username,
            isTyping
          }
        });
      }
    } 
    // For rooms
    else if (roomId) {
      this.broadcastToRoom(roomId, {
        type: 'typing_status',
        payload: {
          senderId: client.userId,
          senderName: client.username,
          isTyping,
          roomId
        }
      }, socket); // Don't send back to sender
    }
  }

  private handleVideoCallRequest(socket: WebSocket, payload: any) {
    const client = this.clients.get(socket);
    if (!client || client.userId === null) {
      this.sendError(socket, 'Authentication required');
      return;
    }

    const { recipientId, sessionId } = payload;
    const recipientSocket = this.findSocketByUserId(recipientId);
    
    if (recipientSocket) {
      this.send(recipientSocket, {
        type: 'video_call_request',
        payload: {
          callerId: client.userId,
          callerName: client.username,
          sessionId
        }
      });
      
      // Send confirmation to caller
      this.send(socket, {
        type: 'video_call_requesting',
        payload: { 
          recipientId,
          sessionId
        }
      });
      
      log(`Video call request from ${client.username} to ${recipientId}, session: ${sessionId}`, 'websocket');
    } else {
      // If recipient is not connected
      this.send(socket, {
        type: 'video_call_error',
        payload: {
          error: 'Recipient is not online',
          recipientId
        }
      });
    }
  }

  private handleVideoCallAccept(socket: WebSocket, payload: any) {
    const client = this.clients.get(socket);
    if (!client || client.userId === null) return;

    const { callerId, sessionId } = payload;
    const callerSocket = this.findSocketByUserId(callerId);
    
    if (callerSocket) {
      this.send(callerSocket, {
        type: 'video_call_accepted',
        payload: {
          recipientId: client.userId,
          recipientName: client.username,
          sessionId
        }
      });
      
      log(`Video call accepted by ${client.username} from ${callerId}, session: ${sessionId}`, 'websocket');
    }
  }

  private handleVideoCallReject(socket: WebSocket, payload: any) {
    const client = this.clients.get(socket);
    if (!client || client.userId === null) return;

    const { callerId, sessionId, reason } = payload;
    const callerSocket = this.findSocketByUserId(callerId);
    
    if (callerSocket) {
      this.send(callerSocket, {
        type: 'video_call_rejected',
        payload: {
          recipientId: client.userId,
          recipientName: client.username,
          sessionId,
          reason
        }
      });
    }
  }

  private handleVideoCallEnd(socket: WebSocket, payload: any) {
    const client = this.clients.get(socket);
    if (!client || client.userId === null) return;

    const { sessionId, participantId } = payload;
    
    if (participantId) {
      const participantSocket = this.findSocketByUserId(participantId);
      if (participantSocket) {
        this.send(participantSocket, {
          type: 'video_call_ended',
          payload: {
            userId: client.userId,
            username: client.username,
            sessionId
          }
        });
      }
    }
  }

  private handleNotification(socket: WebSocket, payload: any) {
    const client = this.clients.get(socket);
    if (!client || client.userId === null) {
      this.sendError(socket, 'Authentication required');
      return;
    }

    const { recipientId, notification } = payload;
    
    if (recipientId) {
      const recipientSocket = this.findSocketByUserId(recipientId);
      if (recipientSocket) {
        this.send(recipientSocket, {
          type: 'notification',
          payload: notification
        });
      }
    }
  }

  private handleDisconnect(socket: WebSocket) {
    const client = this.clients.get(socket);
    if (!client) return;

    // Remove client from all rooms
    for (const [roomId, clients] of this.roomClients.entries()) {
      if (clients.has(socket)) {
        clients.delete(socket);
        
        // Notify room about user leaving if authenticated
        if (client.userId !== null) {
          this.broadcastToRoom(roomId, {
            type: 'user_left',
            payload: {
              userId: client.userId,
              username: client.username,
              roomId
            }
          });
        }
        
        // Clean up empty rooms
        if (clients.size === 0) {
          this.roomClients.delete(roomId);
        }
      }
    }

    // Remove client from clients map
    this.clients.delete(socket);
  }

  private findSocketByUserId(userId: number): WebSocket | undefined {
    for (const [socket, client] of this.clients.entries()) {
      if (client.userId === userId) {
        return socket;
      }
    }
    return undefined;
  }

  private send(socket: WebSocket, message: WSMessage) {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    }
  }

  private sendError(socket: WebSocket, errorMessage: string) {
    this.send(socket, {
      type: 'error',
      payload: { error: errorMessage }
    });
  }

  private broadcastToRoom(roomId: string, message: WSMessage, excludeSocket?: WebSocket) {
    const room = this.roomClients.get(roomId);
    if (!room) return;

    for (const socket of room) {
      if (excludeSocket && socket === excludeSocket) continue;
      this.send(socket, message);
    }
  }

  // Broadcast to all connected clients
  public broadcast(message: WSMessage, excludeSocket?: WebSocket) {
    for (const [socket] of this.clients) {
      if (excludeSocket && socket === excludeSocket) continue;
      this.send(socket, message);
    }
  }

  // Helper method to notify all clients of a user's online status
  public notifyUserStatus(userId: number, username: string, isOnline: boolean) {
    this.broadcast({
      type: 'user_status',
      payload: {
        userId,
        username,
        isOnline
      }
    });
  }

  // Get the count of online users
  public getOnlineUsersCount(): number {
    return [...this.clients.values()].filter(client => client.userId !== null).length;
  }

  // Get the list of online users
  public getOnlineUsers(): Array<{ userId: number, username: string }> {
    return [...this.clients.values()]
      .filter(client => client.userId !== null && client.username !== null)
      .map(client => ({
        userId: client.userId as number,
        username: client.username as string
      }));
  }
}

export default WebSocketManager;