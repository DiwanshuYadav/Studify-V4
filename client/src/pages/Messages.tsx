import { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import { useAppContext } from '../context/AppContext';
import { formatDistanceToNow, format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar } from '@/components/ui/avatar';
import { Search } from 'lucide-react';

const Messages = () => {
  const { messages, addMessage, currentUser } = useAppContext();
  const [activeContactId, setActiveContactId] = useState<number>(1);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Demo contacts (in a real app, these would come from the server)
  const contacts = [
    {
      id: 1,
      name: 'Alex Chen',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80',
      status: 'Online',
      lastSeen: new Date(),
    },
    {
      id: 2,
      name: 'Sophia Williams',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80',
      status: 'Online',
      lastSeen: new Date(),
    },
    {
      id: 3,
      name: 'David Kim',
      avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80',
      status: 'Away',
      lastSeen: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
    },
    {
      id: 4,
      name: 'Sarah Thompson',
      avatar: 'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80',
      status: 'Offline',
      lastSeen: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
    },
    {
      id: 5,
      name: 'Michael Rodriguez',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80',
      status: 'Online',
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

  // Auto-scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [currentConversation]);

  const handleSendMessage = () => {
    if (newMessage.trim()) {
      addMessage({
        senderId: currentUser.id,
        receiverId: activeContactId,
        content: newMessage
      });
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

  return (
    <div className="flex-1 h-screen overflow-hidden bg-[#F5F5F7] flex flex-col">
      <Header title="Messages" />
      
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
                        {currentConversation.length > 0 
                          ? currentConversation[currentConversation.length - 1].content 
                          : 'No messages yet'}
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
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-secondary">
                  <i className="fa-solid fa-phone"></i>
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-secondary">
                  <i className="fa-solid fa-video"></i>
                </Button>
                <Button variant="ghost" size="icon" className="text-gray-500 hover:text-secondary">
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
                onChange={(e) => setNewMessage(e.target.value)}
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
