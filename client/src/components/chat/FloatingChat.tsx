import { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { motion, AnimatePresence } from 'framer-motion';

const FloatingChat = () => {
  const { messages, addMessage, currentUser } = useAppContext();
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [activeChatUserId, setActiveChatUserId] = useState(1); // Default to first user
  const chatMessagesRef = useRef<HTMLDivElement>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  
  // Connect to WebSocket
  useEffect(() => {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const wsUrl = `${protocol}//${window.location.host}/ws`;
    
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;
    
    ws.onopen = () => {
      console.log('WebSocket connected');
      setIsConnected(true);
    };
    
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat_message') {
          addMessage({
            senderId: data.message.senderId,
            receiverId: data.message.receiverId,
            content: data.message.content
          });
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket disconnected');
      setIsConnected(false);
    };
    
    return () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    };
  }, [addMessage]);
  
  // Find active chat partner
  const chatPartner = {
    id: 1,
    name: 'Alex Chen',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80',
    status: 'Online'
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
      // Add message locally
      addMessage({
        senderId: currentUser.id,
        receiverId: activeChatUserId,
        content: newMessage
      });
      
      // Send message via WebSocket if connected
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({
          type: 'chat_message',
          senderId: currentUser.id,
          receiverId: activeChatUserId,
          content: newMessage
        }));
      }
      
      setNewMessage('');
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
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
                <button className="text-white hover:text-gray-200">
                  <i className="fa-solid fa-phone"></i>
                </button>
                <button className="text-white hover:text-gray-200">
                  <i className="fa-solid fa-video"></i>
                </button>
                <button className="text-white hover:text-gray-200" onClick={closeChat}>
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
  );
};

export default FloatingChat;
