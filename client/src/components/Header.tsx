import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAppContext } from "../context/AppContext";
import { Note, Event, Task, User, Notification } from "../lib/types";
import SettingsModal from "./settings/SettingsModal";
import { useToast } from '@/hooks/use-toast';

type HeaderProps = {
  title: string;
};

type SearchResult = {
  type: 'note' | 'event' | 'task' | 'user';
  id: number;
  title: string;
  subtitle?: string;
  icon?: string;
};

interface NotificationItem {
  id: number;
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const Header: React.FC<HeaderProps> = ({ title }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: 1,
      title: "Assignment Due",
      message: "Your Physics assignment is due in 2 hours",
      time: "2 hours ago",
      read: false
    },
    {
      id: 2,
      title: "Study Group Update",
      message: "Machine Learning group meeting changed to 5 PM",
      time: "4 hours ago",
      read: false
    },
    {
      id: 3,
      title: "New Message",
      message: "Alex Chen sent you a message",
      time: "Yesterday",
      read: true
    }
  ]);
  
  const { notes, events, tasks, currentUser } = useAppContext();
  const { toast } = useToast();
  const searchRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  const [location, navigate] = useLocation();
  
  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
        setShowSettings(false);
      }
    };
    
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  
  // Search functionality
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    
    const query = searchQuery.toLowerCase();
    const results: SearchResult[] = [];
    
    // Search notes
    notes.forEach(note => {
      if (note.title.toLowerCase().includes(query) || note.content.toLowerCase().includes(query)) {
        results.push({
          type: 'note',
          id: note.id,
          title: note.title,
          subtitle: note.subject,
          icon: 'fa-note-sticky'
        });
      }
    });
    
    // Search events
    events.forEach(event => {
      if (event.title.toLowerCase().includes(query)) {
        results.push({
          type: 'event',
          id: event.id,
          title: event.title,
          subtitle: new Date(event.start).toLocaleDateString(),
          icon: 'fa-calendar'
        });
      }
    });
    
    // Search tasks
    tasks.forEach(task => {
      if (task.title.toLowerCase().includes(query) || 
          (task.description && task.description.toLowerCase().includes(query))) {
        results.push({
          type: 'task',
          id: task.id,
          title: task.title,
          subtitle: task.completed ? 'Completed' : 'In Progress',
          icon: 'fa-check'
        });
      }
    });
    
    setSearchResults(results.slice(0, 5)); // Limit to 5 results
  }, [searchQuery, notes, events, tasks]);
  
  const handleSearchItemClick = (result: SearchResult) => {
    setShowSearchResults(false);
    
    // Navigate to the appropriate page based on result type
    switch(result.type) {
      case 'note':
        navigate(`/notes?id=${result.id}`);
        break;
      case 'event':
        navigate(`/schedule?id=${result.id}`);
        break;
      case 'task':
        navigate(`/?task=${result.id}`);
        break;
      case 'user':
        navigate(`/profile/${result.id}`);
        break;
    }
  };
  
  const markAllNotificationsAsRead = () => {
    setNotifications(prev => prev.map(notification => ({
      ...notification,
      read: true
    })));
  };
  
  const unreadNotificationsCount = notifications.filter(n => !n.read).length;

  return (
    <>
      <SettingsModal 
        open={showSettingsModal} 
        onOpenChange={setShowSettingsModal} 
      />
      
      <header className="bg-white sticky top-0 p-4 border-b border-[#F5F5F7] z-20 shadow-sm">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold">{title}</h1>
          </div>
          <div className="flex items-center space-x-4">
            {/* Search */}
            <div className="relative" ref={searchRef}>
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Search notes, events, tasks..." 
                  className="px-4 py-2 rounded-full bg-[#F5F5F7] border-none focus:ring-2 focus:ring-secondary focus:outline-none w-48 lg:w-64 transition-apple" 
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    setShowSearchResults(true);
                  }}
                  onFocus={() => setShowSearchResults(true)}
                />
                <i className="fa-solid fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
              </div>
              
              {/* Search Results Dropdown */}
              {showSearchResults && searchResults.length > 0 && (
                <div className="absolute top-full mt-2 right-0 w-72 bg-white rounded-xl shadow-lg overflow-hidden z-30">
                  <div className="p-2">
                    <div className="text-sm font-medium text-gray-400 px-3 py-2">Search Results</div>
                    <div className="space-y-1">
                      {searchResults.map(result => (
                        <div 
                          key={`${result.type}-${result.id}`}
                          className="flex items-center p-2 rounded-lg hover:bg-[#F5F5F7] cursor-pointer"
                          onClick={() => handleSearchItemClick(result)}
                        >
                          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mr-3">
                            <i className={`fa-solid ${result.icon || 'fa-file'} text-secondary`}></i>
                          </div>
                          <div>
                            <div className="text-sm font-medium">{result.title}</div>
                            {result.subtitle && (
                              <div className="text-xs text-gray-500">{result.subtitle}</div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Notifications */}
            <div className="relative" ref={notificationsRef}>
              <button 
                className="p-2 rounded-full text-gray-500 hover:bg-[#F5F5F7] transition-apple relative"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <i className="fa-solid fa-bell"></i>
                {unreadNotificationsCount > 0 && (
                  <span className="absolute top-0 right-0 transform translate-x-1/4 -translate-y-1/4 bg-red-500 text-white text-xs rounded-full h-4 min-w-[16px] flex items-center justify-center px-1">
                    {unreadNotificationsCount}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {showNotifications && (
                <div className="absolute top-full mt-2 right-0 w-80 bg-white rounded-xl shadow-lg overflow-hidden z-30">
                  <div className="p-3 bg-white">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div className="text-sm font-medium">Notifications</div>
                      {unreadNotificationsCount > 0 && (
                        <button 
                          className="text-xs text-secondary hover:text-blue-700"
                          onClick={markAllNotificationsAsRead}
                        >
                          Mark all as read
                        </button>
                      )}
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-4 text-center text-gray-500">No notifications</div>
                      ) : (
                        <div className="space-y-2 mt-2">
                          {notifications.map((notification) => (
                            <div 
                              key={notification.id}
                              className={`p-2 rounded-lg hover:bg-[#F5F5F7] cursor-pointer transition-all ${!notification.read ? 'bg-blue-50' : ''}`}
                              onClick={() => {
                                // Update unread notification count
                                if (!notification.read) {
                                  setUnreadNotificationsCount(prev => Math.max(0, prev - 1));
                                }
                                
                                // Mark notification as read
                                setNotifications(prev => 
                                  prev.map(n => n.id === notification.id ? {...n, read: true} : n)
                                );
                              }}
                            >
                              <div className="flex justify-between">
                                <div className="font-medium text-sm">{notification.title}</div>
                                <div className="text-xs text-gray-500">{notification.time}</div>
                              </div>
                              <div className="text-xs text-gray-600 mt-1">{notification.message}</div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            {/* Settings */}
            <div className="relative" ref={settingsRef}>
              <button 
                className="p-2 rounded-full text-gray-500 hover:bg-[#F5F5F7] transition-apple"
                onClick={() => setShowSettings(!showSettings)}
              >
                <i className="fa-solid fa-cog"></i>
              </button>
              
              {/* Settings Dropdown */}
              {showSettings && (
                <div className="absolute top-full mt-2 right-0 w-48 bg-white rounded-xl shadow-lg overflow-hidden z-30">
                  <div className="py-2">
                    <button 
                      className="w-full text-left px-4 py-2 hover:bg-[#F5F5F7] text-sm transition-apple flex items-center"
                      onClick={() => {
                        setShowSettings(false);
                        navigate('/profile');
                      }}
                    >
                      <i className="fa-solid fa-user mr-2"></i> Profile
                    </button>
                    <button 
                      className="w-full text-left px-4 py-2 hover:bg-[#F5F5F7] text-sm transition-apple flex items-center"
                      onClick={() => {
                        setShowSettings(false);
                        setShowSettingsModal(true);
                      }}
                    >
                      <i className="fa-solid fa-cog mr-2"></i> All Settings
                    </button>
                    <button 
                      className="w-full text-left px-4 py-2 hover:bg-[#F5F5F7] text-sm text-red-500 transition-apple flex items-center"
                      onClick={() => {
                        // Handle logout
                        localStorage.removeItem('currentUser');
                        localStorage.removeItem('authToken');
                        toast({
                          title: "Logged out successfully",
                          description: "You have been logged out of your account.",
                        });
                        // Navigate to login page
                        window.location.href = '/login';
                      }}
                    >
                      <i className="fa-solid fa-sign-out-alt mr-2"></i> Logout
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;
