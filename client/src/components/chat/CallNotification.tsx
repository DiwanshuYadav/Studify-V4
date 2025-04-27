import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { webrtcService } from '@/lib/webrtc';
import { VideoCallSession } from '@/lib/types';

interface CallNotificationProps {
  onAccept: () => void;
  onReject: () => void;
}

const CallNotification = ({ onAccept, onReject }: CallNotificationProps) => {
  const [session, setSession] = useState<VideoCallSession | null>(null);
  const [showNotification, setShowNotification] = useState(false);
  const [countdown, setCountdown] = useState(30); // 30 seconds before auto-reject
  
  useEffect(() => {
    const handleCallState = (state: string) => {
      if (state === 'incoming') {
        const currentSession = webrtcService.getCurrentSession();
        if (currentSession) {
          setSession(currentSession);
          setShowNotification(true);
          setCountdown(30);
        }
      } else if (state !== 'incoming' && state !== 'idle') {
        setShowNotification(false);
      }
    };
    
    // Set up listener
    const removeListener = webrtcService.onCallStateChange(handleCallState);
    
    // Check if there's an incoming call right now
    const currentSession = webrtcService.getCurrentSession();
    const currentState = currentSession?.status === 'requesting' ? 'incoming' : 'idle';
    handleCallState(currentState);
    
    return () => {
      removeListener();
    };
  }, []);
  
  // Countdown timer
  useEffect(() => {
    if (!showNotification) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          onReject();
          setShowNotification(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [showNotification, onReject]);
  
  const handleAccept = () => {
    onAccept();
    setShowNotification(false);
  };
  
  const handleReject = () => {
    onReject();
    setShowNotification(false);
  };
  
  if (!session) return null;
  
  return (
    <AnimatePresence>
      {showNotification && (
        <motion.div
          className="fixed top-4 right-4 z-50 w-80"
          initial={{ x: 100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 100, opacity: 0 }}
        >
          <div className="bg-white dark:bg-[#1D1D1F] rounded-xl shadow-lg overflow-hidden">
            <div className="p-4 space-y-4">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center text-white text-xl">
                  {session.callerName.charAt(0).toUpperCase()}
                </div>
                <div className="ml-3">
                  <h3 className="font-medium text-sm">
                    Incoming video call
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400 text-sm">
                    {session.callerName}
                  </p>
                </div>
                
                <div className="ml-auto flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 text-xs">
                  {countdown}
                </div>
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  onClick={handleReject}
                  variant="outline" 
                  className="flex-1 py-1 h-9"
                >
                  Decline
                </Button>
                <Button 
                  onClick={handleAccept}
                  className="flex-1 py-1 h-9 bg-secondary hover:bg-blue-600"
                >
                  Accept
                </Button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CallNotification;