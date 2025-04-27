import { useState } from 'react';
import Header from '../components/Header';
import { useAppContext } from '../context/AppContext';
import { Event } from '../lib/types';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

const Schedule = () => {
  const { events, addEvent, updateEvent, deleteEvent } = useAppContext();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [newEvent, setNewEvent] = useState<{
    title: string;
    start: string;
    end: string;
    type: 'lecture' | 'studyGroup' | 'assignment' | 'meeting' | 'exam';
  }>({
    title: '',
    start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
    end: '',
    type: 'lecture',
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (e.target.name === 'type') {
      // Handle type separately with proper type assertion
      const eventType = e.target.value as 'lecture' | 'studyGroup' | 'assignment' | 'meeting' | 'exam';
      setNewEvent({
        ...newEvent,
        type: eventType
      });
    } else {
      setNewEvent({
        ...newEvent,
        [e.target.name]: e.target.value
      });
    }
  };
  
  const handleEditInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    if (selectedEvent) {
      if (e.target.name === 'type') {
        // Handle type separately with proper type assertion
        const eventType = e.target.value as 'lecture' | 'studyGroup' | 'assignment' | 'meeting' | 'exam';
        setSelectedEvent({
          ...selectedEvent,
          type: eventType
        });
      } else {
        setSelectedEvent({
          ...selectedEvent,
          [e.target.name]: e.target.value
        });
      }
    }
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
        start: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
        end: '',
        type: 'lecture',
      });
      
      setIsCreateModalOpen(false);
    }
  };
  
  const handleOpenEditModal = (event: Event) => {
    setSelectedEvent(event);
    setIsEditModalOpen(true);
  };
  
  const handleUpdateEvent = () => {
    if (selectedEvent && selectedEvent.title.trim() && selectedEvent.start) {
      updateEvent(selectedEvent.id, {
        title: selectedEvent.title,
        start: selectedEvent.start,
        end: selectedEvent.end,
        type: selectedEvent.type,
      });
      
      setIsEditModalOpen(false);
      setSelectedEvent(null);
    }
  };

  // Generate the week view
  const generateWeekDays = () => {
    const startDate = startOfWeek(selectedDate, { weekStartsOn: 1 });
    const weekDays = [];
    
    for (let i = 0; i < 7; i++) {
      const day = addDays(startDate, i);
      weekDays.push(day);
    }
    
    return weekDays;
  };

  const getEventsByDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.start);
      return isSameDay(eventDate, day);
    }).sort((a, b) => {
      return new Date(a.start).getTime() - new Date(b.start).getTime();
    });
  };

  const getEventColor = (type: string) => {
    const colors: Record<string, string> = {
      'lecture': 'border-secondary bg-blue-50',
      'studyGroup': 'border-purple-500 bg-purple-50',
      'assignment': 'border-accent bg-green-50',
      'meeting': 'border-gray-400 bg-gray-50',
      'exam': 'border-red-500 bg-red-50'
    };
    
    return colors[type] || 'border-gray-400 bg-gray-50';
  };

  const formatEventTime = (start: string) => {
    return format(new Date(start), 'h:mm a');
  };

  const weekDays = generateWeekDays();

  return (
    <div className="flex-1 h-screen overflow-y-auto bg-[#F5F5F7]">
      <Header title="Schedule" />
      
      <div className="p-4 md:p-6 max-w-7xl mx-auto">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Weekly Calendar</h2>
              
              <div className="flex space-x-2 mt-4 sm:mt-0">
                <Button variant="outline" onClick={() => setSelectedDate(new Date())}>
                  Today
                </Button>
                <Button 
                  className="bg-secondary hover:bg-blue-600"
                  onClick={() => setIsCreateModalOpen(true)}
                >
                  Add Event
                </Button>
              </div>
            </div>
            
            <div className="grid grid-cols-7 gap-3">
              {weekDays.map((day, i) => (
                <div key={i} className="text-center font-medium">
                  <div className="text-sm text-gray-500">{format(day, 'EEE')}</div>
                  <div className={`text-lg mt-1 w-10 h-10 rounded-full mx-auto flex items-center justify-center 
                    ${isSameDay(day, new Date()) ? 'bg-secondary text-white' : ''}`}
                  >
                    {format(day, 'd')}
                  </div>
                </div>
              ))}
            </div>
            
            <div className="grid grid-cols-7 gap-3 mt-3">
              {weekDays.map((day, i) => (
                <div key={`events-${i}`} className="min-h-[200px] border border-[#F5F5F7] rounded-xl p-2 overflow-y-auto">
                  <div className="space-y-2">
                    {getEventsByDay(day).map((event) => (
                      <div 
                        key={event.id} 
                        className={`p-2 rounded-lg border-l-4 text-sm ${getEventColor(event.type)} cursor-pointer hover:shadow-sm transition-all`}
                        onClick={() => handleOpenEditModal(event)}
                      >
                        <div className="font-medium truncate">{event.title}</div>
                        <div className="text-xs text-gray-500">
                          {formatEventTime(event.start)}
                        </div>
                        <div className="flex justify-end mt-1 -mb-1 text-gray-400">
                          <i className="fa-solid fa-pen-to-square text-xs"></i>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
        
        <Card className="mt-6">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4">Upcoming Events</h2>
            
            <div className="space-y-3">
              {events
                .filter(event => new Date(event.start) >= new Date())
                .sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime())
                .slice(0, 5)
                .map((event) => (
                  <div 
                    key={event.id} 
                    className={`p-3 rounded-xl border-l-4 flex justify-between items-center ${getEventColor(event.type)}`}
                  >
                    <div>
                      <div className="font-medium">{event.title}</div>
                      <div className="text-xs text-gray-500">
                        {format(new Date(event.start), 'EEE, MMM d, yyyy')} at {formatEventTime(event.start)}
                      </div>
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                        onClick={() => handleOpenEditModal(event)}
                      >
                        <i className="fa-solid fa-pen-to-square"></i>
                      </button>
                      <button 
                        className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                        onClick={() => deleteEvent(event.id)}
                      >
                        <i className="fa-solid fa-trash"></i>
                      </button>
                    </div>
                  </div>
                ))}
                
                {events.filter(event => new Date(event.start) >= new Date()).length === 0 && (
                  <div className="py-6 text-center text-gray-500">
                    <p>No upcoming events</p>
                  </div>
                )}
            </div>
          </CardContent>
        </Card>
      </div>

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
                onChange={handleInputChange}
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
      
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle className="text-xl">Edit Event</DialogTitle>
          </DialogHeader>
          {selectedEvent && (
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-title">Event Title</Label>
                <Input 
                  id="edit-title" 
                  name="title"
                  value={selectedEvent.title}
                  onChange={handleEditInputChange}
                  placeholder="Event title" 
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-type">Event Type</Label>
                <select 
                  id="edit-type"
                  name="type"
                  value={selectedEvent.type}
                  onChange={handleEditInputChange}
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
                <Label htmlFor="edit-start">Start Time</Label>
                <Input 
                  id="edit-start" 
                  name="start"
                  type="datetime-local"
                  value={selectedEvent.start}
                  onChange={handleEditInputChange}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-end">End Time (optional)</Label>
                <Input 
                  id="edit-end" 
                  name="end"
                  type="datetime-local"
                  value={selectedEvent.end}
                  onChange={handleEditInputChange}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="outline" 
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedEvent(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdateEvent}>Update Event</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Schedule;
