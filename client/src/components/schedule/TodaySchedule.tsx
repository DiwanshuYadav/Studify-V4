import { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

const TodaySchedule = () => {
  const { events, addEvent } = useAppContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    start: '',
    end: '',
    type: 'lecture', // Default value
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewEvent({
      ...newEvent,
      [e.target.name]: e.target.value
    });
  };

  const handleCreateEvent = () => {
    if (newEvent.title.trim() && newEvent.start) {
      addEvent({
        title: newEvent.title,
        start: newEvent.start,
        end: newEvent.end || newEvent.start,
        type: newEvent.type,
      });
      
      setNewEvent({
        title: '',
        start: '',
        end: '',
        type: 'lecture',
      });
      
      setIsCreateModalOpen(false);
    }
  };

  // Sort events by start time
  const sortedEvents = [...events].sort((a, b) => {
    return new Date(a.start).getTime() - new Date(b.start).getTime();
  });

  // Get only today's events
  const today = new Date();
  const todayString = format(today, 'yyyy-MM-dd');
  const todayEvents = sortedEvents.filter(event => {
    const eventDate = format(new Date(event.start), 'yyyy-MM-dd');
    return eventDate === todayString;
  });

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      'lecture': 'border-secondary',
      'studyGroup': 'border-purple-500',
      'assignment': 'border-accent',
      'meeting': 'border-gray-400',
      'exam': 'border-red-500'
    };
    
    return colors[type] || 'border-gray-400';
  };

  const formatEventTime = (start: string, end?: string) => {
    const startTime = format(new Date(start), 'h:mm a');
    if (!end || start === end) {
      return startTime;
    }
    
    const endTime = format(new Date(end), 'h:mm a');
    return `${startTime} - ${endTime}`;
  };

  return (
    <div className="bg-white rounded-xl shadow-[0_4px_6px_rgba(0,0,0,0.1)] p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Today's Schedule</h3>
        <button className="text-secondary text-sm hover:underline">View Calendar</button>
      </div>
      
      <div className="space-y-3">
        {todayEvents.length > 0 ? (
          todayEvents.map((event) => (
            <div 
              key={event.id} 
              className={`p-3 rounded-xl ${event.type === 'lecture' ? 'bg-blue-50' : 'bg-[#F5F5F7]'} border-l-4 ${getEventColor(event.type)}`}
            >
              <p className="text-sm font-medium">{event.title}</p>
              <div className="flex items-center text-xs text-gray-500 mt-1">
                <i className="fa-regular fa-clock mr-1"></i>
                <span>{formatEventTime(event.start, event.end)}</span>
              </div>
            </div>
          ))
        ) : (
          <div className="py-6 text-center text-gray-500">
            <p>No events scheduled for today</p>
          </div>
        )}
      </div>
      
      <button 
        className="w-full mt-4 py-2 border border-[#F5F5F7] rounded-xl text-sm font-medium text-gray-600 hover:bg-[#F5F5F7] transition-apple"
        onClick={() => setIsCreateModalOpen(true)}
      >
        Add Event
      </button>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Add New Event</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Event Title</Label>
              <Input 
                id="title" 
                name="title"
                value={newEvent.title}
                onChange={handleInputChange}
                placeholder="Event title" 
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="type">Event Type</Label>
              <select 
                id="type"
                name="type"
                value={newEvent.type}
                onChange={handleInputChange as any}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="lecture">Lecture</option>
                <option value="studyGroup">Study Group</option>
                <option value="assignment">Assignment</option>
                <option value="meeting">Meeting</option>
                <option value="exam">Exam</option>
              </select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="start">Start Time</Label>
              <Input 
                id="start" 
                name="start"
                type="datetime-local"
                value={newEvent.start}
                onChange={handleInputChange}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="end">End Time (optional)</Label>
              <Input 
                id="end" 
                name="end"
                type="datetime-local"
                value={newEvent.end}
                onChange={handleInputChange}
              />
            </div>
          </div>
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateEvent}>Add Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TodaySchedule;
