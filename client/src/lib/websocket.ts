// WebSocket client service
import { WSMessage } from './types';

class WebSocketService {
  private socket: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private messageListeners: Map<string, Set<(payload: any) => void>> = new Map();
  private connectionListeners: Set<(connected: boolean) => void> = new Set();
  private isConnected = false;

  constructor() {
    // Only initialize in browser environment
    if (typeof window !== 'undefined') {
      this.init();
    }
  }

  // Initialize WebSocket connection
  private init() {
    try {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws`;

      console.log('Connecting to WebSocket:', wsUrl);

      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onerror = this.handleError.bind(this);
    } catch (error) {
      console.error('WebSocket initialization error:', error);
    }
  }

  // Event handlers
  private handleOpen() {
    console.log('WebSocket connection established');
    this.isConnected = true;
    this.reconnectAttempts = 0;
    this.notifyConnectionListeners(true);
  }

  private handleMessage(event: MessageEvent) {
    try {
      const message: WSMessage = JSON.parse(event.data);
      this.notifyMessageListeners(message);
    } catch (error) {
      console.error('Error parsing WebSocket message:', error);
    }
  }

  private handleClose(event: CloseEvent) {
    console.log('WebSocket disconnected, code:', event.code, 'reason:', event.reason);
    
    this.isConnected = false;
    this.notifyConnectionListeners(false);
    
    // Attempt to reconnect if not closed cleanly
    if (!event.wasClean && this.reconnectAttempts < this.maxReconnectAttempts) {
      const timeout = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);
      console.log(`Attempting to reconnect in ${timeout / 1000} seconds...`);
      
      this.reconnectTimeout = setTimeout(() => {
        this.reconnectAttempts++;
        this.init();
      }, timeout);
    }
  }

  private handleError(error: Event) {
    console.error('WebSocket error:', error);
  }

  // Public methods
  public send(message: WSMessage): boolean {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      this.socket.send(JSON.stringify(message));
      return true;
    } else {
      console.warn('WebSocket not connected. Message not sent:', message);
      return false;
    }
  }

  public addMessageListener(type: string, callback: (payload: any) => void): () => void {
    if (!this.messageListeners.has(type)) {
      this.messageListeners.set(type, new Set());
    }
    
    const listeners = this.messageListeners.get(type)!;
    listeners.add(callback);
    
    // Return a function to remove this listener
    return () => {
      if (this.messageListeners.has(type)) {
        const listeners = this.messageListeners.get(type)!;
        listeners.delete(callback);
        
        if (listeners.size === 0) {
          this.messageListeners.delete(type);
        }
      }
    };
  }

  public addConnectionListener(callback: (connected: boolean) => void): () => void {
    this.connectionListeners.add(callback);
    
    // Immediately notify with current status
    if (this.isConnected) {
      callback(true);
    }
    
    // Return a function to remove this listener
    return () => {
      this.connectionListeners.delete(callback);
    };
  }

  private notifyMessageListeners(message: WSMessage) {
    if (this.messageListeners.has(message.type)) {
      const listeners = this.messageListeners.get(message.type)!;
      listeners.forEach(callback => {
        try {
          callback(message.payload);
        } catch (error) {
          console.error('Error in message listener:', error);
        }
      });
    }
  }

  private notifyConnectionListeners(connected: boolean) {
    this.connectionListeners.forEach(callback => {
      try {
        callback(connected);
      } catch (error) {
        console.error('Error in connection listener:', error);
      }
    });
  }

  public authenticate(userId: number, username: string) {
    this.send({
      type: 'auth',
      payload: { userId, username }
    });
  }

  public sendChatMessage(content: string, recipientId?: number, roomId?: string) {
    this.send({
      type: 'message',
      payload: { message: content, recipientId, roomId }
    });
  }

  public sendTypingStatus(isTyping: boolean, recipientId?: number, roomId?: string) {
    this.send({
      type: 'typing',
      payload: { isTyping, recipientId, roomId }
    });
  }

  public requestVideoCall(recipientId: number, sessionId: string) {
    this.send({
      type: 'video_call_request',
      payload: { recipientId, sessionId }
    });
  }

  public acceptVideoCall(callerId: number, sessionId: string) {
    this.send({
      type: 'video_call_accept',
      payload: { callerId, sessionId }
    });
  }

  public rejectVideoCall(callerId: number, sessionId: string, reason?: string) {
    this.send({
      type: 'video_call_reject',
      payload: { callerId, sessionId, reason }
    });
  }

  public endVideoCall(participantId: number, sessionId: string) {
    this.send({
      type: 'video_call_end',
      payload: { participantId, sessionId }
    });
  }

  public joinRoom(roomId: string) {
    this.send({
      type: 'join_room',
      payload: { roomId }
    });
  }

  public leaveRoom(roomId: string) {
    this.send({
      type: 'leave_room',
      payload: { roomId }
    });
  }

  public dispose() {
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    this.messageListeners.clear();
    this.connectionListeners.clear();
  }

  public getConnectionStatus(): boolean {
    return this.isConnected;
  }
}

// Create a singleton instance
export const websocketService = new WebSocketService();

export default websocketService;