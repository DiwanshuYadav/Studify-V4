import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { webrtcService } from '@/lib/webrtc';
import { Button } from '@/components/ui/button';

interface VideoCallProps {
  isOpen: boolean;
  onClose: () => void;
  userId: number;
  username: string;
}

const VideoCall = ({ isOpen, onClose, userId, username }: VideoCallProps) => {
  const [callState, setCallState] = useState('idle'); // idle, incoming, calling, connecting, connected, rejected, ended, error
  const [remoteUser, setRemoteUser] = useState({ id: 0, name: '' });
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Set up event listeners
  useEffect(() => {
    const removeCallStateListener = webrtcService.onCallStateChange((state) => {
      setCallState(state);
      
      if (state === 'connected') {
        // Start the call timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
        }
        
        setCallDuration(0);
        timerRef.current = setInterval(() => {
          setCallDuration(prev => prev + 1);
        }, 1000);
      } else if (state === 'ended' || state === 'rejected' || state === 'error') {
        // Stop the call timer
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
        
        // Wait a bit before closing the modal
        setTimeout(() => {
          if (state === 'ended' || state === 'rejected') {
            onClose();
          }
        }, 1500);
      }
    });
    
    const removeRemoteStreamListener = webrtcService.onRemoteStream((stream) => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    });
    
    return () => {
      removeCallStateListener();
      removeRemoteStreamListener();
      
      // Clear timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [onClose]);
  
  // Update local video when component mounts or call state changes
  useEffect(() => {
    const updateLocalVideo = () => {
      const localStream = webrtcService.getLocalStream();
      if (localVideoRef.current && localStream) {
        localVideoRef.current.srcObject = localStream;
      }
    };
    
    updateLocalVideo();
    
    // Update remote user information based on the current session
    const session = webrtcService.getCurrentSession();
    if (session) {
      if (session.callerId === userId) {
        // We are the caller
        setRemoteUser({
          id: session.recipientId,
          name: session.recipientName || 'Unknown'
        });
      } else {
        // We are the recipient
        setRemoteUser({
          id: session.callerId,
          name: session.callerName
        });
      }
    }
  }, [callState, userId]);
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (callState === 'connected' || callState === 'connecting' || callState === 'calling') {
        webrtcService.endCall();
      }
    };
  }, [callState]);
  
  // Handle accept call
  const handleAcceptCall = async () => {
    try {
      const session = webrtcService.getCurrentSession();
      if (session) {
        await webrtcService.acceptCall(session.callerId, session.sessionId);
      }
    } catch (error) {
      console.error('Error accepting call:', error);
    }
  };
  
  // Handle reject call
  const handleRejectCall = () => {
    const session = webrtcService.getCurrentSession();
    if (session) {
      webrtcService.rejectCall(session.callerId, session.sessionId);
    }
  };
  
  // Handle end call
  const handleEndCall = () => {
    webrtcService.endCall();
  };
  
  // Handle toggle mute
  const handleToggleMute = () => {
    const localStream = webrtcService.getLocalStream();
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted;
      });
      setIsMuted(!isMuted);
    }
  };
  
  // Handle toggle video
  const handleToggleVideo = () => {
    const localStream = webrtcService.getLocalStream();
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = isVideoOff;
      });
      setIsVideoOff(!isVideoOff);
    }
  };
  
  // Format call duration as mm:ss
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div 
            className="bg-white dark:bg-[#1D1D1F] rounded-xl shadow-lg overflow-hidden w-full max-w-lg"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative">
              {/* Remote video (full size) */}
              <div className="w-full h-96 bg-black">
                {(callState === 'connected' || callState === 'connecting') ? (
                  <video
                    ref={remoteVideoRef}
                    className="w-full h-full object-cover"
                    autoPlay
                    playsInline
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full p-4 text-center">
                    <div className="w-20 h-20 rounded-full bg-secondary flex items-center justify-center text-white text-2xl mb-4">
                      {remoteUser.name.charAt(0).toUpperCase()}
                    </div>
                    <h3 className="text-white text-lg font-medium mb-2">{remoteUser.name}</h3>
                    
                    {callState === 'calling' && <p className="text-white text-opacity-80">Calling...</p>}
                    {callState === 'incoming' && <p className="text-white text-opacity-80">Incoming call</p>}
                    {callState === 'rejected' && <p className="text-white text-opacity-80">Call rejected</p>}
                    {callState === 'ended' && <p className="text-white text-opacity-80">Call ended</p>}
                    {callState === 'error' && <p className="text-white text-opacity-80">Call failed</p>}
                  </div>
                )}
              </div>
              
              {/* Local video (picture-in-picture) */}
              <div className="absolute bottom-4 right-4 w-32 h-24 rounded-lg overflow-hidden border-2 border-white shadow-md">
                <video
                  ref={localVideoRef}
                  className="w-full h-full object-cover"
                  autoPlay
                  playsInline
                  muted
                />
              </div>
              
              {/* Call duration */}
              {callState === 'connected' && (
                <div className="absolute top-4 left-4 bg-black/50 py-1 px-3 rounded-full text-white text-sm">
                  {formatDuration(callDuration)}
                </div>
              )}
            </div>
            
            {/* Controls */}
            <div className="p-4 bg-white dark:bg-[#1D1D1F]">
              {callState === 'incoming' ? (
                /* Incoming call controls */
                <div className="flex justify-center space-x-4">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 text-white"
                    onClick={handleRejectCall}
                  >
                    <i className="fa-solid fa-phone-slash"></i>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded-full bg-green-500 hover:bg-green-600 text-white"
                    onClick={handleAcceptCall}
                  >
                    <i className="fa-solid fa-phone"></i>
                  </Button>
                </div>
              ) : (
                /* Active call controls */
                <div className="flex justify-center space-x-4">
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`h-12 w-12 rounded-full ${isMuted ? 'bg-gray-500' : 'bg-secondary'} text-white`}
                    onClick={handleToggleMute}
                  >
                    <i className={`fa-solid ${isMuted ? 'fa-microphone-slash' : 'fa-microphone'}`}></i>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 text-white"
                    onClick={handleEndCall}
                  >
                    <i className="fa-solid fa-phone-slash"></i>
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className={`h-12 w-12 rounded-full ${isVideoOff ? 'bg-gray-500' : 'bg-secondary'} text-white`}
                    onClick={handleToggleVideo}
                  >
                    <i className={`fa-solid ${isVideoOff ? 'fa-video-slash' : 'fa-video'}`}></i>
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default VideoCall;