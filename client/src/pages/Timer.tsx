import { useState, useEffect } from 'react';
import Header from '../components/Header';
import PomodoroTimer from '../components/timer/PomodoroTimer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, BarChart, Bar, Legend
} from 'recharts';

const Timer = () => {
  const [studyData, setStudyData] = useState<any[]>([]);
  const [sessionData, setSessionData] = useState<any[]>([]);
  
  useEffect(() => {
    // Sample data for the charts
    const weeklyData = [
      { day: 'Mon', hours: 2.5 },
      { day: 'Tue', hours: 3.7 },
      { day: 'Wed', hours: 1.8 },
      { day: 'Thu', hours: 4.2 },
      { day: 'Fri', hours: 2.8 },
      { day: 'Sat', hours: 5.1 },
      { day: 'Sun', hours: 3.3 },
    ];
    
    const sessionHistory = [
      { name: 'Focus', value: 75 },
      { name: 'Short Break', value: 15 },
      { name: 'Long Break', value: 10 },
    ];
    
    setStudyData(weeklyData);
    setSessionData(sessionHistory);
  }, []);

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#F5F5F7]">
      <Header title="Study Timer" />
      
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Left side - Timer */}
          <div>
            <PomodoroTimer />
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-lg">Session History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-60">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={sessionData}
                      margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="value" fill="#0A84FF" radius={[4, 4, 0, 0]} />
                    </BarChart>
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
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="hours"
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
                    <div className="text-4xl font-bold text-secondary">23.4</div>
                    <p className="text-sm text-gray-500 mt-1">Hours This Week</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-purple-500">32</div>
                    <p className="text-sm text-gray-500 mt-1">Sessions Completed</p>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center">
                    <div className="text-4xl font-bold text-accent">4.2</div>
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
