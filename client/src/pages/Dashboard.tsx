import { useAppContext } from '../context/AppContext';
import Header from '../components/Header';
import RecentNotes from '../components/notes/RecentNotes';
import PomodoroTimer from '../components/timer/PomodoroTimer';
import TodaySchedule from '../components/schedule/TodaySchedule';
import CommunityActivity from '../components/social/CommunityActivity';
import FloatingChat from '../components/chat/FloatingChat';

const Dashboard = () => {
  const { currentUser, todayStudyTime, tasksCompleted, notesToday } = useAppContext();

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#F5F5F7]">
      <Header title="Dashboard" />
      
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <section className="mb-8">
          <div className="glass-card rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1)] p-6 bg-white">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold">Welcome back, {currentUser.name.split(' ')[0]}</h2>
                <p className="text-gray-500 mt-1">Ready to continue your productive day?</p>
              </div>
              <div className="mt-4 md:mt-0">
                <button className="bg-secondary text-white rounded-xl px-5 py-2 font-medium hover:bg-blue-600 transition-apple">
                  Start Studying
                </button>
              </div>
            </div>
            
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-[#F5F5F7] rounded-xl p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-secondary">
                    <i className="fa-solid fa-clock"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Study time today</p>
                    <p className="text-xl font-semibold">
                      {`${Math.floor(todayStudyTime / 60)}h ${todayStudyTime % 60}m`}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#F5F5F7] rounded-xl p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-accent">
                    <i className="fa-solid fa-check"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Tasks completed</p>
                    <p className="text-xl font-semibold">{tasksCompleted}/15</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-[#F5F5F7] rounded-xl p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-purple-500">
                    <i className="fa-solid fa-note-sticky"></i>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-gray-500">Notes created</p>
                    <p className="text-xl font-semibold">{notesToday} today</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <RecentNotes />
          </div>
          
          {/* Right Column */}
          <div className="space-y-6">
            <PomodoroTimer />
            <TodaySchedule />
          </div>
        </div>
        
        <CommunityActivity />
      </div>
      
      <FloatingChat />
    </div>
  );
};

export default Dashboard;
