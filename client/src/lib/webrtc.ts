import { VideoCallSession } from './types';
import { websocketService } from './websocket';

class WebRTCService {
  private peerConnection: RTCPeerConnection | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private currentSession: VideoCallSession | null = null;
  private iceCandidates: RTCIceCandidate[] = [];
  private onRemoteStreamListeners: Set<(stream: MediaStream) => void> = new Set();
  private onCallStateChangeListeners: Set<(state: string) => void> = new Set();
  
  // Configuration with free STUN servers
  private config: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
      { urls: 'stun:stun3.l.google.com:19302' },
      { urls: 'stun:stun4.l.google.com:19302' },
    ]
  };
  
  constructor() {
    this.setupWebSocketListeners();
  }
  
  private setupWebSocketListeners() {
    // Listen for WebSocket messages related to video calls
    websocketService.addMessageListener('video_call_request', (payload) => {
      this.handleIncomingCall(payload);
    });
    
    websocketService.addMessageListener('video_call_accepted', (payload) => {
      this.handleCallAccepted(payload);
    });
    
    websocketService.addMessageListener('video_call_rejected', (payload) => {
      this.handleCallRejected(payload);
    });
    
    websocketService.addMessageListener('video_call_ended', (payload) => {
      this.handleCallEnded(payload);
    });
    
    // Handle ICE candidates from the other peer
    websocketService.addMessageListener('ice_candidate', (payload) => {
      this.handleRemoteIceCandidate(payload.candidate);
    });
    
    // Handle session description from the other peer
    websocketService.addMessageListener('session_description', (payload) => {
      this.handleRemoteDescription(payload.description);
    });
  }
  
  // Start a video call
  public async startCall(recipientId: number, recipientName: string): Promise<VideoCallSession> {
    try {
      // Generate a unique session ID
      const sessionId = this.generateSessionId();
      
      // Create a session object
      const session: VideoCallSession = {
        sessionId,
        callerId: Number(localStorage.getItem('userId')),
        callerName: localStorage.getItem('username') || 'Unknown User',
        recipientId,
        recipientName,
        status: 'requesting',
        startTime: new Date()
      };
      
      this.currentSession = session;
      
      // Request user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      
      // Initialize peer connection
      this.initializePeerConnection();
      
      // Add tracks to the peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
      
      // Send call request via WebSocket
      websocketService.requestVideoCall(recipientId, sessionId);
      
      this.notifyCallStateChange('calling');
      
      return session;
    } catch (error) {
      console.error('Error starting call:', error);
      this.notifyCallStateChange('error');
      throw error;
    }
  }
  
  // Accept an incoming call
  public async acceptCall(callerId: number, sessionId: string): Promise<void> {
    try {
      if (!this.currentSession) {
        throw new Error('No active call session');
      }
      
      // Request user media
      this.localStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
        video: true
      });
      
      // Initialize peer connection
      this.initializePeerConnection();
      
      // Add tracks to the peer connection
      this.localStream.getTracks().forEach(track => {
        if (this.peerConnection && this.localStream) {
          this.peerConnection.addTrack(track, this.localStream);
        }
      });
      
      // Set session status to accepted
      this.currentSession.status = 'accepted';
      
      // Send accept message via WebSocket
      websocketService.acceptVideoCall(callerId, sessionId);
      
      this.notifyCallStateChange('connected');
    } catch (error) {
      console.error('Error accepting call:', error);
      this.notifyCallStateChange('error');
      throw error;
    }
  }
  
  // Reject an incoming call
  public rejectCall(callerId: number, sessionId: string, reason?: string): void {
    if (!this.currentSession) {
      console.warn('No active call session to reject');
      return;
    }
    
    // Set session status to rejected
    this.currentSession.status = 'rejected';
    
    // Send reject message via WebSocket
    websocketService.rejectVideoCall(callerId, sessionId, reason);
    
    // Clean up
    this.cleanup();
    
    this.notifyCallStateChange('rejected');
  }
  
  // End an ongoing call
  public endCall(): void {
    if (!this.currentSession) {
      console.warn('No active call session to end');
      return;
    }
    
    // Set session status to ended
    this.currentSession.status = 'ended';
    this.currentSession.endTime = new Date();
    
    // Send end call message via WebSocket
    const participantId = this.currentSession.callerId === Number(localStorage.getItem('userId'))
      ? this.currentSession.recipientId
      : this.currentSession.callerId;
    
    websocketService.endVideoCall(participantId, this.currentSession.sessionId);
    
    // Clean up
    this.cleanup();
    
    this.notifyCallStateChange('ended');
  }
  
  // Handle an incoming call
  private handleIncomingCall(payload: any): void {
    const { callerId, callerName, sessionId } = payload;
    
    // Create a session object
    const session: VideoCallSession = {
      sessionId,
      callerId,
      callerName,
      recipientId: Number(localStorage.getItem('userId')),
      recipientName: localStorage.getItem('username') || 'Unknown User',
      status: 'requesting',
      startTime: new Date()
    };
    
    this.currentSession = session;
    
    this.notifyCallStateChange('incoming');
  }
  
  // Handle call accepted event
  private async handleCallAccepted(payload: any): Promise<void> {
    if (!this.currentSession) {
      console.warn('No active call session');
      return;
    }
    
    const { recipientId, recipientName, sessionId } = payload;
    
    // Update session
    this.currentSession.status = 'accepted';
    this.currentSession.recipientName = recipientName;
    
    // Create and send offer
    try {
      const offer = await this.peerConnection?.createOffer();
      await this.peerConnection?.setLocalDescription(offer);
      
      // Send offer via WebSocket
      websocketService.send({
        type: 'session_description',
        payload: {
          recipientId,
          sessionId,
          description: offer
        }
      });
      
      this.notifyCallStateChange('connecting');
    } catch (error) {
      console.error('Error creating offer:', error);
      this.notifyCallStateChange('error');
    }
  }
  
  // Handle call rejected event
  private handleCallRejected(payload: any): void {
    if (!this.currentSession) {
      console.warn('No active call session');
      return;
    }
    
    const { sessionId, reason } = payload;
    
    if (sessionId !== this.currentSession.sessionId) {
      return;
    }
    
    // Update session
    this.currentSession.status = 'rejected';
    
    // Clean up
    this.cleanup();
    
    this.notifyCallStateChange('rejected');
    
    console.log(`Call rejected${reason ? ': ' + reason : ''}`);
  }
  
  // Handle call ended event
  private handleCallEnded(payload: any): void {
    if (!this.currentSession) {
      console.warn('No active call session');
      return;
    }
    
    const { sessionId } = payload;
    
    if (sessionId !== this.currentSession.sessionId) {
      return;
    }
    
    // Update session
    this.currentSession.status = 'ended';
    this.currentSession.endTime = new Date();
    
    // Clean up
    this.cleanup();
    
    this.notifyCallStateChange('ended');
  }
  
  // Initialize peer connection
  private initializePeerConnection(): void {
    // Create new peer connection
    this.peerConnection = new RTCPeerConnection(this.config);
    
    // Handle ICE candidates
    this.peerConnection.onicecandidate = (event) => {
      if (event.candidate) {
        this.handleLocalIceCandidate(event.candidate);
      }
    };
    
    // Handle connection state changes
    this.peerConnection.onconnectionstatechange = () => {
      console.log('Connection state:', this.peerConnection?.connectionState);
      
      if (this.peerConnection?.connectionState === 'connected') {
        this.notifyCallStateChange('connected');
      } else if (this.peerConnection?.connectionState === 'failed') {
        this.notifyCallStateChange('error');
      } else if (this.peerConnection?.connectionState === 'disconnected' || 
                this.peerConnection?.connectionState === 'closed') {
        this.notifyCallStateChange('ended');
      }
    };
    
    // Handle remote tracks
    this.peerConnection.ontrack = (event) => {
      this.remoteStream = new MediaStream();
      event.streams[0].getTracks().forEach(track => {
        if (this.remoteStream) {
          this.remoteStream.addTrack(track);
        }
      });
      
      this.notifyRemoteStream(this.remoteStream);
    };
    
    // Apply any pending ICE candidates
    this.iceCandidates.forEach(candidate => {
      this.peerConnection?.addIceCandidate(candidate);
    });
    this.iceCandidates = [];
  }
  
  // Handle local ICE candidate
  private handleLocalIceCandidate(candidate: RTCIceCandidate): void {
    if (!this.currentSession) {
      console.warn('No active call session for ICE candidate');
      return;
    }
    
    const recipientId = this.currentSession.callerId === Number(localStorage.getItem('userId'))
      ? this.currentSession.recipientId
      : this.currentSession.callerId;
    
    // Send ICE candidate via WebSocket
    websocketService.send({
      type: 'ice_candidate',
      payload: {
        recipientId,
        sessionId: this.currentSession.sessionId,
        candidate
      }
    });
  }
  
  // Handle remote ICE candidate
  private handleRemoteIceCandidate(candidate: RTCIceCandidateInit): void {
    if (!this.peerConnection) {
      // Queue the candidate if the peer connection isn't ready
      this.iceCandidates.push(new RTCIceCandidate(candidate));
      return;
    }
    
    this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
      .catch(error => console.error('Error adding ICE candidate:', error));
  }
  
  // Handle remote session description
  private async handleRemoteDescription(description: RTCSessionDescriptionInit): Promise<void> {
    if (!this.peerConnection) {
      console.warn('No peer connection for remote description');
      return;
    }
    
    try {
      await this.peerConnection.setRemoteDescription(new RTCSessionDescription(description));
      
      if (description.type === 'offer') {
        const answer = await this.peerConnection.createAnswer();
        await this.peerConnection.setLocalDescription(answer);
        
        if (!this.currentSession) {
          console.warn('No active call session for sending answer');
          return;
        }
        
        // Send answer via WebSocket
        websocketService.send({
          type: 'session_description',
          payload: {
            recipientId: this.currentSession.callerId,
            sessionId: this.currentSession.sessionId,
            description: answer
          }
        });
      }
    } catch (error) {
      console.error('Error handling remote description:', error);
      this.notifyCallStateChange('error');
    }
  }
  
  // Clean up resources
  private cleanup(): void {
    // Stop local tracks
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Stop remote tracks
    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }
    
    // Close peer connection
    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }
  }
  
  // Generate a session ID
  private generateSessionId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  
  // Get the local stream
  public getLocalStream(): MediaStream | null {
    return this.localStream;
  }
  
  // Get the remote stream
  public getRemoteStream(): MediaStream | null {
    return this.remoteStream;
  }
  
  // Get the current session
  public getCurrentSession(): VideoCallSession | null {
    return this.currentSession;
  }
  
  // Add a listener for remote stream events
  public onRemoteStream(callback: (stream: MediaStream) => void): () => void {
    this.onRemoteStreamListeners.add(callback);
    
    // If there's already a remote stream, notify immediately
    if (this.remoteStream) {
      callback(this.remoteStream);
    }
    
    // Return a function to remove this listener
    return () => {
      this.onRemoteStreamListeners.delete(callback);
    };
  }
  
  // Add a listener for call state change events
  public onCallStateChange(callback: (state: string) => void): () => void {
    this.onCallStateChangeListeners.add(callback);
    
    // Return a function to remove this listener
    return () => {
      this.onCallStateChangeListeners.delete(callback);
    };
  }
  
  // Notify all remote stream listeners
  private notifyRemoteStream(stream: MediaStream): void {
    this.onRemoteStreamListeners.forEach(callback => {
      try {
        callback(stream);
      } catch (error) {
        console.error('Error in remote stream listener:', error);
      }
    });
  }
  
  // Notify all call state change listeners
  private notifyCallStateChange(state: string): void {
    this.onCallStateChangeListeners.forEach(callback => {
      try {
        callback(state);
      } catch (error) {
        console.error('Error in call state change listener:', error);
      }
    });
  }
}

// Create a singleton instance
export const webrtcService = new WebRTCService();

export default webrtcService;