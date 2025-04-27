import { useLocation, Link } from "wouter";
import { useAppContext } from "../context/AppContext";

const Sidebar = () => {
  const [location] = useLocation();
  const { currentUser } = useAppContext();

  const isActive = (path: string) => {
    return location === path;
  };

  return (
    <aside className="w-20 md:w-64 bg-white border-r border-[#F5F5F7] h-full flex flex-col transition-all duration-300 ease-apple overflow-y-auto shadow-sm z-10">
      {/* Logo */}
      <div className="flex items-center justify-center md:justify-start px-5 h-16 border-b border-[#F5F5F7]">
        <div className="flex items-center">
          <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center text-white text-xl font-bold">S</div>
          <span className="ml-3 text-lg font-semibold hidden md:block">Studify</span>
        </div>
      </div>
      
      {/* Navigation */}
      <nav className="flex-1 px-2 py-4 space-y-2">
        <Link href="/">
          <a className={`sidebar-link ${isActive("/") ? "sidebar-link-active" : "sidebar-link-inactive"} mb-1`}>
            <i className="fa-solid fa-home text-lg"></i>
            <span className="ml-3 hidden md:block font-medium">Dashboard</span>
          </a>
        </Link>
        
        <Link href="/notes">
          <a className={`sidebar-link ${isActive("/notes") ? "sidebar-link-active" : "sidebar-link-inactive"} mb-1`}>
            <i className="fa-solid fa-note-sticky text-lg"></i>
            <span className="ml-3 hidden md:block font-medium">Notes</span>
          </a>
        </Link>
        
        <Link href="/timer">
          <a className={`sidebar-link ${isActive("/timer") ? "sidebar-link-active" : "sidebar-link-inactive"} mb-1`}>
            <i className="fa-solid fa-clock text-lg"></i>
            <span className="ml-3 hidden md:block font-medium">Study Timer</span>
          </a>
        </Link>
        
        <Link href="/schedule">
          <a className={`sidebar-link ${isActive("/schedule") ? "sidebar-link-active" : "sidebar-link-inactive"} mb-1`}>
            <i className="fa-solid fa-calendar text-lg"></i>
            <span className="ml-3 hidden md:block font-medium">Schedule</span>
          </a>
        </Link>
        
        <Link href="/community">
          <a className={`sidebar-link ${isActive("/community") ? "sidebar-link-active" : "sidebar-link-inactive"} mb-1`}>
            <i className="fa-solid fa-users text-lg"></i>
            <span className="ml-3 hidden md:block font-medium">Community</span>
          </a>
        </Link>
        
        <Link href="/messages">
          <a className={`sidebar-link ${isActive("/messages") ? "sidebar-link-active" : "sidebar-link-inactive"} mb-1`}>
            <i className="fa-solid fa-comment text-lg"></i>
            <span className="ml-3 hidden md:block font-medium">Messages</span>
            <span className="ml-auto hidden md:flex bg-secondary text-white text-xs rounded-full h-5 min-w-[20px] items-center justify-center px-1">
              {3}
            </span>
          </a>
        </Link>
      </nav>
      
      {/* User Profile */}
      <div className="px-3 py-4 border-t border-[#F5F5F7] mt-auto">
        <div className="flex items-center justify-center md:justify-start">
          <img 
            className="w-10 h-10 rounded-full object-cover" 
            src={currentUser.avatar || "https://images.unsplash.com/photo-1494790108377-be9c29b29330?ixlib=rb-1.2.1&auto=format&fit=crop&w=120&q=80"} 
            alt="Avatar" 
          />
          <div className="ml-3 hidden md:block">
            <p className="text-sm font-medium">{currentUser.name}</p>
            <p className="text-xs text-gray-500">{currentUser.major}</p>
          </div>
          <button className="ml-auto hidden md:block text-gray-400 hover:text-gray-500">
            <i className="fa-solid fa-ellipsis-vertical"></i>
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
