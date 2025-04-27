import { useState, useEffect } from 'react';
import Header from '../components/Header';
import PomodoroTimer from '../components/timer/PomodoroTimer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAppContext } from '@/context/AppContext';
import { format, startOfWeek, addDays, isSameDay, subDays } from 'date-fns';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend,
  PieChart, Pie, Cell
} from 'recharts';
import { TimerSession } from '@/lib/types';

interface StudyDataPoint {
  day: string;
  hours: number;
}

interface SessionDataPoint {
  name: string;
  value: number;
}

const Timer = () => {
  const { timerSessions, createTimerSession } = useAppContext();
  
  const [studyData, setStudyData] = useState<StudyDataPoint[]>([]);
  const [sessionData, setSessionData] = useState<SessionDataPoint[]>([]);
  const [weeklyHours, setWeeklyHours] = useState(0);
  const [totalSessions, setTotalSessions] = useState(0);
  const [dailyAverage, setDailyAverage] = useState(0);
  
  // Process timer session data
  useEffect(() => {
    // Get sessions from the last 7 days
    const now = new Date();
    const oneWeekAgo = subDays(now, 7);
    
    // Filter recent sessions
    const recentSessions = timerSessions.filter(
      (session: TimerSession) => new Date(session.startTime) >= oneWeekAgo
    );
    
    // Calculate total sessions
    setTotalSessions(recentSessions.length);
    
    // Calculate total hours this week
    const totalMinutes = recentSessions.reduce((acc: number, session: TimerSession) => {
      return acc + session.duration / 60; // Convert seconds to minutes
    }, 0);
    
    const totalHours = totalMinutes / 60; // Convert minutes to hours
    setWeeklyHours(parseFloat(totalHours.toFixed(1)));
    
    // Calculate daily average
    const dailyAvg = totalHours / 7;
    setDailyAverage(parseFloat(dailyAvg.toFixed(1)));
    
    // Create weekly data points
    const startOfCurrentWeek = startOfWeek(now);
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    const weeklyDataMap = dayLabels.reduce((acc, day, index) => {
      acc[day] = 0;
      return acc;
    }, {} as Record<string, number>);
    
    // Group sessions by day
    recentSessions.forEach((session: TimerSession) => {
      const sessionDate = new Date(session.startTime);
      const dayOfWeek = format(sessionDate, 'EEE');
      
      // Add hours to the appropriate day
      weeklyDataMap[dayOfWeek] += session.duration / 3600; // Convert seconds to hours
    });
    
    // Format for recharts
    const weeklyData = Object.entries(weeklyDataMap).map(([day, hours]) => ({
      day,
      hours: parseFloat(hours.toFixed(1))
    }));
    
    // Reorder to start with Monday
    const orderedWeeklyData = [
      weeklyData[1], // Mon
      weeklyData[2], // Tue
      weeklyData[3], // Wed
      weeklyData[4], // Thu
      weeklyData[5], // Fri
      weeklyData[6], // Sat
      weeklyData[0]  // Sun
    ];
    
    setStudyData(orderedWeeklyData);
    
    // Create session type distribution data
    const sessionTypes = {
      'focus': 0,
      'shortBreak': 0,
      'longBreak': 0
    };
    
    recentSessions.forEach((session: TimerSession) => {
      if (session.type in sessionTypes) {
        sessionTypes[session.type as keyof typeof sessionTypes] += session.duration;
      }
    });
    
    // Convert to percentage
    const totalTime = Object.values(sessionTypes).reduce((a, b) => a + b, 0);
    const sessionHistoryData = [
      { 
        name: 'Focus', 
        value: totalTime ? Math.round((sessionTypes.focus / totalTime) * 100) : 70
      },
      { 
        name: 'Short Break', 
        value: totalTime ? Math.round((sessionTypes.shortBreak / totalTime) * 100) : 20
      },
      { 
        name: 'Long Break', 
        value: totalTime ? Math.round((sessionTypes.longBreak / totalTime) * 100) : 10
      }
    ];
    
    setSessionData(sessionHistoryData);
  }, [timerSessions]);
  
  // Handle session completion
  const handleSessionComplete = (totalTime: number) => {
    // Create a timer session record
    createTimerSession({
      type: 'focus',
      duration: totalTime,
      completed: true,
      startTime: new Date(Date.now() - totalTime * 1000).toISOString(),
      endTime: new Date().toISOString()
    });
  };
  
  // Color palette for pie chart
  const COLORS = ['#0A84FF', '#34C759', '#AF52DE'];

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#F5F5F7]">
      <Header title="Study Timer" />
      
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left side - Timer */}
          <div>
            <PomodoroTimer onSessionComplete={handleSessionComplete} />
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Session Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={sessionData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={2}
                        dataKey="value"
                        label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                      >
                        {sessionData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => `${value}%`} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Right side - Analytics */}
          <div className="md:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Weekly Study Hours</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={studyData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`${value} hours`, 'Study Time']} />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="hours"
                        name="Study Time"
                        stroke="#0A84FF"
                        activeDot={{ r: 8 }}
                        strokeWidth={2}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-secondary">{weeklyHours}</div>
                    <p className="text-sm text-gray-500 mt-1">Hours This Week</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-500">{totalSessions}</div>
                    <p className="text-sm text-gray-500 mt-1">Sessions Completed</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-accent">{dailyAverage}</div>
                    <p className="text-sm text-gray-500 mt-1">Daily Average (h)</p>
                  </div>
                </CardContent>
              </Card>
            </div>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Focus Tips</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-secondary mr-3">
                      <i className="fa-solid fa-lightbulb"></i>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Remove distractions</h3>
                      <p className="text-xs text-gray-500">Put your phone away and close unnecessary browser tabs.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-500 mr-3">
                      <i className="fa-solid fa-brain"></i>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Take regular breaks</h3>
                      <p className="text-xs text-gray-500">Short breaks between study sessions help maintain focus.</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-accent mr-3">
                      <i className="fa-solid fa-list-check"></i>
                    </div>
                    <div>
                      <h3 className="text-sm font-medium">Break tasks into smaller chunks</h3>
                      <p className="text-xs text-gray-500">Tackle one small task at a time for better productivity.</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Timer;
