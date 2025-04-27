import { useLocation } from "wouter";

type HeaderProps = {
  title: string;
};

const Header = ({ title }: HeaderProps) => {
  return (
    <header className="bg-white sticky top-0 p-4 border-b border-[#F5F5F7] z-10 shadow-sm">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center">
          <h1 className="text-xl font-semibold">{title}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search..." 
              className="px-4 py-2 rounded-full bg-[#F5F5F7] border-none focus:ring-2 focus:ring-secondary focus:outline-none w-48 lg:w-64 transition-apple" 
            />
            <i className="fa-solid fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
          </div>
          <button className="p-2 rounded-full text-gray-500 hover:bg-[#F5F5F7] transition-apple">
            <i className="fa-solid fa-bell"></i>
          </button>
          <button className="p-2 rounded-full text-gray-500 hover:bg-[#F5F5F7] transition-apple">
            <i className="fa-solid fa-cog"></i>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
