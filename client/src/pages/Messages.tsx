import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { useAppContext } from '../context/AppContext';
import { formatDistanceToNow, format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Search } from 'lucide-react';
import { websocketService } from '@/lib/websocket';
import { webrtcService } from '@/lib/webrtc';
import VideoCall from '@/components/chat/VideoCall';
import CallNotification from '@/components/chat/CallNotification';
import { VideoCallSession, UserWithStatus } from '@/lib/types';

const Messages = () => {
  const { messages, addMessage, currentUser } = useAppContext();
  const [activeContactId, setActiveContactId] = useState<number>(1);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [currentVideoSession, setCurrentVideoSession] = useState<VideoCallSession | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Array<{ userId: number, username: string }>>([]);
  const [typingStatus, setTypingStatus] = useState<Record<number, boolean>>({});
  const typingTimeoutRef = useRef<Record<number, NodeJS.Timeout>>({});
  
  // Connect to WebSocket
  useEffect(() => {
    // Check connection status
    const handleConnectionChange = (connected: boolean) => {
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
        content: message,
        timestamp: timestamp || new Date().toISOString()
      });
    });
    
    // Listen for typing status changes
    const removeTypingListener = websocketService.addMessageListener('typing_status', (payload) => {
      const { senderId, isTyping } = payload;
      
      setTypingStatus(prev => ({
        ...prev,
        [senderId]: isTyping
      }));
      
      // Clear previous timeout
      if (typingTimeoutRef.current[senderId]) {
        clearTimeout(typingTimeoutRef.current[senderId]);
      }
      
      // Set timeout to clear typing status
      if (isTyping) {
        typingTimeoutRef.current[senderId] = setTimeout(() => {
          setTypingStatus(prev => ({
            ...prev,
            [senderId]: false
          }));
        }, 3000);
      }
    });
    
    // Listen for user status changes
    const removeUserStatusListener = websocketService.addMessageListener('user_status', (payload) => {
      const { userId, username, isOnline } = payload;
      
      if (isOnline) {
        // Add to online users if not already there
        setOnlineUsers(prev => {
          const exists = prev.some(user => user.userId === userId);
          if (!exists) {
            return [...prev, { userId, username }];
          }
          return prev;
        });
      } else {
        // Remove from online users
        setOnlineUsers(prev => prev.filter(user => user.userId !== userId));
      }
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
      removeTypingListener();
      removeUserStatusListener();
      removeCallStateListener();
      
      // Clear all typing timeouts
      Object.values(typingTimeoutRef.current).forEach(timeout => {
        clearTimeout(timeout);
      });
    };
  }, [addMessage, currentUser.id, currentUser.name]);

  // Demo contacts with online status integration
  const contacts = [
    {
      id: 1,
      name: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80',
      status: onlineUsers.some(user => user.userId === 1) ? 'Online' : 'Offline',
      lastSeen: new Date(),
    },
    {
      id: 2,
      name: 'Sophia Williams',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80',
      status: onlineUsers.some(user => user.userId === 2) ? 'Online' : 'Offline',
      lastSeen: new Date(),
    },
    {
      id: 3,
      name: 'David Kim',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80',
      status: onlineUsers.some(user => user.userId === 3) ? 'Online' : 'Away',
      lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: 4,
      name: 'Sarah Thompson',
      avatar: 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80',
      status: onlineUsers.some(user => user.userId === 4) ? 'Online' : 'Offline',
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: 5,
      name: 'Michael Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80',
      status: onlineUsers.some(user => user.userId === 5) ? 'Online' : 'Offline',
      lastSeen: new Date(),
    }
  ];

  // Find active contact details
  const activeContact = contacts.find(contact => contact.id === activeContactId) || contacts[0];

  // Filter messages for current conversation
  const currentConversation = messages.filter(
    msg => (msg.senderId === currentUser.id && msg.receiverId === activeContactId) || 
           (msg.senderId === activeContactId && msg.receiverId === currentUser.id)
  );

  // Filter contacts by search query
  const filteredContacts = contacts.filter(contact => 
    contact.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Notify when user is typing
  const handleTyping = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
    
    // Send typing status if value is not empty
    websocketService.sendTypingStatus(
      e.target.value.length > 0, 
      activeContactId
    );
  };

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversation]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      const timestamp = new Date().toISOString();
      
      // Add message locally
      addMessage({
        senderId: currentUser.id,
        receiverId: activeContactId,
        content: newMessage,
        timestamp
      });
      
      // Send message via WebSocket
      websocketService.sendChatMessage(newMessage, activeContactId);
      
      // Clear typing status
      websocketService.sendTypingStatus(false, activeContactId);
      
      setNewMessage('');
    }
  };

  const formatTime = (timestamp: string) => {
    const messageDate = new Date(timestamp);
    const today = new Date();
    
    if (messageDate.toDateString() === today.toDateString()) {
      return format(messageDate, 'h:mm a');
    } else {
      return format(messageDate, 'MMM d, h:mm a');
    }
  };
  
  const startVideoCall = async () => {
    try {
      const session = await webrtcService.startCall(
        activeContact.id,
        activeContact.name
      );
      
      setCurrentVideoSession(session);
      setIsCallOpen(true);
    } catch (error) {
      console.error('Failed to start video call:', error);
    }
  };
  
  const startVoiceCall = async () => {
    // For simplicity, we'll use the same video call mechanism
    // but disable video in a real implementation
    try {
      const session = await webrtcService.startCall(
        activeContact.id,
        activeContact.name
      );
      
      setCurrentVideoSession(session);
      setIsCallOpen(true);
    } catch (error) {
      console.error('Failed to start voice call:', error);
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
    <div className="flex-1 h-screen overflow-hidden bg-[#F5F5F7] flex flex-col">
      <Header title="Messages" />
      
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
      
      <div className="flex-1 p-4 md:p-6 max-w-7xl mx-auto w-full flex overflow-hidden">
        <div className="flex h-full w-full rounded-xl overflow-hidden">
          {/* Contacts sidebar */}
          <div className="w-full sm:w-80 bg-white border-r border-[#F5F5F7] flex flex-col">
            <div className="p-4 border-b border-[#F5F5F7]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input 
                  placeholder="Search contacts" 
                  className="pl-9 bg-[#F5F5F7] border-none"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>
            
            <ScrollArea className="flex-1">
              <div className="p-2">
                {filteredContacts.map((contact) => (
                  <div 
                    key={contact.id}
                    className={`flex items-center p-3 rounded-xl cursor-pointer transition-colors duration-200 
                      ${activeContactId === contact.id ? 'bg-blue-50 text-secondary' : 'hover:bg-[#F5F5F7]'}`}
                    onClick={() => setActiveContactId(contact.id)}
                  >
                    <div className="relative">
                      <img 
                        src={contact.avatar} 
                        alt={contact.name} 
                        className="w-12 h-12 rounded-full object-cover"
                      />
                      <span 
                        className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white 
                          ${contact.status === 'Online' ? 'bg-accent' : 
                            contact.status === 'Away' ? 'bg-yellow-400' : 'bg-gray-400'}`}
                      ></span>
                    </div>
                    <div className="ml-3 flex-1 overflow-hidden">
                      <div className="flex justify-between items-center">
                        <p className="font-medium truncate">{contact.name}</p>
                        <p className="text-xs text-gray-500">
                          {contact.status === 'Online' 
                            ? 'Now' 
                            : formatDistanceToNow(contact.lastSeen, { addSuffix: true })}
                        </p>
                      </div>
                      <p className="text-sm text-gray-500 truncate">
                        {/* Preview of the last message */}
                        {typingStatus[contact.id] ? (
                          <span className="text-secondary">Typing...</span>
                        ) : (
                          currentConversation.length > 0 
                            ? currentConversation[currentConversation.length - 1].content 
                            : 'No messages yet'
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
          
          {/* Chat area */}
          <div className="hidden sm:flex flex-col flex-1 bg-white">
            {/* Chat header */}
            <div className="flex items-center justify-between p-4 border-b border-[#F5F5F7]">
              <div className="flex items-center">
                <img 
                  src={activeContact.avatar} 
                  alt={activeContact.name} 
                  className="w-10 h-10 rounded-full object-cover"
                />
                <div className="ml-3">
                  <p className="font-medium">{activeContact.name}</p>
                  <p className="text-xs text-gray-500">
                    {activeContact.status === 'Online' 
                      ? 'Online' 
                      : `Last seen ${formatDistanceToNow(activeContact.lastSeen, { addSuffix: true })}`}
                  </p>
                </div>
              </div>
              <div className="flex">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-500 hover:text-secondary"
                  onClick={startVoiceCall}
                  title="Voice call"
                >
                  <i className="fa-solid fa-phone"></i>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-500 hover:text-secondary"
                  onClick={startVideoCall}
                  title="Video call"
                >
                  <i className="fa-solid fa-video"></i>
                </Button>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-500 hover:text-secondary"
                  title="Contact info"
                >
                  <i className="fa-solid fa-info-circle"></i>
                </Button>
              </div>
            </div>
            
            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-[#F5F5F7]">
              <div className="space-y-4">
                {currentConversation.length > 0 ? (
                  currentConversation.map((message) => (
                    <div 
                      key={message.id} 
                      className={`flex ${message.senderId === currentUser.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[70%] rounded-xl p-3 ${
                          message.senderId === currentUser.id 
                            ? 'bg-secondary text-white' 
                            : 'bg-white'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <p 
                          className={`text-xs mt-1 text-right ${
                            message.senderId === currentUser.id 
                              ? 'text-blue-100' 
                              : 'text-gray-500'
                          }`}
                        >
                          {formatTime(message.timestamp)}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-secondary mb-4">
                      <i className="fa-solid fa-comment text-2xl"></i>
                    </div>
                    <h3 className="font-medium">No messages yet</h3>
                    <p className="text-sm text-gray-500 mt-1">Start the conversation with {activeContact.name}</p>
                  </div>
                )}
                
                {/* Typing indicator */}
                {typingStatus[activeContactId] && (
                  <div className="flex justify-start">
                    <div className="bg-white rounded-xl p-3 shadow-sm">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-300 animate-bounce" style={{ animationDelay: '300ms' }}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
            
            {/* Message input */}
            <div className="p-4 border-t border-[#F5F5F7] flex items-center">
              <Button variant="ghost" size="icon" className="text-gray-500 hover:text-secondary">
                <i className="fa-solid fa-paperclip"></i>
              </Button>
              <Input 
                placeholder="Type a message..." 
                className="flex-1 mx-2 bg-[#F5F5F7] border-none focus-visible:ring-1 focus-visible:ring-secondary"
                value={newMessage}
                onChange={handleTyping}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />
              <Button 
                size="icon" 
                className="bg-secondary hover:bg-blue-600 text-white"
                onClick={handleSendMessage}
                disabled={!newMessage.trim()}
              >
                <i className="fa-solid fa-paper-plane"></i>
              </Button>
            </div>
          </div>
          
          {/* Mobile view placeholder when no chat is selected */}
          <div className="flex-1 flex items-center justify-center bg-white sm:hidden">
            <div className="text-center p-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-50 text-secondary mb-4">
                <i className="fa-solid fa-comment text-2xl"></i>
              </div>
              <h3 className="font-medium">Select a conversation</h3>
              <p className="text-sm text-gray-500 mt-1">Choose a contact to start chatting</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Messages;
