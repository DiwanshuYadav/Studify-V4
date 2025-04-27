import { useState, useEffect, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

interface TimerMode {
  name: string;
  label: string;
  duration: number;
  color: string;
}

const PomodoroTimer = () => {
  const { toast } = useToast();
  
  const timerModes: TimerMode[] = [
    { name: 'shortBreak', label: 'Short Break', duration: 5 * 60, color: 'hover:bg-blue-50 hover:text-secondary' },
    { name: 'focus', label: 'Focus', duration: 25 * 60, color: 'bg-blue-50 text-secondary' },
    { name: 'longBreak', label: 'Long Break', duration: 15 * 60, color: 'hover:bg-blue-50 hover:text-secondary' },
  ];
  
  const [activeMode, setActiveMode] = useState<TimerMode>(timerModes[1]);
  const [timeLeft, setTimeLeft] = useState(activeMode.duration);
  const [isActive, setIsActive] = useState(false);
  const [progress, setProgress] = useState(283);
  
  // Using a ref to track timer interval
  const timerRef = useRef<number | null>(null);
  
  // Calculate total circumference of the circle
  const circumference = 2 * Math.PI * 45;
  
  useEffect(() => {
    // Update progress based on time left
    const progressValue = (timeLeft / activeMode.duration) * circumference;
    setProgress(progressValue);
    
    // Clean up interval on unmount
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [timeLeft, activeMode]);
  
  useEffect(() => {
    // Reset timer when changing modes
    setTimeLeft(activeMode.duration);
    setIsActive(false);
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, [activeMode]);
  
  const startTimer = () => {
    if (!isActive) {
      setIsActive(true);
      
      timerRef.current = window.setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timerRef.current!);
            timerRef.current = null;
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
    setActiveMode(mode);
  };
  
  return (
    <div className="bg-white rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1)] p-5">
      <h3 className="text-lg font-semibold mb-4">Pomodoro Timer</h3>
      
      <div className="flex justify-center">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full" viewBox="0 0 100 100">
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
              strokeDashoffset={circumference - progress} 
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold" id="timer-display">{formatTime(timeLeft)}</span>
            <span className="text-sm text-gray-500">{activeMode.label}</span>
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
          className="bg-[#F5F5F7] hover:bg-[#E5E5EA] rounded-full w-12 h-12 flex items-center justify-center transition-apple invisible"
        >
          <i className="fa-solid fa-forward-step text-gray-600"></i>
        </button>
      </div>
      
      <div className="mt-6 grid grid-cols-3 gap-2 text-center">
        {timerModes.map((mode, index) => (
          <div 
            key={mode.name}
            className={`p-2 rounded-xl ${activeMode.name === mode.name ? 'bg-blue-50 text-secondary' : 'bg-[#F5F5F7] ' + mode.color} cursor-pointer transition-apple`}
            onClick={() => handleModeChange(mode)}
          >
            <p className="text-sm font-medium">{mode.label}</p>
            <p className={`text-xs ${activeMode.name === mode.name ? 'text-blue-500' : 'text-gray-500'}`}>
              {mode.duration / 60} min
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default PomodoroTimer;
