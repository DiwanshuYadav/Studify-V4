import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAppContext } from '@/context/AppContext';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from 'framer-motion';

interface TimerMode {
  name: string;
  label: string;
  duration: number;
  color: string;
}

interface PomodoroTimerProps {
  onSessionComplete?: (totalTime: number) => void;
}

const PomodoroTimer = ({ onSessionComplete }: PomodoroTimerProps) => {
  const { toast } = useToast();
  const { addTask, currentUser } = useAppContext();
  
  // Timer modes with shorter durations for testing
  const timerModes: TimerMode[] = [
    { name: 'shortBreak', label: 'Short Break', duration: 10, color: 'hover:bg-blue-50 hover:text-secondary' },
    { name: 'focus', label: 'Focus', duration: 20, color: 'bg-blue-50 text-secondary' },
    { name: 'longBreak', label: 'Long Break', duration: 15, color: 'hover:bg-blue-50 hover:text-secondary' },
  ];
  
  const [activeMode, setActiveMode] = useState<TimerMode>(timerModes[1]);
  const [timeLeft, setTimeLeft] = useState(activeMode.duration);
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentSession, setCurrentSession] = useState(0);
  const [totalSessionTime, setTotalSessionTime] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [showStartStudying, setShowStartStudying] = useState(true);
  const [notes, setNotes] = useState('');
  const [focusTask, setFocusTask] = useState('');
  const [completedSessions, setCompletedSessions] = useState<Array<{ type: string, duration: number }>>([]);
  
  // Using a ref to track timer interval
  const timerRef = useRef<number | null>(null);
  
  // Calculate total circumference of the circle
  const circumference = 2 * Math.PI * 45;
  
  // When timer updates, calculate progress
  useEffect(() => {
    // Update progress based on time left - reverse the calculation to show correct visual progress
    if (timeLeft !== undefined && activeMode.duration !== undefined) {
      const progressValue = circumference - ((timeLeft / activeMode.duration) * circumference);
      setProgress(progressValue);
    }
  }, [timeLeft, activeMode.duration, circumference]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);
  
  // Reset timer when mode changes
  useEffect(() => {
    resetTimer();
  }, [activeMode]);
  
  // When active mode changes, update the timer
  useEffect(() => {
    // Update the timeLeft when activeMode changes
    if (!isActive) {
      setTimeLeft(activeMode.duration);
    }
  }, [activeMode, isActive]);

  // Handle automatic transition between modes
  useEffect(() => {
    // Only proceed if timer is at 0 and not active
    if (timeLeft === 0 && !isActive) {
      // Record completed session
      if (sessionStartTime) {
        const duration = Math.floor((new Date().getTime() - sessionStartTime.getTime()) / 1000);
        setCompletedSessions(prev => [...prev, { 
          type: activeMode.name, 
          duration: duration
        }]);
        
        // Update total session time
        setTotalSessionTime(prev => prev + duration);
        
        // Reset session start time
        setSessionStartTime(null);
      }

      // Wait a bit to ensure UI updates before changing modes
      const timeoutId = setTimeout(() => {
        if (activeMode.name === 'focus') {
          // After focus, go to short break
          const nextMode = currentSession < 3 
            ? timerModes[0]  // Short break
            : timerModes[2]; // Long break after 4 focus sessions
          
          // Set the next mode
          setActiveMode(nextMode);
          setTimeLeft(nextMode.duration);
          
          // Increment session counter
          setCurrentSession(prev => prev + 1);
          
          // Create a task record if there was a focus task
          if (focusTask.trim()) {
            addTask({
              title: focusTask,
              completed: true,
              dueDate: new Date().toISOString()
            });
            setFocusTask('');
          }
        } else {
          // After break, go back to focus
          const focusMode = timerModes[1];
          setActiveMode(focusMode);
          setTimeLeft(focusMode.duration);
          
          // Check if we should end the entire study session (after 4 focus sessions)
          if (activeMode.name === 'longBreak') {
            // End the study session
            if (onSessionComplete) {
              onSessionComplete(totalSessionTime);
            }
            
            // Show the start studying button again
            setShowStartStudying(true);
            
            // Reset session counter
            setCurrentSession(0);
            
            toast({
              title: "Study Session Complete!",
              description: `Great job! You've completed your study session.`,
              duration: 5000,
            });
          }
        }
      }, 1000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [timeLeft, isActive, activeMode, currentSession, focusTask, onSessionComplete, sessionStartTime, totalSessionTime, timerModes, addTask]);
  
  const startTimer = () => {
    if (!isActive) {
      setIsActive(true);
      
      // Record session start time if not already set
      if (!sessionStartTime) {
        setSessionStartTime(new Date());
      }
      
      // Clear any existing interval
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      
      // Create new interval
      const intervalId = window.setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            // Clear the interval
            clearInterval(intervalId);
            
            setIsActive(false);
            
            // Show toast notification when timer ends
            toast({
              title: "Timer Completed!",
              description: `Your ${activeMode.label.toLowerCase()} session has ended.`,
              duration: 5000,
            });
            
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
      
      // Save reference to the interval
      timerRef.current = intervalId;
    }
  };
  
  const pauseTimer = () => {
    if (isActive && timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
      setIsActive(false);
    } else {
      startTimer();
    }
  };
  
  const resetTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setTimeLeft(activeMode.duration);
    setIsActive(false);
  };
  
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const handleModeChange = (mode: TimerMode) => {
    // Stop any running timer before changing mode
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    
    setIsActive(false);
    setActiveMode(mode);
    setTimeLeft(mode.duration);
  };
  
  const handleStartStudying = () => {
    setShowStartStudying(false);
    setCurrentSession(0);
    setCompletedSessions([]);
    setTotalSessionTime(0);
    
    // Start with focus mode
    handleModeChange(timerModes[1]);
    
    // Auto-start the timer
    setTimeout(() => {
      startTimer();
    }, 500);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1)] p-5">
      <h3 className="text-lg font-semibold mb-4">Pomodoro Timer</h3>
      
      <AnimatePresence>
        {showStartStudying ? (
          <motion.div 
            className="flex flex-col items-center justify-center py-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="w-32 h-32 rounded-full bg-blue-50 flex items-center justify-center mb-4">
              <i className="fa-solid fa-graduation-cap text-secondary text-4xl"></i>
            </div>
            <h3 className="text-lg font-semibold mb-2">Ready to focus?</h3>
            <p className="text-sm text-gray-500 text-center mb-6 max-w-xs">
              The Pomodoro Technique helps you stay focused and productive with timed work sessions and breaks.
            </p>
            
            <div className="mb-4 w-full">
              <label className="text-sm font-medium mb-1 block">What will you focus on?</label>
              <input
                type="text"
                value={focusTask}
                onChange={(e) => setFocusTask(e.target.value)}
                placeholder="Enter your focus task..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary"
              />
            </div>
            
            <Button 
              onClick={handleStartStudying}
              className="bg-secondary hover:bg-blue-600 text-white py-2 px-6 rounded-full transition-apple"
            >
              Start Studying
            </Button>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex justify-center">
              <div className="relative w-48 h-48">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                  {/* Background circle */}
                  <circle 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="#F5F5F7" 
                    strokeWidth="5" 
                  />
                  
                  {/* Progress circle */}
                  <circle 
                    className="timer-knob" 
                    cx="50" 
                    cy="50" 
                    r="45" 
                    fill="none" 
                    stroke="#0A84FF" 
                    strokeWidth="5" 
                    strokeDasharray={circumference} 
                    strokeDashoffset={progress} 
                    strokeLinecap="round"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold" id="timer-display">{formatTime(timeLeft)}</span>
                  <span className="text-sm text-gray-500">{activeMode.label}</span>
                  {focusTask && activeMode.name === 'focus' && (
                    <span className="text-xs text-secondary mt-1 max-w-[120px] truncate">{focusTask}</span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex justify-center space-x-3 mt-6">
              <button 
                className="bg-[#F5F5F7] hover:bg-[#E5E5EA] rounded-full w-12 h-12 flex items-center justify-center transition-apple"
                onClick={resetTimer}
              >
                <i className="fa-solid fa-arrow-rotate-left text-gray-600"></i>
              </button>
              <button 
                className="bg-secondary hover:bg-blue-600 rounded-full w-12 h-12 flex items-center justify-center text-white transition-apple"
                onClick={pauseTimer}
              >
                <i className={`fa-solid ${isActive ? 'fa-pause' : 'fa-play'}`}></i>
              </button>
              <button 
                className="bg-[#F5F5F7] hover:bg-[#E5E5EA] rounded-full w-12 h-12 flex items-center justify-center transition-apple"
                onClick={() => setShowStartStudying(true)}
                title="End Session"
              >
                <i className="fa-solid fa-xmark text-gray-600"></i>
              </button>
            </div>
            
            <div className="mt-6 grid grid-cols-3 gap-2 text-center">
              {timerModes.map((mode) => (
                <div 
                  key={mode.name}
                  className={`p-2 rounded-xl ${activeMode.name === mode.name ? 'bg-blue-50 text-secondary' : 'bg-[#F5F5F7] hover:bg-blue-50 hover:text-secondary'} cursor-pointer transition-apple ${isActive ? 'opacity-50 pointer-events-none' : ''}`}
                  onClick={() => handleModeChange(mode)}
                >
                  <p className="text-sm font-medium">{mode.label}</p>
                  <p className={`text-xs ${activeMode.name === mode.name ? 'text-blue-500' : 'text-gray-500'}`}>
                    {mode.duration / 60} min
                  </p>
                </div>
              ))}
            </div>
            
            <div className="mt-4">
              <div className="text-sm font-medium flex justify-between mb-2">
                <span>Cycle {Math.floor(currentSession / 2) + 1} of 4</span>
                <span>{currentSession > 0 ? `${Math.floor(totalSessionTime / 60)} min total` : ''}</span>
              </div>
              <div className="w-full bg-[#F5F5F7] h-2 rounded-full">
                <div 
                  className="bg-secondary h-2 rounded-full transition-all" 
                  style={{ width: `${Math.min(((Math.floor(currentSession / 2)) / 4) * 100, 100)}%` }}
                ></div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default PomodoroTimer;
