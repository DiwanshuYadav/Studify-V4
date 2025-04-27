import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';
import { VideoCallSession } from '@/lib/types';
import { websocketService } from '@/lib/websocket';
import { webrtcService } from '@/lib/webrtc';
import VideoCall from './VideoCall';
import CallNotification from './CallNotification';

const FloatingChat = () => {
  const { messages, addMessage, currentUser } = useAppContext();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [activeChatUserId, setActiveChatUserId] = useState(1); // Default to first user
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [currentVideoSession, setCurrentVideoSession] = useState<VideoCallSession | null>(null);
  
  // Connect to WebSocket
  useEffect(() => {
    // Check connection status
    const handleConnectionChange = (connected: boolean) => {
      setIsConnected(connected);
      
      if (connected) {
        // Send auth info
        websocketService.authenticate(
          currentUser.id,
          currentUser.name
        );
      }
    };
    
    // Add connection listener
    const removeConnectionListener = websocketService.addConnectionListener(handleConnectionChange);
    
    // Add message listeners
    const removeChatMessageListener = websocketService.addMessageListener('message', (payload) => {
      const { senderId, message, timestamp } = payload;
      
      // Add message to state
      addMessage({
        senderId,
        receiverId: currentUser.id,
        content: message
      });
    });
    
    // Listen for call state changes
    const handleCallStateChange = (state: string) => {
      if (state === 'incoming') {
        // An incoming call has been detected
        const session = webrtcService.getCurrentSession();
        if (session) {
          setCurrentVideoSession(session);
        }
      } else if (state === 'calling' || state === 'connecting' || state === 'connected') {
        // We're in a call
        setIsCallOpen(true);
      } else if (state === 'ended' || state === 'rejected' || state === 'error') {
        // Call has ended
        setIsCallOpen(false);
        setCurrentVideoSession(null);
      }
    };
    
    const removeCallStateListener = webrtcService.onCallStateChange(handleCallStateChange);
    
    return () => {
      removeConnectionListener();
      removeChatMessageListener();
      removeCallStateListener();
    };
  }, [addMessage, currentUser.id, currentUser.name]);

  // Find active chat partner
  const chatPartner = {
    id: 1,
    name: 'Alex Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80',
    status: isConnected ? 'Online' : 'Offline'
  };

  // Filter messages for current chat
  const currentChatMessages = messages.filter(
    msg => (msg.senderId === currentUser.id && msg.receiverId === activeChatUserId) || 
           (msg.senderId === activeChatUserId && msg.receiverId === currentUser.id)
  );

  // Auto-scroll to bottom of chat
  useEffect(() => {
    if (chatMessagesRef.current && isChatOpen) {
      chatMessagesRef.current.scrollTop = chatMessagesRef.current.scrollHeight;
    }
  }, [currentChatMessages, isChatOpen]);

  const toggleChat = () => {
    setIsChatOpen(!isChatOpen);
  };

  const closeChat = () => {
    setIsChatOpen(false);
  };

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const timestamp = new Date().toISOString();
      
      // Add message locally
      addMessage({
        senderId: currentUser.id,
        receiverId: activeChatUserId,
        content: newMessage
      });
      
      // Send message via WebSocket
      websocketService.sendChatMessage(newMessage, activeChatUserId);
      
      setNewMessage('');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  const startVideoCall = async () => {
    try {
      const session = await webrtcService.startCall(
        chatPartner.id,
        chatPartner.name
      );
      
      setCurrentVideoSession(session);
      setIsCallOpen(true);
    } catch (error) {
      console.error('Failed to start video call:', error);
    }
  };
  
  const handleAcceptCall = async () => {
    if (!currentVideoSession) return;
    
    try {
      await webrtcService.acceptCall(
        currentVideoSession.callerId,
        currentVideoSession.sessionId
      );
      
      setIsCallOpen(true);
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };
  
  const handleRejectCall = () => {
    if (!currentVideoSession) return;
    
    webrtcService.rejectCall(
      currentVideoSession.callerId,
      currentVideoSession.sessionId,
      'Call rejected by user'
    );
  };
  
  const handleEndCall = () => {
    setIsCallOpen(false);
    webrtcService.endCall();
  };

  return (
    <>
      {/* Call notification */}
      <CallNotification
        onAccept={handleAcceptCall}
        onReject={handleRejectCall}
      />
      
      {/* Video call modal */}
      <VideoCall
        isOpen={isCallOpen}
        onClose={handleEndCall}
        userId={currentUser.id}
        username={currentUser.name}
      />
      
      {/* Chat interface */}
      <div className="fixed bottom-5 right-5 flex flex-col space-y-3 items-end z-20">
        <AnimatePresence>
          {isChatOpen && (
            <motion.div 
              className="bg-white rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1)] w-72 overflow-hidden"
              initial={{ scale: 0, opacity: 0, originY: 1, originX: 1 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.23, 1, 0.32, 1] }}
            >
              <div className="flex items-center justify-between bg-secondary text-white p-3">
                <div className="flex items-center">
                  <img 
                    className="w-8 h-8 rounded-full object-cover" 
                    src={chatPartner.avatar} 
                    alt={`${chatPartner.name}'s avatar`} 
                  />
                  <div className="ml-2">
                    <p className="text-sm font-medium">{chatPartner.name}</p>
                    <p className="text-xs opacity-75">{chatPartner.status}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    className="text-white hover:text-gray-200"
                    onClick={() => {}}
                    title="Voice call"
                  >
                    <i className="fa-solid fa-phone"></i>
                  </button>
                  <button 
                    className="text-white hover:text-gray-200"
                    onClick={startVideoCall}
                    title="Video call"
                  >
                    <i className="fa-solid fa-video"></i>
                  </button>
                  <button 
                    className="text-white hover:text-gray-200" 
                    onClick={closeChat}
                    title="Close chat"
                  >
                    <i className="fa-solid fa-xmark"></i>
                  </button>
                </div>
              </div>
              
              <div 
                ref={chatMessagesRef}
                className="h-64 overflow-y-auto p-3 space-y-3 bg-[#F5F5F7]"
              >
                {currentChatMessages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}>
                    <div 
                      className={`rounded-lg p-2 max-w-[80%] shadow-sm ${
                        msg.senderId === currentUser.id 
                          ? 'bg-secondary text-white' 
                          : 'bg-white text-[#1D1D1F]'
                      }`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <p 
                        className={`text-xs ${
                          msg.senderId === currentUser.id 
                            ? 'text-white opacity-75' 
                            : 'text-gray-500'
                        } mt-1`}
                      >
                        {formatTime(msg.timestamp)}
                      </p>
                    </div>
                  </div>
                ))}
                
                {currentChatMessages.length === 0 && (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-gray-400 text-sm">
                      No messages yet. Start the conversation!
                    </p>
                  </div>
                )}
              </div>
              
              <div className="p-3 border-t border-[#F5F5F7]">
                <div className="flex items-center">
                  <input 
                    type="text" 
                    placeholder="Type a message..." 
                    className="flex-1 border-none bg-[#F5F5F7] rounded-full px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-secondary" 
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage();
                      }
                    }}
                  />
                  <button 
                    className="ml-2 text-secondary hover:text-blue-600"
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim()}
                  >
                    <i className="fa-solid fa-paper-plane"></i>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <button 
          className="bg-secondary text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:bg-blue-600 transition-apple"
          onClick={toggleChat}
        >
          <i className="fa-solid fa-comment text-xl"></i>
        </button>
      </div>
    </>
  );
};

export default FloatingChat;
